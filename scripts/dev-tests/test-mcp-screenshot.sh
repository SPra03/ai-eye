#!/bin/bash
# Quick test to verify MCP screenshot works and save to file

echo "Testing VisionCraft MCP screenshot..."

cd /Users/sourabhprakash/Desktop/git/vscode-eye/packages/mcp-server

# Create a test request for screenshot
cat << 'EOF' | node dist/index.js 2>&1 | grep -A 100 "base64" | head -5
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"visioncraft_screenshot","arguments":{"format":"png"}}}
EOF

echo ""
echo "If you see base64 data above, the screenshot worked!"
echo "The image was successfully captured but Claude Desktop doesn't show images inline."
