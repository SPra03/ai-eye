# VisionCraft Troubleshooting Guide

Common issues and solutions for VisionCraft users.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [MCP Server Issues](#mcp-server-issues)
- [VS Code Extension Issues](#vs-code-extension-issues)
- [Vite Plugin Issues](#vite-plugin-issues)
- [Babel Plugin Issues](#babel-plugin-issues)
- [Browser Connection Issues](#browser-connection-issues)
- [Source Mapping Issues](#source-mapping-issues)
- [Performance Issues](#performance-issues)
- [Error Messages Explained](#error-messages-explained)

---

## Installation Issues

### `pnpm` Command Not Found

**Error:**
```
command not found: pnpm
```

**Solution:**
Use `npx pnpm` instead:
```bash
npx pnpm install
npx pnpm build
```

Or install pnpm globally:
```bash
npm install -g pnpm
```

### Dependencies Not Installing

**Error:**
```
ENOENT: no such file or directory
```

**Solution:**
1. Make sure you're in the root directory
2. Clean and reinstall:
```bash
rm -rf node_modules packages/*/node_modules
npx pnpm install
```

### Build Fails with TypeScript Errors

**Error:**
```
error TS2307: Cannot find module 'vscode'
```

**Solution:**
This is normal! The `vscode` module is external and provided at runtime. Make sure you're using the correct build command:
```bash
npx pnpm build
```

---

## MCP Server Issues

### "Not connected to browser"

**Error:**
```
Error: Not connected to browser. Call connect() first or check if the browser is running.
```

**Causes & Solutions:**

1. **Dev server not running:**
   ```bash
   # Start your dev server
   cd your-project
   npm run dev
   ```

2. **Wrong URL:**
   Check the URL in your Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "visioncraft": {
         "env": {
           "VISIONCRAFT_URL": "http://localhost:5173"  // ← Verify this
         }
       }
     }
   }
   ```

3. **Browser crashed:**
   Restart the MCP server (close and reopen Claude Desktop)

### "VisionCraft bridge not available"

**Error:**
```
VisionCraft bridge not available in CDP-only mode. Ensure @visioncraft/vite-plugin is installed and the dev server is running.
```

**Solutions:**

1. **Install the Vite plugin:**
   ```bash
   npm install @visioncraft/vite-plugin --save-dev
   ```

2. **Configure it in vite.config.ts:**
   ```typescript
   import visionCraft from '@visioncraft/vite-plugin';

   export default defineConfig({
     plugins: [visionCraft()],
   });
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### MCP Server Won't Start

**Error:**
```
Failed to start MCP server
```

**Solutions:**

1. **Check the path in Claude Desktop config:**
   ```json
   {
     "mcpServers": {
       "visioncraft": {
         "command": "node",
         "args": ["/FULL/PATH/TO/visioncraft/packages/mcp-server/dist/index.js"]
       }
     }
   }
   ```

2. **Build the MCP server:**
   ```bash
   cd packages/mcp-server
   npm run build
   ls dist/index.js  # Verify it exists
   ```

3. **Check Node version:**
   ```bash
   node --version  # Should be 18 or higher
   ```

### Screenshots Not Working

**Error:**
```
Browser page not available
```

**Solutions:**

1. **Navigate to a page first:**
   Use `visioncraft_navigate` before taking screenshots

2. **Check browser connection:**
   ```
   visioncraft_get_current_url
   ```
   If this fails, the browser isn't connected

3. **Restart MCP server:**
   Close and reopen Claude Desktop

---

## VS Code Extension Issues

### Extension Not Loading

**Symptoms:**
- Commands not appearing in Command Palette
- No "VisionCraft" in the list

**Solutions:**

1. **Build the extension:**
   ```bash
   npx pnpm --filter @visioncraft/extension build
   ```

2. **Check build output:**
   ```bash
   ls packages/extension/dist/extension.js
   # Should exist and be non-zero size
   ```

3. **Reload VS Code:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: "Developer: Reload Window"

4. **Check extension host logs:**
   - Press `Cmd+Shift+P`
   - Type: "Developer: Show Logs"
   - Select "Extension Host"
   - Look for errors

### F5 Debugging Not Working

**Issue:** Pressing F5 doesn't launch Extension Development Host

**Solutions:**

1. **Verify you're in the workspace root:**
   ```bash
   pwd  # Should end with /vscode-eye
   ```

2. **Check .vscode/launch.json exists:**
   ```bash
   ls .vscode/launch.json
   ```

3. **Open Run and Debug panel:**
   - Press `Cmd+Shift+D`
   - Should see "Run Extension" in dropdown
   - Click the green play button

4. **Try the alternative method:**
   - Press `Cmd+Shift+P`
   - "Tasks: Run Task"
   - Select "npm: build - packages/extension"
   - Then press F5

### Preview Panel Not Opening

**Error:**
```
Command 'visioncraft.openPreview' not found
```

**Solutions:**

1. **Check extension activated:**
   Look for "VisionCraft extension activated" in Output panel

2. **Verify commands registered:**
   - Press `Cmd+Shift+P`
   - Type "VisionCraft"
   - Should see 4 commands

3. **Check package.json:**
   ```bash
   grep -A 10 "contributes" packages/extension/package.json
   ```
   Should list all commands

### "Cannot find module" Error

**Error:**
```
Cannot find module '@visioncraft/bridge'
```

**Solution:**
Build all packages:
```bash
npx pnpm build
```

---

## Vite Plugin Issues

### Bridge Script Not Loading

**Symptoms:**
- No `data-vc-source` attributes on elements
- `window.__VISIONCRAFT__` is undefined

**Solutions:**

1. **Verify plugin is installed and configured:**
   ```bash
   npm list @visioncraft/vite-plugin
   ```

2. **Check vite.config.ts:**
   ```typescript
   import visionCraft from '@visioncraft/vite-plugin';

   export default defineConfig({
     plugins: [
       visionCraft(),  // ← Should be here
     ],
   });
   ```

3. **Restart dev server:**
   Stop and start your dev server

4. **Check browser console:**
   Look for errors loading the bridge script

5. **Verify bridge was built:**
   ```bash
   ls packages/bridge/dist/visioncraft-bridge.js
   ```

### Source Mapping Not Working

**Issue:** Elements don't have `data-vc-source` attributes

**Solutions:**

1. **Check if files are being transformed:**
   Open Dev Tools → Elements tab
   Inspect an element
   Look for `data-vc-source`, `data-vc-line`, `data-vc-col` attributes

2. **Verify file extensions match:**
   Default: `/(jsx|tsx|vue|svelte)$/`

   Customize if needed:
   ```typescript
   visionCraft({
     include: /\.(jsx|tsx)$/,  // Only React
   })
   ```

3. **Check if enabled in dev mode:**
   ```typescript
   visionCraft({
     enabled: true,  // Force enable
   })
   ```

### HMR Not Working

**Symptoms:**
- Changes not appearing
- Need to refresh manually

**Solutions:**

1. **Check HMR status:**
   ```
   visioncraft_get_hmr_status
   ```

2. **Verify Vite config:**
   ```typescript
   export default defineConfig({
     server: {
       hmr: true,  // Ensure HMR is enabled
     },
   });
   ```

3. **Check for errors:**
   ```
   visioncraft_get_hmr_status
   ```
   Look at the `errors` array

4. **Restart dev server:**
   Sometimes HMR gets stuck

---

## Babel Plugin Issues

### Plugin Not Transforming JSX

**Issue:** Using Babel (not Vite), source attributes not added

**Solutions:**

1. **Verify plugin is installed:**
   ```bash
   npm list @visioncraft/babel-plugin
   ```

2. **Check .babelrc or babel.config.js:**
   ```json
   {
     "plugins": [
       "@visioncraft/babel-plugin"
     ]
   }
   ```

3. **Enable explicitly if needed:**
   ```json
   {
     "plugins": [
       ["@visioncraft/babel-plugin", {
         "enabled": true
       }]
     ]
   }
   ```

### Wrong File Paths in Attributes

**Issue:** `data-vc-source` has incorrect paths

**Solution:**
Set the `root` option:
```json
{
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "root": "/absolute/path/to/project"
    }]
  ]
}
```

---

## Browser Connection Issues

### Connection Timeout

**Error:**
```
Failed to connect to CDP endpoint after 3 attempts
```

**Solutions:**

1. **For CDP Connect mode:**
   Ensure Chrome is running with remote debugging:
   ```bash
   # Mac
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222

   # Windows
   chrome.exe --remote-debugging-port=9222

   # Linux
   google-chrome --remote-debugging-port=9222
   ```

2. **For Playwright Launch mode (default):**
   No Chrome needed, but ensure Playwright is installed:
   ```bash
   npx playwright install chromium
   ```

3. **Check firewall:**
   Make sure port 9222 (CDP) or your dev server port isn't blocked

### Page Crash Detected

**Error:**
```
[CDP] Page crashed! The browser tab has crashed unexpectedly.
```

**Solutions:**

1. **Check console for errors:**
   ```
   visioncraft_get_console_logs
   ```

2. **Reduce memory usage:**
   - Close other tabs
   - Restart browser

3. **Update Playwright:**
   ```bash
   npm update playwright-core
   ```

### Browser Disconnected

**Error:**
```
[CDP] Browser disconnected. Connection lost.
```

**Solutions:**

1. **Restart the MCP server:**
   Close and reopen Claude Desktop

2. **Check if browser was closed:**
   Don't close the automated browser window

3. **Check system resources:**
   Browser may have been killed due to low memory

---

## Source Mapping Issues

### "Source mapping not available for this element"

**Error:**
```
Source mapping not available for this element. Ensure @visioncraft/vite-plugin or @visioncraft/babel-plugin is configured.
```

**Causes:**

1. **Plugin not configured:**
   See [Vite Plugin Issues](#vite-plugin-issues) or [Babel Plugin Issues](#babel-plugin-issues)

2. **Element from external library:**
   Third-party components won't have source mapping

3. **Production build:**
   Source mapping is disabled in production

**Solution:**
For your own components, ensure the plugin is configured correctly. For third-party components, this is expected behavior.

### Invalid Source Location

**Error:**
```
Invalid source location: line=0, col=-1
```

**Cause:**
Corrupted source mapping data

**Solution:**
1. Clean and rebuild:
   ```bash
   rm -rf dist .vite node_modules/.vite
   npm run dev
   ```

2. Check your build configuration doesn't interfere with source maps

---

## Performance Issues

### MCP Server Using Too Much Memory

**Symptom:**
MCP server process using >500MB RAM

**Solutions:**

1. **Use CDP Connect mode:**
   Much more efficient than Playwright Launch

   Update Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "visioncraft": {
         "env": {
           "VISIONCRAFT_MODE": "cdp-connect"
         }
       }
     }
   }
   ```

2. **Restart periodically:**
   Close and reopen Claude Desktop

3. **Check for memory leaks:**
   Look at browser's Task Manager

### Slow Screenshot Capture

**Symptom:**
Screenshots take >5 seconds

**Solutions:**

1. **Reduce quality:**
   ```json
   { "quality": 60, "format": "jpeg" }
   ```

2. **Don't capture full page:**
   Default already captures full page, but browser might be rendering a very large page

3. **Check page complexity:**
   Very complex pages (1000s of elements) will be slower

### Slow HMR Updates

**Symptom:**
Changes take >3 seconds to appear

**Solutions:**

1. **Check HMR latency:**
   ```
   visioncraft_get_hmr_status
   ```
   Look at `averageLatency`

2. **Reduce bundle size:**
   - Use code splitting
   - Lazy load components

3. **Check Vite config:**
   ```typescript
   export default defineConfig({
     optimizeDeps: {
       include: ['react', 'react-dom'],  // Pre-bundle dependencies
     },
   });
   ```

---

## Error Messages Explained

### "Element not found"

**Full Error:**
```
Element not found: button.missing
```

**What it means:**
The CSS selector didn't match any element on the page

**Solutions:**
1. Take a screenshot to see what's actually there
2. Use `visioncraft_find_elements` to search by text
3. Use `visioncraft_get_structure` to see the DOM
4. Verify the selector is correct

### "Invalid URL format"

**Full Error:**
```
Invalid URL format: "localhost:3000". URL must include protocol (e.g., "http://localhost:3000" or "https://example.com")
```

**What it means:**
URL is missing `http://` or `https://`

**Solution:**
Add the protocol:
```
http://localhost:3000  ✅
https://example.com    ✅
localhost:3000         ❌
```

### "Navigation failed"

**Full Error:**
```
Navigation to "http://localhost:3000" failed: net::ERR_CONNECTION_REFUSED. Check if the URL is correct and the server is running.
```

**What it means:**
The development server isn't running or the URL is wrong

**Solutions:**
1. Start your dev server: `npm run dev`
2. Verify the URL is correct
3. Check the port number

### "Bridge method not found"

**Full Error:**
```
Bridge method not found: unknownMethod. Available methods: inspectElement, clickElement, ...
```

**What it means:**
Tried to call a method that doesn't exist in the bridge API

**Solution:**
This is usually a bug in VisionCraft. Check the available methods in the error message and use one of those.

---

## Getting More Help

### Enable Debug Logging

Set environment variable:
```bash
export DEBUG=visioncraft:*
```

Then restart the MCP server.

### Check Version Compatibility

```bash
# Check Node version (should be 18+)
node --version

# Check VS Code version
code --version

# Check package versions
npm list @visioncraft/vite-plugin
npm list @visioncraft/babel-plugin
npm list @visioncraft/mcp-server
```

### Collect Diagnostic Information

When reporting issues, include:

1. **Environment:**
   - OS and version
   - Node version
   - VS Code version (if using extension)

2. **Configuration:**
   - vite.config.ts (or webpack/babel config)
   - Claude Desktop config (MCP section)

3. **Error messages:**
   - Full error text
   - Console logs
   - Stack traces

4. **Steps to reproduce:**
   - What you were doing
   - What you expected
   - What actually happened

### Where to Get Help

- **GitHub Issues**: [https://github.com/SPra03/ai-eye/issues](https://github.com/SPra03/ai-eye/issues)
- **Documentation**: See `docs/` folder
- **API Reference**: `docs/API.md`
- **AI Usage Guide**: `docs/AI-USAGE.md`

---

## Quick Diagnostics Checklist

Run through this checklist to diagnose most issues:

```bash
# 1. Check you're in the right directory
pwd  # Should end with /visioncraft or your project name

# 2. Check Node version
node --version  # Should be 18+

# 3. Check if packages are built
ls packages/*/dist/  # Should see files in each

# 4. Rebuild if needed
npx pnpm build

# 5. Check dev server is running
curl http://localhost:5173  # Should return HTML

# 6. Check MCP server can start
node packages/mcp-server/dist/index.js
# Should show: [MCP] VisionCraft MCP Server running on stdio

# 7. Check browser can connect
# (If using MCP server, it will auto-connect)

# 8. Check for errors in logs
# VS Code: Output panel
# MCP: Claude Desktop logs
# Browser: Dev Tools console
```

If all checks pass and you still have issues, see [Getting More Help](#getting-more-help) above.

---

**Still stuck? Don't hesitate to ask for help! 🆘**
