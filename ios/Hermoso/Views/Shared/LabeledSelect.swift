import SwiftUI

/// Custom dropdown (not a native Picker), matching Android's LabeledSelect: a
/// tappable surface showing the selected label + a "▾" indicator, opening a
/// menu of options on tap. See ios/context/SCREENS.md screen 7.
struct LabeledSelect: View {
    let options: [String]
    let selectedIndex: Int?
    let placeholder: String
    var isDisabled: Bool = false
    let onSelect: (Int) -> Void

    var body: some View {
        Menu {
            ForEach(options.indices, id: \.self) { index in
                Button(options[index]) { onSelect(index) }
            }
        } label: {
            HStack {
                Text(displayText)
                    .font(.system(size: 13))
                    .foregroundStyle(selectedIndex != nil ? Color.hermosoTextDark : Color.hermosoTextMuted)
                    .lineLimit(1)
                Spacer()
                Text("▾")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.hermosoPurple)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(isDisabled ? Color(hex: "#F5F5F5") : Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(Color.hermosoPurplePale, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .disabled(isDisabled || options.isEmpty)
    }

    private var displayText: String {
        guard let index = selectedIndex, options.indices.contains(index) else { return placeholder }
        return options[index]
    }
}
