import Foundation

@MainActor
final class MatchViewModel: ObservableObject {
    @Published var matches: [ScanMatchItemDto] = []
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
            let response = try await api.getScanMatches()
            guard let data = response.data else {
                errorMessage = response.message ?? "No matches found"
                return
            }
            matches = data.matches ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
