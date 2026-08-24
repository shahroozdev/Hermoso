import SwiftUI

/// Label/value row used in booking summary cards.
struct SummaryRowView: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label).foregroundColor(Color.hermosoTextMuted)
            Spacer()
            Text(value).foregroundColor(Color.hermosoTextDark).fontWeight(.semibold)
        }
        .font(.system(size: 12))
    }
}
