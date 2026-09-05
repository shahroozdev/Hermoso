import { useState } from "react";
import NotificationModal, { NotificationFormModal, type NotificationRecord } from "../../components/NotificationModal";
import NotificationDetailModal from "../../components/NotificationDetailModal";
import GenericModal from "@/components/GenericModal";
import ActionsMenu from "@/components/ActionsMenu";
import TABLE from "@/components/table";
import { useInvalidate } from "../../hooks/useInvalidate";
import { useApi } from "../../hooks/useApi";
import { notificationService } from "@/services/notificationService";
import { formatDateInput, formatTimeAMPM } from "@/utils/format";

interface NotificationItem extends NotificationRecord {
  type: string;
  isRead: boolean;
  createdAt: string;
  recipientCount?: number;
}

const roleLabel = (role: string): string => {
  if (role === "customer") return "Customers";
  if (role === "salon_owner") return "Salon Owners";
  if (role === "staff") return "Staff";
  return role || "All Users";
};

const AdminNotificationsPage = () => {
  const [viewNotif, setViewNotif] = useState<NotificationItem | null>(null);
  const [editNotif, setEditNotif] = useState<NotificationItem | null>(null);
  const [recipientsNotif, setRecipientsNotif] = useState<NotificationItem | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const invalidate = useInvalidate();

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      invalidate(['notifications']);
    } catch {
      alert("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.list({
        unreadOnly: "true",
        limit: 500,
      });
      const unread: NotificationItem[] = res?.data || [];
      if (!unread.length) return;
      const results = await Promise.allSettled(
        unread.map((n) => notificationService.markRead(n._id)),
      );
      invalidate();
      if (results.some((r) => r.status === "rejected")) {
        alert("Some notifications could not be marked as read");
      }
    } catch {
      alert("Failed to mark all as read");
    }
  };

  const handleSendNow = async (id: string) => {
    setSendingId(id);
    try {
      await notificationService.send(id);
      invalidate(['notifications']);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ha-act-btn" onClick={handleMarkAllRead}>
            Mark All Read
          </button>
          <NotificationModal />
        </div>
      </div>
      <TABLE<NotificationItem>
        title="All Notifications"
        queryKey={["notifications"]}
        showPagination
        service={notificationService.list}
        columns={[
          { title: "Title" },
          { title: "Message" },
          { title: "Audience" },
          { title: "Type", size: "150px" },
          { title: "Sent", size: "120px" },
          { title: "Status" },
          { title: "Recipients", size: "100px" },
          { title: "Actions" },
        ]}
        rows={(data) =>
          data?.map((item) => {
            const isDraft = item.status === "draft";
            const isSending = sendingId === item._id;
            return [
              <span className="ha-salon-name" style={{ fontSize: 14 }}>
                {item.title}
              </span>,
              <span
                className="ha-salon-sub"
                style={{
                  fontSize: 13,
                  maxWidth: 250,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.message || "-"}
              </span>,
              roleLabel(item.targetRole),
              <span className="ha-pill ha-pill-booking">
                {(item.type || "system").replace("_", " ")}
              </span>,
              <p>
                {formatDateInput(item.createdAt)} <br />
                <span className="text-gray-400">
                  {formatTimeAMPM(item.createdAt)}
                </span>
              </p>,
              <span
                className={
                  isDraft
                    ? "ha-pill ha-pill-pending"
                    : "ha-pill ha-pill-active"
                }
              >
                {isDraft ? "Unsent" : "Sent"}
              </span>,
              isDraft ? "-" : (item.recipientCount ?? 0).toLocaleString(),
              <ActionsMenu
                items={[
                  { label: "View", onClick: () => setViewNotif(item) },
                  ...(isDraft
                    ? [
                        { label: "Edit", onClick: () => setEditNotif(item) },
                        {
                          label: isSending ? "Sending..." : "Send Now",
                          onClick: () => handleSendNow(item._id),
                        },
                      ]
                    : []),
                  ...(!isDraft && !item.isRead
                    ? [{ label: "Mark Read", onClick: () => handleMarkRead(item._id) }]
                    : []),
                  ...(!isDraft
                    ? [{ label: "View Recipients", onClick: () => setRecipientsNotif(item) }]
                    : []),
                ]}
              />,
            ];
          })
        }
      />

      {viewNotif && (
        <NotificationDetailModal
          notification={viewNotif}
          onClose={() => setViewNotif(null)}
        />
      )}

      {editNotif && (
        <NotificationFormModal
          notification={editNotif}
          onClose={() => setEditNotif(null)}
        />
      )}

      {recipientsNotif && (
        <RecipientReportModal
          notification={recipientsNotif}
          onClose={() => setRecipientsNotif(null)}
        />
      )}
    </div>
  );
};

interface Recipient {
  _id: string;
  user?: { name?: string; email?: string; role?: string } | null;
  isRead: boolean;
}

const RecipientReportModal = ({
  notification,
  onClose,
}: {
  notification: NotificationItem;
  onClose: () => void;
}) => {
  const { data, loading, error } = useApi(
    () => notificationService.getRecipients(notification._id),
    ["notification-recipients", notification._id],
  );
  const recipients: Recipient[] = data?.data || [];
  const readCount = recipients.filter((r) => r.isRead).length;

  return (
    <GenericModal
      title={`Recipients: ${notification.title}`}
      onClose={onClose}
      wide
      footer={
        <button type="button" className="ha-btn-primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading recipients...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {recipients.length.toLocaleString()} recipient{recipients.length === 1 ? "" : "s"} &middot;{" "}
            {readCount.toLocaleString()} read
          </p>
          <div className="ha-table-scroll">
            <table className="ha-salon-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Read</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r._id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">{r.user?.name || "Deleted user"}</td>
                    <td className="px-3 py-2">{r.user?.email || "-"}</td>
                    <td className="px-3 py-2 capitalize">{(r.user?.role || "-").replace("_", " ")}</td>
                    <td className="px-3 py-2">{r.isRead ? "Read" : "Unread"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recipients.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted">No recipients found.</p>
            )}
          </div>
        </>
      )}
    </GenericModal>
  );
};

export default AdminNotificationsPage;
