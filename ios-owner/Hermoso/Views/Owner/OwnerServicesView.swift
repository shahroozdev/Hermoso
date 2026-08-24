import SwiftUI

/// Matches ios/context/SCREENS.md screen 16 / OwnerServicesScreen.kt.
/// ⚠️ Read-only list — no CRUD, matching Android exactly. Decide deliberately
/// whether to add real management UI here rather than assuming it's expected.
struct OwnerServicesView: View {
    @StateObject private var viewModel = OwnerServicesViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Services")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(Color.hermosoCream)

                if viewModel.isLoading {
                    ProgressView()
                        .tint(Color.hermosoPurpleLight)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 30)
                } else if let error = viewModel.errorMessage {
                    ErrorRetryView(message: error, textColor: Color(hex: "#FCA5A5"))
                } else {
                    ForEach(viewModel.services) { service in
                        serviceRow(service)
                    }
                }
            }
            .padding(16)
        }
        .background(Color.hermosoPurpleDeeper)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    private func serviceRow(_ service: ServiceDto) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(service.name ?? "")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color.hermosoCream)
                Text("\(service.duration ?? 0) min")
                    .font(.system(size: 11))
                    .foregroundColor(Color.hermosoTextMuted)
            }
            Spacer()
            Text("PKR \(Int(service.price ?? 0))")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(Color.hermosoPurpleLight)
        }
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    OwnerServicesView()
}
