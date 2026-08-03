import SwiftUI

/// Matches ios/context/SCREENS.md screen 6. Header gradient is
/// [textDark, purpleDark] — an outlier vs. every other screen, which uses
/// purpleDeeper as the header's starting color.
struct MatchView: View {
    @StateObject private var viewModel = MatchViewModel()
    var onBookNow: (ScanMatchItemDto) -> Void = { _ in }

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
            Text("AI Salon Match")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(.white)
            Text("Salons matched to your latest scan")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(
            LinearGradient(colors: [Color.hermosoTextDark, Color.hermosoPurpleDark], startPoint: .top, endPoint: .bottom)
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
            VStack(spacing: 12) {
                Text(error).foregroundStyle(Color.hermosoError)
                Button("Retry") { Task { await viewModel.load() } }
                    .foregroundStyle(Color.hermosoPurple)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
        } else {
            VStack(spacing: 12) {
                ForEach(viewModel.matches) { match in
                    matchCard(match)
                }
            }
            .padding(16)
        }
    }

    private func matchCard(_ match: ScanMatchItemDto) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(match.name ?? "")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(Color.hermosoTextDark)
                    Text(match.city ?? "")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.hermosoTextMuted)
                }
                Spacer()
                Text("Match \(match.matchPercent ?? 0)%")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(Color.hermosoPurple)
            }

            if let services = match.matchedServices, !services.isEmpty {
                FlowTagsView(tags: services, background: Color.hermosoPurplePale, foreground: Color.hermosoPurple)
            }

            Button {
                onBookNow(match)
            } label: {
                Text("Book Now")
                    .font(.system(size: 13.5, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(match.salonId != nil ? Color.hermosoPurple : Color.hermosoPurple.opacity(0.4))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .disabled(match.salonId == nil)
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .shadow(color: Color.hermosoPurpleDeeper.opacity(0.06), radius: 8, y: 2)
    }
}

#Preview {
    MatchView()
}
