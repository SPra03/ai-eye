# Testing the VisionCraft MCP Server

This guide shows you how to test Phase 5: MCP Server Implementation with Claude Desktop.

## Prerequisites

1. **Phase 4 complete**: Bridge script is working (verify with QUICK-TEST.md)
2. **Dev server running**:
   ```bash
   cd examples/react-vite-app
   npx pnpm dev
   ```
3. **Claude Desktop installed**: Download from https://claude.ai/download

## Step 1: Build the MCP Server

```bash
cd /Users/sourabhprakash/Desktop/git/vscode-eye
npx pnpm build
```

Verify the build:
```bash
ls -lh packages/mcp-server/dist/index.js
# Should show ~499KB file
```

## Step 2: Configure Claude Desktop

### Find Your Project Path

```bash
pwd
# Example output: /Users/sourabhprakash/Desktop/git/vscode-eye
```

### Edit Claude Desktop Config

Open the configuration file:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add the VisionCraft MCP server:

```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "node",
      "args": [
        "/Users/sourabhprakash/Desktop/git/vscode-eye/packages/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**⚠️ Important**: Replace the path with your actual project path from the `pwd` command above!

### Alternative: Use Absolute Node Path

If you get "command not found" errors, use absolute path to node:

```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "/usr/local/bin/node",
      "args": [
        "/Users/sourabhprakash/Desktop/git/vscode-eye/packages/mcp-server/dist/index.js"
      ]
    }
  }
}
```

Find your node path:
```bash
which node
```

## Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely (⌘+Q)
2. Relaunch Claude Desktop
3. Start a new conversation

## Step 4: Verify MCP Server Connection

In Claude Desktop, you should see a small 🔌 icon or indicator showing MCP tools are available.

Ask Claude:
```
What MCP tools do you have available?
```

Expected response: Claude should list 13 VisionCraft tools starting with `visioncraft_`

## Step 5: Test Basic Tools

### Test 1: Screenshot

**Prompt:**
```
Take a screenshot of the page at http://localhost:5176
```

**Expected:**
- Browser window opens (Playwright)
- Navigates to the React app
- Screenshot appears in Claude's response
- You see the React counter app

### Test 2: Find Elements

**Prompt:**
```
What button elements are on the page?
```

**Expected response:**
```json
[
  {
    "selector": "button",
    "source": "src/App.tsx",
    "text": "Decrement",
    "role": null
  },
  {
    "selector": "button:nth-child(2)",
    "source": "src/App.tsx",
    "text": "Reset",
    "role": null
  },
  {
    "selector": "button:nth-child(3)",
    "source": "src/App.tsx",
    "text": "Increment",
    "role": null
  }
]
```

### Test 3: Get Source Location

**Prompt:**
```
Where is the h1 element defined in the source code?
```

**Expected response:**
```json
{
  "file": "src/App.tsx",
  "line": "30",
  "col": "8"
}
```

### Test 4: Inspect Element

**Prompt:**
```
Inspect the first button element on the page
```

**Expected:** Detailed information including:
- Tag name: BUTTON
- Source file: src/App.tsx
- Bounding box coordinates
- Computed styles
- All attributes

### Test 5: Click Interaction

**Prompt:**
```
Click the increment button
```

**Expected:**
- Claude finds the increment button
- Clicks it
- Counter increments (you can verify in the browser window)

### Test 6: Type Interaction

**Prompt:**
```
Type "Hello from Claude!" into the input field
```

**Expected:**
- Text appears in the input
- Message displays below the input

### Test 7: Page Structure

**Prompt:**
```
Show me the structure of the page (depth 2)
```

**Expected:** Tree structure showing:
- Body element
- Children (div, header, sections)
- Source mapping for each element

### Test 8: Console Logs

First, generate some logs in the browser console:
```javascript
console.log('Test message 1');
console.warn('Warning message');
console.error('Error message');
```

Then ask Claude:
```
Get the last 5 console logs
```

**Expected:** Array of logs with levels, messages, and timestamps

## Step 6: Advanced Testing

### Multi-Step Workflow

**Prompt:**
```
1. Find all button elements
2. Identify which button has "Increment" text
3. Click it 3 times
4. Get the console logs to verify
```

Claude should:
- Find 3 buttons
- Identify button:nth-child(3) as "Increment"
- Click it 3 times
- Show console logs confirming the clicks

### Source Code Navigation

**Prompt:**
```
For each button on the page, tell me:
1. The button text
2. The exact source file location (file:line:col)
3. The click handler (if visible in attributes)
```

Claude should provide a detailed report mapping UI elements to source code.

## Troubleshooting

### MCP Server Not Appearing

**Check 1**: Verify config file syntax
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
```

If this errors, your JSON is malformed.

**Check 2**: Verify path to index.js
```bash
ls /Users/sourabhprakash/Desktop/git/vscode-eye/packages/mcp-server/dist/index.js
```

### "Failed to connect to browser"

**Issue**: Dev server not running or wrong port

**Fix**:
1. Ensure `npx pnpm dev` is running in `examples/react-vite-app`
2. Note the port (e.g., 5176)
3. If port changed, update your prompts to Claude

### Browser Opens But Nothing Happens

**Issue**: Bridge script not injected

**Fix**:
1. Stop dev server
2. Rebuild: `npx pnpm build`
3. Restart dev server
4. Verify bridge in browser console: `window.__VISIONCRAFT__`

### "Bridge not available"

**Issue**: Bridge script failed to initialize

**Check**: Browser console for errors
```javascript
window.__VISIONCRAFT__
// Should show the API object
```

**Fix**:
1. Clear Vite cache: `rm -rf examples/react-vite-app/node_modules/.vite`
2. Restart dev server

### Claude Doesn't Use Tools

**Issue**: Claude may not recognize when to use tools

**Fix**: Be explicit in your prompts:
- ❌ "What's on the page?" (too vague)
- ✅ "Use visioncraft_find_elements to find all buttons on http://localhost:5176"

## Success Criteria

✅ All 13 tools are available in Claude Desktop
✅ Screenshot tool returns images
✅ Inspection tools return source-mapped data
✅ Interaction tools successfully modify the page
✅ Claude can perform multi-step workflows
✅ Source locations accurately point to code

## Next Steps

Once MCP server testing is complete:
- **Phase 6**: HMR Integration (real-time update tracking)
- **Phase 7**: CDP Fallback (headless mode support)
- **Phase 8-10**: Testing, documentation, polish

Great work! The MCP server brings AI-driven visual development to life! 🎉
