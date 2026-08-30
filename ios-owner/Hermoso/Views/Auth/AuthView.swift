import SwiftUI

/// Login / Register / OTP-verify for Hermoso Business (salon owner). Sign-up
/// always registers as "salon_owner" — no role selector. Mirrors
/// AuthScreen.kt's validation order. After OTP verify, auto-logs in and
/// calls onNeedSalonSetup to navigate to salon creation.
struct AuthView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var isPasswordVisible = false

    var onNeedSalonSetup: (() -> Void)?

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.hermosoOwnerNavy, Color.hermosoOwnerNavyMid],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                header
                card
            }
        }
        .onAppear {
            viewModel.onNeedSalonSetup = onNeedSalonSetup
        }
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text("Hermoso App")
                .font(.custom("CormorantGaramond-Light", size: 42))
                .foregroundColor(.white)
            Text("Salon Management")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(.top, 76)
        .padding(.bottom, 24)
    }

    private var card: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(title)
                    .font(.title3.bold())
                    .foregroundColor(Color.hermosoTextDark)

                if viewModel.mode == .otp {
                    otpFields
                } else {
                    if viewModel.mode == .register {
                        labeledField("Name", text: $viewModel.name)
                        labeledField("Phone", text: $viewModel.phone, keyboard: .phonePad)
                    }
                    labeledField("Email", text: $viewModel.email, keyboard: .emailAddress)
                    passwordField
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(Color.hermosoError)
                }
                if let success = viewModel.successMessage {
                    Text(success)
                        .font(.footnote)
                        .foregroundColor(Color.hermosoOtpSuccess)
                }

                submitButton

                if viewModel.mode == .otp {
                    Button {
                        Task { await viewModel.resendOtp() }
                    } label: {
                        Text("Resend OTP")
                            .font(.footnote.weight(.semibold))
                            .foregroundColor(Color.hermosoOwnerGold)
                            .frame(maxWidth: .infinity)
                    }
                }

                Button(action: toggleMode) {
                    Text(toggleText)
                        .font(.footnote.weight(.semibold))
                        .foregroundColor(Color.hermosoOwnerGold)
                        .frame(maxWidth: .infinity)
                }
                .padding(.top, 4)
            }
            .padding(24)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .frame(maxWidth: .infinity)
    }

    private var title: String {
        switch viewModel.mode {
        case .otp: return "Verify OTP"
        case .login: return "Welcome Back"
        case .register: return "Create Account"
        }
    }

    private var toggleText: String {
        switch viewModel.mode {
        case .otp: return "Back to Login"
        case .login: return "Don't have an account? Sign Up"
        case .register: return "Already have an account? Login"
        }
    }

    private func toggleMode() {
        viewModel.errorMessage = nil
        viewModel.successMessage = nil
        viewModel.mode = viewModel.mode == .otp ? .login : (viewModel.mode == .login ? .register : .login)
    }

    private func labeledField(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundColor(Color.hermosoTextMuted)
            TextField("", text: text)
                .keyboardType(keyboard)
                .autocapitalization(.none)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
                )
        }
    }

    private var passwordField: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Password")
                .font(.caption.weight(.semibold))
                .foregroundColor(Color.hermosoTextMuted)
            HStack {
                Group {
                    if isPasswordVisible {
                        TextField("", text: $viewModel.password)
                    } else {
                        SecureField("", text: $viewModel.password)
                    }
                }
                Button {
                    isPasswordVisible.toggle()
                } label: {
                    Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
                        .foregroundColor(Color.hermosoTextMuted)
                }
                .accessibilityLabel(isPasswordVisible ? "Hide password" : "Show password")
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.hermosoFieldBorder, lineWidth: 1.4)
            )
        }
    }

    private var otpFields: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Enter the 6-digit code sent to \(viewModel.email)")
                .font(.caption)
                .foregroundColor(Color.hermosoTextMuted)
            TextField("6-digit code", text: $viewModel.otp)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.title3.weight(.bold))
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.hermosoOwnerGold, lineWidth: 1.6)
                )
        }
    }

    private var submitButton: some View {
        Button {
            Task { await viewModel.submit() }
        } label: {
            Text(submitLabel)
                .font(.headline)
                .foregroundColor(Color.hermosoOwnerNavy)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.hermosoOwnerGold)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .disabled(viewModel.isSubmitting)
        .padding(.top, 4)
    }

    private var submitLabel: String {
        switch viewModel.mode {
        case .otp: return viewModel.isSubmitting ? "Verifying..." : "Verify OTP"
        case .login: return viewModel.isSubmitting ? "Logging in..." : "Login"
        case .register: return viewModel.isSubmitting ? "Signing up..." : "Sign Up"
        }
    }
}

#Preview {
    AuthView()
}
