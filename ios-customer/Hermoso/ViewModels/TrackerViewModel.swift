import Foundation

@MainActor
final class TrackerViewModel: ObservableObject {
    @Published var improvements: ScanImprovementsData?
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
            let response = try await api.getScanImprovements()
            improvements = response.data
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Matches TrackerScreen.kt exactly.
    var hasEnoughData: Bool {
        guard let data = improvements else { return false }
        return !(data.improvements?.isEmpty ?? true)
    }
}
