# @visioncraft/vite-plugin

Vite plugin for VisionCraft source mapping and HMR integration. Works with React, Vue, Svelte, and any framework supported by Vite.

## Installation

```bash
npm install --save-dev @visioncraft/vite-plugin
# or
pnpm add -D @visioncraft/vite-plugin
```

## Usage

### Basic Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    visionCraft({
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
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    visionCraft(),
  ],
});
```

### Svelte

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import visionCraft from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    svelte(),
    visionCraft(),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `root` | `string` | `process.cwd()` | Root directory for relative path calculation |
| `enabled` | `boolean` | `true` in dev | Enable/disable source mapping |
| `attributePrefix` | `string` | `'data-vc'` | Custom attribute prefix |
| `enableHMR` | `boolean` | `true` | Enable HMR status broadcasting |
| `include` | `RegExp` | `/\.(jsx\|tsx\|vue\|svelte)$/` | File extensions to process |
| `exclude` | `RegExp` | `/node_modules/` | File paths to exclude |

## Advanced Usage

### Development Only

```ts
export default defineConfig({
  plugins: [
    react(),
    visionCraft({
      enabled: process.env.NODE_ENV === 'development',
    }),
  ],
});
```

### HMR Only (No Source Mapping)

If you only want HMR integration without source mapping:

```ts
import { visionCraftHMRPlugin } from '@visioncraft/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    visionCraftHMRPlugin(),
  ],
});
```

### Custom File Extensions

```ts
visionCraft({
  include: /\.(jsx|tsx|vue|svelte|astro)$/,
})
```

## Features

### Source Mapping

Injects `data-vc-source`, `data-vc-line`, `data-vc-col` attributes:

```jsx
// src/App.tsx
<div className="container">
  <h1>Hello</h1>
</div>
```

Becomes:

```jsx
<div data-vc-source="src/App.tsx" data-vc-line="10" data-vc-col="2" className="container">
  <h1 data-vc-source="src/App.tsx" data-vc-line="11" data-vc-col="4">Hello</h1>
</div>
```

### HMR Integration

Broadcasts custom HMR events to VisionCraft:

- `vc:connected` - When client connects
- `vc:hmr-update` - When files are updated

These events are used by VisionCraft to show real-time status in the preview.

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
1. **Virtual module:** Bridge loaded as `/@visioncraft/bridge` (not bundled file)
2. **resolveId hook:** Maps `@visioncraft/bridge` → `\0@visioncraft/bridge.ts`
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
3. Open browser console for `vc:` events
4. Check VisionCraft extension output panel

### Performance Issues

1. Limit to development: `enabled: process.env.NODE_ENV === 'development'`
2. Narrow `include` pattern: `include: /\.tsx$/`
3. Expand `exclude` pattern: `exclude: /node_modules|\.spec\./`

## License

MIT
