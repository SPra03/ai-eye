import ApplicationServices
import AppKit
import Foundation

struct TreeArgs: Decodable {
    let appBundleId: String?
    let maxDepth: Int?
}

struct TreeCommand {
    static func run(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: TreeArgs.self) else { return }

        if !checkAccessibilityPermission(prompt: true) {
            outputError("Accessibility permission required. Grant access: System Settings > Privacy & Security > Accessibility")
            return
        }

        let rootElement: AXUIElement

        if let bundleId = args.appBundleId {
            guard let appElement = getAppElement(bundleId: bundleId) else {
                outputError("Application not found: \(bundleId)")
                return
            }
            rootElement = appElement
        } else {
            guard let appElement = getFrontmostAppElement() else {
                outputError("No frontmost application found")
                return
            }
            rootElement = appElement
        }

        let maxDepth = args.maxDepth ?? 5
        let tree = elementToInfo(rootElement, depth: 0, maxDepth: maxDepth, parentPath: "")
        outputSuccess(tree)
    }
}
