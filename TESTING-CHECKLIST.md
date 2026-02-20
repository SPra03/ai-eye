# VisionCraft Testing Checklist

## Unit Tests (Automated)

### Babel Plugin Tests
- [x] Basic attribute injection (data-vc-source, data-vc-line, data-vc-col)
- [x] Custom attribute prefix
- [x] Custom root directory
- [x] Respect enabled flag
- [x] Skip node_modules files
- [x] Skip Fragment elements
- [x] Handle self-closing tags
- [x] Handle elements with existing attributes
- [x] Handle component elements (PascalCase)
- [x] Handle spread attributes
- [x] Handle conditional rendering
- [x] Handle mapped elements
- [x] Handle Windows paths
- [x] Handle deeply nested paths
- [x] Handle complex JSX patterns
- [x] Preserve existing data attributes

**Status**: ✅ 28/28 tests passing

### Vite Plugin Tests
- [x] Plugin configuration (name, enforce)
- [x] Custom options handling
- [x] File filtering (include/exclude patterns)
- [x] Transform hook
- [x] Virtual module resolution (@visioncraft/bridge)
- [x] Config resolution (development/production modes)
- [x] HMR integration
- [x] HTML transform and script injection
- [x] Production mode behavior

**Status**: ✅ 24/24 tests passing

### Bridge Script Tests
- [x] API contract (all expected methods defined)
- [x] Type definitions (all interfaces complete)
- [x] Expected behavior (limits, defaults)
- [x] Source mapping attributes
- [x] Find element modes (text, role, css)
- [x] Console log levels
- [x] Screenshot formats
- [x] Global exposure (window.__VISIONCRAFT__)

**Status**: ✅ 38/38 tests passing

**Total Unit Tests**: ✅ 90/90 passing

---

## Integration Tests (Manual)

### Phase 7 CDP Connection Tests

Already completed and documented in `PHASE-7-TEST-RESULTS.md`:

- [x] Playwright Launch mode (default)
- [x] CDP Connect mode (optimized)
- [x] Automatic fallback (cdp-connect → playwright-launch)
- [x] Bridge availability detection
- [x] Port conflict resolution

**Status**: ✅ All tests passed

**Reference**: See `PHASE-7-TEST-RESULTS.md` for detailed results

---

## MCP Server Tools Testing

### Prerequisites
1. Start example React app: `cd examples/react-vite-app && npx pnpm dev`
2. Configure Claude Desktop with MCP server
3. Open Claude Desktop and verify MCP connection

### Tool Tests

#### 1. Screenshot Tool
- [ ] `visioncraft_screenshot` with default settings (JPEG, 80% quality)
- [ ] Screenshot with PNG format
- [ ] Screenshot with different quality levels
- [ ] Full page screenshot
- [ ] Verify base64 data URL returned

#### 2. Element Inspection Tools
- [ ] `visioncraft_inspect_element` with simple CSS selector (e.g., `#root`)
- [ ] Inspect element with source mapping attributes
- [ ] Verify bounding box coordinates
- [ ] Verify computed styles returned
- [ ] Verify all attributes included
- [ ] Handle non-existent selector (error case)

#### 3. Source Location Tool
- [ ] `visioncraft_get_source` for element with source mapping
- [ ] Get source for element without mapping (should return null)
- [ ] Handle non-existent selector (error case)
- [ ] Verify file path is relative to project root

#### 4. Interaction Tools
- [ ] `visioncraft_click` on a button element
- [ ] Verify click event fires (e.g., counter increments)
- [ ] Click non-existent element (error case)
- [ ] `visioncraft_type` into input field
- [ ] Verify input value changes
- [ ] Verify input/change events fire
- [ ] Type into textarea
- [ ] Type into non-input element (error case)

#### 5. Navigation Tools
- [ ] `visioncraft_navigate` to different URL
- [ ] Verify page loads
- [ ] Verify bridge still available after navigation
- [ ] `visioncraft_get_current_url` returns correct URL

