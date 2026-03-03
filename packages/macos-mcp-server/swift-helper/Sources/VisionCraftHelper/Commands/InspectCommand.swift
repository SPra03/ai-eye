import ApplicationServices
import Foundation

struct InspectArgs: Decodable {
    let x: CGFloat?
    let y: CGFloat?
    let appBundleId: String?
}

struct InspectCommand {
    static func run(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: InspectArgs.self) else { return }

        if !checkAccessibilityPermission(prompt: true) {
            outputError("Accessibility permission required. Grant access: System Settings > Privacy & Security > Accessibility")
            return
        }

        guard let x = args.x, let y = args.y else {
            outputError("x and y coordinates are required")
            return
        }

        guard let element = getElementAtPoint(x: x, y: y) else {
            outputError("No element found at position (\(x), \(y))")
            return
        }

        let info = elementToInfo(element, depth: 0, maxDepth: 1)
        outputSuccess(info)
    }
}
