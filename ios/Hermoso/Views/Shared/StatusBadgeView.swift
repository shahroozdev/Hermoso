import SwiftUI

/// Matches ui/components/StatusBadge.kt exactly — see ios/context/THEME.md.
struct StatusBadgeView: View {
    let status: String?

    private var normalized: String {
        let trimmed = status?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""
        return trimmed.isEmpty ? "pending" : trimmed
    }

    private var backgroundColor: Color {
        switch normalized {
        case "confirmed": return Color.hermosoBadgeConfirmedBg
        case "cancelled": return Color.hermosoBadgeCancelledBg
        case "expired": return Color.hermosoBadgeExpiredBg
        default: return Color.hermosoBadgePendingBg
        }
    }

    private var textColor: Color {
        switch normalized {
        case "confirmed": return Color.hermosoBadgeConfirmedText
        case "cancelled": return Color.hermosoBadgeCancelledText
        case "expired": return Color.hermosoBadgeExpiredText
        default: return Color.hermosoBadgePendingText
        }
    }

    var body: some View {
        Text(normalized.capitalized)
            .font(.system(size: 12, weight: .semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}