#### 6. Element Search Tools
- [ ] `visioncraft_find_elements` with CSS selector
- [ ] Find elements by text content (mode: "text")
- [ ] Find elements by ARIA role (mode: "role")
- [ ] Verify source mapping in results
- [ ] Verify results limited to 20 elements

#### 7. Page Structure Tool
- [ ] `visioncraft_get_structure` with default depth (5)
- [ ] Get structure with custom maxDepth
- [ ] Verify source mapping in structure
- [ ] Verify text content for leaf nodes
- [ ] Verify children limited to 20 per node

#### 8. Console Logging Tools
- [ ] `visioncraft_get_console_logs` with no filters
- [ ] Get logs filtered by level (log, warn, error, info)
- [ ] Get logs with limit parameter
- [ ] Verify captured logs include timestamp
- [ ] `visioncraft_clear_console_logs` clears logs
- [ ] Verify console interception works (trigger console.log in app)

#### 9. HMR Status Tools
- [ ] `visioncraft_get_hmr_status` returns connection status
- [ ] Verify connected: true when Vite dev server running
- [ ] Verify errors array populated (trigger an error)
- [ ] Verify updates array populated (make a code change)
- [ ] Verify averageLatency calculated
- [ ] `visioncraft_clear_hmr_errors` clears errors

#### 10. Scroll Tool
- [ ] `visioncraft_scroll` to position (0, 500)
- [ ] Verify page scrolls
- [ ] Scroll back to top (0, 0)

---

## Browser Compatibility Testing

### Chrome (Primary Target)
- [ ] All MCP tools work
- [ ] Source mapping attributes present
- [ ] HMR integration works
- [ ] Console log capture works
- [ ] CDP connection works

### Firefox
- [ ] Basic functionality (if Playwright supports)
- [ ] Source mapping
- [ ] Note any limitations

### Safari
- [ ] Basic functionality (if Playwright supports)
- [ ] Source mapping
- [ ] Note any limitations

---

## Connection Mode Testing

### Playwright Launch Mode (Default)
- [ ] Browser launches automatically
- [ ] Bridge injected correctly
- [ ] All tools functional
- [ ] Works without user configuration
- [ ] ~200MB RAM usage
- [ ] ~2-3s startup time

### CDP Connect Mode (Optimized)
- [ ] Connects to existing Chrome instance
- [ ] No new browser window opened
- [ ] Bridge detected in existing session
- [ ] All tools functional
- [ ] ~10MB RAM usage
- [ ] <100ms startup time

