# @visioncraft/babel-plugin

Babel plugin for VisionCraft source mapping. Injects source location attributes into JSX elements at compile time.

## Installation

```bash
npm install --save-dev @visioncraft/babel-plugin
# or
pnpm add -D @visioncraft/babel-plugin
```

## Usage

### Babel Configuration

Add to your `.babelrc` or `babel.config.js`:

```json
{
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "root": "./src",
      "enabled": true
    }]
  ]
}
```

### Create React App

Install `react-app-rewired` and `customize-cra`:

```bash
npm install --save-dev react-app-rewired customize-cra
```

Create `config-overrides.js`:

```js
const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  addBabelPlugin(['@visioncraft/babel-plugin', {
    root: __dirname
  }])
);
```

Update `package.json`:

```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build"
  }
}
```

### Next.js with Babel

Create or update `.babelrc`:

```json
{
  "presets": ["next/babel"],
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "root": "."
    }]
  ]
}
```

Note: Using Babel will disable Next.js's SWC compiler. For production, consider the `@visioncraft/swc-plugin` instead.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `root` | `string` | `process.cwd()` | Root directory for relative path calculation |
| `enabled` | `boolean` | `true` | Enable/disable the plugin |
| `attributePrefix` | `string` | `'data-vc'` | Custom attribute prefix |

## What It Does

Transforms this:

```jsx
<div className="container">
  <h1>Hello World</h1>
</div>
```

Into this:

```jsx
<div className="container" data-vc-source="src/App.tsx" data-vc-line="10" data-vc-col="2">
  <h1 data-vc-source="src/App.tsx" data-vc-line="11" data-vc-col="4">Hello World</h1>
</div>
```

## Features

- ✅ Preserves existing attributes
- ✅ Skips React Fragments (`<>` and `<Fragment>`)
- ✅ Skips node_modules
- ✅ Inserts before spread attributes
- ✅ No duplicate injection
- ✅ Minimal bundle size impact (~100 bytes per element)

## Performance

- Build time: +5-10% (only in development)
- Runtime: Zero overhead
- Bundle size: ~100 bytes per element (gzips well)

## Recommendations

- **Development only:** Use `enabled: process.env.NODE_ENV === 'development'`
- **With Vite:** Use `@visioncraft/vite-plugin` instead (faster)
- **With Next.js:** Consider `@visioncraft/swc-plugin` for production

## License

MIT
