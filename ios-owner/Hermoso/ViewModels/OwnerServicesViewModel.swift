import Foundation

/// ⚠️ Read-only — Android has no add/edit/delete UI despite the "management"
/// name, matching OwnerServicesScreen.kt exactly.
@MainActor
final class OwnerServicesViewModel: ObservableObject {
    @Published var services: [ServiceDto] = []
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
            let response = try await api.getServices(page: 1, limit: 100)
            services = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
