import SwiftUI

/// Animated border + sweep, matching ScanScreen.kt's FaceOverlay: green when
/// valid, amber when a face is detected but not yet valid, translucent white
/// otherwise. A line sweeps top-to-bottom while detected-but-invalid.
struct FaceOverlayView: View {
    let faceDetected: Bool
    let isValid: Bool

    @State private var sweepProgress: CGFloat = 0.1

    private var borderColor: Color {
        if isValid { return Color(hex: "#10B981") }
        if faceDetected { return Color(hex: "#F59E0B") }
        return Color.white.opacity(0.3)
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(borderColor, lineWidth: isValid ? 4 : 2)
                    .animation(.easeInOut(duration: 0.3), value: isValid)

                if faceDetected, !isValid {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [.clear, Color(hex: "#F59E0B"), .clear],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(height: 2)
                        .position(x: geometry.size.width / 2, y: geometry.size.height * sweepProgress)
                        .onAppear {
                            withAnimation(.linear(duration: 2).repeatForever(autoreverses: true)) {
                                sweepProgress = 0.9
                            }
                        }
                }
            }
        }
    }
}
