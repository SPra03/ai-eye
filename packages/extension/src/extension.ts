import * as vscode from 'vscode';
import { PreviewManager } from './preview/PreviewManager';
// import { CDPBridge } from './automation/CDPBridge'; // v2.2: Not needed, uses WebviewBridge instead
import { ConfigManager } from './config/ConfigManager';
import { WebviewBridge } from './webview/WebviewBridge';
import { EmbeddedMCPServer } from './mcp/EmbeddedMCPServer';
import { HttpBridge } from './mcp/HttpBridge';

/**
 * Extension state management
 */
let previewManager: PreviewManager | undefined;
// let cdpBridge: CDPBridge | undefined; // v2.2: Not needed
let webviewBridge: WebviewBridge | undefined;
let embeddedMCPServer: EmbeddedMCPServer | undefined;
let httpBridge: HttpBridge | undefined;
let outputChannel: vscode.OutputChannel | undefined;

/**
 * Extension API exposed to other extensions and AI agents
 */
export interface AIEyeAPI {
  /**
   * Get the webview bridge for direct interaction
   */
  getWebviewBridge(): WebviewBridge | undefined;

  /**
   * Get the embedded MCP server
   */
  getEmbeddedMCPServer(): EmbeddedMCPServer | undefined;

  /**
   * Check if preview is open and ready
   */
  isPreviewReady(): Promise<boolean>;

  /**
   * Open the preview panel
   */
  openPreview(): Promise<void>;
}

/**
 * Extension activation
 * Called when the extension is activated (lazy activation via activationEvents)
 */
