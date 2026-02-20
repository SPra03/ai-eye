# Getting Started with VisionCraft

This guide will help you set up VisionCraft and integrate it with your AI workflow.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Claude Desktop Integration](#claude-desktop-integration)
- [First Steps](#first-steps)
- [Next Steps](#next-steps)

---

## Quick Start

```bash
# 1. Install packages
npm install --save-dev @visioncraft/vite-plugin @visioncraft/babel-plugin

# 2. Configure Vite
# vite.config.js
import visionCraftVitePlugin from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [visionCraftVitePlugin()]
});

# 3. Import bridge in your app
# main.tsx
import '@visioncraft/bridge';

# 4. Start your dev server
npm run dev

# 5. Configure Claude Desktop (see below)
```

---

## Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Framework**: React, Vue, or Svelte with Vite
- **Claude Desktop**: Latest version (for AI integration)

### Install Packages

#### For Vite Projects (Recommended)

```bash
npm install --save-dev @visioncraft/vite-plugin
```

#### For Non-Vite Projects (Babel)

```bash
npm install --save-dev @visioncraft/babel-plugin
```

#### For AI Integration

The MCP server is included in the monorepo. No separate installation needed.

---

## Basic Setup

### Option 1: Vite Plugin (Recommended)

#### 1. Install Plugin

```bash
npm install --save-dev @visioncraft/vite-plugin
```

#### 2. Configure Vite

```javascript
// vite.config.js or vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import visionCraftVitePlugin from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    visionCraftVitePlugin({
      enabled: true,          // Enable in development
      enableHMR: true,        // Track HMR status
      attributePrefix: 'data-vc'  // Attribute prefix
    })
  ]
});
```

#### 3. Import Bridge

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@visioncraft/bridge';  // ← Add this line

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 4. Start Dev Server

```bash
npm run dev
```

#### 5. Verify Bridge

Open browser console and run:

```javascript
console.log(window.__VISIONCRAFT__);
// Should show: { version: '1.0.0', ready: true, ... }
```

---

### Option 2: Babel Plugin

#### 1. Install Plugin

```bash
npm install --save-dev @visioncraft/babel-plugin
```

#### 2. Configure Babel

```javascript
// babel.config.js
module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    ['@visioncraft/babel-plugin', {
      enabled: process.env.NODE_ENV === 'development',
      root: __dirname,
      attributePrefix: 'data-vc'
    }]
  ]
};
```

#### 3. Include Bridge Script

Manually add the bridge script to your HTML:

```html
<!-- public/index.html -->
<script src="/path/to/visioncraft-bridge.js"></script>
```

Or bundle it with your app:

```javascript
// src/index.js
import '@visioncraft/bridge';
```

---

## Claude Desktop Integration

### 1. Build MCP Server

From the VisionCraft repository:

```bash
# Clone repository
git clone https://github.com/your-username/visioncraft.git
cd visioncraft

# Install dependencies
npx pnpm install

# Build all packages
npx pnpm build
```

### 2. Configure Claude Desktop

#### macOS/Linux

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "node",
      "args": [
        "/absolute/path/to/visioncraft/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "VISIONCRAFT_URL": "http://localhost:5173",
        "VISIONCRAFT_MODE": "playwright-launch"
      }
    }
  }
}
```

#### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "visioncraft": {
      "command": "node",
      "args": [
        "C:\\absolute\\path\\to\\visioncraft\\packages\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "VISIONCRAFT_URL": "http://localhost:5173",
        "VISIONCRAFT_MODE": "playwright-launch"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop to load the MCP server.

### 4. Verify Connection

In Claude Desktop, ask:

```
Can you take a screenshot of my app at localhost:5173?
```

Claude should respond with a screenshot using the `visioncraft_screenshot` tool.

---

## Connection Modes

VisionCraft supports three connection modes:

### Mode 1: Playwright Launch (Default)

**Best for**: First-time users, no configuration needed

```json
{
  "env": {
    "VISIONCRAFT_MODE": "playwright-launch",
    "VISIONCRAFT_URL": "http://localhost:5173"
  }
}
```

**Pros**:
- ✅ Zero configuration
- ✅ Works out of the box
- ✅ Automatic browser management

**Cons**:
- ❌ ~200MB RAM usage
- ❌ ~2-3s startup time
- ❌ New browser window every time

---

### Mode 2: CDP Connect (Optimized)

**Best for**: Active development, faster iteration

```json
{
  "env": {
    "VISIONCRAFT_MODE": "cdp-connect",
    "VISIONCRAFT_CDP_HOST": "localhost",
    "VISIONCRAFT_CDP_PORT": "9222",
    "VISIONCRAFT_URL": "http://localhost:5173"
  }
}
```

**Setup**:

1. Start Chrome with debugging:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:5173

# Linux
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:5173

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\chrome-debug ^
  http://localhost:5173
```

