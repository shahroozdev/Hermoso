import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    enum Mode {
        case login, register, otp
    }

    @Published var mode: Mode = .login
    @Published var name = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var password = ""
    @Published var otp = ""
    @Published var selectedRole = "customer"

    @Published var isSubmitting = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let api: AuthApiProtocol
    private let session: SessionManager

    init(api: AuthApiProtocol = AuthApi(), session: SessionManager = .shared) {
        self.api = api
        self.session = session
    }

    private static let emailRegex = try? NSRegularExpression(
        pattern: #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
    )

    private func isValidEmail(_ value: String) -> Bool {
        guard let regex = Self.emailRegex else { return false }
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        return regex.firstMatch(in: value, range: range) != nil
    }

    /// Mirrors AuthScreen.kt's exact validation order (first failing rule wins) —
    /// see ios/context/SCREENS.md, screen 2/3/4.
    private func validate() -> String? {
        if mode == .otp {
            if otp.trimmingCharacters(in: .whitespaces).isEmpty { return "Please enter OTP" }
            if otp.count != 6 { return "OTP must be 6 digits" }
            return nil
        }
        if email.trimmingCharacters(in: .whitespaces).isEmpty { return "Email is required" }
        if !isValidEmail(email) { return "Please enter a valid email address" }
        if password.isEmpty { return "Password is required" }
        if password.count < 6 { return "Password must be at least 6 characters" }
        if mode == .register {
            if name.trimmingCharacters(in: .whitespaces).isEmpty { return "Name is required" }
            if name.count < 2 { return "Name must be at least 2 characters" }
            if phone.trimmingCharacters(in: .whitespaces).isEmpty { return "Phone number is required" }
            if phone.count < 10 { return "Phone number must be at least 10 digits" }
        }
        return nil
    }

    func submit() async {
        if let validationError = validate() {
            errorMessage = validationError
            successMessage = nil
            return
        }
        errorMessage = nil
        successMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            switch mode {
            case .login:
                try await performLogin()
            case .register:
                try await performRegister()
            case .otp:
                try await performVerifyOtp()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func performLogin() async throws {
        let response = try await api.login(LoginRequest(email: email, password: password))
        guard response.success == true, let accessToken = response.accessToken, let refreshToken = response.refreshToken else {
            errorMessage = response.message ?? "Login failed"
            return
        }
        session.saveSession(accessToken: accessToken, refreshToken: refreshToken, name: response.user?.name, role: response.user?.role)
    }

    private func performRegister() async throws {
        let response = try await api.register(RegisterRequest(name: name, email: email, phone: phone, password: password, role: selectedRole))
        guard response.success else {
            errorMessage = response.message ?? "Registration failed"
            return
        }
        // Registering does not auto-login — hand off to OTP verification, matching Android.
        mode = .otp
    }

    private func performVerifyOtp() async throws {
        let response = try await api.verifyOtp(VerifyOtpRequest(email: email, otp: otp))
        guard response.success else {
            errorMessage = response.message ?? "OTP verification failed"
            return
        }
        // OTP success flips back to Login — it never auto-logs the user in, matching Android.
        mode = .login
        otp = ""
        successMessage = "OTP verified. Please login."
    }

    func resendOtp() async {
        do {
            _ = try await api.resendOtp(ResendOtpRequest(email: email))
            successMessage = "OTP resent"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
