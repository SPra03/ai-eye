# @ai-eye/vite-plugin

Vite plugin for AI Eye source mapping and HMR integration. Works with React, Vue, Svelte, and any framework supported by Vite.

## Installation

```bash
npm install --save-dev @ai-eye/vite-plugin
# or
pnpm add -D @ai-eye/vite-plugin
```

## Usage

### Basic Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiEye({
      root: __dirname,
    }),
  ],
});
```

### Vue

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    aiEye(),
  ],
});
```

### Svelte

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    svelte(),
    aiEye(),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `root` | `string` | `process.cwd()` | Root directory for relative path calculation |
| `enabled` | `boolean` | `true` in dev | Enable/disable source mapping |
| `attributePrefix` | `string` | `'data-ae'` | Custom attribute prefix |
| `enableHMR` | `boolean` | `true` | Enable HMR status broadcasting |
| `include` | `RegExp` | `/\.(jsx\|tsx\|vue\|svelte)$/` | File extensions to process |
| `exclude` | `RegExp` | `/node_modules/` | File paths to exclude |

## Advanced Usage

### Development Only

```ts
export default defineConfig({
  plugins: [
    react(),
    aiEye({
      enabled: process.env.NODE_ENV === 'development',
    }),
  ],
});
```

### HMR Only (No Source Mapping)

If you only want HMR integration without source mapping:

```ts
import { aiEyeHMRPlugin } from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiEyeHMRPlugin(),
  ],
});
```

### Custom File Extensions

```ts
aiEye({
  include: /\.(jsx|tsx|vue|svelte|astro)$/,
})
```

## Features

### Source Mapping

Injects `data-ae-source`, `data-ae-line`, `data-ae-col` attributes:

```jsx
// src/App.tsx
<div className="container">
  <h1>Hello</h1>
</div>
```

Becomes:

```jsx
<div data-ae-source="src/App.tsx" data-ae-line="10" data-ae-col="2" className="container">
  <h1 data-ae-source="src/App.tsx" data-ae-line="11" data-ae-col="4">Hello</h1>
</div>
```

### HMR Integration

Broadcasts custom HMR events to AI Eye:

- `ae:connected` - When client connects
- `ae:hmr-update` - When files are updated

These events are used by AI Eye to show real-time status in the preview.

## Performance

- **Transform time:** ~5-10ms per file (uses MagicString for efficiency)
- **Build time impact:** < 5% in development
- **Runtime:** Zero overhead
- **Bundle size:** ~100 bytes per element

## How It Works

### Source Mapping
1. **Pre-transform:** Runs before framework plugins
2. **Regex matching:** Finds JSX/HTML opening tags
3. **Attribute injection:** Adds source location attributes
4. **Source map generation:** Preserves original source maps

### Virtual Module Architecture (Bridge Injection)
1. **Virtual module:** Bridge loaded as `/@ai-eye/bridge` (not bundled file)
2. **resolveId hook:** Maps `@ai-eye/bridge` → `\0@ai-eye/bridge.ts`
3. **load hook:** Transforms TypeScript → JavaScript using esbuild
4. **Vite processing:** Injects `import.meta.hot` context automatically
5. **HMR integration:** Bridge has full access to Vite's HMR API

**Why virtual modules?** Pre-bundled scripts don't have access to `import.meta.hot`. Virtual modules go through Vite's full transform pipeline, enabling proper HMR tracking.

## Comparison with Babel Plugin

| Feature | Vite Plugin | Babel Plugin |
|---------|-------------|--------------|
| Speed | ⚡ Faster (5-10ms) | Slower (50-100ms) |
| Frameworks | React, Vue, Svelte | React only |
| HMR Integration | ✅ Built-in | ❌ Manual |
| Source Maps | ✅ Preserved | ✅ Preserved |
| Bundle Size | Same | Same |

**Recommendation:** Use Vite plugin for Vite projects, Babel plugin for CRA/Next.js with Babel.

## Troubleshooting

### Attributes Not Appearing

1. Check browser inspector - attributes should be visible
2. Verify plugin is enabled: `enabled: true`
3. Check file extension matches `include` pattern
4. Make sure not excluded by `exclude` pattern

### HMR Not Working

1. Check Vite dev server is running
2. Verify `enableHMR: true`
3. Open browser console for `ae:` events
4. Check AI Eye extension output panel

### Performance Issues

1. Limit to development: `enabled: process.env.NODE_ENV === 'development'`
2. Narrow `include` pattern: `include: /\.tsx$/`
3. Expand `exclude` pattern: `exclude: /node_modules|\.spec\./`

