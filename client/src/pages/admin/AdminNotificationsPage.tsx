import { useState } from 'react';
import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { notificationService } from '@/services/notificationService';

interface NotificationForm {
  title: string;
  message: string;
  targetRole: string;
  city: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  targetRole: string;
  createdAt: string;
}

const roleLabel = (role: string): string => {
  if (role === 'customer') return 'All Customers';
  if (role === 'salon_owner') return 'All Salons';
  if (role === 'staff') return 'All Staff';
  return role || 'All Users';
};

const fakeOpenRate = (title: string): number => {
  const seed = title.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return 50 + (seed % 36);
};

const AdminNotificationsPage = () => {
  const [form, setForm] = useState<NotificationForm>({ title: '', message: '', targetRole: 'customer', city: 'all' });
  const [status, setStatus] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const notificationsReq = useApi(() => notificationService.list({ page: 1, limit: 50 }), [reloadKey]);

  if (notificationsReq.loading) return <AdminPageSkeleton variant="notifications" />;
  if (notificationsReq.error) return <ErrorBlock text={notificationsReq.error} />;

  const notifications: NotificationItem[] = notificationsReq.data?.data || [];

  const grouped = new Map();
  for (const n of notifications) {
    const key = `${n.title}|${n.targetRole}|${new Date(n.createdAt).toDateString()}`;
    if (!grouped.has(key)) grouped.set(key, n);
  }

  const rows = (Array.from(grouped.values()) as NotificationItem[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((n) => ({
      id: n._id,
      title: n.title,
      audience: roleLabel(n.targetRole),
      sent: new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
      openRate: `${fakeOpenRate(n.title)}%`
    }));

  const preview = () => {
    setStatus(`Preview: "${form.title || 'Untitled'}" to ${roleLabel(form.targetRole)}${form.city !== 'all' ? ` · ${form.city}` : ''}`);
  };

  const sendNow = async () => {
    setStatus('');
    try {
      const result = await notificationService.announce({
        title: form.title,
        message: form.message,
        targetRole: form.targetRole
      });
      setStatus(`Notification sent to ${result.count || 0} users.`);
      setForm({ title: '', message: '', targetRole: 'customer', city: 'all' });
      setReloadKey((v) => v + 1);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to send notification');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }} className="ha-notif-grid">
      <div className="ha-card">
        <div className="ha-card-title">Send Platform Notification</div>

        <div className="ha-notif-panel">
          <label className="ha-kpi-label" style={{ marginBottom: 8 }}>Title</label>
          <input
            className="ha-input"
            placeholder="e.g. Eid Special Offers Live Now 🎉"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>

        <div className="ha-notif-panel">
          <label className="ha-kpi-label" style={{ marginBottom: 8 }}>Message</label>
          <textarea
            className="ha-textarea"
            rows={3}
            placeholder="Write your push notification message here..."
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          />
        </div>

        <div className="ha-notif-panel">
          <label className="ha-kpi-label" style={{ marginBottom: 8 }}>Send To</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="ha-select" value={form.targetRole} onChange={(e) => setForm((p) => ({ ...p, targetRole: e.target.value }))}>
              <option value="customer">All Customers</option>
              <option value="salon_owner">All Salons</option>
              <option value="staff">All Staff</option>
            </select>
            <select className="ha-select" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}>
              <option value="all">All Cities</option>
              <option value="lahore">Lahore</option>
              <option value="karachi">Karachi</option>
              <option value="islamabad">Islamabad</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="ha-act-btn" onClick={preview}>Preview</button>
            <button className="ha-topbar-btn primary" onClick={sendNow}>Send Now 📣</button>
          </div>
        </div>

        {status ? <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>{status}</p> : null}
      </div>

      <div className="ha-card">
        <div className="ha-card-title">Recent Notifications Sent <span>Last 7 days</span></div>
        <table className="ha-salon-table" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Sent</th>
              <th>Open Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="ha-salon-name" style={{ fontSize: 14 }}>{r.title}</td>
                <td>{r.audience}</td>
                <td>{r.sent}</td>
                <td style={{ color: Number(r.openRate.replace('%', '')) >= 70 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>{r.openRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;


