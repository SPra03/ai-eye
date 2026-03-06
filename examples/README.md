# VisionCraft Examples

Example projects demonstrating VisionCraft integration with different frameworks and setups.

---

## Available Examples

### 1. React + Vite App

**Location:** `examples/react-vite-app/`

A complete React application with VisionCraft integration, demonstrating:

- Full source mapping for React components
- Hot Module Replacement (HMR) tracking
- TypeScript support
- Best practices for VisionCraft configuration

**Features:**
- React 18 with TypeScript
- Vite 5 build tool
- VisionCraft Vite plugin integration
- Source mapping for all JSX elements
- HMR status tracking
- Console log integration

**Use this example when:**
- Building a new React application
- Learning VisionCraft with React
- Testing AI agent interactions with React components
- Understanding source mapping in JSX

### 2. Test Preview

**Location:** `examples/test-preview/`

A simple HTML test page for verifying VisionCraft's live preview functionality.

**Features:**
- Plain HTML/JavaScript (no framework)
- Interactive test elements
- Console logging examples
- Port auto-detection

**Use this example when:**
- Testing VisionCraft installation
- Debugging preview panel issues
- Understanding basic VisionCraft functionality
- Quick verification without framework complexity

---

## Quick Start

### React + Vite App

```bash
# Navigate to example
cd examples/react-vite-app

# Install dependencies
npm install

# Start dev server
npm run dev
# Server running at http://localhost:5175
```

In VS Code:
1. Press `F5` to launch Extension Development Host
2. Run command: **VisionCraft: Open Live Preview**
3. Navigate to `http://localhost:5175`
4. Click elements to jump to source code!

**What to try:**
- Click the counter button → see `src/App.tsx:15`
- Inspect component hierarchy
- Make code changes → see HMR updates
- Ask AI agent to modify components

### Test Preview

```bash
# Navigate to example
cd examples/test-preview

# Start test server
node server.js
# Server running at http://localhost:5173 (or next available port)
```

In VS Code:
1. Press `F5` to launch Extension Development Host
2. Run command: **VisionCraft: Open Live Preview**
3. Test page appears in preview panel

**What to try:**
- Click "Click Me!" button → counter increments
- Click "Change Color" button → background changes
- Type in input → see console logs
- Test navigation controls

---

## Example Comparison

| Feature | React + Vite App | Test Preview |
|---------|-----------------|--------------|
| **Framework** | React 18 | Plain HTML/JS |
| **Build Tool** | Vite 5 | Simple Node server |
| **Source Mapping** | ✅ Full JSX mapping | ❌ No mapping |
| **HMR** | ✅ Tracked | ❌ N/A |
| **TypeScript** | ✅ Yes | ❌ No |
| **Complexity** | Moderate | Simple |
| **Best For** | Production learning | Quick testing |

---

## Creating Your Own Example

### Step 1: Create Project

```bash
# Using React
npm create vite@latest my-app -- --template react-ts

# Or Vue
npm create vite@latest my-app -- --template vue-ts

# Or Svelte
npm create vite@latest my-app -- --template svelte-ts
```

### Step 2: Install VisionCraft

```bash
cd my-app
npm install @visioncraft/vite-plugin --save-dev
```

### Step 3: Configure Vite

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // or vue/svelte
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(), // or vue() / svelte()
    visionCraft({
      enabled: true,
      enableHMR: true,
    }),
  ],
});
```

### Step 4: Start Development

```bash
npm run dev
```

### Step 5: Use VisionCraft

In VS Code:
- Open live preview
- Click elements to navigate to source
- Let AI agents interact with your UI

---

## Framework-Specific Setup

### React

```typescript
// vite.config.ts
import react from '@vitejs/plugin-react';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    visionCraft({
      enabled: true,
      include: /\.(jsx|tsx)$/,
    }),
  ],
});
```

**Key points:**
- Works with React 16.8+
- Supports both `.jsx` and `.tsx`
- Source mapping for all JSX elements
- Compatible with React Fast Refresh

### Vue

```typescript
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    visionCraft({
      enabled: true,
      include: /\.vue$/,
    }),
  ],
});
```

**Key points:**
- Works with Vue 3
- Source mapping in `<template>` sections
- Compatible with Vue HMR

### Svelte

```typescript
// vite.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    svelte(),
    visionCraft({
      enabled: true,
      include: /\.svelte$/,
    }),
  ],
});
```

**Key points:**
- Works with Svelte 3+
- Source mapping for all HTML elements
- Compatible with Svelte HMR

---

## Testing with AI Agents

### Basic AI Interaction Test

1. **Start the React example:**
   ```bash
   cd examples/react-vite-app
   npm run dev
   ```

2. **Open in VS Code with AI agent** (e.g., Claude Code)

3. **Ask the AI:**
   > "Can you take a screenshot of the app and tell me what components are visible?"

4. **AI will:**
   - Take screenshot using `visioncraft_screenshot`
   - Analyze the UI
   - Use `visioncraft_get_structure` to see component tree
   - Respond with component hierarchy and source locations

### Component Modification Test

1. **Ask the AI:**
   > "The counter button looks too plain. Can you make it more styled?"

2. **AI will:**
   - Take screenshot to see current state
   - Use `visioncraft_find_elements` to find the button
   - Use `visioncraft_get_source` to locate `src/App.tsx:15`
   - Read the source file
   - Suggest or apply style improvements
   - Take screenshot to verify changes

### Error Debugging Test

1. **Introduce a bug** in the React example

2. **Ask the AI:**
   > "The app isn't working. Can you debug it?"

3. **AI will:**
   - Take screenshot to see error state
   - Use `visioncraft_get_console_logs` to read errors
   - Identify the error location
   - Fix the bug
   - Verify with console logs

---

## Common Patterns

### Pattern 1: Visual-First Development

**Human workflow:**
```
1. Open live preview
2. See bug visually
3. Click element → jump to code
4. Fix code → see update instantly
```

**AI workflow:**
```
1. AI takes screenshot
2. AI inspects problematic element
3. AI gets source location
4. AI fixes code
5. AI verifies with new screenshot
```

### Pattern 2: Component Exploration

**Human workflow:**
```
1. Open preview of unfamiliar codebase
2. Click around to explore
3. Navigate to components
4. Understand structure
```

**AI workflow:**
```
1. AI gets page structure
2. AI identifies key components
3. AI reads relevant source files
4. AI explains architecture
```

### Pattern 3: Layout Debugging

**Human workflow:**
```
1. See misaligned element
2. Click element
3. Check source file
4. Adjust styles
5. Verify in preview
```

**AI workflow:**
```
1. AI takes screenshot
2. AI inspects layout elements
3. AI analyzes CSS/styles
4. AI suggests fixes
5. AI applies changes
6. AI verifies with screenshot
```

---

## Configuration Examples

### Minimal Configuration

```typescript
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [visionCraft()],
});
```

Good for: Quick testing, default behavior

### Full Configuration

```typescript
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    visionCraft({
      enabled: true,
      include: /\.(jsx|tsx|vue|svelte)$/,
      exclude: /node_modules/,
      root: __dirname,
      enableHMR: true,
      attributePrefix: 'data-vc',
    }),
  ],
});
```

Good for: Production apps, custom setups

### Conditional Configuration

```typescript
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig(({ mode }) => ({
  plugins: [
    visionCraft({
      enabled: mode === 'development', // Only in dev
    }),
  ],
}));
```

Good for: Disabling in production builds

---

## Troubleshooting Examples

### Example Won't Start

**Check:**
```bash
# Verify Node version (18+)
node --version

