import Foundation

/// ⚠️ Not a real calendar — today's bookings only, matching
/// OwnerCalendarScreen.kt exactly (no date picker, no month grid).
@MainActor
final class OwnerCalendarViewModel: ObservableObject {
    @Published var bookings: [BookingItemDto] = []
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
        let today = BookingViewModel.dateFormatter.string(from: Date())
        do {
            let response = try await api.getBookings(page: 1, limit: 50, date: today, status: nil)
            bookings = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
