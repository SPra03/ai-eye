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

// Visual diff imports (lazy-loaded)
let pixelmatch: any = null;
let PNG: any = null;
async function loadDiffDeps() {
  if (!pixelmatch) {
    const pm = await import('pixelmatch');
    pixelmatch = pm.default || pm;
    const pngjs = await import('pngjs');
    PNG = pngjs.PNG;
  }
}

// Tool schemas
const tools: Tool[] = [
  {
    name: 'visioncraft_screenshot',
    description: 'Capture a screenshot of the current page. Returns a base64-encoded image data URL. Optionally crop to a specific element and/or highlight elements with colored overlays.',
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
        },
        selector: {
          type: 'string',
          description: 'CSS selector — crop screenshot to this element\'s bounding box (+ 10px padding)'
        },
        highlight: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of CSS selectors — draw colored overlay rectangles on these elements before capture'
        },
        highlightColor: {
          type: 'string',
          description: 'Color for highlight overlays (default: "rgba(255, 0, 0, 0.3)")',
          default: 'rgba(255, 0, 0, 0.3)'
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_element_at_point',
    description: 'Identify the element at a specific pixel coordinate on the page. Returns the same detailed information as inspect_element (tag, source location, bounding box, styles, selector). Useful for going from "what\'s at this pixel?" to source code without needing to guess a CSS selector.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left edge of viewport)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top edge of viewport)'
        }
      },
      required: ['x', 'y']
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
    name: 'visioncraft_batch_inspect',
    description: 'Inspect multiple elements at once. Provide an array of CSS selectors and/or a rectangular region to find all source-mapped elements. Reduces multiple serial inspect calls to a single request.',
    inputSchema: {
      type: 'object',
      properties: {
        selectors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of CSS selectors to inspect'
        },
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          required: ['x', 'y', 'width', 'height'],
          description: 'Rectangular region to find all source-mapped elements within'
        },
        includeStyles: {
          type: 'boolean',
          description: 'Include computed styles for each element (default: false for lighter payloads)',
          default: false
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_hover',
    description: 'Hover over an element to trigger CSS :hover states, tooltips, dropdown menus, and other hover-activated UI. Use CSS selectors to target the element.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to hover over'
        }
      },
      required: ['selector']
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
        },
        includeSource: {
          type: 'boolean',
          description: 'When true, also return file line/col for each element (eliminates follow-up get_source calls)',
          default: false
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
    name: 'visioncraft_get_css_source',
    description: 'Trace which CSS rules apply to an element. Returns matched CSS rules with their selectors and source files. Useful for understanding where styles come from.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to trace styles for'
        },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific CSS properties to trace (default: all matched rules). E.g., ["font-size", "color", "background-color"]'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'visioncraft_set_viewport',
    description: 'Set the viewport size for responsive design testing. Use presets for common device sizes or specify custom dimensions.',
    inputSchema: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Viewport width in pixels'
        },
        height: {
          type: 'number',
          description: 'Viewport height in pixels'
        },
        deviceScaleFactor: {
          type: 'number',
          description: 'Device scale factor (default: 1)',
          default: 1
        },
        preset: {
          type: 'string',
          enum: ['mobile', 'tablet', 'desktop'],
          description: 'Device preset: mobile (375x812), tablet (768x1024), desktop (1440x900). Overrides width/height if provided.'
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
    name: 'visioncraft_get_network_requests',
    description: 'Get captured network requests (fetch and XHR). Useful for debugging API calls, seeing failed requests, and understanding data flow.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            urlPattern: { type: 'string', description: 'Regex pattern to match URLs' },
            method: { type: 'string', description: 'HTTP method (GET, POST, etc.)' },
            status: { type: 'number', description: 'Filter by exact status code' },
            hasError: { type: 'boolean', description: 'Filter for errored requests (status >= 400 or network error)' }
          },
          description: 'Filter criteria for network requests'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of requests to return (default: 50)',
          default: 50
        }
      },
      required: []
    }
  },
  {
    name: 'visioncraft_clear_network_requests',
    description: 'Clear all captured network requests.',
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
    name: 'visioncraft_visual_diff',
    description: 'Compare the current page to the last screenshot taken. Highlights changed pixels and returns a diff image plus summary statistics. Call visioncraft_screenshot first to establish a baseline, then make changes and call this to see what changed.',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Pixel difference threshold 0-255. Lower = more sensitive (default: 30)',
          default: 30,
          minimum: 0,
          maximum: 255
        }
      },
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
  private lastScreenshotBuffer: Buffer | null = null;

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
            const selector = args?.selector as string | undefined;
            const highlight = args?.highlight as string[] | undefined;
            const highlightColor = (args?.highlightColor as string) || 'rgba(255, 0, 0, 0.3)';

            if (this.isWebviewMode && this.webviewClient) {
              // Webview mode: callBridge returns data URL, parse and construct MCP response
              const dataUrl = await client.callBridge('screenshot', format, quality, selector, highlight, highlightColor);

              // Check if dataUrl is a string
              if (typeof dataUrl !== 'string') {
                throw new Error(`Expected string data URL, got ${typeof dataUrl}: ${JSON.stringify(dataUrl)}`);
              }

              // Extract base64 from data URL (format: data:image/jpeg;base64,...)
              const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
              const base64 = base64Match ? base64Match[1] : dataUrl;

              // Store PNG for visual diff (take separate PNG if format was JPEG)
              if (format === 'png') {
                this.lastScreenshotBuffer = Buffer.from(base64, 'base64');
              } else {
                // Take a separate PNG screenshot for diff baseline
                try {
                  const pngUrl = await client.callBridge('screenshot', 'png', 100);
                  const pngMatch = (pngUrl as string).match(/^data:image\/\w+;base64,(.+)$/);
                  this.lastScreenshotBuffer = Buffer.from(pngMatch ? pngMatch[1] : pngUrl as string, 'base64');
                } catch {
                  this.lastScreenshotBuffer = Buffer.from(base64, 'base64');
                }
              }

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

              // Inject highlight overlays if requested
              if (highlight && highlight.length > 0) {
                await page.evaluate(({ selectors, color }: { selectors: string[]; color: string }) => {
                  for (const sel of selectors) {
                    document.querySelectorAll(sel).forEach((el: any) => {
                      const rect = el.getBoundingClientRect();
                      const overlay = document.createElement('div');
                      overlay.style.cssText = `position:absolute;left:${rect.left+window.scrollX}px;top:${rect.top+window.scrollY}px;width:${rect.width}px;height:${rect.height}px;background:${color};pointer-events:none;z-index:999999;`;
                      overlay.setAttribute('data-vc-highlight', 'true');
                      document.body.appendChild(overlay);
                    });
                  }
                }, { selectors: highlight, color: highlightColor });
              }

              let screenshotBuffer: Buffer;
              if (selector) {
                // Crop to specific element
                screenshotBuffer = await page.locator(selector).screenshot({
                  type: format,
                  quality: format === 'jpeg' ? quality : undefined,
                });
              } else {
                screenshotBuffer = await page.screenshot({
                  type: format,
                  quality: format === 'jpeg' ? quality : undefined,
                  fullPage: true,
                });
              }

              // Remove highlight overlays
              if (highlight && highlight.length > 0) {
                await page.evaluate(() => {
                  document.querySelectorAll('[data-vc-highlight]').forEach((el: any) => el.remove());
                });
              }

              // Store PNG for visual diff
              if (format === 'png') {
                this.lastScreenshotBuffer = screenshotBuffer;
              } else {
                // Take separate PNG for diff baseline
                this.lastScreenshotBuffer = await page.screenshot({ type: 'png', fullPage: true });
              }

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

          case 'visioncraft_element_at_point': {
            const x = args?.x as number;
            const y = args?.y as number;
            const result = await client.callBridge('elementAtPoint', x, y);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
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

          case 'visioncraft_batch_inspect': {
            const selectors = args?.selectors as string[] | undefined;
            const region = args?.region as { x: number; y: number; width: number; height: number } | undefined;
            const includeStyles = (args?.includeStyles as boolean) || false;
            const result = await client.callBridge('batchInspect', selectors, region, includeStyles);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_hover': {
            const selector = args?.selector as string;

            if (this.isWebviewMode && this.webviewClient) {
              const result = await client.callBridge('hoverElement', selector);
              return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
              };
            } else {
              // Playwright mode: use real hover for CSS :hover
              await client.ensureConnected();
              const page = (client as any).page;
              if (page) {
                await page.locator(selector).hover();
              } else {
                await client.callBridge('hoverElement', selector);
              }
              return {
                content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }],
              };
            }
          }

          case 'visioncraft_find_elements': {
            const query = args?.query as string;
            const mode = (args?.mode as 'text' | 'role' | 'css') || 'css';
            const includeSource = (args?.includeSource as boolean) || false;
            const result = await client.callBridge('findElements', query, mode, includeSource);

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

          case 'visioncraft_get_css_source': {
            const selector = args?.selector as string;
            const properties = args?.properties as string[] | undefined;
            const result = await client.callBridge('getCSSSource', selector, properties);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_set_viewport': {
            const presets: Record<string, { width: number; height: number }> = {
              mobile: { width: 375, height: 812 },
              tablet: { width: 768, height: 1024 },
              desktop: { width: 1440, height: 900 },
            };

            let width = args?.width as number;
            let height = args?.height as number;
            const preset = args?.preset as string | undefined;
            const deviceScaleFactor = (args?.deviceScaleFactor as number) || 1;

            if (preset && presets[preset]) {
              width = presets[preset].width;
              height = presets[preset].height;
            }

            if (!width || !height) {
              throw new Error('Either preset or width+height must be provided');
            }

            if (this.isWebviewMode && this.webviewClient) {
              const result = await client.callBridge('setViewport', width, height);
              return {
                content: [{ type: 'text', text: `Viewport set to ${width}x${height} (scale: ${deviceScaleFactor})` }],
              };
            } else {
              // Playwright mode: use native viewport
              await client.ensureConnected();
              const page = (client as any).page;
              if (page) {
                await page.setViewportSize({ width, height });
              }
              return {
                content: [{ type: 'text', text: `Viewport set to ${width}x${height} (scale: ${deviceScaleFactor})` }],
              };
            }
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

          case 'visioncraft_get_network_requests': {
            const filter = args?.filter as { urlPattern?: string; method?: string; status?: number; hasError?: boolean } | undefined;
            const limit = (args?.limit as number) || 50;
            const result = await client.callBridge('getNetworkRequests', filter, limit);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'visioncraft_clear_network_requests': {
            await client.callBridge('clearNetworkRequests');

            return {
              content: [
                {
                  type: 'text',
                  text: 'Network requests cleared',
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

          case 'visioncraft_visual_diff': {
            if (!this.lastScreenshotBuffer) {
              throw new Error('No previous screenshot to compare. Call visioncraft_screenshot first to establish a baseline.');
            }

            const threshold = (args?.threshold as number) || 30;

            // Take a new screenshot
            let newBuffer: Buffer;
            if (this.isWebviewMode && this.webviewClient) {
              const dataUrl = await client.callBridge('screenshot', 'png', 100);
              const base64Match = (dataUrl as string).match(/^data:image\/\w+;base64,(.+)$/);
              const base64 = base64Match ? base64Match[1] : dataUrl;
              newBuffer = Buffer.from(base64 as string, 'base64');
            } else {
              await client.ensureConnected();
              const page = (client as any).page;
              if (!page) throw new Error('Browser page not available');
              newBuffer = await page.screenshot({ type: 'png', fullPage: true });
            }

            // Load pixelmatch deps
            await loadDiffDeps();

            const oldPng = PNG.sync.read(this.lastScreenshotBuffer);
            const newPng = PNG.sync.read(newBuffer);

            // Handle size differences by using the max dimensions
            const width = Math.max(oldPng.width, newPng.width);
            const height = Math.max(oldPng.height, newPng.height);

            // Create padded buffers if sizes differ
            const padImage = (img: any, w: number, h: number) => {
              if (img.width === w && img.height === h) return img.data;
              const padded = Buffer.alloc(w * h * 4, 0);
              for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                  const srcIdx = (y * img.width + x) * 4;
                  const dstIdx = (y * w + x) * 4;
                  padded[dstIdx] = img.data[srcIdx];
                  padded[dstIdx + 1] = img.data[srcIdx + 1];
                  padded[dstIdx + 2] = img.data[srcIdx + 2];
                  padded[dstIdx + 3] = img.data[srcIdx + 3];
                }
              }
              return padded;
            };

            const oldData = padImage(oldPng, width, height);
            const newData = padImage(newPng, width, height);

            const diffData = Buffer.alloc(width * height * 4);
            const numDiffPixels = pixelmatch(oldData, newData, diffData, width, height, {
              threshold: threshold / 255,
            });

            const totalPixels = width * height;
            const changedPercent = ((numDiffPixels / totalPixels) * 100).toFixed(2);

            // Encode diff image as PNG
            const diffPng = new PNG({ width, height });
            diffPng.data = diffData;
            const diffBuffer = PNG.sync.write(diffPng);
            const diffBase64 = diffBuffer.toString('base64');

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    changedPixels: numDiffPixels,
                    totalPixels,
                    changedPercent: parseFloat(changedPercent),
                    dimensions: { width, height },
                  }, null, 2),
                },
                {
                  type: 'image',
                  data: diffBase64,
                  mimeType: 'image/png',
                },
              ],
            };
          }

          case 'visioncraft_navigate': {
            const url = args?.url as string;
            await client.callBridge('navigate', url);

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
            let url: string;
            try {
              // Try to get the actual URL from the browser/webview
              url = await client.callBridge('getCurrentUrl');
              if (typeof url !== 'string' || !url) {
                url = client.getUrl();
              }
            } catch {
              // Fall back to tracked URL
              url = client.getUrl();
            }

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
