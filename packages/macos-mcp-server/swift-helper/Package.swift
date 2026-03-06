// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "aieye-macos-helper",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "aieye-macos-helper",
            dependencies: [],
            path: "Sources/AIEyeHelper",
            linkerSettings: [
                .linkedFramework("ApplicationServices"),
                .linkedFramework("AppKit"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("ScreenCaptureKit"),
            ]
        )
    ]
)
