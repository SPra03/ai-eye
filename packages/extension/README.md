# AI Eye VS Code Extension

AI-native visual development extension for VS Code that bridges the gap between your UI and source code.

---

## What is this?

The AI Eye VS Code extension provides a **live preview panel** that allows you to:

- **See your app running** directly in VS Code
- **Click elements** to jump to their source code location
- **Inspect elements** to see component hierarchies
- **Debug visually** with integrated console logs
- **Enable AI agents** to interact with your UI through MCP

This extension works seamlessly with the AI Eye MCP server to enable AI agents (like Claude Code) to visually understand and debug your application.

---

## Features

### 1. Live Preview Panel

Open a live browser preview of your app directly in VS Code:

```
Command Palette → "AI Eye: Open Live Preview"
```

- Real-time updates via HMR
- Interactive UI (click, scroll, type)
- Source code navigation (click elements → jump to code)
- Console log integration

### 2. Source Mapping

Every element in the preview is linked to its source code:

- Click any element to see its file, line, and column
- Navigate directly to component definitions
- Understand component hierarchies visually

### 3. CDP Mode (Optional)

Enable Chrome DevTools Protocol for advanced debugging:

```
Command Palette → "AI Eye: Toggle CDP Mode"
```

When enabled:
- Full DevTools API access
- Network request inspection
- Performance profiling
- Advanced element inspection

### 4. MCP Server Integration

The extension automatically exposes AI Eye's MCP server to AI agents:

- No manual configuration needed for Claude Code
- AI agents can take screenshots, inspect elements, interact with UI
- Works with any MCP-compatible AI agent (VS Code 1.96+)

---

## Installation

