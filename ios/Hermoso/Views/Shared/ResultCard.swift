import SwiftUI

/// Reusable white-card chrome used throughout the full Scan Results report.
struct ResultCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.hermosoTextDark)
            content
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct MetricProgressBar: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                Spacer()
                Text("\(value)%").foregroundStyle(Color.hermosoTextMuted)
            }
            .font(.system(size: 12.5))
            .foregroundStyle(Color.hermosoTextDark)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(hex: "#EEE9F6"))
                    Capsule()
                        .fill(color)
                        .frame(width: geometry.size.width * CGFloat(max(0, min(value, 100))) / 100)
                }
            }
            .frame(height: 8)
        }
    }
}

/// Vertically stacked tag pills — matches ScanResultsScreen.kt's
/// TreatmentTags exactly (a Column, not a wrapped FlowRow, unlike the
/// unused ScanResultsComponents.kt variant).
struct TreatmentTagsList: View {
    let tags: [String]

    var body: some View {
        if !tags.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text("Recommended Treatments")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.hermosoTextMuted)
                ForEach(tags, id: \.self) { tag in
                    Text(tag)
                        .font(.system(size: 11.5, weight: .semibold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.hermosoPurpleDark.opacity(0.1))
                        .foregroundStyle(Color.hermosoPurpleDark)
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                }
            }
        }
    }
}
