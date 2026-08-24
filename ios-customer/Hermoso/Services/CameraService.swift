import AVFoundation
import UIKit

/// Wraps an AVCaptureSession pointed at the front camera. Provides both a
/// live preview layer and throttled per-frame CVPixelBuffers for Vision
/// analysis, plus a still-photo capture path for the final upload image.
///
/// Not @MainActor: the capture session and its delegate callbacks run on a
/// dedicated serial queue by design (Apple's recommended pattern — session
/// work must never block the main thread). @Published properties are hopped
/// to main explicitly where they exist.
final class CameraService: NSObject, ObservableObject {
    let session = AVCaptureSession()

    @Published var isAuthorized = false
    @Published var isSessionRunning = false

    private let videoOutput = AVCaptureVideoDataOutput()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "com.hermoso.camera.session")
    private var lastFrameTime = Date.distantPast

    /// Fires on the session queue (background thread) at ~10fps — throttled
    /// here so Vision analysis isn't run on every camera frame.
    var onFrame: ((CVPixelBuffer) -> Void)?

    private var photoCaptureContinuation: CheckedContinuation<Data?, Never>?

    func requestAuthorizationAndConfigure() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            isAuthorized = true
            configureAndStart()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    self?.isAuthorized = granted
                }
                if granted { self?.configureAndStart() }
            }
        default:
            isAuthorized = false
        }
    }

    private func configureAndStart() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            self.session.beginConfiguration()
            self.session.sessionPreset = .high

            if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
               let input = try? AVCaptureDeviceInput(device: device),
               self.session.canAddInput(input) {
                self.session.addInput(input)
            }

            self.videoOutput.setSampleBufferDelegate(self, queue: self.sessionQueue)
            self.videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
            self.videoOutput.alwaysDiscardsLateVideoFrames = true
            if self.session.canAddOutput(self.videoOutput) {
                self.session.addOutput(self.videoOutput)
            }
            self.videoOutput.connection(with: .video)?.isVideoMirrored = true

            if self.session.canAddOutput(self.photoOutput) {
                self.session.addOutput(self.photoOutput)
            }

            self.session.commitConfiguration()
            self.session.startRunning()
            DispatchQueue.main.async { self.isSessionRunning = true }
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            self?.session.stopRunning()
            DispatchQueue.main.async { self?.isSessionRunning = false }
        }
    }

    /// Captures a still photo, mirrored to match the selfie preview (the iOS
    /// equivalent of Android's explicit postScale(-1,1) mirror-after-capture),
    /// JPEG-encoded at quality 0.8 to match ScanScreen.kt exactly.
    func capturePhoto() async -> Data? {
        await withCheckedContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(returning: nil)
                    return
                }
                self.photoCaptureContinuation = continuation
                let settings = AVCapturePhotoSettings()
                if let connection = self.photoOutput.connection(with: .video) {
                    connection.isVideoMirrored = true
                }
                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }
}

extension CameraService: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let now = Date()
        guard now.timeIntervalSince(lastFrameTime) > 0.1 else { return }
        lastFrameTime = now
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        onFrame?(pixelBuffer)
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard error == nil,
              let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data),
              let jpeg = image.jpegData(compressionQuality: 0.8) else {
            photoCaptureContinuation?.resume(returning: nil)
            photoCaptureContinuation = nil
            return
        }
        photoCaptureContinuation?.resume(returning: jpeg)
        photoCaptureContinuation = nil
    }
}
