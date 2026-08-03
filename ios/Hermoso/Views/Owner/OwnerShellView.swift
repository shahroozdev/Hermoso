import SwiftUI

/// Owner tab shell. Dark purple ground (purpleDeeper), same purple family as
/// Customer — Android's unused navy/gold palette is intentionally not used
/// here, see ios/context/THEME.md. No Clients tab: unreachable in Android too.
struct OwnerShellView: View {
    @State private var selected: HermosoTab = .ownerDashboard
    @State private var showProfile = false
    @State private var showNotifications = false
    @ObservedObject private var session = SessionManager.shared

    var body: some View {
        VStack(spacing: 0) {
            AppHeaderView(
                unreadCount: 0,
                userInitial: String((session.userName ?? "U").prefix(1)).uppercased(),
                onProfileTap: { showProfile = true },
                onLogoutTap: { session.clearSession() },
                onBellTap: { showNotifications = true }
            )

            Group {
                switch selected {
                case .ownerDashboard:
                    NavigationStack { OwnerDashboardView() }
                case .ownerCalendar:
                    NavigationStack { OwnerCalendarView() }
                case .ownerServices:
                    NavigationStack { OwnerServicesView() }
                case .ownerInsights:
                    NavigationStack { OwnerInsightsView() }
                default:
                    EmptyView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.hermosoPurpleDeeper)

            BottomNavBar(items: BottomNavBar.ownerItems, selected: $selected)
        }
        .ignoresSafeArea(edges: .bottom)
        .sheet(isPresented: $showProfile) { NavigationStack { ProfileView() } }
        .sheet(isPresented: $showNotifications) { NavigationStack { NotificationsView() } }
    }
}

#Preview {
    OwnerShellView()
}
