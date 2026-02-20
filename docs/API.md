# VisionCraft API Reference

Complete API documentation for all VisionCraft packages.

## Table of Contents

- [Babel Plugin API](#babel-plugin-api)
- [Vite Plugin API](#vite-plugin-api)
- [Bridge Script API](#bridge-script-api)
- [MCP Server Tools API](#mcp-server-tools-api)

---

## Babel Plugin API

### Installation

```bash
npm install @visioncraft/babel-plugin --save-dev
```

### Usage

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@visioncraft/babel-plugin', {
      enabled: true,
      root: process.cwd(),
      attributePrefix: 'data-vc'
    }]
  ]
};
```

### Options

#### `enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable/disable the plugin

```javascript
['@visioncraft/babel-plugin', { enabled: process.env.NODE_ENV === 'development' }]
```

#### `root`
- **Type**: `string`
- **Default**: `process.cwd()`
- **Description**: Project root directory for computing relative paths

```javascript
['@visioncraft/babel-plugin', { root: '/path/to/project' }]
```

#### `attributePrefix`
- **Type**: `string`
- **Default**: `'data-vc'`
- **Description**: Prefix for injected attributes

```javascript
['@visioncraft/babel-plugin', { attributePrefix: 'data-custom' }]
// Generates: data-custom-source, data-custom-line, data-custom-col
```

### What It Does

The Babel plugin transforms JSX elements by injecting source mapping attributes:

**Input**:
```jsx
function Button() {
  return <button>Click me</button>;
}
```

**Output**:
```jsx
function Button() {
  return <button data-vc-source="Button.tsx" data-vc-line="2" data-vc-col="9">Click me</button>;
}
```

### Behavior

- ✅ Processes all JSX elements (intrinsic and components)
- ✅ Skips `Fragment` and shorthand `<>` elements
- ✅ Skips already-tagged elements
- ✅ Skips `node_modules` files
- ✅ Computes relative paths from `root` option
- ✅ Preserves existing attributes
- ✅ Inserts attributes before spread props

---

## Vite Plugin API

### Installation

```bash
npm install @visioncraft/vite-plugin --save-dev
```

### Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import visionCraftVitePlugin from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    visionCraftVitePlugin({
      enabled: true,
      enableHMR: true,
      attributePrefix: 'data-vc',
      root: process.cwd()
    })
  ]
});
```

### Options

#### `enabled`
- **Type**: `boolean`
- **Default**: `true` in development, `false` in production
- **Description**: Enable/disable the plugin

```javascript
visionCraftVitePlugin({ enabled: process.env.NODE_ENV === 'development' })
```

#### `enableHMR`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable HMR status tracking and bridge injection

#### `attributePrefix`
- **Type**: `string`
- **Default**: `'data-vc'`
- **Description**: Prefix for source mapping attributes

#### `root`
- **Type**: `string`
- **Default**: Vite's `config.root`
- **Description**: Project root for relative path computation

#### `include`
- **Type**: `RegExp | RegExp[]`
- **Default**: `/\.(jsx|tsx|vue|svelte)$/`
- **Description**: Files to process for source mapping

#### `exclude`
- **Type**: `RegExp | RegExp[]`
- **Default**: `/node_modules/`
- **Description**: Files to skip

### Features

#### 1. Source Mapping Transformation

Delegates to Babel plugin for JSX transformation. Works with:
- React (.jsx, .tsx)
- Vue (.vue)
- Svelte (.svelte)

#### 2. Virtual Module: `@visioncraft/bridge`

The plugin provides a virtual module that injects the bridge script:

```javascript
import '@visioncraft/bridge';
// Bridge is now available at window.__VISIONCRAFT__
```

**How it works**:
1. Plugin intercepts `import '@visioncraft/bridge'`
2. Loads bridge TypeScript source
3. Transforms to JavaScript with esbuild
4. Injects with `import.meta.hot` access
5. Returns as ESM module

#### 3. HMR Integration

Automatically tracks HMR events when `enableHMR: true`:

```javascript
// In your app
const status = window.__VISIONCRAFT__.getHMRStatus();
console.log(status.connected); // true
console.log(status.updates);   // Array of recent updates
console.log(status.errors);    // Array of recent errors
```

#### 4. HTML Injection

In development mode, automatically injects the bridge script:

```html
<!-- Automatically injected -->
<script type="module">
  import '@visioncraft/bridge';
