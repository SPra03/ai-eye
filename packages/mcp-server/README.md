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

## License

MIT
