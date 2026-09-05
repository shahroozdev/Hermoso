import Foundation

@MainActor
final class OwnerDashboardViewModel: ObservableObject {
    @Published var totals: OwnerDashboardTotalsDto?
    @Published var bookingsByMonth: [MonthBookingChartDto] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getOwnerDashboard()
            guard let data = response.data else {
                errorMessage = response.message ?? "Failed to load dashboard"
                return
            }
            totals = data.totals
            bookingsByMonth = data.charts?.bookingsByMonth ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Conditional card — only rendered when referral bookings/revenue are
    /// non-zero, matching OwnerDashboardScreen.kt exactly.
    var showAiReferrals: Bool {
        (totals?.aiScanBookings ?? 0) > 0 || (totals?.aiScanRevenueInPaisa ?? 0) > 0
    }
}
