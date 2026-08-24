import Foundation

struct RegisterRequest: Codable {
    let name: String
    let email: String
    let phone: String
    let password: String
    let role: String
}

struct RegisterData: Codable {
    let email: String?
    let phone: String?
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct VerifyOtpRequest: Codable {
    let email: String
    let otp: String
}

struct ResendOtpRequest: Codable {
    let email: String
}

struct RefreshRequest: Codable {
    let refreshToken: String
}

struct LogoutRequest: Codable {
    let refreshToken: String
}

struct UpdateProfileRequest: Codable {
    let name: String?
    let phone: String?
    let city: String?
    let country: String?
    let bankAccount: String?
}

struct ChangePasswordRequest: Codable {
    let currentPassword: String
    let newPassword: String
}

/// /auth/login and /auth/refresh return this shape directly — NOT wrapped in
/// ApiResponse<T> (no "data" key). See ios/context/API_REFERENCE.md.
struct LoginResponse: Codable {
    let success: Bool?
    let message: String?
    let token: String?
    let accessToken: String?
    let refreshToken: String?
    let user: UserDto?
}
