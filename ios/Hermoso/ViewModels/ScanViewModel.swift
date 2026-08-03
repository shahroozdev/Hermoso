import CoreVideo
import Foundation

/// Not @MainActor: frame analysis runs on CameraService's background session
/// queue by design (Vision work shouldn't block the main thread); @Published
/// mutations from that path are hopped to main explicitly via
/// DispatchQueue.main.async, consistent with CameraService/LocationService.
/// The async capture/upload entry point is individually marked @MainActor.
final class ScanViewModel: ObservableObject {
    @Published var currentStep: LivenessStep = .blink
    @Published var faceDetected = false
    @Published var isValid = false
    @Published var validationMessage = "Position your face in frame"
    @Published var capturedImageData: Data?
    @Published var isAnalyzing = false
    @Published var scanData: ScanAnalyzeData?
    @Published var errorMessage: String?

    let camera = CameraService()
    private let analyzer = FaceLivenessAnalyzer()
    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
        camera.onFrame = { [weak self] pixelBuffer in
            self?.handleFrame(pixelBuffer)
        }
    }

    func start() {
        camera.requestAuthorizationAndConfigure()
    }

    func stop() {
        camera.stop()
    }

    private func handleFrame(_ pixelBuffer: CVPixelBuffer) {
        let result = analyzer.analyze(pixelBuffer: pixelBuffer, orientation: .leftMirrored)
        DispatchQueue.main.async { [weak self] in
            self?.apply(result)
        }
    }

    /// Mirrors Android's validateFace() thresholds exactly (see ScanScreen.kt
    /// / ios/context/SCREENS.md screen 4): roll must stay within ±10° at every
    /// step; each step's own threshold advances the one-directional state
    /// machine. Eye/mouth thresholds are unverified heuristics — see
    /// FaceLivenessAnalyzer's caveat.
    private func apply(_ result: FaceAnalysisResult) {
        guard currentStep != .completed else { return }

        if result.faceCount == 0 {
            faceDetected = false
            isValid = false
            validationMessage = "No face detected"
            return
        }
        if result.faceCount > 1 {
            faceDetected = false
            isValid = false
            validationMessage = "Only one face allowed"
            return
        }
        faceDetected = true

        if let roll = result.rollDegrees, abs(roll) > 10 {
            isValid = false
            validationMessage = "Keep your head straight"
            return
        }

        switch currentStep {
        case .blink:
            validationMessage = "Blink your eyes"
            if let left = result.leftEyeOpenness, let right = result.rightEyeOpenness, left < 0.15, right < 0.15 {
                currentStep = .smile
            }
        case .smile:
            validationMessage = "Now, give us a smile"
            if let smile = result.smileScore, smile > 0.12 {
                currentStep = .turnLeft
            }
        case .turnLeft:
            validationMessage = "Turn your head slightly left"
            if let yaw = result.yawDegrees, yaw > 20 {
                currentStep = .completed
            }
        case .completed:
            break
        }

        if currentStep == .completed {
            isValid = true
            validationMessage = "Face Verified! Ready to scan."
        }
    }

    @MainActor
    func captureAndUpload() async {
        guard currentStep == .completed, !isAnalyzing else { return }
        isAnalyzing = true
        errorMessage = nil
        defer { isAnalyzing = false }

        guard let imageData = await camera.capturePhoto() else {
            errorMessage = "Couldn't capture a photo. Please try again."
            return
        }
        capturedImageData = imageData

        do {
            let response = try await api.analyzeScan(imageData: imageData)
            guard let data = response.data else {
                errorMessage = response.message ?? "Scan analysis failed"
                return
            }
            scanData = data
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func retake() {
        capturedImageData = nil
        scanData = nil
        errorMessage = nil
        currentStep = .blink
        isValid = false
        faceDetected = false
        validationMessage = "Position your face in frame"
    }
}
