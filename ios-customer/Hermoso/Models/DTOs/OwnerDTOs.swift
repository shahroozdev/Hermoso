import Foundation

struct OwnerDashboardTotalsDto: Codable {
    let dailyBookings: Int?
    let upcomingAppointments: Int?
    let grossRevenueInPaisa: Int?
    let netRevenueInPaisa: Int?
    let aiScanBookings: Int?
    let aiScanRevenueInPaisa: Int?
}

struct MonthBookingChartDto: Codable, Identifiable {
    let month: String?
    let totalBookings: Int?

    var id: String { month ?? UUID().uuidString }
}

struct OwnerDashboardChartsDto: Codable {
    let bookingsByMonth: [MonthBookingChartDto]?
}

struct OwnerDashboardDataDto: Codable {
    let totals: OwnerDashboardTotalsDto?
    let charts: OwnerDashboardChartsDto?
}
