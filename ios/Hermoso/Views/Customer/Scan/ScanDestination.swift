import Foundation

/// Push destinations reachable from the Scan tab, matching the NavigationStack
/// pushes in ios/context/SCREENS.md: ScanView → Recommendations → Match →
/// AI Booking, plus a direct link into the full report and the generic
/// Booking flow (see RecommendationsView's note on why that link was added).
enum ScanDestination: Hashable {
    case recommendations
    case fullReport
    case match
    case booking(serviceId: String?)
    case aiBooking(salonId: String, treatments: [String])
}
