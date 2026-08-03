import Foundation

@MainActor
final class OwnerClientsViewModel: ObservableObject {
    @Published var customers: [UserProfileDto] = []
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
            let response = try await api.getCustomers(page: 1, limit: 100)
            customers = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
