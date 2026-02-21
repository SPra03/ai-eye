/**
 * VisionCraft Bridge Script
 * Runs inside the user's application to provide inspection and interaction APIs
 * This is injected into the page and provides the window.__VISIONCRAFT__ interface
 */

interface VisionCraftAPI {
  // Core inspection
  inspectElement: (selector: string) => ElementInspectionResult | ErrorResult;
  getPageStructure: (maxDepth?: number) => PageStructureNode;
  findElements: (query: string, mode?: 'text' | 'role' | 'css') => ElementSearchResult[];
  getElementSource: (selector: string) => SourceLocation | ErrorResult;

  // Interaction
  clickElement: (selector: string) => ActionResult;
  typeText: (selector: string, text: string) => ActionResult;
  scrollTo: (x: number, y: number) => ActionResult;

  // Debugging
  consoleLogs: ConsoleLog[];
  getConsoleLogs: (level?: string, limit?: number) => ConsoleLog[];
  clearConsoleLogs: () => void;

  // Screenshots
  captureScreenshot: (format?: 'jpeg' | 'png', quality?: number) => Promise<string>;

  // HMR status
  getHMRStatus: () => HMRStatus;

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

// Initialize VisionCraft Bridge
// This runs as an ES module with full access to import.meta.hot
(function initVisionCraft() {
  'use strict';

  // Check if already initialized
  if ((window as any).__VISIONCRAFT__) {
    console.log('[VisionCraft] Bridge already initialized');
    return;
  }

  console.log('[VisionCraft] Initializing bridge script...');

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
      const sourceFile = el.getAttribute('data-vc-source');
      const sourceLine = el.getAttribute('data-vc-line');
      const sourceCol = el.getAttribute('data-vc-col');

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

  // ====== Get Element Source ======
  function getElementSource(selector: string): SourceLocation | ErrorResult {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return { error: `Element not found: ${selector}` };
      }

      const file = el.getAttribute('data-vc-source');
      const line = el.getAttribute('data-vc-line');
      const col = el.getAttribute('data-vc-col');

      // Check if source mapping attributes exist
      if (!file || !line || !col) {
        return {
          error: 'Source mapping not available for this element. ' +
                 'Ensure @visioncraft/vite-plugin or @visioncraft/babel-plugin is configured.'
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
        source: el.getAttribute('data-vc-source'),
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
    mode: 'text' | 'role' | 'css' = 'css'
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

      return elements.map((el, index) => ({
        selector: generateSelector(el, index),
        source: el.getAttribute('data-vc-source'),
        text: (el as HTMLElement).innerText?.substring(0, 50),
        role: el.getAttribute('role'),
      }));
    } catch (error) {
      console.error('[VisionCraft] Error finding elements:', error);
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

  function scrollTo(x: number, y: number): ActionResult {
    try {
      window.scrollTo(x, y);
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
    quality: number = 80
  ): Promise<string> {
    try {
      // Check if html2canvas is available
      if (typeof (window as any).html2canvas === 'undefined') {
        throw new Error('html2canvas not loaded');
      }

      const canvas = await (window as any).html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
      });

      return canvas.toDataURL(`image/${format}`, quality / 100);
    } catch (error) {
      console.error('[VisionCraft] Screenshot failed:', error);
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

      console.error('[VisionCraft HMR] Error:', error.message);
    });

    hot.on('vite:ws:disconnect', () => {
      hmrStatus.connected = false;
      console.warn('[VisionCraft HMR] Disconnected from dev server');
    });

    hot.on('vite:ws:connect', () => {
      hmrStatus.connected = true;
      console.log('[VisionCraft HMR] Reconnected to dev server');
    });
  }

  // Listen for custom VisionCraft events from Vite plugin
  if (typeof window !== 'undefined' && (import.meta as any).hot) {
    const hot = (import.meta as any).hot;

    hot.on('vc:connected', (data: any) => {
      hmrStatus.connected = true;
      hmrStatus.connectionId = data.connectionId;
      console.log(`[VisionCraft] Connected (ID: ${data.connectionId})`);
    });

    hot.on('vc:disconnected', (data: any) => {
      console.log(`[VisionCraft] Disconnected (ID: ${data.connectionId})`);
    });

    hot.on('vc:hmr-update', (data: any) => {
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

      console.log(`[VisionCraft HMR] Updated: ${data.file} (${data.type})`);
    });

    hot.on('vc:error', (data: any) => {
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

  // ====== Public API ======
  const VisionCraftAPI: VisionCraftAPI & { clearHMRErrors: () => void } = {
    // Inspection
    inspectElement,
    getPageStructure,
    findElements,
    getElementSource,

    // Interaction
    clickElement,
    typeText,
    scrollTo,

    // Debugging
    consoleLogs,
    getConsoleLogs,
    clearConsoleLogs,

    // Screenshots
    captureScreenshot,

    // HMR
    getHMRStatus,
    clearHMRErrors,

    // Metadata
    version: '1.0.0',
    ready: true,
  };

  // Expose API
  (window as any).__VISIONCRAFT__ = VisionCraftAPI;

  console.log('[VisionCraft] Bridge initialized successfully ✨');
  console.log('[VisionCraft] API available at window.__VISIONCRAFT__');

  // Notify parent window (if in iframe)
  try {
    window.parent.postMessage(
      {
        type: 'visioncraft:ready',
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

    // Only handle visioncraft messages
    if (!message || typeof message !== 'object' || !message.type?.startsWith('visioncraft:')) {
      return;
    }

    try {
      let result: any;

      switch (message.type) {
        case 'visioncraft:eval':
          // Execute arbitrary code
          result = eval(message.code);

          // If result is a promise, await it
          if (result && typeof result.then === 'function') {
            result = await result;
          }
          break;

        case 'visioncraft:call':
          // Call a method on the API
          const api = (window as any).__VISIONCRAFT__;
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
          type: 'visioncraft:response',
          id: message.id,
          result,
        },
        '*'
      );
    } catch (error: any) {
      // Send error response
      window.parent.postMessage(
        {
          type: 'visioncraft:response',
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
