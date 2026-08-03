import Foundation

/// Matches ProfileScreen.kt exactly, including its side effect of re-caching
/// the session's name/role on load. Settings toggles are local-only state,
/// never sent to any API — same as Android (see ios/context/SCREENS.md
/// screen 10 for the deliberate-parity note on this).
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var city = ""
    @Published var country = ""
    @Published var bankAccount = ""

    @Published var scanAlertsEnabled = true
    @Published var bookingRemindersEnabled = true

    @Published var currentPassword = ""
    @Published var newPassword = ""

    @Published var isLoading = false
    @Published var isSaving = false
    @Published var isChangingPassword = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var passwordErrorMessage: String?
    @Published var passwordSuccessMessage: String?

    private let api: AuthApiProtocol
    private let session: SessionManager

    init(api: AuthApiProtocol = AuthApi(), session: SessionManager = .shared) {
        self.api = api
        self.session = session
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getMyProfile()
            guard let profile = response.data else {
                errorMessage = response.message ?? "Failed to load profile"
                return
            }
            name = profile.name ?? ""
            email = profile.email ?? ""
            phone = profile.phone ?? ""
            city = profile.location?.city ?? ""
            country = profile.location?.country ?? ""
            bankAccount = profile.bankAccount ?? ""
            session.saveSession(accessToken: nil, refreshToken: nil, name: profile.name, role: profile.role)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Validation matches ProfileScreen.kt: name required & ≥2 chars; phone,
    /// if non-blank, must be ≥10 chars. Email is never sent — it's immutable.
    func saveProfile() async {
        errorMessage = nil
        successMessage = nil
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        if trimmedName.isEmpty {
            errorMessage = "Name is required"
            return
        }
        if trimmedName.count < 2 {
            errorMessage = "Name must be at least 2 characters"
            return
        }
        if !phone.trimmingCharacters(in: .whitespaces).isEmpty, phone.count < 10 {
            errorMessage = "Phone number must be at least 10 digits"
            return
        }

        isSaving = true
        defer { isSaving = false }
        do {
            let request = UpdateProfileRequest(name: name, phone: phone, city: city, country: country, bankAccount: bankAccount)
            let response = try await api.updateProfile(request)
            guard response.success else {
                errorMessage = response.message ?? "Failed to update profile"
                return
            }
            successMessage = "Profile updated successfully"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Validation matches ProfileScreen.kt: both required, new ≥6 chars, new
    /// must differ from current.
    func changePassword() async {
        passwordErrorMessage = nil
        passwordSuccessMessage = nil
        if currentPassword.isEmpty || newPassword.isEmpty {
            passwordErrorMessage = "Both password fields are required"
            return
        }
        if newPassword.count < 6 {
            passwordErrorMessage = "New password must be at least 6 characters"
            return
        }
        if newPassword == currentPassword {
            passwordErrorMessage = "New password must be different from current password"
            return
        }

        isChangingPassword = true
        defer { isChangingPassword = false }
        do {
            let response = try await api.changePassword(ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword))
            guard response.success else {
                passwordErrorMessage = response.message ?? "Failed to change password"
                return
            }
            passwordSuccessMessage = "Password changed successfully"
            currentPassword = ""
            newPassword = ""
        } catch {
            passwordErrorMessage = error.localizedDescription
        }
    }
}
