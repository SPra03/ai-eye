# @visioncraft/mcp-server

MCP (Model Context Protocol) server for VisionCraft. Exposes browser automation and inspection tools to AI agents like Claude.

## Features

The MCP server provides 13 tools for AI-driven visual development:

### 🔍 Inspection Tools
- **visioncraft_inspect_element** - Get detailed element information with source mapping
- **visioncraft_get_source** - Get source file location for any element
- **visioncraft_get_structure** - Get page DOM structure with source mapping
- **visioncraft_find_elements** - Find elements by text, role, or CSS selector

### 🎯 Interaction Tools
- **visioncraft_click** - Click elements
- **visioncraft_type** - Type text into inputs
- **visioncraft_scroll** - Scroll the page

### 📸 Debugging Tools
- **visioncraft_screenshot** - Capture page screenshots
- **visioncraft_get_console_logs** - Retrieve console logs
- **visioncraft_clear_console_logs** - Clear captured logs
- **visioncraft_get_hmr_status** - Check HMR status

### 🌐 Navigation Tools
- **visioncraft_navigate** - Navigate to URLs
- **visioncraft_get_current_url** - Get current page URL

## Installation

The MCP server is automatically built as part of the VisionCraft workspace:

```bash
# Build all packages
npx pnpm build

# Or build just the MCP server
cd packages/mcp-server
npx pnpm build
```

## Usage with Claude Desktop

### Configuration

Add to your Claude Desktop config at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "node",
      "args": ["/Users/yourname/path/to/vscode-eye/packages/mcp-server/dist/index.js"]
    }
  }
}
```

**Important**: Replace `/Users/yourname/path/to/vscode-eye` with the actual path to your VisionCraft project.

### Starting the Preview

Before using the MCP tools, make sure your dev server is running:

```bash
cd examples/react-vite-app
npx pnpm dev
```

Note the port number (e.g., `http://localhost:5176`).

### Using with Claude

Once configured, you can ask Claude to interact with your UI:

**Example prompts:**

1. **"Take a screenshot of the current page"**
   - Claude will call `visioncraft_screenshot`
   - Returns base64-encoded image

2. **"What button elements are on the page?"**
   - Claude will call `visioncraft_find_elements` with query "button"
   - Returns array of buttons with selectors and source locations

3. **"Click the increment button"**
   - Claude will call `visioncraft_find_elements` to find button
   - Then `visioncraft_click` to click it

4. **"Where is the h1 element defined in the source code?"**
   - Claude will call `visioncraft_get_source` with selector "h1"
   - Returns file path, line, and column

5. **"Show me the page structure"**
   - Claude will call `visioncraft_get_structure`
   - Returns DOM tree with source mapping

## How It Works

1. **STDIO Transport**: MCP server communicates with Claude via standard input/output
2. **Playwright Connection**: Connects to browser using Playwright
3. **Bridge API**: Calls `window.__VISIONCRAFT__` APIs injected by Vite plugin
4. **Source Mapping**: All elements include source file locations

## Architecture

```
Claude Desktop
    ↕ (STDIO)
MCP Server
    ↕ (Playwright/CDP)
Browser (Chromium)
    ↕ (window.__VISIONCRAFT__)
Your React App
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Test Locally

```bash
# Start dev server in one terminal
cd examples/react-vite-app && npx pnpm dev

