import { useApi } from "@/hooks/useApi";
import { notificationService } from "@/services/notificationService";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/utils/format";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface NotificationItem {
  _id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
}

const iconClass = "h-5 w-5";

const NotificationWidget = () => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useApi(
    () => notificationService.list({ page: 1, limit: 5 }),
    [],
  );
  const { user } = useAuthStore();
  const unread = data?.meta?.total || 0;
  const notifications: NotificationItem[] = data?.data || [];

  const notificationsPath = useMemo(() => {
    if (user?.role === "salon_owner") return "/owner/notifications";
    if (user?.role === "customer") return "/customer/notifications";
    return "/admin/notifications";
  }, [user?.role]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

    useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleViewAll = () => {
    if (!notificationsPath) return;
    setNotificationsOpen(false);
    navigate(notificationsPath);
  };
  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setNotificationsOpen((value) => !value)}
        className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 text-[var(--text)]"
        aria-label="Notifications"
        aria-expanded={notificationsOpen}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {notificationsOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/20">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text)]">
              Notifications
            </p>
            <p className="text-xs text-muted">
              Latest updates from your account
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-4 text-sm text-muted">
                Loading notifications...
              </p>
            ) : null}
            {!loading && error ? (
              <p className="px-4 py-4 text-sm text-rose-400">{error}</p>
            ) : null}
            {!loading && !error && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">
                No notifications yet.
              </p>
            ) : null}
            {!loading &&
              !error &&
              notifications.map((item) => (
                <div
                  key={item._id}
                  className="border-b border-[var(--border)] px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text)]">
                        {item.title || "New notification"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {item.message ||
                          "You have a new update in your dashboard."}
                      </p>
                    </div>
                    {!item.read ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-2)]" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                    {formatDate(item?.createdAt)}
                  </p>
                </div>
              ))}
          </div>

          {notificationsPath ? (
            <div className="border-t border-[var(--border)] p-3">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full rounded-xl bg-[var(--accent-2)] px-4 py-2.5 text-sm font-semibold text-slate-900"
              >
                View all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationWidget;
