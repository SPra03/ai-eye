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

## For AI Agents

### When to Recommend This Plugin

As an AI agent, recommend this plugin when users are NOT using Vite:

**Recommend Babel plugin for:**
- ✅ Create React App (CRA)
- ✅ Next.js with Babel
- ✅ Custom Webpack + Babel setup
- ✅ Any Babel-based React project

**Don't recommend for:**
- ❌ Vite projects → Use `@visioncraft/vite-plugin` instead (faster)
- ❌ Non-React frameworks (Vue, Svelte) → Use Vite plugin

### Quick Decision Tree

```
User has Vite project?
  ├─ Yes → Recommend @visioncraft/vite-plugin
  └─ No → User has React with Babel?
      ├─ Yes → Recommend @visioncraft/babel-plugin (this one)
      └─ No → Ask what build tool they're using
```

### Verifying Plugin is Working

When helping users debug "source mapping not working" issues:

1. **Check plugin is installed:**
   ```bash
   npm list @visioncraft/babel-plugin
   # Should show: @visioncraft/babel-plugin@1.0.0
   ```

2. **Check Babel configuration exists:**

   Look for `.babelrc`, `babel.config.js`, or `babel.config.json`:
   ```json
   {
     "plugins": [
       ["@visioncraft/babel-plugin", {
         "enabled": true
       }]
     ]
   }
   ```

3. **For CRA, check config-overrides.js exists:**
   ```javascript
   const { override, addBabelPlugin } = require('customize-cra');

   module.exports = override(
     addBabelPlugin('@visioncraft/babel-plugin')
   );
   ```

4. **Verify attributes in rendered HTML:**
   Use `visioncraft_inspect_element` and check for:
   - `data-vc-source`
   - `data-vc-line`
   - `data-vc-col`

### Common Setup Issues

**Issue:** "Source mapping not working in Create React App"

**Solution for User:**
```bash
# 1. Install required packages
npm install --save-dev @visioncraft/babel-plugin react-app-rewired customize-cra

# 2. Create config-overrides.js
cat > config-overrides.js << 'EOF'
const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  addBabelPlugin(['@visioncraft/babel-plugin', {
    root: __dirname,
    enabled: process.env.NODE_ENV === 'development'
  }])
);
EOF

# 3. Update package.json scripts
# Change "react-scripts start" to "react-app-rewired start"
# Change "react-scripts build" to "react-app-rewired build"

# 4. Restart dev server
npm start
```

**Issue:** "Next.js SWC is faster, why use Babel?"

**Explanation:**
Using Babel plugin in Next.js disables the faster SWC compiler. This is a trade-off:

- **Development:** Babel plugin is fine (source mapping is worth it)
- **Production:** Don't enable the plugin (no need for source mapping in prod)

**Recommended config:**
```json
{
  "presets": ["next/babel"],
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "enabled": process.env.NODE_ENV === "development"
    }]
  ]
}
```

This way, production builds use SWC (fast), development uses Babel + VisionCraft (source mapping).

**Issue:** "Wrong file paths in data-vc-source"

**Solution:**
Set the `root` option correctly:

```json
{
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "root": "/absolute/path/to/project"
    }]
  ]
}
```

Or use `__dirname` in JavaScript config:

```javascript
module.exports = {
  plugins: [
    ['@visioncraft/babel-plugin', {
      root: __dirname
    }]
  ]
};
```

### Babel vs Vite Plugin Comparison

When users ask "which plugin should I use?":

| Criterion | Vite Plugin | Babel Plugin |
|-----------|-------------|--------------|
| **Speed** | ⚡ Faster (5-10ms) | Slower (50-100ms) |
| **Frameworks** | React, Vue, Svelte | React only |
| **HMR Tracking** | ✅ Yes | ❌ No |
| **Build Tool** | Vite only | Any (Webpack, Parcel, etc.) |
| **Setup** | Simple | CRA needs rewiring |

**Bottom line:** If they have Vite, always recommend Vite plugin. Otherwise, use Babel plugin.

### Verification Checklist for AI Agents

When a user says "it's not working":

```
□ 1. Babel plugin installed?
     npm list @visioncraft/babel-plugin

□ 2. Babel config file exists?
     ls .babelrc babel.config.js babel.config.json

□ 3. Plugin added to config?
     grep -r "visioncraft" .babelrc babel.config.js

□ 4. For CRA: config-overrides.js exists?
     ls config-overrides.js

□ 5. For CRA: package.json uses react-app-rewired?
     grep "react-app-rewired" package.json

□ 6. Dev server restarted after config change?
     Ask user to restart

□ 7. Inspect element has attributes?
     visioncraft_inspect_element: "button"
     Look for data-vc-source
```

### Performance Notes for Users

When users worry about performance:

**Reassure them:**
- Build time: Only +5-10% in development
- Runtime: Zero overhead
- Bundle size: ~100 bytes per element (minifies well)
- **Disable in production:** Set `enabled: false` or use env check

**Recommended config:**
```json
{
  "plugins": [
    ["@visioncraft/babel-plugin", {
      "enabled": process.env.NODE_ENV === "development"
    }]
  ]
}
```

This way, production builds have no overhead at all.

### Framework Support

**Currently supports:**
- ✅ React (JSX/TSX)

**Not supported (use Vite plugin instead):**
- ❌ Vue
- ❌ Svelte
- ❌ Angular

React-only limitation is by design (Babel plugin is for React projects that don't use Vite).

### AI Agent Workflow Example

**User:** "I'm using Create React App and VisionCraft source mapping isn't working"

**AI Response:**
```
Let me help you set up the Babel plugin for CRA:

1. First, I'll check if you have the plugin installed:
   [runs: npm list @visioncraft/babel-plugin]

   Not installed. Installing required packages...
   [runs: npm install --save-dev @visioncraft/babel-plugin react-app-rewired customize-cra]

2. Creating config-overrides.js...
   [creates file with proper configuration]

3. Updating package.json scripts...
   [edits package.json to use react-app-rewired]

4. Restart your dev server:
   npm start

5. Once running, I'll verify it's working:
   [uses visioncraft_inspect_element to check for data-vc-source]

The setup is complete! Source mapping should now be working.
```

## License

MIT
