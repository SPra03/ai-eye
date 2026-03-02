import { PreviewManager } from '../preview/PreviewManager';

/**
 * Response type for webview operations
 */
export interface WebviewResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Element information returned by inspect
 */
export interface ElementInfo {
  tagName: string;
  sourceFile?: string;
  sourceLine?: string;
  sourceCol?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles?: Record<string, string>;
  attributes?: Record<string, string>;
  innerText?: string;
}

/**
 * WebviewBridge - High-level API for AI agents to interact with webview
 *
 * This service sits between the MCP server and the PreviewManager,
 * providing a clean Promise-based API for all webview operations.
 */
export class WebviewBridge {
  constructor(private previewManager: PreviewManager) {}

  /**
   * Check if webview is ready for interactions
   */
  async isReady(): Promise<boolean> {
    try {
      const result = await this.previewManager.evaluate(
        'typeof window.__VISIONCRAFT__ !== "undefined" && window.__VISIONCRAFT__.ready === true',
        2000
      );
      return result === true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for webview to be ready
   */
  async waitForReady(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (await this.isReady()) {
        return;
      }
      await this.sleep(100);
    }

    throw new Error('Webview did not become ready within timeout');
  }

  /**
   * Check if VisionCraft bridge is available in the webview
   */
  async isBridgeAvailable(): Promise<boolean> {
    try {
      const result = await this.previewManager.evaluate(
        'typeof window.__VISIONCRAFT__ !== "undefined" && window.__VISIONCRAFT__.ready === true',
        2000
      );
      return result === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Capture screenshot of the webview
   * Returns base64-encoded image data
   */
  async captureScreenshot(
    format: 'jpeg' | 'png' = 'jpeg',
    quality: number = 80,
    selector?: string,
    highlight?: string[],
    highlightColor: string = 'rgba(255, 0, 0, 0.3)'
  ): Promise<string> {
    await this.waitForReady();

    // Check if html2canvas is available
    const hasHtml2Canvas = await this.previewManager.evaluate(
      'typeof html2canvas !== "undefined"',
      1000
    );

    if (!hasHtml2Canvas) {
      // Load html2canvas dynamically
      await this.loadHtml2Canvas();
    }

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable && (selector || highlight)) {
      // Use bridge captureScreenshot with highlight/crop support
      const selectorArg = selector ? `'${this.escapeSelector(selector)}'` : 'undefined';
      const highlightArg = highlight ? JSON.stringify(highlight) : 'undefined';
      const screenshotCode = `window.__VISIONCRAFT__.captureScreenshot('${format}', ${quality}, ${selectorArg}, ${highlightArg}, '${highlightColor}')`;

      try {
        const dataUrl = await this.previewManager.evaluate(screenshotCode, 15000);
        return dataUrl;
      } catch (error) {
        throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Standard screenshot without highlight/crop
    const screenshotCode = `
      (async () => {
        const canvas = await html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          logging: false,
          windowWidth: window.innerWidth,
          windowHeight: document.documentElement.scrollHeight
        });
        return canvas.toDataURL('image/${format}', ${format === 'jpeg' ? quality / 100 : 1});
      })()
    `;

    try {
      const dataUrl = await this.previewManager.evaluate(screenshotCode, 15000);
      return dataUrl;
    } catch (error) {
      throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Identify element at a specific pixel coordinate
   */
  async elementAtPoint(x: number, y: number): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      const code = `window.__VISIONCRAFT__.elementAtPoint(${x}, ${y})`;
      const result = await this.previewManager.evaluate(code, 5000);
      if (result) {
        return result;
      }
      return { error: `No element found at (${x}, ${y})` };
    } else {
      // Fallback without bridge
      const code = `
        (() => {
          const el = document.elementFromPoint(${x}, ${y});
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            tagName: el.tagName,
            boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            computedStyles: {
              display: styles.display, position: styles.position,
              width: styles.width, height: styles.height,
              color: styles.color, backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize
            },
            innerText: el.innerText || el.textContent
          };
        })()
      `;
      const result = await this.previewManager.evaluate(code, 5000);
      if (!result) {
        throw new Error(`No element found at (${x}, ${y})`);
      }
      return result;
    }
  }

  /**
   * Batch inspect multiple elements at once
   */
  async batchInspect(
    selectors?: string[],
    region?: { x: number; y: number; width: number; height: number },
    includeStyles: boolean = false
  ): Promise<any[]> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      throw new Error('Batch inspect requires VisionCraft bridge');
    }

    const selectorsArg = selectors ? JSON.stringify(selectors) : 'undefined';
    const regionArg = region ? JSON.stringify(region) : 'undefined';
    const code = `window.__VISIONCRAFT__.batchInspect(${selectorsArg}, ${regionArg}, ${includeStyles})`;
    const result = await this.previewManager.evaluate(code, 10000);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Inspect an element and get detailed information
   */
  async inspectElement(selector: string): Promise<ElementInfo> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      // Use VisionCraft bridge API
      const code = `window.__VISIONCRAFT__.inspectElement('${this.escapeSelector(selector)}')`;
      const result = await this.previewManager.evaluate(code, 5000);

      if (result && result.tagName) {
        return result as ElementInfo;
      }
      throw new Error(`Element not found: ${selector}`);
    } else {
      // Fallback: manual inspection without bridge
      return await this.inspectElementFallback(selector);
    }
  }

  /**
   * Fallback element inspection without bridge
   */
  private async inspectElementFallback(selector: string): Promise<ElementInfo> {
    const code = `
      (() => {
        const element = document.querySelector('${this.escapeSelector(selector)}');
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);

        // Get key styles
        const computedStyles = {
          display: styles.display,
          position: styles.position,
          width: styles.width,
          height: styles.height,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily
        };

        // Get attributes
        const attributes = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }

        return {
          tagName: element.tagName,
          boundingBox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          computedStyles,
          attributes,
          innerText: element.innerText || element.textContent
        };
      })()
    `;

    const result = await this.previewManager.evaluate(code, 5000);

    if (!result) {
      throw new Error(`Element not found: ${selector}`);
    }

    return result as ElementInfo;
  }

  /**
   * Get source location for an element
   */
  async getElementSource(selector: string): Promise<{ file: string; line: string; col: string }> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      const code = `window.__VISIONCRAFT__.getElementSource('${this.escapeSelector(selector)}')`;
      const result = await this.previewManager.evaluate(code, 3000);

      if (result && result.file) {
        return result;
      }
      throw new Error(`Source mapping not available for: ${selector}`);
    } else {
      // Fallback: read data-vc-* attributes directly
      const code = `
        (() => {
          const element = document.querySelector('${this.escapeSelector(selector)}');
          if (!element) return null;

          const file = element.getAttribute('data-vc-source');
          const line = element.getAttribute('data-vc-line');
          const col = element.getAttribute('data-vc-col');

          if (file && line && col) {
            return { file, line, col };
          }
          return null;
        })()
      `;

      const result = await this.previewManager.evaluate(code, 3000);

      if (!result) {
        throw new Error(`Source mapping not available for: ${selector}`);
      }

      return result;
    }
  }

  /**
   * Click an element
   */
  async clickElement(selector: string): Promise<void> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      const code = `window.__VISIONCRAFT__.clickElement('${this.escapeSelector(selector)}')`;
      const result = await this.previewManager.evaluate(code, 3000);

      if (!result || !result.success) {
        throw new Error(`Failed to click element: ${selector}`);
      }
    } else {
      // Fallback: direct click
      const code = `
        (() => {
          const element = document.querySelector('${this.escapeSelector(selector)}');
          if (!element) throw new Error('Element not found');
          element.click();
          return { success: true };
        })()
      `;

      await this.previewManager.evaluate(code, 3000);
    }
  }

  /**
   * Type text into an input element
   */
  async typeText(selector: string, text: string): Promise<void> {
    await this.waitForReady();

    const escapedText = text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      const code = `window.__VISIONCRAFT__.typeText('${this.escapeSelector(selector)}', '${escapedText}')`;
      const result = await this.previewManager.evaluate(code, 3000);

      if (!result || !result.success) {
        throw new Error(`Failed to type text into: ${selector}`);
      }
    } else {
      // Fallback: direct input
      const code = `
        (() => {
          const element = document.querySelector('${this.escapeSelector(selector)}');
          if (!element) throw new Error('Element not found');

          element.value = '${escapedText}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          return { success: true };
        })()
      `;

      await this.previewManager.evaluate(code, 3000);
    }
  }

  /**
   * Hover over an element
   */
  async hoverElement(selector: string): Promise<void> {
    await this.waitForReady();

    const code = `
      (() => {
        const element = document.querySelector('${this.escapeSelector(selector)}');
        if (!element) throw new Error('Element not found: ${this.escapeSelector(selector)}');
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        return { success: true };
      })()
    `;

    await this.previewManager.evaluate(code, 3000);
  }

  /**
   * Scroll the page
   */
  async scrollTo(x: number, y: number): Promise<void> {
    await this.waitForReady();

    const code = `
      (() => {
        window.scrollTo(${x}, ${y});
        return { success: true };
      })()
    `;

    await this.previewManager.evaluate(code, 2000);
  }

  /**
   * Get CSS source rules for an element
   */
  async getCSSSource(selector: string, properties?: string[]): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      throw new Error('CSS source tracing requires VisionCraft bridge');
    }

    const propsArg = properties ? JSON.stringify(properties) : 'undefined';
    const code = `window.__VISIONCRAFT__.getCSSSource('${this.escapeSelector(selector)}', ${propsArg})`;
    return await this.previewManager.evaluate(code, 5000);
  }

  /**
   * Get captured network requests
   */
  async getNetworkRequests(
    filter?: { urlPattern?: string; method?: string; status?: number; hasError?: boolean },
    limit: number = 50
  ): Promise<any[]> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      return [];
    }

    const filterArg = filter ? JSON.stringify(filter) : 'undefined';
    const code = `window.__VISIONCRAFT__.getNetworkRequests(${filterArg}, ${limit})`;
    const result = await this.previewManager.evaluate(code, 5000);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Clear captured network requests
   */
  async clearNetworkRequests(): Promise<void> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      return;
    }

    await this.previewManager.evaluate('window.__VISIONCRAFT__.clearNetworkRequests()', 2000);
  }

  /**
   * Set viewport size for responsive testing.
   * Sends a message to the outer webview page to resize the iframe element,
   * which changes window.innerWidth/innerHeight and triggers @media queries.
   */
  async setViewport(width: number, height: number, preset?: string, label?: string): Promise<void> {
    // Send setViewport message to the outer webview (not the iframe)
    // PreviewManager's webview script handles resizing the iframe element
    return new Promise((resolve, reject) => {
      const id = (this.previewManager as any).nextMessageId++;

      const timeoutHandle = setTimeout(() => {
        (this.previewManager as any).messageHandlers.delete(id);
        reject(new Error('setViewport timeout'));
      }, 5000);

      (this.previewManager as any).messageHandlers.set(id, (result: any) => {
        clearTimeout(timeoutHandle);
        if (result && result.__error) {
          reject(new Error(result.__error));
        } else {
          resolve();
        }
      });

      const presetLabels: Record<string, string> = {
        mobile: 'iPhone 14 (375x812)',
        mobile_landscape: 'Mobile Landscape (812x375)',
        tablet: 'iPad (768x1024)',
        tablet_landscape: 'iPad Landscape (1024x768)',
        desktop: 'Desktop (1440x900)',
        desktop_hd: 'Desktop HD (1920x1080)',
      };

      (this.previewManager as any).postMessage({
        type: 'setViewport',
        id,
        width,
        height,
        label: label || (preset ? presetLabels[preset] : `${width}x${height}`),
      });
    });
  }

  /**
   * Reset viewport to full width (desktop default)
   */
  async resetViewport(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = (this.previewManager as any).nextMessageId++;

      const timeoutHandle = setTimeout(() => {
        (this.previewManager as any).messageHandlers.delete(id);
        reject(new Error('resetViewport timeout'));
      }, 5000);

      (this.previewManager as any).messageHandlers.set(id, (result: any) => {
        clearTimeout(timeoutHandle);
        if (result && result.__error) {
          reject(new Error(result.__error));
        } else {
          resolve();
        }
      });

      (this.previewManager as any).postMessage({
        type: 'setViewport',
        id,
        width: null,
        height: null,
      });
    });
  }

  /**
   * Get console logs from webview
   */
  async getConsoleLogs(level?: string, limit?: number): Promise<any[]> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (!bridgeAvailable) {
      return []; // Console logs require bridge
    }

    const code = level
      ? `window.__VISIONCRAFT__.getConsoleLogs('${level}', ${limit || 100})`
      : `window.__VISIONCRAFT__.consoleLogs.slice(-${limit || 100})`;

    const result = await this.previewManager.evaluate(code, 2000);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Clear console logs
   */
  async clearConsoleLogs(): Promise<void> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      return;
    }

    await this.previewManager.evaluate('window.__VISIONCRAFT__.clearConsoleLogs()', 2000);
  }

  /**
   * Get HMR status
   */
  async getHMRStatus(): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      return { connected: false, lastUpdate: null, errors: [], updates: [], totalUpdates: 0, averageLatency: 0 };
    }

    return await this.previewManager.evaluate('window.__VISIONCRAFT__.getHMRStatus()', 2000);
  }

  /**
   * Clear HMR errors
   */
  async clearHMRErrors(): Promise<void> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      return;
    }

    await this.previewManager.evaluate('window.__VISIONCRAFT__.clearHMRErrors()', 2000);
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    await this.previewManager.navigate(url);

    // Wait for page to load
    await this.sleep(1000);
    await this.waitForReady();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    await this.waitForReady();

    const code = 'window.location.href';
    return await this.previewManager.evaluate(code, 1000);
  }

  /**
   * Find elements by text, role, or CSS selector
   */
  async findElements(query: string, mode: 'text' | 'role' | 'css' = 'css', includeSource: boolean = false): Promise<any[]> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (bridgeAvailable) {
      const code = `window.__VISIONCRAFT__.findElements('${this.escapeSelector(query)}', '${mode}', ${includeSource})`;
      const result = await this.previewManager.evaluate(code, 5000);
      return Array.isArray(result) ? result : [];
    } else {
      // Fallback for CSS mode only
      if (mode === 'css') {
        const code = `
          Array.from(document.querySelectorAll('${this.escapeSelector(query)}')).map(el => ({
            selector: '${this.escapeSelector(query)}',
            tagName: el.tagName,
            text: el.innerText || el.textContent
          }))
        `;
        const result = await this.previewManager.evaluate(code, 5000);
        return Array.isArray(result) ? result : [];
      }

      throw new Error(`Find elements by ${mode} requires VisionCraft bridge`);
    }
  }

  /**
   * Get page structure (DOM tree with source mapping)
   */
  async getPageStructure(maxDepth: number = 5): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();

    if (!bridgeAvailable) {
      throw new Error('Page structure requires VisionCraft bridge');
    }

    const code = `window.__VISIONCRAFT__.getPageStructure(${maxDepth})`;
    return await this.previewManager.evaluate(code, 10000);
  }

  /**
   * Get style diff before/after an action
   */
  async getStyleDiff(
    selector: string,
    action: string,
    actionArg?: string,
    properties?: string[]
  ): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      throw new Error('Style diff requires VisionCraft bridge');
    }

    const actionArgStr = actionArg ? `'${this.escapeSelector(actionArg)}'` : 'undefined';
    const propsStr = properties ? JSON.stringify(properties) : 'undefined';
    const code = `window.__VISIONCRAFT__.getStyleDiff('${this.escapeSelector(selector)}', '${action}', ${actionArgStr}, ${propsStr})`;
    return await this.previewManager.evaluate(code, 10000);
  }

  /**
   * Get React/Vue/Svelte component tree
   */
  async getComponentTree(
    selector?: string,
    maxDepth: number = 10,
    framework: string = 'auto'
  ): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      throw new Error('Component tree requires VisionCraft bridge');
    }

    const selectorArg = selector ? `'${this.escapeSelector(selector)}'` : 'undefined';
    const code = `window.__VISIONCRAFT__.getComponentTree(${selectorArg}, ${maxDepth}, '${framework}')`;
    return await this.previewManager.evaluate(code, 10000);
  }

  /**
   * Run accessibility audit using axe-core
   */
  async auditAccessibility(
    selector?: string,
    tags?: string[]
  ): Promise<any> {
    await this.waitForReady();

    const bridgeAvailable = await this.isBridgeAvailable();
    if (!bridgeAvailable) {
      throw new Error('Accessibility audit requires VisionCraft bridge');
    }

    const selectorArg = selector ? `'${this.escapeSelector(selector)}'` : 'undefined';
    const tagsArg = tags ? JSON.stringify(tags) : 'undefined';
    const code = `window.__VISIONCRAFT__.auditAccessibility(${selectorArg}, ${tagsArg})`;
    return await this.previewManager.evaluate(code, 35000);
  }

  /**
   * Load html2canvas library dynamically
   */
  private async loadHtml2Canvas(): Promise<void> {
    const code = `
      new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
      })
    `;

    await this.previewManager.evaluate(code, 10000);
  }

  /**
   * Escape CSS selector for safe eval
   */
  private escapeSelector(selector: string): string {
    return selector.replace(/'/g, "\\'");
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
