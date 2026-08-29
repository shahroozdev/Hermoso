import Foundation

@MainActor
final class SalonServicesViewModel: ObservableObject {
    @Published var salon: SalonDetailDto?
    @Published var selectedServiceId: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    @Published var reviewRating = 0
    @Published var reviewComment = ""
    @Published var isSubmittingReview = false
    @Published var reviewError: String?
    @Published var reviewSubmitted = false

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

    func submitReview() async {
        guard reviewRating > 0 else {
            reviewError = "Please select a star rating"
            return
        }
        reviewError = nil
        isSubmittingReview = true
        defer { isSubmittingReview = false }
        do {
            _ = try await api.createReview(CreateReviewRequest(salonId: salonId, rating: reviewRating, comment: reviewComment))
            reviewSubmitted = true
            reviewRating = 0
            reviewComment = ""
        } catch {
            reviewError = error.localizedDescription
        }
    }
}
