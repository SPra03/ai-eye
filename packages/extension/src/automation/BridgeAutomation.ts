import { PreviewManager } from '../preview/PreviewManager';

/**
 * Bridge automation for communicating with the preview iframe
 * This provides a high-level API for interacting with the bridge script
 * that will be injected into the user's application (Phase 4)
 */
export class BridgeAutomation {
  constructor(private previewManager: PreviewManager) {}

  /**
   * Evaluate arbitrary code in the bridge context
   */
  async evaluate(code: string, timeout: number = 5000): Promise<any> {
    try {
      const result = await this.previewManager.evaluate(code, timeout);
      return result;
    } catch (error) {
      throw new Error(`Bridge evaluation failed: ${error}`);
    }
  }

  /**
   * Check if bridge is available in the page
   * (Will be implemented fully in Phase 4 when bridge script is injected)
   */
  async isBridgeAvailable(): Promise<boolean> {
    try {
      const result = await this.evaluate('typeof window.__VISIONCRAFT__ !== "undefined"', 1000);
      return result === true;
    } catch {
      return false;
    }
  }

  /**
   * Inspect an element by CSS selector
   * Returns element details including source location (Phase 4)
   */
  async inspectElement(selector: string): Promise<any> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      throw new Error('Bridge script not available. Ensure Vite plugin is configured.');
    }

    return this.evaluate(`window.__VISIONCRAFT__.inspectElement('${this.escapeSelector(selector)}')`);
  }

  /**
   * Get page structure (DOM tree with source locations)
   * (Phase 4)
   */
  async getPageStructure(maxDepth: number = 5): Promise<any> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      throw new Error('Bridge script not available. Ensure Vite plugin is configured.');
    }

    return this.evaluate(`window.__VISIONCRAFT__.getPageStructure(${maxDepth})`);
  }

  /**
   * Click an element by CSS selector
   * (Phase 4)
   */
  async clickElement(selector: string): Promise<any> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      throw new Error('Bridge script not available. Ensure Vite plugin is configured.');
    }

    return this.evaluate(`window.__VISIONCRAFT__.clickElement('${this.escapeSelector(selector)}')`);
  }

  /**
   * Get console logs captured by the bridge
   * (Phase 4)
   */
  async getConsoleLogs(): Promise<any[]> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      return [];
    }

    return this.evaluate('window.__VISIONCRAFT__.consoleLogs');
  }

  /**
   * Capture a screenshot using html2canvas
   * (Phase 4)
   */
  async captureScreenshot(format: 'jpeg' | 'png' = 'jpeg', quality: number = 80): Promise<string> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      throw new Error('Bridge script not available. Ensure Vite plugin is configured.');
    }

    return this.evaluate(
      `window.__VISIONCRAFT__.captureScreenshot('${format}', ${quality})`
    );
  }

  /**
   * Find elements by query (text, role, or selector)
   * (Phase 4)
   */
  async findElements(query: string, mode: 'text' | 'role' | 'css' = 'css'): Promise<any[]> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      throw new Error('Bridge script not available. Ensure Vite plugin is configured.');
    }

    return this.evaluate(
      `window.__VISIONCRAFT__.findElements('${this.escapeString(query)}', '${mode}')`
    );
  }

  /**
   * Get HMR status
   * (Phase 6)
   */
  async getHMRStatus(): Promise<any> {
    const available = await this.isBridgeAvailable();
    if (!available) {
      return {
        connected: false,
        error: 'Bridge not available',
      };
    }

    return this.evaluate('window.__VISIONCRAFT__.getHMRStatus()');
  }

  /**
   * Escape CSS selector for safe evaluation
   */
  private escapeSelector(selector: string): string {
    return selector.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  /**
   * Escape string for safe evaluation
   */
  private escapeString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
