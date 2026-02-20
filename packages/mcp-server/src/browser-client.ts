/**
 * Browser client for connecting to the preview and calling bridge APIs
 * Now uses CDPClient with automatic mode fallback
 */

import { CDPClient } from './cdp-client.js';
import { ConnectionMode, ConnectionConfig, ConnectionResult } from './connection-mode.js';
import type { BrowserConnection } from './types.js';

/**
 * Legacy BrowserClient wrapper - now uses CDPClient internally
 * Maintains backwards compatibility while adding CDP fallback
 */
export class BrowserClient {
  private cdpClient: CDPClient;
  private url: string;
  private connectionResult: ConnectionResult | null = null;

  constructor(url: string = 'http://localhost:5175', config: ConnectionConfig = {}) {
    this.url = url;

    // Create CDPClient with config
    this.cdpClient = new CDPClient({
      url,
      enableFallback: true, // Auto-fallback enabled by default
      ...config,
    });
  }

  /**
   * Connect to the browser
   */
  async connect(): Promise<void> {
    console.error('[BrowserClient] Connecting...');

    this.connectionResult = await this.cdpClient.connect();

    if (!this.connectionResult.success) {
      throw new Error(`Failed to connect: ${this.connectionResult.error}`);
    }

    console.error(
      `[BrowserClient] Connected via ${this.connectionResult.mode} ` +
      `(bridge: ${this.connectionResult.hasBridge ? 'yes' : 'no'})`
    );
  }

  /**
   * Ensure connection is active
   */
  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  /**
   * Execute a function in the browser context
   */
  async evaluate<T>(fn: string | ((arg: any) => T), arg?: any): Promise<T> {
    await this.ensureConnected();
    return await this.cdpClient.evaluate(fn, arg);
  }

  /**
   * Call a bridge API method
   */
  async callBridge<T>(method: string, ...args: any[]): Promise<T> {
    await this.ensureConnected();

    // Check if bridge is available
    if (!this.cdpClient.hasBridgeAvailable()) {
      throw new Error(
        'VisionCraft bridge not available. ' +
        'Make sure the dev server is running and the bridge script loaded. ' +
        `Current mode: ${this.cdpClient.getMode()}`
      );
    }

    return await this.cdpClient.callBridge<T>(method, ...args);
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.cdpClient.getUrl() || this.url;
  }

  /**
   * Set URL (requires reconnect)
   */
  setUrl(url: string): void {
    this.url = url;
    // Disconnect to force reconnect with new URL
    this.cdpClient.disconnect();
    this.connectionResult = null;
  }

  /**
   * Navigate to a new URL
   */
  async navigate(url: string): Promise<void> {
    await this.ensureConnected();
    this.url = url;
    await this.cdpClient.navigate(url);
  }

  /**
   * Disconnect from browser
   */
  async disconnect(): Promise<void> {
    await this.cdpClient.disconnect();
    this.connectionResult = null;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.cdpClient.isConnected();
  }

  /**
   * Get connection mode
   */
  getConnectionMode(): ConnectionMode | null {
    return this.connectionResult?.mode || null;
  }

  /**
   * Check if bridge is available
   */
  hasBridge(): boolean {
    return this.cdpClient.hasBridgeAvailable();
  }

  /**
   * Get direct access to page (for screenshots, etc.)
   */
  get page() {
    return this.cdpClient.page;
  }

  /**
   * Take screenshot using CDP
   */
  async screenshot(options: { format?: 'jpeg' | 'png'; quality?: number; fullPage?: boolean } = {}): Promise<Buffer> {
    await this.ensureConnected();
    return await this.cdpClient.screenshot(options);
  }
}

// Singleton instance
let clientInstance: BrowserClient | null = null;

/**
 * Get the singleton browser client instance
 */
export function getBrowserClient(url?: string, config?: ConnectionConfig): BrowserClient {
  if (!clientInstance) {
    clientInstance = new BrowserClient(url, config);
  } else if (url && url !== clientInstance.getUrl()) {
    clientInstance.setUrl(url);
  }
  return clientInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetBrowserClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
