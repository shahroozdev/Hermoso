import Foundation

/// Standard 5-step flow. Matches BookingScreen.kt: salon is locked when
/// preselected, and cascading resets on every earlier field change — see
/// ios/context/SCREENS.md screen 7.
///
/// Deliberate improvement over Android: when arriving with only a
/// preselected serviceId (e.g. from RecommendationsView), Android loses that
/// context entirely; this preselects the service once the salon's services
/// list loads, same as it already does for the full AI-match preselect case.
@MainActor
final class BookingViewModel: ObservableObject {
    @Published var salons: [SalonDto] = []
    @Published var services: [ServiceDto] = []
    @Published var staff: [StaffDto] = []
    @Published var slots: [BookingSlotDto] = []

    @Published var selectedSalonId: String?
    @Published var selectedServiceId: String?
    @Published var selectedStaffId: String?
    @Published var selectedDate: Date = Date()
    @Published var selectedTime: String?

    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var checkoutUrl: String?
    @Published var checkoutTracker: String?
    @Published var showCheckout = false

    let isSalonLocked: Bool
    private var pendingPreselectedServiceId: String?
    private let api: AuthApiProtocol

    init(preselectedSalonId: String? = nil, preselectedServiceId: String? = nil, api: AuthApiProtocol = AuthApi()) {
        self.api = api
        self.selectedSalonId = preselectedSalonId
        self.isSalonLocked = preselectedSalonId != nil
        self.pendingPreselectedServiceId = preselectedServiceId
    }

    func start() async {
        await loadInitialSalons()
        if selectedSalonId != nil {
            await loadOptions()
        }
    }

    private func loadInitialSalons() async {
        do {
            let response = try await api.getSalons(page: 1, limit: 50, city: nil, search: nil)
            salons = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func selectSalon(_ id: String) {
        guard selectedSalonId != id else { return }
        selectedSalonId = id
        services = []
        staff = []
        selectedServiceId = nil
        selectedStaffId = nil
        selectedTime = nil
        slots = []
        Task { await loadOptions() }
    }

    func selectService(_ id: String) {
        guard selectedServiceId != id else { return }
        selectedServiceId = id
        selectedStaffId = nil
        selectedTime = nil
        slots = []
        Task { await loadAvailability() }
    }

    func selectStaff(_ id: String) {
        guard selectedStaffId != id else { return }
        selectedStaffId = id
        selectedTime = nil
        slots = []
        Task { await loadAvailability() }
    }

    func selectDate(_ date: Date) {
        let today = Calendar.current.startOfDay(for: Date())
        selectedDate = max(date, today)
        selectedTime = nil
        slots = []
        Task { await loadAvailability() }
    }

    private func loadOptions() async {
        guard let salonId = selectedSalonId else { return }
        do {
            let response = try await api.getBookingOptions(salonId: salonId, serviceId: nil)
            services = response.data?.services ?? []
            staff = response.data?.staff ?? []
            if let pendingId = pendingPreselectedServiceId, services.contains(where: { $0.id == pendingId }) {
                selectedServiceId = pendingId
                pendingPreselectedServiceId = nil
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadAvailability() async {
        guard let salonId = selectedSalonId, let serviceId = selectedServiceId, let staffId = selectedStaffId else { return }
        let dateString = Self.dateFormatter.string(from: selectedDate)
        do {
            let response = try await api.getBookingAvailability(salonId: salonId, serviceId: serviceId, staffId: staffId, date: dateString)
            slots = response.data?.slots ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var canSubmit: Bool {
        selectedSalonId != nil && selectedServiceId != nil && selectedStaffId != nil && selectedTime != nil && !isSubmitting
    }

    /// Only clears the selected time on success (matching Android) — the rest
    /// of the selections stay, allowing a quick repeat booking.
    func submitBooking() async {
        guard canSubmit,
              let salonId = selectedSalonId,
              let serviceId = selectedServiceId,
              let staffId = selectedStaffId,
              let time = selectedTime else { return }
        isSubmitting = true
        errorMessage = nil
        successMessage = nil
        defer { isSubmitting = false }
        do {
            let request = CreateBookingRequest(
                salonId: salonId, serviceId: serviceId, staffId: staffId,
                bookingDate: Self.dateFormatter.string(from: selectedDate), bookingTime: time
            )
            let response = try await api.createBooking(request)
            guard response.success else {
                errorMessage = response.message ?? "Booking failed"
                return
            }
            if let bookingId = (response.data as? [String: Any])?["booking"] as? [String: Any], let id = bookingId["_id"] as? String {
                do {
                    let checkoutResponse = try await api.createCheckout(bookingId: id)
                    if let checkoutUrl = checkoutResponse.data?.checkoutUrl {
                        self.checkoutUrl = checkoutUrl
                        self.checkoutTracker = checkoutResponse.data?.tracker
                        self.showCheckout = true
                        return
                    }
                } catch {
                    // Checkout failed, proceed without payment
                }
            }
            successMessage = "Booking confirmed! You can view it in your appointments."
            selectedTime = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var selectedSalonName: String? { salons.first(where: { $0.id == selectedSalonId })?.name }
    var selectedServiceName: String? { services.first(where: { $0.id == selectedServiceId })?.name }
    var selectedStaffName: String? { staff.first(where: { $0.id == selectedStaffId })?.name }
    var selectedServicePriceInPaisa: Int? { services.first(where: { $0.id == selectedServiceId })?.priceInPaisa }

    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
