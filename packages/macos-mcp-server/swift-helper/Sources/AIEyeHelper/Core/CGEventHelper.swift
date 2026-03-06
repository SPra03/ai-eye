import CoreGraphics
import Foundation
import Carbon.HIToolbox

/// Mouse click at coordinates
func performClick(x: CGFloat, y: CGFloat, button: String = "left", clickCount: Int = 1) -> Bool {
    let point = CGPoint(x: x, y: y)

    let mouseDown: CGEventType
    let mouseUp: CGEventType
    let mouseButton: CGMouseButton

    switch button {
    case "right":
        mouseDown = .rightMouseDown
        mouseUp = .rightMouseUp
        mouseButton = .right
    case "middle":
        mouseDown = .otherMouseDown
        mouseUp = .otherMouseUp
        mouseButton = .center
    default:
        mouseDown = .leftMouseDown
        mouseUp = .leftMouseUp
        mouseButton = .left
    }

    for i in 0..<clickCount {
        guard let downEvent = CGEvent(mouseEventSource: nil, mouseType: mouseDown, mouseCursorPosition: point, mouseButton: mouseButton) else {
            return false
        }
        downEvent.setIntegerValueField(.mouseEventClickState, value: Int64(i + 1))
        downEvent.post(tap: .cghidEventTap)

        guard let upEvent = CGEvent(mouseEventSource: nil, mouseType: mouseUp, mouseCursorPosition: point, mouseButton: mouseButton) else {
            return false
        }
        upEvent.setIntegerValueField(.mouseEventClickState, value: Int64(i + 1))
        upEvent.post(tap: .cghidEventTap)
    }

    return true
}

/// Move mouse to coordinates
func moveMouse(x: CGFloat, y: CGFloat) -> Bool {
    let point = CGPoint(x: x, y: y)
    guard let event = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left) else {
        return false
    }
    event.post(tap: .cghidEventTap)
    return true
}

/// Scroll at coordinates
func performScroll(x: CGFloat, y: CGFloat, deltaX: Int32 = 0, deltaY: Int32 = 0) -> Bool {
    // First move to position
    _ = moveMouse(x: x, y: y)

    guard let event = CGEvent(scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 2, wheel1: deltaY, wheel2: deltaX, wheel3: 0) else {
        return false
    }
    event.post(tap: .cghidEventTap)
    return true
}

/// Map key name to CGKeyCode
func keyCodeForName(_ name: String) -> CGKeyCode? {
    let mapping: [String: CGKeyCode] = [
        "return": CGKeyCode(kVK_Return),
        "enter": CGKeyCode(kVK_Return),
        "tab": CGKeyCode(kVK_Tab),
        "space": CGKeyCode(kVK_Space),
        "delete": CGKeyCode(kVK_Delete),
        "backspace": CGKeyCode(kVK_Delete),
        "forwarddelete": CGKeyCode(kVK_ForwardDelete),
        "escape": CGKeyCode(kVK_Escape),
        "esc": CGKeyCode(kVK_Escape),
        "up": CGKeyCode(kVK_UpArrow),
        "down": CGKeyCode(kVK_DownArrow),
        "left": CGKeyCode(kVK_LeftArrow),
        "right": CGKeyCode(kVK_RightArrow),
        "home": CGKeyCode(kVK_Home),
        "end": CGKeyCode(kVK_End),
        "pageup": CGKeyCode(kVK_PageUp),
        "pagedown": CGKeyCode(kVK_PageDown),
        "f1": CGKeyCode(kVK_F1),
        "f2": CGKeyCode(kVK_F2),
        "f3": CGKeyCode(kVK_F3),
        "f4": CGKeyCode(kVK_F4),
        "f5": CGKeyCode(kVK_F5),
        "f6": CGKeyCode(kVK_F6),
        "f7": CGKeyCode(kVK_F7),
        "f8": CGKeyCode(kVK_F8),
        "f9": CGKeyCode(kVK_F9),
        "f10": CGKeyCode(kVK_F10),
        "f11": CGKeyCode(kVK_F11),
        "f12": CGKeyCode(kVK_F12),
        "a": CGKeyCode(kVK_ANSI_A),
        "b": CGKeyCode(kVK_ANSI_B),
        "c": CGKeyCode(kVK_ANSI_C),
        "d": CGKeyCode(kVK_ANSI_D),
        "e": CGKeyCode(kVK_ANSI_E),
        "f": CGKeyCode(kVK_ANSI_F),
        "g": CGKeyCode(kVK_ANSI_G),
        "h": CGKeyCode(kVK_ANSI_H),
        "i": CGKeyCode(kVK_ANSI_I),
        "j": CGKeyCode(kVK_ANSI_J),
        "k": CGKeyCode(kVK_ANSI_K),
        "l": CGKeyCode(kVK_ANSI_L),
        "m": CGKeyCode(kVK_ANSI_M),
        "n": CGKeyCode(kVK_ANSI_N),
        "o": CGKeyCode(kVK_ANSI_O),
        "p": CGKeyCode(kVK_ANSI_P),
        "q": CGKeyCode(kVK_ANSI_Q),
        "r": CGKeyCode(kVK_ANSI_R),
        "s": CGKeyCode(kVK_ANSI_S),
        "t": CGKeyCode(kVK_ANSI_T),
        "u": CGKeyCode(kVK_ANSI_U),
        "v": CGKeyCode(kVK_ANSI_V),
        "w": CGKeyCode(kVK_ANSI_W),
        "x": CGKeyCode(kVK_ANSI_X),
        "y": CGKeyCode(kVK_ANSI_Y),
        "z": CGKeyCode(kVK_ANSI_Z),
        "0": CGKeyCode(kVK_ANSI_0),
        "1": CGKeyCode(kVK_ANSI_1),
        "2": CGKeyCode(kVK_ANSI_2),
        "3": CGKeyCode(kVK_ANSI_3),
        "4": CGKeyCode(kVK_ANSI_4),
        "5": CGKeyCode(kVK_ANSI_5),
        "6": CGKeyCode(kVK_ANSI_6),
        "7": CGKeyCode(kVK_ANSI_7),
        "8": CGKeyCode(kVK_ANSI_8),
        "9": CGKeyCode(kVK_ANSI_9),
        "minus": CGKeyCode(kVK_ANSI_Minus),
        "equal": CGKeyCode(kVK_ANSI_Equal),
        "leftbracket": CGKeyCode(kVK_ANSI_LeftBracket),
        "rightbracket": CGKeyCode(kVK_ANSI_RightBracket),
        "semicolon": CGKeyCode(kVK_ANSI_Semicolon),
        "quote": CGKeyCode(kVK_ANSI_Quote),
        "comma": CGKeyCode(kVK_ANSI_Comma),
        "period": CGKeyCode(kVK_ANSI_Period),
        "slash": CGKeyCode(kVK_ANSI_Slash),
        "backslash": CGKeyCode(kVK_ANSI_Backslash),
        "grave": CGKeyCode(kVK_ANSI_Grave),
    ]
    return mapping[name.lowercased()]
}

