import Foundation
import KeychainAccess

/// Tokens live in Keychain; name/role are cached in UserDefaults for quick UI reads.
/// Session existence is defined solely by a non-blank refresh token, matching Android.
///
/// Deliberate fix vs. Android: Android's `clearSession()` leaves the cached `userRole`
/// behind (a default-parameter bug — see ios/context/ARCHITECTURE.md). This
/// implementation clears every field explicitly on logout.
final class SessionManager: ObservableObject {
    static let shared = SessionManager()

    private let keychain = Keychain(service: "com.hermoso.ios.session")
    private let defaults = UserDefaults.standard

    @Published private(set) var isLoggedIn: Bool
    @Published private(set) var userName: String?
    @Published private(set) var userRole: String?

    private enum Keys {
        static let accessToken = "access_token"
        static let refreshToken = "refresh_token"
        static let userName = "user_name"
        static let userRole = "user_role"
    }

    private init() {
        userName = defaults.string(forKey: Keys.userName)
        userRole = defaults.string(forKey: Keys.userRole)
        let refresh = (try? keychain.get(Keys.refreshToken)) ?? nil
        isLoggedIn = !(refresh ?? "").isEmpty
    }

    var accessToken: String? { try? keychain.get(Keys.accessToken) }
    var refreshToken: String? { try? keychain.get(Keys.refreshToken) }

    func hasSession() -> Bool {
        !(refreshToken ?? "").isEmpty
    }

    func saveSession(accessToken: String?, refreshToken: String?, name: String?, role: String?) {
        if let accessToken {
            try? keychain.set(accessToken, key: Keys.accessToken)
        }
        if let refreshToken {
            try? keychain.set(refreshToken, key: Keys.refreshToken)
        }
        if let name {
            userName = name
            defaults.set(name, forKey: Keys.userName)
        }
        if let role {
            userRole = role
            defaults.set(role, forKey: Keys.userRole)
        }
        isLoggedIn = hasSession()
    }

    func clearSession() {
        try? keychain.remove(Keys.accessToken)
        try? keychain.remove(Keys.refreshToken)
        userName = nil
        userRole = nil
        defaults.removeObject(forKey: Keys.userName)
        defaults.removeObject(forKey: Keys.userRole)
        isLoggedIn = false
    }
}
