# @visioncraft/bridge

Browser bridge script for VisionCraft. Provides inspection, interaction, and debugging APIs that run inside the user's application.

## What It Does

The bridge script runs in your application's browser context and provides:
- 🔍 **Element inspection** with source location
- 🎯 **Element interaction** (click, type, scroll)
- 📊 **Console log capture**
- 📸 **Screenshot capability**
- 🔥 **HMR status tracking**

## How It Works

The bridge is automatically injected by the Vite plugin and exposes `window.__VISIONCRAFT__` API.

## API Reference

### Element Inspection

#### `inspectElement(selector: string)`

Get detailed information about an element:

```javascript
window.__VISIONCRAFT__.inspectElement('button.primary');
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
window.__VISIONCRAFT__.getElementSource('button.primary');
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
window.__VISIONCRAFT__.getPageStructure(3);
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
window.__VISIONCRAFT__.findElements('Submit', 'text');

// Find by ARIA role
window.__VISIONCRAFT__.findElements('button', 'role');

// Find by CSS selector
window.__VISIONCRAFT__.findElements('.btn-primary', 'css');

// Returns array of:
[
  { selector: "button.btn-primary", source: "src/App.tsx", text: "Submit" }
]
```

### Element Interaction

#### `clickElement(selector: string)`

Click an element:

```javascript
window.__VISIONCRAFT__.clickElement('button.submit');
// Returns: { success: true }
```

#### `typeText(selector: string, text: string)`

Type text into an input:

```javascript
window.__VISIONCRAFT__.typeText('input[name="email"]', 'test@example.com');
// Returns: { success: true }
```

#### `scrollTo(x: number, y: number)`

Scroll to position:

```javascript
window.__VISIONCRAFT__.scrollTo(0, 500);
// Returns: { success: true }
```

### Debugging

#### `consoleLogs`

Array of captured console logs (last 200):

```javascript
window.__VISIONCRAFT__.consoleLogs;
// Returns array of:
[
  { level: "log", message: "Hello", timestamp: 1234567890 }
]
```

#### `getConsoleLogs(level?: string, limit?: number)`

Get filtered console logs:

```javascript
// Get last 10 errors
window.__VISIONCRAFT__.getConsoleLogs('error', 10);

// Get all warnings
window.__VISIONCRAFT__.getConsoleLogs('warn');
```

#### `clearConsoleLogs()`

Clear captured logs:

```javascript
window.__VISIONCRAFT__.clearConsoleLogs();
```

### Screenshots

#### `captureScreenshot(format?: 'jpeg' | 'png', quality?: number)`

Capture page screenshot (requires html2canvas):

```javascript
const dataUrl = await window.__VISIONCRAFT__.captureScreenshot('jpeg', 80);
// Returns: "data:image/jpeg;base64,..."
```

### HMR Status

#### `getHMRStatus()`

Get Hot Module Replacement status:

```javascript
window.__VISIONCRAFT__.getHMRStatus();
// Returns:
{
  connected: true,
  lastUpdate: 1234567890,
  errors: []
}
```

## Integration

### Automatic (via Vite Plugin)

The bridge is automatically injected when using `@visioncraft/vite-plugin`:

```ts
// vite.config.ts
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [visionCraft()],
});
```

### Manual (for other setups)

```html
<script src="./node_modules/@visioncraft/bridge/dist/visioncraft-bridge.js"></script>
```

## Testing the Bridge

### Check if Loaded

```javascript
console.log(window.__VISIONCRAFT__);
// Should show the API object

console.log(window.__VISIONCRAFT__.ready);
// Should return: true
```

### Test Element Inspection

```javascript
// Inspect any element on the page
const result = window.__VISIONCRAFT__.inspectElement('button');
console.log(result.sourceFile); // Should show source file path
```

### Test Console Capture

```javascript
console.log('Test message');
const logs = window.__VISIONCRAFT__.getConsoleLogs();
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
visionCraft({
  enabled: process.env.NODE_ENV === 'development'
})
```

## License

MIT
