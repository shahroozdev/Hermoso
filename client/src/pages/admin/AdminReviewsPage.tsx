import { useState } from 'react';
import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { reviewService } from '../../services/reviewService';

const stars = (rating) => {
  const full = Math.max(0, Math.min(5, Number(rating || 0)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

const AdminReviewsPage = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState('');

  const req = useApi(() => reviewService.list({ page: 1, limit: 100 }), [reloadKey]);

  if (req.loading) return <AdminPageSkeleton variant="table" />;
  if (req.error) return <ErrorBlock text={req.error} />;

  const reviews = req.data?.data || [];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
  const flagged = reviews.filter((r) => r.status === 'flagged').length;
  const approved = reviews.filter((r) => r.status === 'approved').length;

  const moderate = async (id, status) => {
    setActionError('');
    try {
      await reviewService.moderate(id, status);
      setReloadKey((v) => v + 1);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Platform Avg Rating</div><div className="ha-kpi-val">{avg}</div><div className="ha-kpi-change up">Across all salons</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Reviews This Month</div><div className="ha-kpi-val">{reviews.length.toLocaleString()}</div><div className="ha-kpi-change up">Live review volume</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Flagged Reviews</div><div className="ha-kpi-val white">{flagged}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs moderation</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">AI-Verified Reviews</div><div className="ha-kpi-val">{reviews.length ? Math.round((approved / reviews.length) * 100) : 0}%</div><div className="ha-kpi-change up">Authentic signals</div></div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">Review Moderation Queue</div>
        {actionError ? <div style={{ marginBottom: 10 }}><ErrorBlock text={actionError} /></div> : null}
        <div style={{ overflowX: 'auto' }}>
          <table className="ha-salon-table">
            <thead>
              <tr>
                <th>Customer</th><th>Salon</th><th>Rating</th><th>Review</th><th>Flagged</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.customerId?.name || 'Unknown'}</td>
                  <td>{r.salonId?.name || '-'}</td>
                  <td style={{ color: Number(r.rating) >= 4 ? 'var(--gold-light)' : 'var(--rose)' }}>{stars(Number(r.rating || 0))}</td>
                  <td>
                    <div className="ha-salon-name" style={{ fontSize: 13 }}>{r.comment || 'No comment'}</div>
                    {r.reply ? <div className="ha-salon-sub">Reply: {r.reply}</div> : null}
                  </td>
                  <td>
                    <span className={r.status === 'flagged' ? 'ha-pill ha-pill-suspended' : 'ha-pill ha-pill-active'}>{r.status}</span>
                  </td>
                  <td>
                    <div className="ha-actions">
                      <button className="ha-act-btn" onClick={() => moderate(r._id, 'approved')}>Approve</button>
                      <button className="ha-act-btn danger" onClick={() => moderate(r._id, 'deleted')}>Remove</button>
                      <button className="ha-act-btn" onClick={() => moderate(r._id, 'flagged')}>Investigate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminReviewsPage;


