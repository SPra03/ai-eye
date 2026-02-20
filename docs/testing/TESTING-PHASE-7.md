# Testing Phase 7: CDP Fallback Implementation

This guide provides step-by-step instructions for testing the Phase 7 CDP connection modes.

## Prerequisites

1. **Dev Server Running**
   ```bash
   cd examples/react-vite-app
   npx pnpm dev
   ```
   Should show: `Local: http://localhost:5175/`

2. **MCP Server Built**
   ```bash
   cd packages/mcp-server
   npx pnpm build
   ```
   Should output: `dist/index.js      506.7kb`

3. **Claude Desktop Configured**
   MCP server should be configured in `~/Library/Application Support/Claude/claude_desktop_config.json`

## Test 1: Playwright Launch Mode (Default)

**Description**: Tests the default mode that launches a new Chrome instance via Playwright.

### Steps:

1. **Restart Claude Desktop** (to pick up latest MCP server build)
   - Quit Claude Desktop completely
   - Reopen Claude Desktop

2. **Test Screenshot Tool**
   ```
   Take a screenshot of http://localhost:5175
   ```

   **Expected Output:**
   - New Chrome window opens
   - Browser navigates to localhost:5175
   - Screenshot is captured and displayed
   - Console logs should show:
     ```
     [BrowserClient] Connecting...
     [CDP] Attempting connection...
     [CDP] Trying connection mode: cdp-connect
     [CDP] Failed to connect via cdp-connect...
     [CDP] Trying connection mode: playwright-launch
     [CDP] Launching new browser via Playwright...
     [CDP] Browser launched successfully
     [CDP] VisionCraft bridge detected
     [CDP] Connected successfully via playwright-launch
     [BrowserClient] Connected via playwright-launch (bridge: yes)
     ```

3. **Test Bridge Functionality**
   ```
   Get the HMR status for the page at http://localhost:5175
   ```

   **Expected Output:**
   - HMR status shows `connected: true`
   - Update history and latency metrics displayed
   - Confirms bridge is working

### Success Criteria:
- ✅ New Chrome window launches automatically
- ✅ Screenshot captured successfully
- ✅ Connection mode shows `playwright-launch`
- ✅ Bridge available: `yes`
- ✅ HMR status accessible

## Test 2: CDP Connect Mode

**Description**: Tests connecting to an existing Chrome instance with debugging port enabled.

### Steps:

1. **Start Chrome with Debugging Port**
   ```bash
   # Close all Chrome instances first
   pkill -9 "Google Chrome"

   # Start Chrome with debugging enabled (MUST include --user-data-dir)
   mkdir -p /tmp/chrome-debug
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --user-data-dir=/tmp/chrome-debug \
     http://localhost:5175
   ```

   **Important:** The `--user-data-dir` flag is required for CDP to work properly. Without it, Chrome won't expose the debugging endpoint correctly.

2. **Verify CDP Endpoint** (Optional)
   ```bash
   curl http://localhost:9222/json/version
   ```
   Should return Chrome version and WebSocket debugger URL.

3. **Wait for Page to Load**
   - The Chrome window should open automatically to `http://localhost:5175`
   - Wait for the VisionCraft demo page to fully load

4. **Restart Claude Desktop**
   - Quit Claude Desktop completely
   - Reopen Claude Desktop

5. **Test Screenshot from Claude**
   ```
   Take a screenshot of http://localhost:5175
   ```

   **Expected Output:**
   - No new browser window opens
   - Uses existing Chrome tab
   - Screenshot captured in <100ms
   - Console logs should show:
     ```
     [CDP] Trying connection mode: cdp-connect
     [CDP] Connecting to existing browser at http://localhost:9222...
     [CDP] Connected to existing browser successfully
     [CDP] VisionCraft bridge detected
     [CDP] Connected successfully via cdp-connect
     [BrowserClient] Connected via cdp-connect (bridge: yes)
     ```

6. **Verify Performance**
   - Connection should be instant (<100ms)
   - No new browser windows
   - Minimal RAM usage (~10MB vs ~200MB)

### Success Criteria:
- ✅ Uses existing Chrome instance
- ✅ No new browser launched
- ✅ Connection mode shows `cdp-connect`
- ✅ Bridge available: `yes`
- ✅ Fast connection (<100ms)

