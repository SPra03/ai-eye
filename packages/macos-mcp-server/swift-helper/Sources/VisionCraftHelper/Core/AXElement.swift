import ApplicationServices
import AppKit
import Foundation

/// Represents an Accessibility element with JSON-serializable properties
struct AXElementInfo: Encodable {
    let role: String?
    let roleDescription: String?
    let title: String?
    let description: String?
    let value: String?
    let label: String?
    let position: PointInfo?
    let size: SizeInfo?
    let enabled: Bool?
    let focused: Bool?
    let selected: Bool?
    let axpath: String?
    let children: [AXElementInfo]?
    let childCount: Int?
    let actions: [String]?
}

struct PointInfo: Encodable {
    let x: CGFloat
    let y: CGFloat
}

struct SizeInfo: Encodable {
    let width: CGFloat
    let height: CGFloat
}

/// Get a string attribute from an AXUIElement
func axGetString(_ element: AXUIElement, _ attribute: String) -> String? {
    var value: AnyObject?
    let result = AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
    guard result == .success else { return nil }
    return value as? String
}

/// Get a boolean attribute from an AXUIElement
func axGetBool(_ element: AXUIElement, _ attribute: String) -> Bool? {
    var value: AnyObject?
    let result = AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
    guard result == .success else { return nil }
    if let num = value as? NSNumber {
        return num.boolValue
    }
    return nil
}

/// Get the position of an AXUIElement
func axGetPosition(_ element: AXUIElement) -> CGPoint? {
    var value: AnyObject?
    let result = AXUIElementCopyAttributeValue(element, kAXPositionAttribute as String as CFString, &value)
    guard result == .success else { return nil }
    var point = CGPoint.zero
    if AXValueGetValue(value as! AXValue, .cgPoint, &point) {
        return point
    }
    return nil
}

/// Get the size of an AXUIElement
func axGetSize(_ element: AXUIElement) -> CGSize? {
    var value: AnyObject?
    let result = AXUIElementCopyAttributeValue(element, kAXSizeAttribute as String as CFString, &value)
    guard result == .success else { return nil }
    var size = CGSize.zero
    if AXValueGetValue(value as! AXValue, .cgSize, &size) {
        return size
    }
    return nil
}

/// Get children of an AXUIElement
func axGetChildren(_ element: AXUIElement) -> [AXUIElement]? {
    var value: AnyObject?
    let result = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as String as CFString, &value)
    guard result == .success else { return nil }
    return value as? [AXUIElement]
}

/// Get child count without fetching all children
func axGetChildCount(_ element: AXUIElement) -> Int? {
    var count: CFIndex = 0
    let result = AXUIElementGetAttributeValueCount(element, kAXChildrenAttribute as String as CFString, &count)
    guard result == .success else { return nil }
    return count
}

/// Get all action names for an element
func axGetActions(_ element: AXUIElement) -> [String]? {
    var names: CFArray?
    let result = AXUIElementCopyActionNames(element, &names)
    guard result == .success, let actionNames = names as? [String] else { return nil }
    return actionNames
}

/// Perform an action on an AXUIElement
func axPerformAction(_ element: AXUIElement, _ action: String) -> Bool {
    return AXUIElementPerformAction(element, action as CFString) == .success
}

/// Convert AXUIElement to AXElementInfo
func elementToInfo(_ element: AXUIElement, depth: Int = 0, maxDepth: Int = 0, parentPath: String = "") -> AXElementInfo {
    let role = axGetString(element, kAXRoleAttribute as String)
    let title = axGetString(element, kAXTitleAttribute as String)
    let desc = axGetString(element, kAXDescriptionAttribute as String)
    let roleDesc = axGetString(element, kAXRoleDescriptionAttribute as String)
    let label = axGetString(element, kAXLabelValueAttribute as String) ?? axGetString(element, "AXLabel")

    // Build value string from various value attributes
    var valueStr: String? = nil
    var rawValue: AnyObject?
    if AXUIElementCopyAttributeValue(element, kAXValueAttribute as String as CFString, &rawValue) == .success {
        if let s = rawValue as? String {
            valueStr = s
        } else if let n = rawValue as? NSNumber {
            valueStr = n.stringValue
        }
    }

    let position = axGetPosition(element)
    let size = axGetSize(element)
    let enabled = axGetBool(element, kAXEnabledAttribute as String)
    let focused = axGetBool(element, kAXFocusedAttribute as String)
    let selected = axGetBool(element, kAXSelectedAttribute as String)
    let actions = axGetActions(element)

    // Build AX path
    let roleStr = role ?? "unknown"
    let titleStr = title ?? ""
    let pathSegment = titleStr.isEmpty ? roleStr : "\(roleStr):\(titleStr)"
    let axpath = parentPath.isEmpty ? pathSegment : "\(parentPath)/\(pathSegment)"

    // Get children if within depth limit
    var children: [AXElementInfo]? = nil
    var childCount = axGetChildCount(element)

    if maxDepth > 0 && depth < maxDepth {
        if let axChildren = axGetChildren(element) {
            children = axChildren.prefix(50).map { child in
                elementToInfo(child, depth: depth + 1, maxDepth: maxDepth, parentPath: axpath)
            }
            childCount = axChildren.count
        }
    }

    return AXElementInfo(
        role: role,
        roleDescription: roleDesc,
        title: title,
        description: desc,
        value: valueStr,
        label: label,
        position: position.map { PointInfo(x: $0.x, y: $0.y) },
        size: size.map { SizeInfo(width: $0.width, height: $0.height) },
        enabled: enabled,
        focused: focused,
        selected: selected,
        axpath: axpath,
        children: children,
        childCount: childCount,
        actions: actions
    )
}