/// Parse modifier string to CGEventFlags
func parseModifiers(_ modifiers: [String]) -> CGEventFlags {
    var flags = CGEventFlags()
    for mod in modifiers {
        switch mod.lowercased() {
        case "cmd", "command", "meta":
            flags.insert(.maskCommand)
        case "shift":
            flags.insert(.maskShift)
        case "alt", "option":
            flags.insert(.maskAlternate)
        case "ctrl", "control":
            flags.insert(.maskControl)
        case "fn":
            flags.insert(.maskSecondaryFn)
        default:
            break
        }
    }
    return flags
}

/// Press a key with optional modifiers
func pressKey(key: String, modifiers: [String] = []) -> Bool {
    guard let keyCode = keyCodeForName(key) else {
        // Try as single character
        if key.count == 1, let keyCode = keyCodeForName(key.lowercased()) {
            return pressKeyCode(keyCode, modifiers: modifiers, needsShift: key.first?.isUppercase ?? false)
        }
        return false
    }
    return pressKeyCode(keyCode, modifiers: modifiers)
}

private func pressKeyCode(_ keyCode: CGKeyCode, modifiers: [String] = [], needsShift: Bool = false) -> Bool {
    var flags = parseModifiers(modifiers)
    if needsShift {
        flags.insert(.maskShift)
    }

    guard let downEvent = CGEvent(keyboardEventSource: nil, virtualKey: keyCode, keyDown: true) else {
        return false
    }
    if !flags.isEmpty {
        downEvent.flags = flags
    }
    downEvent.post(tap: .cghidEventTap)

    guard let upEvent = CGEvent(keyboardEventSource: nil, virtualKey: keyCode, keyDown: false) else {
        return false
    }
    if !flags.isEmpty {
        upEvent.flags = flags
    }
    upEvent.post(tap: .cghidEventTap)

    return true
}

/// Type a string of text using keyboard events
func typeText(_ text: String) -> Bool {
    for char in text {
        let str = String(char)
        // Use CGEvent with Unicode string for reliable text input
        guard let event = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true) else {
            return false
        }
        var unicodeChars = Array(str.utf16)
        event.keyboardSetUnicodeString(stringLength: unicodeChars.count, unicodeString: &unicodeChars)
        event.post(tap: .cghidEventTap)

        guard let upEvent = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) else {
            return false
        }
        upEvent.post(tap: .cghidEventTap)

        // Small delay between characters for reliability
        usleep(10000) // 10ms
    }
    return true
}
