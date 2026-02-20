import * as vscode from 'vscode';
import { VisionCraftConfig } from '../types';

/**
 * Manages VisionCraft configuration from VS Code settings
 */
export class ConfigManager {
  private static readonly SECTION = 'visioncraft';

  /**
   * Get the current VisionCraft configuration
   */
  static getConfig(): VisionCraftConfig {
    const config = vscode.workspace.getConfiguration(this.SECTION);

    return {
      devServerUrl: config.get<string>('devServerUrl', 'http://localhost:5173'),
      framework: config.get<'auto' | 'react' | 'vue' | 'svelte' | 'html'>(
        'framework',
        'auto'
      ),
      screenshotQuality: config.get<number>('screenshotQuality', 80),
      enableCDP: config.get<boolean>('enableCDP', false),
    };
  }

  /**
   * Update a configuration value
   */
  static async updateConfig<K extends keyof VisionCraftConfig>(
    key: K,
    value: VisionCraftConfig[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.SECTION);
    await config.update(key, value, target);
  }

  /**
   * Validate dev server URL accessibility
   */
  static async validateDevServer(url: string): Promise<boolean> {
    try {
      // Simple fetch to check if the server is running
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 404; // 404 is ok, means server is running
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-detect dev server URL from workspace
   */
  static async detectDevServerUrl(): Promise<string | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    // Try common dev server ports
    const commonPorts = [5173, 3000, 8080, 4200, 8000];

    for (const port of commonPorts) {
      const url = `http://localhost:${port}`;
      if (await this.validateDevServer(url)) {
        return url;
      }
    }

    return null;
  }

  /**
   * Get dev server URL with auto-detection fallback
   */
  static async getDevServerUrl(): Promise<string> {
    const config = this.getConfig();

    // First, try the configured URL
    if (await this.validateDevServer(config.devServerUrl)) {
      return config.devServerUrl;
    }

    // Try auto-detection
    const detectedUrl = await this.detectDevServerUrl();
    if (detectedUrl) {
      // Update config with detected URL
      await this.updateConfig('devServerUrl', detectedUrl);
      return detectedUrl;
    }

    // Return configured URL even if not accessible (let user know via error)
    return config.devServerUrl;
  }
}
