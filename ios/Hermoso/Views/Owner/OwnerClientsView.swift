import SwiftUI

/// Matches ios/context/SCREENS.md screen 17 / OwnerClientsScreen.kt.
/// ⚠️ Unreachable in the current Android app — no bottom-nav tab, no other
/// screen navigates here. Built for parity but intentionally left without a
/// navigation entry point too, matching Android's dead-end status. Add a link
/// from OwnerDashboardView if this should become reachable.
struct OwnerClientsView: View {
    @StateObject private var viewModel = OwnerClientsViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Clients")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(Color.hermosoCream)

                if viewModel.isLoading {
                    ProgressView()
                        .tint(Color.hermosoPurpleLight)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 30)
                } else if let error = viewModel.errorMessage {
                    Text(error).foregroundStyle(Color(hex: "#FCA5A5"))
                } else {
                    ForEach(viewModel.customers) { customer in
                        customerRow(customer)
                    }
                }
            }
            .padding(16)
        }
        .background(Color.hermosoPurpleDeeper)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    private func customerRow(_ customer: UserProfileDto) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(customer.name ?? "")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color.hermosoCream)
            Text(customer.email ?? "")
                .font(.system(size: 11.5))
                .foregroundStyle(Color.hermosoTextMuted)
            if let phone = customer.phone, !phone.isEmpty {
                Text(phone)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.hermosoTextMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.hermosoPurpleDark)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    OwnerClientsView()
}
