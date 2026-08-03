import SwiftUI

/// Horizontal salon card used on Home. Distance is computed live per-card via
/// LocationService, not a placeholder — see HomeViewModel.
struct SalonCardView: View {
    let card: HomeViewModel.SalonCardModel

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            ZStack(alignment: .bottomLeading) {
                LinearGradient(
                    colors: [Color.hermosoPurple, Color.hermosoPurpleLight],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(width: 150, height: 110)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                if let rating = card.salon.avgRating {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(Color(hex: "#FBBF24"))
                        Text(String(format: "%.1f", rating))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Color.hermosoTextDark)
                    }
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .padding(8)
                }
            }

            Text(card.salon.name ?? "")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color.hermosoTextDark)
                .lineLimit(1)

            HStack(spacing: 4) {
                if let rating = card.salon.avgRating {
                    Text("★ \(String(format: "%.1f", rating))")
                }
                Text("· \(card.distanceText ?? "-- km")")
            }
            .font(.system(size: 11))
            .foregroundStyle(Color.hermosoTextMuted)
        }
        .frame(width: 150, alignment: .leading)
    }
}
