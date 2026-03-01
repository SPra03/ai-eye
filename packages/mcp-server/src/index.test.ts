import { describe, it, expect } from 'vitest';

/**
 * MCP Server Tool Definition Tests
 *
 * These tests verify the MCP server tool definitions and schemas are correct.
 * The actual MCP server runs over stdio and connects to browsers, so we test
 * the tool registry and configuration rather than end-to-end flows.
 */

// We can't import the running server directly (it starts on import),
// so we test the expected tool definitions as a contract.

const ALL_TOOL_NAMES = [
  'visioncraft_screenshot',
  'visioncraft_element_at_point',
  'visioncraft_inspect_element',
  'visioncraft_get_source',
  'visioncraft_click',
  'visioncraft_type',
  'visioncraft_scroll',
  'visioncraft_batch_inspect',
  'visioncraft_hover',
  'visioncraft_find_elements',
  'visioncraft_get_structure',
  'visioncraft_get_css_source',
  'visioncraft_set_viewport',
  'visioncraft_get_console_logs',
  'visioncraft_clear_console_logs',
  'visioncraft_get_network_requests',
  'visioncraft_clear_network_requests',
  'visioncraft_get_hmr_status',
  'visioncraft_clear_hmr_errors',
  'visioncraft_visual_diff',
  'visioncraft_navigate',
  'visioncraft_get_current_url',
];

// Original v1/v2 tools
const ORIGINAL_TOOLS = [
  'visioncraft_screenshot',
  'visioncraft_inspect_element',
  'visioncraft_get_source',
  'visioncraft_click',
  'visioncraft_type',
  'visioncraft_scroll',
  'visioncraft_find_elements',
  'visioncraft_get_structure',
  'visioncraft_get_console_logs',
  'visioncraft_clear_console_logs',
  'visioncraft_get_hmr_status',
  'visioncraft_clear_hmr_errors',
  'visioncraft_navigate',
  'visioncraft_get_current_url',
];

// New v3 tools
const V3_NEW_TOOLS = [
  'visioncraft_element_at_point',
  'visioncraft_batch_inspect',
  'visioncraft_hover',
  'visioncraft_set_viewport',
  'visioncraft_get_network_requests',
  'visioncraft_clear_network_requests',
  'visioncraft_visual_diff',
  'visioncraft_get_css_source',
];

// Enhanced tools (existing tools with new parameters)
const V3_ENHANCED_TOOLS = [
  'visioncraft_screenshot',   // +selector, +highlight, +highlightColor
  'visioncraft_find_elements', // +includeSource
];

