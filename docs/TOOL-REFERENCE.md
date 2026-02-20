# VisionCraft MCP Tools - Quick Reference

**Fast lookup for all 14 VisionCraft tools**

---

## 📸 Visual Tools (2)

### `visioncraft_screenshot`
**Capture page screenshot**

**Parameters:**
- `format`: "jpeg" | "png" (default: "jpeg")
- `quality`: 0-100 (default: 80, JPEG only)

**Returns:** Base64 image

**Use when:** Need to see current page state

---

### `visioncraft_navigate`
**Navigate to different URL**

**Parameters:**
- `url`: string (required) - Full URL with protocol

**Returns:** Success confirmation

**Use when:** Changing pages/views

---

## 🔍 Inspection Tools (4)

### `visioncraft_inspect_element`
**Get full element details**

**Parameters:**
- `selector`: string (CSS selector)

**Returns:**
- Tag, classes, attributes
- Source location (file:line:col)
- Bounding box, styles
- ARIA role, accessibility info

**Use when:** Need complete element information

---

### `visioncraft_get_source`
**Get element source location only**

**Parameters:**
- `selector`: string (CSS selector)

**Returns:**
- `file`: string
- `line`: string
- `col`: string

**Use when:** Only need source location (faster than inspect)

---

### `visioncraft_get_structure`
**Get DOM tree with source mapping**

**Parameters:**
- `maxDepth`: number (1-10, default: 5)

**Returns:** Nested tree of elements with source locations

**Use when:** Understanding component hierarchy

---

### `visioncraft_find_elements`
**Search for elements**

**Parameters:**
- `query`: string (search term)
- `mode`: "text" | "role" | "css" (default: "css")

**Returns:** Array of matching elements with selectors

**Use when:** Finding elements by description

**Modes:**
- `text`: Search by text content
- `role`: Search by ARIA role
- `css`: Search by CSS selector

---

## 🖱️ Interaction Tools (3)

### `visioncraft_click`
**Click an element**

**Parameters:**
- `selector`: string (CSS selector)

**Returns:** Click result with state verification

**Use when:** Testing buttons, links, interactions

---

### `visioncraft_type`
**Type text into input**

**Parameters:**
- `selector`: string (CSS selector for input)
- `text`: string (text to type)

**Returns:** Type result

**Use when:** Filling forms, testing input

---

### `visioncraft_scroll`
**Scroll the page**

**Parameters:**
- `x`: number (horizontal, default: 0)
- `y`: number (vertical, required)

**Returns:** Scroll result

**Use when:** Accessing elements below fold

---

## 🐛 Debugging Tools (5)

### `visioncraft_get_console_logs`
**Read browser console**

**Parameters:**
- `level`: "log" | "warn" | "error" | "info" (optional)
- `limit`: number (optional, max logs to return)

**Returns:** Array of console messages with timestamps

**Use when:** Checking for errors, debugging

---

### `visioncraft_clear_console_logs`
**Clear console log buffer**

**Parameters:** None

**Returns:** Success confirmation

**Use when:** Resetting before tests

---

### `visioncraft_get_hmr_status`
**Check HMR status and errors**

**Parameters:** None

**Returns:**
- Connection state
- Recent updates (last 20)
- Average latency
- Error history (last 10)

**Use when:** Changes not appearing, HMR issues

---

### `visioncraft_clear_hmr_errors`
**Clear HMR error history**

**Parameters:** None

**Returns:** Success confirmation

**Use when:** Resetting after fixing HMR issues

---

### `visioncraft_get_current_url`
**Get current page URL**

**Parameters:** None

**Returns:** Current URL string

**Use when:** Verifying current page, checking query params

---

## Common Workflows

### Fix a Visual Bug
```
1. screenshot → See the issue
2. find_elements OR inspect_element → Locate element
3. get_source → Find code location
4. [Edit code]
5. screenshot → Verify fix
```

### Debug an Error
```
1. get_console_logs → See error messages
2. inspect_element → Find problematic element
3. get_source → Locate code
4. [Fix code]
5. get_console_logs → Verify no errors
```

### Test an Interaction
```
1. screenshot → See current state
2. type → Fill form
3. click → Submit
4. get_console_logs → Check for errors
5. screenshot → See result
```

### Check Page Structure
```
1. screenshot → See the page
2. get_structure → Understand hierarchy
3. inspect_element → Details on specific elements
```

---

## Tool Selection Guide

| Goal | Primary Tool | Secondary Tools |
|------|-------------|----------------|
| See current page | screenshot | - |
| Find element location | get_source | inspect_element |
| Understand element | inspect_element | get_source |
| Find element by description | find_elements | inspect_element |
| Test button click | click | get_console_logs, screenshot |
| Test form | type, click | get_console_logs |
| Debug error | get_console_logs | inspect_element |
| Check if change worked | screenshot | get_console_logs |
| Understand layout | get_structure | inspect_element |
| HMR not working | get_hmr_status | get_console_logs |

---

## Parameter Quick Reference

### CSS Selectors
```
// By ID
"#submit-button"

// By class
".btn-primary"

// By attribute
"[data-testid='submit']"

// Combined
"button.primary#submit"

// Nested
"form .input-group input"
```

### ARIA Roles (for find_elements)
```
"button"     // <button> or role="button"
"link"       // <a> elements
"heading"    // <h1> - <h6>
"textbox"    // <input type="text">
"checkbox"   // <input type="checkbox">
"radio"      // <input type="radio">
"list"       // <ul>, <ol>
"listitem"   // <li>
"navigation" // <nav>
"main"       // <main>
```

---

## Response Formats

### Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Result data here"
    }
  ]
}
```

### Error Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Descriptive error message"
    }
  ],
  "isError": true
}
```

### Screenshot Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Screenshot captured successfully"
    },
    {
      "type": "image",
      "data": "base64...",
      "mimeType": "image/jpeg"
    }
  ]
}
```

---

## Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Element not found" | Invalid selector | Use find_elements to search |
| "Not connected to browser" | Browser/server not running | Start dev server, check URL |
| "Bridge not available" | Plugin not configured | Install Vite/Babel plugin |
| "Invalid URL format" | Missing http:// | Add protocol to URL |
| "Source mapping not available" | No plugin or external lib | Configure plugin for your code |
| "Page not available" | No page loaded | Call navigate first |

---

## Best Practices

### ✅ DO
- Start with screenshot to see current state
- Use get_source for just source location (faster)
- Use specific CSS selectors
- Verify changes with screenshot
- Check console logs after interactions
- Clear logs before testing

### ❌ DON'T
- Don't call screenshot repeatedly without changes
- Don't use vague selectors like "div" or "button"
- Don't inspect every element individually (use get_structure)
- Don't forget to check for errors after interactions
- Don't assume changes worked without verification

---

## Performance Tips

- **get_source** is faster than **inspect_element** if you only need location
- **find_elements** is faster than iterating with **inspect_element**
- **get_structure** gets multiple elements at once
- Use **screenshot** sparingly (slowest operation)
- Filter **get_console_logs** by level to reduce noise

---

## For More Details

- **Complete API Reference**: `docs/API.md`
- **AI Usage Guide**: `docs/AI-USAGE.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Getting Started**: `docs/GETTING-STARTED.md`

---

**Print this and keep it handy! 📋**
