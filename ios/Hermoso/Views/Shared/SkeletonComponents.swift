import SwiftUI

/// Loading placeholders shown while Home's categories/salons/events are
/// still fetching, ported from Android's SkeletonComponents.kt
/// (SalonCardSkeleton / CategoryChipSkeleton / EventCardSkeleton). Sized to
/// match this port's real SalonCardView/EventCardView dimensions rather than
/// Android's raw dp values, so the swap from skeleton to real card is seamless.
struct SalonCardSkeletonView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            ShimmerView()
                .frame(width: 150, height: 110)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            ShimmerView()
                .frame(width: 110, height: 13)
                .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))

            HStack(spacing: 4) {
                ShimmerView().frame(width: 40, height: 11)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                ShimmerView().frame(width: 50, height: 11)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
            }
        }
        .frame(width: 150, alignment: .leading)
    }
}

struct CategoryChipSkeletonView: View {
    var body: some View {
        ShimmerView()
            .frame(width: 90, height: 32)
            .clipShape(Capsule())
    }
}

struct EventCardSkeletonView: View {
    var body: some View {
        ZStack(alignment: .topLeading) {
            ShimmerView()
                .frame(width: 190, height: 96)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            VStack(alignment: .leading, spacing: 8) {
                Color.white.opacity(0.3)
                    .frame(width: 60, height: 16)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                Color.white.opacity(0.3)
                    .frame(width: 140, height: 16)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                Color.white.opacity(0.3)
                    .frame(width: 120, height: 12)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
            }
            .padding(12)
        }
        .frame(width: 190, height: 96)
    }
}
