import Foundation

struct EventDto: Codable, Identifiable {
    let _id: String?
    let name: String?
    let category: String?
    let description: String?
    let services: [ServiceDto]?

    var id: String { _id ?? UUID().uuidString }
}
