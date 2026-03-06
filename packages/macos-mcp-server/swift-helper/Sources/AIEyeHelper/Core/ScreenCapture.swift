import CoreGraphics
import AppKit
import Foundation

/// Screenshot target specification
struct ScreenshotTarget: Decodable {
    let target: String  // "screen", "window", "region"
    let windowId: CGWindowID?
    let region: ScreenRegion?
    let format: String?  // "png" or "jpeg"
    let quality: Int?    // 0-100 for JPEG
}

struct ScreenRegion: Codable {
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
}

/// Screenshot result
struct ScreenshotResult: Encodable {
    let base64: String
    let width: Int
    let height: Int
    let format: String
}

/// Capture screenshot and return as base64
func captureScreenshot(args: ScreenshotTarget) -> ScreenshotResult? {
    let format = args.format ?? "png"

    var cgImage: CGImage?

    switch args.target {
    case "window":
        guard let windowId = args.windowId else {
            outputError("windowId required for window screenshot")
            return nil
        }
        cgImage = CGWindowListCreateImage(
            .null,
            .optionIncludingWindow,
            windowId,
            [.boundsIgnoreFraming, .bestResolution]
        )

    case "region":
        guard let region = args.region else {
            outputError("region required for region screenshot")
            return nil
        }
        let rect = CGRect(x: region.x, y: region.y, width: region.width, height: region.height)
        cgImage = CGWindowListCreateImage(
            rect,
            .optionOnScreenOnly,
            kCGNullWindowID,
            .bestResolution
        )

    default: // "screen"
        cgImage = CGWindowListCreateImage(
            CGRect.infinite,
            .optionOnScreenOnly,
            kCGNullWindowID,
            .bestResolution
        )
    }

    guard let image = cgImage else {
        outputError("Screenshot failed. Screen Recording permission may be required. Grant access: System Settings > Privacy & Security > Screen Recording")
        return nil
    }

    let bitmapRep = NSBitmapImageRep(cgImage: image)
    let imageData: Data?

    if format == "jpeg" {
        let quality = Double(args.quality ?? 80) / 100.0
        imageData = bitmapRep.representation(using: .jpeg, properties: [.compressionFactor: quality])
    } else {
        imageData = bitmapRep.representation(using: .png, properties: [:])
    }

    guard let data = imageData else {
        outputError("Failed to encode image as \(format)")
        return nil
    }

    return ScreenshotResult(
        base64: data.base64EncodedString(),
        width: image.width,
        height: image.height,
        format: format
    )
}
