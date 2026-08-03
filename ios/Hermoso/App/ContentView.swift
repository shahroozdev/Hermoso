import SwiftUI

/// Root router: Splash → Auth or the role-appropriate tab shell. Mirrors
/// Android's app-launch behavior — a silent /auth/refresh fires if a session
/// exists, but it does not by itself force navigation (see
/// ios/context/SCREENS.md app-shell notes and ARCHITECTURE.md 6a).
struct ContentView: View {
    @ObservedObject private var session = SessionManager.shared
    @State private var showSplash = true
    private let api: AuthApiProtocol = AuthApi()

    var body: some View {
        Group {
            if showSplash {
                SplashView()
            } else if session.isLoggedIn {
                if session.userRole == UserRole.salonOwner.rawValue {
                    OwnerShellView()
                } else {
                    CustomerShellView()
                }
            } else {
                AuthView()
            }
        }
        .task {
            async let silentRefresh: Void = refreshSessionIfNeeded()
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await silentRefresh
            showSplash = false
        }
    }

    private func refreshSessionIfNeeded() async {
        guard let refreshToken = session.refreshToken, !refreshToken.isEmpty else { return }
        do {
            let response = try await api.refresh(RefreshRequest(refreshToken: refreshToken))
            if response.success == true, let accessToken = response.accessToken, let newRefreshToken = response.refreshToken {
                session.saveSession(
                    accessToken: accessToken,
                    refreshToken: newRefreshToken,
                    name: response.user?.name,
                    role: response.user?.role
                )
            }
        } catch {
            // Silent — mirrors Android's non-blocking launch refresh.
        }
    }
}

#Preview {
    ContentView()
}
