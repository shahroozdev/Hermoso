import { useState } from 'react';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';
import { notificationService } from '@/services/notificationService';

export interface NotificationRecord {
  _id: string;
  title: string;
  message: string;
  targetRole: string;
  status?: 'draft' | 'sent';
}

const roleLabel = (role: string) => {
  if (role === 'customer') return 'All Customers';
  if (role === 'salon_owner') return 'All Salons';
  if (role === 'staff') return 'All Staff';
  return role;
};

export const NotificationFormModal = ({
  notification,
  onClose,
  onSaved,
}: {
  notification?: NotificationRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}) => {
  const invalidate = useInvalidate();
  const isEditing = !!notification;
  const [title, setTitle] = useState(notification?.title || '');
  const [message, setMessage] = useState(notification?.message || '');
  const [targetRole, setTargetRole] = useState(notification?.targetRole || 'customer');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus('Title and message are required');
      return;
    }
    setStatus('');
    setIsSaving(true);
    try {
      if (isEditing) {
        await notificationService.update(notification!._id, { title, message, targetRole });
      } else {
        await notificationService.create({ title, message, targetRole });
      }
      invalidate(['notifications']);
      onSaved?.();
      onClose();
    } catch (err) {
      setStatus(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} notification`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GenericModal
      title={isEditing ? 'Edit Notification' : 'Create Notification'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="ha-act-btn" onClick={() => setStatus(`Preview: "${title || 'Untitled'}" to ${roleLabel(targetRole)}`)}>
            Preview
          </button>
          <button className="ha-topbar-btn primary" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-muted">Title</label>
          <input
            className="ha-input w-full"
            placeholder="e.g. Eid Special Offers Live Now"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-muted">Message</label>
          <textarea
            className="ha-input w-full"
            rows={3}
            placeholder="Write your push notification message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-muted">Send To</label>
          <select
            className="ha-select w-full"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          >
            <option value="customer">All Customers</option>
            <option value="salon_owner">All Salons</option>
            <option value="staff">All Staff</option>
          </select>
        </div>
        {!isEditing && (
          <p className="text-sm text-muted">
            This saves the notification as a draft. Send it from the notifications list when you&apos;re ready.
          </p>
        )}
        {status && (
          <p className="text-sm" style={{ color: status.includes('Failed') || status.includes('required') ? 'var(--rose)' : 'var(--text-muted)' }}>
            {status}
          </p>
        )}
      </div>
    </GenericModal>
  );
};

const NotificationModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => setOpen(true)}
      >
        + Add Notification
      </button>
      {open && <NotificationFormModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default NotificationModal;
