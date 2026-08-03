import Foundation

struct ScanMetricResult: Identifiable {
    let id = UUID()
    let key: String
    let score: Int
    let label: String
}

struct SkinToneResult {
    let tone: String
    let evenness: Int
    let tanningPattern: String
    let severity: Int
    let recommendedTreatments: [String]
}

struct EyebrowResult {
    let archShape: String
    let fullness: Int
    let leftRightSymmetry: Int
    let tailLength: String
    let sparseness: Int
    let recommendedTreatments: [String]
}

struct HydrationResult {
    let hydrationPercent: Int
    let dehydrationZones: [String]
    let textureRating: Int
    let poreCondition: String
    let recommendedTreatments: [String]
}

struct DarkCirclesResult {
    let type: Int
    let severity: String
    let colorDelta: Int
    let recommendedTreatments: [String]
}

struct AcneZoneResult: Identifiable {
    let id = UUID()
    let area: String
    let severity: Int
    let type: String
}

struct AcneResult {
    let zones: [AcneZoneResult]
    let overallSeverity: Int
    let recommendedTreatments: [String]
}

struct LipPigmentationResult {
    let melaninIndex: Int
    let darknessLevel: String
    let unevenness: Int
    let drynessLevel: Int
    let recommendedTreatments: [String]
}

struct TreatmentPlanItem: Identifiable {
    let id = UUID()
    let priority: Int
    let treatmentName: String
    let reason: String
    let pkrPriceRange: String
    let estimatedDuration: String
}

struct DietItemResult: Identifiable {
    let id = UUID()
    let food: String
    let reason: String
}

struct DietPlanResult {
    let foodsToEat: [DietItemResult]
    let foodsToAvoid: [DietItemResult]
    let dailyWaterIntake: String
    let specificToSkinTone: Bool
}

/// Every section defaults to a concrete (non-optional) value except `eyebrows`,
/// which stays Optional — its card is the only one the UI conditionally hides
/// when the scan didn't return eyebrow data. This mirrors the exhaustive
/// null-coalescing Android performs inline on its `scan-results` navigation
/// route before handing data to the view (see ios/context/DATA_MODELS.md).
struct ScanResult {
    let scanId: String
    let faceValid: Bool
    let faceGuidance: [String]
    let overallSkinScore: Int
    let summary: String
    let skinTone: SkinToneResult
    let eyebrows: EyebrowResult?
    let hydration: HydrationResult
    let darkCircles: DarkCirclesResult
    let acne: AcneResult
    let lipPigmentation: LipPigmentationResult
    let treatmentPlan: [TreatmentPlanItem]
    let dietPlan: DietPlanResult
    let metrics: [ScanMetricResult]

    init(dto: ScanAnalyzeData) {
        scanId = dto.scanId ?? ""
        faceValid = dto.faceValid ?? false
        faceGuidance = dto.faceGuidance ?? []
        overallSkinScore = dto.overallSkinScore ?? 0
        summary = dto.summary ?? ""

        let toneDto = dto.skinTone
        skinTone = SkinToneResult(
            tone: toneDto?.tone ?? "",
            evenness: toneDto?.evenness ?? 0,
            tanningPattern: toneDto?.tanningPattern ?? "",
            severity: toneDto?.severity ?? 0,
            recommendedTreatments: toneDto?.recommendedTreatments ?? []
        )

        if let eyebrowsDto = dto.eyebrows {
            eyebrows = EyebrowResult(
                archShape: eyebrowsDto.archShape ?? "",
                fullness: eyebrowsDto.fullness ?? 0,
                leftRightSymmetry: eyebrowsDto.leftRightSymmetry ?? 0,
                tailLength: eyebrowsDto.tailLength ?? "",
                sparseness: eyebrowsDto.sparseness ?? 0,
                recommendedTreatments: eyebrowsDto.recommendedTreatments ?? []
            )
        } else {
            eyebrows = nil
        }

        let hydrationDto = dto.hydration
        hydration = HydrationResult(
            hydrationPercent: hydrationDto?.hydrationPercent ?? 0,
            dehydrationZones: hydrationDto?.dehydrationZones ?? [],
            textureRating: hydrationDto?.textureRating ?? 0,
            poreCondition: hydrationDto?.poreCondition ?? "",
            recommendedTreatments: hydrationDto?.recommendedTreatments ?? []
        )

        let darkCirclesDto = dto.darkCircles
        darkCircles = DarkCirclesResult(
            type: darkCirclesDto?.type ?? 0,
            severity: darkCirclesDto?.severity ?? "",
            colorDelta: darkCirclesDto?.colorDelta ?? 0,
            recommendedTreatments: darkCirclesDto?.recommendedTreatments ?? []
        )

        let acneDto = dto.acne
        acne = AcneResult(
            zones: (acneDto?.zones ?? []).map {
                AcneZoneResult(area: $0.area ?? "", severity: $0.severity ?? 0, type: $0.type ?? "none")
            },
            overallSeverity: acneDto?.overallSeverity ?? 0,
            recommendedTreatments: acneDto?.recommendedTreatments ?? []
        )

        let lipDto = dto.lipPigmentation
        lipPigmentation = LipPigmentationResult(
            melaninIndex: lipDto?.melaninIndex ?? 0,
            darknessLevel: lipDto?.darknessLevel ?? "",
            unevenness: lipDto?.unevenness ?? 0,
            drynessLevel: lipDto?.drynessLevel ?? 0,
            recommendedTreatments: lipDto?.recommendedTreatments ?? []
        )

        treatmentPlan = (dto.treatmentPlan ?? [])
            .map {
                TreatmentPlanItem(
                    priority: $0.priority ?? 0,
                    treatmentName: $0.treatmentName ?? "",
                    reason: $0.reason ?? "",
                    pkrPriceRange: $0.pkrPriceRange ?? "",
                    estimatedDuration: $0.estimatedDuration ?? ""
                )
            }
            .sorted { $0.priority < $1.priority }

        let dietDto = dto.dietPlan
        dietPlan = DietPlanResult(
            foodsToEat: (dietDto?.foodsToEat ?? []).map { DietItemResult(food: $0.food ?? "", reason: $0.reason ?? "") },
            foodsToAvoid: (dietDto?.foodsToAvoid ?? []).map { DietItemResult(food: $0.food ?? "", reason: $0.reason ?? "") },
            dailyWaterIntake: dietDto?.dailyWaterIntake ?? "",
            specificToSkinTone: dietDto?.specificToSkinTone ?? false
        )

        metrics = (dto.metrics ?? []).map {
            ScanMetricResult(key: $0.key ?? "", score: $0.score ?? 0, label: $0.label ?? "")
        }
    }
}
