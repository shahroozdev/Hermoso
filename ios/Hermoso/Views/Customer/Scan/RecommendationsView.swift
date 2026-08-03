import SwiftUI

/// Matches ios/context/SCREENS.md screen 4c — a separate, simpler screen from
/// the full CR-08→CR-15 report. Header uses a 2-stop gradient
/// [purpleDark, purple], unlike the 3-stop global header gradient.
///
/// "View Detailed Report" is an addition beyond Android: our audit of the
/// Kotlin source couldn't pin down Android's actual entry point into the full
/// report screen, so a link is added here rather than leaving it unreachable.
struct RecommendationsView: View {
    @StateObject private var viewModel = RecommendationsViewModel()
    var onSelectService: (ServiceDto) -> Void = { _ in }
    var onViewDetailedReport: () -> Void = {}

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
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 14) {
                Circle()
                    .fill(Color.hermosoPurplePale)
                    .frame(width: 64, height: 64)
                    .overlay(
                        Text("\(viewModel.services.count)")
                            .font(.system(size: 22, weight: .heavy))
                            .foregroundColor(Color.hermosoPurple)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text("Recommended Treatments")
                        .font(.system(size: 17, weight: .bold))
                    Text("\(viewModel.services.count) service options")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            Button(action: onViewDetailedReport) {
                Text("View Detailed Report →")
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundColor(.white)
            }
        }
        .padding(20)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(colors: [Color.hermosoPurpleDark, Color.hermosoPurple], startPoint: .leading, endPoint: .trailing)
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
        } else {
            VStack(spacing: 10) {
                ForEach(viewModel.services) { service in
                    serviceRow(service)
                }
            }
            .padding(16)
        }
    }

    private func serviceRow(_ service: ServiceDto) -> some View {
        Button {
            onSelectService(service)
        } label: {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color.hermosoPurplePale)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("S")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color.hermosoPurple)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text(service.name ?? "")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color.hermosoTextDark)
                    Text("Recommended from your latest scan")
                        .font(.system(size: 11))
                        .foregroundColor(Color.hermosoTextMuted)
                    Text("PKR \(Int(service.price ?? 0)) · \(service.duration ?? 0) min")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color.hermosoPurple)
                }
                Spacer()
            }
            .padding(14)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    RecommendationsView()
}
