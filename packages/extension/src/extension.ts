import * as vscode from 'vscode';
import { PreviewManager } from './preview/PreviewManager';
import { CDPBridge } from './automation/CDPBridge';
import { ConfigManager } from './config/ConfigManager';

/**
 * Extension state management
 */
let previewManager: PreviewManager | undefined;
let cdpBridge: CDPBridge | undefined;
let outputChannel: vscode.OutputChannel | undefined;

/**
 * Extension activation
 * Called when the extension is activated (lazy activation via activationEvents)
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  outputChannel = vscode.window.createOutputChannel('VisionCraft');
  outputChannel.appendLine('VisionCraft extension is activating...');

  try {
    // Initialize managers
    previewManager = new PreviewManager(context);
    cdpBridge = new CDPBridge();

    // Register commands
    registerCommands(context);

    // Register MCP server provider (for Claude Code / Copilot auto-discovery)
    registerMcpServerProvider(context);

    outputChannel.appendLine('VisionCraft extension activated successfully!');
    outputChannel.appendLine(`Configuration: ${JSON.stringify(ConfigManager.getConfig(), null, 2)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`Failed to activate: ${errorMessage}`);
    vscode.window.showErrorMessage(`VisionCraft failed to activate: ${errorMessage}`);
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Command: Open Live Preview
  context.subscriptions.push(
    vscode.commands.registerCommand('visioncraft.openPreview', async () => {
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
    vscode.commands.registerCommand('visioncraft.startServer', async () => {
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
    vscode.commands.registerCommand('visioncraft.reloadPreview', async () => {
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
    vscode.commands.registerCommand('visioncraft.toggleCDP', async () => {
      const config = ConfigManager.getConfig();
      const newValue = !config.enableCDP;
      await ConfigManager.updateConfig('enableCDP', newValue);
      outputChannel?.appendLine(`CDP mode ${newValue ? 'enabled' : 'disabled'}`);
      vscode.window.showInformationMessage(`CDP mode ${newValue ? 'enabled' : 'disabled'}`);
    })
  );

  outputChannel?.appendLine('Commands registered successfully');
}

/**
 * Register MCP server provider for auto-discovery by AI agents
 * This allows Claude Code, Cursor, and other MCP-aware agents to automatically
 * discover and use VisionCraft's tools without manual configuration
 */
function registerMcpServerProvider(context: vscode.ExtensionContext): void {
  try {
    // Check if VS Code has MCP support (1.96+)
    if ('lm' in vscode && 'registerMcpServerDefinitionProvider' in (vscode as any).lm) {
      const emitter = new vscode.EventEmitter<void>();

      (vscode as any).lm.registerMcpServerDefinitionProvider('visioncraft', {
        onDidChangeMcpServerDefinitions: emitter.event,
        async provideMcpServerDefinitions() {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

          return [
            {
              label: 'VisionCraft',
              command: 'node',
              args: [context.asAbsolutePath('../../mcp-server/dist/index.js')],
              env: {
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
  outputChannel?.appendLine('VisionCraft extension is deactivating...');

  try {
    // Cleanup resources
    if (previewManager) {
      previewManager.dispose();
      previewManager = undefined;
    }

    if (cdpBridge) {
      await cdpBridge.dispose();
      cdpBridge = undefined;
    }

    outputChannel?.appendLine('VisionCraft extension deactivated successfully');
    outputChannel?.dispose();
    outputChannel = undefined;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`Error during deactivation: ${errorMessage}`);
  }
}
