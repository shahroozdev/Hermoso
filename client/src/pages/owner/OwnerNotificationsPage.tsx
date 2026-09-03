import ErrorBlock from '../../components/ErrorBlock';
import LoadingBlock from '../../components/LoadingBlock';
import { useApi } from '../../hooks/useApi';
import { notificationService } from '../../services/notificationService';

interface NotificationItem {
  _id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
}

const formatDate = (value?: string) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const OwnerNotificationsPage = () => {
  const notificationsReq = useApi(() => notificationService.list({ page: 1, limit: 50 }), ["owner-notifications"]);

  if (notificationsReq.loading) return <LoadingBlock text="Loading notifications..." />;
  if (notificationsReq.error) return <ErrorBlock text={notificationsReq.error} />;

  const notifications: NotificationItem[] = notificationsReq.data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">Notifications</h2>
        <p className="text-sm text-muted">A full history of your latest updates and alerts.</p>
      </div>

      <div className="shell-panel rounded-2xl divide-y divide-[var(--border)] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-muted">No notifications available right now.</div>
        ) : (
          notifications.map((item) => (
            <div key={item._id} className="flex items-start gap-4 p-5">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.read ? 'bg-slate-500/40' : 'bg-[var(--accent-2)]'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      {item.title || 'New notification'}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.message || 'You have a new update in your salon dashboard.'}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs uppercase tracking-[0.14em] text-muted">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerNotificationsPage;
