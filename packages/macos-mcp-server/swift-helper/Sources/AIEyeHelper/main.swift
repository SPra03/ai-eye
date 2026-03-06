import Foundation

/// AI Eye macOS Helper
/// Usage: aieye-macos-helper <command> --args '<json>'
///
/// Commands:
///   screenshot      - Capture screen, window, or region
///   inspect         - Inspect element at coordinates
///   find            - Search AX tree for elements
///   tree            - Dump AX hierarchy
///   focused         - Get currently focused element
///   click           - Mouse click at coordinates
///   type            - Type text via keyboard events
///   key             - Press key combo
///   scroll          - Scroll at coordinates
///   move-cursor     - Move mouse cursor
///   list-windows    - List visible windows
///   list-apps       - List running applications
///   launch-app      - Launch/activate an application
///   check-permissions - Check AX and Screen Recording permissions

let args = CommandLine.arguments

guard args.count >= 2 else {
    outputError("Usage: aieye-macos-helper <command> [--args '<json>']")
    exit(1)
}

let command = args[1]

// Parse --args flag
var argsJSON = "{}"
if args.count >= 4 && args[2] == "--args" {
    argsJSON = args[3]
}

switch command {
case "screenshot":
    ScreenshotCommand.run(argsJSON: argsJSON)

case "inspect", "element-at-point":
    InspectCommand.run(argsJSON: argsJSON)

case "find":
    FindCommand.run(argsJSON: argsJSON)

case "tree":
    TreeCommand.run(argsJSON: argsJSON)

case "focused":
    SystemCommand.getFocused(argsJSON: argsJSON)

case "click":
    InteractionCommand.click(argsJSON: argsJSON)

case "type":
    InteractionCommand.type(argsJSON: argsJSON)

case "key":
    InteractionCommand.key(argsJSON: argsJSON)

case "scroll":
    InteractionCommand.scroll(argsJSON: argsJSON)

case "move-cursor":
    InteractionCommand.moveCursor(argsJSON: argsJSON)

case "list-windows":
    SystemCommand.listWindows(argsJSON: argsJSON)

case "list-apps":
    SystemCommand.listApps(argsJSON: argsJSON)

case "launch-app":
    SystemCommand.launchApp(argsJSON: argsJSON)

case "check-permissions":
    SystemCommand.checkPermissions(argsJSON: argsJSON)

default:
    outputError("Unknown command: \(command). Available: screenshot, inspect, element-at-point, find, tree, focused, click, type, key, scroll, move-cursor, list-windows, list-apps, launch-app, check-permissions")
    exit(1)
}