# Test MCP server (requires browser to be running)
cd packages/mcp-server
node dist/index.js
```

The server will wait for STDIO input in MCP format.

## Tool Reference

### visioncraft_screenshot

Capture a screenshot of the current page.

**Parameters:**
- `format` (optional): "jpeg" or "png" (default: "jpeg")
- `quality` (optional): 0-100 (default: 80, only for JPEG)

**Returns:** Base64-encoded image data

### visioncraft_inspect_element

Inspect an element and get detailed information.

**Parameters:**
- `selector` (required): CSS selector (e.g., "button.primary")

**Returns:**
```json
{
  "tagName": "BUTTON",
  "sourceFile": "src/App.tsx",
  "sourceLine": "41",
  "sourceCol": "12",
  "boundingBox": { "x": 100, "y": 200, "width": 80, "height": 32 },
  "computedStyles": { "color": "rgb(255, 255, 255)", ... },
  "attributes": { "class": "primary" }
}
```

### visioncraft_get_source

Get source location for an element.

**Parameters:**
- `selector` (required): CSS selector

**Returns:**
```json
{
  "file": "src/App.tsx",
  "line": "41",
  "col": "12"
}
```

### visioncraft_click

Click an element.

**Parameters:**
- `selector` (required): CSS selector

**Returns:**
```json
{
  "success": true
}
```

### visioncraft_type

Type text into an input element.

**Parameters:**
- `selector` (required): CSS selector
- `text` (required): Text to type

**Returns:**
```json
{
  "success": true
}
```

### visioncraft_find_elements

Find elements by text, role, or CSS selector.

**Parameters:**
- `query` (required): Search query
- `mode` (optional): "text", "role", or "css" (default: "css")

**Returns:** Array of matching elements with selectors and source locations

### visioncraft_get_structure

Get page DOM structure.

**Parameters:**
- `maxDepth` (optional): Maximum traversal depth (default: 5)

**Returns:** Tree structure with source mapping

### visioncraft_get_console_logs

Retrieve captured console logs.

**Parameters:**
- `level` (optional): Filter by "log", "warn", "error", or "info"
- `limit` (optional): Maximum number of logs to return

**Returns:** Array of console logs with timestamps

## Troubleshooting

### "Failed to connect to browser"

- Ensure your dev server is running (`npx pnpm dev`)
- Check the port number matches (default: 5176)
- Try closing other Chrome/Chromium instances

### "Bridge not available"

- Verify the Vite plugin is enabled in `vite.config.ts`
- Restart the dev server to pick up plugin changes
- Check browser console for bridge initialization messages

### "Command not found: node"

- Ensure Node.js is installed and in PATH
- Use absolute path to node in Claude Desktop config

## For AI Agents

### Overview

This MCP server is **your primary interface** to VisionCraft. As an AI agent, you communicate with this server through the Model Context Protocol (MCP) to interact with the user's browser and application.

**You have access to 14 tools** (see list at top of this README) that allow you to:
- See the UI (screenshots)
- Inspect elements (get source locations)
- Interact with UI (click, type, scroll)
- Debug issues (console logs, HMR status)

### How Communication Works

```
You (AI Agent)
  ↕ MCP Protocol (JSON-RPC over STDIO)
This MCP Server
  ↕ Playwright/CDP
