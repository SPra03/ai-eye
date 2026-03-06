# AI Eye for AI Agents

**A Guide for AI Coding Assistants Using AI Eye**

This document explains how AI agents (like Claude, ChatGPT with plugins, or other MCP-compatible AI) should interact with AI Eye to help developers build and debug web applications visually.

---

## What is AI Eye?

AI Eye gives you (the AI) the ability to:
- **See** the user's web application through screenshots
- **Inspect** UI elements to find their source code location
- **Interact** with the application (click, type, scroll)
- **Debug** by reading console logs and HMR errors
- **Navigate** between different pages

You get 14 tools via the Model Context Protocol (MCP) to perform these actions.

---

## Quick Start for AI Agents

### When to Use AI Eye

Use AI Eye tools when the user asks about:
- ✅ Visual issues ("button is misaligned", "wrong color", "layout broken")
- ✅ UI behavior ("click doesn't work", "form won't submit")
- ✅ Responsive design ("check mobile view")
- ✅ Component location ("where is this defined?")
- ✅ Frontend debugging ("console errors", "HMR issues")

Don't use AI Eye for:
- ❌ Backend/API code (no visual output)
- ❌ Build configuration (unless it affects the UI)
- ❌ Pure logic/algorithms (no UI component)

### Your Workflow Pattern

```
1. User reports a UI issue
2. Take a screenshot to see what they see
3. Inspect the problematic element
4. Get the source location (file:line:col)
5. Read/edit the source code
6. Verify the fix with another screenshot
```

---

## The 14 MCP Tools

### 📸 Visual Tools

#### `aieye_screenshot`
**Purpose**: Capture what the user sees in their browser

**When to use**:
- User reports "something looks wrong"
- After making changes to verify them
- To understand the current UI state

**Parameters**:
```json
{
  "format": "jpeg",  // or "png"
  "quality": 80      // 0-100 for JPEG
}
```

**Example**:
```
User: "The login button doesn't look right"
You: Let me take a screenshot to see...
→ Call aieye_screenshot
→ Analyze the image
You: "I can see the button. It appears to have incorrect padding..."
```

#### `aieye_navigate`
**Purpose**: Change which page/URL you're viewing

**When to use**:
- User wants you to check a different page
- Testing multi-page workflows
- Switching between dev/prod environments

**Parameters**:
```json
{
  "url": "http://localhost:3000/dashboard"
}
```

**Example**:
```
User: "Check the dashboard page"
You: → Call aieye_navigate with url="http://localhost:3000/dashboard"
     → Call aieye_screenshot to see it
```

---

### 🔍 Inspection Tools

#### `aieye_inspect_element`
**Purpose**: Get detailed information about a specific UI element

**When to use**:
- Need to see an element's styles, position, or attributes
- Want to know if an element is visible/accessible
- Investigating layout issues

**Parameters**:
```json
{
  "selector": "button.login-btn"  // CSS selector
}
```

**Returns**:
- Element tag, classes, attributes
- Source location (file:line:col)
- Bounding box (position, size)
- Computed styles
- ARIA role and accessibility info

**Example**:
```
You: Let me inspect that button...
→ Call aieye_inspect_element with selector="button.login-btn"
Response: {
  "tag": "button",
  "source": { "file": "src/Login.tsx", "line": "45", "col": "12" },
  "styles": { "padding": "8px", ... },
  "boundingBox": { "x": 100, "y": 200, "width": 120, "height": 40 }
}
You: "The button is at src/Login.tsx:45. The padding is too small..."
```

#### `aieye_get_source`
**Purpose**: Quickly get just the source location of an element

**When to use**:
- You only need to know WHERE an element is defined
- Faster than full inspect when you don't need styles

**Parameters**:
```json
{
  "selector": ".error-message"
}
```

**Returns**:
```json
{
  "file": "src/components/ErrorDisplay.tsx",
  "line": "23",
  "col": "8"
}
```

#### `aieye_get_structure`
**Purpose**: Get the DOM tree with source mappings

**When to use**:
- Understanding component hierarchy
- Finding nested elements
- Mapping visual structure to code structure

**Parameters**:
```json
{
  "maxDepth": 5  // How deep to traverse (1-10)
}
```

**Returns**: Tree of elements with source locations

**Example**:
```
You: Let me understand the page structure...
→ Call aieye_get_structure with maxDepth=3
Response: {
  "tag": "div",
  "source": "src/App.tsx",
  "children": [
    { "tag": "header", "source": "src/Header.tsx", ... },
    { "tag": "main", "source": "src/MainContent.tsx", ... }
  ]
}
```

