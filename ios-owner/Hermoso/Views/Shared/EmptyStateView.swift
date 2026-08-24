import SwiftUI

/// Shared "nothing here yet" placeholder, replacing the repeated
/// `Text(...).foregroundColor(.hermosoTextMuted)` block across list screens.
struct EmptyStateView: View {
    let message: String
    var topPadding: CGFloat = 0
    var centered: Bool = false

    var body: some View {
        Text(message)
            .foregroundColor(Color.hermosoTextMuted)
            .padding(.top, topPadding)
            .frame(maxWidth: centered ? .infinity : nil)
    }
}