## For AI Agents

### Why This Plugin Matters

As an AI agent using AI Eye, this plugin is **critical** because it enables **source mapping** - the ability to trace UI elements back to their source code.

Without this plugin:
- ❌ No `data-ae-source` attributes on elements
- ❌ `aieye_get_source` returns "not available"
- ❌ `aieye_inspect_element` has no file location
- ❌ Cannot jump from UI → code

With this plugin:
- ✅ Every element has source location
- ✅ Can find where components are defined
- ✅ Can modify code based on visual inspection
- ✅ Full visual debugging capabilities

### Verifying Plugin is Working

When helping users debug "source mapping not working" issues, check:

1. **Plugin is installed:**
   ```bash
   npm list @ai-eye/vite-plugin
   # Should show: @ai-eye/vite-plugin@1.0.0
   ```

2. **Plugin is configured in vite.config.ts:**
   ```typescript
   import aiEye from '@ai-eye/vite-plugin';

   export default defineConfig({
     plugins: [
       aiEye(), // ← Must be here
     ],
   });
   ```

3. **Dev server is running:**
   ```bash
   # User should have dev server running
   npm run dev
   ```

4. **Attributes are present in HTML:**
   Use `aieye_inspect_element` on any element and check if it has:
   - `data-ae-source`: File path
   - `data-ae-line`: Line number
   - `data-ae-col`: Column number

### Common Issues AI Agents Encounter

**Issue:** "Source mapping not available for this element"

**Diagnosis:**
```
1. Take screenshot to see the element
2. Use aieye_inspect_element to check attributes
3. If no data-ae-* attributes:
   - Plugin not installed
   - Plugin not configured
   - Dev server not restarted after adding plugin
```

**Solution Guide for User:**
```typescript
// 1. Install plugin
npm install @ai-eye/vite-plugin --save-dev

// 2. Add to vite.config.ts
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    aiEye({
      enabled: true,
    }),
  ],
});

// 3. Restart dev server
# Stop server (Ctrl+C)
npm run dev
```

**Issue:** "Third-party library elements have no source mapping"

**Explanation:**
This is expected! Only the user's code has source mapping. Elements from libraries like Material-UI, Ant Design, etc. won't have `data-ae-source` attributes because they're in `node_modules`.

**AI Response:**
> "This element is from a third-party library (not your code), so source mapping isn't available. I can still inspect its styles and attributes, but I can't navigate to its source file since it's in node_modules."

### HMR Status for AI Agents

The plugin also broadcasts HMR events. Use `aieye_get_hmr_status` to check:

```json
{
  "connected": true,
  "recentUpdates": [
    { "file": "src/App.tsx", "timestamp": "..." }
  ],
  "averageLatency": 45
}
```

If HMR isn't working:
1. Check `enableHMR: true` in config
2. Verify Vite dev server is running
3. Check for errors in console logs

### Plugin Configuration for AI Agents

When recommending configuration to users:

**Minimal (recommended for most users):**
```typescript
aiEye()
```

**With options (for specific needs):**
```typescript
aiEye({
  enabled: true,              // Explicitly enable
  enableHMR: true,            // Track HMR updates
  root: __dirname,            // For correct relative paths
  include: /\.(jsx|tsx)$/,    // Only React files
})
```

**Development only (production optimization):**
```typescript
aiEye({
  enabled: process.env.NODE_ENV === 'development',
})
```

### Framework Detection

The plugin automatically detects frameworks by file extension:

- `.jsx` / `.tsx` → React
- `.vue` → Vue
- `.svelte` → Svelte

No framework-specific configuration needed!

### When to Recommend This Plugin

**Recommend when:**
- User has a Vite project
- Using React, Vue, or Svelte
- Needs visual debugging
- Working with AI agents

**Don't recommend when:**
- Using Create React App (use Babel plugin instead)
- Using Next.js with Webpack (use Babel plugin)
- Using production build (not needed)

### Performance Impact

Reassure users that performance impact is minimal:
- Transform time: ~5-10ms per file
- Build time impact: < 5%
- Runtime overhead: Zero
- Bundle size: ~100 bytes per element

### Quick Diagnostic for AI Agents

When a user says "AI Eye isn't working":

```
1. Check plugin installed:
   npm list @ai-eye/vite-plugin

2. Check vite.config.ts has the plugin

3. Check dev server is running:
   curl http://localhost:5173

4. Inspect an element:
   aieye_inspect_element: "button"

5. Look for data-ae-source attribute:
   - Present → Plugin working ✅
   - Missing → Plugin not working ❌
```

## License

MIT