2. Restart Claude Desktop

**Pros**:
- ✅ ~10MB RAM usage (10x less!)
- ✅ <100ms startup (20x faster!)
- ✅ Use your existing browser session
- ✅ Keep DevTools open

**Cons**:
- ❌ Requires manual browser setup
- ❌ Must restart if Chrome closes

---

### Mode 3: Automatic Fallback (Recommended)

**Best for**: Production use, reliability

```json
{
  "env": {
    "VISIONCRAFT_MODE": "cdp-connect",
    "VISIONCRAFT_ENABLE_FALLBACK": "true",
    "VISIONCRAFT_URL": "http://localhost:5173"
  }
}
```

**How it works**:
1. Tries CDP Connect first (fast)
2. Falls back to Playwright Launch if CDP unavailable
3. Provides best of both worlds

---

## First Steps

### 1. Inspect an Element

Ask Claude:

```
Inspect the submit button on my app
```

Claude will use `visioncraft_inspect_element` to get:
- Element type and attributes
- Computed styles and bounding box
- **Source location** (file:line:col)

### 2. Find Element Source Code

Ask Claude:

```
Where is the login button defined in my source code?
```

Claude will use `visioncraft_get_source` to return:

```
src/components/LoginForm.tsx:42:8
```

### 3. Click an Element

Ask Claude:

```
Click the "Add to Cart" button
```

Claude will use `visioncraft_click` to interact with the element.

### 4. Check HMR Status

Ask Claude:

```
What's the HMR status? Any errors?
```

Claude will use `visioncraft_get_hmr_status` to show:
- Connection status
- Update count
- Average latency
- Recent errors

---

## Workflow Examples

### Debugging a Visual Bug

**User**:
```
The submit button looks misaligned. Can you inspect it and tell me where it's defined?
```

**Claude** (using VisionCraft):
1. `visioncraft_screenshot` - Takes screenshot
2. `visioncraft_inspect_element('#submit-btn')` - Gets styles
3. `visioncraft_get_source('#submit-btn')` - Gets source location

**Response**:
```
The submit button is defined in src/components/Form.tsx at line 85.
It has margin-left: 20px which might be causing the misalignment.
Would you like me to suggest a fix?
```

---

### Finding All Buttons

**User**:
```
Find all buttons on the page and show me their source locations
```

**Claude**:
1. `visioncraft_find_elements('button', 'css')` - Finds all buttons

**Response**:
```
Found 5 buttons:
1. #submit-btn (src/Form.tsx:85:6)
2. .cancel-btn (src/Form.tsx:92:6)
3. #login-btn (src/Login.tsx:45:8)
4. .reset-btn (src/Settings.tsx:120:10)
5. .close-modal (src/Modal.tsx:30:4)
```

---

### Automated Testing

**User**:
```
Fill out the login form with username "test@example.com" and password "test123",
then click submit
```

**Claude**:
1. `visioncraft_type('#username', 'test@example.com')`
2. `visioncraft_type('#password', 'test123')`
3. `visioncraft_click('#submit-btn')`
4. `visioncraft_screenshot` - Verifies result

---

## Configuration Options

### Vite Plugin Options

