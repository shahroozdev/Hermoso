import SwiftUI

/// Shared error message + optional retry button, replacing the near-identical
/// inline block repeated across list screens. `textColor` defaults to the
/// standard error red; Owner screens pass the lighter `#FCA5A5` since they
/// sit on a dark purple background. Omit `retryAction` for screens that
/// match Android's real (no-retry) behavior.
struct ErrorRetryView: View {
    let message: String
    var textColor: Color = .hermosoError
    var retryColor: Color = .hermosoPurple
    var retryLabel: String = "Retry"
    var retryAction: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Text(message)
                .foregroundColor(textColor)
            if let retryAction {
                Button(retryLabel, action: retryAction)
                    .foregroundColor(retryColor)
            }
        }
    }
}
