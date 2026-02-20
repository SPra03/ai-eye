# VisionCraft Implementation Plan

## Project Overview
Building an AI-native VS Code extension that provides visual perception to AI coding agents through embedded live preview, source mapping, and MCP integration.

---

## Phase 0: Project Foundation & Setup
**Duration:** ~1-2 hours | **Prerequisites:** None | **Blockers:** None

### Tasks:
1. **Initialize monorepo structure** with pnpm workspaces
   - Root package.json with workspace configuration
   - Separate packages: extension, mcp-server, babel-plugin, swc-plugin, vite-plugin

2. **Setup TypeScript configuration**
   - Root tsconfig.json with composite project references
   - Per-package tsconfig.json extending root config
   - Target: ES2022, module: NodeNext

3. **Install core dependencies**
   - VS Code extension API (@types/vscode ^1.96.0)
   - MCP SDK (@modelcontextprotocol/sdk)
   - Build tools (esbuild, tsx, vitest)
   - Playwright-core for CDP fallback

4. **Configure build pipeline**
   - esbuild for extension bundling (fast, simple)
   - Separate builds for extension vs MCP server
   - Watch mode for development

5. **Git & tooling setup**
   - .gitignore (node_modules, dist, *.vsix)
   - .vscodeignore (exclude source from extension package)
   - ESLint + Prettier configuration
   - VS Code launch.json for debugging

**Critical Thinking:** Monorepo structure is essential because we have 5+ interconnected packages. pnpm workspaces provide efficient dependency management and fast installs. TypeScript composite projects enable incremental builds and proper type checking across packages.

**Deliverables:**
- Functional project structure
- All packages install successfully
- TypeScript compiles without errors

---

## Phase 1: VS Code Extension Core
**Duration:** ~2-3 hours | **Prerequisites:** Phase 0 | **Blocks:** Phase 2, 5

### Tasks:
1. **Create extension entry point** (src/extension.ts)
   - activate() and deactivate() lifecycle hooks
   - Extension context management
   - Command registration system

2. **Implement package.json manifest**
   - Extension metadata (name, version, publisher)
   - Activation events (onCommand:visioncraft.*)
   - Contributed commands (openPreview, startServer)
   - Configuration properties (devServerUrl, framework, screenshotQuality)
   - MCP server definition provider

3. **Build configuration manager**
   - Read VS Code workspace configuration
   - Validate settings (check if dev server URL is accessible)
   - Provide defaults and fallbacks

4. **Implement extension state management**
   - Singleton pattern for managers (PreviewManager, CDPBridge)
   - Proper disposal and cleanup
   - Extension context subscriptions

**Critical Thinking:** The extension host is the "kernel" - everything else plugs into it. We need solid lifecycle management because the extension can activate/deactivate multiple times in a VS Code session. Singleton pattern ensures we don't create duplicate webview panels or MCP servers.

**Challenges:**
- Ensuring proper cleanup to avoid memory leaks
- Handling edge cases (extension reloading, VS Code restart)

**Deliverables:**
- Extension loads in VS Code Extension Development Host
- Commands appear in Command Palette
- Configuration settings visible in VS Code settings UI

---

## Phase 2: Embedded Live Preview
**Duration:** ~4-5 hours | **Prerequisites:** Phase 1 | **Blocks:** Phase 4, 6

### Tasks:
1. **Implement PreviewManager class**
   - Create/manage webview panel lifecycle
   - Handle panel visibility, disposal, state preservation
   - retainContextWhenHidden: true (prevent content reload)

2. **Build webview HTML with iframe**
   - Toolbar with URL bar, reload, inspect buttons
   - Full-height iframe (calc(100vh - 36px))
   - Proper sandbox attributes
   - CSP (Content Security Policy) configuration

3. **Implement bi-directional messaging**
   - Extension ↔ Webview communication via postMessage
   - Webview ↔ iframe bridge (relay messages from page)
   - Message queue and timeout handling

4. **Port mapping configuration**
   - Map common dev server ports (3000, 5173, 8080, 9222)
   - Handle VS Code's port forwarding
   - Auto-detect dev server port from package.json scripts

