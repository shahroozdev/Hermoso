import { useState } from "react";
import AdminPageSkeleton from "../../components/skeletons/AdminPageSkeleton";
import ErrorBlock from "../../components/ErrorBlock";
import NotificationModal from "../../components/NotificationModal";
import NotificationDetailModal from "../../components/NotificationDetailModal";
import TABLE from "@/components/table";
import { useApi } from "../../hooks/useApi";
import { notificationService } from "@/services/notificationService";
import { formatDateInput, formatTimeAMPM } from "@/utils/format";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  targetRole: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const roleLabel = (role: string): string => {
  if (role === "customer") return "Customers";
  if (role === "salon_owner") return "Salon Owners";
  if (role === "staff") return "Staff";
  return role || "All Users";
};

const AdminNotificationsPage = () => {
  const [viewNotif, setViewNotif] = useState<NotificationItem | null>(null);
  const req = useApi(() => notificationService.list({ page: 1, limit: 1 }), []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      window.location.reload();
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
      for (const n of unread) {
        await notificationService.markRead(n._id);
      }
      window.location.reload();
    } catch {
      alert("Failed to mark all as read");
    }
  };

  if (req.loading) return <AdminPageSkeleton variant="notifications" />;
  if (req.error) return <ErrorBlock text={req.error} />;

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
        showPagination
        service={notificationService.list}
        columns={[
          { title: "Title" },
          { title: "Message" },
          { title: "Audience" },
          { title: "Type", size: "150px" },
          { title: "Sent", size: "120px" },
          { title: "Status" },
          { title: "Actions" },
        ]}
        rows={(data) =>
          data?.map((item) => [
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
              {item.type.replace("_", " ")}
            </span>,
            <p>
              {formatDateInput(item.createdAt)} <br />
              <span className="text-gray-400">
                {formatTimeAMPM(item.createdAt)}
              </span>
            </p>,
            <span
              className={
                item.isRead
                  ? "ha-pill ha-pill-active"
                  : "ha-pill ha-pill-pending"
              }
            >
              {item.isRead ? "Read" : "Unread"}
            </span>,
            <div className="ha-actions">
              <button className="ha-act-btn" onClick={() => setViewNotif(item)}>
                View
              </button>
              {!item.isRead && (
                <button
                  className="ha-act-btn min-w-max"
                  onClick={() => handleMarkRead(item._id)}
                >
                  Mark Read
                </button>
              )}
            </div>,
          ])
        }
      />

      {viewNotif && (
        <NotificationDetailModal
          notification={viewNotif}
          onClose={() => setViewNotif(null)}
        />
      )}
    </div>
  );
};

export default AdminNotificationsPage;