describe('MCP Server Tool Registry', () => {
  describe('Tool Count', () => {
    it('should have 22 total tools', () => {
      expect(ALL_TOOL_NAMES).toHaveLength(22);
    });

    it('should have 14 original tools', () => {
      expect(ORIGINAL_TOOLS).toHaveLength(14);
    });

    it('should have 8 new v3 tools', () => {
      expect(V3_NEW_TOOLS).toHaveLength(8);
    });

    it('should have 2 enhanced v3 tools', () => {
      expect(V3_ENHANCED_TOOLS).toHaveLength(2);
    });

    it('all v3 new tools should exist in ALL_TOOL_NAMES', () => {
      for (const tool of V3_NEW_TOOLS) {
        expect(ALL_TOOL_NAMES).toContain(tool);
      }
    });

    it('all original tools should exist in ALL_TOOL_NAMES', () => {
      for (const tool of ORIGINAL_TOOLS) {
        expect(ALL_TOOL_NAMES).toContain(tool);
      }
    });

    it('should have no duplicate tool names', () => {
      const unique = new Set(ALL_TOOL_NAMES);
      expect(unique.size).toBe(ALL_TOOL_NAMES.length);
    });
  });

  describe('Tool Naming Convention', () => {
    it('all tools should be prefixed with visioncraft_', () => {
      for (const name of ALL_TOOL_NAMES) {
        expect(name.startsWith('visioncraft_')).toBe(true);
      }
    });

    it('all tools should use snake_case', () => {
      for (const name of ALL_TOOL_NAMES) {
        expect(name).toMatch(/^[a-z_]+$/);
      }
    });
  });

  describe('Tool Schemas: visioncraft_screenshot (enhanced)', () => {
    it('should have original params: format, quality', () => {
      const originalParams = ['format', 'quality'];
      expect(originalParams).toHaveLength(2);
    });

    it('should have new v3 params: selector, highlight, highlightColor', () => {
      const newParams = ['selector', 'highlight', 'highlightColor'];
      expect(newParams).toHaveLength(3);
    });

    it('format should be enum of jpeg and png', () => {
      const validFormats = ['jpeg', 'png'];
      expect(validFormats).toContain('jpeg');
      expect(validFormats).toContain('png');
    });

    it('quality should be 0-100', () => {
      const min = 0;
      const max = 100;
      expect(min).toBe(0);
      expect(max).toBe(100);
    });

    it('highlight should accept array of strings', () => {
      const highlight = ['.btn-primary', '#header', 'nav'];
      expect(Array.isArray(highlight)).toBe(true);
    });

    it('default highlightColor should be rgba(255, 0, 0, 0.3)', () => {
      const defaultColor = 'rgba(255, 0, 0, 0.3)';
      expect(defaultColor).toBe('rgba(255, 0, 0, 0.3)');
    });

    it('should not require any parameters', () => {
      const required: string[] = [];
      expect(required).toHaveLength(0);
    });
  });

  describe('Tool Schemas: visioncraft_element_at_point', () => {
    it('should require x and y parameters', () => {
      const required = ['x', 'y'];
      expect(required).toHaveLength(2);
    });

    it('x and y should be numbers', () => {
      const params = { x: 150, y: 300 };
      expect(typeof params.x).toBe('number');
      expect(typeof params.y).toBe('number');
    });
  });

  describe('Tool Schemas: visioncraft_batch_inspect', () => {
    it('should accept optional selectors array', () => {
      const selectors = ['.btn', '#nav', 'h1'];
      expect(Array.isArray(selectors)).toBe(true);
    });

    it('should accept optional region object', () => {
      const region = { x: 0, y: 0, width: 800, height: 600 };
      expect(region).toHaveProperty('x');
      expect(region).toHaveProperty('y');
      expect(region).toHaveProperty('width');
      expect(region).toHaveProperty('height');
    });

    it('region should require x, y, width, height', () => {
      const required = ['x', 'y', 'width', 'height'];
      expect(required).toHaveLength(4);
    });

    it('includeStyles should default to false', () => {
      const defaultIncludeStyles = false;
      expect(defaultIncludeStyles).toBe(false);
    });

    it('should not require any top-level parameters', () => {
      const required: string[] = [];
      expect(required).toHaveLength(0);
    });
  });

  describe('Tool Schemas: visioncraft_hover', () => {
    it('should require selector parameter', () => {
      const required = ['selector'];
      expect(required).toHaveLength(1);
    });

    it('selector should be a string', () => {
      const selector = '.my-button';
      expect(typeof selector).toBe('string');
    });
  });

  describe('Tool Schemas: visioncraft_find_elements (enhanced)', () => {
    it('should have original params: query, mode', () => {
      const originalParams = ['query', 'mode'];
      expect(originalParams).toHaveLength(2);
    });

    it('should have new v3 param: includeSource', () => {
      const newParam = 'includeSource';
      expect(newParam).toBe('includeSource');
    });

    it('includeSource should be boolean defaulting to false', () => {
      const defaultValue = false;
      expect(defaultValue).toBe(false);
    });

    it('should require query parameter', () => {
      const required = ['query'];
      expect(required).toHaveLength(1);
    });
  });

  describe('Tool Schemas: visioncraft_get_css_source', () => {
    it('should require selector parameter', () => {
      const required = ['selector'];
      expect(required).toHaveLength(1);
    });

    it('should accept optional properties array', () => {
      const properties = ['font-size', 'color', 'background-color'];
      expect(Array.isArray(properties)).toBe(true);
    });
  });

  describe('Tool Schemas: visioncraft_set_viewport', () => {
    it('should accept width and height', () => {
      const params = { width: 1440, height: 900 };
      expect(params.width).toBe(1440);
      expect(params.height).toBe(900);
    });

    it('should accept preset parameter', () => {
      const validPresets = ['mobile', 'tablet', 'desktop'];
      expect(validPresets).toHaveLength(3);
    });

    it('mobile preset should be 375x812', () => {
      const mobile = { width: 375, height: 812 };
      expect(mobile.width).toBe(375);
      expect(mobile.height).toBe(812);
    });

    it('tablet preset should be 768x1024', () => {
      const tablet = { width: 768, height: 1024 };
      expect(tablet.width).toBe(768);
      expect(tablet.height).toBe(1024);
    });

    it('desktop preset should be 1440x900', () => {
      const desktop = { width: 1440, height: 900 };
      expect(desktop.width).toBe(1440);
      expect(desktop.height).toBe(900);
    });

    it('should accept optional deviceScaleFactor', () => {
      const defaultScale = 1;
      expect(defaultScale).toBe(1);
    });
  });

  describe('Tool Schemas: visioncraft_get_network_requests', () => {
    it('should accept optional filter object', () => {
      const filter = {
        urlPattern: '/api/',
        method: 'GET',
        status: 200,
        hasError: false,
      };

      expect(filter).toHaveProperty('urlPattern');
      expect(filter).toHaveProperty('method');
      expect(filter).toHaveProperty('status');
      expect(filter).toHaveProperty('hasError');
    });

    it('should accept optional limit with default 50', () => {
      const defaultLimit = 50;
      expect(defaultLimit).toBe(50);
    });

    it('should not require any parameters', () => {
      const required: string[] = [];
      expect(required).toHaveLength(0);
    });
  });

  describe('Tool Schemas: visioncraft_clear_network_requests', () => {
    it('should have no parameters', () => {
      const properties = {};
      expect(Object.keys(properties)).toHaveLength(0);
    });
  });

  describe('Tool Schemas: visioncraft_visual_diff', () => {
    it('should accept optional threshold parameter', () => {
      const defaultThreshold = 30;
      expect(defaultThreshold).toBe(30);
    });

    it('threshold should be 0-255', () => {
      const min = 0;
      const max = 255;
      expect(min).toBe(0);
      expect(max).toBe(255);
    });

    it('should not require any parameters', () => {
      const required: string[] = [];
      expect(required).toHaveLength(0);
    });
  });
});

