import SwiftUI

/// Animated circular progress ring for the overall skin score. Extracted
/// from ScanResultsView so the fill animates on appear (~1000ms ease-out),
/// matching Android's ScoreRing fill animation — the inline version this
/// replaced snapped straight to the final value.
struct ScoreRingView: View {
    let score: Int
    let color: Color
    var size: CGFloat = 120
    var lineWidth: CGFloat = 16

    @State private var animatedProgress: CGFloat = 0

    private var targetProgress: CGFloat {
        CGFloat(max(0, min(score, 100))) / 100
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color(hex: "#EEE9F6"), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundColor(color)
                Text("/ 100")
                    .font(.system(size: 10))
                    .foregroundColor(Color.hermosoTextMuted)
            }
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.0)) {
                animatedProgress = targetProgress
            }
        }
    }
}
