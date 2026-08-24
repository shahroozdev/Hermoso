import Foundation

@MainActor
final class NotificationsViewModel: ObservableObject {
    @Published var notifications: [NotificationDto] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api: AuthApiProtocol

    init(api: AuthApiProtocol = AuthApi()) {
        self.api = api
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let response = try await api.getNotifications(page: 1, limit: 50, unreadOnly: nil)
            notifications = response.data ?? []
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Optimistically marks read locally, then fires the PATCH in the
    /// background — matching NotificationScreen.kt exactly, no rollback on failure.
    func markRead(_ notification: NotificationDto) {
        guard let index = notifications.firstIndex(where: { $0.id == notification.id }) else { return }
        let original = notifications[index]
        notifications[index] = NotificationDto(
            _id: original._id, title: original.title, message: original.message,
            type: original.type, createdAt: original.createdAt, isRead: true
        )
        guard let id = original._id else { return }
        Task {
            _ = try? await api.markNotificationRead(id: id)
        }
    }
}
