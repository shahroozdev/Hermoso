import { useMemo, useState } from "react";
import NotificationModal, { NotificationFormModal, type NotificationRecord } from "../../components/NotificationModal";
import NotificationDetailModal from "../../components/NotificationDetailModal";
import GenericModal from "@/components/GenericModal";
import ActionsMenu from "@/components/ActionsMenu";
import TABLE from "@/components/table";
import SearchableSelect from "@/components/form/SearchableSelect";
import { useInvalidate } from "../../hooks/useInvalidate";
import { useApi } from "../../hooks/useApi";
import { notificationService } from "@/services/notificationService";
import { useToastStore } from "@/store/toastStore";
import { downloadCsv } from "@/utils";
import { formatDateInput, formatTimeAMPM } from "@/utils/format";

interface NotificationItem extends NotificationRecord {
  type: string;
  isRead: boolean;
  createdAt: string;
  recipientCount?: number;
}

interface SentSummaryItem {
  _id: string;
  title: string;
  message: string;
  targetRole: string;
  createdAt: string;
  recipientCount: number;
  readCount: number;
}

const roleLabel = (role: string): string => {
  if (role === "customer") return "Customers";
  if (role === "salon_owner") return "Salon Owners";
  if (role === "staff") return "Staff";
  return role || "All Users";
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Audiences" },
  { value: "customer", label: "Customers" },
  { value: "salon_owner", label: "Salon Owners" },
  { value: "staff", label: "Staff" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Unsent" },
  { value: "sent", label: "Sent" },
];

const AdminNotificationsPage = () => {
  const [viewNotif, setViewNotif] = useState<NotificationItem | null>(null);
  const [editNotif, setEditNotif] = useState<NotificationItem | null>(null);
  const [recipientsNotif, setRecipientsNotif] = useState<NotificationItem | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [exportingSummary, setExportingSummary] = useState(false);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();

  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters = Boolean(
    search || audienceFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo,
  );

  const clearFilters = () => {
    setSearch("");
    setAudienceFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const serviceParams = {
    ...(search ? { search } : {}),
    ...(audienceFilter !== "all" ? { targetRole: audienceFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      invalidate(['notifications']);
    } catch {
      showToast("Failed to mark notification as read", "error");
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
        showToast("Some notifications could not be marked as read", "error");
      } else {
        showToast("All notifications marked as read.");
      }
    } catch {
      showToast("Failed to mark all as read", "error");
    }
  };

  const handleSendNow = async (item: NotificationItem) => {
    setSendingId(item._id);
    try {
      await notificationService.send(item._id);
      invalidate(['notifications']);
      showToast("Notification sent successfully.");
      // Immediately surface the recipients list preview so the admin can see who
      // received it without a second click.
      setRecipientsNotif({ ...item, status: "sent" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send notification", "error");
    } finally {
      setSendingId(null);
    }
  };

  const handleExportSentSummary = async () => {
    setExportingSummary(true);
    try {
      const res = await notificationService.getSentSummary();
      const items: SentSummaryItem[] = res?.data || [];
      const rows = [
        ["Title", "Description", "Audience", "Sent Date", "Recipient Count", "Read Count"],
        ...items.map((item) => [
          item.title || "",
          item.message || "",
          roleLabel(item.targetRole),
          item.createdAt ? `${formatDateInput(item.createdAt)} ${formatTimeAMPM(item.createdAt)}` : "",
          String(item.recipientCount ?? 0),
          String(item.readCount ?? 0),
        ]),
      ];
      downloadCsv(`hermoso-sent-notifications-${new Date().toISOString().slice(0, 10)}.csv`, rows);
      showToast("Sent notifications report downloaded.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to export sent notifications", "error");
    } finally {
      setExportingSummary(false);
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
          <button className="ha-act-btn" onClick={handleExportSentSummary} disabled={exportingSummary}>
            {exportingSummary ? "Exporting..." : "Export All Sent Notifications"}
          </button>
          <NotificationModal />
        </div>
      </div>

      <div className="ha-card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">Title / Description</label>
            <input
              type="text"
              className="ha-input"
              style={{ minWidth: 220 }}
              placeholder="Search title or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">Audience</label>
            <span style={{ minWidth: 160, display: "inline-block" }}>
              <SearchableSelect value={audienceFilter} onChange={setAudienceFilter} options={AUDIENCE_OPTIONS} />
            </span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">Status</label>
            <span style={{ minWidth: 150, display: "inline-block" }}>
              <SearchableSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            </span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">Sent From</label>
            <input
              type="date"
              className="ha-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted">Sent To</label>
            <input
              type="date"
              className="ha-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <button type="button" className="ha-btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <TABLE<NotificationItem>
        title="All Notifications"
        queryKey={["notifications"]}
        showPagination
        service={notificationService.list}
        serviceParams={serviceParams}
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
                          onClick: () => handleSendNow(item),
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

const READ_STATUS_OPTIONS = [
  { value: "all", label: "All Recipients" },
  { value: "read", label: "Read" },
  { value: "unread", label: "Unread" },
];

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
  const { showToast } = useToastStore();
  const [search, setSearch] = useState("");
  const [readStatus, setReadStatus] = useState("all");

  const recipients: Recipient[] = useMemo(() => data?.data || [], [data]);
  const campaignInfo: { title?: string; message?: string } =
    data?.notification || { title: notification.title, message: notification.message };
  const readCount = recipients.filter((r) => r.isRead).length;

  const filteredRecipients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return recipients.filter((r) => {
      if (term && !(r.user?.name || "Deleted user").toLowerCase().includes(term)) return false;
      if (readStatus === "read" && !r.isRead) return false;
      if (readStatus === "unread" && r.isRead) return false;
      return true;
    });
  }, [recipients, search, readStatus]);

  const hasActiveFilters = Boolean(search || readStatus !== "all");
  const clearFilters = () => {
    setSearch("");
    setReadStatus("all");
  };

  const handleDownloadReport = () => {
    const rows = [
      ["Name", "Email", "Role", "Read Status"],
      ...filteredRecipients.map((r) => [
        r.user?.name || "Deleted user",
        r.user?.email || "-",
        (r.user?.role || "-").replace("_", " "),
        r.isRead ? "Read" : "Unread",
      ]),
    ];
    downloadCsv(
      `hermoso-notification-${notification._id}-recipients-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
    showToast("Recipients report downloaded.");
  };

  return (
    <GenericModal
      title={`Recipients: ${campaignInfo.title || notification.title}`}
      onClose={onClose}
      wide
      footer={
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="ha-act-btn"
            onClick={handleDownloadReport}
            disabled={loading || !!error || recipients.length === 0}
          >
            Download Report
          </button>
          <button type="button" className="ha-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading recipients...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div style={{ flexShrink: 0 }}>
            <p className="mb-1 text-sm text-muted">
              <span className="font-semibold" style={{ color: "var(--text)" }}>Description: </span>
              {campaignInfo.message || "-"}
            </p>
            <p className="mb-3 text-sm text-muted">
              {recipients.length.toLocaleString()} recipient{recipients.length === 1 ? "" : "s"} &middot;{" "}
              {readCount.toLocaleString()} read
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
              <input
                type="text"
                className="ha-input"
                style={{ maxWidth: 260 }}
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span style={{ minWidth: 160, display: "inline-block" }}>
                <SearchableSelect value={readStatus} onChange={setReadStatus} options={READ_STATUS_OPTIONS} />
              </span>
              {hasActiveFilters && (
                <button type="button" className="ha-btn-secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          <div className="ha-modal-scroll-section">
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
                  {filteredRecipients.map((r) => (
                    <tr key={r._id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{r.user?.name || "Deleted user"}</td>
                      <td className="px-3 py-2">{r.user?.email || "-"}</td>
                      <td className="px-3 py-2 capitalize">{(r.user?.role || "-").replace("_", " ")}</td>
                      <td className="px-3 py-2">{r.isRead ? "Read" : "Unread"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecipients.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted">
                  {recipients.length === 0 ? "No recipients found." : "No recipients match the filters."}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </GenericModal>
  );
};

export default AdminNotificationsPage;
