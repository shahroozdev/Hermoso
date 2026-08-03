import SwiftUI

/// Matches ios/context/SCREENS.md screen 18 / OwnerInsightsScreen.kt.
struct OwnerInsightsView: View {
    @StateObject private var viewModel = OwnerInsightsViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Insights")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(Color.hermosoCream)

                if viewModel.isLoading {
                    ProgressView()
                        .tint(Color.hermosoPurpleLight)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 30)
                } else if let text = viewModel.insightText {
                    Text(text)
                        .font(.system(size: 12.5))
                        .foregroundColor(Color.hermosoCream)
                        .lineSpacing(4)
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.hermosoPurpleDark)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                } else if let error = viewModel.errorMessage {
                    Text(error).foregroundColor(Color(hex: "#FCA5A5"))
                }
            }
            .padding(16)
        }
        .background(Color.hermosoPurpleDeeper)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }
}

#Preview {
    OwnerInsightsView()
}
