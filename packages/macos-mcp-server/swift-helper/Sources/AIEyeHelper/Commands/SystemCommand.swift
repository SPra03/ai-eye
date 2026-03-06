import AppKit
import Foundation
import CoreGraphics

struct ListWindowsArgs: Decodable {
    let appBundleId: String?
}

struct ListAppsArgs: Decodable {
    let onlyRunning: Bool?
}

struct LaunchAppArgs: Decodable {
    let bundleId: String?
    let name: String?
}

struct WindowInfo: Encodable {
    let windowId: CGWindowID
    let title: String?
    let ownerName: String?
    let ownerBundleId: String?
    let ownerPid: Int32
    let bounds: WindowBounds
    let layer: Int
    let isOnScreen: Bool
}

struct WindowBounds: Encodable {
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
}

struct AppInfo: Encodable {
    let name: String?
    let bundleId: String?
    let pid: Int32
    let isActive: Bool
    let isHidden: Bool
}

struct SystemCommand {
    static func listWindows(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: ListWindowsArgs.self) else { return }

        guard let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else {
            outputError("Failed to get window list")
            return
        }

        var windows: [WindowInfo] = []
        for windowDict in windowList {
            let ownerName = windowDict[kCGWindowOwnerName as String] as? String
            let ownerPid = windowDict[kCGWindowOwnerPID as String] as? Int32 ?? 0
            let windowId = windowDict[kCGWindowNumber as String] as? CGWindowID ?? 0
            let title = windowDict[kCGWindowName as String] as? String
            let layer = windowDict[kCGWindowLayer as String] as? Int ?? 0
            let isOnScreen = windowDict[kCGWindowIsOnscreen as String] as? Bool ?? true

            // Get owner bundle ID from PID
            let ownerApp = NSRunningApplication(processIdentifier: ownerPid)
            let ownerBundleId = ownerApp?.bundleIdentifier

            // Filter by app bundle ID if specified
            if let filterBundleId = args.appBundleId {
                if ownerBundleId != filterBundleId { continue }
            }

            // Only include normal windows (layer 0)
            if layer != 0 { continue }

            let bounds = windowDict[kCGWindowBounds as String] as? [String: CGFloat] ?? [:]
            let windowBounds = WindowBounds(
                x: bounds["X"] ?? 0,
                y: bounds["Y"] ?? 0,
                width: bounds["Width"] ?? 0,
                height: bounds["Height"] ?? 0
            )

            windows.append(WindowInfo(
                windowId: windowId,
                title: title,
                ownerName: ownerName,
                ownerBundleId: ownerBundleId,
                ownerPid: ownerPid,
                bounds: windowBounds,
                layer: layer,
                isOnScreen: isOnScreen
            ))
        }

        outputSuccess(windows)
    }

    static func listApps(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: ListAppsArgs.self) else { return }

        let runningApps = NSWorkspace.shared.runningApplications
        var apps: [AppInfo] = []

        for app in runningApps {
            // Skip background apps unless specifically asked
            if args.onlyRunning != false && app.activationPolicy != .regular {
                continue
            }

            apps.append(AppInfo(
                name: app.localizedName,
                bundleId: app.bundleIdentifier,
                pid: app.processIdentifier,
                isActive: app.isActive,
                isHidden: app.isHidden
            ))
        }

        outputSuccess(apps)
    }

    static func launchApp(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: LaunchAppArgs.self) else { return }

        if let bundleId = args.bundleId {
            // Launch by bundle ID
            guard let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleId) else {
                outputError("Application not found: \(bundleId)")
                return
            }

            let config = NSWorkspace.OpenConfiguration()
            config.activates = true

            let semaphore = DispatchSemaphore(value: 0)
            var launchError: Error?

            NSWorkspace.shared.openApplication(at: url, configuration: config) { _, error in
                launchError = error
                semaphore.signal()
            }
            semaphore.wait()

            if let error = launchError {
                outputError("Failed to launch \(bundleId): \(error.localizedDescription)")
            } else {
                outputSuccess(InteractionResult(success: true))
            }
        } else if let name = args.name {
            // Launch by name
            NSWorkspace.shared.openApplication(at: URL(fileURLWithPath: "/Applications/\(name).app"), configuration: NSWorkspace.OpenConfiguration()) { _, _ in }
            // Give it a moment to launch
            usleep(500000)
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Either bundleId or name is required")
        }
    }

    static func checkPermissions(argsJSON: String) {
        let status = getPermissionStatus(promptIfNeeded: true)
        outputSuccess(status)
    }

    static func getFocused(argsJSON: String) {
        if !checkAccessibilityPermission(prompt: true) {
            outputError("Accessibility permission required. Grant access: System Settings > Privacy & Security > Accessibility")
            return
        }

        guard let element = getFocusedElement() else {
            outputError("No focused element found")
            return
        }

        let info = elementToInfo(element, depth: 0, maxDepth: 1)
        outputSuccess(info)
    }
}
