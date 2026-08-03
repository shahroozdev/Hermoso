import Foundation

@MainActor
final class RecommendationsViewModel: ObservableObject {
    @Published var summary: String = ""
    @Published var services: [ServiceDto] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    /// Reuses /scans/latest but only reads the legacy summary/recommendedServices
    /// fields — a separate, simpler screen from the full CR-08+ report
    /// (ScanResultsView). See ios/context/SCREENS.md screen 4c.
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getLatestScan()
            guard let data = response.data else {
                errorMessage = response.message ?? "No scan found"
                return
            }
            summary = data.summary ?? ""
            services = data.recommendedServices ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
