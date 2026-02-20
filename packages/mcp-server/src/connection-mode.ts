/**
 * Connection mode types and configuration for browser connections
 */

export enum ConnectionMode {
  /**
   * Connect to existing browser via CDP (Chrome DevTools Protocol)
   * - Lightest: ~10MB RAM, instant startup
   * - Requires user to run Chrome with --remote-debugging-port
   * - No Playwright overhead
   */
  CDP_CONNECT = 'cdp-connect',

  /**
   * Launch new browser instance via Playwright
   * - Current default mode
   * - Works out-of-box, no user setup needed
   * - ~200MB RAM, 2-3s startup
   */
  PLAYWRIGHT_LAUNCH = 'playwright-launch',

  /**
   * CDP-only mode (no bridge script dependency)
   * - Fallback when bridge script fails to load
   * - Pure CDP protocol calls only
   * - Limited features but reliable
   */
  CDP_ONLY = 'cdp-only',
}

export interface ConnectionConfig {
  /**
   * Preferred connection mode
   * If undefined, auto-detect best available mode
   */
  mode?: ConnectionMode;

  /**
   * CDP debugging port (default: 9222)
   */
  cdpPort?: number;

  /**
   * CDP host (default: localhost)
   */
  cdpHost?: string;

  /**
   * URL to navigate to
   */
  url?: string;

  /**
   * Timeout for connection attempts (ms)
   */
  timeout?: number;

  /**
   * Whether to enable automatic fallback
   */
  enableFallback?: boolean;
}

export interface ConnectionResult {
  mode: ConnectionMode;
  success: boolean;
  hasBridge: boolean;
  error?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_CONNECTION_CONFIG: Required<ConnectionConfig> = {
  mode: ConnectionMode.PLAYWRIGHT_LAUNCH,
  cdpPort: 9222,
  cdpHost: 'localhost',
  url: 'http://localhost:5175',
  timeout: 30000,
  enableFallback: true,
};
