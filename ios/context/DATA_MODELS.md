# Hermoso iOS - Data Models

> Verified against `AuthApi.kt`/`DataModels.kt`/`ScanModels.kt` and the domain-mapping code in `HermosoApp.kt`'s ScanResults route (2026-08-02 audit).

**⚠️ Nullability rule confirmed from source:** in the real Android DTOs, essentially every field on every model is nullable — including fields that "should" always be present (e.g. `_id`, `name`). The client never assumes a required field. Model all DTO properties in Swift as `Optional`, and don't tighten them to non-optional even where it looks safe — a partial/null API response must decode without throwing. Non-optional, defaulted values only appear in the **domain** models below, which are hand-mapped from the DTOs (see the exact defaulting rules under Scan Models).

## API DTO Models (Codable)

### Auth Models
```swift
struct RegisterRequest: Codable {
    let name: String, email: String, phone: String, password: String, role: String
}
struct LoginRequest: Codable { let email: String, password: String }
struct VerifyOtpRequest: Codable { let email: String, otp: String }
struct ResendOtpRequest: Codable { let email: String }
struct RefreshRequest: Codable { let refreshToken: String }
struct LogoutRequest: Codable { let refreshToken: String }
struct UpdateProfileRequest: Codable { let name, phone, city, country, bankAccount: String }
struct ChangePasswordRequest: Codable { let currentPassword, newPassword: String }

struct LoginResponse: Codable {
    let success: Bool, message: String?
    let token, accessToken, refreshToken: String?
    let user: UserDto?
}
struct ApiResponse<T: Codable>: Codable {
    let success: Bool, message: String?, data: T?
}
struct ListResponse<T: Codable>: Codable {
    let success: Bool, data: [T]?, meta: ListMetaDto?
}
struct ListMetaDto: Codable { let page, limit, total: Int? }
```

### User Models
```swift
struct UserDto: Codable {
    let _id, name, email, role: String?
}
struct UserProfileDto: Codable {
    let _id, name, email, phone, bankAccount, role: String?
    let location: UserProfileLocationDto?
}
struct UserProfileLocationDto: Codable { let city, country: String? }
```

### Salon Models
```swift
struct SalonDto: Codable, Identifiable {
    let _id, name: String?
    let avgRating: Double?
    let location: SalonLocationDto?
    let imageUrl: String?
    var id: String { _id ?? UUID().uuidString }
}
struct SalonLocationDto: Codable { let city, address: String? }
struct SalonDetailDto: Codable {
    let _id, name, description, address, phone, imageUrl: String?
    let images: [String]?
    let avgRating: Double?, reviewsCount: Int?, commissionRate: Int?
    let status, createdAt, updatedAt: String?
    let verified: Bool?
    let location: LocationDto?
    let workingHours: WorkingHoursDto?
    let services: [ServiceDto]?
}
struct LocationDto: Codable { let city, country: String? }
struct WorkingHoursDto: Codable {
    let monday, tuesday, wednesday, thursday, friday, saturday, sunday: DayScheduleDto?
}
struct DayScheduleDto: Codable { let open, close: String?; let off: Bool? }
struct CategoryDto: Codable { let _id, name: String? }
```

### Service Models
```swift
struct ServiceDto: Codable {
    let _id, name, description, category: String?
    let price: Double?, duration: Int?
    let serviceId: ServiceIdDto?
}
struct ServiceIdDto: Codable { let _id, name, description, category: String? }
struct StaffDto: Codable { let _id, name: String? }
```

### Booking Models
```swift
struct BookingOptionsData: Codable { let salon: SalonDto?, services: [ServiceDto]?, staff: [StaffDto]? }
struct BookingSlotDto: Codable { let time, label: String?; let available: Bool? }
struct BookingAvailabilityData: Codable {
    let date, salonId, serviceId, staffId: String?
    let serviceDuration: Int?
    let slots: [BookingSlotDto]?
}
struct CreateBookingRequest: Codable {
    let salonId, serviceId, staffId, bookingDate, bookingTime: String
}
struct BookingItemDto: Codable {
    let _id, bookingDate, bookingTime, status: String?
    let price: Double?
    let salonId: SalonDto?, serviceId: ServiceDto?, staffId: StaffDto?, userId: UserDto?
}
```

