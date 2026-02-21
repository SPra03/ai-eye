import * as vscode from 'vscode';
import { ConfigManager } from '../config/ConfigManager';
import { PreviewMessage } from '../types';

/**
 * Manages the webview panel for live preview
 */
export class PreviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private devServerUrl: string = '';
  private messageHandlers: Map<number, (result: any) => void> = new Map();
  private nextMessageId: number = 1;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Open the preview panel
   */
  async openPreview(): Promise<void> {
    this.devServerUrl = await ConfigManager.getDevServerUrl();

    // Check if dev server is accessible
    const isAccessible = await ConfigManager.validateDevServer(this.devServerUrl);
    if (!isAccessible) {
      const action = await vscode.window.showWarningMessage(
        `Dev server at ${this.devServerUrl} is not accessible. Please start your dev server first.`,
        'Open Settings',
        'Retry',
        'Continue Anyway'
      );

      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'visioncraft.devServerUrl');
        return;
      } else if (action === 'Retry') {
        return this.openPreview();
      }
      // Continue anyway if user chooses
    }

    // Create or show existing panel
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'visioncraft.preview',
      'VisionCraft Preview',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.context.extensionUri],
        portMapping: this.getPortMappings(),
      }
    );

    // Set webview content
    this.panel.webview.html = this.getWebviewContent();

    // Setup message handling
    this.setupMessageHandling();

    // Handle panel disposal
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.messageHandlers.clear();
      },
      null,
      this.disposables
    );

    vscode.window.showInformationMessage('VisionCraft Preview opened!');
  }

  /**
   * Setup bi-directional message handling
   */
  private setupMessageHandling(): void {
    if (!this.panel) return;

    this.panel.webview.onDidReceiveMessage(
      async (message: PreviewMessage) => {
        switch (message.type) {
          case 'ready':
            // Webview is ready
            console.log('Webview ready');
            break;

          case 'evalResult':
            // Handle evaluation result from bridge
            if (message.id && this.messageHandlers.has(message.id)) {
              const handler = this.messageHandlers.get(message.id);
              handler?.(message.result);
              this.messageHandlers.delete(message.id);
            }
            break;

          case 'fromPreview':
            // Message relayed from iframe
            console.log('Message from preview:', message.data);
            break;

          case 'navigate':
            // User changed URL
            if (typeof message.data === 'string') {
              this.devServerUrl = message.data;
              await ConfigManager.updateConfig('devServerUrl', message.data);
            }
            break;

          case 'reload':
            // Reload requested
            this.reload();
            break;

          case 'toggleInspect':
            // Inspect mode toggled
            vscode.window.showInformationMessage('Inspect mode (coming in Phase 4)');
            break;

          case 'log':
            // Log message from webview
            console.log('[Webview]', message.data);
            break;

          case 'error':
            // Error from webview
            console.error('[Webview Error]', message.data);
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * Send a message to the webview
   */
  private postMessage(message: PreviewMessage): void {
    this.panel?.webview.postMessage(message);
  }

  /**
   * Evaluate code in the bridge context (via webview relay)
   */
  async evaluate(code: string, timeout: number = 5000): Promise<any> {
    if (!this.panel) {
      throw new Error('Preview panel is not open');
    }

    return new Promise((resolve, reject) => {
      const id = this.nextMessageId++;

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error(`Evaluation timeout after ${timeout}ms`));
      }, timeout);

      // Setup response handler
      this.messageHandlers.set(id, (result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      });

      // Send evaluation request
      this.postMessage({
        type: 'evaluate',
        id,
        code,
      });
    });
  }

  /**
   * Reload the preview iframe
   */
  reload(): void {
    this.postMessage({ type: 'reload' });
  }

  /**
   * Navigate to a new URL
   */
  async navigate(url: string): Promise<void> {
    this.devServerUrl = url;
    this.postMessage({ type: 'navigate', data: url });
  }

  /**
   * Get port mappings for common dev servers
   */
  private getPortMappings(): vscode.WebviewPortMapping[] {
    const commonPorts = [3000, 4200, 5173, 5174, 5175, 5176, 8080, 8000, 9222];
    return commonPorts.map((port) => ({
      webviewPort: port,
      extensionHostPort: port,
    }));
  }

  /**
   * Get webview HTML content with toolbar and iframe
   */
  private getWebviewContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}';
    style-src 'unsafe-inline';
    frame-src http: https: http://localhost:* https://localhost:*;
    connect-src http: https:;
  ">
  <title>VisionCraft Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      overflow: hidden;
      height: 100vh;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
    }

    #toolbar {
      height: 36px;
      background: var(--vscode-sideBar-background);
      display: flex;
      align-items: center;
      padding: 0 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      gap: 8px;
    }

    .toolbar-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      padding: 4px 12px;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      transition: background 0.2s;
    }

    .toolbar-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .toolbar-btn:active {
      opacity: 0.8;
    }

    #url-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    #url-bar {
      flex: 1;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      outline: none;
    }

    #url-bar:focus {
      border-color: var(--vscode-focusBorder);
    }

    #status {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    #status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--vscode-terminal-ansiGreen);
    }

    #status-indicator.loading {
      background: var(--vscode-terminal-ansiYellow);
      animation: pulse 1s infinite;
    }

    #status-indicator.error {
      background: var(--vscode-terminal-ansiRed);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    #preview-frame {
      width: 100%;
      border: none;
      height: calc(100vh - 36px);
      background: white;
    }

    #error-overlay {
      display: none;
      position: absolute;
      top: 36px;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--vscode-editor-background);
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
      padding: 32px;
      text-align: center;
    }

    #error-overlay.show {
      display: flex;
    }

    .error-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    .error-message {
      font-size: 14px;
      color: var(--vscode-errorForeground);
    }

    .error-details {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      max-width: 600px;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <button class="toolbar-btn" id="btn-back" title="Go back">←</button>
    <button class="toolbar-btn" id="btn-forward" title="Go forward">→</button>
    <button class="toolbar-btn" id="btn-reload" title="Reload">⟳</button>

    <div id="url-bar-container">
      <input
        id="url-bar"
        type="text"
        value="${this.devServerUrl}"
        placeholder="Enter dev server URL..."
        spellcheck="false"
      />
    </div>

    <button class="toolbar-btn" id="btn-inspect" title="Inspect element">🔍</button>

    <div id="status">
      <div id="status-indicator"></div>
      <span id="status-text">Ready</span>
    </div>
  </div>

  <iframe
    id="preview-frame"
    src="${this.devServerUrl}"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
  ></iframe>

  <div id="error-overlay">
    <div class="error-icon">⚠️</div>
    <div class="error-message" id="error-message">Failed to load preview</div>
    <div class="error-details" id="error-details">Check that your dev server is running</div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const frame = document.getElementById('preview-frame');
    const urlBar = document.getElementById('url-bar');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    const errorDetails = document.getElementById('error-details');

    // Track loading state
    let isLoading = false;

    // Notify extension that webview is ready
    console.log('VisionCraft webview script loaded!');
    vscode.postMessage({ type: 'ready' });

    // ---- Toolbar Actions ----

    document.getElementById('btn-back').addEventListener('click', () => {
      try {
        frame.contentWindow.history.back();
      } catch (e) {
        console.error('Cannot go back:', e);
      }
    });

    document.getElementById('btn-forward').addEventListener('click', () => {
      try {
        frame.contentWindow.history.forward();
      } catch (e) {
        console.error('Cannot go forward:', e);
      }
    });

    document.getElementById('btn-reload').addEventListener('click', () => {
      reloadFrame();
    });

    document.getElementById('btn-inspect').addEventListener('click', () => {
      vscode.postMessage({ type: 'toggleInspect' });
    });

    urlBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let url = urlBar.value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url;
        }
        navigateToUrl(url);
      }
    });

    // ---- Frame Management ----

    function reloadFrame() {
      setStatus('loading', 'Reloading...');
      errorOverlay.classList.remove('show');
      frame.contentWindow.location.reload();
    }

    function navigateToUrl(url) {
      setStatus('loading', 'Loading...');
      errorOverlay.classList.remove('show');
      frame.src = url;
      urlBar.value = url;
      vscode.postMessage({ type: 'navigate', data: url });
    }

    function setStatus(state, text) {
      statusText.textContent = text;
      statusIndicator.className = state;
    }

    function showError(message, details) {
      errorMessage.textContent = message;
      errorDetails.textContent = details;
      errorOverlay.classList.add('show');
      setStatus('error', 'Error');
    }

    // ---- Frame Events ----

    frame.addEventListener('load', () => {
      setStatus('connected', 'Connected');
      isLoading = false;

      // Try to inject bridge script (will be implemented in Phase 4)
      try {
        // This is a placeholder - actual injection happens via Vite plugin
        vscode.postMessage({
          type: 'log',
          data: 'Frame loaded successfully'
        });
      } catch (e) {
        console.error('Frame load error:', e);
      }
    });

    frame.addEventListener('error', (e) => {
      showError(
        'Failed to load preview',
        'Make sure your dev server is running at ' + urlBar.value
      );
    });

    // ---- Message Bridge ----

    // Relay messages from iframe to extension
    window.addEventListener('message', (e) => {
      if (e.source === frame.contentWindow) {
        vscode.postMessage({
          type: 'fromPreview',
          data: e.data
        });
      }
    });

    // Track pending iframe eval requests
    const pendingIframeRequests = new Map();

    // Handle responses from iframe
    window.addEventListener('message', (e) => {
      // Check if this is a response from the iframe's VisionCraft bridge
      if (e.source === frame.contentWindow && e.data?.type === 'visioncraft:response') {
        const { id, result, error } = e.data;

        if (pendingIframeRequests.has(id)) {
          const { resolve, reject } = pendingIframeRequests.get(id);
          pendingIframeRequests.delete(id);

          if (error) {
            reject(new Error(error));
          } else {
            resolve(result);
          }
        }
      }
    });

    // Handle messages from extension
    window.addEventListener('message', async (e) => {
      const message = e.data;
      console.log('Webview received message:', message.type, message);

      switch (message.type) {
        case 'evaluate':
          // Forward eval to iframe via postMessage
          try {
            console.log('Forwarding eval to iframe:', message.code);

            // Create a promise that will be resolved when iframe responds
            const resultPromise = new Promise((resolve, reject) => {
              pendingIframeRequests.set(message.id, { resolve, reject });

              // Set timeout
              setTimeout(() => {
                if (pendingIframeRequests.has(message.id)) {
                  pendingIframeRequests.delete(message.id);
                  reject(new Error('Iframe eval timeout'));
                }
              }, 5000);
            });

            // Send message to iframe
            frame.contentWindow.postMessage({
              type: 'visioncraft:eval',
              id: message.id,
              code: message.code
            }, '*');

            // Wait for response
            const result = await resultPromise;
            console.log('Eval result from iframe:', result);

            vscode.postMessage({
              type: 'evalResult',
              id: message.id,
              result: result
            });
          } catch (error) {
            console.error('Eval error:', error);
            vscode.postMessage({
              type: 'evalResult',
              id: message.id,
              error: error.message || String(error)
            });
          }
          break;

        case 'reload':
          reloadFrame();
          break;

        case 'navigate':
          navigateToUrl(message.data);
          break;
      }
    });

    // ---- Initial Status ----
    setStatus('loading', 'Loading...');
  </script>
</body>
</html>`;
  }

  /**
   * Generate a nonce for CSP
   */
  private getNonce(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return nonce;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.messageHandlers.clear();
  }
}
