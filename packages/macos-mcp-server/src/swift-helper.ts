/**
 * Swift helper subprocess wrapper.
 * Spawns the aieye-macos-helper binary and communicates via JSON over stdio.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SwiftHelperResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Locate the Swift binary
function findHelperBinary(): string {
  // Check dist/bin (built location)
  const distBin = join(__dirname, 'bin', 'aieye-macos-helper');
  if (existsSync(distBin)) return distBin;

  // Check swift-helper build directory (dev mode)
  const devBin = join(__dirname, '..', 'swift-helper', '.build', 'release', 'aieye-macos-helper');
  if (existsSync(devBin)) return devBin;

  // Check debug build
  const debugBin = join(__dirname, '..', 'swift-helper', '.build', 'debug', 'aieye-macos-helper');
  if (existsSync(debugBin)) return debugBin;

  throw new Error(
    'Swift helper binary not found. Run `pnpm build:swift` in packages/macos-mcp-server/ first.'
  );
}

let cachedBinaryPath: string | null = null;

function getBinaryPath(): string {
  if (!cachedBinaryPath) {
    cachedBinaryPath = findHelperBinary();
  }
  return cachedBinaryPath;
}

/**
 * Execute a Swift helper command and return parsed JSON result.
 *
 * @param command - The command name (e.g., "screenshot", "inspect")
 * @param args - Arguments object to pass as JSON
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 */
export async function callSwiftHelper<T = unknown>(
  command: string,
  args: Record<string, unknown> = {},
  timeoutMs: number = 30000,
): Promise<SwiftHelperResult<T>> {
  const binaryPath = getBinaryPath();
  const argsJSON = JSON.stringify(args);

  return new Promise((resolve, reject) => {
    const child = execFile(
      binaryPath,
      [command, '--args', argsJSON],
      {
        maxBuffer: 50 * 1024 * 1024, // 50MB for screenshots
        timeout: timeoutMs,
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (stderr) {
          console.error(`[Swift Helper] ${stderr}`);
        }

        if (error) {
          if (error.killed) {
            resolve({
              success: false,
              error: `Command '${command}' timed out after ${timeoutMs}ms`,
            });
          } else {
            // Try to parse stdout even on error (helper outputs JSON errors)
            if (stdout) {
              try {
                const result = JSON.parse(stdout);
                resolve(result as SwiftHelperResult<T>);
                return;
              } catch {
                // Fall through to error
              }
            }
            resolve({
              success: false,
              error: error.message,
            });
          }
          return;
        }

        if (!stdout) {
          resolve({
            success: false,
            error: `No output from command '${command}'`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result as SwiftHelperResult<T>);
        } catch {
          resolve({
            success: false,
            error: `Invalid JSON from Swift helper: ${stdout.substring(0, 200)}`,
          });
        }
      },
    );

    // Handle process errors
    child.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn Swift helper: ${err.message}`,
      });
    });
  });
}

/**
 * Convenience wrapper that throws on failure and returns just the data.
 */
export async function callSwiftHelperOrThrow<T = unknown>(
  command: string,
  args: Record<string, unknown> = {},
  timeoutMs?: number,
): Promise<T> {
  const result = await callSwiftHelper<T>(command, args, timeoutMs);
  if (!result.success) {
    throw new Error(result.error || `Swift helper command '${command}' failed`);
  }
  return result.data as T;
}
