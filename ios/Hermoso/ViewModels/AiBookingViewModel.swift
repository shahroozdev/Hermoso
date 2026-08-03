import Foundation

/// One independent mini booking flow per matched treatment — own
/// staff/date/slots/submit state. Selecting a new staff or date resets only
/// this card's slots, matching BookingScreen.kt's per-card behavior.
@MainActor
final class ServiceBookingCardViewModel: ObservableObject, Identifiable {
    let id = UUID()
    let service: ServiceDto
    let salonId: String

    @Published var staff: [StaffDto]
    @Published var selectedStaffId: String?
    @Published var selectedDate: Date = Date()
    @Published var slots: [BookingSlotDto] = []
    @Published var selectedTime: String?
    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let api: AuthApiProtocol

    init(service: ServiceDto, salonId: String, staff: [StaffDto], api: AuthApiProtocol = AuthApi()) {
        self.service = service
        self.salonId = salonId
        self.staff = staff
        self.api = api
    }

    func selectStaff(_ id: String) {
        selectedStaffId = id
        selectedTime = nil
        slots = []
        Task { await loadAvailability() }
    }

    func selectDate(_ date: Date) {
        selectedDate = date
        selectedTime = nil
        slots = []
        Task { await loadAvailability() }
    }

    private func loadAvailability() async {
        guard let staffId = selectedStaffId else { return }
        let dateString = BookingViewModel.dateFormatter.string(from: selectedDate)
        do {
            let response = try await api.getBookingAvailability(salonId: salonId, serviceId: service.id, staffId: staffId, date: dateString)
            slots = response.data?.slots ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func book() async {
        guard let staffId = selectedStaffId, let time = selectedTime else { return }
        isSubmitting = true
        errorMessage = nil
        successMessage = nil
        defer { isSubmitting = false }
        do {
            let request = CreateBookingRequest(
                salonId: salonId, serviceId: service.id, staffId: staffId,
                bookingDate: BookingViewModel.dateFormatter.string(from: selectedDate), bookingTime: time
            )
            let response = try await api.createBooking(request)
            guard response.success else {
                errorMessage = response.message ?? "Booking failed"
                return
            }
            successMessage = "Booked!"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Matches treatments to services and builds one card view model per match.
/// Matching is a case-insensitive substring check in either direction,
/// exactly like BookingScreen.kt's isAiBooking mode, and runs once.
@MainActor
final class AiBookingViewModel: ObservableObject {
    @Published var cardViewModels: [ServiceBookingCardViewModel] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    let salonId: String
    let treatments: [String]
    private let api: AuthApiProtocol

    init(salonId: String, treatments: [String], api: AuthApiProtocol = AuthApi()) {
        self.salonId = salonId
        self.treatments = treatments
        self.api = api
    }

    func start() async {
        guard cardViewModels.isEmpty else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getBookingOptions(salonId: salonId, serviceId: nil)
            let services = response.data?.services ?? []
            let staff = response.data?.staff ?? []
            cardViewModels = treatments.compactMap { treatment in
                let treatmentLower = treatment.lowercased()
                guard let matched = services.first(where: { service in
                    guard let name = service.name?.lowercased() else { return false }
                    return name.contains(treatmentLower) || treatmentLower.contains(name)
                }) else { return nil }
                return ServiceBookingCardViewModel(service: matched, salonId: salonId, staff: staff)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
