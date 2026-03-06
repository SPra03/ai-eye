#!/bin/bash

echo "🔧 AI Eye Extension Test"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the right directory!"
    echo "   Please run from: /Users/sourabhprakash/Desktop/git/vscode-eye"
    exit 1
fi

echo "✅ In correct directory"
echo ""

# Build the extension
echo "📦 Building extension..."
npx pnpm --filter ai-eye-extension build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check output files
if [ -f "packages/extension/dist/extension.js" ]; then
    SIZE=$(ls -lh packages/extension/dist/extension.js | awk '{print $5}')
    echo "✅ Extension bundle: $SIZE"
else
    echo "❌ Extension bundle not found!"
    exit 1
fi

echo ""
echo "🎉 Extension is ready to test!"
echo ""
echo "📋 Next steps:"
echo "   1. Make sure this folder is open in VS Code"
echo "   2. Press Cmd+Shift+D (Run and Debug panel)"
echo "   3. Select 'Run Extension' from dropdown"
echo "   4. Press F5 or click the green play button"
echo "   5. In the new window, run: AI Eye: Open Live Preview"
echo ""
echo "💡 Tip: If F5 doesn't work, see DEBUGGING.md"
echo ""
