import CoreGraphics
import Vision

struct FaceAnalysisResult {
    let faceCount: Int
    let rollDegrees: Double?
    let yawDegrees: Double?
    /// 0 (closed) ... ~0.4+ (open) — a geometric heuristic, not a classifier probability.
    let leftEyeOpenness: Double?
    let rightEyeOpenness: Double?
    /// 0 (neutral) ... higher (more corner-lift) — a geometric heuristic.
    let smileScore: Double?
}

/// ⚠️ IMPORTANT CAVEAT: Android's liveness check uses ML Kit's face classifier,
/// which returns direct `smilingProbability` / `leftEyeOpenProbability` values.
/// Vision has no equivalent classifier — it only exposes raw landmark contour
/// points. Blink and smile detection here are therefore geometric
/// approximations (eye-aspect-ratio and mouth-corner-lift), not equivalent-
/// fidelity ports of Android's behavior. The thresholds used in
/// ScanViewModel were chosen from first principles and have NOT been
/// calibrated against a physical camera/face in this environment — expect to
/// tune them once this runs on a real device.
///
/// Head roll/yaw (`VNFaceObservation.roll`/`.yaw`), by contrast, map directly
/// and reliably to Android's headEulerAngleZ/Y.
final class FaceLivenessAnalyzer {
    private let sequenceHandler = VNSequenceRequestHandler()

    func analyze(pixelBuffer: CVPixelBuffer, orientation: CGImagePropertyOrientation) -> FaceAnalysisResult {
        let request = VNDetectFaceLandmarksRequest()
        do {
            try sequenceHandler.perform([request], on: pixelBuffer, orientation: orientation)
        } catch {
            return FaceAnalysisResult(faceCount: 0, rollDegrees: nil, yawDegrees: nil, leftEyeOpenness: nil, rightEyeOpenness: nil, smileScore: nil)
        }

        guard let observations = request.results, !observations.isEmpty else {
            return FaceAnalysisResult(faceCount: 0, rollDegrees: nil, yawDegrees: nil, leftEyeOpenness: nil, rightEyeOpenness: nil, smileScore: nil)
        }
        guard observations.count == 1, let face = observations.first else {
            return FaceAnalysisResult(faceCount: observations.count, rollDegrees: nil, yawDegrees: nil, leftEyeOpenness: nil, rightEyeOpenness: nil, smileScore: nil)
        }

        let roll = face.roll.map { Double(truncating: $0) * 180 / .pi }
        let yaw = face.yaw.map { Double(truncating: $0) * 180 / .pi }

        var leftOpenness: Double?
        var rightOpenness: Double?
        var smile: Double?

        if let landmarks = face.landmarks {
            if let leftEye = landmarks.leftEye {
                leftOpenness = eyeOpenness(leftEye)
            }
            if let rightEye = landmarks.rightEye {
                rightOpenness = eyeOpenness(rightEye)
            }
            if let outerLips = landmarks.outerLips {
                smile = smileScore(outerLips)
            }
        }

        return FaceAnalysisResult(
            faceCount: 1,
            rollDegrees: roll,
            yawDegrees: yaw,
            leftEyeOpenness: leftOpenness,
            rightEyeOpenness: rightOpenness,
            smileScore: smile
        )
    }

    /// Eye-aspect-ratio heuristic: vertical span / horizontal span of the eye
    /// contour. Lower means more closed.
    private func eyeOpenness(_ region: VNFaceLandmarkRegion2D) -> Double? {
        let points = region.normalizedPoints
        guard points.count >= 4 else { return nil }
        let xs = points.map { $0.x }
        let ys = points.map { $0.y }
        guard let minX = xs.min(), let maxX = xs.max(), let minY = ys.min(), let maxY = ys.max() else { return nil }
        let width = maxX - minX
        let height = maxY - minY
        guard width > 0 else { return nil }
        return Double(height / width)
    }

    /// Mouth-corner-lift heuristic: how far the mouth corners rise above the
    /// mouth's vertical center, relative to mouth width.
    private func smileScore(_ region: VNFaceLandmarkRegion2D) -> Double? {
        let points = region.normalizedPoints
        guard points.count >= 4 else { return nil }
        let xs = points.map { $0.x }
        let ys = points.map { $0.y }
        guard let minX = xs.min(), let maxX = xs.max(), let minY = ys.min(), let maxY = ys.max() else { return nil }
        let width = maxX - minX
        guard width > 0 else { return nil }
        let centerY = (minY + maxY) / 2
        guard let left = points.min(by: { $0.x < $1.x }), let right = points.max(by: { $0.x < $1.x }) else { return nil }
        let lift = ((centerY - left.y) + (centerY - right.y)) / 2
        return Double(lift / width)
    }
}
