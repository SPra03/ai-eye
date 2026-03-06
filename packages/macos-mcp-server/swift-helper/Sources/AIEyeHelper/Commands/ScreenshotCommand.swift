import Foundation

struct ScreenshotCommand {
    static func run(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: ScreenshotTarget.self) else { return }

        if !checkScreenRecordingPermission() {
            outputError("Screen Recording permission required. Grant access: System Settings > Privacy & Security > Screen Recording")
            return
        }

        guard let result = captureScreenshot(args: args) else { return }
        outputSuccess(result)
    }
}