Browser (Running user's app)
  ↕ window.__VISIONCRAFT__
User's Application (with VisionCraft plugin)
```

**Key points:**
1. You don't talk to the browser directly - you talk to this MCP server
2. This server handles browser automation using Playwright
3. The browser has VisionCraft bridge injected for source mapping
4. All responses are JSON (tool results)

### Connection Modes

The MCP server supports three connection modes:

1. **Playwright Launch (default)**
   - MCP server launches its own browser
   - Most reliable and feature-complete
   - Higher memory usage (~200MB)

2. **CDP Connect**
   - Connects to existing Chrome with remote debugging
   - Lower memory usage
   - Requires user to start Chrome with `--remote-debugging-port=9222`

3. **CDP-Only (fallback)**
   - No bridge available
   - Limited functionality (screenshots, clicking)
   - Falls back when VisionCraft plugin not configured

### Tool Usage Patterns

**Pattern 1: Visual Debugging**
```
User: "The button looks weird"

You:
1. visioncraft_screenshot           → See the button
2. visioncraft_find_elements        → Find button selector
3. visioncraft_inspect_element      → Get styles & source location
4. [Read source file at src/Button.tsx:45]
5. [Identify CSS issue]
6. [Fix code]
7. visioncraft_screenshot           → Verify fix
```

**Pattern 2: Feature Request**
```
User: "Add a dark mode toggle"

You:
1. visioncraft_screenshot           → See current UI
2. visioncraft_get_structure        → Understand layout
3. [Create new component]
4. visioncraft_get_console_logs     → Check for errors
5. visioncraft_screenshot           → Show new feature
```

**Pattern 3: Bug Investigation**
```
User: "Something's broken but I don't know what"

You:
1. visioncraft_get_console_logs     → Check for errors
2. visioncraft_screenshot           → See error state
3. visioncraft_inspect_element      → Find problematic element
4. visioncraft_get_source           → Get code location
5. [Analyze & fix]
6. visioncraft_get_console_logs     → Verify no errors
```

### Tool Selection Guide

**For seeing UI:**
- `visioncraft_screenshot` - Takes ~1-2 seconds, use sparingly

**For finding elements:**
- `visioncraft_find_elements` - Search by text, role, or CSS
- Use this when you don't know the exact selector

**For inspecting:**
- `visioncraft_get_source` - Fast, just returns file location
- `visioncraft_inspect_element` - Slower, returns everything (styles, attributes, location)
- **Tip:** Use `get_source` if you only need the file location

**For interacting:**
- `visioncraft_click` - Click buttons, links, etc.
- `visioncraft_type` - Fill forms
- `visioncraft_scroll` - Access elements below fold

**For debugging:**
- `visioncraft_get_console_logs` - Check for errors (use filter: "error")
- `visioncraft_get_hmr_status` - Check if HMR is working
- `visioncraft_clear_console_logs` - Clear logs before testing

### Common Errors and Solutions

**Error:** "Not connected to browser"

**What it means:** No browser session active

**AI should:**
1. Check if user's dev server is running
2. Tell user to start dev server: `npm run dev`
3. Verify URL with user
4. Try again after confirmation

**Error:** "Element not found: button.primary"

**What it means:** CSS selector didn't match anything

**AI should:**
1. Take screenshot to see what's actually there
2. Use `visioncraft_find_elements` with text search:
   ```json
   {"query": "Submit", "mode": "text"}
   ```
3. Get list of possible matches
4. Choose correct selector from results

**Error:** "Bridge not available"

**What it means:** VisionCraft Vite/Babel plugin not configured

**AI should:**
1. Explain plugin is required for source mapping
2. Guide user to install: `npm install @visioncraft/vite-plugin --save-dev`
3. Guide user to configure vite.config.ts
4. Tell user to restart dev server

**Error:** "Source mapping not available for this element"

**What it means:** Element is from third-party library (in node_modules)

**AI should:**
1. Explain this is expected for library components
2. Say you can still inspect styles/attributes
3. But can't navigate to source (it's not user's code)

### Configuration for Users

When setting up VisionCraft with users, guide them to add this to their Claude Desktop config:

**macOS:**
```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "node",
      "args": ["/absolute/path/to/visioncraft/packages/mcp-server/dist/index.js"],
      "env": {
        "VISIONCRAFT_URL": "http://localhost:5173",
        "VISIONCRAFT_MODE": "playwright-launch"
      }
    }
  }
}
```

**Environment variables:**
- `VISIONCRAFT_URL` - Dev server URL (default: http://localhost:5173)
- `VISIONCRAFT_MODE` - Connection mode:
  - `playwright-launch` (default) - Launch own browser
  - `cdp-connect` - Connect to existing Chrome
  - `cdp-only` - CDP without bridge (fallback)

### Best Practices for AI Agents

**DO:**
- ✅ Always start with `visioncraft_screenshot` to see current state
- ✅ Use `visioncraft_get_source` for quick source lookups
- ✅ Check `visioncraft_get_console_logs` after interactions
- ✅ Clear console logs before testing: `visioncraft_clear_console_logs`
- ✅ Use `visioncraft_find_elements` to search by description
- ✅ Take before/after screenshots to verify changes

**DON'T:**
- ❌ Don't take screenshots repeatedly without changes (slow)
- ❌ Don't guess CSS selectors - use `find_elements` instead
- ❌ Don't use `inspect_element` if you only need file location
- ❌ Don't forget to check console for errors after clicking/typing

### Performance Tips

- **Screenshots are slow** (~1-2s) - use sparingly
- **get_source is fast** (~50ms) - prefer over inspect_element when possible
- **find_elements is efficient** - better than guessing selectors
- **get_structure** gets multiple elements at once (efficient)

### Verification Checklist

Before telling user "VisionCraft is set up correctly", verify:

```
□ 1. Dev server is running
     [User confirms or you check with them]

