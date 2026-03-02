import { describe, it, expect } from 'vitest';
import { WebviewClient } from './webview-client.js';

/**
 * WebviewClient Tests
 *
 * Tests the method-to-tool name mapping and argument transformation
 * that the WebviewClient uses to translate bridge API calls into
 * HTTP requests to the VS Code extension's HttpBridge.
 */

describe('WebviewClient', () => {
  // Access private methods via prototype for testing
  const client = new WebviewClient('http://localhost:12345');
  const mapMethodToTool = (client as any).mapMethodToTool.bind(client);
  const mapArgsToToolArgs = (client as any).mapArgsToToolArgs.bind(client);

  describe('Method to Tool Name Mapping', () => {
    const expectedMappings: Record<string, string> = {
      screenshot: 'visioncraft_screenshot',
      elementAtPoint: 'visioncraft_element_at_point',
      batchInspect: 'visioncraft_batch_inspect',
      inspectElement: 'visioncraft_inspect_element',
      getElementSource: 'visioncraft_get_source',
      clickElement: 'visioncraft_click',
      typeText: 'visioncraft_type',
      scrollTo: 'visioncraft_scroll',
      hoverElement: 'visioncraft_hover',
      findElements: 'visioncraft_find_elements',
      getPageStructure: 'visioncraft_get_structure',
      getCSSSource: 'visioncraft_get_css_source',
      setViewport: 'visioncraft_set_viewport',
      getConsoleLogs: 'visioncraft_get_console_logs',
      clearConsoleLogs: 'visioncraft_clear_console_logs',
      getNetworkRequests: 'visioncraft_get_network_requests',
      clearNetworkRequests: 'visioncraft_clear_network_requests',
      getHMRStatus: 'visioncraft_get_hmr_status',
      clearHMRErrors: 'visioncraft_clear_hmr_errors',
      getCurrentUrl: 'visioncraft_get_current_url',
      visualDiff: 'visioncraft_visual_diff',
      navigate: 'visioncraft_navigate',
      // v4 additions
      getStyleDiff: 'visioncraft_style_diff',
      getComponentTree: 'visioncraft_get_component_tree',
      auditAccessibility: 'visioncraft_audit_accessibility',
    };

    it('should map all 25 methods to tool names', () => {
      expect(Object.keys(expectedMappings)).toHaveLength(25);
    });

    for (const [method, expectedTool] of Object.entries(expectedMappings)) {
      it(`should map '${method}' to '${expectedTool}'`, () => {
        expect(mapMethodToTool(method)).toBe(expectedTool);
      });
    }

    it('should return the method name as-is for unknown methods', () => {
      expect(mapMethodToTool('unknownMethod')).toBe('unknownMethod');
    });
  });

  describe('Argument Mapping: screenshot', () => {
    it('should map format and quality with defaults', () => {
      const result = mapArgsToToolArgs('screenshot', []);
      expect(result.format).toBe('jpeg');
      expect(result.quality).toBe(80);
    });

    it('should map custom format and quality', () => {
      const result = mapArgsToToolArgs('screenshot', ['png', 100]);
      expect(result.format).toBe('png');
      expect(result.quality).toBe(100);
    });

    it('should map v3 params: selector, highlight, highlightColor', () => {
      const result = mapArgsToToolArgs('screenshot', [
        'png', 100, '.my-el', ['.btn'], 'rgba(0,255,0,0.5)',
      ]);
      expect(result.selector).toBe('.my-el');
      expect(result.highlight).toEqual(['.btn']);
      expect(result.highlightColor).toBe('rgba(0,255,0,0.5)');
    });

    it('should pass undefined for missing v3 params', () => {
      const result = mapArgsToToolArgs('screenshot', ['jpeg', 80]);
      expect(result.selector).toBeUndefined();
      expect(result.highlight).toBeUndefined();
      expect(result.highlightColor).toBeUndefined();
    });
  });

  describe('Argument Mapping: elementAtPoint', () => {
    it('should map x and y coordinates', () => {
      const result = mapArgsToToolArgs('elementAtPoint', [150, 300]);
      expect(result.x).toBe(150);
      expect(result.y).toBe(300);
    });
  });

  describe('Argument Mapping: batchInspect', () => {
    it('should map selectors array', () => {
      const selectors = ['.btn', '#header'];
      const result = mapArgsToToolArgs('batchInspect', [selectors]);
      expect(result.selectors).toEqual(selectors);
    });

    it('should map region object', () => {
      const region = { x: 0, y: 0, width: 800, height: 600 };
      const result = mapArgsToToolArgs('batchInspect', [undefined, region]);
      expect(result.region).toEqual(region);
    });

    it('should map includeStyles with default false', () => {
      const result = mapArgsToToolArgs('batchInspect', []);
      expect(result.includeStyles).toBe(false);
    });

    it('should map includeStyles when provided', () => {
      const result = mapArgsToToolArgs('batchInspect', [undefined, undefined, true]);
      expect(result.includeStyles).toBe(true);
    });
  });

  describe('Argument Mapping: selector-only methods', () => {
    const selectorMethods = ['inspectElement', 'getElementSource', 'clickElement', 'hoverElement'];

    for (const method of selectorMethods) {
      it(`${method} should map selector argument`, () => {
        const result = mapArgsToToolArgs(method, ['.my-selector']);
        expect(result.selector).toBe('.my-selector');
      });
    }
  });

  describe('Argument Mapping: typeText', () => {
    it('should map selector and text', () => {
      const result = mapArgsToToolArgs('typeText', ['#input', 'hello world']);
      expect(result.selector).toBe('#input');
      expect(result.text).toBe('hello world');
    });
  });

  describe('Argument Mapping: scrollTo', () => {
    it('should map x and y with defaults', () => {
      const result = mapArgsToToolArgs('scrollTo', []);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should map custom x and y', () => {
      const result = mapArgsToToolArgs('scrollTo', [100, 500]);
      expect(result.x).toBe(100);
      expect(result.y).toBe(500);
    });
  });

  describe('Argument Mapping: findElements', () => {
    it('should map query with default mode', () => {
      const result = mapArgsToToolArgs('findElements', ['.btn']);
      expect(result.query).toBe('.btn');
      expect(result.mode).toBe('css');
    });

    it('should map custom mode', () => {
      const result = mapArgsToToolArgs('findElements', ['Click me', 'text']);
      expect(result.query).toBe('Click me');
      expect(result.mode).toBe('text');
    });

    it('should map v3 includeSource param', () => {
      const result = mapArgsToToolArgs('findElements', ['.btn', 'css', true]);
      expect(result.includeSource).toBe(true);
    });

    it('should default includeSource to false', () => {
      const result = mapArgsToToolArgs('findElements', ['.btn']);
      expect(result.includeSource).toBe(false);
    });
  });

  describe('Argument Mapping: getPageStructure', () => {
    it('should map maxDepth with default', () => {
      const result = mapArgsToToolArgs('getPageStructure', []);
      expect(result.maxDepth).toBe(5);
    });

    it('should map custom maxDepth', () => {
      const result = mapArgsToToolArgs('getPageStructure', [10]);
      expect(result.maxDepth).toBe(10);
    });
  });

  describe('Argument Mapping: getCSSSource', () => {
    it('should map selector', () => {
      const result = mapArgsToToolArgs('getCSSSource', ['.my-btn']);
      expect(result.selector).toBe('.my-btn');
    });

    it('should map optional properties', () => {
      const result = mapArgsToToolArgs('getCSSSource', ['.my-btn', ['font-size', 'color']]);
      expect(result.properties).toEqual(['font-size', 'color']);
    });

    it('should leave properties undefined when not provided', () => {
      const result = mapArgsToToolArgs('getCSSSource', ['.my-btn']);
      expect(result.properties).toBeUndefined();
    });
  });

  describe('Argument Mapping: setViewport', () => {
    it('should map width and height', () => {
      const result = mapArgsToToolArgs('setViewport', [375, 812]);
      expect(result.width).toBe(375);
      expect(result.height).toBe(812);
    });
  });

  describe('Argument Mapping: getNetworkRequests', () => {
    it('should map filter object', () => {
      const filter = { urlPattern: '/api/', method: 'GET' };
      const result = mapArgsToToolArgs('getNetworkRequests', [filter]);
      expect(result.filter).toEqual(filter);
    });

    it('should map limit with default 50', () => {
      const result = mapArgsToToolArgs('getNetworkRequests', []);
      expect(result.limit).toBe(50);
    });

    it('should map custom limit', () => {
      const result = mapArgsToToolArgs('getNetworkRequests', [undefined, 10]);
      expect(result.limit).toBe(10);
    });
  });

  describe('Argument Mapping: getConsoleLogs', () => {
    it('should map level and limit', () => {
      const result = mapArgsToToolArgs('getConsoleLogs', ['error', 10]);
      expect(result.level).toBe('error');
      expect(result.limit).toBe(10);
    });

    it('should allow undefined level (no filter)', () => {
      const result = mapArgsToToolArgs('getConsoleLogs', []);
      expect(result.level).toBeUndefined();
    });
  });

  describe('Argument Mapping: navigate', () => {
    it('should map url', () => {
      const result = mapArgsToToolArgs('navigate', ['http://localhost:3000']);
      expect(result.url).toBe('http://localhost:3000');
    });
  });

  describe('Argument Mapping: no-arg methods', () => {
    const noArgMethods = [
      'clearConsoleLogs',
      'clearNetworkRequests',
      'getHMRStatus',
      'clearHMRErrors',
      'getCurrentUrl',
    ];

    for (const method of noArgMethods) {
      it(`${method} should return empty object`, () => {
        const result = mapArgsToToolArgs(method, []);
        expect(result).toEqual({});
      });
    }
  });

  describe('Argument Mapping: v4 getStyleDiff', () => {
    it('should map selector and action', () => {
      const result = mapArgsToToolArgs('getStyleDiff', ['.btn', 'hover']);
      expect(result.selector).toBe('.btn');
      expect(result.action).toBe('hover');
    });

    it('should map actionArg for class operations', () => {
      const result = mapArgsToToolArgs('getStyleDiff', ['.btn', 'addClass', 'active']);
      expect(result.actionArg).toBe('active');
    });

    it('should map optional properties array', () => {
      const result = mapArgsToToolArgs('getStyleDiff', ['.btn', 'hover', undefined, ['color', 'background-color']]);
      expect(result.properties).toEqual(['color', 'background-color']);
    });
  });

  describe('Argument Mapping: v4 getComponentTree', () => {
    it('should map selector', () => {
      const result = mapArgsToToolArgs('getComponentTree', ['#root']);
      expect(result.selector).toBe('#root');
    });

    it('should default maxDepth to 10', () => {
      const result = mapArgsToToolArgs('getComponentTree', []);
      expect(result.maxDepth).toBe(10);
    });

    it('should default framework to auto', () => {
      const result = mapArgsToToolArgs('getComponentTree', []);
      expect(result.framework).toBe('auto');
    });

    it('should map custom maxDepth and framework', () => {
      const result = mapArgsToToolArgs('getComponentTree', [undefined, 5, 'react']);
      expect(result.maxDepth).toBe(5);
      expect(result.framework).toBe('react');
    });
  });

  describe('Argument Mapping: v4 auditAccessibility', () => {
    it('should map selector', () => {
      const result = mapArgsToToolArgs('auditAccessibility', ['#main']);
      expect(result.selector).toBe('#main');
    });

    it('should map tags', () => {
      const result = mapArgsToToolArgs('auditAccessibility', [undefined, ['wcag2a', 'wcag2aa']]);
      expect(result.tags).toEqual(['wcag2a', 'wcag2aa']);
    });

    it('should handle no arguments', () => {
      const result = mapArgsToToolArgs('auditAccessibility', []);
      expect(result.selector).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });
  });

  describe('Client State', () => {
    it('should initialize with disconnected state', () => {
      const c = new WebviewClient('http://localhost:9999');
      expect(c.isConnected()).toBe(false);
    });

    it('should return about:blank as default URL', () => {
      const c = new WebviewClient('http://localhost:9999');
      expect(c.getUrl()).toBe('about:blank');
    });

    it('should update connected state after disconnect', async () => {
      const c = new WebviewClient('http://localhost:9999');
      await c.disconnect();
      expect(c.isConnected()).toBe(false);
    });
  });
});
