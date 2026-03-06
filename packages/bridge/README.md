# @ai-eye/bridge

Browser bridge script for AI Eye. Provides inspection, interaction, and debugging APIs that run inside the user's application.

## What It Does

The bridge script runs in your application's browser context and provides:
- 🔍 **Element inspection** with source location
- 🎯 **Element interaction** (click, type, scroll)
- 📊 **Console log capture**
- 📸 **Screenshot capability**
- 🔥 **HMR status tracking**

## How It Works

The bridge is automatically injected by the Vite plugin and exposes `window.__AIEYE__` API.

## API Reference

### Element Inspection

#### `inspectElement(selector: string)`

Get detailed information about an element:

```javascript
window.__AIEYE__.inspectElement('button.primary');
// Returns:
{
  tagName: "BUTTON",
  sourceFile: "src/App.tsx",
  sourceLine: "42",
  sourceCol: "8",
  boundingBox: { x: 100, y: 200, width: 80, height: 32 },
  computedStyles: { color: "rgb(255, 255, 255)", ... },
  innerText: "Click Me",
  attributes: { class: "primary", type: "button" }
}
```

#### `getElementSource(selector: string)`

Get just the source location:

```javascript
window.__AIEYE__.getElementSource('button.primary');
// Returns:
{
  file: "src/App.tsx",
  line: "42",
  col: "8"
}
```

#### `getPageStructure(maxDepth?: number)`

Get DOM tree with source locations:

```javascript
window.__AIEYE__.getPageStructure(3);
// Returns:
{
  tag: "body",
  children: [
    { tag: "div", source: "src/App.tsx", children: [...] }
  ]
}
```

#### `findElements(query: string, mode?: 'text' | 'role' | 'css')`

Find elements by text, role, or selector:

```javascript
// Find by text content
window.__AIEYE__.findElements('Submit', 'text');

// Find by ARIA role
window.__AIEYE__.findElements('button', 'role');

// Find by CSS selector
window.__AIEYE__.findElements('.btn-primary', 'css');

// Returns array of:
[
  { selector: "button.btn-primary", source: "src/App.tsx", text: "Submit" }
]
```

### Element Interaction

#### `clickElement(selector: string)`

Click an element:

```javascript
window.__AIEYE__.clickElement('button.submit');
// Returns: { success: true }
```

#### `typeText(selector: string, text: string)`

Type text into an input:

```javascript
window.__AIEYE__.typeText('input[name="email"]', 'test@example.com');
// Returns: { success: true }
```

#### `scrollTo(x: number, y: number)`

Scroll to position:

```javascript
window.__AIEYE__.scrollTo(0, 500);
// Returns: { success: true }
```

### Debugging

#### `consoleLogs`

Array of captured console logs (last 200):

```javascript
window.__AIEYE__.consoleLogs;
// Returns array of:
[
  { level: "log", message: "Hello", timestamp: 1234567890 }
]
```

#### `getConsoleLogs(level?: string, limit?: number)`

Get filtered console logs:

```javascript
// Get last 10 errors
window.__AIEYE__.getConsoleLogs('error', 10);

// Get all warnings
window.__AIEYE__.getConsoleLogs('warn');
```

#### `clearConsoleLogs()`

Clear captured logs:

```javascript
window.__AIEYE__.clearConsoleLogs();
```

### Screenshots

#### `captureScreenshot(format?: 'jpeg' | 'png', quality?: number)`

Capture page screenshot (requires html2canvas):

```javascript
const dataUrl = await window.__AIEYE__.captureScreenshot('jpeg', 80);
// Returns: "data:image/jpeg;base64,..."
```

### HMR Status

#### `getHMRStatus()`

Get Hot Module Replacement status:

```javascript
window.__AIEYE__.getHMRStatus();
// Returns:
{
  connected: true,
  lastUpdate: 1234567890,
  errors: []
}
```

## Integration

### Automatic (via Vite Plugin)

The bridge is automatically injected when using `@ai-eye/vite-plugin`:

```ts
// vite.config.ts
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [aiEye()],
});
```

### Manual (for other setups)

```html
<script src="./node_modules/@ai-eye/bridge/dist/aieye-bridge.js"></script>
```

