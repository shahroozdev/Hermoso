import { useState } from 'react';
import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { payoutService } from '../../services/payoutService';
import { salonService } from '../../services/salonService';

const compactMoney = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const fakeAccount = (name) => {
  const digits = String((name || '0000').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)).slice(-4);
  return `HBL ****${digits.padStart(4, '0')}`;
};

const periodLabel = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '-';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  if (day <= 10) return `${month} 1–10`;
  if (day <= 20) return `${month} 11–20`;
  return `${month} 21–${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
};

const AdminPayoutsPage = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState('');

  const payoutReq = useApi(() => payoutService.list({ page: 1, limit: 100 }), [reloadKey]);
  const revenueReq = useApi(() => salonService.revenue(), [reloadKey]);

  if (payoutReq.loading || revenueReq.loading) return <AdminPageSkeleton variant="split" />;
  if (payoutReq.error) return <ErrorBlock text={payoutReq.error} />;
  if (revenueReq.error) return <ErrorBlock text={revenueReq.error} />;

  const payouts = payoutReq.data?.data || [];
  const revenueRows = revenueReq.data?.data || [];

  const revenueBySalonId = new Map(revenueRows.map((r) => [String(r._id), r]));

  const rows = payouts.map((p: Record<string, unknown>) => {
    const salonRef = p.salonId as Record<string, unknown> | null;
    const revenue = (revenueBySalonId.get(String(salonRef?._id || p.salonId)) || {}) as Record<string, unknown>;
    const gross = Number(revenue.grossRevenue || 0);
    const commission = Number(revenue.platformRevenue || 0);
    return {
      id: p._id,
      salon: (salonRef?.name as string) || 'Unknown Salon',
      period: periodLabel(p.createdAt),
      gross,
      commission,
      net: Number(p.amount || 0),
      bank: fakeAccount((salonRef?.name as string) || ''),
      status: p.status,
      payoutDate: p.payoutDate
    };
  });

  const pendingRows = rows.filter((r) => r.status === 'pending' || r.status === 'processing');
  const paidRows = rows.filter((r) => r.status === 'completed');

  const pendingTotal = pendingRows.reduce((sum, r) => sum + r.net, 0);
  const paidTotal = paidRows.reduce((sum, r) => sum + r.net, 0);
  const avgPayout = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.net, 0) / rows.length) : 0;

  const nextCycle = (() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 10);
    if (now > next) next.setMonth(next.getMonth() + 1);
    const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { date: next.toLocaleString('en-US', { month: 'short', day: 'numeric' }), days };
  })();

  const release = async (id) => {
    setActionError('');
    try {
      await payoutService.update(id, { status: 'completed' });
      setReloadKey((v) => v + 1);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to release payout');
    }
  };

  const releaseAll = async () => {
    setActionError('');
    try {
      for (const r of pendingRows) {
        await payoutService.update(r.id, { status: 'completed' });
      }
      setReloadKey((v) => v + 1);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to release all payouts');
    }
  };

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Pending Payouts</div>
          <div className="ha-kpi-val white">{pendingRows.length}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--amber)' }}>PKR {compactMoney(pendingTotal)} total</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Paid This Month</div>
          <div className="ha-kpi-val">{paidRows.length}</div>
          <div className="ha-kpi-change up">PKR {compactMoney(paidTotal)} sent</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Next Payout Cycle</div>
          <div className="ha-kpi-val white">{nextCycle.date}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--teal)' }}>{nextCycle.days} days away</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Payout</div>
          <div className="ha-kpi-val">{compactMoney(avgPayout)}</div>
          <div className="ha-kpi-change up">PKR per salon</div>
        </div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">
          Payout Queue
          <span>
            <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} onClick={releaseAll}>Release All</button>
          </span>
        </div>

        {actionError ? <div style={{ marginBottom: 12 }}><ErrorBlock text={actionError} /></div> : null}

        <div style={{ overflowX: 'auto' }}>
          <table className="ha-salon-table">
            <thead>
              <tr>
                <th>Salon</th>
                <th>Period</th>
                <th>Gross Bookings</th>
                <th>Commission Deducted</th>
                <th>Net Payout PKR</th>
                <th>Bank Account</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ha-salon-name" style={{ fontSize: 14 }}>{r.salon}</td>
                  <td>{r.period}</td>
                  <td>PKR {compactMoney(r.gross)}</td>
                  <td style={{ color: 'var(--rose)', fontWeight: 700 }}>-PKR {compactMoney(r.commission)}</td>
                  <td>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-light)' }}>PKR {Math.round(r.net).toLocaleString()}</div>
                    <div className="ha-salon-sub">{r.status === 'completed' ? `Paid: ${r.payoutDate ? new Date(r.payoutDate).toLocaleDateString() : '-'}` : `Due: ${nextCycle.date}`}</div>
                  </td>
                  <td className="ha-salon-sub">{r.bank}</td>
                  <td>
                    <span className={r.status === 'completed' ? 'ha-pill ha-pill-active' : 'ha-pill ha-pill-pending'}>
                      {r.status === 'completed' ? 'Paid ✓' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'completed' ? (
                      <button className="ha-act-btn">Receipt</button>
                    ) : (
                      <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} onClick={() => release(r.id)}>Release</button>
                    )}
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

export default AdminPayoutsPage;


