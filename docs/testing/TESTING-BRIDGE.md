# Testing the VisionCraft Bridge Script

This guide shows you how to test Phase 4: Bridge Script & Browser Automation.

## Prerequisites

1. React app is running:
   ```bash
   cd examples/react-vite-app
   npx pnpm dev
   ```

2. Extension Development Host is open (press F5 in VS Code)

3. VisionCraft Preview is showing the React app

## Test 1: Verify Bridge is Loaded

### In Browser Console

Open `http://localhost:5175` in browser, press `Cmd+Option+J`:

```javascript
// Check if bridge is available
console.log(window.__VISIONCRAFT__);
// Should show: { inspectElement: ƒ, getPageStructure: ƒ, ... }

// Check version
console.log(window.__VISIONCRAFT__.version);
// Should show: "1.0.0"

// Check ready state
console.log(window.__VISIONCRAFT__.ready);
// Should show: true
```

✅ **Expected:** All commands return valid data

## Test 2: Element Inspection

### Inspect a Button

```javascript
// Inspect the first button
const result = window.__VISIONCRAFT__.inspectElement('button');
console.log(result);
```

✅ **Expected output:**
```javascript
{
  tagName: "BUTTON",
  sourceFile: "src/App.tsx",
  sourceLine: "22",  // Line number in your source
  sourceCol: "12",
  boundingBox: { x: ..., y: ..., width: ..., height: ... },
  computedStyles: { backgroundColor: "...", color: "..." },
  innerText: "Decrement" (or similar),
  attributes: { ... }
}
```

### Get Just Source Location

```javascript
const source = window.__VISIONCRAFT__.getElementSource('h1');
console.log(source);
```

✅ **Expected:**
```javascript
{
  file: "src/App.tsx",
  line: "8",
  col: "8"
}
```

## Test 3: Find Elements

### Find by Text

```javascript
// Find all elements containing "Counter"
const elements = window.__VISIONCRAFT__.findElements('Counter', 'text');
console.log(elements);
```

✅ **Expected:** Array of elements with selectors and source locations

### Find by CSS Selector

```javascript
// Find all buttons
const buttons = window.__VISIONCRAFT__.findElements('button', 'css');
console.log(`Found ${buttons.length} buttons`);
console.log(buttons);
```

✅ **Expected:** Should find 3 buttons (Decrement, Reset, Increment)

## Test 4: Page Structure

```javascript
// Get DOM tree with source locations
const structure = window.__VISIONCRAFT__.getPageStructure(3);
console.log(structure);
```

✅ **Expected:** Nested object showing DOM hierarchy with `source`, `tag`, `role` properties

## Test 5: Element Interaction

### Click a Button

```javascript
// Get current count
const countBefore = document.querySelector('.count-value').textContent;
console.log('Count before:', countBefore);

// Click increment button
const result = window.__VISIONCRAFT__.clickElement('button:nth-of-type(3)');
console.log('Click result:', result);

// Check new count
setTimeout(() => {
  const countAfter = document.querySelector('.count-value').textContent;
  console.log('Count after:', countAfter);
}, 100);
```

✅ **Expected:**
- `result.success === true`
- Counter increments by 1

### Type in Input

```javascript
// Type in the input field
const result = window.__VISIONCRAFT__.typeText('input.text-input', 'Hello VisionCraft!');
console.log('Type result:', result);

// Verify it worked
const inputValue = document.querySelector('input.text-input').value;
console.log('Input value:', inputValue);
```

✅ **Expected:**
- `result.success === true`
- Input shows "Hello VisionCraft!"
- Message appears below input

### Scroll

```javascript
// Scroll down
const result = window.__VISIONCRAFT__.scrollTo(0, 500);
console.log('Scroll result:', result);
```

✅ **Expected:** Page scrolls down

## Test 6: Console Log Capture

```javascript
// Generate some logs
console.log('Test log message');
console.warn('Test warning');
console.error('Test error');

// Get all captured logs
const allLogs = window.__VISIONCRAFT__.getConsoleLogs();
console.log(`Total logs captured: ${allLogs.length}`);

// Get just errors
const errors = window.__VISIONCRAFT__.getConsoleLogs('error');
console.log('Errors:', errors);

// Get last 5 logs
const recent = window.__VISIONCRAFT__.getConsoleLogs(undefined, 5);
console.log('Recent logs:', recent);
```

✅ **Expected:** All your test logs are captured with level and timestamp

## Test 7: Console Logs Array