## Testing the Bridge

### Check if Loaded

```javascript
console.log(window.__AIEYE__);
// Should show the API object

console.log(window.__AIEYE__.ready);
// Should return: true
```

### Test Element Inspection

```javascript
// Inspect any element on the page
const result = window.__AIEYE__.inspectElement('button');
console.log(result.sourceFile); // Should show source file path
```

### Test Console Capture

```javascript
console.log('Test message');
const logs = window.__AIEYE__.getConsoleLogs();
console.log(logs[logs.length - 1]); // Should show the test message
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires ES2020)

## Bundle Size

- Minified: ~5KB
- Gzipped: ~2KB

## Security

The bridge script runs in your application's context and has full access to the DOM and console. It should only be used in development environments.

**Recommendation:** Only enable in development:

```ts
aiEye({
  enabled: process.env.NODE_ENV === 'development'
})
```

## For AI Agents

### What You Need to Know

As an AI agent, **you don't directly call the bridge API**. Instead, you call MCP tools (like `aieye_inspect_element`), and the MCP server calls the bridge API for you.

However, understanding the bridge helps you:
1. Know what's happening under the hood
2. Diagnose "bridge not available" errors
3. Understand source mapping limitations

### The Bridge's Role

```
You (AI Agent)
  ↓ Call MCP tool: aieye_inspect_element
MCP Server
  ↓ Calls: window.__AIEYE__.inspectElement()
Browser Bridge (this package)
  ↓ Reads: data-ae-source attributes
User's DOM
```

**Key points:**
- The bridge runs **inside the user's browser**
- It's injected by the Vite/Babel plugin
- It provides the `window.__AIEYE__` API
- The MCP server uses this API to inspect elements

### Why "Bridge Not Available" Happens

When you see: `"Bridge not available in CDP-only mode"`

**What it means:**
- AI Eye Vite/Babel plugin is **not configured**
- The bridge script wasn't injected into the page
- No `window.__AIEYE__` object exists

**What you can still do:**
- ✅ Take screenshots (uses CDP)
- ✅ Click elements (uses CDP)
- ✅ Navigate pages (uses CDP)

**What you CAN'T do:**
- ❌ Get source locations (`aieye_get_source`)
- ❌ Inspect with source mapping (`aieye_inspect_element`)
- ❌ Get page structure (`aieye_get_structure`)

### Verifying Bridge is Available

When helping users set up AI Eye, check if bridge is working:

**Method 1: Through MCP tools**
```
aieye_inspect_element: "body"

// Check response:
{
  "sourceFile": "src/App.tsx",  // ← If present, bridge is working ✅
  ...
}

// Or:
{
  "error": "Bridge not available"  // ← Bridge not working ❌
}
```

**Method 2: Direct check (if you can access browser console)**
```javascript
console.log(window.__AIEYE__);
// Should show object with methods ✅
// If undefined, bridge not loaded ❌

