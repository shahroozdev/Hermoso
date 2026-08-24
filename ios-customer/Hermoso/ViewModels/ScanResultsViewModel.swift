import Foundation

@MainActor
final class ScanResultsViewModel: ObservableObject {
    @Published var result: ScanResult?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    /// Independent from ScanView's in-flow capture result — always re-fetches
    /// fresh, matching Android's `scan-results` navigation route.
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
            result = ScanResult(dto: data)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
