import ApplicationServices
import AppKit

/// Permission status for macOS privacy features
struct PermissionStatus: Encodable {
    let accessibility: Bool
    let screenRecording: Bool
}

/// Check if the current process has Accessibility permission
func checkAccessibilityPermission(prompt: Bool = false) -> Bool {
    let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeUnretainedValue(): prompt]
    return AXIsProcessTrustedWithOptions(options)
}

/// Check if the current process has Screen Recording permission
/// We detect this by trying to capture a 1x1 region - if it returns nil, no permission
func checkScreenRecordingPermission() -> Bool {
    let screenBounds = CGRect(x: 0, y: 0, width: 1, height: 1)
    let image = CGWindowListCreateImage(screenBounds, .optionOnScreenOnly, kCGNullWindowID, .bestResolution)
    return image != nil
}

/// Get combined permission status
func getPermissionStatus(promptIfNeeded: Bool = false) -> PermissionStatus {
    return PermissionStatus(
        accessibility: checkAccessibilityPermission(prompt: promptIfNeeded),
        screenRecording: checkScreenRecordingPermission()
    )
}
