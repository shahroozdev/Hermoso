import SwiftUI

/// Matches SplashScreen.kt: spring scale-in, gradient runs purpleDark → purpleDeeper
/// (lighter-to-darker), the reverse order of AuthView's gradient. Text reads
/// "AI Aesthetics" here, not "AI-Powered Aesthetics" as on AuthView — a small
/// wording difference Android has between the two screens, kept intentionally.
struct SplashView: View {
    @State private var scale: CGFloat = 0

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.hermosoPurpleDark, Color.hermosoPurpleDeeper],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 14) {
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(Color.white.opacity(0.12))
                    .frame(width: 100, height: 100)
                    .overlay(
                        Text("H")
                            .font(.custom("CormorantGaramond-Light", size: 44))
                            .foregroundStyle(.white)
                    )
                Text("Hermoso")
                    .font(.custom("CormorantGaramond-Light", size: 56))
                    .foregroundStyle(.white)
                Text("AI AESTHETICS")
                    .font(.footnote)
                    .tracking(1.2)
                    .foregroundStyle(.white.opacity(0.6))
            }
            .scaleEffect(scale)
        }
        .onAppear {
            withAnimation(.interpolatingSpring(stiffness: 90, damping: 12)) {
                scale = 1
            }
        }
    }
}

#Preview {
    SplashView()
}
