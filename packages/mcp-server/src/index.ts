/**
 * VisionCraft MCP Server
 * Exposes browser automation and inspection tools to AI agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { getBrowserClient } from './browser-client.js';
import { WebviewClient } from './webview-client.js';
import { z } from 'zod';

// Tool schemas
const tools: Tool[] = [
  {
    name: 'visioncraft_screenshot',
    description: 'Capture a screenshot of the current page. Returns a base64-encoded image data URL.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['jpeg', 'png'],
          description: 'Image format (default: jpeg)',
          default: 'jpeg'
        },
        quality: {
          type: 'number',
          description: 'JPEG quality 0-100 (default: 80)',
          minimum: 0,
          maximum: 100,
          default: 80
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_inspect_element',
    description: 'Inspect an element and get detailed information including source location, styles, and bounding box. Use CSS selectors to target elements.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to inspect (e.g., "button.primary", "#submit-btn")'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'visioncraft_get_source',
    description: 'Get the source file location for an element. Returns the file path, line number, and column number where the element is defined in the source code.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'visioncraft_click',
    description: 'Click an element on the page. Use CSS selectors to target the element.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to click'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'visioncraft_type',
    description: 'Type text into an input or textarea element. Triggers input and change events.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the input element'
        },
        text: {
          type: 'string',
          description: 'Text to type into the element'
        }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'visioncraft_scroll',
    description: 'Scroll the page to specific coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Horizontal scroll position',
          default: 0
        },
        y: {
          type: 'number',
          description: 'Vertical scroll position'
        }
      },
      required: ['y']
    }
  },
  {
    name: 'visioncraft_find_elements',
    description: 'Find elements on the page by text content, ARIA role, or CSS selector. Returns an array of matching elements with their selectors and source locations.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (text content, role name, or CSS selector)'
        },
        mode: {
          type: 'string',
          enum: ['text', 'role', 'css'],
          description: 'Search mode: "text" for text content, "role" for ARIA role, "css" for CSS selector',
          default: 'css'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'visioncraft_get_structure',
    description: 'Get the page structure as a tree of elements with source mapping information. Useful for understanding the DOM hierarchy.',
    inputSchema: {
      type: 'object',
      properties: {
        maxDepth: {
          type: 'number',
          description: 'Maximum depth to traverse (default: 5)',
          default: 5,
          minimum: 1,
          maximum: 10
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_get_console_logs',
    description: 'Get captured console logs from the page. Can filter by level (log, warn, error, info) and limit the number of results.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['log', 'warn', 'error', 'info'],
          description: 'Filter by log level (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of logs to return (default: all)',
          minimum: 1
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_clear_console_logs',
    description: 'Clear all captured console logs.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'visioncraft_get_hmr_status',
    description: 'Get the Hot Module Replacement (HMR) status, including connection state, recent errors, update history, and average latency.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'visioncraft_clear_hmr_errors',
    description: 'Clear all captured HMR errors. Useful after fixing issues to reset error state.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'visioncraft_navigate',
    description: 'Navigate to a different URL in the browser.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to (e.g., "http://localhost:3000")'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'visioncraft_get_current_url',
    description: 'Get the current URL of the browser.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

/**
 * Main server implementation
 */
class VisionCraftMCPServer {
  private server: Server;
  private isWebviewMode: boolean;
  private webviewClient: WebviewClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'visioncraft-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Check if running in webview mode
    this.isWebviewMode = process.env.VISIONCRAFT_WEBVIEW_ENABLED === 'true';

