/**
 * VisionCraft macOS MCP Server
 * Gives AI agents visual access to the entire macOS screen via Accessibility framework.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { callSwiftHelperOrThrow } from './swift-helper.js';
import { elementCache } from './element-cache.js';
import { compareImages, loadPNG } from './visual-diff.js';
import { extractPalette } from './palette.js';
import type {
  ScreenshotResult,
  AXElementInfo,
  WindowInfo,
  AppInfo,
  PermissionStatus,
  InteractionResult,
} from './types.js';
import * as fs from 'node:fs';

// ─── Tool Definitions ───────────────────────────────────────────────────────

const tools: Tool[] = [
  // ── Screenshot & Visual ──
  {
    name: 'macos_screenshot',
    description: 'Capture a screenshot of the macOS screen, a specific window, or a region. Returns a base64-encoded image.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['screen', 'window', 'region'],
          description: 'What to capture: entire screen, a specific window, or a rectangular region (default: screen)',
          default: 'screen',
        },
        windowId: {
          type: 'number',
          description: 'Window ID to capture (required when target is "window"). Get IDs from macos_list_windows.',
        },
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          required: ['x', 'y', 'width', 'height'],
          description: 'Region to capture (required when target is "region")',
        },
        format: {
          type: 'string',
          enum: ['png', 'jpeg'],
          description: 'Image format (default: png)',
          default: 'png',
        },
        quality: {
          type: 'number',
          description: 'JPEG quality 0-100 (default: 80)',
          minimum: 0,
          maximum: 100,
          default: 80,
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_visual_diff',
    description: 'Compare the current screen against the last screenshot taken. Highlights changed pixels and returns a diff image plus summary statistics. Call macos_screenshot first to establish a baseline.',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Pixel difference threshold 0-255. Lower = more sensitive (default: 30)',
          minimum: 0,
          maximum: 255,
          default: 30,
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_diff_against_reference',
    description: 'Compare the current screen (or a region) against a reference PNG image file.',
    inputSchema: {
      type: 'object',
      properties: {
        referencePath: {
          type: 'string',
          description: 'Absolute path to the reference PNG image file',
        },
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          required: ['x', 'y', 'width', 'height'],
          description: 'Region to crop the current screenshot to before comparison',
        },
        threshold: {
          type: 'number',
          description: 'Pixel difference threshold 0-255 (default: 30)',
          default: 30,
        },
      },
      required: ['referencePath'],
    },
  },
  {
    name: 'macos_get_palette',
    description: 'Extract the color palette from the current screen or a region. Returns colors sorted by frequency.',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          required: ['x', 'y', 'width', 'height'],
          description: 'Region to analyze (default: full screen)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of colors to return (default: 20)',
          default: 20,
        },
      },
      required: [],
    },
  },

  // ── Element Inspection ──
  {
    name: 'macos_inspect_element',
    description: 'Inspect a macOS UI element at screen coordinates. Returns the element\'s accessibility role, title, value, position, size, enabled/focused state, and available actions.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left edge of screen)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top edge of screen)',
        },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'macos_element_at_point',
    description: 'Identify the UI element at a specific pixel coordinate on the macOS screen. Returns accessibility attributes like role, title, position, and size.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left edge of screen)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top edge of screen)',
        },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'macos_find_elements',
    description: 'Search the accessibility tree for UI elements matching criteria. Search by role (e.g., AXButton), title, or partial title match.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'Accessibility role to search for (e.g., AXButton, AXTextField, AXStaticText, AXWindow)',
        },
        title: {
          type: 'string',
          description: 'Exact title to search for',
        },
        titleContains: {
          type: 'string',
          description: 'Partial title match (case-insensitive)',
        },
        appBundleId: {
          type: 'string',
          description: 'Limit search to a specific app (e.g., com.apple.finder). Default: frontmost app.',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
          default: 50,
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_get_structure',
    description: 'Dump the accessibility element hierarchy of an app as a tree. Useful for understanding the UI structure.',
    inputSchema: {
      type: 'object',
      properties: {
        appBundleId: {
          type: 'string',
          description: 'App bundle ID (e.g., com.apple.finder). Default: frontmost app.',
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum depth to traverse (default: 5)',
          default: 5,
          minimum: 1,
          maximum: 10,
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_get_focused_element',
    description: 'Get the currently focused UI element across all apps. Returns its accessibility attributes.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'macos_batch_inspect',
    description: 'Inspect multiple UI elements at once. Provide coordinate pairs or element IDs from previous calls.',
    inputSchema: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
          description: 'Array of screen coordinate pairs to inspect',
        },
        elementIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of cached element IDs from previous calls',
        },
      },
      required: [],
    },
  },

  // ── Interaction ──
  {
    name: 'macos_click',
    description: 'Click at screen coordinates. Supports left, right, and middle click, and double-click.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left edge of screen)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top edge of screen)',
        },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          description: 'Mouse button (default: left)',
          default: 'left',
        },
        clickCount: {
          type: 'number',
          description: 'Number of clicks (1 for single, 2 for double-click). Default: 1.',
          default: 1,
        },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'macos_type',
    description: 'Type text using keyboard events. Types each character sequentially.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to type',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'macos_press_key',
    description: 'Press a key combination. Supports modifier keys (cmd, shift, alt/option, ctrl) and special keys.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key name (e.g., "return", "escape", "tab", "space", "a", "f5", "delete") or single character',
        },
        modifiers: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['cmd', 'command', 'shift', 'alt', 'option', 'ctrl', 'control', 'fn'],
          },
          description: 'Modifier keys to hold (e.g., ["cmd", "shift"] for Cmd+Shift)',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'macos_scroll',
    description: 'Scroll at screen coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate to scroll at',
        },
        y: {
          type: 'number',
          description: 'Y coordinate to scroll at',
        },
        deltaX: {
          type: 'number',
          description: 'Horizontal scroll amount (positive = right)',
          default: 0,
        },
        deltaY: {
          type: 'number',
          description: 'Vertical scroll amount (positive = down, negative = up)',
          default: 0,
        },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'macos_hover',
    description: 'Move the mouse cursor to screen coordinates without clicking.',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate',
        },
        y: {
          type: 'number',
          description: 'Y coordinate',
        },
      },
      required: ['x', 'y'],
    },
  },

  // ── System ──
  {
    name: 'macos_list_windows',
    description: 'List all visible windows on screen with their positions, sizes, and owning applications.',
    inputSchema: {
      type: 'object',
      properties: {
        appBundleId: {
          type: 'string',
          description: 'Filter to windows from a specific app (e.g., com.apple.finder)',
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_list_apps',
    description: 'List running applications.',
    inputSchema: {
      type: 'object',
      properties: {
        onlyRunning: {
          type: 'boolean',
          description: 'Only show apps with a visible UI (default: true)',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_launch_app',
    description: 'Launch or activate a macOS application.',
    inputSchema: {
      type: 'object',
      properties: {
        bundleId: {
          type: 'string',
          description: 'App bundle ID (e.g., com.apple.finder)',
        },
        name: {
          type: 'string',
          description: 'App name (e.g., "Safari"). Used if bundleId not provided.',
        },
      },
      required: [],
    },
  },
  {
    name: 'macos_snapshot',
    description: 'Capture a screenshot and the accessibility tree of an app in one call. Combines macos_screenshot + macos_get_structure for efficiency.',
    inputSchema: {
      type: 'object',
      properties: {
        appBundleId: {
          type: 'string',
          description: 'App bundle ID for the accessibility tree. Default: frontmost app.',
        },
        maxDepth: {
          type: 'number',
          description: 'Max depth for the accessibility tree (default: 3)',
          default: 3,
        },
      },
      required: [],
    },
  },
];

// ─── MCP Server ─────────────────────────────────────────────────────────────

class MacOSMCPServer {
  private server: Server;
  private lastScreenshotBuffer: Buffer | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'visioncraft-macos',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[macOS MCP Error]', error);
    };

    process.on('SIGINT', () => {
      console.error('[macOS MCP] Shutting down...');
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // ── Screenshot & Visual ──

          case 'macos_screenshot': {
            const target = (args?.target as string) || 'screen';
            const format = (args?.format as string) || 'png';
            const quality = (args?.quality as number) || 80;
            const windowId = args?.windowId as number | undefined;
            const region = args?.region as { x: number; y: number; width: number; height: number } | undefined;

            const result = await callSwiftHelperOrThrow<ScreenshotResult>('screenshot', {
              target,
              format,
              quality,
              windowId,
              region,
            });

            // Store PNG buffer for visual diff
            if (format === 'png') {
              this.lastScreenshotBuffer = Buffer.from(result.base64, 'base64');
            } else {
              // Take a separate PNG for diff baseline
              try {
                const pngResult = await callSwiftHelperOrThrow<ScreenshotResult>('screenshot', {
                  target, windowId, region, format: 'png',
                });
                this.lastScreenshotBuffer = Buffer.from(pngResult.base64, 'base64');
              } catch {
                this.lastScreenshotBuffer = Buffer.from(result.base64, 'base64');
              }
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Screenshot captured (${result.width}x${result.height}, ${format})`,
                },
                {
                  type: 'image' as const,
                  data: result.base64,
                  mimeType: `image/${format}`,
                },
              ],
            };
          }

          case 'macos_visual_diff': {
            if (!this.lastScreenshotBuffer) {
              throw new Error('No previous screenshot to compare. Call macos_screenshot first to establish a baseline.');
            }

            const threshold = (args?.threshold as number) || 30;

            // Take new screenshot as PNG
            const newResult = await callSwiftHelperOrThrow<ScreenshotResult>('screenshot', {
              target: 'screen',
              format: 'png',
            });
            const newBuffer = Buffer.from(newResult.base64, 'base64');

            const diff = await compareImages(this.lastScreenshotBuffer, newBuffer, threshold);

            // Update baseline
            this.lastScreenshotBuffer = newBuffer;

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    changedPixels: diff.changedPixels,
                    totalPixels: diff.totalPixels,
                    changedPercent: diff.changedPercent,
                    similarityPercent: diff.similarityPercent,
                    dimensions: diff.dimensions,
                  }, null, 2),
                },
                {
                  type: 'image' as const,
                  data: diff.diffBase64,
                  mimeType: 'image/png',
                },
              ],
            };
          }

          case 'macos_diff_against_reference': {
            const referencePath = args?.referencePath as string;
            const threshold = (args?.threshold as number) || 30;
            const region = args?.region as { x: number; y: number; width: number; height: number } | undefined;

            if (!fs.existsSync(referencePath)) {
              throw new Error(`Reference file not found: ${referencePath}`);
            }

            const referenceBuffer = await loadPNG(referencePath);

            // Take current screenshot
            const screenshotArgs: Record<string, unknown> = {
              target: region ? 'region' : 'screen',
              format: 'png',
            };
            if (region) screenshotArgs.region = region;

            const currentResult = await callSwiftHelperOrThrow<ScreenshotResult>('screenshot', screenshotArgs);
            const currentBuffer = Buffer.from(currentResult.base64, 'base64');

            const diff = await compareImages(referenceBuffer, currentBuffer, threshold);

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    changedPixels: diff.changedPixels,
                    totalPixels: diff.totalPixels,
                    changedPercent: diff.changedPercent,
                    similarityPercent: diff.similarityPercent,
                    dimensions: diff.dimensions,
                  }, null, 2),
                },
                {
                  type: 'image' as const,
                  data: diff.diffBase64,
                  mimeType: 'image/png',
                },
              ],
            };
          }

          case 'macos_get_palette': {
            const region = args?.region as { x: number; y: number; width: number; height: number } | undefined;
            const limit = (args?.limit as number) || 20;

            // Take screenshot (of region if specified)
            const screenshotArgs: Record<string, unknown> = {
              target: region ? 'region' : 'screen',
              format: 'png',
            };
            if (region) screenshotArgs.region = region;

            const result = await callSwiftHelperOrThrow<ScreenshotResult>('screenshot', screenshotArgs);
            const pngBuffer = Buffer.from(result.base64, 'base64');

            const palette = await extractPalette(pngBuffer, limit);

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(palette, null, 2),
              }],
            };
          }

          // ── Element Inspection ──

          case 'macos_inspect_element':
          case 'macos_element_at_point': {
            const x = args?.x as number;
            const y = args?.y as number;

            const info = await callSwiftHelperOrThrow<AXElementInfo>('inspect', { x, y });

            // Cache the element
            const cacheId = elementCache.store(info);

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ ...info, _cacheId: cacheId }, null, 2),
              }],
            };
          }

          case 'macos_find_elements': {
            const findArgs: Record<string, unknown> = {};
            if (args?.role) findArgs.role = args.role;
            if (args?.title) findArgs.title = args.title;
            if (args?.titleContains) findArgs.titleContains = args.titleContains;
            if (args?.appBundleId) findArgs.appBundleId = args.appBundleId;
            if (args?.maxResults) findArgs.maxResults = args.maxResults;

            const elements = await callSwiftHelperOrThrow<AXElementInfo[]>('find', findArgs);

            // Cache all found elements
            const cacheIds = elementCache.storeAll(elements);
            const withIds = elements.map((el, i) => ({ ...el, _cacheId: cacheIds[i] }));

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(withIds, null, 2),
              }],
            };
          }

          case 'macos_get_structure': {
            const treeArgs: Record<string, unknown> = {};
            if (args?.appBundleId) treeArgs.appBundleId = args.appBundleId;
            if (args?.maxDepth) treeArgs.maxDepth = args.maxDepth;

            const tree = await callSwiftHelperOrThrow<AXElementInfo>('tree', treeArgs);

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(tree, null, 2),
              }],
            };
          }

          case 'macos_get_focused_element': {
            const info = await callSwiftHelperOrThrow<AXElementInfo>('focused', {});
            const cacheId = elementCache.store(info);

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({ ...info, _cacheId: cacheId }, null, 2),
              }],
            };
          }

          case 'macos_batch_inspect': {
            const points = args?.points as Array<{ x: number; y: number }> | undefined;
            const elementIds = args?.elementIds as string[] | undefined;
            const results: Array<Record<string, unknown>> = [];

            // Inspect by coordinates
            if (points) {
              for (const point of points) {
                try {
                  const info = await callSwiftHelperOrThrow<AXElementInfo>('inspect', {
                    x: point.x,
                    y: point.y,
                  });
                  const cacheId = elementCache.store(info);
                  results.push({ ...info, _cacheId: cacheId, _point: point });
                } catch (err) {
                  results.push({
                    _point: point,
                    error: err instanceof Error ? err.message : String(err),
                  });
                }
              }
            }

            // Look up cached elements
            if (elementIds) {
              for (const id of elementIds) {
                const cached = elementCache.get(id);
                if (cached) {
                  results.push({ ...cached, _cacheId: id });
                } else {
                  results.push({ _cacheId: id, error: 'Element expired from cache' });
                }
              }
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(results, null, 2),
              }],
            };
          }

          // ── Interaction ──

          case 'macos_click': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('click', {
              x: args?.x,
              y: args?.y,
              button: args?.button || 'left',
              clickCount: args?.clickCount || 1,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          case 'macos_type': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('type', {
              text: args?.text,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          case 'macos_press_key': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('key', {
              key: args?.key,
              modifiers: args?.modifiers,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          case 'macos_scroll': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('scroll', {
              x: args?.x,
              y: args?.y,
              deltaX: args?.deltaX || 0,
              deltaY: args?.deltaY || 0,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          case 'macos_hover': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('move-cursor', {
              x: args?.x,
              y: args?.y,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          // ── System ──

          case 'macos_list_windows': {
            const windows = await callSwiftHelperOrThrow<WindowInfo[]>('list-windows', {
              appBundleId: args?.appBundleId,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(windows, null, 2),
              }],
            };
          }

          case 'macos_list_apps': {
            const apps = await callSwiftHelperOrThrow<AppInfo[]>('list-apps', {
              onlyRunning: args?.onlyRunning ?? true,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(apps, null, 2),
              }],
            };
          }

          case 'macos_launch_app': {
            const result = await callSwiftHelperOrThrow<InteractionResult>('launch-app', {
              bundleId: args?.bundleId,
              name: args?.name,
            });

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result),
              }],
            };
          }

          case 'macos_snapshot': {
            const appBundleId = args?.appBundleId as string | undefined;
            const maxDepth = (args?.maxDepth as number) || 3;

            // Take screenshot and get AX tree in parallel
            const [screenshotResult, treeResult] = await Promise.all([
              callSwiftHelperOrThrow<ScreenshotResult>('screenshot', {
                target: 'screen',
                format: 'png',
              }),
              callSwiftHelperOrThrow<AXElementInfo>('tree', {
                appBundleId,
                maxDepth,
              }),
            ]);

            this.lastScreenshotBuffer = Buffer.from(screenshotResult.base64, 'base64');

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    screenshot: {
                      width: screenshotResult.width,
                      height: screenshotResult.height,
                    },
                    structure: treeResult,
                  }, null, 2),
                },
                {
                  type: 'image' as const,
                  data: screenshotResult.base64,
                  mimeType: 'image/png',
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: message }),
          }],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[macOS MCP] Server started — tools available via STDIO');
  }
}

// ── Entry Point ─────────────────────────────────────────────────────────────

const server = new MacOSMCPServer();
server.run().catch((error) => {
  console.error('[macOS MCP] Fatal error:', error);
  process.exit(1);
});
