package com.example.myapplication.app

// CR-08: Skin Tone & Tanning
data class SkinToneResult(
    val tone: String,
    val evenness: Int,
    val tanningPattern: String,
    val severity: Int,
    val recommendedTreatments: List<String>
)

// CR-09: Eyebrow Assessment
data class EyebrowResult(
    val archShape: String, // flat, natural, over-arched, uneven
    val fullness: Int, // 0-5
    val leftRightSymmetry: Int, // percentage
    val tailLength: String, // short, medium, long
    val sparseness: Int,
    val recommendedTreatments: List<String>
)

// CR-10: Hydration & Texture
data class HydrationResult(
    val hydrationPercent: Int,
    val dehydrationZones: List<String>,
    val textureRating: Int,
    val poreCondition: String,
    val recommendedTreatments: List<String>
)

// CR-11: Dark Circles & Under-Eye
data class DarkCirclesResult(
    val type: Int, // 1=pigmentation, 2=vascular, 3=structural
    val severity: String, // mild, moderate, severe
    val colorDelta: Float,
    val recommendedTreatments: List<String>
)

// CR-12: Acne & Breakout Zones
data class AcneZone(
    val area: String, // forehead, nose, chin, left-cheek, right-cheek, jawline
    val severity: Int,
    val type: String // active, healing, hormonal, none
)

data class AcneResult(
    val zones: List<AcneZone>,
    val overallSeverity: Int,
    val recommendedTreatments: List<String>
)

// CR-13: Lip Pigmentation
data class LipPigmentationResult(
    val melaninIndex: Int,
    val darknessLevel: String, // light, medium, dark, very-dark
    val unevenness: Int,
    val drynessLevel: Int,
    val recommendedTreatments: List<String>
)

// CR-14: AI Treatment Priority Plan
data class TreatmentPlanItem(
    val priority: Int,
    val treatmentName: String,
    val reason: String,
    val pkrPriceRange: String,
    val estimatedDuration: String
)

// CR-15: Diet & Nutrition Plan
data class DietFood(
    val food: String,
    val reason: String
)

data class DietPlanResult(
    val foodsToEat: List<DietFood>,
    val foodsToAvoid: List<DietFood>,
    val dailyWaterIntake: String,
    val specificToSkinTone: Boolean
)

// Scan metric for progress tracking
data class ScanMetricResult(
    val key: String,
    val score: Int,
    val label: String
)

// Complete scan result from backend
data class ScanResult(
    val scanId: String,
    val faceValid: Boolean,
    val faceGuidance: List<String>,
    val overallSkinScore: Int,
    val summary: String,
    val skinTone: SkinToneResult,
    val eyebrows: EyebrowResult?,
    val hydration: HydrationResult,
    val darkCircles: DarkCirclesResult,
    val acne: AcneResult,
    val lipPigmentation: LipPigmentationResult,
    val treatmentPlan: List<TreatmentPlanItem>,
    val dietPlan: DietPlanResult,
    val metrics: List<ScanMetricResult>
)

// Scan history item
data class ScanHistoryItem(
    val id: String,
    val createdAt: String,
    val overallSkinScore: Int,
    val summary: String,
    val skinTone: SkinToneResult?,
    val treatmentPlan: List<TreatmentPlanItem>
)

// Matched salon from scan
data class SalonMatchResult(
    val salonId: String,
    val name: String,
    val city: String,
    val rating: Float,
    val matchPercent: Int,
    val matchedServices: List<String>,
    val southAsianSpecialist: Boolean,
    val distanceKm: Double
)

// CR-02: Scan progress categories
enum class ScanCategory(val displayName: String) {
    SKIN_TONE("Skin Tone & Tanning"),
    EYEBROWS("Eyebrow Shape"),
    HYDRATION("Hydration & Texture"),
    DARK_CIRCLES("Dark Circles"),
    ACNE("Acne Analysis"),
    LIP_PIGMENTATION("Lip Pigmentation"),
    TREATMENT_PLAN("Treatment Planning"),
    DIET_ANALYSIS("Diet Analysis")
}

// Scan progress state
enum class ScanState {
    PENDING,
    IN_PROGRESS,
    COMPLETED
}

data class ScanProgress(
    val category: ScanCategory,
    val state: ScanState
)
