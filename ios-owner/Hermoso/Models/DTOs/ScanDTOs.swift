import Foundation

struct ScanMetricDto: Codable, Identifiable {
    let key: String?
    let score: Int?
    let label: String?

    var id: String { key ?? UUID().uuidString }
}

struct ScanUploadSignatureData: Codable {
    let timestamp: Int?
    let signature: String?
    let apiKey: String?
    let cloudName: String?
    let folder: String?
}

struct ScanStatusData: Codable {
    let aiAvailable: Bool?
    let canScan: Bool?
    let nextScanAt: String?
}

struct AnalyzeScanRequest: Codable {
    let imageUrl: String
}

struct SkinToneDto: Codable {
    let tone: String?
    let evenness: Int?
    let tanningPattern: String?
    let severity: Int?
    let recommendedTreatments: [String]?
}

struct EyebrowAssessmentDto: Codable {
    let archShape: String?
    let fullness: Int?
    let leftRightSymmetry: Int?
    let tailLength: String?
    let sparseness: Int?
    let recommendedTreatments: [String]?
}

struct HydrationDto: Codable {
    let hydrationPercent: Int?
    let dehydrationZones: [String]?
    let textureRating: Int?
    let poreCondition: String?
    let recommendedTreatments: [String]?
}

struct DarkCirclesDto: Codable {
    let type: Int?
    let severity: String?
    let colorDelta: Int?
    let recommendedTreatments: [String]?
}

struct AcneZoneDto: Codable, Identifiable {
    let area: String?
    let severity: Int?
    let type: String?

    var id: String { area ?? UUID().uuidString }
}

struct AcneAnalysisDto: Codable {
    let zones: [AcneZoneDto]?
    let overallSeverity: Int?
    let recommendedTreatments: [String]?
}

struct LipPigmentationDto: Codable {
    let melaninIndex: Int?
    let darknessLevel: String?
    let unevenness: Int?
    let drynessLevel: Int?
    let recommendedTreatments: [String]?
}

struct TreatmentPlanDto: Codable, Identifiable {
    let priority: Int?
    let treatmentName: String?
    let reason: String?
    let pkrPriceRange: String?
    let estimatedDuration: String?

    var id: String { treatmentName ?? UUID().uuidString }
}

struct DietItemDto: Codable, Identifiable {
    let food: String?
    let reason: String?

    var id: String { food ?? UUID().uuidString }
}

struct DietPlanDto: Codable {
    let foodsToEat: [DietItemDto]?
    let foodsToAvoid: [DietItemDto]?
    let dailyWaterIntake: String?
    let specificToSkinTone: Bool?
}

/// Raw scan analysis payload. Virtually every field is nullable on the wire —
/// see the domain-mapping defaults in Models/Domain/ScanResult.swift, which
/// mirrors the exhaustive null-coalescing Android performs before rendering
/// the full report (ios/context/DATA_MODELS.md).
struct ScanAnalyzeData: Codable {
    let scanId: String?
    let faceValid: Bool?
    let faceGuidance: [String]?
    let overallSkinScore: Int?
    let summary: String?
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

struct ScanMatchItemDto: Codable, Identifiable {
    let salonId: String?
    let name: String?
    let city: String?
    let rating: Float?
    let matchPercent: Int?
    let matchedServices: [String]?
    let southAsianSpecialist: Bool?
    let distance: Double?
    let distanceUnit: String?

    var id: String { salonId ?? UUID().uuidString }
}

struct ScanMatchesData: Codable {
    let scanId: String?
    let recommendations: [String]?
    let matches: [ScanMatchItemDto]?
}

struct ImprovementItemDto: Codable, Identifiable {
    let key: String?
    let before: Int?
    let after: Int?
    let delta: Int?
    let positive: Bool?

    var id: String { key ?? UUID().uuidString }
}

struct ScanImprovementsData: Codable {
    let scansCount: Int?
    let firstScanAt: String?
    let latestScanAt: String?
    let improvements: [ImprovementItemDto]?
}
