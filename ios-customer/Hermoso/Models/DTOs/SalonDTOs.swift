import Foundation

struct SalonLocationDto: Codable {
    let city: String?
    let address: String?
}

struct CreateReviewRequest: Codable {
    let salonId: String
    let rating: Int
    let comment: String
}

struct SalonDto: Codable, Identifiable {
    let _id: String?
    let name: String?
    let avgRating: Double?
    let location: SalonLocationDto?
    let imageUrl: String?

    var id: String { _id ?? UUID().uuidString }
}

struct LocationDto: Codable {
    let city: String?
    let country: String?
}

struct DayScheduleDto: Codable {
    let open: String?
    let close: String?
    let off: Bool?
}

struct WorkingHoursDto: Codable {
    let monday: DayScheduleDto?
    let tuesday: DayScheduleDto?
    let wednesday: DayScheduleDto?
    let thursday: DayScheduleDto?
    let friday: DayScheduleDto?
    let saturday: DayScheduleDto?
    let sunday: DayScheduleDto?
}

struct SalonDetailDto: Codable {
    let _id: String?
    let name: String?
    let description: String?
    let address: String?
    let phone: String?
    let imageUrl: String?
    let images: [String]?
    let avgRating: Double?
    let reviewsCount: Int?
    let commissionRate: Int?
    let status: String?
    let createdAt: String?
    let updatedAt: String?
    let verified: Bool?
    let location: LocationDto?
    let workingHours: WorkingHoursDto?
    let services: [ServiceDto]?
}

struct CategoryDto: Codable, Identifiable {
    let _id: String?
    let name: String?

    var id: String { _id ?? UUID().uuidString }
}