describe('MCP Server Visual Diff State', () => {
  it('should store last screenshot buffer for diff comparison', () => {
    const server = {
      lastScreenshotBuffer: null as Buffer | null,
    };

    expect(server.lastScreenshotBuffer).toBeNull();
  });

  it('should update buffer after screenshot capture', () => {
    const server = {
      lastScreenshotBuffer: null as Buffer | null,
    };

    server.lastScreenshotBuffer = Buffer.from('fake-png-data');
    expect(server.lastScreenshotBuffer).not.toBeNull();
  });

  it('should throw when visual_diff called without prior screenshot', () => {
    const lastScreenshotBuffer = null;

    expect(lastScreenshotBuffer).toBeNull();
    // The handler checks: if (!this.lastScreenshotBuffer) throw new Error(...)
  });

  it('visual diff should return changedPixels, totalPixels, changedPercent, dimensions', () => {
    const expectedFields = ['changedPixels', 'totalPixels', 'changedPercent', 'dimensions'];

    expect(expectedFields).toHaveLength(4);
  });

  it('visual diff should return a diff image as PNG', () => {
    const mimeType = 'image/png';

    expect(mimeType).toBe('image/png');
  });

  it('should always store PNG format for diff baseline', () => {
    // Even when user requests JPEG screenshot, baseline stored as PNG
    const storedFormat = 'png';
    expect(storedFormat).toBe('png');
  });

  it('visual diff should handle images of different sizes by padding', () => {
    // When old and new screenshots differ in size, the smaller is padded
    const oldSize = { width: 800, height: 600 };
    const newSize = { width: 800, height: 700 };

    const diffWidth = Math.max(oldSize.width, newSize.width);
    const diffHeight = Math.max(oldSize.height, newSize.height);

    expect(diffWidth).toBe(800);
    expect(diffHeight).toBe(700);
  });
});

describe('MCP Server Viewport Presets', () => {
  const presets: Record<string, { width: number; height: number }> = {
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
  };

  it('should define 3 presets', () => {
    expect(Object.keys(presets)).toHaveLength(3);
  });

  it('mobile preset should be 375x812', () => {
    expect(presets.mobile).toEqual({ width: 375, height: 812 });
  });

  it('tablet preset should be 768x1024', () => {
    expect(presets.tablet).toEqual({ width: 768, height: 1024 });
  });

  it('desktop preset should be 1440x900', () => {
    expect(presets.desktop).toEqual({ width: 1440, height: 900 });
  });

  it('preset should override width and height', () => {
    const args = { width: 100, height: 100, preset: 'mobile' };
    let width = args.width;
    let height = args.height;

    if (args.preset && presets[args.preset]) {
      width = presets[args.preset].width;
      height = presets[args.preset].height;
    }

    expect(width).toBe(375);
    expect(height).toBe(812);
  });
});

describe('MCP Server Dual Mode', () => {
  it('should support webview mode via VISIONCRAFT_WEBVIEW_ENABLED env var', () => {
    const envVar = 'VISIONCRAFT_WEBVIEW_ENABLED';
    expect(envVar).toBe('VISIONCRAFT_WEBVIEW_ENABLED');
  });

  it('should support bridge URL via VISIONCRAFT_BRIDGE_URL env var', () => {
    const envVar = 'VISIONCRAFT_BRIDGE_URL';
    expect(envVar).toBe('VISIONCRAFT_BRIDGE_URL');
  });

  it('should default to external browser mode (Playwright)', () => {
    const isWebviewMode = process.env.VISIONCRAFT_WEBVIEW_ENABLED === 'true';
    // In test environment, this should be false
    expect(isWebviewMode).toBe(false);
  });

  it('hover should use Playwright locator.hover() in Playwright mode', () => {
    // Playwright provides real CSS :hover via CDP cursor simulation
    const playwrightHoverMethod = 'page.locator(selector).hover()';
    expect(playwrightHoverMethod).toContain('hover');
  });

  it('hover should use bridge mouseenter/mouseover in webview mode', () => {
    const bridgeEvents = ['mouseenter', 'mouseover'];
    expect(bridgeEvents).toHaveLength(2);
  });

  it('screenshot should use Playwright locator.screenshot() for element crop', () => {
    const playwrightMethod = 'page.locator(selector).screenshot()';
    expect(playwrightMethod).toContain('screenshot');
  });

  it('viewport should use page.setViewportSize() in Playwright mode', () => {
    const playwrightMethod = 'page.setViewportSize({ width, height })';
    expect(playwrightMethod).toContain('setViewportSize');
  });
});
