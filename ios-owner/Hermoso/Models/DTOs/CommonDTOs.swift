import Foundation

/// Standard success/message/data envelope. NOT used by /auth/login, /auth/refresh
/// (flat LoginResponse) — see AuthDTOs.swift. /events also breaks this pattern by
/// wrapping a bare array with no ListMetaDto — see EventDTOs.swift.
struct ApiResponse<T: Codable>: Codable {
    let success: Bool
    let message: String?
    let data: T?
    /// Machine-readable failure code (see server ErrorCodes), present on some error
    /// responses so clients can react to a specific case — e.g. ACCOUNT_NOT_VERIFIED.
    let code: String?
}

struct ListMetaDto: Codable {
    let page: Int?
    let limit: Int?
    let total: Int?
}

/// Paginated list envelope used by /salons, /bookings, /notifications, /customers, /services.
struct ListResponse<T: Codable>: Codable {
    let success: Bool?
    let data: [T]?
    let meta: ListMetaDto?
}

/// Placeholder payload for endpoints whose `data` field carries nothing meaningful.
struct EmptyCodable: Codable {}
