# VisionCraft Test Preview

A simple test page to verify VisionCraft's live preview functionality.

## Quick Start

1. Start the test server:
   ```bash
   node server.js
   # or
   npm start
   ```

   **Note:** If port 5173 is in use, the server will automatically try ports 5174, 5175, etc.

2. In VS Code:
   - Press `F5` to launch Extension Development Host
   - Run command: **VisionCraft: Open Live Preview**
   - If the server used a different port, update the URL in the preview
   - The test page should appear in the preview panel!

## Troubleshooting

### Port Already in Use

If you see `Error: listen EADDRINUSE`, don't worry! The server now automatically finds the next available port.

**Option 1: Let it auto-select a port**
```bash
node server.js
# Will use 5174, 5175, etc. if 5173 is taken
```

**Option 2: Check what's using the port**
```bash
./check-port.sh 5173
```

**Option 3: Kill the existing process**
```bash
# Find the process
lsof -ti :5173

# Kill it
kill -9 $(lsof -ti :5173)
```

**Option 4: Use a custom port**
```bash
PORT=8888 node server.js
```

## What to Test

### ✅ Basic Functionality
- [ ] Preview panel opens in VS Code
- [ ] Test page renders correctly
- [ ] Toolbar displays with URL bar
- [ ] Status indicator shows "Connected"

### ✅ Toolbar Controls
- [ ] Back/Forward buttons (test by navigating)
- [ ] Reload button refreshes the page
- [ ] URL bar shows current URL
- [ ] Enter new URL in URL bar and press Enter
- [ ] Inspect button (placeholder for Phase 4)

### ✅ Interactive Features
- [ ] Click "Click Me!" button - counter increments
- [ ] Click "Change Color" button - background changes
- [ ] Type in input field - check console logs
- [ ] Click "Test Message" button - checks postMessage

### ✅ Visual Status
- [ ] Green indicator = Connected
- [ ] Yellow indicator = Loading
- [ ] Red indicator = Error (test by stopping server)

### ✅ Error Handling
- [ ] Stop server and reload - error overlay appears
- [ ] Error message is user-friendly
- [ ] "Continue Anyway" option works

## Console Tests

Open the browser dev tools (when inspecting the iframe) to see:
- Page load messages
- Button click logs
- Input change logs
- PostMessage attempts

## Server Configuration

Default settings:
- **Port**: 5173 (Vite default)
- **Host**: localhost

Override with environment variables:
```bash
PORT=3000 node server.js
```

## Next Steps

After Phase 3 (Source Mapping) and Phase 4 (Bridge Script), you'll be able to:
- Inspect elements and see source file locations
- Test the bridge communication API
- Verify console log capture
- Test screenshot functionality