**Prerequisites**:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:5175
```

### Fallback Behavior
- [ ] CDP Connect fails gracefully when port unavailable
- [ ] Automatic fallback to Playwright Launch
- [ ] User not disrupted by fallback
- [ ] Error logged but not shown to user

---

## Error Handling Testing

### Invalid Selectors
- [ ] Invalid CSS selector returns helpful error
- [ ] Empty selector returns error
- [ ] Non-existent element returns "Element not found"

### Network Issues
- [ ] Browser disconnection handled gracefully
- [ ] Reconnection works
- [ ] Pending operations timeout appropriately

### Bridge Unavailable
- [ ] Bridge detection works
- [ ] Falls back to CDP-only mode when bridge missing
- [ ] Screenshot still works (Playwright fallback)
- [ ] Navigation still works
- [ ] Bridge-dependent tools show appropriate error

---

## Performance Testing

### Memory Usage
- [ ] Monitor RAM usage in Playwright Launch mode (~200MB)
- [ ] Monitor RAM usage in CDP Connect mode (~10MB)
- [ ] No memory leaks during extended usage
- [ ] Console log buffer doesn't grow unbounded (max 200)
- [ ] HMR history limited (max 20 updates, max 10 errors)

### Response Time
- [ ] Screenshot completes in <2s for typical page
- [ ] Element inspection completes in <100ms
- [ ] Navigation completes in <1s for localhost
- [ ] Find elements completes in <500ms for typical page

### Load Testing
- [ ] 100+ rapid screenshot requests handled
- [ ] Multiple concurrent element inspections
- [ ] Page structure for deeply nested DOM (1000+ elements)
- [ ] Console log capture with 500+ logs

---

## Security Testing

### XSS Protection
- [ ] Malicious selectors don't execute code
- [ ] Injected text properly escaped
- [ ] Screenshot doesn't capture sensitive data unintentionally

### CORS and CSP
- [ ] Bridge injection works with CSP headers
- [ ] Screenshot works with strict CSP
- [ ] Console logs don't expose secrets

---

## Edge Cases

### DOM Edge Cases
- [ ] Elements without IDs or classes
- [ ] Elements with very long text (truncation)
- [ ] Elements with Unicode characters
- [ ] Elements with emojis
- [ ] Shadow DOM elements (limitation documented)

### Page States
- [ ] Empty page (no elements)
- [ ] Page during loading (before DOMContentLoaded)
- [ ] Page with errors (console errors captured)
- [ ] Page with failed network requests

### Browser States
- [ ] Multiple tabs open
- [ ] Browser minimized
- [ ] Browser on different desktop (macOS)
- [ ] Browser debugging tools open

---

## Documentation Testing

### README Accuracy
- [ ] Installation steps work
- [ ] Configuration examples valid
- [ ] MCP setup instructions correct
- [ ] Example usage works

### Code Comments
- [ ] JSDoc comments accurate
- [ ] Type definitions correct
- [ ] Examples in comments work

### API Documentation
- [ ] All MCP tools documented
- [ ] Input schemas accurate
- [ ] Output formats documented
- [ ] Error cases documented

---

## Regression Testing

After any code changes, verify:
- [ ] All unit tests still passing
- [ ] No new TypeScript errors
- [ ] Build completes successfully
- [ ] Example app still works
- [ ] MCP server still connects
- [ ] Source mapping still accurate

---

## Test Results Summary

| Test Category | Status | Passing | Total | Notes |
|--------------|--------|---------|-------|-------|
| Babel Plugin Unit Tests | ✅ | 28 | 28 | All tests passing |
| Vite Plugin Unit Tests | ✅ | 24 | 24 | All tests passing |
| Bridge Interface Tests | ✅ | 38 | 38 | All tests passing |
| CDP Connection Tests | ✅ | 4 | 4 | See PHASE-7-TEST-RESULTS.md |
| MCP Tools Integration | ⏳ | - | 14 | Manual testing required |
| Browser Compatibility | ⏳ | - | 3 | Manual testing required |
| Connection Modes | ⏳ | - | 3 | Manual testing required |
| Error Handling | ⏳ | - | 3 | Manual testing required |
| Performance | ⏳ | - | 4 | Manual testing required |
| Security | ⏳ | - | 3 | Manual testing required |

**Overall Status**: 90/90 automated tests passing ✅

**Next Steps**:
1. Complete manual MCP tools testing
2. Document any issues found
3. Fix issues and re-test
4. Update test results
5. Mark Phase 8 as complete

---

## Known Limitations

1. **Shadow DOM**: Elements inside Shadow DOM not accessible via standard selectors
2. **iframes**: Cross-origin iframes cannot be inspected
3. **Browser**: Chrome/Chromium-based browsers only (Playwright limitation)
4. **HMR**: Vite-specific HMR events (won't work with other dev servers)
5. **Source Maps**: Only works with Babel/Vite plugins enabled

---

## Test Environment

- **Node Version**: 18.x or higher
- **Package Manager**: pnpm
- **OS**: macOS (primary), Linux (tested), Windows (not tested)
- **Browser**: Chrome 120+ / Chromium
- **Vite Version**: 5.x
- **React Version**: 18.x

---

## Continuous Testing

### Pre-commit
- Run unit tests: `npx vitest run`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint .`

### Pre-release
- All unit tests passing
- Manual MCP tools testing completed
- Example app working
- Documentation updated
- CHANGELOG updated

### Post-release
- Monitor GitHub issues for bugs
- Track performance metrics
- Collect user feedback
