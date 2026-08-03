import SwiftUI

/// Matches ios/context/SCREENS.md screen 11 / NotificationScreen.kt.
struct NotificationsView: View {
    @StateObject private var viewModel = NotificationsViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            content
                .padding(16)
        }
        .background(Color.hermosoCream)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") { dismiss() }
            }
        }
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            ProgressView()
                .tint(Color.hermosoPurple)
                .padding(.top, 60)
                .frame(maxWidth: .infinity)
        } else if let error = viewModel.errorMessage {
            ErrorRetryView(message: error)
        } else if viewModel.notifications.isEmpty {
            EmptyStateView(message: "No notifications yet.", topPadding: 60, centered: true)
        } else {
            VStack(spacing: 8) {
                ForEach(viewModel.notifications) { notification in
                    notificationRow(notification)
                }
            }
        }
    }

    private func notificationRow(_ notification: NotificationDto) -> some View {
        let isUnread = !(notification.isRead ?? false)
        return HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                Text(notification.title ?? "")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundColor(Color.hermosoTextDark)
                Text(notification.message ?? "")
                    .font(.system(size: 12))
                    .foregroundColor(Color.hermosoTextMuted)
                if let createdAt = notification.createdAt {
                    Text(HermosoDateFormat.timestamp(createdAt))
                        .font(.system(size: 10.5))
                        .foregroundColor(Color.hermosoTextMuted)
                }
            }
            Spacer()
            if isUnread {
                Button {
                    viewModel.markRead(notification)
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color.hermosoPurple)
                }
                .accessibilityLabel("Mark as read")
            }
        }
        .padding(14)
        .background(isUnread ? Color.hermosoPurplePale : Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

#Preview {
    NavigationStack { NotificationsView() }
}
