import Foundation

struct OwnerDashboardTotalsDto: Codable {
    let dailyBookings: Int?
    let upcomingAppointments: Int?
    let grossRevenue: Double?
    let netRevenue: Double?
    let aiScanBookings: Int?
    let aiScanRevenue: Double?
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