```javascript
// Access the logs array directly
console.log('Total logs:', window.__VISIONCRAFT__.consoleLogs.length);

// Clear logs
window.__VISIONCRAFT__.clearConsoleLogs();
console.log('Logs after clear:', window.__VISIONCRAFT__.consoleLogs.length);
```

✅ **Expected:** Logs can be accessed and cleared

## Test 8: Screenshot (Optional)

**Note:** This requires html2canvas library. It's not included by default.

To test screenshots, first add html2canvas:

```html
<!-- Add to index.html temporarily -->
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
```

Then:

```javascript
// Capture screenshot
const dataUrl = await window.__VISIONCRAFT__.captureScreenshot('jpeg', 80);
console.log('Screenshot length:', dataUrl.length);

// Display it
const img = document.createElement('img');
img.src = dataUrl;
document.body.appendChild(img);
```

✅ **Expected:** Screenshot appears on page

## Test 9: HMR Status

```javascript
// Get HMR status
const status = window.__VISIONCRAFT__.getHMRStatus();
console.log('HMR Status:', status);
```

✅ **Expected:**
```javascript
{
  connected: true,  // If using Vite dev server
  lastUpdate: null, // or timestamp of last update
  errors: []
}
```

## Test 10: Real-Time Testing

### Edit the Source File

1. Open `examples/react-vite-app/src/App.tsx`
2. Change line 8:
   ```tsx
   <h1>🚀 Bridge Test</h1>
   ```
3. Save (Cmd+S)
4. In console, run:
   ```javascript
   const source = window.__VISIONCRAFT__.getElementSource('h1');
   console.log(source);
   ```

✅ **Expected:** Source location still points to App.tsx:8 (line number might change)

## Comprehensive Test Script

Run this complete test:

```javascript
(async function testVisionCraft() {
  console.log('=== VisionCraft Bridge Test Suite ===\n');

  // Test 1: Bridge loaded
  console.log('✅ Test 1: Bridge loaded:', !!window.__VISIONCRAFT__);

  // Test 2: Inspect element
  const inspection = window.__VISIONCRAFT__.inspectElement('button');
  console.log('✅ Test 2: Inspection has source:', !!inspection.sourceFile);

  // Test 3: Find elements
  const buttons = window.__VISIONCRAFT__.findElements('button', 'css');
  console.log('✅ Test 3: Found', buttons.length, 'buttons');

  // Test 4: Get source
  const source = window.__VISIONCRAFT__.getElementSource('h1');
  console.log('✅ Test 4: H1 source:', source.file);

  // Test 5: Page structure
  const structure = window.__VISIONCRAFT__.getPageStructure(2);
  console.log('✅ Test 5: Structure has', structure.children?.length || 0, 'children');

  // Test 6: Click button
  const clickResult = window.__VISIONCRAFT__.clickElement('button');
  console.log('✅ Test 6: Click result:', clickResult.success);

  // Test 7: Type text
  const typeResult = window.__VISIONCRAFT__.typeText('input', 'Test');
  console.log('✅ Test 7: Type result:', typeResult.success);

  // Test 8: Console logs
  console.log('Test log entry');
  const logs = window.__VISIONCRAFT__.getConsoleLogs();
  console.log('✅ Test 8: Captured', logs.length, 'logs');

  // Test 9: HMR status
  const hmr = window.__VISIONCRAFT__.getHMRStatus();
  console.log('✅ Test 9: HMR connected:', hmr.connected);

  console.log('\n=== All Tests Completed ===');
})();
```

✅ **Expected:** All 9 tests pass

## Troubleshooting

### Bridge not available

**Check 1:** Is the Vite plugin enabled?
```javascript
// In vite.config.ts
visionCraft({ enabled: true })
```

**Check 2:** Clear cache and restart:
```bash
rm -rf node_modules/.vite
npx pnpm dev
```

### Source attributes missing

**Check:** View page source (Cmd+U) and search for `data-vc-source`. If not found, the source mapping plugin isn't working.

### Functions return errors

**Check:** Console for error messages. Common issues:
- Element not found: Use valid CSS selector
- Type target not input: Only works on input/textarea
- Screenshot fails: html2canvas not loaded

## Next Steps

Once the bridge is working, Phase 5 (MCP Server) will expose these APIs to AI agents, allowing them to:
- Inspect any element and jump to source
- Interact with the UI programmatically
- Monitor console logs and errors
- Understand page structure

Great job testing! 🎉
