import SwiftUI

/// Root router: Splash → Auth or OwnerShellView. Hermoso Business (salon
/// owner) only ever handles the "salon_owner" role — AuthView's login-role
/// guard rejects a customer login before it ever reaches here, so there is
/// no role branching in this router. A silent /auth/refresh fires if a
/// session exists, but it does not by itself force navigation.
struct ContentView: View {
    @ObservedObject private var session = SessionManager.shared
    @State private var showSplash = true
    private let api: AuthApiProtocol = AuthApi()

    var body: some View {
        Group {
            if showSplash {
                SplashView()
            } else if session.isLoggedIn {
                OwnerShellView()
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
