import SwiftUI

/// Customer tab shell: persistent AppHeader + custom BottomNavBar, matching
/// Android's Scaffold (native TabView isn't used — the bottom bar is fully
/// custom-styled, see ios/context/THEME.md "Bottom Navigation").
///
/// Profile/Notifications are presented as sheets from the AppHeader's
/// avatar menu / bell — they're reachable identically from every tab, same
/// as Android's global AppHeader dropdown, rather than being pushed onto any
/// one tab's own NavigationStack.
struct CustomerShellView: View {
    @State private var selected: HermosoTab = .customerHome
    @State private var homePath = NavigationPath()
    @State private var scanPath = NavigationPath()
    @State private var showProfile = false
    @State private var showNotifications = false
    @StateObject private var homeViewModel = HomeViewModel()
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
                case .customerHome:
                    homeTab
                case .customerScan:
                    scanTab
                case .customerBookings:
                    NavigationStack { BookingsListView() }
                case .customerTracker:
                    NavigationStack { TrackerView() }
                default:
                    EmptyView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BottomNavBar(items: BottomNavBar.customerItems, selected: $selected)
        }
        .background(Color.hermosoCream)
        .ignoresSafeArea(edges: .bottom)
        .sheet(isPresented: $showProfile) { NavigationStack { ProfileView() } }
        .sheet(isPresented: $showNotifications) { NavigationStack { NotificationsView() } }
    }

    /// Own NavigationStack scoped to the Home tab: Home → SalonsList /
    /// SalonServices → Booking, matching ios/context/SCREENS.md.
    private var homeTab: some View {
        NavigationStack(path: $homePath) {
            HomeView(
                viewModel: homeViewModel,
                onSelectSalon: { salonId in homePath.append(HomeDestination.salonDetail(salonId: salonId)) },
                onSeeAllSalons: { homePath.append(HomeDestination.salonsList) }
            )
            .navigationDestination(for: HomeDestination.self) { destination in
                switch destination {
                case .salonsList:
                    SalonsListView(onSelectSalon: { salonId in homePath.append(HomeDestination.salonDetail(salonId: salonId)) })
                case .salonDetail(let salonId):
                    SalonServicesView(
                        salonId: salonId,
                        onBookService: { serviceId in homePath.append(HomeDestination.booking(salonId: salonId, serviceId: serviceId)) }
                    )
                case .booking(let salonId, let serviceId):
                    BookingView(preselectedSalonId: salonId, preselectedServiceId: serviceId)
                case .paymentSuccess(let tracker):
                    PaymentSuccessView(
                        tracker: tracker,
                        onViewBookings: {
                            homePath = NavigationPath()
                            selected = .customerBookings
                        }
                    )
                case .paymentFailed(let tracker):
                    PaymentFailedView(
                        tracker: tracker,
                        onRetry: {
                            if !homePath.isEmpty { homePath.removeLast() }
                        },
                        onViewBookings: {
                            homePath = NavigationPath()
                            selected = .customerBookings
                        }
                    )
                }
            }
        }
    }

    /// Own NavigationStack scoped to the Scan tab: ScanView → Recommendations
    /// → Match → AI Booking (and a direct link into the full report), matching
    /// the push hierarchy in ios/context/SCREENS.md.
    private var scanTab: some View {
        NavigationStack(path: $scanPath) {
            ScanView(onViewFullPlan: { scanPath.append(ScanDestination.recommendations) })
                .navigationDestination(for: ScanDestination.self) { destination in
                    switch destination {
                    case .recommendations:
                        RecommendationsView(
                            onSelectService: { service in scanPath.append(ScanDestination.booking(serviceId: service.id)) },
                            onViewDetailedReport: { scanPath.append(ScanDestination.fullReport) }
                        )
                    case .fullReport:
                        ScanResultsView(onViewMatchedSalons: { scanPath.append(ScanDestination.match) })
                    case .match:
                        MatchView(onBookNow: { match in
                            scanPath.append(ScanDestination.aiBooking(salonId: match.salonId ?? "", treatments: match.matchedServices ?? []))
                        })
                    case .booking(let serviceId):
                        BookingView(preselectedServiceId: serviceId)
                    case .aiBooking(let salonId, let treatments):
                        AiBookingView(salonId: salonId, treatments: treatments)
                    }
                }
        }
    }
}

#Preview {
    CustomerShellView()
}
