import Foundation

/// ⚠️ Not backed by a real insights/analytics API and has no charts — reuses
/// /analytics/owner/dashboard and builds a single templated sentence
/// client-side, matching OwnerInsightsScreen.kt exactly. A real
/// revenue/booking-trend visualization here would be a genuine enhancement
/// beyond Android, not already-spec'd behavior.
@MainActor
final class OwnerInsightsViewModel: ObservableObject {
    @Published var insightText: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        insightText = nil
        defer { isLoading = false }
        do {
            let response = try await api.getOwnerDashboard()
            guard let totals = response.data?.totals else {
                errorMessage = "Unable to fetch AI insight right now."
                return
            }
            let upcoming = totals.upcomingAppointments ?? 0
            let net = Int(totals.netRevenue ?? 0)
            insightText = "AI suggests promoting your top service this week. You have \(upcoming) upcoming bookings and PKR \(net) net revenue trend."
        } catch {
            errorMessage = "Unable to fetch AI insight right now."
        }
    }
}
