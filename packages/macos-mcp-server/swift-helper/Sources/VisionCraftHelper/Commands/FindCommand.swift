import ApplicationServices
import AppKit
import Foundation

struct FindArgs: Decodable {
    let role: String?
    let title: String?
    let titleContains: String?
    let appBundleId: String?
    let maxResults: Int?
}

struct FindCommand {
    static func run(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: FindArgs.self) else { return }

        if !checkAccessibilityPermission(prompt: true) {
            outputError("Accessibility permission required. Grant access: System Settings > Privacy & Security > Accessibility")
            return
        }

        // Determine root element
        let rootElement: AXUIElement
        let rootPath: String

        if let bundleId = args.appBundleId {
            guard let appElement = getAppElement(bundleId: bundleId) else {
                outputError("Application not found: \(bundleId)")
                return
            }
            rootElement = appElement
            rootPath = "app:\(bundleId)"
        } else {
            guard let appElement = getFrontmostAppElement() else {
                outputError("No frontmost application found")
                return
            }
            let bundleId = NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? "unknown"
            rootElement = appElement
            rootPath = "app:\(bundleId)"
        }

        let results = findElements(
            root: rootElement,
            role: args.role,
            title: args.title,
            titleContains: args.titleContains,
            maxResults: args.maxResults ?? 50,
            parentPath: rootPath
        )

        outputSuccess(results)
    }
}
