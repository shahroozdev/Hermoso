import SwiftUI

/// Matches ios/context/SCREENS.md screen 4, built from the live implementation
/// only — ScanCameraScreen.kt's simulated fake-progress camera is dead code
/// and was not used as a reference (see ARCHITECTURE.md 6b).
///
/// ⚠️ Liveness thresholds (blink/smile) rely on Vision-based heuristics that
/// have not been calibrated against a physical camera — see
/// FaceLivenessAnalyzer's caveat comment before trusting this on-device.
struct ScanView: View {
    @StateObject private var viewModel = ScanViewModel()
    var onViewFullPlan: () -> Void = {}

    var body: some View {
        ZStack {
            Color(hex: "#0A0614").ignoresSafeArea()

            VStack(spacing: 0) {
                header
                if let scanData = viewModel.scanData {
                    resultContent(scanData)
                } else {
                    cameraContent
                }
            }
        }
        .onAppear { viewModel.start() }
        .onDisappear { viewModel.stop() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("AI Skin Scan")
                .font(.title2.bold())
                .foregroundStyle(.white)
            Text("Professional facial analysis & liveness check")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 10)
    }

    private var cameraContent: some View {
        ScrollView {
            VStack(spacing: 14) {
                ZStack {
                    if viewModel.capturedImageData != nil {
                        capturedPreview
                    } else {
                        CameraPreviewView(session: viewModel.camera.session)
                    }
                    FaceOverlayView(faceDetected: viewModel.faceDetected, isValid: viewModel.isValid)
                }
                .frame(height: 380)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .padding(.horizontal, 16)

                validationCard

                if viewModel.capturedImageData == nil {
                    livenessBadges
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(Color.hermosoError)
                        .padding(.horizontal, 16)
                }

                analyzeButton
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
            }
        }
    }

    private var capturedPreview: some View {
        ZStack {
            if let data = viewModel.capturedImageData, let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
            }
            if viewModel.isAnalyzing {
                Color.black.opacity(0.4)
                VStack(spacing: 10) {
                    ProgressView()
                        .tint(Color.hermosoPurpleLight)
                    Text("Analyzing Skin...")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
        }
    }

    private var validationCard: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(viewModel.isValid ? Color(hex: "#10B981") : Color(hex: "#EF4444").opacity(0.5))
                .frame(width: 9, height: 9)
            Text(viewModel.validationMessage)
                .font(.subheadline)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(viewModel.isValid ? Color.hermosoPurple.opacity(0.15) : Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 16)
    }

    private var livenessBadges: some View {
        HStack(spacing: 8) {
            badge("Blink", done: viewModel.currentStep > .blink, active: viewModel.currentStep == .blink)
            badge("Smile", done: viewModel.currentStep > .smile, active: viewModel.currentStep == .smile)
            badge("Turn Left", done: viewModel.currentStep > .turnLeft, active: viewModel.currentStep == .turnLeft)
        }
        .padding(.horizontal, 16)
    }

    private func badge(_ label: String, done: Bool, active: Bool) -> some View {
        let tint = done ? Color(hex: "#10B981") : (active ? Color.hermosoPurpleLight : Color.white.opacity(0.4))
        let fill = done ? Color(hex: "#10B981").opacity(0.18) : (active ? Color.hermosoPurpleLight.opacity(0.18) : Color.white.opacity(0.06))
        return Text(label)
            .font(.system(size: 11.5, weight: .bold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(fill)
            .foregroundStyle(tint)
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(active ? Color.hermosoPurpleLight : Color.clear, lineWidth: 1.4)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var analyzeButton: some View {
        let enabled = viewModel.currentStep == .completed && !viewModel.isAnalyzing
        return Button {
            Task { await viewModel.captureAndUpload() }
        } label: {
            Text("Analyze Now")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(enabled ? Color.hermosoPurple : Color.white.opacity(0.08))
                .foregroundStyle(enabled ? .white : .white.opacity(0.4))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .disabled(!enabled)
    }

    /// Lightweight in-flow result (summary/metrics/recommendedServices only) —
    /// distinct from the full CR-08→CR-15 report, a separate destination that
    /// re-fetches /scans/latest. See ios/context/SCREENS.md screens 4 and 4a.
    private func resultContent(_ data: ScanAnalyzeData) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let imageData = viewModel.capturedImageData, let uiImage = UIImage(data: imageData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 190)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .clipped()
                }

                if let summary = data.summary, !summary.isEmpty {
                    Text(summary)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                }

                ForEach(data.metrics ?? []) { metric in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Text(metric.label ?? metric.key ?? "")
                            Spacer()
                            Text("\(metric.score ?? 0)%")
                        }
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))

                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.08))
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.hermosoPurpleLight, Color(hex: "#EC4899")],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geometry.size.width * CGFloat(metric.score ?? 0) / 100)
                            }
                        }
                        .frame(height: 7)
                    }
                }

                if let services = data.recommendedServices, !services.isEmpty {
                    FlowTagsView(tags: services.compactMap { $0.name })
                }

                HStack(spacing: 10) {
                    Button(action: viewModel.retake) {
                        Text("Retake")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .foregroundStyle(.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1.4)
                            )
                    }
                    Button(action: onViewFullPlan) {
                        Text("View Full Plan")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.hermosoPurple)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }
            .padding(16)
        }
    }
}

#Preview {
    ScanView()
}
