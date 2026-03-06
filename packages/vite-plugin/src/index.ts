import type { Plugin, ViteDevServer } from 'vite';
import MagicString from 'magic-string';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

export interface AIEyeVitePluginOptions {
  /**
   * Root directory for relative path calculation
   * Defaults to process.cwd()
   */
  root?: string;

  /**
   * Enable/disable the plugin
   * Defaults to true in development, false in production
   */
  enabled?: boolean;

  /**
   * Custom attribute prefix (default: 'data-ae')
   */
  attributePrefix?: string;

  /**
   * Enable HMR status broadcasting
   * Defaults to true
   */
  enableHMR?: boolean;

  /**
   * File extensions to process
   */
  include?: RegExp;

  /**
   * File paths to exclude
   */
  exclude?: RegExp;
}

/**
 * Vite plugin for AI Eye source mapping and HMR integration
 */
// Virtual module ID for the bridge script
// Add .ts extension so Vite knows to transform TypeScript
const BRIDGE_MODULE_ID = '@ai-eye/bridge';
const BRIDGE_MODULE_ID_RESOLVED = '\0' + BRIDGE_MODULE_ID + '.ts';

export default function aiEyeVitePlugin(
  options: AIEyeVitePluginOptions = {}
): Plugin {
  const {
    root = process.cwd(),
    enabled,
    attributePrefix = 'data-ae',
    enableHMR = true,
    include = /\.(jsx|tsx|vue|svelte)$/,
    exclude = /node_modules/,
  } = options;

  let server: ViteDevServer | undefined;
  let isEnabled = enabled;
  let bridgeSource: string | null = null;

  return {
    name: 'aieye-source-map',
    enforce: 'pre', // Run before other plugins

    configResolved(config) {
      // Auto-enable in development if not explicitly set
      if (isEnabled === undefined) {
        isEnabled = config.mode === 'development';
      }

      // Load bridge source code once during config resolution
      if (isEnabled) {
        try {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const bridgePath = path.resolve(__dirname, '../../bridge/src/aieye-bridge.ts');

          if (fs.existsSync(bridgePath)) {
            bridgeSource = fs.readFileSync(bridgePath, 'utf-8');
            console.log('[AI Eye] Loaded bridge source from:', bridgePath);
          } else {
            console.warn(
              '[AI Eye] Bridge source not found at:', bridgePath,
              '\nThis is expected if you installed via npm. The bridge will be loaded from node_modules.'
            );
          }
        } catch (error) {
          console.error(
            '[AI Eye] Failed to load bridge source:', error,
            '\nPlease ensure @ai-eye/bridge is installed: npm install @ai-eye/bridge'
          );
        }
      }
    },

    // Virtual module resolution
    resolveId(id) {
      // Handle both @ai-eye/bridge and /@ai-eye/bridge
      if (id === BRIDGE_MODULE_ID || id === `/${BRIDGE_MODULE_ID}`) {
        return BRIDGE_MODULE_ID_RESOLVED;
      }
      return null;
    },

    // Virtual module loading
    async load(id) {
      if (id === BRIDGE_MODULE_ID_RESOLVED) {
        if (!bridgeSource) {
          throw new Error('[AI Eye] Bridge source not loaded');
        }

        // Transform TypeScript to JavaScript using esbuild
        // Virtual modules don't automatically go through Vite's TS transform
        const { transform } = await import('esbuild');
        const result = await transform(bridgeSource, {
          loader: 'ts',
          target: 'es2020',
          format: 'esm',
          sourcemap: true,
        });

        return {
          code: result.code,
          map: result.map,
        };
      }
      return null;
    },

    configureServer(viteServer) {
      server = viteServer;

      if (!enableHMR) {
        return;
      }

      let connectionCount = 0;

      // Track HMR connection
      server.ws.on('connection', (socket) => {
        connectionCount++;
        const connectionId = connectionCount;

        console.log(`[AI Eye HMR] Client ${connectionId} connected`);

        server!.ws.send({
          type: 'custom',
          event: 'ae:connected',
          data: {
            timestamp: Date.now(),
            connectionId,
          },
        });

        socket.on('close', () => {
          console.log(`[AI Eye HMR] Client ${connectionId} disconnected`);
          server!.ws.send({
            type: 'custom',
            event: 'ae:disconnected',
            data: {
              timestamp: Date.now(),
              connectionId,
            },
          });
        });
      });

      // Capture and broadcast errors
      server.ws.on('error', (error) => {
        console.error('[AI Eye HMR] WebSocket error:', error);
        server!.ws.send({
          type: 'custom',
          event: 'ae:error',
          data: {
            timestamp: Date.now(),
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        });
      });

      // Log when server is ready
      server.httpServer?.once('listening', () => {
        const address = server!.httpServer!.address();
        const port = typeof address === 'object' ? address?.port : 0;
        console.log('\n✨ AI Eye: Source mapping enabled');
        console.log(`🔥 HMR ready on port ${port}\n`);
      });
    },

    handleHotUpdate({ file, server, modules, timestamp }) {
      if (!enableHMR) {
        return modules;
      }

      const relPath = path.relative(root, file);
      const updateType = file.endsWith('.css')
        ? 'style'
        : file.endsWith('.vue')
        ? 'vue'
        : file.endsWith('.svelte')
        ? 'svelte'
        : file.match(/\.(jsx?|tsx?)$/)
        ? 'script'
        : 'other';

      console.log(`[AI Eye HMR] ${updateType} update: ${relPath} (${modules.length} modules)`);

      // Broadcast detailed HMR update to AI Eye
      server.ws.send({
        type: 'custom',
        event: 'ae:hmr-update',
        data: {
          file: relPath,
          timestamp,
          moduleCount: modules.length,
          type: updateType,
          modules: modules.map((m) => ({
            id: m.id,
            url: m.url,
            type: m.type,
          })),
        },
      });

      return modules;
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!isEnabled) {
          return html;
        }

        // Inject virtual module as a script tag with src attribute
        // This ensures Vite processes it through the plugin pipeline
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                type: 'module',
                src: `/${BRIDGE_MODULE_ID}`,
              },
              injectTo: 'body',
            },
          ],
        };
      },
    },

    transform(code, id) {
      // Check if plugin is enabled
      if (!isEnabled) {
        return null;
      }

      // Check if file should be processed
      if (!include.test(id) || exclude.test(id)) {
        return null;
      }

      // Skip if no JSX/HTML-like content
      if (!code.includes('<')) {
        return null;
      }

      try {
        const s = new MagicString(code);
        const relPath = path.relative(root, id);
        let modified = false;

        // Regex to find JSX/HTML opening tags
        // Matches: <Component or <div but not </Component or self-closing already processed
        const tagRegex = /<([A-Z][A-Za-z0-9.]*|[a-z][a-z0-9-]*)(\s+[^>]*?)?(\/?>)/g;
        let match;

        while ((match = tagRegex.exec(code)) !== null) {
          const tagName = match[1];
          const attributes = match[2] || '';

          // Skip if already has source mapping
          if (attributes.includes(`${attributePrefix}-source`)) {
            continue;
          }

          // Skip fragments
          if (tagName === 'Fragment' || tagName === '') {
            continue;
          }

          // Calculate line and column
          const startPos = match.index;
          const linesBefore = code.substring(0, startPos).split('\n');
          const line = linesBefore.length;
          const col = linesBefore[linesBefore.length - 1].length;

          // Position to insert attributes (after tag name and before existing attributes or closing)
          const insertPos = match.index + match[1].length + 1; // After '<tagName'

          // Build attribute string
          const attrs = ` ${attributePrefix}-source="${relPath}" ${attributePrefix}-line="${line}" ${attributePrefix}-col="${col}"`;

          // Insert attributes
          s.appendLeft(insertPos, attrs);
          modified = true;
        }

        if (!modified) {
          return null;
        }

        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id }),
        };
      } catch (error) {
        console.error(
          `[AI Eye] Error processing ${id}:`, error,
          '\nThis file will be skipped for source mapping. Common causes:',
          '\n  - Invalid JSX/TSX syntax',
          '\n  - Unusual tag patterns',
          '\n  - Try adding this file to the exclude pattern if it continues to fail'
        );
        return null;
      }
    },
  };
}

/**
 * HMR-only plugin for tracking AI Eye status
 * Use this if you don't want source mapping but want HMR integration
 */
export function aiEyeHMRPlugin(
  options: Pick<AIEyeVitePluginOptions, 'root' | 'enableHMR'> = {}
): Plugin {
  return aiEyeVitePlugin({
    ...options,
    enabled: false,
    enableHMR: options.enableHMR !== false,
  });
}
