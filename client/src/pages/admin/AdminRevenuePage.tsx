import { useState } from 'react';
import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';
import { payoutService } from '../../services/payoutService';

const compactMoney = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const AdminRevenuePage = () => {
  const [rates, setRates] = useState({ defaultRate: 10, vipRate: 8, eventRate: 12, promoRate: 0 });
  const [status, setStatus] = useState('');

  const revenueReq = useApi(() => salonService.revenue(), []);
  const salonsReq = useApi(() => salonService.list({ page: 1, limit: 100 }), []);
  const payoutsReq = useApi(() => payoutService.list({ page: 1, limit: 100, status: 'pending' }), []);

  if (revenueReq.loading || salonsReq.loading || payoutsReq.loading) return <AdminPageSkeleton variant="split" />;
  if (revenueReq.error) return <ErrorBlock text={revenueReq.error} />;
  if (salonsReq.error) return <ErrorBlock text={salonsReq.error} />;
  if (payoutsReq.error) return <ErrorBlock text={payoutsReq.error} />;

  const revenueRows = revenueReq.data?.data || [];
  const salons = salonsReq.data?.data || [];
  const payouts = payoutsReq.data?.data || [];

  const totalGMV = revenueRows.reduce((sum, row) => sum + Number(row.grossRevenue || 0), 0);
  const platformCommission = revenueRows.reduce((sum, row) => sum + Number(row.platformRevenue || 0), 0);
  const pendingPayoutAmount = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalBookings = salons.reduce((sum, s) => sum + Number(s.bookingsCount || 0), 0);
  const avgBookingValue = totalBookings > 0 ? Math.round(totalGMV / totalBookings) : 0;

  const rows = revenueRows
    .map((r) => {
      const salon = salons.find((s) => s.name === r.name);
      const bookings = Number(salon?.bookingsCount || 0);
      const commissionRate = Number(r.commissionRate ?? salon?.commissionRate ?? 0);
      return {
        name: r.name,
        bookings,
        gross: Number(r.grossRevenue || 0),
        commissionRate,
        earned: Number(r.platformRevenue || 0)
      };
    })
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 6);

  const saveRules = () => {
    setStatus('Commission rules saved locally for UI. Connect this to your settings API when ready.');
  };

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total GMV This Month</div>
          <div className="ha-kpi-val">{compactMoney(totalGMV)}</div>
          <div className="ha-kpi-change up">PKR · live platform volume</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Platform Commission</div>
          <div className="ha-kpi-val">{compactMoney(platformCommission)}</div>
          <div className="ha-kpi-change up">PKR · across salons</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Payouts Pending</div>
          <div className="ha-kpi-val white">{payouts.length}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--amber)' }}>PKR {compactMoney(pendingPayoutAmount)} due</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Booking Value</div>
          <div className="ha-kpi-val">{avgBookingValue.toLocaleString()}</div>
          <div className="ha-kpi-change up">PKR per booking</div>
        </div>
      </div>

      <div className="ha-row-2">
        <div className="ha-card">
          <div className="ha-card-title">Revenue by Salon This Month</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ha-salon-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Salon</th>
                  <th>Bookings</th>
                  <th>Gross PKR</th>
                  <th>Commission %</th>
                  <th>Platform Earned</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td className="ha-salon-name" style={{ fontSize: 14 }}>{r.name}</td>
                    <td>{r.bookings}</td>
                    <td className="ha-money">{compactMoney(r.gross)}</td>
                    <td>{r.commissionRate}%</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{compactMoney(r.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ha-card">
          <div className="ha-card-title">Commission Rate Controls</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'defaultRate', title: 'Default Commission', sub: 'Applied to new salons' },
              { key: 'vipRate', title: 'VIP Salons Rate', sub: 'Top 10% by revenue' },
              { key: 'eventRate', title: 'Event Bookings Rate', sub: 'Bridal, party packages' },
              { key: 'promoRate', title: 'Launch Promo Rate', sub: 'First 50 salons · 3 months' }
            ].map((row) => (
              <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="ha-salon-name" style={{ fontSize: 13 }}>{row.title}</div>
                  <div className="ha-salon-sub">{row.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    className="ha-input"
                    style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontWeight: 700 }}
                    value={rates[row.key]}
                    onChange={(e) => setRates((prev) => ({ ...prev, [row.key]: Number(e.target.value || 0) }))}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            ))}
          </div>

          <button className="ha-topbar-btn primary" style={{ width: '100%', marginTop: 16, paddingTop: 10, paddingBottom: 10 }} onClick={saveRules}>
            Save Commission Rules
          </button>
          {status ? <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>{status}</p> : null}
        </div>
      </div>
    </>
  );
};

export default AdminRevenuePage;