5. **Dev server health check**
   - Ping dev server before loading preview
   - Show helpful error if server not running
   - Provide "Start Dev Server" action button

**Critical Thinking:** The iframe approach is crucial - it gives us native rendering at 50MB RAM vs 200-500MB for headless Chrome. However, we lose direct CDP access, hence the bridge script strategy. Port mapping is essential because webviews run in a sandboxed context with different network access.

**Challenges:**
- CSP restrictions (need to allow localhost, inline scripts for bridge)
- iframe communication security (validate message origins)
- Handling dev server crashes/restarts

**Deliverables:**
- Webview panel opens and displays dev server content
- Toolbar controls work (reload, URL change)
- No console errors in webview developer tools

---

## Phase 3: Source Mapping Engine (Critical Innovation)
**Duration:** ~6-8 hours | **Prerequisites:** Phase 0 | **Blocks:** Phase 4

This is the **most critical** and **most complex** phase - it's what differentiates VisionCraft from simple browser previews.

### Sub-phase 3A: Babel Plugin (React, generic JSX)
**Tasks:**
1. **Create @visioncraft/babel-plugin package**
   - Implement Babel plugin visitor pattern
   - JSXOpeningElement visitor
   - Extract source location from AST node.loc

2. **Inject data-vc-* attributes**
   - data-vc-source: relative file path
   - data-vc-line: line number (1-indexed)
   - data-vc-col: column number (0-indexed)

3. **Skip already-tagged elements**
   - Check for existing data-vc-source attribute
   - Avoid duplicate injection on re-transforms

4. **Handle edge cases**
   - Fragments (<></>) - skip, no DOM node
   - Conditional rendering - preserve through ternaries
   - Spread attributes - insert before spreads

**Critical Thinking:** Build-time injection is superior to runtime fiber inspection because React 19 removed _debugSource. We inject at compile time, so it works with any React version and even non-React frameworks. The visitor pattern gives us precise AST-level control.

### Sub-phase 3B: Vite Plugin (Vue, Svelte, Vite+React)
**Tasks:**
1. **Create @visioncraft/vite-plugin package**
   - Implement Vite plugin interface (transform hook)
   - Use MagicString for zero-copy string manipulation
   - Regex-based JSX tag detection

2. **Framework-specific handling**
   - Vue SFC: inject into template section
   - Svelte: inject into markup
   - TSX/JSX: same as Babel approach

3. **Source map generation**
   - Preserve original source maps
   - Generate new mappings after injection
   - Chain with other plugins

**Critical Thinking:** Vite's transform hook runs before esbuild, giving us access to raw source. MagicString is essential for performance - it uses a linked list internally to avoid string copying. Regex approach is acceptable here because we control the input (valid JSX).

### Sub-phase 3C: SWC Plugin (Next.js, Turbopack)
**Tasks:**
1. **Create @visioncraft/swc-plugin package (Rust)**
   - Use swc_plugin crate
   - Implement JSX visitor in Rust
   - Parse/modify AST nodes

2. **OR: Fallback to Babel if SWC too complex**
   - Next.js still supports Babel as fallback
   - Configure next.config.js to use Babel plugin
   - Document performance trade-off

**Critical Thinking:** SWC plugin requires Rust knowledge and is more complex. Given time constraints, I recommend implementing Babel fallback first, then SWC as optimization. Most Next.js users won't notice Babel's slower speed for a dev-only plugin.

**Challenges:**
- AST manipulation is error-prone (easy to break JSX)
- Must preserve formatting and source maps
- Framework-specific quirks (Vue script setup, Svelte reactive blocks)
- Rust learning curve for SWC

**Deliverables:**
- Babel plugin successfully injects attributes in React app
- Vite plugin works with Vue/Svelte test apps
- Rendered HTML shows data-vc-* attributes in browser inspector

---

## Phase 4: Bridge Script & Browser Automation
**Duration:** ~5-6 hours | **Prerequisites:** Phase 2, 3 | **Blocks:** Phase 5

### Tasks:
1. **Create bridge script** (packages/bridge/visioncraft-bridge.js)
   - Self-contained, zero dependencies
   - Injected via Vite plugin or script tag
   - Attaches to window.__VISIONCRAFT__