#### `aieye_find_elements`
**Purpose**: Search for elements by text, role, or CSS

**When to use**:
- User describes an element ("the submit button")
- Finding all instances of something
- Accessibility checks

**Parameters**:
```json
{
  "query": "Submit",
  "mode": "text"  // "text", "role", or "css"
}
```

**Modes**:
- `text`: Find elements containing text
- `role`: Find by ARIA role (button, link, heading, etc.)
- `css`: Find by CSS selector

**Example**:
```
User: "The submit button is broken"
You: Let me find the submit button...
→ Call aieye_find_elements with query="Submit", mode="text"
Response: [
  { "selector": "button#submit-btn", "source": "src/Form.tsx", "text": "Submit Form" }
]
You: "Found it at src/Form.tsx..."
```

---

### 🖱️ Interaction Tools

#### `aieye_click`
**Purpose**: Click an element (button, link, etc.)

**When to use**:
- Testing interactive behavior
- Simulating user actions
- Verifying fixes work

**Parameters**:
```json
{
  "selector": "button#submit-btn"
}
```

**Example**:
```
User: "Does the button work now?"
You: Let me test it...
→ Call aieye_click with selector="button#submit-btn"
→ Call aieye_get_console_logs to check for errors
You: "Button works! No errors in console."
```

#### `aieye_type`
**Purpose**: Type text into an input field

**When to use**:
- Testing form functionality
- Filling out forms to reach error states
- Simulating user input

**Parameters**:
```json
{
  "selector": "input#email",
  "text": "test@example.com"
}
```

**Example**:
```
You: Let me test the form validation...
→ Call aieye_type with selector="input#email", text="invalid"
→ Call aieye_click on submit button
→ Check for validation errors
```

#### `aieye_scroll`
**Purpose**: Scroll the page

**When to use**:
- Accessing elements below the fold
- Testing sticky headers/footers
- Checking responsive behavior at different scroll positions

**Parameters**:
```json
{
  "x": 0,      // horizontal scroll (optional)
  "y": 500     // vertical scroll (required)
}
```

---

### 🐛 Debugging Tools

#### `aieye_get_console_logs`
**Purpose**: Read browser console messages (errors, warnings, logs)

**When to use**:
- User reports "it's not working"
- After interactions to check for errors
- Debugging JavaScript issues

**Parameters**:
```json
{
  "level": "error",  // optional: "log", "warn", "error", "info"
  "limit": 10        // optional: max number of logs
}
```

**Returns**: Array of console messages with timestamps

**Example**:
```
User: "The form won't submit"
You: → Call aieye_get_console_logs with level="error"
Response: [
  { "level": "error", "message": "TypeError: Cannot read property 'email' of undefined", "timestamp": 1234567890 }
]
You: "I see a TypeError. The issue is that the form data isn't being read correctly..."
```

#### `aieye_clear_console_logs`
**Purpose**: Clear the console log buffer

**When to use**:
- Before testing to get clean results
- After fixing issues to verify no new errors

**Parameters**: None

#### `aieye_get_hmr_status`
**Purpose**: Check Hot Module Replacement status and errors

**When to use**:
- Development server issues
- Code changes not appearing
- HMR-related problems

**Parameters**: None

**Returns**:
- Connection status
- Recent updates
- Update latency
- Error history

**Example**:
```
User: "My changes aren't showing up"
You: → Call aieye_get_hmr_status
Response: {
  "connected": false,
  "errors": [{"message": "Failed to reload /src/App.tsx"}]
}
You: "HMR is disconnected. Try restarting the dev server..."
```

#### `aieye_clear_hmr_errors`
**Purpose**: Clear HMR error history

**When to use**:
- After fixing HMR issues
- Before testing to get clean state

**Parameters**: None

#### `aieye_get_current_url`
**Purpose**: Check which page you're currently viewing

**When to use**:
- Verifying you're on the right page
- After navigation to confirm it worked
- Checking query parameters or hash

**Parameters**: None

---

## Best Practices for AI Agents

### 1. Always Start with a Screenshot

Before making assumptions, see what the user sees:

```
User: "The button is in the wrong place"
❌ Bad: Start editing CSS immediately
✅ Good: Take screenshot → Inspect element → Identify issue → Fix
```

### 2. Use Source Mapping to Edit the Right Files

AI Eye tells you exactly where each element comes from:

```
→ aieye_inspect_element returns:
  { "source": { "file": "src/components/Button.tsx", "line": "45" } }

→ Now you know to edit src/components/Button.tsx:45
```

### 3. Verify Your Changes

