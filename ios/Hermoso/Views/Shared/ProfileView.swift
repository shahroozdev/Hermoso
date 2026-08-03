import SwiftUI

/// Matches ios/context/SCREENS.md screen 10 / ProfileScreen.kt. Email is
/// read-only and never sent in the update request — only
/// name/phone/city/country/bankAccount are editable.
struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                profileCard
                settingsCard
                passwordCard
            }
            .padding(16)
        }
        .background(Color.hermosoCream)
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") { dismiss() }
            }
        }
        .task { await viewModel.load() }
    }

    private var profileCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            field("Name", $viewModel.name)
            disabledField("Email", viewModel.email)
            field("Phone", $viewModel.phone, keyboard: .phonePad)
            field("City", $viewModel.city)
            field("Country", $viewModel.country)
            field("Bank Account", $viewModel.bankAccount)
            saveMessages
            saveButton
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    @ViewBuilder
    private var saveMessages: some View {
        if let error = viewModel.errorMessage {
            Text(error).font(.footnote).foregroundColor(Color.hermosoError)
        }
        if let success = viewModel.successMessage {
            Text(success).font(.footnote).foregroundColor(Color.hermosoSuccess)
        }
    }

    private var saveButton: some View {
        Button {
            Task { await viewModel.saveProfile() }
        } label: {
            Text(viewModel.isSaving ? "Saving..." : "Update Profile")
                .font(.system(size: 14, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.hermosoPurple)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .disabled(viewModel.isSaving)
    }

    private var settingsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Settings").font(.system(size: 13.5, weight: .bold)).foregroundColor(Color.hermosoTextDark)
            Toggle("Scan Result Alerts", isOn: $viewModel.scanAlertsEnabled)
            Toggle("Booking Reminders", isOn: $viewModel.bookingRemindersEnabled)
        }
        .tint(Color.hermosoPurple)
        .font(.system(size: 13))
        .foregroundColor(Color.hermosoTextDark)
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var passwordCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Change Password").font(.system(size: 13.5, weight: .bold)).foregroundColor(Color.hermosoTextDark)
            secureField("Current Password", $viewModel.currentPassword)
            secureField("New Password", $viewModel.newPassword)
            passwordMessages
            changePasswordButton
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    @ViewBuilder
    private var passwordMessages: some View {
        if let error = viewModel.passwordErrorMessage {
            Text(error).font(.footnote).foregroundColor(Color.hermosoError)
        }
        if let success = viewModel.passwordSuccessMessage {
            Text(success).font(.footnote).foregroundColor(Color.hermosoSuccess)
        }
    }

    private var changePasswordButton: some View {
        Button {
            Task { await viewModel.changePassword() }
        } label: {
            Text(viewModel.isChangingPassword ? "Updating..." : "Change Password")
                .font(.system(size: 14, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundColor(Color.hermosoPurple)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.hermosoPurple, lineWidth: 1.4)
                )
        }
        .disabled(viewModel.isChangingPassword)
    }

    private func field(_ label: String, _ text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.system(size: 11.5, weight: .semibold)).foregroundColor(Color.hermosoTextMuted)
            TextField("", text: text)
                .keyboardType(keyboard)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                )
        }
    }

    private func disabledField(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.system(size: 11.5, weight: .semibold)).foregroundColor(Color.hermosoTextMuted)
            Text(value)
                .font(.system(size: 13))
                .foregroundColor(Color.hermosoTextMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(hex: "#F5F5F5"))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func secureField(_ label: String, _ text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.system(size: 11.5, weight: .semibold)).foregroundColor(Color.hermosoTextMuted)
            SecureField("", text: text)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                )
        }
    }
}

#Preview {
    NavigationStack { ProfileView() }
}
