/**
 * HTTP Bridge for MCP Server
 * Exposes EmbeddedMCPServer over HTTP so external MCP server can communicate with it
 * This enables the standalone MCP server to use the embedded webview instead of Playwright
 */

import * as http from 'http';
import { EmbeddedMCPServer } from './EmbeddedMCPServer';
import { PreviewManager } from '../preview/PreviewManager';

interface HttpBridgeRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

interface HttpBridgeResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * HTTP server that bridges external MCP server to embedded MCP server
 */
export class HttpBridge {
  private server: http.Server | undefined;
  private port: number = 0;
  private isRunning: boolean = false;

  constructor(
    private embeddedMCPServer: EmbeddedMCPServer,
    private previewManager: PreviewManager
  ) {}

  /**
   * Start the HTTP server on a random available port
   * Returns the port number
   */
  async start(): Promise<number> {
    if (this.isRunning) {
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        await this.handleRequest(req, res);
      });

      // Listen on random available port (localhost only)
      this.server.listen(0, 'localhost', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          this.isRunning = true;
          console.log(`[HttpBridge] Started on http://localhost:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      this.server.on('error', (error) => {
        console.error('[HttpBridge] Server error:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (!this.server || !this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        console.log('[HttpBridge] Stopped');
        resolve();
      });
    });
  }

  /**
   * Get the current port number
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Check if server is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Only allow localhost
    const remoteAddress = req.socket.remoteAddress;
    if (remoteAddress && !remoteAddress.includes('127.0.0.1') && !remoteAddress.includes('::1')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 403, message: 'Forbidden' } }));
      return;
    }

    // Set CORS headers for localhost
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle GET /health
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', port: this.port }));
      return;
    }

    // Handle POST /tools/list
    if (req.method === 'POST' && req.url === '/tools/list') {
      try {
        const tools = this.embeddedMCPServer.getTools();
        const response: HttpBridgeResponse = { result: { tools } };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        this.sendError(res, 500, error instanceof Error ? error.message : 'Internal error');
      }
      return;
    }

    // Handle POST /tools/call
    if (req.method === 'POST' && req.url === '/tools/call') {
      await this.handleToolCall(req, res);
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 404, message: 'Not found' } }));
  }

  /**
   * Handle tool call requests
   */
  private async handleToolCall(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Read request body
      const body = await this.readRequestBody(req);

      // Parse JSON with error handling
      let request: HttpBridgeRequest;
      try {
        request = JSON.parse(body);
      } catch (error) {
        this.sendError(res, 400, 'Invalid JSON in request body');
        return;
      }

      // Ensure preview is open and ready before processing tool calls
      await this.ensurePreviewReady();

      // Get WebviewBridge directly
      const webviewBridge = this.embeddedMCPServer.getWebviewBridge();

      // Map tool name to WebviewBridge method and call it
      const toolName = request.params?.name || '';
      const args = request.params?.arguments || {};

      let result: any;

      switch (toolName) {
        case 'visioncraft_screenshot':
          result = await webviewBridge.captureScreenshot(
            (args.format as 'jpeg' | 'png') || 'jpeg',
            (args.quality as number) || 80
          );
          break;

        case 'visioncraft_navigate':
          await webviewBridge.navigate(args.url as string);
          result = { success: true };
          break;

        case 'visioncraft_get_current_url':
          result = await webviewBridge.getCurrentUrl();
          break;

        case 'visioncraft_find_elements':
          result = await webviewBridge.findElements(
            args.query as string,
            (args.mode as 'css' | 'xpath' | 'text') || 'css'
          );
          break;

        case 'visioncraft_inspect_element':
          result = await webviewBridge.inspectElement(args.selector as string);
          break;

        case 'visioncraft_click':
          await webviewBridge.clickElement(args.selector as string);
          result = { success: true };
          break;

        case 'visioncraft_type':
          await webviewBridge.typeText(args.selector as string, args.text as string);
          result = { success: true };
          break;

        case 'visioncraft_hover':
          await webviewBridge.hoverElement(args.selector as string);
          result = { success: true };
          break;

        case 'visioncraft_scroll':
          await webviewBridge.scrollTo((args.x as number) || 0, (args.y as number) || 0);
          result = { success: true };
          break;

        case 'visioncraft_get_source':
          result = await webviewBridge.getElementSource(args.selector as string);
          break;

        case 'visioncraft_get_structure':
          result = await webviewBridge.getPageStructure();
          break;

        case 'visioncraft_get_console_logs':
          result = await webviewBridge.getConsoleLogs();
          break;

        case 'visioncraft_clear_console_logs':
          await webviewBridge.clearConsoleLogs();
          result = { success: true };
          break;

        case 'visioncraft_get_hmr_status':
          result = await webviewBridge.getHMRStatus();
          break;

        case 'visioncraft_clear_hmr_errors':
          await webviewBridge.clearHMRErrors();
          result = { success: true };
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      // Send response with raw result
      const response: HttpBridgeResponse = { result };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      console.error('[HttpBridge] Tool call error:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : 'Tool call failed');
    }
  }

  /**
   * Ensure preview is open and ready before processing requests
   */
  private async ensurePreviewReady(): Promise<void> {
    try {
      const bridgeReady = await this.embeddedMCPServer.getWebviewBridge().isBridgeAvailable();
      if (bridgeReady) return;

      console.log('[HttpBridge] Opening preview...');
      await this.previewManager.openPreview(true); // silent mode

      // Wait for bridge to be available (not just window)
      const startTime = Date.now();
      const timeout = 15000;
      while (Date.now() - startTime < timeout) {
        if (await this.embeddedMCPServer.getWebviewBridge().isBridgeAvailable()) {
          console.log('[HttpBridge] Bridge ready');
          return;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      throw new Error('Bridge did not become available within timeout');
    } catch (error) {
      throw new Error('Failed to open preview: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Read HTTP request body with size limit
   */
  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      let size = 0;
      const maxSize = 10 * 1024 * 1024; // 10MB limit

      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxSize) {
          reject(new Error('Request body too large (max 10MB)'));
          req.destroy();
          return;
        }
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Send error response
   */
  private sendError(res: http.ServerResponse, code: number, message: string): void {
    const response: HttpBridgeResponse = {
      error: { code, message },
    };
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  }
}