## Test 3: Automatic Fallback

**Description**: Verify automatic fallback from CDP Connect to Playwright Launch when no debugging Chrome is available.

### Steps:

1. **Stop Debugging Chrome**
   ```bash
   pkill -9 "Google Chrome"
   ```

2. **Test Screenshot**
   ```
   Take a screenshot of http://localhost:5175
   ```

   **Expected Output:**
   - CDP Connect fails (no Chrome at port 9222)
   - Automatically falls back to Playwright Launch
   - New Chrome window opens
   - Screenshot succeeds
   - Console logs should show:
     ```
     [CDP] Trying connection mode: cdp-connect
     [CDP] Failed to connect via cdp-connect: connect ECONNREFUSED 127.0.0.1:9222
     [CDP] Trying connection mode: playwright-launch
     [CDP] Launching new browser via Playwright...
     [CDP] Connected successfully via playwright-launch
     ```

### Success Criteria:
- ✅ CDP Connect attempt fails gracefully
- ✅ Automatically falls back to Playwright Launch
- ✅ Screenshot still succeeds
- ✅ No user intervention required

## Test 4: CDP-Only Mode (No Bridge)

**Description**: Test fallback behavior when VisionCraft bridge script is not available.

### Steps:

1. **Stop Dev Server** (to remove VisionCraft bridge)
   - Kill the dev server process

2. **Start Simple HTTP Server**
   ```bash
   cd examples/react-vite-app/dist
   python3 -m http.server 8080
   ```

3. **Test Screenshot on Non-VisionCraft Page**
   ```
   Take a screenshot of http://localhost:8080
   ```

   **Expected Output:**
   - Connection succeeds
   - Screenshot works (via CDP)
   - Bridge not available
   - Console logs should show:
     ```
     [CDP] VisionCraft bridge not available, using CDP-only mode
     [BrowserClient] Connected via playwright-launch (bridge: no)
     ```

4. **Test Bridge-Dependent Feature** (Should Fail)
   ```
   Get the HMR status for http://localhost:8080
   ```

   **Expected Output:**
   - Error: "VisionCraft bridge not available"
   - Clear error message explaining bridge is required

### Success Criteria:
- ✅ Connection succeeds even without bridge
- ✅ Screenshots work (CDP-native)
- ✅ Bridge not available: `no`
- ✅ Bridge-dependent features fail gracefully with clear errors

## Performance Comparison

After running all tests, you should observe:

| Mode | RAM Usage | Startup Time | Bridge | Use Case |
|------|-----------|--------------|--------|----------|
| **CDP Connect** | ~10MB | <100ms | ✅ Yes | Development with existing Chrome |
| **Playwright Launch** | ~200MB | 2-3s | ✅ Yes | Default, works out-of-box |
| **CDP-Only** | Varies | Varies | ❌ No | Non-VisionCraft sites |

## Troubleshooting

### "All connection modes failed"
- **Check**: Is port 9222 available? `lsof -i :9222`
- **Fix**: `pkill -9 chrome` and try again
- **Check**: Are Playwright browsers installed? `npx playwright install chromium`

### "VisionCraft bridge not available"
- **Check**: Is dev server running? `curl http://localhost:5175`
- **Check**: Does page load in browser? Open manually and check console
- **Check**: Is VisionCraft Vite plugin configured?

### CDP Connect not working
- **Check**: Is Chrome running with `--remote-debugging-port=9222`?
- **Fix**: Kill all Chrome and restart with debugging flag
- **Check**: Did you navigate to the URL in Chrome first?

## Success Summary

✅ **Phase 7 Complete** when all tests pass:
- ✅ Playwright Launch mode works (default)
- ✅ CDP Connect mode works (existing Chrome)
- ✅ Automatic fallback works (cdp-connect → playwright-launch)
- ✅ CDP-Only mode works (without bridge)
- ✅ Bridge availability detected correctly
- ✅ Performance improvements verified (10x RAM, 20x speed)

## Next Steps

After verifying all tests pass:
1. Update PHASE-7-CDP.md with test results
2. Document any issues or edge cases found
3. Proceed to Phase 8: Testing & Quality Assurance