□ 2. Navigate to dev server
     visioncraft_navigate: "http://localhost:5173"

□ 3. Page loads successfully
     visioncraft_get_current_url
     Should match the navigate URL

□ 4. Can take screenshot
     visioncraft_screenshot
     Should return image data

□ 5. Bridge is available (source mapping works)
     visioncraft_inspect_element: "body"
     Check if sourceFile/sourceLine exist

□ 6. Console logs work
     visioncraft_get_console_logs
     Should return array (may be empty)

□ 7. HMR tracking works
     visioncraft_get_hmr_status
     Should show connected: true
```

If all checks pass → VisionCraft is fully operational ✅

### Debugging MCP Server Issues

When things aren't working:

**Check 1: Is MCP server running?**
- Should see it in Claude Desktop's server list
- Check Claude Desktop logs for startup errors

**Check 2: Can it connect to browser?**
```
visioncraft_get_current_url
```
- Success → Connected ✅
- Error → Not connected ❌

**Check 3: Is Playwright installed?**
- MCP server uses Playwright
- User may need to: `npx playwright install chromium`

**Check 4: Is bridge available?**
```
visioncraft_inspect_element: "body"
```
- Has sourceFile → Bridge working ✅
- No sourceFile → Bridge not available ❌

### Example AI Workflow

**User:** "Help me debug why my app won't load"

**AI Response:**
```
Let me investigate using VisionCraft:

1. Taking screenshot of current state...
   [calls visioncraft_screenshot]

   I can see a blank page with an error overlay.

2. Checking console for errors...
   [calls visioncraft_get_console_logs with level: "error"]

   Found error: "Uncaught TypeError: Cannot read property 'map' of undefined"
   at App.tsx:45

3. Let me inspect the problematic component...
   [reads src/App.tsx:45]

   Issue: You're calling .map() on 'items' but it's undefined.
   This happens when data hasn't loaded yet.

4. Fix: Add a check before mapping:
   {items?.map(...)} or {items && items.map(...)}

5. Verifying fix...
   [calls visioncraft_get_console_logs again]

   No errors! ✅

6. Taking screenshot to confirm...
   [calls visioncraft_screenshot]

   App is now loading correctly!
```

### Tool Capabilities Summary

| Tool | Speed | Use When |
|------|-------|----------|
| `screenshot` | Slow (1-2s) | Need to see UI |
| `navigate` | Medium (500ms) | Changing pages |
| `inspect_element` | Medium (200ms) | Need full element details |
| `get_source` | Fast (50ms) | Only need file location |
| `get_structure` | Medium (300ms) | Need component tree |
| `find_elements` | Fast (100ms) | Searching for elements |
| `click` | Fast (100ms) | Testing interactions |
| `type` | Fast (150ms) | Filling forms |
| `scroll` | Fast (50ms) | Accessing below fold |
| `get_console_logs` | Fast (10ms) | Checking for errors |
| `clear_console_logs` | Fast (5ms) | Resetting before test |
| `get_hmr_status` | Fast (10ms) | Checking HMR |
| `clear_hmr_errors` | Fast (5ms) | Resetting HMR logs |
| `get_current_url` | Fast (10ms) | Verifying navigation |

## License

MIT