console.log(window.__AIEYE__.ready);
// Should return true ✅
```

### Source Mapping Requirements

For the bridge to provide source locations, **all three parts must be in place:**

1. **Plugin configured** (Vite or Babel)
   - Injects `data-ae-source`, `data-ae-line`, `data-ae-col` attributes

2. **Bridge loaded** (this package)
   - Reads those attributes from DOM elements

3. **Dev server running**
   - Serves the app with injected attributes

If any part is missing → No source mapping.

### What the Bridge Actually Does

**When you call `aieye_inspect_element("button")`:**

1. MCP server calls `window.__AIEYE__.inspectElement("button")`
2. Bridge finds the button element in DOM
3. Bridge reads `data-ae-source="src/App.tsx"` attribute
4. Bridge gets computed styles, bounding box, etc.
5. Bridge returns all data to MCP server
6. MCP server returns to you (AI agent)

**Without bridge:**
- Steps 3-5 don't happen
- No source location available
- You can still see the element exists, but not where it's defined

### Common Bridge Issues

**Issue:** "Bridge loaded but no source mapping"

**Diagnosis:**
- Bridge is present ✅
- But elements don't have `data-ae-*` attributes ❌
- Plugin not configured or dev server not restarted

**Tell user:**
1. Check vite.config.ts has AI Eye plugin
2. Restart dev server
3. Verify attributes in browser inspector

**Issue:** "Bridge loaded on some pages but not others"

**Diagnosis:**
- SPA routing might clear the bridge
- Or different pages built differently

**Tell user:**
- Make sure plugin is configured for all routes
- Check if using SSR/SSG (may need special config)

**Issue:** "Console logs not captured"

**Explanation:**
- Bridge captures logs but has 200-log limit
- Old logs are automatically removed
- Console logs captured **after** bridge loads

**Tell user:**
- Use `aieye_clear_console_logs` before testing
- Only recent logs (last 200) are available
- Logs from before bridge loaded won't be captured

### Bridge vs CDP

**Two ways MCP server can interact with browser:**

1. **Via Bridge (preferred):**
   - Full AI Eye features
   - Source mapping available
   - Console log capture
   - HMR status tracking

2. **Via CDP (fallback):**
   - Basic functionality only
   - No source mapping
   - Limited to CDP capabilities

**AI agent guidance:**
- If bridge available → Use all AI Eye tools freely
- If CDP-only → Explain limitations to user

### Performance Notes

**Bridge impact:**
- Bundle size: ~5KB minified, ~2KB gzipped
- Runtime overhead: Negligible
- Memory: ~200 console logs cached

**For users worried about performance:**
- "The bridge is tiny (2KB) and has minimal overhead"
- "It only runs in development, not production"
- "You can disable with `enabled: false` in plugin config"

### Security Considerations

**For users concerned about security:**

The bridge runs in the browser and has access to:
- Full DOM
- Console
- User interactions

**Reassure them:**
1. Bridge only runs in development (not production)
2. No data is sent to external servers
3. All communication is local (MCP server on same machine)
4. Can be disabled: `enabled: process.env.NODE_ENV === 'development'`

### Bridge API - Quick Reference

| Method | What It Does | MCP Tool Equivalent |
|--------|--------------|---------------------|
| `inspectElement()` | Get element details | `aieye_inspect_element` |
| `getElementSource()` | Get source location | `aieye_get_source` |
| `getPageStructure()` | Get DOM tree | `aieye_get_structure` |
| `findElements()` | Search elements | `aieye_find_elements` |
| `clickElement()` | Click element | `aieye_click` |
| `typeText()` | Type in input | `aieye_type` |
| `scrollTo()` | Scroll page | `aieye_scroll` |
| `getConsoleLogs()` | Get console logs | `aieye_get_console_logs` |
| `clearConsoleLogs()` | Clear logs | `aieye_clear_console_logs` |
| `getHMRStatus()` | HMR status | `aieye_get_hmr_status` |

**You never call these directly** - the MCP server calls them for you.

### Debugging Bridge Issues

**Problem:** User says "source mapping isn't working"

**Your checklist:**
```
□ 1. Is dev server running?
     Ask user or check with them

□ 2. Is plugin configured?
     Check vite.config.ts for aiEye plugin

□ 3. Did user restart server after adding plugin?
     Tell them to restart

□ 4. Is bridge loaded?
     aieye_inspect_element: "body"
     Check if sourceFile is present

□ 5. Are elements from user's code?
     Third-party libraries won't have source mapping
```

**Problem:** Bridge exists but methods fail

**Check browser console:**
- Ask user to open browser DevTools
- Look for errors in console
- Bridge might have loaded with errors

**Problem:** Intermittent failures

**Possible causes:**
- SPA routing reloading page
- HMR update cleared bridge
- Browser extension interfering

**Tell user:**
- Refresh page to reload bridge
- Try disabling browser extensions
- Check if specific routes have issues

### When to Mention the Bridge

**DO mention the bridge when:**
- User asks "how does source mapping work?"
- Diagnosing "bridge not available" errors
- Explaining why source mapping requires plugin

**DON'T mention the bridge when:**
- Everything is working normally
- User just wants to use AI Eye
- It's an implementation detail they don't need to know

**Keep it simple:**
- Most users don't need to know about the bridge
- Just tell them to install the plugin
- Only explain bridge internals when debugging

## License

MIT
