/**
 * Webview Client for VisionCraft
 *
 * Instead of launching Playwright browser, this client communicates with
 * the VS Code extension via HTTP bridge to use the embedded webview.
 *
 * Communication flow:
 * WebviewClient → HTTP Request → Extension HttpBridge → EmbeddedMCPServer → WebviewBridge → Webview
 */

export class WebviewClient {
  private bridgeUrl: string;
  private _isConnected: boolean = false;
  private _currentUrl: string = '';

  constructor(bridgeUrl: string) {
    this.bridgeUrl = bridgeUrl;
  }

  /**
   * Connect to the bridge (check health)
   */
  async connect(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for health check

      const response = await fetch(`${this.bridgeUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Bridge health check failed: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[WebviewClient] Connected to bridge at port ${data.port}`);
      this._isConnected = true;
    } catch (error) {
      console.error('[WebviewClient] Failed to connect to bridge:', error);
      throw new Error(`Failed to connect to VS Code extension bridge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect (no-op for HTTP client)
   */
  async disconnect(): Promise<void> {
    this._isConnected = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this._currentUrl || 'about:blank';
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    this._currentUrl = url;
    await this.callBridge('navigate', url);
  }

  /**
   * Call a method on the VisionCraft bridge in the webview
   * This forwards the call through the HTTP bridge to the embedded MCP server
   */
  async callBridge(method: string, ...args: any[]): Promise<any> {
    const maxRetries = 2;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for tool calls

        const response = await fetch(`${this.bridgeUrl}/tools/call`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'tools/call',
            params: {
              // Map the method name to the corresponding VisionCraft tool
              name: this.mapMethodToTool(method),
              arguments: this.mapArgsToToolArgs(method, args),
            },
          }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
          let errorDetail = response.statusText;
          try {
            const errorBody = await response.json() as any;
            errorDetail = errorBody.error?.message || errorBody.error || errorDetail;
          } catch {}
          throw new Error(`HTTP ${response.status}: ${errorDetail}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'Unknown error');
        }

        // HttpBridge now returns raw results directly (not MCP format)
        return data.result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[WebviewClient] callBridge(${method}) attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Brief pause before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    throw lastError || new Error(`callBridge(${method}) failed after ${maxRetries + 1} attempts`);
  }

  /**
   * Map browser-client method names to VisionCraft tool names
   */
  private mapMethodToTool(method: string): string {
    const methodMap: Record<string, string> = {
      'screenshot': 'visioncraft_screenshot',
      'elementAtPoint': 'visioncraft_element_at_point',
      'batchInspect': 'visioncraft_batch_inspect',
      'inspectElement': 'visioncraft_inspect_element',
      'getElementSource': 'visioncraft_get_source',
      'clickElement': 'visioncraft_click',
      'typeText': 'visioncraft_type',
      'scrollTo': 'visioncraft_scroll',
      'hoverElement': 'visioncraft_hover',
      'findElements': 'visioncraft_find_elements',
      'getPageStructure': 'visioncraft_get_structure',
      'getCSSSource': 'visioncraft_get_css_source',
      'setViewport': 'visioncraft_set_viewport',
      'getConsoleLogs': 'visioncraft_get_console_logs',
      'clearConsoleLogs': 'visioncraft_clear_console_logs',
      'getNetworkRequests': 'visioncraft_get_network_requests',
      'clearNetworkRequests': 'visioncraft_clear_network_requests',
      'getHMRStatus': 'visioncraft_get_hmr_status',
      'clearHMRErrors': 'visioncraft_clear_hmr_errors',
      'getCurrentUrl': 'visioncraft_get_current_url',
      'visualDiff': 'visioncraft_visual_diff',
      'navigate': 'visioncraft_navigate',
      'getStyleDiff': 'visioncraft_style_diff',
      'getComponentTree': 'visioncraft_get_component_tree',
      'auditAccessibility': 'visioncraft_audit_accessibility',
      'measureElement': 'visioncraft_measure_element',
      'measureSpacing': 'visioncraft_measure_spacing',
      'getComputedLayout': 'visioncraft_get_computed_layout',
      'getPalette': 'visioncraft_get_palette',
      'waitForHMR': 'visioncraft_wait_for_hmr',
    };

    return methodMap[method] || method;
  }

  /**
   * Map method arguments to tool argument schema
   */
  private mapArgsToToolArgs(method: string, args: any[]): Record<string, any> {
    switch (method) {
      case 'screenshot':
        return {
          format: args[0] || 'jpeg',
          quality: args[1] || 80,
          selector: args[2],
          highlight: args[3],
          highlightColor: args[4],
        };

      case 'elementAtPoint':
        return {
          x: args[0],
          y: args[1],
        };

      case 'batchInspect':
        return {
          selectors: args[0],
          region: args[1],
          includeStyles: args[2] || false,
        };

      case 'inspectElement':
      case 'getElementSource':
      case 'clickElement':
      case 'hoverElement':
        return {
          selector: args[0],
        };

      case 'typeText':
        return {
          selector: args[0],
          text: args[1],
        };

      case 'scrollTo':
        return {
          x: args[0] || 0,
          y: args[1] || 0,
        };

      case 'findElements':
        return {
          query: args[0],
          mode: args[1] || 'css',
          includeSource: args[2] || false,
        };

      case 'getPageStructure':
        return {
          maxDepth: args[0] || 5,
        };

      case 'getCSSSource':
        return {
          selector: args[0],
          properties: args[1],
        };

      case 'setViewport':
        return {
          width: args[0],
          height: args[1],
          preset: args[2],
        };

      case 'getStyleDiff':
        return {
          selector: args[0],
          action: args[1],
          actionArg: args[2],
          properties: args[3],
        };

      case 'getComponentTree':
        return {
          selector: args[0],
          maxDepth: args[1] || 10,
          framework: args[2] || 'auto',
        };

      case 'auditAccessibility':
        return {
          selector: args[0],
          tags: args[1],
        };

      case 'getNetworkRequests':
        return {
          filter: args[0],
          limit: args[1] || 50,
        };

      case 'getConsoleLogs':
        return {
          level: args[0],
          limit: args[1],
        };

      case 'navigate':
        return {
          url: args[0],
        };

      case 'measureElement':
        return {
          selectorA: args[0],
          selectorB: args[1],
        };

      case 'measureSpacing':
        return {
          selector: args[0],
        };

      case 'getComputedLayout':
        return {
          selector: args[0],
        };

      case 'getPalette':
        return {
          selector: args[0],
          limit: args[1] || 20,
        };

      case 'waitForHMR':
        return {
          timeout: args[0] || 10000,
        };

      default:
        return {};
    }
  }
}