/// Get the AXUIElement for the application with the given bundle ID
func getAppElement(bundleId: String) -> AXUIElement? {
    guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: bundleId).first else {
        return nil
    }
    return AXUIElementCreateApplication(app.processIdentifier)
}

/// Get the AXUIElement for the frontmost application
func getFrontmostAppElement() -> AXUIElement? {
    guard let app = NSWorkspace.shared.frontmostApplication else {
        return nil
    }
    return AXUIElementCreateApplication(app.processIdentifier)
}

/// Get element at screen coordinates
func getElementAtPoint(x: CGFloat, y: CGFloat) -> AXUIElement? {
    let systemWide = AXUIElementCreateSystemWide()
    var element: AXUIElement?
    let result = AXUIElementCopyElementAtPosition(systemWide, Float(x), Float(y), &element)
    guard result == .success else { return nil }
    return element
}

/// Search the AX tree for elements matching criteria
func findElements(
    root: AXUIElement,
    role: String? = nil,
    title: String? = nil,
    titleContains: String? = nil,
    maxResults: Int = 50,
    maxDepth: Int = 10,
    parentPath: String = ""
) -> [AXElementInfo] {
    var results: [AXElementInfo] = []
    findElementsRecursive(
        element: root,
        role: role,
        title: title,
        titleContains: titleContains,
        maxResults: maxResults,
        maxDepth: maxDepth,
        depth: 0,
        parentPath: parentPath,
        results: &results
    )
    return results
}

private func findElementsRecursive(
    element: AXUIElement,
    role: String?,
    title: String?,
    titleContains: String?,
    maxResults: Int,
    maxDepth: Int,
    depth: Int,
    parentPath: String,
    results: inout [AXElementInfo]
) {
    guard results.count < maxResults && depth <= maxDepth else { return }

    let elemRole = axGetString(element, kAXRoleAttribute as String)
    let elemTitle = axGetString(element, kAXTitleAttribute as String)

    // Build path for this element
    let roleStr = elemRole ?? "unknown"
    let titleStr = elemTitle ?? ""
    let pathSegment = titleStr.isEmpty ? roleStr : "\(roleStr):\(titleStr)"
    let axpath = parentPath.isEmpty ? pathSegment : "\(parentPath)/\(pathSegment)"

    var matches = true
    if let role = role, elemRole != role { matches = false }
    if let title = title, elemTitle != title { matches = false }
    if let titleContains = titleContains {
        if let t = elemTitle, !t.localizedCaseInsensitiveContains(titleContains) {
            matches = false
        } else if elemTitle == nil {
            matches = false
        }
    }

    if matches && (role != nil || title != nil || titleContains != nil) {
        results.append(elementToInfo(element, depth: 0, maxDepth: 0, parentPath: parentPath))
    }

    // Recurse into children
    guard let children = axGetChildren(element) else { return }
    for child in children {
        guard results.count < maxResults else { return }
        findElementsRecursive(
            element: child,
            role: role,
            title: title,
            titleContains: titleContains,
            maxResults: maxResults,
            maxDepth: maxDepth,
            depth: depth + 1,
            parentPath: axpath,
            results: &results
        )
    }
}

/// Get the currently focused element across all apps
func getFocusedElement() -> AXUIElement? {
    let systemWide = AXUIElementCreateSystemWide()
    var focusedElement: AnyObject?
    let result = AXUIElementCopyAttributeValue(systemWide, kAXFocusedUIElementAttribute as String as CFString, &focusedElement)
    guard result == .success else { return nil }
    return (focusedElement as! AXUIElement)
}
