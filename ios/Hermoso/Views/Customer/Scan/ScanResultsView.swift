import SwiftUI

/// Full CR-08→CR-15 report. Built from ScanResultsScreen.kt (the live route
/// Android actually navigates to) — ScanResultsComponents.kt's dark-theme
/// `*Section` composables (roman-numeral priority cards, medal colors) are
/// dead code and were intentionally not used as a reference. See
/// ios/context/SCREENS.md screen 4a.
struct ScanResultsView: View {
    @StateObject private var viewModel = ScanResultsViewModel()
    var onViewMatchedSalons: () -> Void = {}
    var onReScan: () -> Void = {}

    var body: some View {
        ScrollView {
            content
                .padding(16)
        }
        .background(Color.hermosoCream)
        .navigationTitle("Skin Analysis Report")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 80)
        } else if let error = viewModel.errorMessage {
            VStack(spacing: 14) {
                Text(error)
                    .foregroundStyle(Color.hermosoError)
                Button(action: onReScan) {
                    Text("Go Back")
                        .foregroundStyle(.white)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 11)
                        .background(Color.hermosoPurple)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            .padding(.top, 80)
        } else if let result = viewModel.result {
            // Split across two Groups: SwiftUI's ViewBuilder caps a single
            // block at 10 direct children, and this report has 11 sections.
            VStack(alignment: .leading, spacing: 14) {
                Group {
                    overallScoreCard(result.overallSkinScore)

                    if !result.summary.isEmpty {
                        ResultCard(title: "Summary") {
                            Text(result.summary)
                                .font(.subheadline)
                                .foregroundStyle(Color.hermosoTextDark)
                        }
                    }

                    skinToneCard(result.skinTone)

                    if let eyebrows = result.eyebrows {
                        eyebrowCard(eyebrows)
                    }

                    hydrationCard(result.hydration)
                }

                Group {
                    darkCirclesCard(result.darkCircles)
                    acneCard(result.acne)
                    lipCard(result.lipPigmentation)

                    if !result.treatmentPlan.isEmpty {
                        treatmentPlanCard(result.treatmentPlan)
                    }

                    dietPlanCard(result.dietPlan)
                    actionButtons
                }
            }
        }
    }

    private func overallScoreCard(_ score: Int) -> some View {
        let color: Color = score >= 75 ? .hermosoScoreHigh : (score >= 50 ? .hermosoScoreMid : .hermosoScoreLow)
        return ResultCard(title: "Overall Skin Health Score") {
            ZStack {
                Circle()
                    .stroke(Color(hex: "#EEE9F6"), lineWidth: 16)
                Circle()
                    .trim(from: 0, to: CGFloat(max(0, min(score, 100))) / 100)
                    .stroke(color, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(score)")
                        .font(.system(size: 30, weight: .heavy))
                        .foregroundStyle(color)
                    Text("/ 100")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.hermosoTextMuted)
                }
            }
            .frame(width: 120, height: 120)
            .frame(maxWidth: .infinity)
        }
    }

    private func skinToneCard(_ tone: SkinToneResult) -> some View {
        ResultCard(title: "Skin Tone & Tanning") {
            VStack(alignment: .leading, spacing: 10) {
                Text("Detected Tone: \(tone.tone.capitalized)")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Color.hermosoTextDark)
                MetricProgressBar(label: "Evenness", value: tone.evenness, color: Color(hex: "#A855F7"))
                if !tone.tanningPattern.isEmpty {
                    Text("Tanning Pattern: \(tone.tanningPattern.capitalized)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextDark)
                }
                TreatmentTagsList(tags: tone.recommendedTreatments)
            }
        }
    }

    private func eyebrowCard(_ eyebrows: EyebrowResult) -> some View {
        ResultCard(title: "Eyebrow Assessment") {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 16) {
                    labeledValue("Arch Shape", eyebrows.archShape)
                    labeledValue("Fullness", "\(eyebrows.fullness)/5")
                }
                HStack(alignment: .top, spacing: 16) {
                    MetricProgressBar(label: "Symmetry", value: eyebrows.leftRightSymmetry, color: Color(hex: "#3B82F6"))
                    labeledValue("Tail Length", eyebrows.tailLength)
                }
                TreatmentTagsList(tags: eyebrows.recommendedTreatments)
            }
        }
    }

    private func hydrationCard(_ hydration: HydrationResult) -> some View {
        ResultCard(title: "Hydration & Texture") {
            VStack(alignment: .leading, spacing: 10) {
                MetricProgressBar(label: "Hydration Level", value: hydration.hydrationPercent, color: Color(hex: "#0EA5E9"))
                MetricProgressBar(label: "Texture Rating", value: hydration.textureRating, color: Color.hermosoScoreHigh)
                if !hydration.dehydrationZones.isEmpty {
                    Text("Dehydration Zones: \(hydration.dehydrationZones.joined(separator: ", ").capitalized)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextDark)
                }
                if !hydration.poreCondition.isEmpty {
                    Text("Pores: \(hydration.poreCondition)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextDark)
                }
                TreatmentTagsList(tags: hydration.recommendedTreatments)
            }
        }
    }

    private func darkCirclesCard(_ darkCircles: DarkCirclesResult) -> some View {
        let typeInfo: (label: String, color: Color) = {
            switch darkCircles.type {
            case 1: return ("Type 1 — Pigmentation (brownish)", Color(hex: "#A855F7"))
            case 2: return ("Type 2 — Vascular (bluish/purplish)", Color(hex: "#3B82F6"))
            case 3: return ("Type 3 — Structural (sunken/hollow)", Color(hex: "#F59E0B"))
            default: return ("Unknown", Color.hermosoTextMuted)
            }
        }()
        return ResultCard(title: "Dark Circles") {
            VStack(alignment: .leading, spacing: 10) {
                Text(typeInfo.label)
                    .font(.system(size: 11.5, weight: .bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(typeInfo.color.opacity(0.12))
                    .foregroundStyle(typeInfo.color)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                if !darkCircles.severity.isEmpty {
                    Text("Severity: \(darkCircles.severity.capitalized)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextDark)
                }
                MetricProgressBar(label: "Color Delta", value: darkCircles.colorDelta, color: typeInfo.color)
                TreatmentTagsList(tags: darkCircles.recommendedTreatments)
            }
        }
    }

    private func acneCard(_ acne: AcneResult) -> some View {
        let activeZones = acne.zones.filter { $0.type != "none" }
        return ResultCard(title: "Acne & Breakout Zones") {
            VStack(alignment: .leading, spacing: 10) {
                MetricProgressBar(label: "Overall Severity", value: acne.overallSeverity, color: Color.hermosoScoreLow)
                if activeZones.isEmpty {
                    Text("No active acne zones detected")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextMuted)
                } else {
                    ForEach(activeZones) { zone in
                        VStack(alignment: .leading, spacing: 3) {
                            Text("\(zone.area.replacingOccurrences(of: "-", with: " ").capitalized) — \(zone.type.capitalized) · \(zone.severity)%")
                                .font(.system(size: 12))
                                .foregroundStyle(Color.hermosoTextDark)
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Color(hex: "#FEE2E2"))
                                    Capsule()
                                        .fill(Color.hermosoScoreLow)
                                        .frame(width: geometry.size.width * CGFloat(max(0, min(zone.severity, 100))) / 100)
                                }
                            }
                            .frame(height: 6)
                        }
                    }
                }
                TreatmentTagsList(tags: acne.recommendedTreatments)
            }
        }
    }

    private func lipCard(_ lip: LipPigmentationResult) -> some View {
        ResultCard(title: "Lip Pigmentation") {
            VStack(alignment: .leading, spacing: 10) {
                if !lip.darknessLevel.isEmpty {
                    Text("Darkness Level: \(lip.darknessLevel.capitalized)")
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.hermosoTextDark)
                }
                MetricProgressBar(label: "Melanin Index", value: lip.melaninIndex, color: Color(hex: "#DB2777"))
                HStack(alignment: .top, spacing: 16) {
                    MetricProgressBar(label: "Unevenness", value: lip.unevenness, color: Color(hex: "#F97316"))
                    MetricProgressBar(label: "Dryness", value: lip.drynessLevel, color: Color.hermosoScoreMid)
                }
                TreatmentTagsList(tags: lip.recommendedTreatments)
            }
        }
    }

    private func treatmentPlanCard(_ plan: [TreatmentPlanItem]) -> some View {
        ResultCard(title: "AI Treatment Priority Plan") {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(plan.sorted(by: { $0.priority < $1.priority })) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(item.priority)")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(width: 28, height: 28)
                            .background(priorityColor(item.priority))
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item.treatmentName)
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundStyle(Color.hermosoTextDark)
                            if !item.reason.isEmpty {
                                Text(item.reason)
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color.hermosoTextMuted)
                            }
                            Text("PKR \(item.pkrPriceRange) · \(item.estimatedDuration)")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.hermosoTextMuted)
                        }
                    }
                }
            }
        }
    }

    private func priorityColor(_ priority: Int) -> Color {
        switch priority {
        case 1: return .hermosoScoreLow
        case 2: return .hermosoScoreMid
        default: return .hermosoScoreHigh
        }
    }

    private func dietPlanCard(_ diet: DietPlanResult) -> some View {
        ResultCard(title: "Diet & Nutrition Plan") {
            VStack(alignment: .leading, spacing: 8) {
                if !diet.foodsToEat.isEmpty {
                    Text("Foods to Eat")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(Color.hermosoScoreHigh)
                    ForEach(diet.foodsToEat) { item in
                        dietRow(item, mark: "✓", color: .hermosoScoreHigh)
                    }
                }
                if !diet.foodsToAvoid.isEmpty {
                    Text("Foods to Avoid")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(Color.hermosoError)
                        .padding(.top, 4)
                    ForEach(diet.foodsToAvoid) { item in
                        dietRow(item, mark: "✗", color: .hermosoError)
                    }
                }
                if !diet.dailyWaterIntake.isEmpty {
                    HStack(spacing: 8) {
                        Text("💧")
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Daily Water Intake")
                                .font(.system(size: 10.5))
                                .foregroundStyle(Color.hermosoTextMuted)
                            Text(diet.dailyWaterIntake)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(Color.hermosoTextDark)
                        }
                    }
                    .padding(10)
                    .background(Color(hex: "#0EA5E9").opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .padding(.top, 4)
                }
            }
        }
    }

    private func dietRow(_ item: DietItemResult, mark: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text(mark).foregroundStyle(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(item.food).font(.system(size: 12.5, weight: .bold)).foregroundStyle(Color.hermosoTextDark)
                if !item.reason.isEmpty {
                    Text(item.reason).font(.system(size: 11.5)).foregroundStyle(Color.hermosoTextMuted)
                }
            }
        }
    }

    private func labeledValue(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 11)).foregroundStyle(Color.hermosoTextMuted)
            Text(value.isEmpty ? "—" : value).font(.system(size: 13, weight: .bold)).foregroundStyle(Color.hermosoTextDark)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var actionButtons: some View {
        VStack(spacing: 10) {
            Button(action: onViewMatchedSalons) {
                Text("View Matched Salons")
                    .font(.system(size: 14, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Color.hermosoPurpleDark)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            Button(action: onReScan) {
                Text("Re-scan")
                    .font(.system(size: 14, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .foregroundStyle(Color.hermosoPurpleDark)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.hermosoPurpleDark, lineWidth: 1.4)
                    )
            }
        }
        .padding(.top, 4)
        .padding(.bottom, 20)
    }
}

#Preview {
    NavigationStack { ScanResultsView() }
}
