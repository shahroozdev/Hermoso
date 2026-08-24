import Foundation

/// Matches the exact patterns in Android's utils/DateTimeUtils.kt. Returns ""
/// on any parse failure, mirroring Android's silent-failure behavior.
enum HermosoDateFormat {
    private static let isoWithFraction: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoPlain: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static func parse(_ iso: String) -> Date? {
        isoWithFraction.date(from: iso) ?? isoPlain.date(from: iso)
    }

    private static func format(_ iso: String, pattern: String) -> String {
        guard let date = parse(iso) else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = pattern
        return formatter.string(from: date)
    }

    /// "dd MMM, yyyy h:mm a" — e.g. "12 May, 2026 2:00 PM"
    static func timestamp(_ iso: String) -> String { format(iso, pattern: "dd MMM, yyyy h:mm a") }

    /// "dd MMM, yyyy"
    static func date(_ iso: String) -> String { format(iso, pattern: "dd MMM, yyyy") }

    /// "h:mm a"
    static func time(_ iso: String) -> String { format(iso, pattern: "h:mm a") }
}
