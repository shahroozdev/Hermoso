import Foundation

protocol AuthApiProtocol {
    func register(_ request: RegisterRequest) async throws -> ApiResponse<RegisterData>
    func verifyOtp(_ request: VerifyOtpRequest) async throws -> ApiResponse<EmptyCodable>
    func resendOtp(_ request: ResendOtpRequest) async throws -> ApiResponse<EmptyCodable>
    func login(_ request: LoginRequest) async throws -> LoginResponse
    func refresh(_ request: RefreshRequest) async throws -> LoginResponse
    func logout(_ request: LogoutRequest) async throws -> ApiResponse<EmptyCodable>

    func getMyProfile() async throws -> ApiResponse<UserProfileDto>
    func updateProfile(_ request: UpdateProfileRequest) async throws -> ApiResponse<UserProfileDto>
    func changePassword(_ request: ChangePasswordRequest) async throws -> ApiResponse<EmptyCodable>

    func getCategories() async throws -> ListResponse<CategoryDto>
    func getSalons(page: Int, limit: Int, city: String?, search: String?) async throws -> ListResponse<SalonDto>
    func getSalon(id: String) async throws -> ApiResponse<SalonDetailDto>
    func createReview(_ request: CreateReviewRequest) async throws -> ApiResponse<EmptyCodable>

    func getBookingOptions(salonId: String, serviceId: String?) async throws -> ApiResponse<BookingOptionsData>
    func getBookingAvailability(salonId: String, serviceId: String, staffId: String, date: String) async throws -> ApiResponse<BookingAvailabilityData>
    func createBooking(_ request: CreateBookingRequest) async throws -> ApiResponse<EmptyCodable>
    func getBookings(page: Int, limit: Int, date: String?, status: String?) async throws -> ListResponse<BookingItemDto>

    func getScanUploadSignature() async throws -> ApiResponse<ScanUploadSignatureData>
    func getScanStatus() async throws -> ApiResponse<ScanStatusData>
    func analyzeScan(imageUrl: String) async throws -> ApiResponse<ScanAnalyzeData>
    func getLatestScan() async throws -> ApiResponse<ScanAnalyzeData>
    func getScanMatches() async throws -> ApiResponse<ScanMatchesData>
    func getScanImprovements() async throws -> ApiResponse<ScanImprovementsData>

    func getNotifications(page: Int, limit: Int, unreadOnly: Bool?) async throws -> ListResponse<NotificationDto>
    func markNotificationRead(id: String) async throws -> ApiResponse<NotificationDto>

    func getEvents(page: Int, limit: Int) async throws -> ApiResponse<[EventDto]>

    func getCustomers(page: Int, limit: Int) async throws -> ListResponse<UserProfileDto>
    func getOwnerDashboard() async throws -> ApiResponse<OwnerDashboardDataDto>
    func getServices(page: Int, limit: Int) async throws -> ListResponse<ServiceDto>

    func createCheckout(bookingId: String) async throws -> ApiResponse<CheckoutData>
    func getPaymentStatus(tracker: String) async throws -> ApiResponse<PaymentStatusData>
    func requestRefund(bookingId: String, reason: String) async throws -> ApiResponse<RefundData>
    func getRefunds(page: Int, limit: Int) async throws -> ListResponse<RefundDto>
}

final class AuthApi: AuthApiProtocol {
    private let network: NetworkService

    init(network: NetworkService = .shared) {
        self.network = network
    }

    func register(_ request: RegisterRequest) async throws -> ApiResponse<RegisterData> {
        try await network.request("auth/register", method: "POST", body: request, requiresAuth: false)
    }

    func verifyOtp(_ request: VerifyOtpRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("auth/verify-otp", method: "POST", body: request, requiresAuth: false)
    }

    func resendOtp(_ request: ResendOtpRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("auth/resend-otp", method: "POST", body: request, requiresAuth: false)
    }

    /// Returns a flat LoginResponse, not ApiResponse<T> — see AuthDTOs.swift.
    func login(_ request: LoginRequest) async throws -> LoginResponse {
        try await network.request("auth/login", method: "POST", body: request, requiresAuth: false)
    }

    func refresh(_ request: RefreshRequest) async throws -> LoginResponse {
        try await network.request("auth/refresh", method: "POST", body: request, requiresAuth: false)
    }

    func logout(_ request: LogoutRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("auth/logout", method: "POST", body: request)
    }

    func getMyProfile() async throws -> ApiResponse<UserProfileDto> {
        try await network.request("users/me")
    }

    func updateProfile(_ request: UpdateProfileRequest) async throws -> ApiResponse<UserProfileDto> {
        try await network.request("users/me", method: "PATCH", body: request)
    }

    func changePassword(_ request: ChangePasswordRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("users/me/password", method: "PATCH", body: request)
    }

    func getCategories() async throws -> ListResponse<CategoryDto> {
        try await network.request("categories")
    }

