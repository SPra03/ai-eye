// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "visioncraft-macos-helper",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "visioncraft-macos-helper",
            dependencies: [],
            path: "Sources/VisionCraftHelper",
            linkerSettings: [
                .linkedFramework("ApplicationServices"),
                .linkedFramework("AppKit"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("ScreenCaptureKit"),
            ]
        )
    ]
)
