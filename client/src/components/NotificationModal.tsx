import { useState } from 'react';
import GenericModal from './GenericModal';
import { useInvalidate } from '../hooks/useInvalidate';
import { notificationService } from '@/services/notificationService';

const NotificationModal = () => {
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('customer');
  const [status, setStatus] = useState('');

  const roleLabel = (role: string) => {
    if (role === 'customer') return 'All Customers';
    if (role === 'salon_owner') return 'All Salons';
    if (role === 'staff') return 'All Staff';
    return role;
  };

  const sendNow = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus('Title and message are required');
      return;
    }
    setStatus('');
    try {
      const result = await notificationService.announce({ title, message, targetRole });
      setStatus(`Sent to ${result.count || 0} users.`);
      setTitle('');
      setMessage('');
      setTargetRole('customer');
      invalidate();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to send notification');
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-xl border border-[var(--border)] bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-slate-900"
        onClick={() => setOpen(true)}
      >
        + Add Notification
      </button>
      {open && (
        <GenericModal
          title="Send Platform Notification"
          onClose={() => setOpen(false)}
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="ha-act-btn" onClick={() => setStatus(`Preview: "${title || 'Untitled'}" to ${roleLabel(targetRole)}`)}>
                Preview
              </button>
              <button className="ha-topbar-btn primary" onClick={sendNow}>
                Send Now
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
            {status && (
              <p className="text-sm" style={{ color: status.includes('Failed') ? 'var(--rose)' : 'var(--text-muted)' }}>
                {status}
              </p>
            )}
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default NotificationModal;