    func getSalons(page: Int = 1, limit: Int = 20, city: String? = nil, search: String? = nil) async throws -> ListResponse<SalonDto> {
        var query = ["page": "\(page)", "limit": "\(limit)"]
        if let city, !city.isEmpty { query["city"] = city }
        if let search, !search.isEmpty { query["search"] = search }
        return try await network.request("salons", query: query)
    }

    func getSalon(id: String) async throws -> ApiResponse<SalonDetailDto> {
        try await network.request("salons/\(id)")
    }

    func createReview(_ request: CreateReviewRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("reviews", method: "POST", body: request)
    }

    func getBookingOptions(salonId: String, serviceId: String? = nil) async throws -> ApiResponse<BookingOptionsData> {
        var query = ["salonId": salonId]
        if let serviceId { query["serviceId"] = serviceId }
        return try await network.request("bookings/options", query: query)
    }

    func getBookingAvailability(salonId: String, serviceId: String, staffId: String, date: String) async throws -> ApiResponse<BookingAvailabilityData> {
        try await network.request("bookings/availability", query: [
            "salonId": salonId, "serviceId": serviceId, "staffId": staffId, "date": date,
        ])
    }

    func createBooking(_ request: CreateBookingRequest) async throws -> ApiResponse<EmptyCodable> {
        try await network.request("bookings", method: "POST", body: request)
    }

    func getBookings(page: Int = 1, limit: Int = 20, date: String? = nil, status: String? = nil) async throws -> ListResponse<BookingItemDto> {
        var query = ["page": "\(page)", "limit": "\(limit)"]
        if let date { query["date"] = date }
        if let status { query["status"] = status }
        return try await network.request("bookings", query: query)
    }

    func getScanUploadSignature() async throws -> ApiResponse<ScanUploadSignatureData> {
        try await network.request("scans/upload-signature")
    }

    func getScanStatus() async throws -> ApiResponse<ScanStatusData> {
        try await network.request("scans/status")
    }

    /// The photo itself goes straight from the device to Cloudinary (see
    /// CloudinaryUploader) — this only hands the backend the resulting URL,
    /// keeping the multi-megabyte binary out of our own API's request body.
    func analyzeScan(imageUrl: String) async throws -> ApiResponse<ScanAnalyzeData> {
        try await network.request("scans/analyze", method: "POST", body: AnalyzeScanRequest(imageUrl: imageUrl))
    }

    func getLatestScan() async throws -> ApiResponse<ScanAnalyzeData> {
        try await network.request("scans/latest")
    }

    func getScanMatches() async throws -> ApiResponse<ScanMatchesData> {
        try await network.request("scans/matches")
    }

    func getScanImprovements() async throws -> ApiResponse<ScanImprovementsData> {
        try await network.request("scans/improvements")
    }

    func getNotifications(page: Int = 1, limit: Int = 20, unreadOnly: Bool? = nil) async throws -> ListResponse<NotificationDto> {
        var query = ["page": "\(page)", "limit": "\(limit)"]
        // Backend expects the literal string "true"/"false", not a JSON bool — see API_REFERENCE.md.
        if let unreadOnly {
            query["unreadOnly"] = unreadOnly ? "true" : "false"
        }
        return try await network.request("notifications", query: query)
    }

    func markNotificationRead(id: String) async throws -> ApiResponse<NotificationDto> {
        try await network.request("notifications/\(id)/read", method: "PATCH")
    }

    /// Returns a bare ApiResponse<[EventDto]> — no ListMetaDto, unlike other list endpoints.
    func getEvents(page: Int = 1, limit: Int = 10) async throws -> ApiResponse<[EventDto]> {
        try await network.request("events", query: ["page": "\(page)", "limit": "\(limit)"])
    }

    func getCustomers(page: Int = 1, limit: Int = 20) async throws -> ListResponse<UserProfileDto> {
        try await network.request("customers", query: ["page": "\(page)", "limit": "\(limit)"])
    }

    func getOwnerDashboard() async throws -> ApiResponse<OwnerDashboardDataDto> {
        try await network.request("analytics/owner/dashboard")
    }

    func getServices(page: Int = 1, limit: Int = 20) async throws -> ListResponse<ServiceDto> {
        try await network.request("services", query: ["page": "\(page)", "limit": "\(limit)"])
    }

    func createCheckout(bookingId: String) async throws -> ApiResponse<CheckoutData> {
        try await network.request("payments/checkout", method: "POST", body: CheckoutRequest(bookingId: bookingId))
    }

    func getPaymentStatus(tracker: String) async throws -> ApiResponse<PaymentStatusData> {
        try await network.request("payments/\(tracker)/status")
    }

    func requestRefund(bookingId: String, reason: String) async throws -> ApiResponse<RefundData> {
        try await network.request("refunds/request", method: "POST", body: RefundRequest(bookingId: bookingId, reason: reason))
    }

    func getRefunds(page: Int = 1, limit: Int = 20) async throws -> ListResponse<RefundDto> {
        try await network.request("refunds", query: ["page": "\(page)", "limit": "\(limit)"])
    }
}