</script>
```

### Hooks Used

- **`configResolved`**: Auto-detect development mode
- **`resolveId`**: Intercept `@visioncraft/bridge` imports
- **`load`**: Provide bridge script source
- **`transform`**: Add source mapping attributes to JSX
- **`transformIndexHtml`**: Inject bridge script tag
- **`configureServer`**: Set up HMR event listeners

---

## Bridge Script API

The bridge script runs in the browser and provides the `window.__VISIONCRAFT__` API.

### Automatic Injection

```javascript
// vite.config.js
import visionCraftVitePlugin from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [visionCraftVitePlugin()]
});
```

```javascript
// main.tsx
import '@visioncraft/bridge';
```

### API Reference

#### Metadata

##### `version`
- **Type**: `string`
- **Value**: `'1.0.0'`
- **Description**: Bridge version

##### `ready`
- **Type**: `boolean`
- **Value**: `true`
- **Description**: Bridge initialization status

---

#### Element Inspection

##### `inspectElement(selector: string)`

Get detailed element information including source location.

**Parameters**:
- `selector`: CSS selector (e.g., `'#app'`, `'button.primary'`)

**Returns**: `ElementInspectionResult | ErrorResult`

```typescript
interface ElementInspectionResult {
  tagName: string;
  sourceFile: string | null;    // e.g., "src/Button.tsx"
  sourceLine: string | null;    // e.g., "42"
  sourceCol: string | null;     // e.g., "8"
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
  innerText?: string;           // Truncated to 200 chars
  innerHTML?: string;           // Truncated to 500 chars
  attributes: Record<string, string>;
}
```

**Example**:
```javascript
const result = window.__VISIONCRAFT__.inspectElement('#submit-button');
console.log(result.sourceFile); // "src/components/Button.tsx"
console.log(result.sourceLine); // "15"
```

##### `getElementSource(selector: string)`

Get only the source location for an element.

**Returns**: `SourceLocation | ErrorResult`

```typescript
interface SourceLocation {
  file: string | null;
  line: string | null;
  col: string | null;
}
```

**Example**:
```javascript
const source = window.__VISIONCRAFT__.getElementSource('.card');
console.log(`${source.file}:${source.line}:${source.col}`);
// "src/Card.tsx:42:8"
```

##### `getPageStructure(maxDepth?: number)`

Get DOM tree with source mapping.

**Parameters**:
- `maxDepth`: Maximum traversal depth (default: 5, max: 10)

**Returns**: `PageStructureNode`

```typescript
interface PageStructureNode {
  tag?: string;
  source?: string | null;
  text?: string | null;
  role?: string | null;
  children?: PageStructureNode[];
}
```

**Example**:
```javascript
const structure = window.__VISIONCRAFT__.getPageStructure(3);
console.log(JSON.stringify(structure, null, 2));
```

##### `findElements(query: string, mode?: 'text' | 'role' | 'css')`

Search for elements by various criteria.

**Parameters**:
- `query`: Search query
- `mode`: Search mode (default: `'css'`)
  - `'css'`: CSS selector
  - `'text'`: Text content
  - `'role'`: ARIA role

**Returns**: `ElementSearchResult[]` (max 20 results)

```typescript
interface ElementSearchResult {
  selector: string;
  source?: string | null;
  text?: string;
  role?: string | null;
}
```

**Examples**:
```javascript
// Find by CSS
const buttons = window.__VISIONCRAFT__.findElements('button', 'css');

// Find by text
const links = window.__VISIONCRAFT__.findElements('Learn more', 'text');

