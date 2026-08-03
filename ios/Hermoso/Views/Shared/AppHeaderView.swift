import SwiftUI

/// Persistent top bar shown on every logged-in screen. Renders identically for
/// Customer and Owner roles — Android's `isOwnerTheme` parameter is unused/dead,
/// see ios/context/SCREENS.md screen 19.
struct AppHeaderView: View {
    let unreadCount: Int
    let userInitial: String
    var onProfileTap: () -> Void = {}
    var onLogoutTap: () -> Void = {}
    var onBellTap: () -> Void = {}

    var body: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.white.opacity(0.18))
                .frame(width: 26, height: 26)

            Text("Hermoso")
                .font(.custom("CormorantGaramond-Light", size: 22))
                .foregroundStyle(.white)

            Spacer()

            Button(action: onBellTap) {
                ZStack(alignment: .topTrailing) {
                    Circle()
                        .fill(Color.white.opacity(0.15))
                        .frame(width: 32, height: 32)
                        .overlay(
                            Image(systemName: "bell.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(.white)
                        )
                    if unreadCount > 0 {
                        Text(unreadCount > 9 ? "9+" : "\(unreadCount)")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(3)
                            .background(Circle().fill(Color.hermosoNotificationBadge))
                            .offset(x: 4, y: -4)
                    }
                }
            }

            Menu {
                Button("Profile", action: onProfileTap)
                Button("Logout", role: .destructive, action: onLogoutTap)
            } label: {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#EC4899"), Color.hermosoPurpleLight],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 32, height: 32)
                    .overlay(
                        Text(userInitial)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                    )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            LinearGradient(
                colors: [Color.hermosoPurpleDeeper, Color.hermosoPurpleDark, Color.hermosoPurple],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
    }
}

#Preview {
    AppHeaderView(unreadCount: 3, userInitial: "A")
}
