import Foundation

@MainActor
final class BookingsListViewModel: ObservableObject {
    @Published var bookings: [BookingItemDto] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    /// All-time list, no date/status filter UI — matches BookingListScreen.kt.
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getBookings(page: 1, limit: 50, date: nil, status: nil)
            bookings = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