### From Source (Current)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SPra03/ai-eye.git
   cd ai-eye
   ```

2. **Install dependencies:**
   ```bash
   npm install -g pnpm  # or use: npx pnpm
   pnpm install
   ```

3. **Build the extension:**
   ```bash
   pnpm build
   ```

4. **Open in VS Code:**
   ```bash
   code .
   ```

5. **Run Extension Development Host:**
   - Press `F5` in VS Code
   - Or: Run and Debug panel → "Run Extension"
   - A new VS Code window opens with the extension loaded

### From VS Code Marketplace (Coming Soon)

Once published:
```
Extensions panel → Search "AI Eye" → Install
```

---

## Quick Start

### 1. Configure Your Project

Install the Vite plugin in your project:

```bash
npm install @ai-eye/vite-plugin --save-dev
```

Add to `vite.config.ts`:

```typescript
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    aiEye(),
  ],
});
```

### 2. Start Your Dev Server

```bash
npm run dev
# Dev server running at http://localhost:5173
```

### 3. Open AI Eye Preview

In VS Code:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type: "AI Eye: Open Live Preview"
- Preview panel opens showing your app

### 4. Interact with the Preview

- **Click elements** to navigate to source code
- **Inspect** to see component hierarchies
- **Console logs** appear in VS Code Output panel
- **HMR updates** automatically refresh the preview

---

## Configuration

Open VS Code settings (`Cmd+,` or `Ctrl+,`) and search for "AI Eye":

### `aieye.devServerUrl`

URL of your running dev server.

- **Type:** `string`
- **Default:** `"http://localhost:5173"`
- **Example:** `"http://localhost:3000"`

### `aieye.framework`

Framework detection mode for optimized source mapping.

- **Type:** `"auto" | "react" | "vue" | "svelte" | "html"`
- **Default:** `"auto"`
- **Description:** Set to your framework for better performance, or leave as "auto"

### `aieye.screenshotQuality`

JPEG quality for screenshots taken by AI agents.

- **Type:** `number` (30-100)
- **Default:** `80`
- **Description:** Higher = better quality but larger file size

### `aieye.enableCDP`

Enable Chrome DevTools Protocol fallback mode.

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enables advanced debugging features (requires Chrome with `--remote-debugging-port=9222`)

---

## Commands

All commands are available via Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

### `AI Eye: Open Live Preview`

Opens the live preview panel showing your running application.

**Usage:**
1. Make sure your dev server is running
2. Run this command
3. Preview panel appears on the side

### `AI Eye: Reload Preview`

Refreshes the preview panel (useful if the page becomes unresponsive).

**Usage:**
- Run command to force reload
- Or close and reopen preview

### `AI Eye: Toggle CDP Mode`

Enables/disables Chrome DevTools Protocol mode.

**When to use:**
- Need advanced DevTools features
- MCP server needs CDP access
- Debugging complex issues

**Requirements:**
- Chrome running with: `--remote-debugging-port=9222`

### `AI Eye: Start MCP Server`

*(Reserved for future use - MCP server is currently standalone)*

---

## Usage Patterns

### For Human Developers

**Visual Debugging:**
```
1. Open Live Preview
2. See bug in preview
3. Click element → jumps to source
4. Fix code → see update instantly
```

**Component Exploration:**
```
1. Open preview of new codebase
2. Click around to explore components
3. Understand structure visually
4. Navigate to relevant code
```

### For AI Agents (Claude Code, etc.)

AI agents can use AI Eye automatically when:
- Extension is installed in VS Code 1.96+
- MCP server is running
- Your dev server is running

The AI can then:
- Take screenshots to see your UI
- Inspect elements to find source locations
- Interact with buttons/forms
- Debug console errors
- Verify fixes visually

See [docs/AI-USAGE.md](../../docs/AI-USAGE.md) for comprehensive AI agent guide.

---

## For AI Agents

### Overview

AI Eye extension provides **visual debugging capabilities** to AI agents through the Model Context Protocol (MCP). When you're working with an AI agent in VS Code (like Claude Code), the agent can:

- **See your UI** by taking screenshots
- **Inspect elements** to find source code locations
- **Interact with UI** by clicking buttons, typing in inputs
- **Debug errors** by reading console logs
- **Verify changes** by taking before/after screenshots

### MCP Tools Available

When the extension is active, AI agents have access to 14 MCP tools:

| Tool | Purpose |
|------|---------|
| `aieye_screenshot` | Capture current page state |
| `aieye_navigate` | Navigate to different URL |
| `aieye_inspect_element` | Get full element details + source location |
| `aieye_get_source` | Get just the source location (faster) |
| `aieye_get_structure` | Get DOM tree with source mapping |
| `aieye_find_elements` | Search for elements by text/role/selector |
| `aieye_click` | Click an element |
| `aieye_type` | Type text into input |
| `aieye_scroll` | Scroll the page |
| `aieye_get_console_logs` | Read browser console |
| `aieye_clear_console_logs` | Clear console log buffer |
| `aieye_get_hmr_status` | Check HMR status and errors |
| `aieye_clear_hmr_errors` | Clear HMR error history |
| `aieye_get_current_url` | Get current page URL |

### Typical AI Workflow

**User:** "The login button isn't working"

**AI Agent:**
1. Takes screenshot to see current state
2. Finds login button element
3. Gets source location (e.g., `src/components/Login.tsx:45`)
4. Inspects button to see attributes and handlers
5. Checks console for errors
6. Identifies issue and proposes fix
7. After fix, takes screenshot to verify

**User:** "Can you improve the layout of the dashboard?"

**AI Agent:**
1. Takes screenshot of dashboard
2. Gets structure to understand component hierarchy
3. Inspects layout elements to find source files
4. Reads relevant component files
5. Suggests layout improvements
6. Makes changes to code
7. Takes screenshot to show improved layout

### Requirements for AI Agents

For AI agents to use AI Eye:

1. **VS Code 1.96+** (MCP server provider API)
2. **Extension installed and active**
3. **Dev server running** with AI Eye plugin
4. **MCP-compatible AI agent** (Claude Code, etc.)

The extension automatically registers the MCP server with VS Code, so no manual configuration is needed.

### Best Practices for AI Agents

- **Always start with screenshot** to see current state
- **Use `get_source` instead of `inspect_element`** if you only need the file location (faster)
- **Check console logs after interactions** to catch errors
- **Verify changes with screenshots** before and after
- **Use `find_elements`** to search for elements by description rather than guessing selectors
- **Clear console logs** before testing to see only new errors

### Error Handling

If AI agents encounter errors:

**"Not connected to browser"**
→ Dev server not running or wrong URL configured

**"Element not found"**
→ Use `find_elements` to search by text, or take screenshot to see what's actually there

**"Bridge not available"**
→ AI Eye plugin not installed in dev server

See [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md) for full error reference.

---

## Architecture

The extension consists of several components:

```
extension/
├── src/
│   ├── extension.ts          # Main activation
│   ├── preview/
│   │   └── PreviewManager.ts # Live preview panel
│   ├── automation/
│   │   └── CDPBridge.ts      # CDP automation
│   └── config/
│       └── ConfigManager.ts  # Settings management
└── dist/
    └── extension.js          # Bundled output