// Find by role
const navigation = window.__VISIONCRAFT__.findElements('navigation', 'role');
```

---

#### Element Interaction

##### `clickElement(selector: string)`

Click an element.

**Returns**: `ActionResult`

```typescript
interface ActionResult {
  success: boolean;
  error?: string;
}
```

**Example**:
```javascript
const result = window.__VISIONCRAFT__.clickElement('#submit-btn');
if (result.success) {
  console.log('Clicked!');
}
```

##### `typeText(selector: string, text: string)`

Type text into input/textarea element.

**Parameters**:
- `selector`: CSS selector for input/textarea
- `text`: Text to type

**Returns**: `ActionResult`

**Side Effects**:
- Sets element value
- Triggers `input` event
- Triggers `change` event

**Example**:
```javascript
window.__VISIONCRAFT__.typeText('#username', 'john.doe');
window.__VISIONCRAFT__.typeText('#password', 'secret123');
```

##### `scrollTo(x: number, y: number)`

Scroll the page.

**Parameters**:
- `x`: Horizontal position
- `y`: Vertical position

**Returns**: `ActionResult`

**Example**:
```javascript
// Scroll to top
window.__VISIONCRAFT__.scrollTo(0, 0);

// Scroll down 500px
window.__VISIONCRAFT__.scrollTo(0, 500);
```

---

#### Console Logging

##### `consoleLogs`
- **Type**: `ConsoleLog[]`
- **Description**: Ring buffer of captured logs (max 200)

```typescript
interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}
```

##### `getConsoleLogs(level?: string, limit?: number)`

Get captured console logs.

**Parameters**:
- `level`: Filter by level (optional)
- `limit`: Maximum number of logs (optional)

**Returns**: `ConsoleLog[]`

**Example**:
```javascript
// Get all logs
const allLogs = window.__VISIONCRAFT__.getConsoleLogs();

// Get only errors
const errors = window.__VISIONCRAFT__.getConsoleLogs('error');

// Get last 10 warnings
const warnings = window.__VISIONCRAFT__.getConsoleLogs('warn', 10);
```

##### `clearConsoleLogs()`

Clear all captured logs.

**Example**:
```javascript
window.__VISIONCRAFT__.clearConsoleLogs();
```

---

#### HMR Status

##### `getHMRStatus()`

Get HMR connection status and statistics.

**Returns**: `HMRStatus`

```typescript
interface HMRStatus {
  connected: boolean;
  lastUpdate: number | null;
  errors: Array<{
    message: string;
    stack?: string;
  }>;
  updates: Array<{
    timestamp: number;
    file: string;
    type: string;
    latency?: number;
  }>;
  totalUpdates: number;
  averageLatency: number;
  connectionId?: number;
}
```

**Example**:
```javascript
const status = window.__VISIONCRAFT__.getHMRStatus();
console.log(`Connected: ${status.connected}`);
console.log(`Total updates: ${status.totalUpdates}`);
console.log(`Average latency: ${status.averageLatency}ms`);
```

##### `clearHMRErrors()`

Clear HMR error history.

---

#### Screenshots

##### `captureScreenshot(format?: 'jpeg' | 'png', quality?: number)`

Capture page screenshot (requires html2canvas).

**Parameters**:
- `format`: Image format (default: `'jpeg'`)
- `quality`: JPEG quality 0-100 (default: 80)

**Returns**: `Promise<string>` - Data URL

**Example**:
```javascript
const dataUrl = await window.__VISIONCRAFT__.captureScreenshot('png');
const img = document.createElement('img');
img.src = dataUrl;
document.body.appendChild(img);
```

**Note**: Requires html2canvas to be loaded. The MCP server uses Playwright's native screenshot instead.

---

## MCP Server Tools API

The MCP server exposes 14 tools for AI agents to interact with the browser.

### Connection

The MCP server connects to the browser using one of three modes:
1. **CDP Connect** (optimal): Connects to existing Chrome with `--remote-debugging-port=9222`
2. **Playwright Launch** (default): Launches new browser automatically
3. **CDP Only** (fallback): CDP without bridge dependency

### Tools Reference

#### `visioncraft_screenshot`

Capture page screenshot.

**Input**:
```json
{
  "format": "jpeg",  // or "png"
  "quality": 80      // 0-100, JPEG only
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "image",
      "data": "base64_encoded_image",
      "mimeType": "image/jpeg"
    }
  ]
}
```

---

#### `visioncraft_inspect_element`

Inspect element with source mapping.

**Input**:
```json
{
  "selector": "#submit-button"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Element: BUTTON\nSource: src/components/Button.tsx:15:8\n..."
    }
  ]
}
```

---

#### `visioncraft_get_source`

Get source location for element.

**Input**:
```json
{
  "selector": ".card"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "src/components/Card.tsx:42:8"
    }
  ]
}
```

---

#### `visioncraft_click`

Click element.

**Input**:
```json
{
  "selector": "#submit-btn"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Clicked element: #submit-btn"
    }
  ]
}
```

---

#### `visioncraft_type`

Type text into input.

**Input**:
```json
{
  "selector": "#username",
  "text": "john.doe"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Typed text into: #username"
    }
  ]
}
```

---

#### `visioncraft_scroll`

Scroll page.

**Input**:
```json
{
  "x": 0,
  "y": 500
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Scrolled to: (0, 500)"
    }
  ]
}
```

---

#### `visioncraft_find_elements`

Search for elements.

**Input**:
```json
{
  "query": "Learn more",
  "mode": "text"  // "text", "role", or "css"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 elements:\n1. a.link (src/App.tsx:25:4)\n..."
    }
  ]
}
```

---

#### `visioncraft_get_structure`

Get page DOM structure.

**Input**:
```json
{
  "maxDepth": 5
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"tag\": \"body\",\n  \"children\": [...]\n}"
    }
  ]
}
```

---

#### `visioncraft_get_console_logs`

Get console logs.

**Input**:
```json
{
  "level": "error",  // optional: "log", "warn", "error", "info"
  "limit": 10        // optional: max number of logs
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Console Logs (2):\n[ERROR] Failed to fetch\n..."
    }
  ]
}
```

---

#### `visioncraft_clear_console_logs`

Clear console logs.

**Input**: None

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Console logs cleared"
    }
  ]
}
```

