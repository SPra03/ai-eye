/**
 * AI Eye Bridge Script
 * Runs inside the user's application to provide inspection and interaction APIs
 * This is injected into the page and provides the window.__AIEYE__ interface
 */

interface AIEyeAPI {
  // Core inspection
  elementAtPoint: (x: number, y: number) => ElementInspectionResult | ErrorResult;
  inspectElement: (selector: string) => ElementInspectionResult | ErrorResult;
  batchInspect: (selectors?: string[], region?: { x: number; y: number; width: number; height: number }, includeStyles?: boolean) => (ElementInspectionResult | ErrorResult)[];
  getPageStructure: (maxDepth?: number) => PageStructureNode;
  findElements: (query: string, mode?: 'text' | 'role' | 'css', includeSource?: boolean) => ElementSearchResult[];
  getElementSource: (selector: string) => SourceLocation | ErrorResult;

  // Interaction
  clickElement: (selector: string) => ActionResult;
  hoverElement: (selector: string) => ActionResult;
  typeText: (selector: string, text: string) => ActionResult;
  scrollTo: (x: number, y: number) => ActionResult;

  // Viewport
  setViewport: (width: number, height: number) => ActionResult;

  // CSS Source
  getCSSSource: (selector: string, properties?: string[]) => Promise<any>;

  // Style Diff
  getStyleDiff: (selector: string, action: string, actionArg?: string, properties?: string[]) => Promise<any>;

  // Component Tree
  getComponentTree: (selector?: string, maxDepth?: number, framework?: string) => any;

  // Accessibility Audit
  auditAccessibility: (selector?: string, tags?: string[]) => Promise<any>;

  // Network
  getNetworkRequests: (filter?: { urlPattern?: string; method?: string; status?: number; hasError?: boolean }, limit?: number) => any[];
  clearNetworkRequests: () => void;

  // Debugging
  consoleLogs: ConsoleLog[];
  getConsoleLogs: (level?: string, limit?: number) => ConsoleLog[];
  clearConsoleLogs: () => void;

  // Screenshots
  captureScreenshot: (format?: 'jpeg' | 'png', quality?: number, selector?: string, highlight?: string[], highlightColor?: string) => Promise<string>;

  // HMR status
  getHMRStatus: () => HMRStatus;

  // Measurement
  measureElement: (selectorA: string, selectorB: string) => any;
  measureSpacing: (selector: string) => any;
  getComputedLayout: (selector: string) => any;

  // Palette
  getPalette: (selector?: string, limit?: number) => any;

  // HMR Wait
  waitForHMR: (timeout?: number) => Promise<any>;

  // Metadata
  version: string;
  ready: boolean;
}

interface ElementInspectionResult {
  tagName: string;
  sourceFile: string | null;
  sourceLine: string | null;
  sourceCol: string | null;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
  innerText?: string;
  innerHTML?: string;
  attributes: Record<string, string>;
}

interface ErrorResult {
  error: string;
}

interface PageStructureNode {
  tag?: string;
  source?: string | null;
  text?: string | null;
  role?: string | null;
  children?: PageStructureNode[];
}

interface ElementSearchResult {
  selector: string;
  source?: string | null;
  text?: string;
  role?: string | null;
}