```typescript
interface VisionCraftVitePluginOptions {
  // Enable/disable plugin
  enabled?: boolean;  // Default: true in dev, false in prod

  // Enable HMR tracking
  enableHMR?: boolean;  // Default: true

  // Attribute prefix
  attributePrefix?: string;  // Default: 'data-vc'

  // Project root
  root?: string;  // Default: vite config root

  // File patterns to process
  include?: RegExp | RegExp[];  // Default: /\.(jsx|tsx|vue|svelte)$/
  exclude?: RegExp | RegExp[];  // Default: /node_modules/
}
```

### Babel Plugin Options

```typescript
interface VisionCraftBabelPluginOptions {
  // Enable/disable plugin
  enabled?: boolean;  // Default: true

  // Project root
  root?: string;  // Default: process.cwd()

  // Attribute prefix
  attributePrefix?: string;  // Default: 'data-vc'
}
```

### MCP Server Environment Variables

```bash
# Target URL (required)
VISIONCRAFT_URL=http://localhost:5173

# Connection mode
VISIONCRAFT_MODE=playwright-launch  # or "cdp-connect" or "cdp-only"

# CDP settings (for cdp-connect mode)
VISIONCRAFT_CDP_HOST=localhost
VISIONCRAFT_CDP_PORT=9222

# Enable fallback
VISIONCRAFT_ENABLE_FALLBACK=true

# Timeout (milliseconds)
VISIONCRAFT_TIMEOUT=30000
```

---

## Troubleshooting

### Bridge Not Found

**Problem**: `window.__VISIONCRAFT__ is undefined`

**Solutions**:
1. Verify bridge import: `import '@visioncraft/bridge';`
2. Check Vite plugin is installed and configured
3. Restart dev server
4. Check browser console for errors

### MCP Server Not Connecting

**Problem**: Claude says "No VisionCraft tools available"

**Solutions**:
1. Verify `claude_desktop_config.json` path is absolute
2. Check MCP server is built: `npx pnpm build`
3. Restart Claude Desktop completely
4. Check logs: `View > Toggle Developer Tools > Console`

### CDP Connection Failed

**Problem**: "Failed to connect via cdp-connect"

**Solutions**:
1. Verify Chrome is running with `--remote-debugging-port=9222`
2. Check port 9222 is not in use: `lsof -i :9222`
3. Try absolute path to Chrome executable
4. Enable fallback mode in config

### Source Mapping Not Working

**Problem**: Elements show `sourceFile: null`

**Solutions**:
1. Verify Babel or Vite plugin is installed
2. Check plugin is enabled in config
3. Restart dev server after config changes
4. Check file is not in `node_modules`

---

## Next Steps

- **[API Reference](./API.md)** - Complete API documentation
- **[Configuration Guide](./CONFIGURATION.md)** - Advanced configuration options
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[Examples](../examples/)** - Sample projects and use cases

---

## Getting Help

- **GitHub Issues**: https://github.com/your-username/visioncraft/issues
- **Discussions**: https://github.com/your-username/visioncraft/discussions
- **Discord**: (Coming soon)

---

## Quick Reference

### Essential Commands

```bash
# Install Vite plugin
npm install --save-dev @visioncraft/vite-plugin

# Build MCP server
cd visioncraft && npx pnpm build

# Start dev server with debugging
VISIONCRAFT_MODE=cdp-connect npm run dev

# Run tests
npx vitest
```

### Essential Files

- `vite.config.js` - Vite configuration
- `babel.config.js` - Babel configuration
- `claude_desktop_config.json` - MCP server configuration
- `package.json` - Dependencies

### Essential Tools (from Claude)

- `visioncraft_screenshot` - Visual feedback
- `visioncraft_inspect_element` - Element details
- `visioncraft_get_source` - Source location
- `visioncraft_click` - Interaction
- `visioncraft_get_hmr_status` - Development status

---

**Ready to build?** Start with the [examples](../examples/react-vite-app) or dive into the [API Reference](./API.md).
