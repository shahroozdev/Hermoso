import GenericModal from './GenericModal';

interface NotificationDetailModalProps {
  notification: {
    _id: string;
    title: string;
    message: string;
    targetRole: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    status?: 'draft' | 'sent';
    recipientCount?: number;
  };
  onClose: () => void;
}

const roleLabel = (role: string): string => {
  if (role === 'customer') return 'All Customers';
  if (role === 'salon_owner') return 'All Salons';
  if (role === 'staff') return 'All Staff';
  return role || 'All Users';
};

const NotificationDetailModal = ({ notification, onClose }: NotificationDetailModalProps) => {
  const n = notification;

  return (
    <GenericModal title="Notification Details" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="text-xs font-semibold uppercase text-muted">Title</label>
          <p className="text-base font-semibold">{n.title}</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-muted">Message</label>
          <p className="text-sm whitespace-pre-wrap">{n.message || '-'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Audience</label>
            <p className="text-sm font-medium">{roleLabel(n.targetRole)}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Type</label>
            <p className="text-sm">
              <span className="ha-pill ha-pill-booking">{n.type}</span>
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Sent</label>
            <p className="text-sm font-medium">
              {new Date(n.createdAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Status</label>
            <p className="text-sm">
              <span className={n.status === 'draft' ? 'ha-pill ha-pill-pending' : 'ha-pill ha-pill-active'}>
                {n.status === 'draft' ? 'Unsent' : 'Sent'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Recipients</label>
            <p className="text-sm font-medium">
              {n.status === 'draft' ? '-' : (n.recipientCount ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Notification ID</label>
            <p className="text-sm font-mono text-muted">#{String(n._id).slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </GenericModal>
  );
};

export default NotificationDetailModal;