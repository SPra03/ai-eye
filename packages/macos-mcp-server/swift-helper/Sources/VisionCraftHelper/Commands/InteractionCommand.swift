import Foundation
import CoreGraphics

struct ClickArgs: Decodable {
    let x: CGFloat
    let y: CGFloat
    let button: String?
    let clickCount: Int?
}

struct TypeArgs: Decodable {
    let text: String
}

struct KeyArgs: Decodable {
    let key: String
    let modifiers: [String]?
}

struct ScrollArgs: Decodable {
    let x: CGFloat
    let y: CGFloat
    let deltaX: Int32?
    let deltaY: Int32?
}

struct MoveArgs: Decodable {
    let x: CGFloat
    let y: CGFloat
}

struct InteractionResult: Encodable {
    let success: Bool
}

struct InteractionCommand {
    static func click(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: ClickArgs.self) else { return }
        let result = performClick(
            x: args.x,
            y: args.y,
            button: args.button ?? "left",
            clickCount: args.clickCount ?? 1
        )
        if result {
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Click failed at (\(args.x), \(args.y))")
        }
    }

    static func type(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: TypeArgs.self) else { return }
        let result = typeText(args.text)
        if result {
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Type failed")
        }
    }

    static func key(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: KeyArgs.self) else { return }
        let result = pressKey(key: args.key, modifiers: args.modifiers ?? [])
        if result {
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Key press failed: \(args.key)")
        }
    }

    static func scroll(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: ScrollArgs.self) else { return }
        let result = performScroll(
            x: args.x,
            y: args.y,
            deltaX: args.deltaX ?? 0,
            deltaY: args.deltaY ?? 0
        )
        if result {
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Scroll failed at (\(args.x), \(args.y))")
        }
    }

    static func moveCursor(argsJSON: String) {
        guard let args = parseArgs(argsJSON, as: MoveArgs.self) else { return }
        let result = moveMouse(x: args.x, y: args.y)
        if result {
            outputSuccess(InteractionResult(success: true))
        } else {
            outputError("Move cursor failed to (\(args.x), \(args.y))")
        }
    }
}