After editing code, confirm it worked:

```
1. Make the fix
2. Wait for HMR to reload (check aieye_get_hmr_status)
3. Take screenshot to verify
4. Check console for new errors
```

### 4. Be Specific with Selectors

Use specific CSS selectors to avoid ambiguity:

```
❌ Bad: selector="button" (might match many buttons)
✅ Good: selector="button.login-btn"
✅ Better: selector="button#submit-form"
```

### 5. Combine Tools Effectively

Tools work together:

```
// Find + Inspect + Fix workflow
1. aieye_find_elements (query="Sign Up", mode="text")
   → Get selector
2. aieye_inspect_element (selector from step 1)
   → Get source location
3. Read/Edit the source file
4. aieye_screenshot
   → Verify fix
```

### 6. Handle Errors Gracefully

Elements might not exist or selectors might fail:

```
Response: { "error": "Element not found: button.missing" }

✅ Good response: "I couldn't find that element. Let me take a screenshot
   to see what's actually on the page..."
```

---

## Common Workflows

### Workflow 1: Fix a Visual Bug

```
User: "The header logo is too big"

Step 1: See the current state
→ aieye_screenshot

Step 2: Inspect the logo element
→ aieye_find_elements(query="logo", mode="css")
→ aieye_inspect_element(selector=".logo")
Response: source = "src/Header.tsx:12"

Step 3: Check current styles
Response: styles = { width: "500px", height: "200px" }

Step 4: Identify the issue
"The logo is 500x200px, which is too large for the header"

Step 5: Edit the source
→ Read src/Header.tsx
→ Change width to "150px", height to "60px"

Step 6: Verify the fix
→ aieye_screenshot
→ Check that logo is now appropriately sized
```

### Workflow 2: Debug an Interactive Issue

```
User: "The form won't submit"

Step 1: Understand the current state
→ aieye_screenshot
→ aieye_get_console_logs(level="error")

Step 2: Test the interaction
→ aieye_find_elements(query="submit", mode="text")
→ aieye_type(selector="input#email", text="test@test.com")
→ aieye_click(selector="button[type='submit']")

Step 3: Check what happened
→ aieye_get_console_logs(level="error")
Response: [{ message: "Uncaught TypeError: validate is not a function" }]

Step 4: Locate and fix
→ aieye_inspect_element(selector="form")
Response: source = "src/ContactForm.tsx:34"
→ Read src/ContactForm.tsx
→ Fix the validate function call
```

### Workflow 3: Responsive Design Check

```
User: "Check how it looks on mobile"

Step 1: Navigate if needed
→ aieye_navigate(url="http://localhost:3000")

Step 2: Capture current desktop view
→ aieye_screenshot

Step 3: User should resize browser or use dev tools
"Please resize your browser to mobile width (375px) or use Chrome DevTools
mobile emulation, then let me know when ready"

Step 4: Capture mobile view
→ aieye_screenshot

Step 5: Inspect problematic elements
→ aieye_inspect_element(selector=".nav-menu")
→ Check if elements are visible, properly positioned
```

---

## Tool Selection Guide

**When the user says...**

| User Statement | Tools to Use | Order |
|----------------|--------------|-------|
| "Something looks wrong" | screenshot | 1 |
| "Find the button" | find_elements | 1 |
| "Where is X defined?" | get_source or inspect_element | 1 |
| "Does it work?" | click, get_console_logs | 1→2 |
| "Test the form" | type, click, get_console_logs | 1→2→3 |
| "It's not working" | get_console_logs, screenshot | 1→2 |
| "Changes not showing" | get_hmr_status | 1 |
| "Show me the structure" | get_structure | 1 |

---

## Error Handling

### When Source Mapping is Not Available

```
Response: { "error": "Source mapping not available for this element" }

Possible causes:
- AI Eye plugin not configured
- Element is from external library
- Production build (source maps disabled)

✅ Good response: "This element doesn't have source mapping. It may be from
   a third-party library or the AI Eye plugin might not be configured.
   Can you tell me which file this component should be in?"
```

### When Element Not Found

```
Response: { "error": "Element not found: .missing-class" }

✅ Good approach:
1. Take screenshot to see what's actually there
2. Use find_elements to search by text
3. Get structure to understand the DOM
4. Ask user for clarification
```

### When Browser Not Connected

```
Response: { "error": "Not connected to browser" }

✅ Good response: "I can't connect to your development server. Please ensure:
   1. Your dev server is running (npm run dev)
   2. The MCP server is configured correctly
   3. The URL is correct (usually http://localhost:5173)"
```

---

