import { WebviewBridge } from '../webview/WebviewBridge';

/**
 * MCP Tool definition
 */
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Tool call request
 */
interface MCPToolCallRequest {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

/**
 * MCP Tool call response
 */
interface MCPToolCallResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Embedded MCP Server - Runs in extension host process
 *
 * This server provides the 14 VisionCraft MCP tools to AI agents,
 * but uses the VS Code webview instead of launching an external browser.
 *
 * Communication flow:
 * AI Agent → STDIO → This Server → WebviewBridge → VS Code Webview → User's App
 */
export class EmbeddedMCPServer {
  private tools: MCPTool[];

  constructor(private webviewBridge: WebviewBridge) {
    this.tools = this.defineTools();
  }

  /**
   * Get all available tools
   */
  getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Handle a tool call from an AI agent
   */
  async handleToolCall(request: MCPToolCallRequest): Promise<MCPToolCallResponse> {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case 'visioncraft_screenshot':
          return await this.handleScreenshot(args);

        case 'visioncraft_navigate':
          return await this.handleNavigate(args);

        case 'visioncraft_element_at_point':
          return await this.handleElementAtPoint(args);

        case 'visioncraft_batch_inspect':
          return await this.handleBatchInspect(args);

        case 'visioncraft_inspect_element':
          return await this.handleInspectElement(args);

        case 'visioncraft_get_source':
          return await this.handleGetSource(args);

        case 'visioncraft_get_structure':
          return await this.handleGetStructure(args);

        case 'visioncraft_find_elements':
          return await this.handleFindElements(args);

        case 'visioncraft_click':
          return await this.handleClick(args);

        case 'visioncraft_type':
          return await this.handleType(args);

        case 'visioncraft_scroll':
          return await this.handleScroll(args);

        case 'visioncraft_get_console_logs':
          return await this.handleGetConsoleLogs(args);

        case 'visioncraft_clear_console_logs':
          return await this.handleClearConsoleLogs(args);

        case 'visioncraft_get_hmr_status':
          return await this.handleGetHMRStatus(args);

        case 'visioncraft_clear_hmr_errors':
          return await this.handleClearHMRErrors(args);

        case 'visioncraft_get_current_url':
          return await this.handleGetCurrentUrl(args);

        case 'visioncraft_hover':
          return await this.handleHover(args);

        case 'visioncraft_set_viewport':
          return await this.handleSetViewport(args);

        case 'visioncraft_get_css_source':
          return await this.handleGetCSSSource(args);

        case 'visioncraft_get_network_requests':
          return await this.handleGetNetworkRequests(args);

        case 'visioncraft_clear_network_requests':
          return await this.handleClearNetworkRequests(args);

        default:
          return this.errorResponse(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Tool: visioncraft_screenshot
   */
  private async handleScreenshot(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const format = args.format || 'jpeg';
    const quality = args.quality || 80;
    const selector = args.selector;
    const highlight = args.highlight;
    const highlightColor = args.highlightColor || 'rgba(255, 0, 0, 0.3)';

    const dataUrl = await this.webviewBridge.captureScreenshot(format, quality, selector, highlight, highlightColor);

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot captured successfully (${format}, quality: ${quality})`,
        },
        {
          type: 'image',
          data: dataUrl.split(',')[1], // Remove data:image/... prefix
          mimeType: `image/${format}`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_navigate
   */
  private async handleNavigate(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const url = args.url;

    if (!url) {
      return this.errorResponse('URL parameter is required');
    }

    await this.webviewBridge.navigate(url);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully navigated to: ${url}`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_element_at_point
   */
  private async handleElementAtPoint(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const x = args.x;
    const y = args.y;

    if (x === undefined || y === undefined) {
      return this.errorResponse('x and y parameters are required');
    }

    const info = await this.webviewBridge.elementAtPoint(x, y);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_batch_inspect
   */
  private async handleBatchInspect(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selectors = args.selectors as string[] | undefined;
    const region = args.region as { x: number; y: number; width: number; height: number } | undefined;
    const includeStyles = (args.includeStyles as boolean) || false;

    const results = await this.webviewBridge.batchInspect(selectors, region, includeStyles);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_inspect_element
   */
  private async handleInspectElement(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }

    const info = await this.webviewBridge.inspectElement(selector);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_source
   */
  private async handleGetSource(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }

    const source = await this.webviewBridge.getElementSource(selector);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(source, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_structure
   */
  private async handleGetStructure(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const maxDepth = args.maxDepth || 5;

    const structure = await this.webviewBridge.getPageStructure(maxDepth);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_find_elements
   */
  private async handleFindElements(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const query = args.query;
    const mode = args.mode || 'css';
    const includeSource = args.includeSource || false;

    if (!query) {
      return this.errorResponse('Query parameter is required');
    }

    const elements = await this.webviewBridge.findElements(query, mode as any, includeSource);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(elements, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_click
   */
  private async handleClick(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }

    await this.webviewBridge.clickElement(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully clicked: ${selector}`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_type
   */
  private async handleType(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;
    const text = args.text;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }
    if (!text) {
      return this.errorResponse('Text parameter is required');
    }

    await this.webviewBridge.typeText(selector, text);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully typed text into: ${selector}`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_scroll
   */
  private async handleScroll(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const x = args.x || 0;
    const y = args.y || 0;

    await this.webviewBridge.scrollTo(x, y);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully scrolled to: (${x}, ${y})`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_console_logs
   */
  private async handleGetConsoleLogs(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const level = args.level;
    const limit = args.limit;

    const logs = await this.webviewBridge.getConsoleLogs(level, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(logs, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_clear_console_logs
   */
  private async handleClearConsoleLogs(args: Record<string, any>): Promise<MCPToolCallResponse> {
    // Note: This requires bridge support
    const bridgeAvailable = await this.webviewBridge.isBridgeAvailable();

    if (!bridgeAvailable) {
      return this.errorResponse('Console log clearing requires VisionCraft bridge');
    }

    // Call bridge method directly
    const code = 'window.__VISIONCRAFT__.clearConsoleLogs()';
    await this.webviewBridge['previewManager'].evaluate(code, 2000);

    return {
      content: [
        {
          type: 'text',
          text: 'Console logs cleared successfully',
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_hmr_status
   */
  private async handleGetHMRStatus(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const bridgeAvailable = await this.webviewBridge.isBridgeAvailable();

    if (!bridgeAvailable) {
      return this.errorResponse('HMR status requires VisionCraft bridge');
    }

    const code = 'window.__VISIONCRAFT__.getHMRStatus()';
    const status = await this.webviewBridge['previewManager'].evaluate(code, 2000);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_clear_hmr_errors
   */
  private async handleClearHMRErrors(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const bridgeAvailable = await this.webviewBridge.isBridgeAvailable();

    if (!bridgeAvailable) {
      return this.errorResponse('HMR error clearing requires VisionCraft bridge');
    }

    // Assuming bridge has this method (may need to add it)
    const code = 'window.__VISIONCRAFT__.hmrErrors = []';
    await this.webviewBridge['previewManager'].evaluate(code, 2000);

    return {
      content: [
        {
          type: 'text',
          text: 'HMR errors cleared successfully',
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_current_url
   */
  private async handleGetCurrentUrl(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const url = await this.webviewBridge.getCurrentUrl();

    return {
      content: [
        {
          type: 'text',
          text: url,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_css_source
   */
  private async handleGetCSSSource(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;
    const properties = args.properties;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }

    const result = await this.webviewBridge.getCSSSource(selector, properties);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_get_network_requests
   */
  private async handleGetNetworkRequests(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const filter = args.filter;
    const limit = args.limit || 50;

    const requests = await this.webviewBridge.getNetworkRequests(filter, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(requests, null, 2),
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_clear_network_requests
   */
  private async handleClearNetworkRequests(args: Record<string, any>): Promise<MCPToolCallResponse> {
    await this.webviewBridge.clearNetworkRequests();

    return {
      content: [
        {
          type: 'text',
          text: 'Network requests cleared successfully',
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_set_viewport
   */
  private async handleSetViewport(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const presets: Record<string, { width: number; height: number }> = {
      mobile: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 900 },
    };

    let width = args.width as number;
    let height = args.height as number;
    const preset = args.preset as string | undefined;

    if (preset && presets[preset]) {
      width = presets[preset].width;
      height = presets[preset].height;
    }

    if (!width || !height) {
      return this.errorResponse('Either preset or width+height must be provided');
    }

    await this.webviewBridge.setViewport(width, height);

    return {
      content: [
        {
          type: 'text',
          text: `Viewport set to ${width}x${height}`,
        },
      ],
    };
  }

  /**
   * Tool: visioncraft_hover
   */
  private async handleHover(args: Record<string, any>): Promise<MCPToolCallResponse> {
    const selector = args.selector;

    if (!selector) {
      return this.errorResponse('Selector parameter is required');
    }

    await this.webviewBridge.hoverElement(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully hovered over: ${selector}`,
        },
      ],
    };
  }

  /**
   * Create an error response
   */
  private errorResponse(message: string): MCPToolCallResponse {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Define all 14 MCP tools
   */
  private defineTools(): MCPTool[] {
    return [
      {
        name: 'visioncraft_screenshot',
        description: 'Capture a screenshot of the current page in VS Code webview. Optionally crop to an element or highlight elements.',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['jpeg', 'png'],
              description: 'Image format (default: jpeg)',
            },
            quality: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'JPEG quality 0-100 (default: 80)',
            },
            selector: {
              type: 'string',
              description: 'Crop screenshot to this element\'s bounding box (+ 10px padding)',
            },
            highlight: {
              type: 'array',
              items: { type: 'string' },
              description: 'Draw colored overlay rectangles on these elements',
            },
            highlightColor: {
              type: 'string',
              description: 'Color for highlight overlays (default: "rgba(255, 0, 0, 0.3)")',
            },
          },
        },
      },
      {
        name: 'visioncraft_navigate',
        description: 'Navigate the webview to a different URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to navigate to',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'visioncraft_element_at_point',
        description: 'Identify the element at a specific pixel coordinate on the page',
        inputSchema: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (pixels from left)' },
            y: { type: 'number', description: 'Y coordinate (pixels from top)' },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'visioncraft_inspect_element',
        description: 'Inspect an element and get detailed information including source location',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'visioncraft_get_source',
        description: 'Get source code location for an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'visioncraft_get_structure',
        description: 'Get page DOM structure with source mapping',
        inputSchema: {
          type: 'object',
          properties: {
            maxDepth: {
              type: 'number',
              description: 'Maximum depth to traverse (default: 5)',
            },
          },
        },
      },
      {
        name: 'visioncraft_find_elements',
        description: 'Find elements by text, role, or CSS selector',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            mode: {
              type: 'string',
              enum: ['text', 'role', 'css'],
              description: 'Search mode (default: css)',
            },
            includeSource: {
              type: 'boolean',
              description: 'When true, return file line/col for each element',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'visioncraft_click',
        description: 'Click an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element to click',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'visioncraft_type',
        description: 'Type text into an input element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the input element',
            },
            text: {
              type: 'string',
              description: 'Text to type',
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'visioncraft_scroll',
        description: 'Scroll the page to specified coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              description: 'Horizontal scroll position (default: 0)',
            },
            y: {
              type: 'number',
              description: 'Vertical scroll position',
            },
          },
        },
      },
      {
        name: 'visioncraft_get_console_logs',
        description: 'Get console logs from the webview',
        inputSchema: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              enum: ['log', 'warn', 'error', 'info'],
              description: 'Filter by log level',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of logs to return',
            },
          },
        },
      },
      {
        name: 'visioncraft_clear_console_logs',
        description: 'Clear captured console logs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'visioncraft_get_hmr_status',
        description: 'Get Hot Module Replacement status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'visioncraft_clear_hmr_errors',
        description: 'Clear HMR error history',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'visioncraft_get_current_url',
        description: 'Get current page URL',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'visioncraft_batch_inspect',
        description: 'Inspect multiple elements at once by selectors or rectangular region',
        inputSchema: {
          type: 'object',
          properties: {
            selectors: { type: 'array', items: { type: 'string' }, description: 'CSS selectors to inspect' },
            region: {
              type: 'object',
              properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } },
              description: 'Region to find source-mapped elements in',
            },
            includeStyles: { type: 'boolean', description: 'Include computed styles (default: false)' },
          },
        },
      },
      {
        name: 'visioncraft_hover',
        description: 'Hover over an element to trigger CSS :hover states, tooltips, and dropdowns',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element to hover over',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'visioncraft_get_css_source',
        description: 'Trace CSS rules that apply to an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the element' },
            properties: { type: 'array', items: { type: 'string' }, description: 'Specific properties to trace' },
          },
          required: ['selector'],
        },
      },
      {
        name: 'visioncraft_get_network_requests',
        description: 'Get captured network requests (fetch and XHR)',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                urlPattern: { type: 'string' },
                method: { type: 'string' },
                status: { type: 'number' },
                hasError: { type: 'boolean' },
              },
            },
            limit: { type: 'number', description: 'Max requests to return (default: 50)' },
          },
        },
      },
      {
        name: 'visioncraft_clear_network_requests',
        description: 'Clear captured network requests',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'visioncraft_set_viewport',
        description: 'Set viewport size for responsive design testing',
        inputSchema: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'Viewport width in pixels' },
            height: { type: 'number', description: 'Viewport height in pixels' },
            preset: { type: 'string', enum: ['mobile', 'tablet', 'desktop'], description: 'Device preset' },
          },
        },
      },
    ];
  }

  /**
   * Get the WebviewBridge instance (for HttpBridge access)
   */
  getWebviewBridge(): WebviewBridge {
    return this.webviewBridge;
  }
}
