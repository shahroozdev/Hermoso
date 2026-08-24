import Foundation

struct NotificationDto: Codable, Identifiable {
    let _id: String?
    let title: String?
    let message: String?
    let type: String?
    let createdAt: String?
    let isRead: Bool?

    var id: String { _id ?? UUID().uuidString }
}
