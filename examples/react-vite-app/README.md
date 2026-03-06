# AI Eye React + Vite Example

This example demonstrates AI Eye's source mapping capabilities with a React + Vite application.

## What's Inside

- ⚛️ React 18 with TypeScript
- ⚡ Vite for fast development
- 🎨 AI Eye source mapping plugin
- 🔥 Hot Module Replacement (HMR)

## Quick Start

### 1. Install Dependencies

```bash
npx pnpm install
```

### 2. Start Dev Server

```bash
cd examples/react-vite-app
npx pnpm dev
```

Server will start at `http://localhost:5173`

### 3. Open AI Eye Preview

In VS Code:
1. Press `F5` (Extension Development Host)
2. Run: **AI Eye: Open Live Preview**
3. You should see the React app in the preview!

## Verify Source Mapping

### Method 1: Browser DevTools

1. Open the app in your browser: `http://localhost:5173`
2. Right-click any element → **Inspect**
3. Look for these attributes in the HTML:
   ```html
   data-ae-source="src/App.tsx"
   data-ae-line="42"
   data-ae-col="6"
   ```

### Method 2: AI Eye Preview

1. Open preview in VS Code
2. In the preview, right-click element → **Inspect Element**
3. Check the Elements panel for `data-ae-*` attributes

### Method 3: Console Verification

Open browser console and run:

```javascript
// Find all elements with source mapping
const mapped = document.querySelectorAll('[data-ae-source]');
console.log(`Found ${mapped.length} source-mapped elements`);

// Show first element's source location
const first = mapped[0];
console.log({
  element: first.tagName,
  source: first.getAttribute('data-ae-source'),
  line: first.getAttribute('data-ae-line'),
  col: first.getAttribute('data-ae-col'),
});
```

## Test Features

### Counter Demo
- Click buttons → Verify source attributes on buttons
- Check counter display → Verify source on `<span>`

### Input Demo
- Type text → Verify source on `<input>`
- See message → Verify source on conditional `<div>`

### All Elements
- Every `<div>`, `<button>`, `<input>`, etc. should have:
  - `data-ae-source="src/App.tsx"`
  - `data-ae-line="XX"`
  - `data-ae-col="XX"`

## How It Works

### 1. Vite Config (`vite.config.ts`)

```ts
import aiEye from '@ai-eye/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    aiEye({
      root: __dirname,
      enabled: true,
    }),
  ],
});
```

### 2. Plugin Transforms JSX

**Before:**
```jsx
<button onClick={() => setCount(count + 1)}>
  Increment
</button>
```

**After:**
```jsx
<button
  data-ae-source="src/App.tsx"
  data-ae-line="28"
  data-ae-col="12"
  onClick={() => setCount(count + 1)}
>
  Increment
</button>
```

### 3. HMR Integration

When you edit `src/App.tsx`:
1. Vite detects file change
2. AI Eye plugin broadcasts `ae:hmr-update` event
3. React Fast Refresh updates the component
4. Source attributes are preserved
5. Preview updates in <200ms!

## Troubleshooting

### No `data-ae-*` Attributes

**Check 1: Plugin is enabled**
```ts
// vite.config.ts
aiEye({ enabled: true })
```

**Check 2: Dev server is running**
```bash
npx pnpm dev
# Should see: ✨ AI Eye: Source mapping enabled
```

**Check 3: File is processed**
- Only `.jsx` and `.tsx` files are processed
- `node_modules` is excluded

**Check 4: View source**
- Right-click → View Page Source
- Search for `data-ae-source`
- Should appear in HTML

### HMR Not Working

**Check 1: Vite HMR connection**
- Open browser console
- Look for `[vite] connected`
- If missing, check firewall/ports

**Check 2: AI Eye events**
- Console should show custom `ae:*` events
- Edit a file and watch for `ae:hmr-update`

**Check 3: React Fast Refresh**
- Edit a component
- Should update without full reload
- State should be preserved

### Performance Issues

Source mapping adds ~100 bytes per element to HTML size.

**Optimization:**
```ts
aiEye({
  enabled: process.env.NODE_ENV === 'development',
})
```

This disables source mapping in production builds.

## Next Steps

### Try Phase 4: Bridge Script

Once Phase 4 is implemented, you'll be able to:
- Click element in preview → See source file in VS Code
- Inspect element → Get full computed styles
- Query elements by text/role
- Capture console logs

### Try Phase 5: MCP Server

Once Phase 5 is implemented, AI agents can:
- Ask: "What's the source of the button?"
- Get response: `src/App.tsx:28:12`
- Edit the file directly
- See changes in <1 second

## File Structure

```
react-vite-app/
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── vite.config.ts       # Vite + AI Eye config
├── tsconfig.json        # TypeScript config
└── src/
    ├── main.tsx         # React entry point
    ├── App.tsx          # Main app component
    ├── App.css          # Styles
    └── index.css        # Global styles
```

## Learn More

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [AI Eye Architecture](../../AIEye_Architecture.docx)
- [Implementation Plan](../../plan.md)
