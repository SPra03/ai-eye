#!/usr/bin/env bash

# AI Eye Publishing Script
# Publishes all packages to NPM

set -e  # Exit on error

echo "🚀 AI Eye Publishing Script"
echo "================================"
echo ""

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Error: Must be on main branch to publish"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Working directory is not clean"
  echo "Please commit or stash your changes"
  git status --short
  exit 1
fi

# Check if user is logged in to NPM
if ! npm whoami > /dev/null 2>&1; then
  echo "❌ Error: Not logged in to NPM"
  echo "Run: npm login"
  exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# Run tests
echo "🧪 Running tests..."
npx vitest run
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi
echo "✅ Tests passed"
echo ""

# Build all packages
echo "🔨 Building all packages..."
npx pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build complete"
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Publishing version: $VERSION"
echo ""

# Confirm with user
read -p "Publish version $VERSION to NPM? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

# Publish packages
echo ""
echo "📤 Publishing packages..."
echo ""

# Publish Babel plugin
echo "Publishing @ai-eye/babel-plugin..."
cd packages/babel-plugin
npm publish --access public
cd ../..
echo "✅ @ai-eye/babel-plugin published"
echo ""

# Publish Vite plugin
echo "Publishing @ai-eye/vite-plugin..."
cd packages/vite-plugin
npm publish --access public
cd ../..
echo "✅ @ai-eye/vite-plugin published"
echo ""

# Publish MCP server
echo "Publishing aieye..."
cd packages/mcp-server
npm publish --access public
cd ../..
echo "✅ aieye published"
echo ""

# Create git tag
echo "🏷️  Creating git tag v$VERSION..."
git tag "v$VERSION"
git push origin "v$VERSION"
git push origin main
echo "✅ Tag created and pushed"
echo ""

echo "🎉 Publishing complete!"
echo ""
echo "Next steps:"
echo "1. Create GitHub release: https://github.com/SPra03/ai-eye/releases/new"
echo "2. Add release notes from CHANGELOG.md"
echo "3. Verify packages on NPM:"
echo "   - https://www.npmjs.com/package/@ai-eye/babel-plugin"
echo "   - https://www.npmjs.com/package/@ai-eye/vite-plugin"
echo "   - https://www.npmjs.com/package/aieye"
echo ""
