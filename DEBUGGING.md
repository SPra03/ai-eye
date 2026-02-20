# VisionCraft - Debugging Guide

## Running the Extension

### Method 1: Using F5 (Debug Mode)

1. **Open this folder in VS Code:**
   ```bash
   code /Users/sourabhprakash/Desktop/git/vscode-eye
   ```

2. **Make sure you're in the right workspace:**
   - Check the bottom left corner of VS Code
   - Should show the `vscode-eye` folder

3. **Open the Run and Debug panel:**
   - Click the Run icon in the sidebar (or press `Cmd+Shift+D`)
   - You should see "Run Extension" in the dropdown

4. **Start debugging:**
   - Press `F5` OR click the green play button
   - A new VS Code window will open (Extension Development Host)

### Method 2: Manual Launch (If F5 doesn't work)

1. **Build the extension:**
   ```bash
   npx pnpm --filter @visioncraft/extension build
   ```

2. **Open VS Code Command Palette:**
   - Press `Cmd+Shift+P`

3. **Run:**
   ```
   Developer: Install Extension from Location...
   ```

4. **Select:**
   ```
   /Users/sourabhprakash/Desktop/git/vscode-eye/packages/extension
   ```

5. **Reload VS Code** and the extension will be active!

### Method 3: Using vsce (Production Build)

```bash
# Install vsce if you don't have it
npm install -g @vscode/vsce

# Build extension package
cd packages/extension
vsce package

# Install the .vsix file
code --install-extension visioncraft-1.0.0.vsix
```

## Troubleshooting F5

### Check 1: Are you in the right folder?

```bash
pwd
# Should show: /Users/sourabhprakash/Desktop/git/vscode-eye
```

### Check 2: Is the extension built?

```bash
ls -la packages/extension/dist/
# Should see: extension.js and extension.js.map
```

If not, build it:
```bash
npx pnpm --filter @visioncraft/extension build
```

### Check 3: Can you see the Run and Debug panel?

- Press `Cmd+Shift+D`
- Look for "Run Extension" in the dropdown
- If you don't see it, the `.vscode/launch.json` might not be loaded

### Check 4: Try running the build task manually

- Press `Cmd+Shift+P`
- Type: "Tasks: Run Task"
- Select: "npm: build - packages/extension"
- Should see: "⚡ Done in Xms"

### Check 5: Check for errors in Output

- Press `Cmd+Shift+U` (Show Output panel)
- Select "Tasks" from the dropdown
- Look for any error messages

## Common Issues

### "Cannot find module 'vscode'"

This is normal during build - `vscode` is marked as external and provided by VS Code at runtime.

### "Extension host terminated unexpectedly"

The extension crashed. Check:
1. Output panel (Extension Host)
2. Debug Console
3. Look for error messages

### "Command not found"

The extension didn't register commands. Check:
1. `package.json` has correct `contributes.commands`
2. Extension activated successfully
3. Output panel for "VisionCraft extension activated"

## Testing the Extension

Once the Extension Development Host opens:

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Type:** `VisionCraft`
3. **You should see:**
   - VisionCraft: Open Live Preview
   - VisionCraft: Start MCP Server
   - VisionCraft: Reload Preview
   - VisionCraft: Toggle CDP Mode

4. **Run:** `VisionCraft: Open Live Preview`
5. **A preview panel should open!**

## Quick Test Script

Save this as `test-extension.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Building extension..."
npx pnpm --filter @visioncraft/extension build

echo "✅ Build complete!"
echo ""
echo "📦 Extension info:"
ls -lh packages/extension/dist/extension.js

echo ""
echo "🚀 Next steps:"
echo "  1. Press F5 in VS Code"
echo "  2. Or use Cmd+Shift+D → Run Extension"
echo "  3. In the new window, run: VisionCraft: Open Live Preview"
```

## Still Not Working?

Try the "Nuclear Option":

```bash
# Clean everything
npx pnpm clean
rm -rf node_modules packages/*/node_modules

# Reinstall
npx pnpm install

# Rebuild
npx pnpm build

# Try F5 again
```

## Getting Help

If F5 still doesn't work, share these details:

1. VS Code version: `code --version`
2. Node version: `node --version`
3. Current directory: `pwd`
4. Build output: `npx pnpm --filter @visioncraft/extension build`
5. Task output: Run "Tasks: Show Running Tasks"
