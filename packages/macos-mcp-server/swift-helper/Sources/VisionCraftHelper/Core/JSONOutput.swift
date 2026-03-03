import Foundation

/// Standard JSON output wrapper for all commands
struct SuccessOutput<T: Encodable>: Encodable {
    let success: Bool = true
    let data: T
}

struct ErrorOutput: Encodable {
    let success: Bool = false
    let error: String
}

/// Write JSON to stdout
func outputJSON<T: Encodable>(_ value: T) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    do {
        let data = try encoder.encode(value)
        if let str = String(data: data, encoding: .utf8) {
            print(str)
        }
    } catch {
        let fallback = ErrorOutput(error: "JSON encoding failed: \(error.localizedDescription)")
        if let data = try? encoder.encode(fallback), let str = String(data: data, encoding: .utf8) {
            print(str)
        }
    }
}

func outputSuccess<T: Encodable>(_ data: T) {
    outputJSON(SuccessOutput(data: data))
}

func outputError(_ message: String) {
    outputJSON(ErrorOutput(error: message))
}

/// Parse JSON arguments from a string
func parseArgs<T: Decodable>(_ jsonString: String, as type: T.Type) -> T? {
    guard let data = jsonString.data(using: .utf8) else {
        outputError("Invalid UTF-8 in arguments")
        return nil
    }
    do {
        return try JSONDecoder().decode(type, from: data)
    } catch {
        outputError("Invalid arguments: \(error.localizedDescription)")
        return nil
    }
}
