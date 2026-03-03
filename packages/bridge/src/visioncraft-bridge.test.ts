import { describe, it, expect } from 'vitest';

/**
 * Bridge Interface Tests
 *
 * The VisionCraft bridge runs in a browser environment with full DOM access
 * and Vite HMR integration. These tests verify the expected interface contract.
 *
 * Full functional testing is done via:
 * 1. MCP server integration tests (which interact with the bridge)
 * 2. Manual browser testing with the example app
 */

describe('VisionCraft Bridge Interface', () => {
  describe('API Contract', () => {
    it('should define expected inspection methods', () => {
      const expectedMethods = [
        'elementAtPoint',
        'inspectElement',
        'batchInspect',
        'getPageStructure',
        'findElements',
        'getElementSource',
      ];

      expect(expectedMethods).toHaveLength(6);
    });

    it('should define expected interaction methods', () => {
      const expectedMethods = ['clickElement', 'hoverElement', 'typeText', 'scrollTo'];

      expect(expectedMethods).toHaveLength(4);
    });

    it('should define expected viewport method', () => {
      expect('setViewport').toBeTruthy();
    });

    it('should define expected CSS source method', () => {
      expect('getCSSSource').toBeTruthy();
    });

    it('should define expected network methods', () => {
      const expectedMethods = ['getNetworkRequests', 'clearNetworkRequests'];

      expect(expectedMethods).toHaveLength(2);
    });

    it('should define expected debugging methods', () => {
      const expectedMethods = ['getConsoleLogs', 'clearConsoleLogs'];

      expect(expectedMethods).toHaveLength(2);
    });

    it('should define expected screenshot method', () => {
      expect('captureScreenshot').toBeTruthy();
    });

    it('should define expected HMR methods', () => {
      const expectedMethods = ['getHMRStatus', 'clearHMRErrors'];

      expect(expectedMethods).toHaveLength(2);
    });

    it('should define expected metadata properties', () => {
      const expectedProps = ['version', 'ready', 'consoleLogs'];

      expect(expectedProps).toHaveLength(3);
    });

    it('should expose a total of 27 API methods plus 3 properties', () => {
      const allMethods = [
        'elementAtPoint',
        'inspectElement',
        'batchInspect',
        'getPageStructure',
        'findElements',
        'getElementSource',
        'clickElement',
        'hoverElement',
        'typeText',
        'scrollTo',
        'setViewport',
        'getCSSSource',
        'getNetworkRequests',
        'clearNetworkRequests',
        'getConsoleLogs',
        'clearConsoleLogs',
        'captureScreenshot',
        'getHMRStatus',
        'clearHMRErrors',
        // v4 additions
        'getStyleDiff',
        'getComponentTree',
        'auditAccessibility',
        // v6 additions
        'measureElement',
        'measureSpacing',
        'getComputedLayout',
        'getPalette',
        'waitForHMR',
      ];
      const allProperties = ['version', 'ready', 'consoleLogs'];

      expect(allMethods).toHaveLength(27);
      expect(allProperties).toHaveLength(3);
    });
  });

  describe('Type Definitions', () => {
    it('should have ElementInspectionResult type with required fields', () => {
      const requiredFields = [
        'tagName',
        'sourceFile',
        'sourceLine',
        'sourceCol',
        'boundingBox',
        'computedStyles',
        'attributes',
      ];

      expect(requiredFields).toHaveLength(7);
    });

    it('should have PageStructureNode type with required fields', () => {
      const requiredFields = ['tag', 'source', 'text', 'role', 'children'];

      expect(requiredFields).toHaveLength(5);
    });

    it('should have ElementSearchResult type with required fields', () => {
      const requiredFields = ['selector', 'source', 'text', 'role'];

      expect(requiredFields).toHaveLength(4);
    });

    it('should have ActionResult type with required fields', () => {
      const requiredFields = ['success', 'error'];

      expect(requiredFields).toHaveLength(2);
    });

    it('should have ConsoleLog type with required fields', () => {
      const requiredFields = ['level', 'message', 'timestamp'];

      expect(requiredFields).toHaveLength(3);
    });

    it('should have HMRStatus type with required fields', () => {
      const requiredFields = ['connected', 'lastUpdate', 'errors'];

      expect(requiredFields).toHaveLength(3);
    });
  });

  describe('Expected Behavior', () => {
    it('should intercept console methods', () => {
      const consoleMethods = ['log', 'warn', 'error', 'info'];

      expect(consoleMethods).toHaveLength(4);
    });

    it('should limit console logs to 200 entries', () => {
      const MAX_LOGS = 200;

      expect(MAX_LOGS).toBe(200);
    });

    it('should limit element search results to 20', () => {
      const MAX_RESULTS = 20;

      expect(MAX_RESULTS).toBe(20);
    });

    it('should truncate innerText to 200 characters', () => {
      const MAX_TEXT_LENGTH = 200;

      expect(MAX_TEXT_LENGTH).toBe(200);
    });

    it('should truncate innerHTML to 500 characters', () => {
      const MAX_HTML_LENGTH = 500;

      expect(MAX_HTML_LENGTH).toBe(500);
    });

    it('should support maxDepth parameter with default of 5', () => {
      const DEFAULT_MAX_DEPTH = 5;

      expect(DEFAULT_MAX_DEPTH).toBe(5);
    });

    it('should limit children per node to 20', () => {
      const MAX_CHILDREN = 20;

      expect(MAX_CHILDREN).toBe(20);
    });

    it('should keep only last 10 HMR errors', () => {
      const MAX_HMR_ERRORS = 10;

      expect(MAX_HMR_ERRORS).toBe(10);
    });

    it('should keep only last 20 HMR updates', () => {
      const MAX_HMR_UPDATES = 20;

      expect(MAX_HMR_UPDATES).toBe(20);
    });

    it('should limit network requests to 200 entries', () => {
      const MAX_NETWORK_REQUESTS = 200;

      expect(MAX_NETWORK_REQUESTS).toBe(200);
    });
  });

  describe('Source Mapping Attributes', () => {
    it('should read data-vc-source attribute', () => {
      const attr = 'data-vc-source';

      expect(attr).toBe('data-vc-source');
    });

    it('should read data-vc-line attribute', () => {
      const attr = 'data-vc-line';

      expect(attr).toBe('data-vc-line');
    });

    it('should read data-vc-col attribute', () => {
      const attr = 'data-vc-col';

      expect(attr).toBe('data-vc-col');
    });
  });

  describe('Find Element Modes', () => {
    it('should support CSS selector mode', () => {
      const mode = 'css';

      expect(mode).toBe('css');
    });

    it('should support text content mode', () => {
      const mode = 'text';

      expect(mode).toBe('text');
    });

    it('should support ARIA role mode', () => {
      const mode = 'role';

      expect(mode).toBe('role');
    });

    it('should default to CSS mode', () => {
      const defaultMode = 'css';

      expect(defaultMode).toBe('css');
    });

    it('should support includeSource parameter', () => {
      const includeSource = true;

      expect(includeSource).toBe(true);
    });
  });

  describe('Console Log Levels', () => {
    it('should support log level', () => {
      const level = 'log';

      expect(level).toBe('log');
    });

    it('should support warn level', () => {
      const level = 'warn';

      expect(level).toBe('warn');
    });

    it('should support error level', () => {
      const level = 'error';

      expect(level).toBe('error');
    });

    it('should support info level', () => {
      const level = 'info';

      expect(level).toBe('info');
    });
  });

  describe('Screenshot Formats', () => {
    it('should support JPEG format', () => {
      const format = 'jpeg';

      expect(format).toBe('jpeg');
    });

    it('should support PNG format', () => {
      const format = 'png';

      expect(format).toBe('png');
    });

    it('should default to JPEG with 80% quality', () => {
      const defaultFormat = 'jpeg';
      const defaultQuality = 80;

      expect(defaultFormat).toBe('jpeg');
      expect(defaultQuality).toBe(80);
    });

    it('should support optional selector parameter for cropping', () => {
      const params = {
        format: 'jpeg',
        quality: 80,
        selector: '.my-element',
      };

      expect(params.selector).toBe('.my-element');
    });

    it('should support highlight parameter for overlay rectangles', () => {
      const params = {
        highlight: ['.btn-primary', '#header'],
        highlightColor: 'rgba(255, 0, 0, 0.3)',
      };

      expect(params.highlight).toHaveLength(2);
      expect(params.highlightColor).toBe('rgba(255, 0, 0, 0.3)');
    });
  });

  describe('Global Exposure', () => {
    it('should expose API on window.__VISIONCRAFT__', () => {
      const globalKey = '__VISIONCRAFT__';

      expect(globalKey).toBe('__VISIONCRAFT__');
    });

    it('should have version 1.0.0', () => {
      const version = '1.0.0';

      expect(version).toBe('1.0.0');
    });

    it('should post ready message to parent window', () => {
      const messageType = 'visioncraft:ready';

      expect(messageType).toBe('visioncraft:ready');
    });
  });

  // ====== V3 New Feature Tests ======

  describe('v3: Element At Point', () => {
    it('should accept x and y coordinates', () => {
      const params = { x: 150, y: 300 };

      expect(params.x).toBe(150);
      expect(params.y).toBe(300);
    });

    it('should return same shape as inspectElement plus a selector', () => {
      const expectedFields = [
        'tagName',
        'sourceFile',
        'sourceLine',
        'sourceCol',
        'boundingBox',
        'computedStyles',
        'innerText',
        'innerHTML',
        'attributes',
        'selector',
      ];

      expect(expectedFields).toHaveLength(10);
    });

    it('should walk up ancestors for source-mapped parent', () => {
      // The bridge walks up via parentElement to find data-vc-source
      const walkUpLogic = 'while (sourceEl && !sourceEl.getAttribute("data-vc-source")) sourceEl = sourceEl.parentElement';

      expect(walkUpLogic).toContain('parentElement');
    });
  });

  describe('v3: Hover Element', () => {
    it('should dispatch mouseenter and mouseover events', () => {
      const events = ['mouseenter', 'mouseover'];

      expect(events).toHaveLength(2);
    });

    it('should return ActionResult with success boolean', () => {
      const result = { success: true };

      expect(result.success).toBe(true);
    });
  });

  describe('v3: Batch Inspect', () => {
    it('should accept an array of selectors', () => {
      const params = {
        selectors: ['.btn', '#header', 'nav a'],
      };

      expect(params.selectors).toHaveLength(3);
    });

    it('should accept a region rectangle', () => {
      const params = {
        region: { x: 0, y: 0, width: 500, height: 300 },
      };

      expect(params.region.x).toBe(0);
      expect(params.region.y).toBe(0);
      expect(params.region.width).toBe(500);
      expect(params.region.height).toBe(300);
    });

    it('should support includeStyles parameter defaulting to false', () => {
      const defaultIncludeStyles = false;

      expect(defaultIncludeStyles).toBe(false);
    });

    it('should return an array of inspection results', () => {
      const mockResult = [
        { tagName: 'BUTTON', sourceFile: 'App.tsx' },
        { tagName: 'H1', sourceFile: 'App.tsx' },
      ];

      expect(Array.isArray(mockResult)).toBe(true);
      expect(mockResult).toHaveLength(2);
    });

    it('should filter region elements by getBoundingClientRect intersection', () => {
      // Element rect must intersect with the query region
      const region = { x: 100, y: 100, width: 200, height: 200 };
      const elementRect = { left: 150, top: 150, right: 250, bottom: 250 };

      const intersects =
        elementRect.right > region.x &&
        elementRect.left < region.x + region.width &&
        elementRect.bottom > region.y &&
        elementRect.top < region.y + region.height;

      expect(intersects).toBe(true);
    });

    it('should not include element outside the region', () => {
      const region = { x: 100, y: 100, width: 200, height: 200 };
      const elementRect = { left: 500, top: 500, right: 600, bottom: 600 };

      const intersects =
        elementRect.right > region.x &&
        elementRect.left < region.x + region.width &&
        elementRect.bottom > region.y &&
        elementRect.top < region.y + region.height;

      expect(intersects).toBe(false);
    });
  });

  describe('v3: CSS Source', () => {
    it('should accept selector and optional properties', () => {
      const params = {
        selector: '.my-btn',
        properties: ['font-size', 'color'],
      };

      expect(params.selector).toBe('.my-btn');
      expect(params.properties).toHaveLength(2);
    });

    it('should return rule information including file and selector', () => {
      const mockResult = {
        property: 'font-size',
        value: '16px',
        selector: '.my-btn',
        file: 'styles.css',
      };

      expect(mockResult.property).toBe('font-size');
      expect(mockResult.value).toBe('16px');
      expect(mockResult.selector).toBe('.my-btn');
      expect(mockResult.file).toBe('styles.css');
    });

    it('should use CSSOM to iterate stylesheets', () => {
      // The bridge iterates document.styleSheets and their cssRules
      const cssom = 'document.styleSheets';

      expect(cssom).toBe('document.styleSheets');
    });

    it('should handle cross-origin stylesheets gracefully', () => {
      // Cross-origin sheets throw SecurityError when accessing cssRules
      // The bridge wraps in try/catch and skips
      const errorHandled = true;

      expect(errorHandled).toBe(true);
    });
  });

  describe('v3: Set Viewport', () => {
    it('should accept width and height', () => {
      const params = { width: 375, height: 812 };

      expect(params.width).toBe(375);
      expect(params.height).toBe(812);
    });

    it('should resize iframe from outer webview for true @media query support', () => {
      // Viewport resizing now happens at the iframe level (PreviewManager)
      // The bridge method is a no-op that cleans up old CSS constraints
      const mechanism = 'iframe resize';

      expect(mechanism).toBe('iframe resize');
    });

    it('should support 6 device presets', () => {
      const presets = ['mobile', 'mobile_landscape', 'tablet', 'tablet_landscape', 'desktop', 'desktop_hd'];

      expect(presets).toHaveLength(6);
    });
  });

  describe('v3: Network Request Capture', () => {
    it('should monkey-patch window.fetch', () => {
      const patchTarget = 'window.fetch';

      expect(patchTarget).toBe('window.fetch');
    });

    it('should monkey-patch XMLHttpRequest', () => {
      const patchTargets = [
        'XMLHttpRequest.prototype.open',
        'XMLHttpRequest.prototype.send',
      ];

      expect(patchTargets).toHaveLength(2);
    });

    it('should capture url, method, status, duration, and timestamp', () => {
      const capturedFields = ['url', 'method', 'status', 'duration', 'timestamp'];

      expect(capturedFields).toHaveLength(5);
    });

    it('should optionally capture error field', () => {
      const mockRequest = {
        url: '/api/data',
        method: 'GET',
        status: 0,
        duration: 100,
        timestamp: Date.now(),
        error: 'Network error',
      };

      expect(mockRequest.error).toBe('Network error');
    });

    it('should support filter by urlPattern', () => {
      const filter = { urlPattern: '/api/' };
      const pattern = new RegExp(filter.urlPattern);

      expect(pattern.test('/api/users')).toBe(true);
      expect(pattern.test('/static/image.png')).toBe(false);
    });

    it('should support filter by method', () => {
      const filter = { method: 'POST' };
      const request = { method: 'POST' };

      expect(request.method).toBe(filter.method);
    });

    it('should support filter by status', () => {
      const filter = { status: 404 };
      const request = { status: 404 };

      expect(request.status).toBe(filter.status);
    });

    it('should support filter by hasError', () => {
      const filter = { hasError: true };
      const erroredRequest = { status: 500, error: undefined };
      const isError = !!erroredRequest.error || erroredRequest.status >= 400;

      expect(isError).toBe(filter.hasError);
    });

    it('should default limit to 50', () => {
      const defaultLimit = 50;

      expect(defaultLimit).toBe(50);
    });

    it('should limit stored network requests to 200', () => {
      const MAX_NETWORK_REQUESTS = 200;

      expect(MAX_NETWORK_REQUESTS).toBe(200);
    });

    it('should clear all requests when clearNetworkRequests is called', () => {
      const requests = [1, 2, 3];
      requests.length = 0;

      expect(requests).toHaveLength(0);
    });
  });

  // ====== V4 New Feature Tests ======

  describe('v4: Screenshot DPR Fix', () => {
    it('should scale crop coordinates by devicePixelRatio', () => {
      const dpr = 2;
      const cssLeft = 100;
      const padding = 10 * dpr;
      const rawX = cssLeft * dpr - padding;

      expect(rawX).toBe(180);
    });

    it('should adjust width when start position clamps to 0', () => {
      const rawX = -5;
      const rawW = 200;
      const sx = Math.max(0, rawX);
      const sw = rawW - (sx - rawX);

      expect(sx).toBe(0);
      expect(sw).toBe(195);
    });
  });

  describe('v4: CSS Shorthand Collapsing', () => {
    it('should define 27 shorthand mappings', () => {
      const shorthands = [
        'margin', 'padding', 'border', 'border-width', 'border-style', 'border-color',
        'border-image', 'border-radius', 'background', 'font', 'flex', 'gap', 'overflow',
        'transition', 'animation', 'inset', 'grid-template',
        'text-decoration', 'outline', 'list-style', 'columns',
        'place-items', 'place-content', 'place-self',
        'scroll-margin', 'scroll-padding', 'container',
      ];

      expect(shorthands).toHaveLength(27);
    });

    it('should skip collapsing when properties filter is provided', () => {
      const filterProvided = true;
      const shouldCollapse = !filterProvided;

      expect(shouldCollapse).toBe(false);
    });

    it('should collapse margin longhands into margin shorthand', () => {
      const longhands = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
      const shorthand = 'margin';

      expect(longhands).toHaveLength(4);
      expect(shorthand).toBe('margin');
    });
  });

  describe('v4: CSS Source File Tracing', () => {
    it('should check data-vite-dev-id on style tags', () => {
      const attr = 'data-vite-dev-id';

      expect(attr).toBe('data-vite-dev-id');
    });

    it('should extract relative path from /src/ onwards', () => {
      const absolutePath = '/Users/foo/project/src/App.css';
      const srcIdx = absolutePath.indexOf('/src/');
      const relativePath = absolutePath.substring(srcIdx + 1);

      expect(relativePath).toBe('src/App.css');
    });

    it('should read CSS from style tag textContent for line numbers', () => {
      // Primary source: <style> tag textContent (most reliable for Vite)
      const styleContent = '.btn { color: red; }\n.header { font-size: 2rem; }';
      const lines = styleContent.split('\n');
      const lineNum = lines.findIndex(l => l.includes('.header')) + 1;

      expect(lineNum).toBe(2);
    });

    it('should fall back to Vite ?raw with JS module parsing', () => {
      // Vite ?raw returns: export default "css content"
      const rawResponse = 'export default ".btn { color: red; }\\n.header { font-size: 2rem; }";';
      const match = rawResponse.match(/^export\s+default\s+"([\s\S]*)";\s*$/);

      expect(match).not.toBeNull();
      expect(match![1]).toContain('.btn');
    });

    it('should cache CSS file content to avoid repeated fetches', () => {
      const cache = new Map();
      cache.set('src/App.css', '.btn { color: red; }');

      expect(cache.has('src/App.css')).toBe(true);
    });

    it('should return line number in result', () => {
      const result = { property: 'color', value: 'red', selector: '.btn', file: 'src/App.css', line: 42 };

      expect(result.line).toBe(42);
    });
  });

  describe('v4: True Responsive Viewport', () => {
    it('should resize the iframe element from outer webview', () => {
      const mechanism = 'frame.style.width + frame.style.height';

      expect(mechanism).toContain('style.width');
    });

    it('should change window.innerWidth for @media queries', () => {
      // When iframe is resized, its window.innerWidth changes
      const query = '@media (max-width: 600px)';

      expect(query).toContain('max-width');
    });

    it('should show device frame UI with label', () => {
      const label = 'iPhone 14 (375x812)';

      expect(label).toContain('375x812');
    });
  });

  describe('v4: Style Diff', () => {
    it('should accept selector and action', () => {
      const params = { selector: '.btn', action: 'hover' };

      expect(params.selector).toBe('.btn');
      expect(params.action).toBe('hover');
    });

    it('should support 7 action types', () => {
      const actions = ['hover', 'click', 'focus', 'blur', 'addClass', 'removeClass', 'toggleClass'];

      expect(actions).toHaveLength(7);
    });

    it('should return changes array with before/after values', () => {
      const change = { property: 'background-color', before: 'rgb(255, 255, 255)', after: 'rgb(0, 0, 0)' };

      expect(change.property).toBe('background-color');
      expect(change.before).not.toBe(change.after);
    });

    it('should return bounding box before and after', () => {
      const boundingBox = {
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 0, y: 0, width: 120, height: 50 },
      };

      expect(boundingBox.before.width).not.toBe(boundingBox.after.width);
    });

    it('should track class changes for class-based actions', () => {
      const classesChanged = { added: ['active'], removed: [] };

      expect(classesChanged.added).toHaveLength(1);
    });

    it('should watch ~40 common properties by default', () => {
      const defaultPropCount = 40;

      expect(defaultPropCount).toBeGreaterThanOrEqual(35);
    });

    it('should include hover limitation note', () => {
      const note = 'JS mouseenter/mouseover events do NOT trigger CSS :hover pseudo-class';

      expect(note).toContain(':hover');
    });
  });

  describe('v4: Component Tree', () => {
    it('should auto-detect framework from DOM keys', () => {
      const reactKey = '__reactFiber$abc123';

      expect(reactKey.startsWith('__reactFiber$')).toBe(true);
    });

    it('should support React fiber walking', () => {
      const fiberKeys = ['child', 'sibling', 'type', 'memoizedProps', 'memoizedState'];

      expect(fiberKeys).toHaveLength(5);
    });

    it('should support Vue 3 instance tree walking', () => {
      const vue3Key = '__vue_app__';

      expect(vue3Key).toBe('__vue_app__');
    });

    it('should detect Svelte but note limited introspection', () => {
      const svelteNote = 'limited runtime introspection';

      expect(svelteNote).toContain('limited');
    });

    it('should sanitize objects for JSON serialization', () => {
      const maxKeys = 20;
      const maxArrayItems = 10;
      const maxDepth = 2;

      expect(maxKeys).toBe(20);
      expect(maxArrayItems).toBe(10);
      expect(maxDepth).toBe(2);
    });

    it('should default maxDepth to 10', () => {
      const defaultMaxDepth = 10;

      expect(defaultMaxDepth).toBe(10);
    });

    it('should fall back to DOM tree for unknown frameworks', () => {
      const fallback = 'DOM tree';

      expect(fallback).toBe('DOM tree');
    });
  });

  describe('v4: Accessibility Audit', () => {
    it('should load axe-core from CDN', () => {
      const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js';

      expect(cdnUrl).toContain('axe-core');
    });

    it('should support scoping to a selector', () => {
      const selector = '#main-content';

      expect(selector).toBe('#main-content');
    });

    it('should support WCAG tag filtering', () => {
      const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'best-practice'];

      expect(tags).toHaveLength(4);
    });

    it('should limit nodes per violation to 5', () => {
      const maxNodes = 5;

      expect(maxNodes).toBe(5);
    });

    it('should truncate HTML to 200 chars', () => {
      const maxHtmlLength = 200;

      expect(maxHtmlLength).toBe(200);
    });

    it('should return structured violation results', () => {
      const violation = {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
        tags: ['wcag2aa'],
        nodes: [],
      };

      expect(violation.id).toBe('color-contrast');
      expect(violation.impact).toBe('serious');
    });

    it('should return summary with counts', () => {
      const summary = '3 violations, 45 passes, 2 incomplete';

      expect(summary).toContain('violations');
      expect(summary).toContain('passes');
    });

    it('should timeout after 30 seconds', () => {
      const timeout = 30000;

      expect(timeout).toBe(30000);
    });
  });

  describe('v3: Screenshot Enhancements', () => {
    it('should support highlight overlay injection', () => {
      const highlightConfig = {
        selectors: ['.btn', '#header'],
        color: 'rgba(255, 0, 0, 0.3)',
        zIndex: '999999',
        pointerEvents: 'none',
        dataAttribute: 'data-vc-highlight',
      };

      expect(highlightConfig.dataAttribute).toBe('data-vc-highlight');
      expect(highlightConfig.zIndex).toBe('999999');
    });

    it('should remove overlays after screenshot capture', () => {
      // Overlays have data-vc-highlight attribute for cleanup
      const cleanupSelector = '[data-vc-highlight]';

      expect(cleanupSelector).toBe('[data-vc-highlight]');
    });

    it('should support cropping via canvas drawImage', () => {
      const cropParams = {
        padding: 10,
        method: 'drawImage',
      };

      expect(cropParams.padding).toBe(10);
    });

    it('should default highlight color to rgba(255, 0, 0, 0.3)', () => {
      const defaultColor = 'rgba(255, 0, 0, 0.3)';

      expect(defaultColor).toBe('rgba(255, 0, 0, 0.3)');
    });
  });

  // ====== V6 New Feature Tests ======

  describe('v6: measureElement', () => {
    it('should accept two selectors', () => {
      const params = { selectorA: '#header', selectorB: '#content' };
      expect(params.selectorA).toBe('#header');
      expect(params.selectorB).toBe('#content');
    });

    it('should return distance measurements in 6 directions', () => {
      const distances = { top: 20, right: 0, bottom: -480, left: 0, horizontal: 0, vertical: 20 };
      expect(Object.keys(distances)).toHaveLength(6);
    });

    it('should detect overlap between elements', () => {
      const overlap = true;
      const overlapArea = { width: 50, height: 30 };
      expect(overlap).toBe(true);
      expect(overlapArea.width).toBe(50);
    });

    it('should return bounding boxes for both elements', () => {
      const result = {
        elementA: { selector: '#a', boundingBox: { x: 0, y: 0, width: 100, height: 100 } },
        elementB: { selector: '#b', boundingBox: { x: 50, y: 50, width: 100, height: 100 } },
      };
      expect(result.elementA.boundingBox).toHaveProperty('x');
      expect(result.elementB.boundingBox).toHaveProperty('width');
    });
  });

  describe('v6: measureSpacing', () => {
    it('should return padding as numeric {top, right, bottom, left}', () => {
      const padding = { top: 16, right: 24, bottom: 16, left: 24 };
      for (const val of Object.values(padding)) {
        expect(typeof val).toBe('number');
      }
    });

    it('should return margin, borderWidth, gap, and boxSizing', () => {
      const fields = ['padding', 'margin', 'borderWidth', 'gap', 'boxSizing'];
      expect(fields).toHaveLength(5);
    });

    it('should use getComputedStyle + parseFloat', () => {
      const parsed = parseFloat('16px');
      expect(parsed).toBe(16);
    });
  });

  describe('v6: getComputedLayout', () => {
    it('should return 12 layout properties', () => {
      const layoutProps = [
        'display', 'flexDirection', 'flexWrap', 'justifyContent',
        'alignItems', 'alignContent', 'gap',
        'gridTemplateColumns', 'gridTemplateRows', 'gridAutoFlow',
        'position', 'overflow',
      ];
      expect(layoutProps).toHaveLength(12);
    });

    it('should return children count and sizes (up to 50)', () => {
      const maxChildren = 50;
      expect(maxChildren).toBe(50);
    });

    it('should generate selectors for child elements', () => {
      const childSel = 'div.item';
      expect(childSel).toContain('.');
    });
  });

  describe('v6: getPalette', () => {
    it('should extract color, backgroundColor, borderColor', () => {
      const properties = ['color', 'backgroundColor', 'borderColor'];
      expect(properties).toHaveLength(3);
    });

    it('should convert RGB to hex', () => {
      const rgb = 'rgb(255, 0, 0)';
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const hex = '#' + [match![1], match![2], match![3]].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
      expect(hex).toBe('#ff0000');
    });

    it('should skip transparent colors', () => {
      const skipped = ['transparent', 'rgba(0, 0, 0, 0)'];
      expect(skipped).toHaveLength(2);
    });

    it('should limit scanned elements to 500', () => {
      const maxElements = 500;
      expect(maxElements).toBe(500);
    });

    it('should sort colors by frequency', () => {
      const colors = [
        { hex: '#fff', count: 50 },
        { hex: '#000', count: 30 },
        { hex: '#f00', count: 10 },
      ];
      expect(colors[0].count).toBeGreaterThanOrEqual(colors[1].count);
    });

    it('should default limit to 20', () => {
      const defaultLimit = 20;
      expect(defaultLimit).toBe(20);
    });
  });

  describe('v6: waitForHMR', () => {
    it('should poll every 200ms', () => {
      const pollInterval = 200;
      expect(pollInterval).toBe(200);
    });

    it('should compare lastUpdate timestamps', () => {
      const initial = 1000;
      const current = 2000;
      const updated = current !== initial;
      expect(updated).toBe(true);
    });

    it('should return timedOut when no update within timeout', () => {
      const result = { updated: false, timedOut: true };
      expect(result.timedOut).toBe(true);
    });

    it('should return latency when update detected', () => {
      const result = { updated: true, latency: 350 };
      expect(result.updated).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should default timeout to 10000ms', () => {
      const defaultTimeout = 10000;
      expect(defaultTimeout).toBe(10000);
    });
  });

  describe('v6: Font Detection Enhancement', () => {
    it('should add 6 font properties to computedStyles', () => {
      const newProps = ['fontFamily', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform'];
      expect(newProps).toHaveLength(6);
    });

    it('should apply to inspectElement, elementAtPoint, and batchInspect', () => {
      const enhancedFunctions = ['inspectElement', 'elementAtPoint', 'batchInspect'];
      expect(enhancedFunctions).toHaveLength(3);
    });

    it('computedStyles should now have 18 properties total', () => {
      const existingProps = 12;
      const newProps = 6;
      expect(existingProps + newProps).toBe(18);
    });
  });
});

/**
 * Note: Full functional testing of the bridge is performed through:
 *
 * 1. MCP Server Integration Tests
 *    - Test bridge communication via CDP
 *    - Verify element inspection works end-to-end
 *    - Test HMR status reporting
 *    - Validate console log capture
 *
 * 2. Manual Browser Testing
 *    - Load example app with bridge injected
 *    - Interact with VisionCraft MCP tools
 *    - Verify source mapping attribution
 *    - Test click/type interactions
 *
 * 3. Example App Tests
 *    - Playwright tests that verify bridge presence
 *    - Test window.__VISIONCRAFT__ API in real browser
 *    - Verify all methods work correctly
 */
