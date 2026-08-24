import SwiftUI

/// Horizontal event card used on Home. Gradient cycles through 5 fixed pairs
/// by index, matching HomeScreen.kt exactly (see ios/context/THEME.md Gradients).
struct EventCardView: View {
    let event: EventDto
    let gradientIndex: Int

    private static let gradients: [[Color]] = [
        [Color(hex: "#6B21A8"), Color(hex: "#9333EA")],
        [Color(hex: "#BE185D"), Color(hex: "#EC4899")],
        [Color(hex: "#1E40AF"), Color(hex: "#3B82F6")],
        [Color(hex: "#047857"), Color(hex: "#10B981")],
        [Color(hex: "#B45309"), Color(hex: "#F59E0B")],
    ]

    private var categoryLine: String {
        let names = Set((event.services ?? []).compactMap { $0.serviceId?.category })
        return names.isEmpty ? (event.category ?? "") : names.sorted().joined(separator: " · ")
    }

    var body: some View {
        let colors = Self.gradients[gradientIndex % Self.gradients.count]
        VStack(alignment: .leading, spacing: 8) {
            Text((event.category ?? "").uppercased())
                .font(.system(size: 9.5, weight: .bold))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.25))
                .foregroundColor(.white)
                .clipShape(Capsule())

            Spacer()

            VStack(alignment: .leading, spacing: 2) {
                Text(event.name ?? "")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(categoryLine)
                    .font(.system(size: 10.5))
                    .foregroundColor(.white.opacity(0.75))
                    .lineLimit(1)
            }
        }
        .padding(12)
        .frame(width: 190, height: 96, alignment: .topLeading)
        .background(LinearGradient(colors: colors, startPoint: .leading, endPoint: .trailing))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
