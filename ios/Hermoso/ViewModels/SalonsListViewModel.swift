import Foundation

/// Matches SalonsScreen.kt: two live search fields (name + city), no
/// debounce — fires on every keystroke, unlike HomeView's 300ms debounce.
@MainActor
final class SalonsListViewModel: ObservableObject {
    @Published var salons: [SalonDto] = []
    @Published var searchQuery = ""
    @Published var cityQuery: String
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(initialCity: String? = nil, api: AuthApiProtocol = AuthApi()) {
        self.cityQuery = initialCity ?? ""
        self.api = api
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getSalons(
                page: 1, limit: 50,
                city: cityQuery.isEmpty ? nil : cityQuery,
                search: searchQuery.isEmpty ? nil : searchQuery
            )
            salons = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
