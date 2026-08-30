package com.hermoso.customer.app

import android.content.Context
import com.hermoso.customer.BuildConfig
import okhttp3.Authenticator
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

data class RegisterRequest(
    val name: String,
    val email: String,
    val phone: String,
    val password: String,
    val role: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class VerifyOtpRequest(
    val email: String,
    val otp: String
)

data class ResendOtpRequest(
    val email: String
)

data class RefreshRequest(
    val refreshToken: String
)

data class LogoutRequest(
    val refreshToken: String
)

data class UpdateProfileRequest(
    val name: String,
    val phone: String,
    val city: String,
    val country: String,
    val bankAccount: String
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

data class RegisterData(
    val email: String?,
    val phone: String?
)

data class UserDto(
    val _id: String?,
    val name: String?,
    val email: String?,
    val role: String?
)

data class UserProfileLocationDto(
    val city: String?,
    val country: String?
)

data class UserProfileDto(
    val _id: String?,
    val name: String?,
    val email: String?,
    val phone: String?,
    val location: UserProfileLocationDto?,
    val bankAccount: String?,
    val role: String?
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)

data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val token: String?,
    val accessToken: String?,
    val refreshToken: String?,
    val user: UserDto?
)

data class CategoryDto(
    val _id: String?,
    val name: String?
)

data class SalonLocationDto(
    val city: String?,
    val address: String?
)

data class SalonDto(
    val _id: String?,
    val name: String?,
    val avgRating: Double?,
    val location: SalonLocationDto?,
    val imageUrl: String?
)

data class ListResponse<T>(
    val success: Boolean,
    val data: List<T>?,
    val meta: ListMetaDto? = null
)

data class ListMetaDto(
    val page: Int?,
    val limit: Int?,
    val total: Int?
)
data class ServiceIdDto(
    val _id: String?,
    val name: String?,
    val description: String?,
    val category: String?
)
data class ServiceDto(
    val _id: String?,
    val name: String?,
    val price: Double?,
    val duration: Int?,
    val serviceId: ServiceIdDto?,
    val description:String?
)

data class StaffDto(
    val _id: String?,
    val name: String?
)

data class BookingOptionsData(
    val salon: SalonDto?,
    val services: List<ServiceDto>?,
    val staff: List<StaffDto>?
)

data class BookingSlotDto(
    val time: String?,
    val label: String?,
    val available: Boolean?
)

data class BookingAvailabilityData(
    val date: String?,
    val salonId: String?,
    val serviceId: String?,
    val staffId: String?,
    val serviceDuration: Int?,
    val slots: List<BookingSlotDto>?
)

data class ScanMetricDto(
    val key: String?,
    val score: Int?,
    val label: String?
)

data class ScanUploadSignatureData(
    val timestamp: Long?,
    val signature: String?,
    val apiKey: String?,
    val cloudName: String?,
    val folder: String?
)

data class ScanStatusData(
    val aiAvailable: Boolean?,
    val canScan: Boolean?,
    val nextScanAt: String?
)

data class AnalyzeScanRequest(
    val imageUrl: String
)

// CR-08: Skin Tone & Tanning Analysis
data class SkinToneDto(
    val tone: String?,
    val evenness: Int?,
    val tanningPattern: String?,
    val severity: Int?,
    val recommendedTreatments: List<String>?
)

// CR-09: Eyebrow Assessment
data class EyebrowAssessmentDto(
    val archShape: String?,
    val fullness: Int?,
    val leftRightSymmetry: Int?,
    val tailLength: String?,
    val sparseness: Int?,
    val recommendedTreatments: List<String>?
)

// CR-10: Hydration & Texture
data class HydrationDto(
    val hydrationPercent: Int?,
    val dehydrationZones: List<String>?,
    val textureRating: Int?,
    val poreCondition: String?,
    val recommendedTreatments: List<String>?
)

// CR-11: Dark Circles & Under-Eye
data class DarkCirclesDto(
    val type: Int?, // 1, 2, or 3
    val severity: String?, // "mild", "moderate", "severe"
    val colorDelta: Int?,
    val recommendedTreatments: List<String>?
)

// CR-12: Acne & Breakout Zones
data class AcneZoneDto(
    val area: String?, // "forehead", "nose", "chin", "left-cheek", "right-cheek", "jawline"
    val severity: Int?,
    val type: String? // "active", "healing", "hormonal", "none"
)

data class AcneAnalysisDto(
    val zones: List<AcneZoneDto>?,
    val overallSeverity: Int?,
    val recommendedTreatments: List<String>?
)

// CR-13: Lip Pigmentation
data class LipPigmentationDto(
    val melaninIndex: Int?,
    val darknessLevel: String?, // "light", "medium", "dark", "very-dark"
    val unevenness: Int?,
    val drynessLevel: Int?,
    val recommendedTreatments: List<String>?
)

// CR-14: AI Treatment Priority Plan
data class TreatmentPlanDto(
    val priority: Int?, // 1, 2, 3
    val treatmentName: String?,
    val reason: String?,
    val pkrPriceRange: String?,
    val estimatedDuration: String?
)

// CR-15: Diet & Nutrition Plan
data class DietItemDto(
    val food: String?,
    val reason: String?
)

data class DietPlanDto(
    val foodsToEat: List<DietItemDto>?,
    val foodsToAvoid: List<DietItemDto>?,
    val dailyWaterIntake: String?,
    val specificToSkinTone: Boolean?
)

// CR-27: Comprehensive AI Skin Analysis Result
data class ScanAnalyzeData(
    val scanId: String?,
    val faceValid: Boolean?,
    val faceGuidance: List<String>?,

    // CR-07: Overall skin score
    val overallSkinScore: Int?,
    val summary: String?,

    // Detailed analysis sections (CR-08 to CR-13)
    val skinTone: SkinToneDto?,
    val eyebrows: EyebrowAssessmentDto?,
    val hydration: HydrationDto?,
    val darkCircles: DarkCirclesDto?,
    val acne: AcneAnalysisDto?,
    val lipPigmentation: LipPigmentationDto?,

    // Treatment & diet plans (CR-14, CR-15)
    val treatmentPlan: List<TreatmentPlanDto>?,
    val dietPlan: DietPlanDto?,

    // Legacy fields (backward compatibility)
    val metrics: List<ScanMetricDto>?,
    val recommendedServices: List<ServiceDto>?
)

data class ScanMatchItemDto(
    val salonId: String?,
    val name: String?,
    val city: String?,
    val rating: Float?,
    val matchPercent: Int?,
    val matchedServices: List<String>?,
    val southAsianSpecialist: Boolean?,
    val distance: Double?,
    val distanceUnit: String?
)

data class ScanMatchesData(
    val scanId: String?,
    val recommendations: List<String>?,
    val matches: List<ScanMatchItemDto>?
)

data class ImprovementItemDto(
    val key: String?,
    val before: Int?,
    val after: Int?,
    val delta: Int?,
    val positive: Boolean?
)

data class ScanImprovementsData(
    val scansCount: Int?,
    val firstScanAt: String?,
    val latestScanAt: String?,
    val improvements: List<ImprovementItemDto>?
)

data class BookingItemDto(
    val _id: String?,
    val bookingDate: String?,
    val bookingTime: String?,
    val status: String?,
    val price: Double?,
    val salonId: SalonDto?,
    val serviceId: ServiceDto?,
    val staffId: StaffDto?,
    val userId: UserDto?
)

data class CreateBookingRequest(
    val salonId: String,
    val serviceId: String,
    val staffId: String,
    val bookingDate: String,
    val bookingTime: String
)

data class CheckoutRequest(
    val bookingId: String
)

data class CheckoutData(
    val checkoutUrl: String?,
    val tracker: String?,
    val alreadyPaid: Boolean? = false,
    val message: String? = null
)

data class PaymentStatusData(
    val status: String?,
    val paidAt: String?,
    val amount: Double?,
    val tracker: String?,
    val booking: BookingItemDto?
)

data class RefundRequest(
    val bookingId: String,
    val reason: String
)

data class RefundData(
    val refundId: String?,
    val status: String?,
    val amount: Double?,
    val message: String?
)

data class RefundDto(
    val _id: String?,
    val amount: Double?,
    val status: String?,
    val reason: String?,
    val createdAt: String?
)

data class NotificationDto(
    val _id: String?,
    val title: String?,
    val message: String?,
    val type: String?,
    val isRead: Boolean?,
    val createdAt: String?
)

data class EventDto(
    val _id: String?,
    val name: String?,
    val category: String?,
    val services: List<ServiceDto>?,
    val description: String?
)

data class OwnerDashboardTotalsDto(
    val dailyBookings: Int?,
    val upcomingAppointments: Int?,
    val grossRevenue: Double?,
    val netRevenue: Double?,
    val aiScanBookings: Int?,
    val aiScanRevenue: Double?
)

data class MonthBookingChartDto(
    val month: String?,
    val totalBookings: Int?
)

data class OwnerDashboardChartsDto(
    val bookingsByMonth: List<MonthBookingChartDto>?
)

data class OwnerDashboardDataDto(
    val totals: OwnerDashboardTotalsDto?,
    val charts: OwnerDashboardChartsDto?
)
data class SalonDetailDto(
    val _id: String?,
    val name: String?,
    val ownerId: String?,
    val description: String?,
    val address: String?,
    val phone: String?,
    val imageUrl: String?,
    val images: List<String>?,
    val commissionRate: Int?,
    val reviewsCount: Int?,
    val avgRating: Float?,
    val status: String?,
    val verified: Boolean?,
    val createdAt: String?,
    val updatedAt: String?,
    val __v: Int?,
    val location: LocationDto?,
    val workingHours: WorkingHoursDto?,
    val services: List<ServiceDto>?
)
data class CreateReviewRequest(
    val salonId: String,
    val rating: Int,
    val comment: String
)
data class LocationDto(
    val city: String?,
    val country: String?
)
data class WorkingHoursDto(
    val monday: DayScheduleDto?,
    val tuesday: DayScheduleDto?,
    val wednesday: DayScheduleDto?,
    val thursday: DayScheduleDto?,
    val friday: DayScheduleDto?,
    val saturday: DayScheduleDto?,
    val sunday: DayScheduleDto?
)
data class DayScheduleDto(
    val open: String?,
    val close: String?,
    val off: Boolean?
)
interface AuthApi {
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): ApiResponse<RegisterData>

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body body: VerifyOtpRequest): ApiResponse<Any>

    @POST("auth/resend-otp")
    suspend fun resendOtp(@Body body: ResendOtpRequest): ApiResponse<Any>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout(@Body body: LogoutRequest): ApiResponse<Any>

    @GET("users/me")
    suspend fun getMyProfile(): ApiResponse<UserProfileDto>

    @PATCH("users/me")
    suspend fun updateMyProfile(@Body body: UpdateProfileRequest): ApiResponse<UserProfileDto>

    @PATCH("users/me/password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): ApiResponse<Any>

    @GET("categories")
    suspend fun getCategories(): ListResponse<CategoryDto>

    @GET("salons")
    suspend fun getSalons(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("city") city: String? = null,
        @Query("search") search: String? = null
    ): ListResponse<SalonDto>
    @GET("salons/{id}")
    suspend fun getSalonById(
        @Path("id") id: String
    ): ApiResponse<SalonDetailDto>

    @POST("reviews")
    suspend fun createReview(@Body body: CreateReviewRequest): ApiResponse<Any>

    @GET("bookings/options")
    suspend fun getBookingOptions(
        @Query("salonId") salonId: String,
        @Query("serviceId") serviceId: String? = null
    ): ApiResponse<BookingOptionsData>

    @GET("bookings/availability")
    suspend fun getBookingAvailability(
        @Query("salonId") salonId: String,
        @Query("serviceId") serviceId: String,
        @Query("staffId") staffId: String,
        @Query("date") date: String
    ): ApiResponse<BookingAvailabilityData>

    @POST("bookings")
    suspend fun createBooking(@Body body: CreateBookingRequest): ApiResponse<Any>

    @GET("scans/upload-signature")
    suspend fun getScanUploadSignature(): ApiResponse<ScanUploadSignatureData>

    @GET("scans/status")
    suspend fun getScanStatus(): ApiResponse<ScanStatusData>

    @POST("scans/analyze")
    suspend fun analyzeScan(@Body body: AnalyzeScanRequest): ApiResponse<ScanAnalyzeData>

    @GET("scans/latest")
    suspend fun getLatestScan(): ApiResponse<ScanAnalyzeData>

    @GET("scans/matches")
    suspend fun getScanMatches(): ApiResponse<ScanMatchesData>

    @GET("scans/improvements")
    suspend fun getScanImprovements(): ApiResponse<ScanImprovementsData>

    @GET("bookings")
    suspend fun getBookings(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("date") date: String? = null,
        @Query("status") status: String? = null
    ): ListResponse<BookingItemDto>

    @GET("notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("unreadOnly") unreadOnly: String = "false"
    ): ListResponse<NotificationDto>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@retrofit2.http.Path("id") id: String): ApiResponse<NotificationDto>

    @GET("events")
    suspend fun getEvents(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): ApiResponse<List<EventDto>>

    @GET("customers")
    suspend fun getCustomers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ListResponse<UserProfileDto>

    @GET("analytics/owner/dashboard")
    suspend fun getOwnerDashboard(): ApiResponse<OwnerDashboardDataDto>

    @GET("services")
    suspend fun getServices(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ListResponse<ServiceDto>

    @POST("payments/checkout")
    suspend fun createCheckout(@Body body: CheckoutRequest): ApiResponse<CheckoutData>

    @GET("payments/{tracker}/status")
    suspend fun getPaymentStatus(@Path("tracker") tracker: String): ApiResponse<PaymentStatusData>

    @POST("refunds/request")
    suspend fun requestRefund(@Body body: RefundRequest): ApiResponse<RefundData>

    @GET("refunds")
    suspend fun getRefunds(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ListResponse<RefundDto>
}

object SessionManager {
    private const val PREF = "hermoso_session"
    private const val KEY_ACCESS = "access_token"
    private const val KEY_REFRESH = "refresh_token"
    private const val KEY_NAME = "user_name"
    private const val KEY_ROLE = "user_role"

    private var appContext: Context? = null
    var accessToken: String? = null
        private set
    var refreshToken: String? = null
        private set
    var userName: String? = null
        private set
    var userRole: String? = null
        private set

    fun init(context: Context) {
        appContext = context.applicationContext
        val pref = appContext?.getSharedPreferences(PREF, Context.MODE_PRIVATE) ?: return
        accessToken = pref.getString(KEY_ACCESS, null)
        refreshToken = pref.getString(KEY_REFRESH, null)
        userName = pref.getString(KEY_NAME, null)
        userRole = pref.getString(KEY_ROLE, null)
    }

    fun saveSession(access: String?, refresh: String?, name: String?, role: String? = userRole) {
        accessToken = access
        refreshToken = refresh
        userName = name
        userRole = role
        val pref = appContext?.getSharedPreferences(PREF, Context.MODE_PRIVATE) ?: return
        pref.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .putString(KEY_NAME, name)
            .putString(KEY_ROLE, role)
            .apply()
    }

    fun clearSession() {
        saveSession(null, null, null)
    }

    fun hasSession(): Boolean = !refreshToken.isNullOrBlank()
}

private class TokenAuthenticator(private val refreshApi: AuthApi) : Authenticator {
    @Synchronized
    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null

        val currentRefresh = SessionManager.refreshToken ?: return null
        return try {
            val refreshed = kotlinx.coroutines.runBlocking {
                refreshApi.refresh(RefreshRequest(currentRefresh))
            }
            if (!refreshed.success || refreshed.accessToken.isNullOrBlank() || refreshed.refreshToken.isNullOrBlank()) {
                SessionManager.clearSession()
                null
            } else {
                SessionManager.saveSession(
                    refreshed.accessToken,
                    refreshed.refreshToken,
                    refreshed.user?.name ?: SessionManager.userName,
                    refreshed.user?.role ?: SessionManager.userRole
                )
                response.request.newBuilder()
                    .header("Authorization", "Bearer ${SessionManager.accessToken}")
                    .build()
            }
        } catch (_: Throwable) {
            SessionManager.clearSession()
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var prior = response.priorResponse
        while (prior != null) {
            result++
            prior = prior.priorResponse
        }
        return result
    }
}

object AuthApiClient {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val refreshClient by lazy {
        OkHttpClient.Builder().addInterceptor(logging).build()
    }

    private val refreshApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(refreshClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthApi::class.java)
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val token = SessionManager.accessToken
            val request = if (!token.isNullOrBlank()) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else {
                chain.request()
            }
            chain.proceed(request)
        }
        .authenticator(TokenAuthenticator(refreshApi))
        .addInterceptor(logging)
        .build()

    val api: AuthApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthApi::class.java)
    }
}
