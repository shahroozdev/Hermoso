import Foundation

struct ServiceIdDto: Codable {
    let _id: String?
    let name: String?
    let description: String?
    let category: String?
}

struct ServiceDto: Codable, Identifiable {
    let _id: String?
    let name: String?
    let description: String?
    let category: String?
    let price: Double?
    let duration: Int?
    let serviceId: ServiceIdDto?

    var id: String { _id ?? UUID().uuidString }
}

struct StaffDto: Codable, Identifiable {
    let _id: String?
    let name: String?

    var id: String { _id ?? UUID().uuidString }
}
