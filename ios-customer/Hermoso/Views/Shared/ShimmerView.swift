import SwiftUI

/// Loading placeholder fill — a light-gray band that sweeps left to right on
/// a 1.2s repeating loop, matching Android's `shimmerBrush()` in
/// SkeletonComponents.kt (same duration, same light-gray tone). Use anywhere
/// Android used `.background(brush)`, e.g. inside a `.clipShape(...)`.
struct ShimmerView: View {
    @State private var sweep = false

    private let base = Color(white: 0.85)
    private let highlight = Color(white: 0.95)

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                base
                LinearGradient(colors: [base, highlight, base], startPoint: .leading, endPoint: .trailing)
                    .frame(width: geometry.size.width * 1.5)
                    .offset(x: sweep ? geometry.size.width : -geometry.size.width)
            }
        }
        .clipped()
        .onAppear {
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                sweep = true
            }
        }
    }
}
