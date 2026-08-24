import SwiftUI

/// Matches ios/context/SCREENS.md screen 9 / TrackerScreen.kt.
///
/// ⚠️ Android shows the first/latest scan timestamps as raw, unformatted ISO
/// strings (it doesn't run them through its own date formatter here, unlike
/// every other screen). This implementation formats them properly instead —
/// a deliberate improvement, not a bug replication.
struct TrackerView: View {
    @StateObject private var viewModel = TrackerViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                content
            }
        }
        .background(Color.hermosoCream)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Skin Progress Tracker")
                .font(.system(size: 19, weight: .heavy))
                .foregroundColor(.white)
            Text("Based on your first and latest valid scans")
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(
            LinearGradient(colors: [Color(hex: "#0F0A1A"), Color.hermosoPurpleDeeper], startPoint: .top, endPoint: .bottom)
        )
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 60)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            ErrorRetryView(message: error).padding(20)
        } else if !viewModel.hasEnoughData {
            EmptyStateView(message: "Need at least two successful scans to show progress.", topPadding: 60, centered: true)
                .padding(.horizontal, 20)
        } else if let data = viewModel.improvements {
            VStack(alignment: .leading, spacing: 12) {
                summaryCard(data)
                ForEach(data.improvements ?? []) { item in
                    metricRow(item)
                }
            }
            .padding(16)
            .padding(.bottom, 90)
        }
    }

    private func summaryCard(_ data: ScanImprovementsData) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Scans: \(data.scansCount ?? 0)")
            if let first = data.firstScanAt {
                Text("First: \(HermosoDateFormat.date(first))")
            }
            if let latest = data.latestScanAt {
                Text("Latest: \(HermosoDateFormat.date(latest))")
            }
        }
        .font(.system(size: 12.5))
        .foregroundColor(.white)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func metricRow(_ item: ImprovementItemDto) -> some View {
        let delta = item.delta ?? 0
        let positive = item.positive != false
        let after = max(0, min(item.after ?? 0, 100))
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(item.key ?? "").font(.system(size: 13.5, weight: .bold)).foregroundColor(Color.hermosoTextDark)
                Spacer()
                Text(delta >= 0 ? "+\(delta)" : "\(delta)")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundColor(positive ? Color.hermosoScoreHigh : Color.hermosoError)
            }
            Text("Before \(item.before ?? 0) → After \(item.after ?? 0)")
                .font(.system(size: 11))
                .foregroundColor(Color.hermosoTextMuted)
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.hermosoPurplePale)
                    Capsule()
                        .fill(Color.hermosoPurple)
                        .frame(width: geometry.size.width * CGFloat(after) / 100)
                }
            }
            .frame(height: 7)
        }
        .padding(14)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    TrackerView()
}