```

### How It Works

1. **Extension activates** when VS Code starts
2. **Registers commands** in Command Palette
3. **Registers MCP server provider** for AI agent auto-discovery
4. **Preview Manager** creates webview panel when requested
5. **Injects bridge script** into preview for source mapping
6. **CDPBridge** (optional) connects to Chrome DevTools Protocol
7. **MCP Server** (separate process) uses extension APIs to interact with browser

---

## Development

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Build extension
pnpm --filter @ai-eye/extension build

# Watch mode
pnpm --filter @ai-eye/extension dev
```

### Debug Extension

1. Open workspace in VS Code: `code .`
2. Press `F5` to launch Extension Development Host
3. Set breakpoints in `src/` files
4. Debug in main VS Code window

### Build for Distribution

```bash
# Build production bundle
pnpm --filter @ai-eye/extension build

# Package as .vsix (requires vsce)
cd packages/extension
vsce package
```

### Testing

```bash
# Type check
pnpm --filter @ai-eye/extension typecheck

# Integration tests (coming soon)
pnpm test
```

---

## Troubleshooting

### Preview Panel Not Opening

**Check:**
1. Dev server is running: `curl http://localhost:5173`
2. AI Eye plugin is configured in `vite.config.ts`
3. Extension activated (see Output panel → AI Eye)

### "Command not found" Error

**Solution:**
1. Reload VS Code window: `Developer: Reload Window`
2. Check extension is active: look for "AI Eye" in Output panel
3. Reinstall extension if needed

### Source Mapping Not Working

**Check:**
1. AI Eye Vite plugin installed and configured
2. Dev server restarted after adding plugin
3. Inspecting your own code (not third-party libraries)

### CDP Mode Not Working

**Requirements:**
1. Chrome running with remote debugging:
   ```bash
   # Mac
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

   # Windows
   chrome.exe --remote-debugging-port=9222
   ```
2. CDP mode enabled in settings
3. Port 9222 not blocked by firewall

See [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md) for more help.

---

## Related Packages

AI Eye is a monorepo with several packages:

- **@ai-eye/bridge** - Browser runtime for source mapping
- **@ai-eye/vite-plugin** - Vite plugin for source injection
- **@ai-eye/babel-plugin** - Babel plugin for non-Vite builds
- **aieye** - MCP server for AI agents
- **@ai-eye/extension** - ← You are here

---

## Requirements

- **VS Code:** 1.96.0 or higher
- **Node.js:** 18.0.0 or higher
- **Dev Server:** Vite, Webpack, or any dev server
- **Framework:** React, Vue, Svelte, or plain HTML

---

## License

MIT - See [LICENSE](../../LICENSE)

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

---

## Support

- **Documentation:** [docs/](../../docs/)
- **Issues:** [GitHub Issues](https://github.com/SPra03/ai-eye/issues)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md)
- **AI Usage Guide:** [docs/AI-USAGE.md](../../docs/AI-USAGE.md)

---

**Built with ❤️ for visual developers and AI agents**