### Scan Models
```swift
// CR-07: Overall skin score
struct ScanMetricDto: Codable { let key: String?, score: Int?, label: String? }

// CR-08: Skin Tone & Tanning
struct SkinToneDto: Codable {
    let tone: String?, evenness: Int?, tanningPattern: String?, severity: Int?
    let recommendedTreatments: [String]?
}

// CR-09: Eyebrow Assessment
struct EyebrowAssessmentDto: Codable {
    let archShape: String?, fullness: Int?, leftRightSymmetry: Int?
    let tailLength: String?, sparseness: Int?
    let recommendedTreatments: [String]?
}

// CR-10: Hydration & Texture
struct HydrationDto: Codable {
    let hydrationPercent: Int?, dehydrationZones: [String]?
    let textureRating: Int?, poreCondition: String?
    let recommendedTreatments: [String]?
}

// CR-11: Dark Circles
struct DarkCirclesDto: Codable {
    let type: Int?, severity: String?, colorDelta: Int?
    let recommendedTreatments: [String]?
}

// CR-12: Acne & Breakout Zones
struct AcneZoneDto: Codable { let area: String?, severity: Int?, type: String? }
struct AcneAnalysisDto: Codable {
    let zones: [AcneZoneDto]?, overallSeverity: Int?
    let recommendedTreatments: [String]?
}

// CR-13: Lip Pigmentation
struct LipPigmentationDto: Codable {
    let melaninIndex: Int?, darknessLevel: String?, unevenness: Int?, drynessLevel: Int?
    let recommendedTreatments: [String]?
}

// CR-14: AI Treatment Priority Plan
struct TreatmentPlanDto: Codable {
    let priority: Int?, treatmentName: String?, reason: String?
    let pkrPriceRange: String?, estimatedDuration: String?
}

// CR-15: Diet & Nutrition Plan
struct DietItemDto: Codable { let food: String?, reason: String? }
struct DietPlanDto: Codable {
    let foodsToEat: [DietItemDto]?, foodsToAvoid: [DietItemDto]?
    let dailyWaterIntake: String?, specificToSkinTone: Bool?
}

// CR-27: Comprehensive Scan Result
struct ScanAnalyzeData: Codable {
    let scanId: String?, faceValid: Bool?, faceGuidance: [String]?
    let overallSkinScore: Int?, summary: String?
    let skinTone: SkinToneDto?
    let eyebrows: EyebrowAssessmentDto?
    let hydration: HydrationDto?
    let darkCircles: DarkCirclesDto?
    let acne: AcneAnalysisDto?
    let lipPigmentation: LipPigmentationDto?
    let treatmentPlan: [TreatmentPlanDto]?
    let dietPlan: DietPlanDto?
    let metrics: [ScanMetricDto]?
    let recommendedServices: [ServiceDto]?
}
```

### Scan Match Models
```swift
struct ScanMatchItemDto: Codable {
    let salonId, name, city: String?
    let rating: Float?, matchPercent: Int?
    let matchedServices: [String]?
    let southAsianSpecialist: Bool?
    let distance: Double?, distanceUnit: String?
}
struct ScanMatchesData: Codable {
    let scanId: String?, recommendations: [String]?, matches: [ScanMatchItemDto]?
}
```

### Progress / Improvements
```swift
struct ImprovementItemDto: Codable {
    let key, before, after, delta: Int?; let positive: Bool?
}
struct ScanImprovementsData: Codable {
    let scansCount: Int?, firstScanAt, latestScanAt: String?
    let improvements: [ImprovementItemDto]?
}
```

### Notification Models
```swift
struct NotificationDto: Codable {
    let _id, title, message, type, createdAt: String?; let isRead: Bool?
}
```

### Event Models
```swift
struct EventDto: Codable {
    let _id, name, category, description: String?
    let services: [ServiceDto]?
}
```

### Owner Dashboard Models
```swift
struct OwnerDashboardTotalsDto: Codable {
    let dailyBookings, upcomingAppointments: Int?
    let grossRevenue, netRevenue: Double?
    let aiScanBookings: Int?, aiScanRevenue: Double?
}
struct MonthBookingChartDto: Codable { let month: String?, totalBookings: Int? }
struct OwnerDashboardChartsDto: Codable { let bookingsByMonth: [MonthBookingChartDto]? }
struct OwnerDashboardDataDto: Codable {
    let totals: OwnerDashboardTotalsDto?, charts: OwnerDashboardChartsDto?
}
```

## Domain Models (mapped from DTOs for View use)

⚠️ **This mapping is not a stub — it's a real, exhaustive null-coalescing step done inline where the Scan Results screen is reached in Android** (`HermosoApp.kt`, the `scan-results` route handler). Every nullable DTO field is defaulted to a concrete value before being handed to the view; `eyebrows` is the one section left `Optional` (its card is conditionally hidden when absent — every other section always renders, using empty/zero defaults instead of hiding). Replicate this defaulting exactly so the iOS report never breaks on partial data:

- `overallSkinScore ?? 0`, `summary ?? ""`, `scanId ?? ""`, `faceValid ?? false`, `faceGuidance ?? []`
- Each nested result struct (`skinTone`, `hydration`, `darkCircles`, `acne`, `lipPigmentation`, `dietPlan`) is **always constructed**, never left nil — every one of *their* inner fields individually defaults (`Int? ?? 0`, `String? ?? ""`, `[T]? ?? []`, `Bool? ?? false`)
- `eyebrows` stays `Optional` — only this section is conditionally omitted from the UI when the DTO's `eyebrows` is nil
- `treatmentPlan ?? []`, `metrics ?? []`

```swift
struct ScanResult {
    let scanId: String, faceValid: Bool, faceGuidance: [String]
    let overallSkinScore: Int, summary: String
    let skinTone: SkinToneResult
    let eyebrows: EyebrowResult?   // the ONLY optional section — card hidden in UI when nil
    let hydration: HydrationResult
    let darkCircles: DarkCirclesResult
    let acne: AcneResult
    let lipPigmentation: LipPigmentationResult
    let treatmentPlan: [TreatmentPlanItem]
    let dietPlan: DietPlanResult
    let metrics: [ScanMetricResult]
}
```

**Also note:** `ScanScreen`'s immediate post-capture result view (screen 4 in SCREENS.md) does NOT use this full `ScanResult` domain mapping — it reads the raw `ScanAnalyzeData` DTO directly and only touches `summary`/`metrics`/`recommendedServices`. The full domain-mapped `ScanResult` above is only built for the separate full-report screen (4a), which re-fetches `/scans/latest` independently.

## Enums

```swift
enum UserRole: String { case customer, salonOwner = "salon_owner" }
enum LivenessStep: String { case blink, smile, turnLeft, completed }
enum BookingStatus: String { case pending, confirmed, completed, cancelled }
enum ScanCategory: String, CaseIterable {
    case skinTone, eyebrows, hydration, darkCircles, acne, lipPigmentation, treatmentPlan, dietAnalysis
}
```