# Install dependencies
npm install

# Check for port conflicts
lsof -ti :5173
```

### Source Mapping Not Working

**Check `vite.config.ts`:**
```typescript
// ✅ Correct
visionCraft({
  enabled: true,
})

// ❌ Wrong
visionCraft({
  enabled: false, // Disabled!
})
```

**Restart dev server:**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Preview Panel Empty

**Check dev server is running:**
```bash
curl http://localhost:5173
# Should return HTML
```

**Check URL in preview:**
- Make sure URL matches dev server port
- Try manual navigation in preview URL bar

### HMR Not Working

**Check Vite config:**
```typescript
export default defineConfig({
  server: {
    hmr: true, // Ensure enabled
  },
  plugins: [
    visionCraft({
      enableHMR: true, // Track HMR
    }),
  ],
});
```

---

## For AI Agents

### Example Selection Guide

**Ask the user which example to use:**

- **User has React app** → Use `react-vite-app` example
- **User wants quick test** → Use `test-preview` example
- **User has Vue/Svelte** → Show framework-specific setup

**Example startup for AI:**

```
User: "Help me test VisionCraft"

AI: "Let me start the React example for you..."
AI: [Runs: cd examples/react-vite-app && npm install && npm run dev]
AI: [Uses: visioncraft_navigate to http://localhost:5175]
AI: [Uses: visioncraft_screenshot to show the UI]
AI: "Here's the example app running! Would you like me to demonstrate
     any specific features like element inspection or component modification?"
```

### Testing AI Capabilities

AI agents can test themselves using examples:

1. **Start example:**
   ```bash
   cd examples/react-vite-app
   npm run dev
   ```

2. **Navigate:**
   ```
   visioncraft_navigate: http://localhost:5175
   ```

3. **Verify tools work:**
   - Take screenshot ✅
   - Inspect button element ✅
   - Get source location ✅
   - Click button ✅
   - Verify console logs ✅

4. **Test modification:**
   - Identify component to change
   - Read source file
   - Make changes
   - Verify with screenshot

### AI Workflow Example

**User:** "Use the React example to show me what VisionCraft can do"

**AI Response:**
```
1. Starting the React example...
   [cd examples/react-vite-app && npm run dev]

2. Opening in VisionCraft...
   [visioncraft_navigate: http://localhost:5175]

3. Taking screenshot of current state...
   [visioncraft_screenshot]

   I can see:
   - A counter button (currently at 0)
   - VisionCraft logo
   - Interactive elements

4. Let me inspect the counter button...
   [visioncraft_inspect_element: button]

   Found at: src/App.tsx:15

5. I can:
   - Click elements to test interactions
   - Modify the styling or behavior
   - Debug any issues
   - Explain the component structure

What would you like me to help you with?
```

---

## Contributing Examples

Want to add an example? We'd love to see:

- **Different frameworks** (Angular, Solid, Qwik)
- **Real-world apps** (Todo list, Blog, Dashboard)
- **Integration patterns** (with testing libraries, state management)
- **Advanced use cases** (micro-frontends, monorepos)

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## Next Steps

After trying the examples:

1. **Integrate VisionCraft** into your own project
2. **Read the docs:**
   - [Getting Started](../docs/GETTING-STARTED.md)
   - [AI Usage Guide](../docs/AI-USAGE.md)
   - [API Reference](../docs/API.md)
3. **Configure your setup:**
   - [Vite Plugin Docs](../packages/vite-plugin/README.md)
   - [Extension Docs](../packages/extension/README.md)
4. **Join the community:**
   - Report issues on GitHub
   - Share your use cases
   - Contribute improvements

---

## Support

- **Documentation:** [docs/](../docs/)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
- **Issues:** [GitHub Issues](https://github.com/SPra03/ai-eye/issues)

---

**Happy coding with VisionCraft! 🚀**
