import SwiftUI

enum HermosoTab: Hashable {
    case customerHome, customerScan, customerBookings, customerTracker
    case ownerDashboard, ownerCalendar, ownerServices, ownerInsights
}

struct BottomNavItem {
    let tab: HermosoTab
    let label: String
    let systemImage: String
}

/// Always white background regardless of Customer/Owner theme — matches
/// Android exactly (see ios/context/THEME.md "Bottom Navigation").
/// Owner Clients has no tab, matching Android (unreachable screen there).
struct BottomNavBar: View {
    let items: [BottomNavItem]
    @Binding var selected: HermosoTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.tab) { item in
                let isSelected = selected == item.tab
                Button {
                    selected = item.tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.systemImage)
                            .font(.system(size: 20))
                        Text(item.label)
                            .font(.system(size: 10.5, weight: isSelected ? .bold : .medium))
                            .lineLimit(1)
                    }
                    .foregroundStyle(isSelected ? Color.hermosoPurple : Color.hermosoTextMuted)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 24)
        .background(Color.white)
    }
}

extension BottomNavBar {
    static let customerItems: [BottomNavItem] = [
        BottomNavItem(tab: .customerHome, label: "Home", systemImage: "house.fill"),
        BottomNavItem(tab: .customerScan, label: "AI Scan", systemImage: "face.smiling"),
        BottomNavItem(tab: .customerBookings, label: "Bookings", systemImage: "calendar"),
        BottomNavItem(tab: .customerTracker, label: "Progress", systemImage: "chart.line.uptrend.xyaxis"),
    ]

    static let ownerItems: [BottomNavItem] = [
        BottomNavItem(tab: .ownerDashboard, label: "Dashboard", systemImage: "house.fill"),
        BottomNavItem(tab: .ownerCalendar, label: "Calendar", systemImage: "calendar"),
        BottomNavItem(tab: .ownerServices, label: "Services", systemImage: "face.smiling"),
        BottomNavItem(tab: .ownerInsights, label: "Insights", systemImage: "chart.line.uptrend.xyaxis"),
    ]
}