---

#### `visioncraft_get_hmr_status`

Get HMR status.

**Input**: None

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "HMR Status:\n✅ Connected\nTotal Updates: 15\n..."
    }
  ]
}
```

---

#### `visioncraft_clear_hmr_errors`

Clear HMR errors.

**Input**: None

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ HMR errors cleared"
    }
  ]
}
```

---

#### `visioncraft_navigate`

Navigate to URL.

**Input**:
```json
{
  "url": "http://localhost:5173/about"
}
```

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Navigated to: http://localhost:5173/about"
    }
  ]
}
```

---

#### `visioncraft_get_current_url`

Get current URL.

**Input**: None

**Output**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "http://localhost:5173/"
    }
  ]
}
```

---

## Error Handling

All APIs return errors in a consistent format:

### Bridge Script Errors

```javascript
const result = window.__VISIONCRAFT__.inspectElement('#missing');
console.log(result.error); // "Element not found: #missing"
```

### MCP Tool Errors

```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error: Element not found: #missing"
    }
  ],
  "isError": true
}
```

---

## Type Definitions

Full TypeScript definitions are available in each package:

```typescript
import type { VisionCraftBabelPluginOptions } from '@visioncraft/babel-plugin';
import type { VisionCraftVitePluginOptions } from '@visioncraft/vite-plugin';
import type { VisionCraftAPI } from '@visioncraft/bridge';
```

---

## Version Compatibility

| Package | Version | Node | Vite | React |
|---------|---------|------|------|-------|
| babel-plugin | 1.0.0 | 18+ | - | 18+ |
| vite-plugin | 1.0.0 | 18+ | 5+ | 18+ |
| bridge | 1.0.0 | - | - | - |
| mcp-server | 1.0.0 | 18+ | - | - |

---

## See Also

- [Getting Started Guide](./GETTING-STARTED.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Examples](../examples/)
