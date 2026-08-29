import SwiftUI

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8) & 0xFF) / 255
        let b = Double(value & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }

    // MARK: - Hermoso consolidated palette (ios/context/THEME.md)
    static let hermosoPurple = Color(hex: "#7C3AED")
    static let hermosoPurpleLight = Color(hex: "#A855F7")
    static let hermosoPurplePale = Color(hex: "#F3E8FF")
    static let hermosoPurpleDark = Color(hex: "#4C1D95")
    static let hermosoPurpleDeeper = Color(hex: "#2E1065")
    static let hermosoCream = Color(hex: "#FDF8FF")
    static let hermosoTextDark = Color(hex: "#1A0F2E")
    static let hermosoTextMuted = Color(hex: "#7C6890")

    // MARK: - Owner/Business palette (matches android-owner's Color.kt) — used on
    // AuthView so the owner app doesn't look identical to the customer app.
    static let hermosoOwnerNavy = Color(hex: "#0D1B2A")
    static let hermosoOwnerNavyMid = Color(hex: "#162032")
    static let hermosoOwnerNavyCard = Color(hex: "#1A2A3E")
    static let hermosoOwnerGold = Color(hex: "#D4A843")
    static let hermosoOwnerGoldLight = Color(hex: "#F0C96A")
    static let hermosoOwnerTextLight = Color(hex: "#E2EAF4")

    // MARK: - One-off colors (scattered per-screen in the source app, kept exact)
    static let hermosoError = Color(hex: "#B00020")
    static let hermosoSuccess = Color(hex: "#0A7D3B")
    static let hermosoOtpSuccess = Color(hex: "#0F9D58")
    static let hermosoNotificationBadge = Color(hex: "#EF4444")
    static let hermosoFieldBorder = Color(hex: "#E5DEF0")

    // MARK: - Scan score thresholds (ScanResultsScreen.kt ScoreRing)
    static let hermosoScoreHigh = Color(hex: "#10B981")
    static let hermosoScoreMid = Color(hex: "#F59E0B")
    static let hermosoScoreLow = Color(hex: "#EF4444")

    // MARK: - StatusBadge pairs (ui/components/StatusBadge.kt)
    static let hermosoBadgeConfirmedBg = Color(hex: "#D1FAE5")
    static let hermosoBadgeConfirmedText = Color(hex: "#065F46")
    static let hermosoBadgeCancelledBg = Color(hex: "#FEE2E2")
    static let hermosoBadgeCancelledText = Color(hex: "#7F1D1D")
    static let hermosoBadgeExpiredBg = Color(hex: "#FEF3C7")
    static let hermosoBadgeExpiredText = Color(hex: "#78350F")
    static let hermosoBadgePendingBg = Color(hex: "#DDD6FE")
    static let hermosoBadgePendingText = Color(hex: "#3F0F63")
}
