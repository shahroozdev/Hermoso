import Foundation

struct BookingOptionsData: Codable {
    let salon: SalonDto?
    let services: [ServiceDto]?
    let staff: [StaffDto]?
}

struct BookingSlotDto: Codable, Identifiable {
    let time: String?
    let label: String?
    let available: Bool?

    var id: String { time ?? UUID().uuidString }
}

struct BookingAvailabilityData: Codable {
    let date: String?
    let salonId: String?
    let serviceId: String?
    let staffId: String?
    let serviceDuration: Int?
    let slots: [BookingSlotDto]?
}

struct CreateBookingRequest: Codable {
    let salonId: String
    let serviceId: String
    let staffId: String
    let bookingDate: String
    let bookingTime: String
}

struct BookingItemDto: Codable, Identifiable {
    let _id: String?
    let bookingDate: String?
    let bookingTime: String?
    let status: String?
    let priceInPaisa: Int?
    let salonId: SalonDto?
    let serviceId: ServiceDto?
    let staffId: StaffDto?
    let userId: UserDto?

    var id: String { _id ?? UUID().uuidString }
}