2. **Implement inspection API**
   - inspectElement(selector): returns source + styles + dimensions
   - getPageStructure(maxDepth): DOM tree with source locations
   - findElements(query, mode): search by text/role/selector

3. **Implement interaction API**
   - clickElement(selector): simulate click
   - typeText(selector, text): fill inputs
   - scrollTo(x, y): programmatic scrolling

4. **Implement debugging API**
   - Console log capture (intercept console.log/warn/error)
   - Ring buffer (last 200 messages)
   - Error boundary for try-catch around all APIs

5. **Implement screenshot API**
   - Use html2canvas library (fallback if CDP unavailable)
   - captureScreenshot(format, quality): returns base64

6. **Build BridgeAutomation class** (extension side)
   - evaluate(code): execute code in bridge context
   - Promise-based with timeout (5 seconds)
   - Message ID correlation (request/response matching)

**Critical Thinking:** The bridge script is our "eyes and hands" inside the page. It must be bulletproof - any crash takes down the user's app. Hence extensive error handling. The 200-message ring buffer prevents memory leaks on chatty apps.

**Challenges:**
- CSP may block inline script execution (need proper directives)
- html2canvas has limitations (can't capture WebGL, some CSS features)
- Cross-origin iframe issues if user app uses embedded iframes

**Deliverables:**
- Bridge script loads successfully in preview
- window.__VISIONCRAFT__ API works in console
- Extension can call bridge APIs and receive responses

---

## Phase 5: MCP Server Implementation
**Duration:** ~6-7 hours | **Prerequisites:** Phase 1, 4 | **Blocks:** Phase 6

This is the **AI interface** - where everything becomes useful to Claude/Cursor/Copilot.

### Tasks:
1. **Setup MCP server package**
   - Separate entry point (src/mcp/mcp-server.ts)
   - STDIO transport configuration
   - Proper process lifecycle (SIGINT, SIGTERM handling)

2. **Implement tool registration system**
   - Tool schema definitions with Zod
   - Input validation and sanitization
   - Structured output format (type-safe responses)

3. **Group 1: Visual Perception Tools**
   - screenshot: capture via bridge or CDP fallback
   - get_accessibility_tree: semantic page structure
   - get_page_structure: DOM tree with source locations

4. **Group 2: Element Inspection Tools**
   - inspect_element: full element details + source location
   - find_elements: search and locate elements
   - get_element_source: direct source mapping lookup

5. **Group 3: Interaction Tools**
   - click: simulate user click
   - type_text: fill form inputs
   - navigate: change URL
   - scroll: programmatic scrolling

6. **Group 4: Debugging Tools**
   - get_console_logs: retrieve captured logs
   - evaluate_js: execute arbitrary JavaScript
   - get_hmr_status: dev server connection state

7. **Implement VS Code MCP provider**
   - registerMcpServerDefinitionProvider in extension
   - Auto-discovery by Claude Code/Copilot
   - Environment variable passing (workspace path)

**Critical Thinking:** Tool design is crucial for AI ergonomics. Each tool must have:
- Clear, unambiguous description (LLMs read these)
- Typed inputs with validation (prevent garbage in)
- Structured outputs (JSON, not free-form text)
- Idempotency where possible (safe to retry)

The accessibility tree tool is particularly important - it gives AI semantic understanding without massive screenshot tokens.

**Challenges:**
- MCP transport reliability (STDIO can be finicky with buffering)
- Tool timeout handling (what if screenshot takes 10 seconds?)
- Error propagation (bridge error → MCP error → AI sees it)

**Deliverables:**
- MCP server starts and connects via STDIO
- All 15+ tools are registered and callable
- Claude Code can discover and use VisionCraft tools

---

## Phase 6: HMR Integration & Error Capture
**Duration:** ~3-4 hours | **Prerequisites:** Phase 2, 5 | **Blocks:** None

### Tasks:
1. **Extend Vite plugin with HMR hooks**
   - configureServer: inject WebSocket listeners
   - handleHotUpdate: capture update events
   - Broadcast vc:hmr-update custom events

2. **Implement HMR status tracking in bridge**
   - Listen for vite:beforeUpdate, vite:afterUpdate
   - Track connection state (connected, disconnected, error)
   - Measure update latency (compile time)

3. **Capture error overlay content**
   - Intercept vite:error events
   - Extract stack traces and source locations
   - Format for AI consumption (file:line:column)

4. **Implement get_hmr_status MCP tool**
   - Return connection state, last update time
   - Include any pending errors from overlay
   - Provide recommendations (e.g., "restart dev server")

5. **Build error recovery strategies**
   - Auto-reconnect on WebSocket disconnect
   - Suggest page reload if HMR fails
   - Detect infinite error loops (AI keeps breaking same thing)

**Critical Thinking:** HMR is what makes the feedback loop sub-second. Without it, every AI edit would require a full page reload (3-5 seconds). The error overlay capture is crucial - it lets the AI see its mistakes immediately and self-correct.

**Challenges:**
- Different dev servers have different HMR APIs (Vite vs Webpack vs Next.js)
- Some errors don't show in overlay (silent failures)
- State preservation failure (need to detect and warn AI)

**Deliverables:**
- Code changes appear in preview within 50-200ms
- Compilation errors are visible via get_hmr_status
- AI can read error messages and fix code

---

## Phase 7: CDP Fallback Implementation
**Duration:** ~3-4 hours | **Prerequisites:** Phase 4 | **Blocks:** None
**Priority:** Low (can defer to later)

### Tasks:
1. **Implement CDPBridge class**
   - Launch headless Chromium via Playwright
   - Connect to debugging port (9222)
   - Page management (navigate, wait for load)

2. **Implement CDP-specific features**
   - Network interception (for advanced use cases)
   - Performance tracing
   - Cookie/localStorage manipulation

3. **Build fallback strategy**
   - Try bridge script first
   - Fall back to CDP if bridge unavailable
   - Cache which mode is active (avoid repeated failures)

**Critical Thinking:** CDP is heavyweight (200-500MB RAM) and adds complexity. Only implement if users need network-level features or external URL preview. For Phase 1, bridge script is sufficient for 90% of use cases.

**Deliverables:**
- CDP mode can be manually activated
- Screenshots work in CDP mode
- Memory usage remains acceptable (<500MB total)

---

## Phase 8: Testing & Quality Assurance
**Duration:** ~4-5 hours | **Prerequisites:** Phases 1-6 | **Blocks:** Phase 9

### Tasks:
1. **Unit tests** (Vitest)
   - Test source mapping plugins (Babel, Vite)
   - Test bridge script APIs (mock DOM)
   - Test MCP tool handlers (mock bridge)

2. **Integration tests**
   - Create sample React/Vue/Svelte apps
   - Run through full workflow: edit → HMR → inspect → verify
   - Test all 15 MCP tools end-to-end

3. **Extension tests**
   - VS Code extension test framework
   - Test webview creation/disposal
   - Test command registration and execution

4. **Manual testing checklist**
   - Test with real AI agent (Claude Code)
   - Verify performance (<1 second feedback loop)
   - Check memory usage (<100MB for extension + preview)
   - Test across different dev servers (Vite, Next.js, CRA)

**Critical Thinking:** Testing is essential because this is a developer tool - bugs are 10x more frustrating. Focus on integration tests over unit tests (we need to verify the whole system works, not just pieces).

**Deliverables:**
- 80%+ code coverage for critical paths
- All integration tests pass
- No memory leaks after 100 edit cycles

---

## Phase 9: Documentation & Packaging
**Duration:** ~3-4 hours | **Prerequisites:** Phase 8 | **Blocks:** None

### Tasks:
1. **Write comprehensive README.md**
   - Installation instructions
   - Quick start guide (5 minutes to working preview)
   - Framework-specific setup (React, Vue, Next.js)
   - MCP tool reference
   - Troubleshooting guide

2. **API documentation**
   - JSDoc comments for all public APIs
   - Generate TypeDoc documentation
   - MCP tool schema documentation

3. **Example projects**
   - Create example-react, example-vue, example-nextjs repos
   - Each with VisionCraft pre-configured
   - README with step-by-step tutorial

4. **Package extension**
   - Run `vsce package` to create .vsix
   - Test installation from .vsix
   - Prepare for VS Code Marketplace

5. **Create demo video**
   - 2-3 minute screencast showing AI building UI
   - Highlight key features (source mapping, instant feedback)
   - Upload to README

**Deliverables:**
- Professional README with badges, screenshots
- Working example projects
- Installable .vsix file
- Public GitHub release

---

## Phase 10: Polish & Optimization (Optional)
**Duration:** ~2-3 hours | **Prerequisites:** Phase 9

### Tasks:
1. **Performance optimization**
   - Lazy load Playwright (only when CDP needed)
   - Debounce screenshot requests
   - Implement screenshot caching

2. **UX improvements**
   - Add loading indicators
   - Better error messages
   - "Getting Started" walkthrough on first run

3. **Advanced features**
   - Multi-viewport preview (mobile, tablet, desktop)
   - Comparison mode (before/after screenshots)
   - Element highlighting (outline in preview when inspected)

**Deliverables:**
- Noticeably faster operations
- Improved user experience
- Advanced features working

---

## Critical Dependencies Graph

```
Phase 0 (Setup)
    ├──> Phase 1 (Extension Core)
    │       ├──> Phase 2 (Preview)
    │       │       └──> Phase 4 (Bridge & Automation)
    │       │               └──> Phase 5 (MCP Server)
    │       │                       └──> Phase 6 (HMR)
    │       └──> Phase 5 (MCP Server)
    └──> Phase 3 (Source Mapping)
            └──> Phase 4 (Bridge & Automation)

Phase 7 (CDP) can be done independently after Phase 4
Phase 8 (Testing) requires all core phases (1-6)
Phase 9 (Docs) requires Phase 8
Phase 10 (Polish) is optional
```

---

## Technology Stack Summary

**Core Extension:**
- TypeScript 5.7+
- VS Code Extension API 1.96+
- esbuild (bundling)
- pnpm (package management)

**MCP Integration:**
- @modelcontextprotocol/sdk (June 2025 spec)
- STDIO transport
- Zod (schema validation)

**Source Mapping:**
- @babel/core + @babel/types (Babel plugin)
- Vite Plugin API
- MagicString (efficient string manipulation)
- (Optional) Rust + swc_plugin for SWC

**Browser Automation:**
- Custom bridge script (vanilla JS)
- html2canvas (screenshots)
- Playwright-core (CDP fallback)

**Testing:**
- Vitest (unit tests)
- @vscode/test-electron (extension tests)

---

## Risk Assessment & Mitigation

**High Risk:**
1. **Source mapping breaks with JSX edge cases**
   - Mitigation: Extensive test suite with real-world components
   - Fallback: Allow manual source annotation

2. **Bridge script conflicts with user's app**
   - Mitigation: Unique namespace (window.__VISIONCRAFT__)
   - Error boundaries to prevent crashes

3. **HMR inconsistency across dev servers**
   - Mitigation: Test with Vite, Webpack, Next.js dev servers
   - Document known limitations

**Medium Risk:**
1. **Performance degradation with large DOMs**
   - Mitigation: Implement maxDepth limits, pagination
   - Warn if page structure exceeds thresholds

2. **CSP blocks bridge script**
   - Mitigation: Document required CSP directives
   - Provide auto-detect and fix suggestions

**Low Risk:**
1. **MCP transport issues**
   - Mitigation: Robust error handling, reconnection logic
   - Fallback: Manual tool invocation via VS Code commands

---

## Success Metrics

**Phase 1 Success:** Extension loads, commands work
**Phase 2 Success:** Preview renders dev server content
**Phase 3 Success:** Rendered HTML has data-vc-* attributes
**Phase 4 Success:** Bridge APIs return correct data
**Phase 5 Success:** AI agent can use all MCP tools
**Phase 6 Success:** Feedback loop consistently <1 second
**Overall Success:** AI agent can build a UI component from description to working code with <5 iterations

---

## Estimated Total Time: 35-45 hours

**Critical Path:** Phases 0 → 1 → 2 → 3 → 4 → 5 → 6 → 8 → 9 = ~30-35 hours
**Optional:** Phase 7 (CDP) + Phase 10 (Polish) = +5-7 hours