interface SourceLocation {
  file: string | null;
  line: string | null;
  col: string | null;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

interface HMRStatus {
  connected: boolean;
  lastUpdate: number | null;
  errors: Array<{
    message: string;
    stack?: string;
  }>;
}

// Initialize AI Eye Bridge
// This runs as an ES module with full access to import.meta.hot
(function initAIEye() {
  'use strict';

  // Check if already initialized
  if ((window as any).__AIEYE__) {
    console.log('[AI Eye] Bridge already initialized');
    return;
  }

  console.log('[AI Eye] Initializing bridge script...');

  // ====== Network Request Capture ======
  interface NetworkRequest {
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: number;
    error?: string;
  }

  const MAX_NETWORK_REQUESTS = 200;
  const networkRequests: NetworkRequest[] = [];

  // Monkey-patch fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...fetchArgs: any[]) {
    const startTime = Date.now();
    const input = fetchArgs[0];
    const init = fetchArgs[1] || {};
    const url = typeof input === 'string' ? input : (input as Request).url;
    const method = init.method || (typeof input === 'object' ? (input as Request).method : 'GET') || 'GET';

    try {
      const response = await originalFetch.apply(window, fetchArgs as any);
      networkRequests.push({
        url,
        method: method.toUpperCase(),
        status: response.status,
        duration: Date.now() - startTime,
        timestamp: startTime,
      });
      if (networkRequests.length > MAX_NETWORK_REQUESTS) {
        networkRequests.shift();
      }
      return response;
    } catch (error: any) {
      networkRequests.push({
        url,
        method: method.toUpperCase(),
        status: 0,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error.message || String(error),
      });
      if (networkRequests.length > MAX_NETWORK_REQUESTS) {
        networkRequests.shift();
      }
      throw error;
    }
  };

  // Monkey-patch XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any).__vc_method = method;
    (this as any).__vc_url = String(url);
    return originalXHROpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (...sendArgs: any[]) {
    const startTime = Date.now();
    const method = (this as any).__vc_method || 'GET';
    const url = (this as any).__vc_url || '';

    this.addEventListener('loadend', function () {
      networkRequests.push({
        url,
        method: method.toUpperCase(),
        status: this.status,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: this.status === 0 ? 'Network error' : undefined,
      });
      if (networkRequests.length > MAX_NETWORK_REQUESTS) {
        networkRequests.shift();
      }
    });

    return originalXHRSend.apply(this, sendArgs as any);
  };

  function getNetworkRequests(
    filter?: { urlPattern?: string; method?: string; status?: number; hasError?: boolean },
    limit: number = 50
  ): NetworkRequest[] {
    let filtered = [...networkRequests];

    if (filter) {
      if (filter.urlPattern) {
        const pattern = new RegExp(filter.urlPattern);
        filtered = filtered.filter((r) => pattern.test(r.url));
      }
      if (filter.method) {
        filtered = filtered.filter((r) => r.method === filter.method!.toUpperCase());
      }
      if (filter.status !== undefined) {
        filtered = filtered.filter((r) => r.status === filter.status);
      }
      if (filter.hasError !== undefined) {
        filtered = filtered.filter((r) => filter.hasError ? !!r.error || r.status >= 400 : !r.error && r.status < 400);
      }
    }

    return filtered.slice(-limit);
  }

  function clearNetworkRequests(): void {
    networkRequests.length = 0;
  }

  // ====== Console Log Capture ======
  const MAX_LOGS = 200;
  const consoleLogs: ConsoleLog[] = [];

  // Intercept console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  function captureLog(level: 'log' | 'warn' | 'error' | 'info', args: any[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    consoleLogs.push({
      level,
      message,
      timestamp: Date.now(),
    });

    // Keep only last MAX_LOGS entries
    if (consoleLogs.length > MAX_LOGS) {
      consoleLogs.shift();
    }
  }

  console.log = function (...args: any[]) {
    captureLog('log', args);
    originalConsole.log.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    captureLog('warn', args);
    originalConsole.warn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    captureLog('error', args);
    originalConsole.error.apply(console, args);
  };

  console.info = function (...args: any[]) {
    captureLog('info', args);
    originalConsole.info.apply(console, args);
  };

  // ====== Element At Point ======
  function elementAtPoint(x: number, y: number): ElementInspectionResult | ErrorResult {
    try {
      // Screenshots are captured at devicePixelRatio scale by html2canvas,
      // so coordinates from screenshot images need to be converted to CSS viewport coords
      const dpr = window.devicePixelRatio || 1;
      const cssX = x / dpr;
      const cssY = y / dpr;

      let el = document.elementFromPoint(cssX, cssY);
      if (!el) {
        // Retry with raw coordinates in case caller already provides CSS coords
        el = document.elementFromPoint(x, y);
      }
      if (!el) {
        return { error: `No element found at point (${x}, ${y})` };
      }

      // Walk up to find nearest source-mapped parent if needed
      let sourceEl: Element | null = el;
      while (sourceEl && !sourceEl.getAttribute('data-ae-source')) {
        sourceEl = sourceEl.parentElement;
      }

      const targetEl = el;
      const rect = targetEl.getBoundingClientRect();
      const computed = window.getComputedStyle(targetEl);

      const sourceFile = sourceEl?.getAttribute('data-ae-source') || null;
      const sourceLine = sourceEl?.getAttribute('data-ae-line') || null;
      const sourceCol = sourceEl?.getAttribute('data-ae-col') || null;

      const computedStyles: Record<string, string> = {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        fontStyle: computed.fontStyle,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border,
        zIndex: computed.zIndex,
      };

      const attributes: Record<string, string> = {};
      for (let i = 0; i < targetEl.attributes.length; i++) {
        const attr = targetEl.attributes[i];
        attributes[attr.name] = attr.value;
      }

      return {
        tagName: targetEl.tagName,
        sourceFile,
        sourceLine,
        sourceCol,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        computedStyles,
        innerText: (targetEl as HTMLElement).innerText?.substring(0, 200),
        innerHTML: targetEl.innerHTML?.substring(0, 500),
        attributes,
        selector: generateSelector(targetEl, 0),
      } as any;
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Element Inspection ======
  function inspectElement(selector: string): ElementInspectionResult | ErrorResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { error: `Element not found: ${selector}` };
      }

      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);

      // Get source mapping attributes
      const sourceFile = el.getAttribute('data-ae-source');
      const sourceLine = el.getAttribute('data-ae-line');
      const sourceCol = el.getAttribute('data-ae-col');

      // Get computed styles (most useful ones)
      const computedStyles: Record<string, string> = {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        fontStyle: computed.fontStyle,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border,
        zIndex: computed.zIndex,
      };

      // Get all attributes
      const attributes: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        attributes[attr.name] = attr.value;
      }

      return {
        tagName: el.tagName,
        sourceFile,
        sourceLine,
        sourceCol,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        computedStyles,
        innerText: (el as HTMLElement).innerText?.substring(0, 200),
        innerHTML: el.innerHTML?.substring(0, 500),
        attributes,
      };
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Batch Inspect ======
  function batchInspect(
    selectors?: string[],
    region?: { x: number; y: number; width: number; height: number },
    includeStyles: boolean = false
  ): (ElementInspectionResult | ErrorResult)[] {
    const results: (ElementInspectionResult | ErrorResult)[] = [];

    if (selectors && selectors.length > 0) {
      for (const selector of selectors) {
        results.push(inspectElement(selector));
      }
    }

    if (region) {
      // Find all source-mapped elements in the region
      const allElements = document.querySelectorAll('[data-ae-source]');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const rect = el.getBoundingClientRect();

        // Check if element intersects with region
        if (
          rect.right > region.x &&
          rect.left < region.x + region.width &&
          rect.bottom > region.y &&
          rect.top < region.y + region.height
        ) {
          const sourceFile = el.getAttribute('data-ae-source');
          const sourceLine = el.getAttribute('data-ae-line');
          const sourceCol = el.getAttribute('data-ae-col');

          const entry: any = {
            tagName: el.tagName,
            sourceFile,
            sourceLine,
            sourceCol,
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            selector: generateSelector(el, i),
            innerText: (el as HTMLElement).innerText?.substring(0, 100),
          };

          if (includeStyles) {
            const computed = window.getComputedStyle(el);
            entry.computedStyles = {
              display: computed.display,
              position: computed.position,
              width: computed.width,
              height: computed.height,
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              fontFamily: computed.fontFamily,
              fontStyle: computed.fontStyle,
              lineHeight: computed.lineHeight,
              letterSpacing: computed.letterSpacing,
              textAlign: computed.textAlign,
              textTransform: computed.textTransform,
              padding: computed.padding,
              margin: computed.margin,
            };
          }

          // Get attributes
          const attributes: Record<string, string> = {};
          for (let j = 0; j < el.attributes.length; j++) {
            const attr = el.attributes[j];
            attributes[attr.name] = attr.value;
          }
          entry.attributes = attributes;

          results.push(entry);
        }
      }
    }

    return results;
  }

  // ====== Get Element Source ======
  function getElementSource(selector: string): SourceLocation | ErrorResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { error: `Element not found: ${selector}` };
      }

      const file = el.getAttribute('data-ae-source');
      const line = el.getAttribute('data-ae-line');
      const col = el.getAttribute('data-ae-col');

      // Check if source mapping attributes exist
      if (!file || !line || !col) {
        return {
          error: 'Source mapping not available for this element. ' +
                 'Ensure @ai-eye/vite-plugin or @ai-eye/babel-plugin is configured.'
        };
      }

      // Validate line and col are numeric
      const lineNum = parseInt(line, 10);
      const colNum = parseInt(col, 10);

      if (isNaN(lineNum) || isNaN(colNum) || lineNum <= 0 || colNum < 0) {
        return {
          error: `Invalid source location: line=${line}, col=${col}`
        };
      }

      return { file, line, col };
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Page Structure ======
  function getPageStructure(maxDepth: number = 5): PageStructureNode {
    function walk(el: Element, depth: number): PageStructureNode | null {
      if (depth > maxDepth) return null;

      const node: PageStructureNode = {
        tag: el.tagName?.toLowerCase(),
        source: el.getAttribute('data-ae-source'),
        role: el.getAttribute('role'),
      };

      // Get text content for leaf nodes
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        node.text = el.textContent?.trim().substring(0, 100) || null;
      }

      // Get children
      const children: PageStructureNode[] = [];
      for (let i = 0; i < Math.min(el.children.length, 20); i++) {
        const child = walk(el.children[i], depth + 1);
        if (child) children.push(child);
      }

      if (children.length > 0) {
        node.children = children;
      }

      return node;
    }

    return walk(document.body, 0) || { tag: 'body' };
  }

  // ====== Find Elements ======
  function findElements(
    query: string,
    mode: 'text' | 'role' | 'css' = 'css',
    includeSource: boolean = false
  ): ElementSearchResult[] {
    try {
      let elements: Element[] = [];

      switch (mode) {
        case 'text': {
          // Find elements containing text
          const xpath = `//*[contains(text(), '${query}')]`;
          const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          for (let i = 0; i < Math.min(result.snapshotLength, 20); i++) {
            elements.push(result.snapshotItem(i) as Element);
          }
          break;
        }

        case 'role': {
          // Find elements by ARIA role
          elements = Array.from(document.querySelectorAll(`[role="${query}"]`)).slice(0, 20);
          break;
        }

        case 'css':
        default: {
          // Find elements by CSS selector
          elements = Array.from(document.querySelectorAll(query)).slice(0, 20);
          break;
        }
      }

      return elements.map((el, index) => {
        const result: any = {
          selector: generateSelector(el, index),
          source: el.getAttribute('data-ae-source'),
          text: (el as HTMLElement).innerText?.substring(0, 50),
          role: el.getAttribute('role'),
        };

        if (includeSource) {
          result.line = el.getAttribute('data-ae-line');
          result.col = el.getAttribute('data-ae-col');
        }

        return result;
      });
    } catch (error) {
      console.error('[AI Eye] Error finding elements:', error);
      return [];
    }
  }

  // Generate unique selector for element
  function generateSelector(el: Element, index: number): string {
    if (el.id) return `#${el.id}`;
    if (el.className) {
      const classes = Array.from(el.classList).join('.');
      if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return `${el.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }

  // ====== Element Interaction ======
  function clickElement(selector: string): ActionResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      (el as HTMLElement).click();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  function typeText(selector: string, text: string): ActionResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        (el as HTMLInputElement).value = text;
        // Trigger input event
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      } else {
        return { success: false, error: 'Element is not an input or textarea' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  function hoverElement(selector: string): ActionResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  function scrollTo(x: number, y: number): ActionResult {
    try {
      window.scrollTo(x, y);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ====== CSS Source ======

  // Shorthand map: shorthand → list of longhands it expands to
  const SHORTHAND_MAP: Record<string, string[]> = {
    'margin': ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    'padding': ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    // border: browsers expand to 12 directional + 5 border-image longhands
    'border': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
               'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
               'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
               'border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat'],
    'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
    'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
    'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
    'border-image': ['border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat'],
    'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
    // background: browsers expand position to x/y, NOT the combined 'background-position'
    'background': ['background-color', 'background-image', 'background-position-x', 'background-position-y',
                   'background-repeat', 'background-size', 'background-attachment', 'background-origin', 'background-clip'],
    'font': ['font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', 'font-family',
             'font-stretch', 'font-size-adjust', 'font-kerning', 'font-variant-ligatures',
             'font-variant-caps', 'font-variant-numeric', 'font-variant-east-asian',
             'font-variant-alternates', 'font-variant-position', 'font-optical-sizing',
             'font-feature-settings', 'font-variation-settings'],
    'flex': ['flex-grow', 'flex-shrink', 'flex-basis'],
    'gap': ['row-gap', 'column-gap'],
    'overflow': ['overflow-x', 'overflow-y'],
    'transition': ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay',
                   'transition-behavior'],
    'animation': ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay',
                  'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state',
                  'animation-timeline', 'animation-range-start', 'animation-range-end', 'animation-composition'],
    'inset': ['top', 'right', 'bottom', 'left'],
    'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
    'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'],
    'outline': ['outline-width', 'outline-style', 'outline-color'],
    'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
    'columns': ['column-width', 'column-count'],
    'place-items': ['align-items', 'justify-items'],
    'place-content': ['align-content', 'justify-content'],
    'place-self': ['align-self', 'justify-self'],
    'scroll-margin': ['scroll-margin-top', 'scroll-margin-right', 'scroll-margin-bottom', 'scroll-margin-left'],
    'scroll-padding': ['scroll-padding-top', 'scroll-padding-right', 'scroll-padding-bottom', 'scroll-padding-left'],
    'container': ['container-name', 'container-type'],
  };

  // Build reverse map: longhand → shorthand
  const LONGHAND_TO_SHORTHAND: Record<string, string> = {};
  for (const [shorthand, longhands] of Object.entries(SHORTHAND_MAP)) {
    for (const lh of longhands) {
      // Prefer more specific shorthands (border-width over border)
      if (!LONGHAND_TO_SHORTHAND[lh] || shorthand.length > LONGHAND_TO_SHORTHAND[lh].length) {
        LONGHAND_TO_SHORTHAND[lh] = shorthand;
      }
    }
  }

  // CSS file content cache for line number resolution
  const cssFileCache = new Map<string, string>();

  /**
   * Get the source file for a stylesheet.
   * Checks: sheet.href → data-ae-source → data-vite-dev-id → "inline"
   */
  function getStyleSheetFile(sheet: CSSStyleSheet): string {
    if (sheet.href) {
      // External stylesheet — extract relative path
      try {
        const url = new URL(sheet.href);
        const path = url.pathname;
        // Extract from /src/ onwards for Vite paths
        const srcIdx = path.indexOf('/src/');
        return srcIdx >= 0 ? path.substring(srcIdx + 1) : path;
      } catch {
        return sheet.href;
      }
    }

    const ownerNode = sheet.ownerNode as HTMLElement | null;
    if (!ownerNode) return 'inline';

    // Check data-ae-source (AI Eye plugin attribute)
    const vcSource = ownerNode.getAttribute('data-ae-source');
    if (vcSource) return vcSource;

    // Check data-vite-dev-id (Vite injects this on <style> tags)
    const viteDevId = ownerNode.getAttribute('data-vite-dev-id');
    if (viteDevId) {
      // data-vite-dev-id contains absolute path like /Users/foo/project/src/App.css
      // Extract from /src/ onwards
      const srcIdx = viteDevId.indexOf('/src/');
      return srcIdx >= 0 ? viteDevId.substring(srcIdx + 1) : viteDevId;
    }

    return 'inline';
  }

  /**
   * Try to find the line number where a CSS selector is defined in the source file.
   * Reads CSS from the <style> tag's textContent (most reliable for Vite),
   * falls back to fetching from dev server.
   */
  async function findCSSLine(file: string, selectorText: string, sheet?: CSSStyleSheet): Promise<number | null> {
    if (file === 'inline' || !file) return null;

    try {
      let source = cssFileCache.get(file);
      if (source === undefined) {
        // Primary: read CSS directly from the <style> tag's textContent
        // This is the actual CSS source that Vite injected
        if (sheet?.ownerNode) {
          const textContent = (sheet.ownerNode as HTMLElement).textContent;
          if (textContent && textContent.trim().length > 0) {
            source = textContent;
            cssFileCache.set(file, source);
          }
        }

        // Fallback: fetch from Vite dev server
        if (!source) {
          const fetchUrl = `/${file}?raw`;
          const resp = await fetch(fetchUrl);
          if (resp.ok) {
            let text = await resp.text();
            // Vite ?raw returns JS module: export default "..." — extract the string
            const match = text.match(/^export\s+default\s+"([\s\S]*)";\s*$/);
            if (match) {
              try {
                // Parse the escaped JS string literal
                text = JSON.parse(`"${match[1]}"`);
              } catch { /* use as-is */ }
            }
            source = text;
            cssFileCache.set(file, source);
          } else {
            cssFileCache.set(file, '');
            return null;
          }
        }
      }

      if (!source) return null;

      // Search for the selector in the CSS source
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(selectorText)) {
          return i + 1; // 1-based line numbers
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Collapse longhand CSS properties into shorthand equivalents.
   * Groups results by selector+file, detects when all longhands of a shorthand
   * are present, and replaces them with a single shorthand entry.
   */
  function collapseToShorthands(
    results: { property: string; value: string; selector: string; file: string; line?: number | null }[],
    el: Element
  ): { property: string; value: string; selector: string; file: string; line?: number | null }[] {
    // Group by selector+file
    const groups = new Map<string, typeof results>();
    for (const r of results) {
      const key = `${r.selector}|||${r.file}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const collapsed: typeof results = [];
    const computed = window.getComputedStyle(el);

    for (const [, groupItems] of groups) {
      const propSet = new Set(groupItems.map(r => r.property));
      const consumed = new Set<string>();

      // Check each shorthand — collapse when ≥2 longhands are present
      // (browsers may include extra longhands we don't track)
      // Process more specific shorthands first (longer names), then broader ones
      const sortedShorthands = Object.entries(SHORTHAND_MAP)
        .sort((a, b) => b[0].length - a[0].length);

      for (const [shorthand, longhands] of sortedShorthands) {
        const presentLonghands = longhands.filter(lh => propSet.has(lh) && !consumed.has(lh));
        if (presentLonghands.length >= 2) {
          // Enough longhands present → collapse to shorthand
          const shorthandValue = (computed as any)[shorthand] || presentLonghands.map(lh => {
            const item = groupItems.find(r => r.property === lh);
            return item?.value || '';
          }).join(' ');

          const firstItem = groupItems.find(r => presentLonghands.includes(r.property))!;
          collapsed.push({
            property: shorthand,
            value: shorthandValue,
            selector: firstItem.selector,
            file: firstItem.file,
            line: firstItem.line,
          });

          for (const lh of presentLonghands) consumed.add(lh);
        }
      }

      // Add remaining non-consumed properties
      for (const item of groupItems) {
        if (!consumed.has(item.property)) {
          collapsed.push(item);
        }
      }
    }

    // Second pass: collapse sub-shorthands into parent shorthands
    // e.g. border-width + border-style + border-color + border-image → border
    const PARENT_SHORTHANDS: Record<string, string[]> = {
      'border': ['border-width', 'border-style', 'border-color', 'border-image'],
    };

    const groups2 = new Map<string, typeof collapsed>();
    for (const r of collapsed) {
      const key = `${r.selector}|||${r.file}`;
      if (!groups2.has(key)) groups2.set(key, []);
      groups2.get(key)!.push(r);
    }

    const finalCollapsed: typeof collapsed = [];
    for (const [, groupItems] of groups2) {
      const propSet = new Set(groupItems.map(r => r.property));
      const consumed2 = new Set<string>();

      for (const [parent, subShorthands] of Object.entries(PARENT_SHORTHANDS)) {
        const present = subShorthands.filter(s => propSet.has(s));
        if (present.length >= 2) {
          const parentValue = (computed as any)[parent] || present.map(s => {
            const item = groupItems.find(r => r.property === s);
            return item?.value || '';
          }).join(' ');

          const firstItem = groupItems.find(r => present.includes(r.property))!;
          finalCollapsed.push({
            property: parent,
            value: parentValue,
            selector: firstItem.selector,
            file: firstItem.file,
            line: firstItem.line,
          });
          for (const s of present) consumed2.add(s);
        }
      }

      for (const item of groupItems) {
        if (!consumed2.has(item.property)) {
          finalCollapsed.push(item);
        }
      }
    }

    return finalCollapsed;
  }

  async function getCSSSource(
    selector: string,
    properties?: string[]
  ): Promise<{ property: string; value: string; selector: string; file: string; line?: number | null }[] | ErrorResult> {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { error: `Element not found: ${selector}` };
      }

      const results: { property: string; value: string; selector: string; file: string; line?: number | null }[] = [];

      // Iterate through all stylesheets
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        let rules: CSSRuleList;

        try {
          rules = sheet.cssRules || sheet.rules;
        } catch (e) {
          // Cross-origin stylesheet, skip
          continue;
        }

        const file = getStyleSheetFile(sheet);

        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSStyleRule;
          if (!rule.selectorText) continue;

          try {
            if (!el.matches(rule.selectorText)) continue;
          } catch {
            continue;
          }

          // Resolve line number for this rule's selector
          const line = await findCSSLine(file, rule.selectorText, sheet);

          // This rule matches the element
          const style = rule.style;
          for (let k = 0; k < style.length; k++) {
            const prop = style[k];

            // Filter by properties if specified
            if (properties && properties.length > 0 && !properties.includes(prop)) {
              continue;
            }

            results.push({
              property: prop,
              value: style.getPropertyValue(prop),
              selector: rule.selectorText,
              file,
              line,
            });
          }
        }
      }

      // Collapse longhands to shorthands (skip when explicit properties filter is provided)
      if (!properties || properties.length === 0) {
        return collapseToShorthands(results, el);
      }

      return results;
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Viewport ======
  // Note: Actual viewport resizing is done by the outer webview page (PreviewManager)
  // which resizes the <iframe> element. This ensures window.innerWidth/innerHeight
  // change and @media queries fire correctly. This bridge method is kept as a
  // no-op for backwards compatibility — the real work happens in the extension.
  function setViewport(width: number, height: number): ActionResult {
    try {
      // Clean up any old CSS-based constraints from previous implementation
      document.documentElement.style.removeProperty('width');
      document.documentElement.style.removeProperty('height');
      document.documentElement.style.removeProperty('overflow');

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ====== Console Logs ======
  function getConsoleLogs(level?: string, limit?: number): ConsoleLog[] {
    let filtered = consoleLogs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  function clearConsoleLogs(): void {
    consoleLogs.length = 0;
  }

  // ====== Screenshots ======
  async function captureScreenshot(
    format: 'jpeg' | 'png' = 'jpeg',
    quality: number = 80,
    selector?: string,
    highlight?: string[],
    highlightColor: string = 'rgba(255, 0, 0, 0.3)'
  ): Promise<string> {
    try {
      // Check if html2canvas is available
      if (typeof (window as any).html2canvas === 'undefined') {
        throw new Error('html2canvas not loaded');
      }

      // Inject highlight overlays if requested
      const overlays: HTMLElement[] = [];
      if (highlight && highlight.length > 0) {
        for (const sel of highlight) {
          const elements = document.querySelectorAll(sel);
          elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.left = `${rect.left + window.scrollX}px`;
            overlay.style.top = `${rect.top + window.scrollY}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.backgroundColor = highlightColor;
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '999999';
            overlay.setAttribute('data-ae-highlight', 'true');
            document.body.appendChild(overlay);
            overlays.push(overlay);
          });
        }
      }

      const canvas = await (window as any).html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
      });

      // Remove highlight overlays
      for (const overlay of overlays) {
        overlay.remove();
      }

      // Crop to element if selector provided
      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          // html2canvas renders at devicePixelRatio scale, so we must
          // convert CSS pixel coordinates to canvas pixel coordinates
          const dpr = window.devicePixelRatio || 1;
          const padding = 10 * dpr;
          const rawX = (rect.left + window.scrollX) * dpr - padding;
          const rawY = (rect.top + window.scrollY) * dpr - padding;
          const rawW = rect.width * dpr + padding * 2;
          const rawH = rect.height * dpr + padding * 2;
          const sx = Math.max(0, rawX);
          const sy = Math.max(0, rawY);
          // Adjust width/height when start position was clamped to 0
          const sw = Math.min(canvas.width - sx, rawW - (sx - rawX));
          const sh = Math.min(canvas.height - sy, rawH - (sy - rawY));

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = sw;
          cropCanvas.height = sh;
          const ctx = cropCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
            return cropCanvas.toDataURL(`image/${format}`, quality / 100);
          }
        }
      }

      return canvas.toDataURL(`image/${format}`, quality / 100);
    } catch (error) {
      console.error('[AI Eye] Screenshot failed:', error);
      throw error;
    }
  }

  // ====== HMR Status ======
  interface HMRUpdate {
    timestamp: number;
    file: string;
    type: string;
    latency?: number;
  }

  interface ExtendedHMRStatus extends HMRStatus {
    updates: HMRUpdate[];
    totalUpdates: number;
    averageLatency: number;
    connectionId?: number;
  }

  let hmrStatus: ExtendedHMRStatus = {
    connected: false,
    lastUpdate: null,
    errors: [],
    updates: [],
    totalUpdates: 0,
    averageLatency: 0,
  };

  let updateStartTime = 0;

  // Listen for HMR events (Vite-specific)
  if ((import.meta as any).hot) {
    const hot = (import.meta as any).hot;

    hmrStatus.connected = true;

    hot.on('vite:beforeUpdate', () => {
      updateStartTime = Date.now();
    });

    hot.on('vite:afterUpdate', () => {
      if (updateStartTime > 0) {
        const latency = Date.now() - updateStartTime;
        const totalLatency = hmrStatus.averageLatency * hmrStatus.totalUpdates + latency;
        hmrStatus.totalUpdates++;
        hmrStatus.averageLatency = totalLatency / hmrStatus.totalUpdates;
        hmrStatus.lastUpdate = Date.now();
        updateStartTime = 0;
      }
    });

    hot.on('vite:error', (payload: any) => {
      const error = {
        message: payload.err?.message || 'Unknown error',
        stack: payload.err?.stack,
        timestamp: Date.now(),
      };

      hmrStatus.errors.push(error);

      // Keep only last 10 errors
      if (hmrStatus.errors.length > 10) {
        hmrStatus.errors.shift();
      }

      console.error('[AI Eye HMR] Error:', error.message);
    });

    hot.on('vite:ws:disconnect', () => {
      hmrStatus.connected = false;
      console.warn('[AI Eye HMR] Disconnected from dev server');
    });

    hot.on('vite:ws:connect', () => {
      hmrStatus.connected = true;
      console.log('[AI Eye HMR] Reconnected to dev server');
    });
  }

  // Listen for custom AI Eye events from Vite plugin
  if (typeof window !== 'undefined' && (import.meta as any).hot) {
    const hot = (import.meta as any).hot;

    hot.on('ae:connected', (data: any) => {
      hmrStatus.connected = true;
      hmrStatus.connectionId = data.connectionId;
      console.log(`[AI Eye] Connected (ID: ${data.connectionId})`);
    });

    hot.on('ae:disconnected', (data: any) => {
      console.log(`[AI Eye] Disconnected (ID: ${data.connectionId})`);
    });

    hot.on('ae:hmr-update', (data: any) => {
      const update: HMRUpdate = {
        timestamp: data.timestamp || Date.now(),
        file: data.file,
        type: data.type,
        latency: updateStartTime > 0 ? Date.now() - updateStartTime : undefined,
      };

      hmrStatus.updates.push(update);
      hmrStatus.lastUpdate = update.timestamp;

      // Keep only last 20 updates
      if (hmrStatus.updates.length > 20) {
        hmrStatus.updates.shift();
      }

      console.log(`[AI Eye HMR] Updated: ${data.file} (${data.type})`);
    });

    hot.on('ae:error', (data: any) => {
      const error = {
        message: data.error?.message || 'Unknown error',
        stack: data.error?.stack,
        timestamp: data.timestamp || Date.now(),
      };

      hmrStatus.errors.push(error);

      if (hmrStatus.errors.length > 10) {
        hmrStatus.errors.shift();
      }
    });
  }

  function getHMRStatus(): ExtendedHMRStatus {
    return {
      ...hmrStatus,
      // Return copy of arrays to prevent mutation
      errors: [...hmrStatus.errors],
      updates: [...hmrStatus.updates],
    };
  }

  function clearHMRErrors(): void {
    hmrStatus.errors = [];
  }

  // ====== Style Diff ======
  async function getStyleDiff(
    selector: string,
    action: 'hover' | 'click' | 'focus' | 'blur' | 'addClass' | 'removeClass' | 'toggleClass',
    actionArg?: string,
    properties?: string[]
  ): Promise<any> {
    try {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        return { error: `Element not found: ${selector}` };
      }

      // Default ~40 common properties to watch
      const propsToWatch = properties || [
        'display', 'visibility', 'opacity', 'position', 'top', 'right', 'bottom', 'left',
        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'color', 'background-color', 'background-image', 'background',
        'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'border-radius', 'box-shadow', 'text-shadow',
        'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-transform',
        'transform', 'transition', 'cursor', 'overflow', 'z-index',
        'outline', 'filter', 'backdrop-filter',
      ];

      // Capture before state
      const computedBefore = window.getComputedStyle(el);
      const beforeStyles: Record<string, string> = {};
      for (const prop of propsToWatch) {
        beforeStyles[prop] = computedBefore.getPropertyValue(prop);
      }
      const rectBefore = el.getBoundingClientRect();
      const classesBefore = new Set(el.classList);

      // Perform the action
      switch (action) {
        case 'hover':
          el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          break;
        case 'click':
          el.click();
          break;
        case 'focus':
          el.focus();
          break;
        case 'blur':
          el.blur();
          break;
        case 'addClass':
          if (actionArg) el.classList.add(actionArg);
          break;
        case 'removeClass':
          if (actionArg) el.classList.remove(actionArg);
          break;
        case 'toggleClass':
          if (actionArg) el.classList.toggle(actionArg);
          break;
      }

      // Wait for styles to update (rAF + microtask)
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      // Capture after state
      const computedAfter = window.getComputedStyle(el);
      const afterStyles: Record<string, string> = {};
      for (const prop of propsToWatch) {
        afterStyles[prop] = computedAfter.getPropertyValue(prop);
      }
      const rectAfter = el.getBoundingClientRect();
      const classesAfter = new Set(el.classList);

      // Compute diff
      const changes: { property: string; before: string; after: string }[] = [];
      for (const prop of propsToWatch) {
        if (beforeStyles[prop] !== afterStyles[prop]) {
          changes.push({
            property: prop,
            before: beforeStyles[prop],
            after: afterStyles[prop],
          });
        }
      }

      // Class changes
      const added = [...classesAfter].filter(c => !classesBefore.has(c));
      const removed = [...classesBefore].filter(c => !classesAfter.has(c));

      return {
        changes,
        boundingBox: {
          before: { x: rectBefore.x, y: rectBefore.y, width: rectBefore.width, height: rectBefore.height },
          after: { x: rectAfter.x, y: rectAfter.y, width: rectAfter.width, height: rectAfter.height },
        },
        classesChanged: { added, removed },
        note: action === 'hover'
          ? 'JS mouseenter/mouseover events do NOT trigger CSS :hover pseudo-class (browser security). Only real cursor movement (Playwright mode) activates :hover styles. Class-based actions (addClass/removeClass/toggleClass) work reliably for style comparison.'
          : undefined,
      };
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Component Tree ======
  function getComponentTree(
    selector?: string,
    maxDepth: number = 10,
    framework: string = 'auto'
  ): any {
    try {
      const rootEl = selector
        ? document.querySelector(selector)
        : document.getElementById('root') || document.getElementById('app') || document.body;

      if (!rootEl) {
        return { error: `Root element not found${selector ? `: ${selector}` : ''}` };
      }

      // Detect framework
      const detectedFramework = framework === 'auto' ? detectFramework(rootEl) : framework;

      switch (detectedFramework) {
        case 'react':
          return { framework: 'react', tree: getReactTree(rootEl, maxDepth) };
        case 'vue':
          return { framework: 'vue', tree: getVueTree(rootEl, maxDepth) };
        case 'svelte':
          return { framework: 'svelte', note: 'Svelte detected but has limited runtime introspection. Showing DOM tree.', tree: getDOMTree(rootEl, maxDepth) };
        default:
          return { framework: 'unknown', note: 'No supported framework detected. Showing DOM tree.', tree: getDOMTree(rootEl, maxDepth) };
      }
    } catch (error) {
      return { error: String(error) };
    }
  }

  function detectFramework(el: Element): string {
    // Check root element and first 50 descendants for framework markers
    const candidates = [el, ...Array.from(el.querySelectorAll('*')).slice(0, 50)];
    for (const candidate of candidates) {
      const keys = Object.keys(candidate);
      if (keys.some(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))) {
        return 'react';
      }
      if ((candidate as any).__vue_app__ || (candidate as any).__vue__) {
        return 'vue';
      }
      if (keys.some(k => k.startsWith('__svelte'))) {
        return 'svelte';
      }
    }
    return 'unknown';
  }

  function sanitizeForJSON(obj: any, depth: number = 2): any {
    if (depth <= 0) return '[max depth]';
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return typeof obj === 'function' ? '[function]' : obj;
    if (Array.isArray(obj)) return obj.slice(0, 10).map(item => sanitizeForJSON(item, depth - 1));

    const result: Record<string, any> = {};
    const skipKeys = new Set(['children', '_owner', '_store', 'ref', 'key', '_self', '_source', '__proto__']);
    let count = 0;
    for (const key of Object.keys(obj)) {
      if (count >= 20) { result['...'] = `${Object.keys(obj).length - 20} more keys`; break; }
      if (skipKeys.has(key)) continue;
      try {
        result[key] = sanitizeForJSON(obj[key], depth - 1);
      } catch {
        result[key] = '[error reading]';
      }
      count++;
    }
    return result;
  }

  function getReactTree(rootEl: Element, maxDepth: number): any {
    // Find the React fiber key — check root element first, then its children
    // React 18+ with createRoot attaches fibers to child elements, not the container
    let fiberEl: Element | null = null;
    let fiberKey: string | undefined;

    // Check the root element itself
    fiberKey = Object.keys(rootEl).find(
      k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    if (fiberKey) {
      fiberEl = rootEl;
    }

    // Check via _reactRootContainer (React 17 ReactDOM.render)
    if (!fiberKey && (rootEl as any)._reactRootContainer) {
      const container = (rootEl as any)._reactRootContainer;
      const internalRoot = container._internalRoot || container;
      if (internalRoot?.current) {
        const rootFiber = internalRoot.current;
        return walkFiberTree(rootFiber, maxDepth);
      }
    }

    // Check via __reactContainer$ (React 18 createRoot)
    if (!fiberKey) {
      const containerKey = Object.keys(rootEl).find(k => k.startsWith('__reactContainer$'));
      if (containerKey) {
        const rootFiber = (rootEl as any)[containerKey];
        if (rootFiber) {
          return walkFiberTree(rootFiber, maxDepth);
        }
      }
    }

    // Search immediate children for fiber
    if (!fiberKey) {
      for (const child of Array.from(rootEl.children).slice(0, 20)) {
        fiberKey = Object.keys(child).find(
          k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
        );
        if (fiberKey) {
          fiberEl = child;
          break;
        }
      }
    }

    if (!fiberKey || !fiberEl) {
      return { error: 'React fiber not found on root element or its children' };
    }

    const rootFiber = (fiberEl as any)[fiberKey];
    if (!rootFiber) {
      return { error: 'React fiber is null' };
    }

    // Walk up to find the top-level fiber (component root)
    let topFiber = rootFiber;
    while (topFiber.return) {
      topFiber = topFiber.return;
    }

    return walkFiberTree(topFiber, maxDepth);
  }

  function walkFiberTree(rootFiber: any, maxDepth: number): any {

    function walkFiber(fiber: any, depth: number): any {
      if (!fiber || depth > maxDepth) return null;

      const isComponent = typeof fiber.type === 'function' || typeof fiber.type === 'object';
      const name = fiber.type?.displayName || fiber.type?.name || (typeof fiber.type === 'string' ? fiber.type : null);

      const node: any = {};

      if (name) node.name = name;
      node.type = isComponent ? 'component' : 'element';

      // Extract props (only for components)
      if (isComponent && fiber.memoizedProps) {
        node.props = sanitizeForJSON(fiber.memoizedProps, 2);
      }

      // Extract hooks state (for function components)
      if (isComponent && fiber.memoizedState) {
        const states: any[] = [];
        let stateNode = fiber.memoizedState;
        let stateCount = 0;
        while (stateNode && stateCount < 10) {
          if (stateNode.queue !== undefined || stateNode.memoizedState !== undefined) {
            const val = stateNode.memoizedState;
            if (val !== undefined && val !== null && typeof val !== 'function') {
              states.push(sanitizeForJSON(val, 2));
            }
          }
          stateNode = stateNode.next;
          stateCount++;
        }
        if (states.length > 0) node.state = states;
      }

      // Walk children via fiber linked list
      const children: any[] = [];
      let child = fiber.child;
      while (child) {
        const childNode = walkFiber(child, depth + 1);
        if (childNode) children.push(childNode);
        child = child.sibling;
      }

      if (children.length > 0) node.children = children;

      return node;
    }

    return walkFiber(rootFiber, 0);
  }

  function getVueTree(rootEl: Element, maxDepth: number): any {
    const app = (rootEl as any).__vue_app__ || (rootEl as any).__vue__;

    if (!app) {
      return { error: 'Vue instance not found on root element' };
    }

    // Vue 3
    if ((rootEl as any).__vue_app__) {
      const rootComponent = app._instance;
      if (!rootComponent) return { error: 'Vue root component not found' };

      function walkVue3(instance: any, depth: number): any {
        if (!instance || depth > maxDepth) return null;

        const name = instance.type?.name || instance.type?.__name || 'Anonymous';
        const node: any = { name, type: 'component' };

        // Props
        if (instance.props && Object.keys(instance.props).length > 0) {
          node.props = sanitizeForJSON(instance.props, 2);
        }

        // Data/state
        if (instance.setupState && Object.keys(instance.setupState).length > 0) {
          node.state = sanitizeForJSON(instance.setupState, 2);
        }

        // Children
        const children: any[] = [];
        const subTree = instance.subTree;
        if (subTree?.component) {
          const child = walkVue3(subTree.component, depth + 1);
          if (child) children.push(child);
        }
        if (subTree?.children && Array.isArray(subTree.children)) {
          for (const child of subTree.children.slice(0, 20)) {
            if (child?.component) {
              const node = walkVue3(child.component, depth + 1);
              if (node) children.push(node);
            }
          }
        }

        if (children.length > 0) node.children = children;
        return node;
      }

      return walkVue3(rootComponent, 0);
    }

    // Vue 2
    return { note: 'Vue 2 detected — limited introspection', name: 'VueApp' };
  }

  function getDOMTree(rootEl: Element, maxDepth: number): any {
    function walk(el: Element, depth: number): any {
      if (depth > maxDepth) return null;
      const node: any = { tag: el.tagName.toLowerCase() };
      const id = el.getAttribute('id');
      if (id) node.id = id;
      const cls = el.className;
      if (cls && typeof cls === 'string') node.class = cls;

      const children: any[] = [];
      for (let i = 0; i < Math.min(el.children.length, 20); i++) {
        const child = walk(el.children[i], depth + 1);
        if (child) children.push(child);
      }
      if (children.length > 0) node.children = children;
      return node;
    }
    return walk(rootEl, 0);
  }

  // ====== Accessibility Audit ======
  async function auditAccessibility(
    selector?: string,
    tags?: string[]
  ): Promise<any> {
    try {
      // Load axe-core if not already loaded
      if (!(window as any).axe) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load axe-core from CDN'));
          document.head.appendChild(script);
        });
      }

      const axe = (window as any).axe;
      if (!axe) {
        return { error: 'axe-core failed to initialize' };
      }

      // Configure context and options
      const context = selector ? document.querySelector(selector) || document : document;
      const options: any = {};

      if (tags && tags.length > 0) {
        options.runOnly = { type: 'tag', values: tags };
      }

      // Run the audit with timeout
      const result = await Promise.race([
        axe.run(context, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Accessibility audit timed out (30s)')), 30000)),
      ]);

      // Format results — limit nodes per violation and truncate HTML
      const violations = (result as any).violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.slice(0, 5).map((n: any) => ({
          html: n.html?.substring(0, 200),
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      }));

      const passes = (result as any).passes?.length || 0;
      const incomplete = (result as any).incomplete?.length || 0;

      return {
        violations,
        passCount: passes,
        incompleteCount: incomplete,
        summary: `${violations.length} violations, ${passes} passes, ${incomplete} incomplete`,
      };
    } catch (error) {
      return { error: String(error) };
    }
  }

  // ====== Measurement (v6) ======

  function measureElement(selectorA: string, selectorB: string) {
    const elA = document.querySelector(selectorA);
    const elB = document.querySelector(selectorB);
    if (!elA) return { error: `Element not found: ${selectorA}` };
    if (!elB) return { error: `Element not found: ${selectorB}` };

    const a = elA.getBoundingClientRect();
    const b = elB.getBoundingClientRect();

    const top = b.top - a.bottom;
    const bottom = a.top - b.bottom;
    const left = b.left - a.right;
    const right = a.left - b.right;

    const horizontal = Math.max(0, Math.max(left, right));
    const vertical = Math.max(0, Math.max(top, bottom));

    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const overlap = overlapX > 0 && overlapY > 0;

    return {
      elementA: { selector: selectorA, boundingBox: { x: Math.round(a.x), y: Math.round(a.y), width: Math.round(a.width), height: Math.round(a.height) } },
      elementB: { selector: selectorB, boundingBox: { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) } },
      distances: {
        top: Math.round(top),
        right: Math.round(right),
        bottom: Math.round(bottom),
        left: Math.round(left),
        horizontal: Math.round(horizontal),
        vertical: Math.round(vertical),
      },
      overlap,
      overlapArea: overlap ? { width: Math.round(overlapX), height: Math.round(overlapY) } : undefined,
    };
  }

  function measureSpacing(selector: string) {
    const el = document.querySelector(selector);
    if (!el) return { error: `Element not found: ${selector}` };

    const computed = window.getComputedStyle(el);

    return {
      padding: {
        top: parseFloat(computed.paddingTop) || 0,
        right: parseFloat(computed.paddingRight) || 0,
        bottom: parseFloat(computed.paddingBottom) || 0,
        left: parseFloat(computed.paddingLeft) || 0,
      },
      margin: {
        top: parseFloat(computed.marginTop) || 0,
        right: parseFloat(computed.marginRight) || 0,
        bottom: parseFloat(computed.marginBottom) || 0,
        left: parseFloat(computed.marginLeft) || 0,
      },
      borderWidth: {
        top: parseFloat(computed.borderTopWidth) || 0,
        right: parseFloat(computed.borderRightWidth) || 0,
        bottom: parseFloat(computed.borderBottomWidth) || 0,
        left: parseFloat(computed.borderLeftWidth) || 0,
      },
      gap: {
        row: parseFloat(computed.rowGap) || 0,
        column: parseFloat(computed.columnGap) || 0,
      },
      boxSizing: computed.boxSizing,
    };
  }

  function getComputedLayout(selector: string) {
    const el = document.querySelector(selector);
    if (!el) return { error: `Element not found: ${selector}` };

    const computed = window.getComputedStyle(el);

    const children: { selector: string; width: number; height: number }[] = [];
    for (let i = 0; i < el.children.length && i < 50; i++) {
      const child = el.children[i];
      const rect = child.getBoundingClientRect();
      let childSel = child.tagName.toLowerCase();
      if (child.id) childSel = `#${child.id}`;
      else if (child.className && typeof child.className === 'string') {
        const cls = child.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (cls) childSel += `.${cls}`;
      }
      children.push({
        selector: childSel,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }

    return {
      layout: {
        display: computed.display,
        flexDirection: computed.flexDirection,
        flexWrap: computed.flexWrap,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        alignContent: computed.alignContent,
        gap: computed.gap,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateRows: computed.gridTemplateRows,
        gridAutoFlow: computed.gridAutoFlow,
        position: computed.position,
        overflow: computed.overflow,
      },
      children: {
        count: el.children.length,
        sizes: children,
      },
    };
  }

  // ====== Palette (v6) ======

  function getPalette(selector?: string, limit: number = 20) {
    const root = selector ? document.querySelector(selector) : document.body;
    if (!root) return { error: `Element not found: ${selector}` };

    const colorMap = new Map<string, { count: number; properties: string[] }>();

    function rgbToHex(rgb: string): string | null {
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }

    function addColor(value: string, property: string) {
      if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return;
      const hex = rgbToHex(value);
      if (!hex) return;
      const existing = colorMap.get(hex);
      if (existing) {
        existing.count++;
        if (!existing.properties.includes(property)) existing.properties.push(property);
      } else {
        colorMap.set(hex, { count: 1, properties: [property] });
      }
    }

    const elements = root.querySelectorAll('*');
    let totalElements = 0;
    for (let i = 0; i < elements.length && i < 500; i++) {
      const el = elements[i] as HTMLElement;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      totalElements++;
      const computed = window.getComputedStyle(el);
      addColor(computed.color, 'color');
      addColor(computed.backgroundColor, 'backgroundColor');
      addColor(computed.borderColor, 'borderColor');
    }

    const colors = Array.from(colorMap.entries())
      .map(([hex, data]) => ({
        hex,
        rgb: hex.replace(/^#/, '').match(/.{2}/g)!.map(h => parseInt(h, 16)).join(', '),
        count: data.count,
        properties: data.properties,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { colors, totalElements };
  }

  // ====== HMR Wait (v6) ======

  async function waitForHMR(timeout: number = 10000): Promise<{ updated: boolean; latency?: number; timedOut?: boolean }> {
    const hmrStatus = getHMRStatus();
    const initialTimestamp = hmrStatus.lastUpdate;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const current = getHMRStatus();
      if (current.lastUpdate !== initialTimestamp) {
        return { updated: true, latency: Date.now() - startTime };
      }
    }

    return { updated: false, timedOut: true };
  }

  // ====== Public API ======
  const AIEyeAPI: AIEyeAPI & { clearHMRErrors: () => void; getStyleDiff: typeof getStyleDiff; getComponentTree: typeof getComponentTree; auditAccessibility: typeof auditAccessibility } = {
    // Inspection
    elementAtPoint,
    inspectElement,
    batchInspect,
    getPageStructure,
    findElements,
    getElementSource,

    // Interaction
    clickElement,
    hoverElement,
    typeText,
    scrollTo,

    // CSS Source
    getCSSSource,

    // Viewport
    setViewport,

    // Network
    getNetworkRequests,
    clearNetworkRequests,

    // Debugging
    consoleLogs,
    getConsoleLogs,
    clearConsoleLogs,

    // Screenshots
    captureScreenshot,

    // HMR
    getHMRStatus,
    clearHMRErrors,

    // Style Diff (v4)
    getStyleDiff,

    // Component Tree (v4)
    getComponentTree,

    // Accessibility Audit (v4)
    auditAccessibility,

    // Measurement (v6)
    measureElement,
    measureSpacing,
    getComputedLayout,

    // Palette (v6)
    getPalette,

    // HMR Wait (v6)
    waitForHMR,

    // Metadata
    version: '1.1.0',
    ready: true,
  };

  // Expose API
  (window as any).__AIEYE__ = AIEyeAPI;

  console.log('[AI Eye] Bridge initialized successfully ✨');
  console.log('[AI Eye] API available at window.__AIEYE__');

  // Notify parent window (if in iframe)
  try {
    window.parent.postMessage(
      {
        type: 'aieye:ready',
        version: '1.0.0',
      },
      '*'
    );
  } catch (error) {
    // Ignore cross-origin errors
  }

  // Listen for messages from parent (for cross-origin communication)
  window.addEventListener('message', async (event) => {
    const message = event.data;

    // Only handle aieye messages
    if (!message || typeof message !== 'object' || !message.type?.startsWith('aieye:')) {
      return;
    }

    try {
      let result: any;

      switch (message.type) {
        case 'aieye:eval':
          // Execute arbitrary code
          result = eval(message.code);

          // If result is a promise, await it
          if (result && typeof result.then === 'function') {
            result = await result;
          }
          break;

        case 'aieye:call':
          // Call a method on the API
          const api = (window as any).__AIEYE__;
          if (!api || !api[message.method]) {
            throw new Error(`Method not found: ${message.method}`);
          }
          result = await api[message.method](...(message.args || []));
          break;

        default:
          return; // Ignore unknown message types
      }

      // Send response back to parent
      window.parent.postMessage(
        {
          type: 'aieye:response',
          id: message.id,
          result,
        },
        '*'
      );
    } catch (error: any) {
      // Send error response
      window.parent.postMessage(
        {
          type: 'aieye:response',
          id: message.id,
          error: error.message || String(error),
        },
        '*'
      );
    }
  });
})();

// Export to ensure this is treated as an ES module
export {};