    if (this.isWebviewMode) {
      const bridgeUrl = process.env.VISIONCRAFT_BRIDGE_URL;
      if (!bridgeUrl) {
        console.error('[MCP] VISIONCRAFT_WEBVIEW_ENABLED is true but VISIONCRAFT_BRIDGE_URL is not set');
        this.isWebviewMode = false;
      } else {
        console.error(`[MCP] Running in webview mode with bridge at ${bridgeUrl}`);
        this.webviewClient = new WebviewClient(bridgeUrl);
      }
    } else {
      console.error('[MCP] Running in external browser mode (Playwright)');
    }

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Get the appropriate client based on mode
   */
  private getClient(url?: string) {
    if (this.isWebviewMode && this.webviewClient) {
      return this.webviewClient;
    }
    return getBrowserClient(url);
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('[MCP] Shutting down...');

      if (this.isWebviewMode && this.webviewClient) {
        // Disconnect webview client
        if (this.webviewClient.isConnected()) {
          await this.webviewClient.disconnect();
        }
      } else {
        // Disconnect browser client
        const client = getBrowserClient();
        if (client.isConnected()) {
          await client.disconnect();
        }
      }

      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const client = this.getClient(args?.url as string);

        switch (name) {
          case 'visioncraft_screenshot': {
            const format = (args?.format as 'jpeg' | 'png') || 'jpeg';
            const quality = (args?.quality as number) || 80;

            if (this.isWebviewMode && this.webviewClient) {
              // Webview mode: callBridge returns data URL, parse and construct MCP response
              const dataUrl = await client.callBridge('screenshot', format, quality);

              // Debug: Log what we actually received
              console.error('[MCP Server] Screenshot result type:', typeof dataUrl);
              console.error('[MCP Server] Screenshot result:', dataUrl ? String(dataUrl).substring(0, 100) : dataUrl);

              // Check if dataUrl is a string
              if (typeof dataUrl !== 'string') {
                throw new Error(`Expected string data URL, got ${typeof dataUrl}: ${JSON.stringify(dataUrl)}`);
              }

              // Extract base64 from data URL (format: data:image/jpeg;base64,...)
              const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
              const base64 = base64Match ? base64Match[1] : dataUrl;

              return {
                content: [
                  {
                    type: 'text',
                    text: `Screenshot captured successfully (${format}, quality: ${quality})`,
                  },
                  {
                    type: 'image',
                    data: base64,
                    mimeType: `image/${format}`,
                  },
                ],
              };
            } else {
              // Playwright mode: Use Playwright's native screenshot
              await client.ensureConnected();
              const screenshot = await client.evaluate(async () => {
                // Just return a marker, we'll use Playwright API
                return true;
              });

              // Get the page directly and take screenshot
              const page = (client as any).page;
              if (!page) {
                throw new Error(
                  'Browser page not available. ' +
                  'Ensure the browser is connected and the page is loaded. ' +
                  'Try calling visioncraft_navigate first.'
                );
              }

              const screenshotBuffer = await page.screenshot({
                type: format,
                quality: format === 'jpeg' ? quality : undefined,
                fullPage: true,
              });

              const base64 = screenshotBuffer.toString('base64');

              return {
                content: [
                  {
                    type: 'text',
                    text: `Screenshot captured successfully (${format}, quality: ${quality})`,
                  },
                  {
                    type: 'image',
                    data: base64,
                    mimeType: `image/${format}`,
                  },
                ],
              };
            }
          }

          case 'visioncraft_inspect_element': {
            const selector = args?.selector as string;
            const result = await client.callBridge('inspectElement', selector);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_get_source': {
            const selector = args?.selector as string;
            const result = await client.callBridge('getElementSource', selector);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_click': {
            const selector = args?.selector as string;
            const result = await client.callBridge('clickElement', selector);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_type': {
            const selector = args?.selector as string;
            const text = args?.text as string;
            const result = await client.callBridge('typeText', selector, text);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_scroll': {
            const x = (args?.x as number) || 0;
            const y = args?.y as number;
            const result = await client.callBridge('scrollTo', x, y);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_find_elements': {
            const query = args?.query as string;
            const mode = (args?.mode as 'text' | 'role' | 'css') || 'css';
            const result = await client.callBridge('findElements', query, mode);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_get_structure': {
            const maxDepth = (args?.maxDepth as number) || 5;
            const result = await client.callBridge('getPageStructure', maxDepth);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_get_console_logs': {
            const level = args?.level as string | undefined;
            const limit = args?.limit as number | undefined;
            const result = await client.callBridge('getConsoleLogs', level, limit);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_clear_console_logs': {
            await client.callBridge('clearConsoleLogs');

            return {
              content: [
                {
                  type: 'text',
                  text: 'Console logs cleared',
                },
              ],
            };
          }

          case 'visioncraft_get_hmr_status': {
            const result = await client.callBridge('getHMRStatus');

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_clear_hmr_errors': {
            await client.callBridge('clearHMRErrors');

            return {
              content: [
                {
                  type: 'text',
                  text: 'HMR errors cleared',
                },
              ],
            };
          }

          case 'visioncraft_navigate': {
            const url = args?.url as string;
            await client.navigate(url);

            return {
              content: [
                {
                  type: 'text',
                  text: `Navigated to ${url}`,
                },
              ],
            };
          }

          case 'visioncraft_get_current_url': {
            const url = client.getUrl();

            return {
              content: [
                {
                  type: 'text',
                  text: url,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] VisionCraft MCP Server running on stdio');
  }
}

// Export for testing
export { getBrowserClient, BrowserClient } from './browser-client.js';
export { CDPClient } from './cdp-client.js';
export { ConnectionMode, ConnectionConfig } from './connection-mode.js';

// Start the server
const server = new VisionCraftMCPServer();
server.run().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
