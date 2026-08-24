import Foundation

struct UserDto: Codable {
    let _id: String?
    let name: String?
    let email: String?
    let role: String?
}

struct UserProfileLocationDto: Codable {
    let city: String?
    let country: String?
}

struct UserProfileDto: Codable, Identifiable {
    let _id: String?
    let name: String?
    let email: String?
    let phone: String?
    let bankAccount: String?
    let role: String?
    let location: UserProfileLocationDto?

    var id: String { _id ?? UUID().uuidString }
}
