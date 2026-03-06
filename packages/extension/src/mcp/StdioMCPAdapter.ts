/**
 * STDIO MCP Adapter
 * Bridges STDIO communication (for Claude Code) to the EmbeddedMCPServer
 * This allows Claude Code to discover and use AI Eye tools via VS Code extension API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { EmbeddedMCPServer } from './EmbeddedMCPServer.js';

/**
 * Adapts the EmbeddedMCPServer to communicate via STDIO
 * This enables Claude Code CLI to use AI Eye tools
 */
export class StdioMCPAdapter {
  private server: Server;

  constructor(private embeddedServer: EmbeddedMCPServer) {
    this.server = new Server(
      {
        name: 'aieye-embedded',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[STDIO MCP Adapter Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('[STDIO MCP Adapter] Shutting down...');
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.embeddedServer.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.embeddedServer.handleToolCall(request);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the STDIO server
   * This connects to stdin/stdout for communication with Claude Code
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[STDIO MCP Adapter] AI Eye STDIO adapter running');
  }
}