export async function activate(context: vscode.ExtensionContext): Promise<AIEyeAPI> {
  outputChannel = vscode.window.createOutputChannel('AI Eye');
  outputChannel.appendLine('AI Eye extension is activating...');

  try {
    // Initialize managers
    previewManager = new PreviewManager(context);
    // cdpBridge = new CDPBridge(); // v2.2: Not needed

    // Initialize v2 components (embedded MCP server)
    webviewBridge = new WebviewBridge(previewManager);
    embeddedMCPServer = new EmbeddedMCPServer(webviewBridge);

    // Initialize v2.2 components (HTTP bridge for embedded webview mode)
    httpBridge = new HttpBridge(embeddedMCPServer, previewManager);
    const bridgePort = await httpBridge.start();
    outputChannel.appendLine(`✨ HTTP Bridge started on port ${bridgePort}`);

    // Store bridge port in context for MCP provider
    await context.globalState.update('aieye.bridgePort', bridgePort);

    // Register commands
    registerCommands(context);

    // Register MCP server provider (for Claude Code / Copilot auto-discovery)
    registerMcpServerProvider(context);

    outputChannel.appendLine('AI Eye extension activated successfully!');
    outputChannel.appendLine('✨ v2 Embedded MCP Server initialized');
    outputChannel.appendLine('✨ v2.2 HTTP Bridge ready for embedded webview mode');
    outputChannel.appendLine(`Configuration: ${JSON.stringify(ConfigManager.getConfig(), null, 2)}`);

    // Return API for other extensions/agents
    return {
      getWebviewBridge: () => webviewBridge,
      getEmbeddedMCPServer: () => embeddedMCPServer,
      isPreviewReady: async () => {
        if (!webviewBridge) return false;
        return await webviewBridge.isReady();
      },
      openPreview: async () => {
        await previewManager?.openPreview();
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`Failed to activate: ${errorMessage}`);
    vscode.window.showErrorMessage(`AI Eye failed to activate: ${errorMessage}`);
    throw error;
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Command: Open Live Preview
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.openPreview', async () => {
      try {
        outputChannel?.appendLine('Opening preview...');
        await previewManager?.openPreview();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(`Error opening preview: ${errorMessage}`);
        vscode.window.showErrorMessage(`Failed to open preview: ${errorMessage}`);
      }
    })
  );

  // Command: Start MCP Server
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.startServer', async () => {
      try {
        outputChannel?.appendLine('Starting MCP server...');
        // MCP server will be implemented in Phase 5
        vscode.window.showInformationMessage(
          'MCP Server functionality will be available in Phase 5'
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(`Error starting MCP server: ${errorMessage}`);
        vscode.window.showErrorMessage(`Failed to start MCP server: ${errorMessage}`);
      }
    })
  );

  // Command: Reload Preview
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.reloadPreview', async () => {
      try {
        outputChannel?.appendLine('Reloading preview...');
        previewManager?.reload();
        vscode.window.showInformationMessage('Preview reloaded');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(`Error reloading preview: ${errorMessage}`);
        vscode.window.showErrorMessage(`Failed to reload preview: ${errorMessage}`);
      }
    })
  );

  // Command: Toggle CDP Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.toggleCDP', async () => {
      const config = ConfigManager.getConfig();
      const newValue = !config.enableCDP;
      await ConfigManager.updateConfig('enableCDP', newValue);
      outputChannel?.appendLine(`CDP mode ${newValue ? 'enabled' : 'disabled'}`);
      vscode.window.showInformationMessage(`CDP mode ${newValue ? 'enabled' : 'disabled'}`);
    })
  );

  // Command: Test Screenshot (v2)
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.testScreenshot', async () => {
      try {
        outputChannel?.appendLine('Testing v2 screenshot...');

        if (!webviewBridge) {
          vscode.window.showErrorMessage('WebviewBridge not initialized. Open preview first.');
          return;
        }

        // Check if preview is ready
        const isReady = await webviewBridge.isReady();
        if (!isReady) {
          vscode.window.showWarningMessage('Webview not ready. Waiting...');
          await webviewBridge.waitForReady(10000);
        }

        vscode.window.showInformationMessage('Capturing screenshot...');

        // Capture screenshot
        const dataUrl = await webviewBridge.captureScreenshot('jpeg', 80);

        outputChannel?.appendLine(`Screenshot captured! Length: ${dataUrl.length} bytes`);

        // Save to temp file and show
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const tempDir = os.tmpdir();
        const filename = `aieye-screenshot-${Date.now()}.jpg`;
        const filepath = path.join(tempDir, filename);

        // Extract base64 data (remove data:image/jpeg;base64, prefix)
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filepath, base64Data, 'base64');

        outputChannel?.appendLine(`Screenshot saved to: ${filepath}`);

        // Show success message with option to open
        const action = await vscode.window.showInformationMessage(
          `Screenshot captured successfully!`,
          'Open File',
          'Open Folder'
        );

        if (action === 'Open File') {
          const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filepath));
          await vscode.window.showTextDocument(doc);
        } else if (action === 'Open Folder') {
          vscode.env.openExternal(vscode.Uri.file(tempDir));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(`Screenshot test failed: ${errorMessage}`);
        vscode.window.showErrorMessage(`Screenshot failed: ${errorMessage}`);
      }
    })
  );

  // Command: Run V2 Comprehensive Tests
  context.subscriptions.push(
    vscode.commands.registerCommand('aieye.runV2Tests', async () => {
      try {
        outputChannel?.appendLine('='.repeat(60));
        outputChannel?.appendLine('STARTING V2 COMPREHENSIVE TESTS');
        outputChannel?.appendLine('='.repeat(60));

        if (!webviewBridge || !embeddedMCPServer) {
          vscode.window.showErrorMessage('V2 components not initialized!');
          return;
        }

        const results: { test: string; passed: boolean; error?: string }[] = [];

        // Helper to log test results
        const logTest = (name: string, passed: boolean, error?: string) => {
          results.push({ test: name, passed, error });
          const status = passed ? '✅ PASS' : '❌ FAIL';
          outputChannel?.appendLine(`${status}: ${name}`);
          if (error) {
            outputChannel?.appendLine(`  Error: ${error}`);
          }
        };

        // Ensure preview is open
        outputChannel?.appendLine('\n--- Opening Preview ---');
        await previewManager?.openPreview();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 1: Check if webview is ready
        outputChannel?.appendLine('\n--- Testing WebviewBridge Methods ---');
        try {
          const ready = await webviewBridge.isReady();
          logTest('isReady()', ready);
        } catch (error) {
          logTest('isReady()', false, String(error));
        }

        // Test 2: Check bridge availability
        try {
          const available = await webviewBridge.isBridgeAvailable();
          logTest('isBridgeAvailable()', true, available ? 'Bridge loaded' : 'Bridge not loaded (expected)');
        } catch (error) {
          logTest('isBridgeAvailable()', false, String(error));
        }

        // Test 3: Get current URL
        try {
          const url = await webviewBridge.getCurrentUrl();
          logTest('getCurrentUrl()', !!url, `URL: ${url}`);
        } catch (error) {
          logTest('getCurrentUrl()', false, String(error));
        }

        // Test 4: Navigate to localhost:5175
        try {
          await webviewBridge.navigate('http://localhost:5175');
          await new Promise(resolve => setTimeout(resolve, 2000));
          const url = await webviewBridge.getCurrentUrl();
          const passed = url.includes('localhost:5175');
          logTest('navigate()', passed, `Navigated to: ${url}`);
        } catch (error) {
          logTest('navigate()', false, String(error));
        }

        // Test 5: Screenshot
        try {
          const screenshot = await webviewBridge.captureScreenshot('jpeg', 80);
          const passed = screenshot.startsWith('data:image/');
          logTest('captureScreenshot()', passed, `Size: ${screenshot.length} bytes`);
        } catch (error) {
          logTest('captureScreenshot()', false, String(error));
        }

        // Test 6: Find elements
        try {
          const elements = await webviewBridge.findElements('button', 'css');
          logTest('findElements()', Array.isArray(elements), `Found ${elements.length} buttons`);
        } catch (error) {
          logTest('findElements()', false, String(error));
        }

        // Test 7-14: Test all MCP tools
        outputChannel?.appendLine('\n--- Testing MCP Server Tools ---');

        const mcpTests = [
          { name: 'aieye_get_current_url', args: {} },
          { name: 'aieye_screenshot', args: { format: 'jpeg', quality: 80 } },
          { name: 'aieye_find_elements', args: { query: 'div', mode: 'css' } },
          { name: 'aieye_get_console_logs', args: {} },
        ];

        for (const test of mcpTests) {
          try {
            const result = await embeddedMCPServer.handleToolCall({
              method: 'tools/call',
              params: {
                name: test.name,
                arguments: test.args,
              },
            });
            const passed = !result.isError;
            logTest(`MCP: ${test.name}`, passed, passed ? 'Success' : result.content[0]?.text);
          } catch (error) {
            logTest(`MCP: ${test.name}`, false, String(error));
          }
        }

        // Summary
        outputChannel?.appendLine('\n' + '='.repeat(60));
        outputChannel?.appendLine('TEST SUMMARY');
        outputChannel?.appendLine('='.repeat(60));
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        outputChannel?.appendLine(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
        outputChannel?.appendLine('='.repeat(60));

        vscode.window.showInformationMessage(
          `V2 Tests Complete: ${passed}/${results.length} passed`,
          'View Output'
        ).then(action => {
          if (action === 'View Output') {
            outputChannel?.show();
          }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(`Fatal error during testing: ${errorMessage}`);
        vscode.window.showErrorMessage(`V2 tests failed: ${errorMessage}`);
      }
    })
  );

  outputChannel?.appendLine('Commands registered successfully');
}

/**
 * Register MCP server provider for auto-discovery by AI agents
 * This allows Claude Code, Cursor, and other MCP-aware agents to automatically
 * discover and use AI Eye's tools without manual configuration
 */
function registerMcpServerProvider(context: vscode.ExtensionContext): void {
  try {
    // Check if VS Code has MCP support (1.96+)
    if ('lm' in vscode && 'registerMcpServerDefinitionProvider' in (vscode as any).lm) {
      const emitter = new vscode.EventEmitter<void>();

      (vscode as any).lm.registerMcpServerDefinitionProvider('aieye', {
        onDidChangeMcpServerDefinitions: emitter.event,
        async provideMcpServerDefinitions() {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
          const bridgePort = context.globalState.get<number>('aieye.bridgePort');

          return [
            {
              label: 'AI Eye Live Preview Tools',
              command: 'node',
              args: [context.asAbsolutePath('../mcp-server/dist/index.js')],
              env: {
                // Enable webview mode if bridge is available
                AIEYE_WEBVIEW_ENABLED: bridgePort ? 'true' : 'false',
                AIEYE_BRIDGE_URL: bridgePort ? `http://localhost:${bridgePort}` : '',
                // Legacy mode (fallback to external browser)
                AIEYE_URL: 'http://localhost:5175',
                WORKSPACE: workspaceRoot,
                VSCODE_PID: String(process.pid),
              },
            },
          ];
        },
      });

      outputChannel?.appendLine('MCP server provider registered');
    } else {
      outputChannel?.appendLine(
        'VS Code version does not support MCP server providers (requires 1.96+)'
      );
    }
  } catch (error) {
    outputChannel?.appendLine(`Failed to register MCP provider: ${error}`);
    // Not a critical error, extension can still work without MCP
  }
}

/**
 * Extension deactivation
 * Called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
  outputChannel?.appendLine('AI Eye extension is deactivating...');

  try {
    // Cleanup resources
    if (httpBridge) {
      await httpBridge.stop();
      httpBridge = undefined;
      outputChannel?.appendLine('HTTP Bridge stopped');
    }

    if (previewManager) {
      previewManager.dispose();
      previewManager = undefined;
    }

    // v2.2: CDPBridge not used
    // if (cdpBridge) {
    //   await cdpBridge.dispose();
    //   cdpBridge = undefined;
    // }

    outputChannel?.appendLine('AI Eye extension deactivated successfully');
    outputChannel?.dispose();
    outputChannel = undefined;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`Error during deactivation: ${errorMessage}`);
  }
}
