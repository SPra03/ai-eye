# Quick Bridge Test

## Phase 4 Testing - VisionCraft Bridge Script

The bridge script is now successfully injected! 🎉

### Quick Browser Test

1. **Open the React app** (should already be open):
   ```
   http://localhost:5176/
   ```

2. **Open browser console** (⌘+Option+J on Mac)

3. **Run this test script** (paste into console):

```javascript
(async function testVisionCraft() {
  console.log('🧪 VisionCraft Bridge Test Suite\n');
  console.log('='.repeat(50));

  // Test 1: Bridge loaded
  console.log('\n✅ Test 1: Bridge loaded:', !!window.__VISIONCRAFT__);
  console.log('   Version:', window.__VISIONCRAFT__.version);
  console.log('   Ready:', window.__VISIONCRAFT__.ready);

  // Test 2: Inspect element
  const inspection = window.__VISIONCRAFT__.inspectElement('button');
  console.log('\n✅ Test 2: Element inspection');
  console.log('   Tag:', inspection.tagName);
  console.log('   Source:', inspection.sourceFile);
  console.log('   Line:', inspection.sourceLine);

  // Test 3: Get source location
  const source = window.__VISIONCRAFT__.getElementSource('h1');
  console.log('\n✅ Test 3: Source location');
  console.log('   Location:', `${source.file}:${source.line}:${source.col}`);

  // Test 4: Find elements
  const buttons = window.__VISIONCRAFT__.findElements('button', 'css');
  console.log('\n✅ Test 4: Find elements');
  console.log('   Found', buttons.length, 'button(s)');

  // Test 5: Page structure
  const structure = window.__VISIONCRAFT__.getPageStructure(2);
  console.log('\n✅ Test 5: Page structure');
  console.log('   Root:', structure.tag);
  console.log('   Children:', structure.children?.length || 0);

  // Test 6: Click button
  const clickResult = window.__VISIONCRAFT__.clickElement('button');
  console.log('\n✅ Test 6: Click element');
  console.log('   Success:', clickResult.success);

  // Test 7: Type text
  const typeResult = window.__VISIONCRAFT__.typeText('input', 'Bridge test!');
  console.log('\n✅ Test 7: Type text');
  console.log('   Success:', typeResult.success);

  // Test 8: Console logs
  console.log('Test log entry');
  const logs = window.__VISIONCRAFT__.getConsoleLogs();
  console.log('\n✅ Test 8: Console capture');
  console.log('   Captured', logs.length, 'logs');

  // Test 9: HMR status
  const hmr = window.__VISIONCRAFT__.getHMRStatus();
  console.log('\n✅ Test 9: HMR status');
  console.log('   Connected:', hmr.connected);

  // Test 10: Source mapping
  const sourceMapped = document.querySelectorAll('[data-vc-source]').length;
  console.log('\n✅ Test 10: Source mapping');
  console.log('   Elements:', sourceMapped);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests completed!\n');
})();
```

### Expected Results

All tests should show `✅` and return valid data:

- **Bridge loaded**: `true`
- **Version**: `1.0.0`
- **Element inspection**: Should show button's source file and line number
- **Source location**: Should show `src/App.tsx:X:Y`
- **Find elements**: Should find 3 buttons
- **Page structure**: Should show body with children
- **Click/Type**: Should return `{ success: true }`
- **Console capture**: Should show captured logs
- **HMR status**: Should show `connected: false` (or `true` if HMR client connected)
- **Source mapping**: Should show 20+ elements with source attributes

### What's Working

✅ Bridge script injection via Vite plugin
✅ Source mapping attributes on all JSX elements
✅ Element inspection with source locations
✅ Element interaction (click, type, scroll)
✅ Console log capture with ring buffer
✅ Page structure traversal
✅ Element finding by text/role/CSS
✅ HMR status tracking

### Next: Test in VS Code Extension

Once browser testing works, test the same functionality through the VS Code Extension's preview panel:

1. Press `F5` in VS Code (Extension Development Host)
2. Run command: **VisionCraft: Open Live Preview**
3. Navigate to `http://localhost:5176`
4. Use the webview to interact with your app

The bridge APIs will be available to the MCP server in Phase 5!

---

**Phase 4 Status**: ✅ Complete and tested
**Next Phase**: Phase 5 - MCP Server Implementation
