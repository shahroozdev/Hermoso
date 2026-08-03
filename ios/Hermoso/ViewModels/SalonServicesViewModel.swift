import Foundation

@MainActor
final class SalonServicesViewModel: ObservableObject {
    @Published var salon: SalonDetailDto?
    @Published var selectedServiceId: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    let salonId: String
    private let api: AuthApiProtocol

    init(salonId: String, api: AuthApiProtocol = AuthApi()) {
        self.salonId = salonId
        self.api = api
    }

    /// Single GET /salons/{id} — services come embedded, no separate call,
    /// matching SalonServicesScreen.kt.
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getSalon(id: salonId)
            guard let data = response.data else {
                errorMessage = response.message ?? "Failed to load salon"
                return
            }
            salon = data
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var selectedService: ServiceDto? {
        salon?.services?.first(where: { $0.id == selectedServiceId })
    }
}
