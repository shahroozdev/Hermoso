import SwiftUI

/// Row title + optional trailing text-button link — the "Top Salons / See
/// all" pattern from HomeView, extracted so other list sections can reuse it.
struct SectionHeaderView: View {
    let title: String
    var titleColor: Color = .hermosoTextDark
    var actionLabel: String?
    var action: () -> Void = {}

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 15.5, weight: .bold))
                .foregroundColor(titleColor)
            Spacer()
            if let actionLabel {
                Button(action: action) {
                    Text(actionLabel)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color.hermosoPurple)
                }
            }
        }
    }
}