## Performance Tips

### Minimize Tool Calls

Don't call tools unnecessarily:

```
❌ Bad: Call screenshot 5 times in a row
✅ Good: Call screenshot once, analyze thoroughly

❌ Bad: Inspect every element individually
✅ Good: Use get_structure to get multiple elements at once
```

### Use the Right Tool for the Job

```
Need just the source location?
❌ Don't use: aieye_inspect_element (returns lots of data)
✅ Do use: aieye_get_source (faster, focused)

Need to verify a visual change?
✅ Use: aieye_screenshot (see the result)
❌ Don't rely solely on: code inspection
```

### Cache Information

Remember information from previous tool calls:

```
✅ Good:
1. Get structure once → remember the layout
2. Refer back to it when analyzing
3. Only call again if structure changes

❌ Bad:
1. Get structure
2. Forget it
3. Get structure again for each question
```

---

## Advanced Patterns

### Pattern: Multi-Step Testing

```javascript
// Test a complete user flow
async function testCheckoutFlow() {
  // 1. Navigate to product page
  await aieye_navigate({ url: "http://localhost:3000/product/123" });

  // 2. Add to cart
  await aieye_click({ selector: "button.add-to-cart" });

  // 3. Navigate to cart
  await aieye_click({ selector: "a[href='/cart']" });

  // 4. Verify cart contents
  const screenshot = await aieye_screenshot({});
  const logs = await aieye_get_console_logs({ level: "error" });

  // 5. Proceed to checkout
  await aieye_click({ selector: "button.checkout" });

  // 6. Check for errors
  const errors = await aieye_get_console_logs({ level: "error" });

  return { success: errors.length === 0, errors };
}
```

### Pattern: Accessibility Audit

```javascript
// Check accessibility of a page
async function checkAccessibility() {
  // Get all interactive elements
  const buttons = await aieye_find_elements({ query: "button", mode: "role" });
  const links = await aieye_find_elements({ query: "link", mode: "role" });

  // Inspect each for accessibility attributes
  for (const element of [...buttons, ...links]) {
    const details = await aieye_inspect_element({ selector: element.selector });
    // Check for aria-label, role, alt text, etc.
  }
}
```

---

## Limitations and Constraints

### What AI Eye Cannot Do

1. **Cannot control the dev server** - You can't start/stop it
2. **Cannot modify browser viewport** - User must resize
3. **Cannot execute arbitrary JavaScript** - Only predefined tools
4. **Cannot access server-side code** - Only frontend
5. **Cannot see network requests** - Use console logs instead

### Working Within Constraints

```
User: "Start the dev server"
❌ Can't: Use AI Eye to start it
✅ Can: Tell user: "Please run `npm run dev` in your terminal"

User: "Check the API response"
❌ Can't: Directly inspect network tab
✅ Can: "Check the console logs for the API response data"
```

---

## Integration with Your Workflow

### Before Using AI Eye

1. Confirm the dev server is running
2. Confirm AI Eye is configured
3. Get the URL from the user

### During Development

1. Use AI Eye for visual verification
2. Edit code normally (you have file access)
3. Use AI Eye to verify changes

### After Changes

1. Screenshot to verify visually
2. Console logs to verify no errors
3. Interactive tests to verify functionality

---

## Quick Reference Card

```
📸 VISUAL
- screenshot() → See the page
- navigate(url) → Change page

🔍 INSPECTION
- inspect_element(selector) → Full element details
- get_source(selector) → Just the source location
- get_structure(depth) → DOM tree
- find_elements(query, mode) → Search for elements

🖱️ INTERACTION
- click(selector) → Click element
- type(selector, text) → Type into input
- scroll(x, y) → Scroll page

🐛 DEBUGGING
- get_console_logs(level, limit) → Read console
- clear_console_logs() → Clear console
- get_hmr_status() → Check HMR
- clear_hmr_errors() → Clear HMR errors
- get_current_url() → Current page URL
```

---

## Getting Help

If you encounter issues or need clarification:

1. **Check the API Reference**: `docs/API.md` has detailed tool documentation
2. **Review Troubleshooting**: `docs/TROUBLESHOOTING.md` has solutions
3. **Ask the user**: They may have specific context you need

---

## Summary

AI Eye gives you AI superpowers for visual development:

1. **See** what users see
2. **Understand** the UI structure and source code relationship
3. **Interact** to test functionality
4. **Debug** with real-time console access
5. **Verify** your fixes work

Use it wisely, start with screenshots, leverage source mapping, and always verify your changes!

---

**Happy Visual Debugging! 🎨🤖**
