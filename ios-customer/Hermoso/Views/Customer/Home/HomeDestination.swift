import Foundation

/// Push destinations reachable from the Home tab, matching the
/// NavigationStack pushes in ios/context/SCREENS.md: Home → SalonsList /
/// SalonServices → Booking.
enum HomeDestination: Hashable {
    case salonsList
    case salonDetail(salonId: String)
    case booking(salonId: String, serviceId: String?)
}
