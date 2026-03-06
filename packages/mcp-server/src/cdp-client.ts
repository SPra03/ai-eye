/**
 * CDP Client - Direct Chrome DevTools Protocol connection
 * Connects to existing Chrome instance without launching new browser
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright-core';
import { ConnectionMode, ConnectionConfig, DEFAULT_CONNECTION_CONFIG, ConnectionResult } from './connection-mode.js';

export class CDPClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  public page: Page | null = null;
  private config: Required<ConnectionConfig>;
  private connectionMode: ConnectionMode;
  private hasBridge: boolean = false;

  constructor(config: ConnectionConfig = {}) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...config };
    this.connectionMode = this.config.mode;
  }

  /**
   * Connect to browser using the configured mode
   */
  async connect(): Promise<ConnectionResult> {
    console.error('[CDP] Attempting connection...');

    // Try modes in order of preference if fallback enabled
    const modesToTry = this.config.enableFallback
      ? [ConnectionMode.CDP_CONNECT, ConnectionMode.PLAYWRIGHT_LAUNCH]
      : [this.connectionMode];

    let lastError: Error | undefined;

    for (const mode of modesToTry) {
      try {
        console.error(`[CDP] Trying connection mode: ${mode}`);

        if (mode === ConnectionMode.CDP_CONNECT) {
          await this.connectViaCDP();
        } else if (mode === ConnectionMode.PLAYWRIGHT_LAUNCH) {
          await this.launchViaPlaywright();
        } else if (mode === ConnectionMode.CDP_ONLY) {
          await this.connectViaCDPOnly();
        }

        // Check if bridge is available (skip for external sites)
        if (!this.config.skipBridgeCheck) {
          await this.checkBridgeAvailability();
        } else {
          this.hasBridge = false;
          console.error('[CDP] Bridge check skipped (external site mode)');
        }

        console.error(`[CDP] Connected successfully via ${mode}`);
        this.connectionMode = mode;

        return {
          mode: this.connectionMode,
          success: true,
          hasBridge: this.hasBridge,
        };
      } catch (error) {
        const err = error as Error;
        console.error(`[CDP] Failed to connect via ${mode}:`, err.message);
        console.error(`[CDP] Error stack:`, err.stack);
        lastError = err;

        // Clean up failed attempt
        await this.cleanup();

        // Continue to next mode if fallback enabled
        if (!this.config.enableFallback) {
          break;
        }
      }
    }

    // All modes failed
    return {
      mode: this.connectionMode,
      success: false,
      hasBridge: false,
      error: lastError?.message || 'All connection modes failed',
    };
  }

  /**
   * Connect to existing Chrome instance via CDP
   */
  private async connectViaCDP(): Promise<void> {
    const cdpUrl = `http://${this.config.cdpHost}:${this.config.cdpPort}`;

    console.error(`[CDP] Connecting to existing browser at ${cdpUrl}...`);

    // Validate CDP endpoint is reachable with retry
    const maxRetries = 3;
    let retries = 0;
    let lastError: Error | undefined;

    while (retries < maxRetries) {
      try {
        // Connect to existing browser via CDP
        this.browser = await chromium.connectOverCDP(cdpUrl, {
          timeout: this.config.timeout,
        });
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        retries++;
        if (retries < maxRetries) {
          console.error(`[CDP] Connection attempt ${retries} failed, retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw new Error(
            `Failed to connect to CDP endpoint after ${maxRetries} attempts. ` +
            `Ensure Chrome/Chromium is running with --remote-debugging-port=${this.config.cdpPort}. ` +
            `Original error: ${lastError?.message}`
          );
        }
      }
    }

    if (!this.browser) {
      throw new Error('Browser connection failed');
    }

    // Get existing context or create new one
    const contexts = this.browser.contexts();
    if (contexts.length > 0) {
      this.context = contexts[0];
      const pages = this.context.pages();

      if (pages.length > 0) {
        // Use existing page if available
        this.page = pages[0];

        // Navigate to URL if different
        const currentUrl = this.page.url();
        if (!currentUrl.startsWith(this.config.url)) {
          await this.page.goto(this.config.url, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout,
          });
        }
      } else {
        // Create new page in existing context
        this.page = await this.context.newPage();
        await this.page.goto(this.config.url, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout,
        });
      }
    } else {
      // Create new context and page
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      await this.page.goto(this.config.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });
    }

    console.error('[CDP] Connected to existing browser successfully');

    // Setup error handlers
    this.setupPageErrorHandlers();
  }

  /**
   * Setup page error and crash handlers
   */
  private setupPageErrorHandlers(): void {
    if (!this.page) return;

    this.page.on('crash', () => {
      console.error('[CDP] Page crashed! The browser tab has crashed unexpectedly.');
      this.page = null;
    });

    this.page.on('pageerror', (error) => {
      console.error('[CDP] Page error:', error.message);
    });

    // Handle browser disconnect
    if (this.browser) {
      this.browser.on('disconnected', () => {
        console.error('[CDP] Browser disconnected. Connection lost.');
        this.cleanup();
      });
    }
  }

  /**
   * Launch new browser via Playwright (current default)
   */
  private async launchViaPlaywright(): Promise<void> {
    console.error('[CDP] Launching new browser via Playwright...');

    this.browser = await chromium.launch({
      headless: this.config.headless ?? false,
      timeout: this.config.timeout,
      args: [
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    this.page = await this.context.newPage();

    // Only navigate if URL is a real page (not about:blank or empty)
    const url = this.config.url;
    if (url && url !== 'about:blank' && !url.startsWith('about:')) {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });
    }

    console.error('[CDP] Browser launched successfully');

    // Setup error handlers
    this.setupPageErrorHandlers();
  }

  /**
   * Connect via CDP without bridge dependency
   */
  private async connectViaCDPOnly(): Promise<void> {
    // Same as connectViaCDP but explicitly set hasBridge to false
    await this.connectViaCDP();
    this.hasBridge = false;
  }

  /**
   * Check if VisionCraft bridge is available
   */
  private async checkBridgeAvailability(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not available. Please ensure the browser is connected before checking bridge availability.');
    }

    try {
      // Wait for bridge with short timeout
      await this.page.waitForFunction(
        () => (window as any).__VISIONCRAFT__?.ready === true,
        { timeout: 5000 }
      );

      this.hasBridge = true;
      console.error('[CDP] VisionCraft bridge detected');
    } catch (error) {
      this.hasBridge = false;
      console.error('[CDP] VisionCraft bridge not available, using CDP-only mode');

      // Switch to CDP-only mode if bridge not available
      if (this.connectionMode !== ConnectionMode.CDP_ONLY) {
        this.connectionMode = ConnectionMode.CDP_ONLY;
      }
    }
  }

  /**
   * Execute JavaScript in page context
   */
  async evaluate<T>(fn: string | ((arg: any) => T), arg?: any): Promise<T> {
    if (!this.page) {
      throw new Error('Not connected to browser. Call connect() first or check if the browser is running.');
    }

    return await this.page.evaluate(fn as any, arg);
  }

  /**
   * Call VisionCraft bridge method (only if bridge available)
   */
  async callBridge<T>(method: string, ...args: any[]): Promise<T> {
    if (!this.hasBridge) {
      throw new Error(
        'VisionCraft bridge not available in CDP-only mode. ' +
        'Ensure the @visioncraft/vite-plugin is installed and the dev server is running.'
      );
    }

    return await this.evaluate((data) => {
      const bridge = (window as any).__VISIONCRAFT__;
      if (!bridge) {
        throw new Error(
          'VisionCraft bridge not available. ' +
          'The bridge script may not have loaded. Check the browser console for errors.'
        );
      }

      const fn = bridge[data.method];
      if (typeof fn !== 'function') {
        throw new Error(
          `Bridge method not found: ${data.method}. ` +
          `Available methods: ${Object.keys(bridge).filter(k => typeof bridge[k] === 'function').join(', ')}`
        );
      }

      return fn.apply(bridge, data.args);
    }, { method, args });
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Not connected to browser. Call connect() first or check if the browser is running.');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      throw new Error(
        `Invalid URL format: "${url}". ` +
        'URL must include protocol (e.g., "http://localhost:3000" or "https://example.com")'
      );
    }

    this.config.url = url;

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `Navigation to "${url}" failed: ${err.message}. ` +
        'Check if the URL is correct and the server is running.'
      );
    }

    // Re-check bridge availability after navigation
    await this.checkBridgeAvailability();
  }

  /**
   * Take screenshot using CDP/Playwright
   */
  async screenshot(options: { format?: 'jpeg' | 'png'; quality?: number; fullPage?: boolean } = {}): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Not connected to browser');
    }

    const { format = 'jpeg', quality = 80, fullPage = true } = options;

    return await this.page.screenshot({
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      fullPage,
    });
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page?.url() || this.config.url;
  }

  /**
   * Get connection mode
   */
  getMode(): ConnectionMode {
    return this.connectionMode;
  }

  /**
   * Check if bridge is available
   */
  hasBridgeAvailable(): boolean {
    return this.hasBridge;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.page !== null && !this.page.isClosed();
  }

  /**
   * Clean up connection
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      // Only close browser if we launched it (not if connected via CDP)
      if (this.browser && this.connectionMode === ConnectionMode.PLAYWRIGHT_LAUNCH) {
        await this.browser.close();
      }

      this.browser = null;
      this.page = null;
      this.hasBridge = false;
    } catch (error) {
      console.error('[CDP] Error during cleanup:', error);
    }
  }

  /**
   * Disconnect from browser
   */
  async disconnect(): Promise<void> {
    console.error('[CDP] Disconnecting...');
    await this.cleanup();
    console.error('[CDP] Disconnected');
  }
}
