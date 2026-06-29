import { useState, useMemo } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';

interface RevenueItem {
  name: string;
  bookingsCount?: number;
  grossRevenue?: number;
  commissionRate?: number;
  platformRevenue?: number;
  salonNetRevenue?: number;
}

const compactMoney = (value: number) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const AdminRevenuePage = () => {
  const [rates, setRates] = useState({ defaultRate: 10, vipRate: 8, eventRate: 12, promoRate: 0 });
  const [status, setStatus] = useState('');

  const statsReq = useApi(() => salonService.getRevenueStats(), []);

  const kpi = useMemo(() => ({
    totalGMV: statsReq.data?.data?.totalGMV ?? 0,
    platformCommission: statsReq.data?.data?.platformCommission ?? 0,
    pendingPayouts: statsReq.data?.data?.pendingPayouts ?? 0,
    pendingPayoutAmount: statsReq.data?.data?.pendingPayoutAmount ?? 0,
    avgBookingValue: statsReq.data?.data?.avgBookingValue ?? 0,
  }), [statsReq.data]);

  const saveRules = () => {
    setStatus('Commission rules saved locally for UI. Connect this to your settings API when ready.');
  };

  if (statsReq.loading) return <AdminPageSkeleton variant="split" />;
  if (statsReq.error) return <ErrorBlock text={statsReq.error} />;

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total GMV This Month</div>
          <div className="ha-kpi-val">{compactMoney(kpi.totalGMV)}</div>
          <div className="ha-kpi-change up">PKR · live platform volume</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Platform Commission</div>
          <div className="ha-kpi-val">{compactMoney(kpi.platformCommission)}</div>
          <div className="ha-kpi-change up">PKR · across salons</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Payouts Pending</div>
          <div className="ha-kpi-val white">{kpi.pendingPayouts}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--amber)' }}>PKR {compactMoney(kpi.pendingPayoutAmount)} due</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Booking Value</div>
          <div className="ha-kpi-val">{kpi.avgBookingValue.toLocaleString()}</div>
          <div className="ha-kpi-change up">PKR per booking</div>
        </div>
      </div>

      <div className="space-y-2">
        <TABLE<RevenueItem>
          showPagination
          title="Revenue by Salon This Month"
          service={salonService.revenue}
          columns={[
            { title: 'Salon' },
            { title: 'Bookings' },
            { title: 'Gross PKR' },
            { title: 'Commission %' },
            { title: 'Platform Earned' },
          ]}
          rows={(data) =>
            data?.map((item) => [
              <span className="ha-salon-name" style={{ fontSize: 14 }}>{item.name}</span>,
              item.bookingsCount ?? 0,
              <span className="ha-money">{compactMoney(Number(item.grossRevenue ?? 0))}</span>,
              `${Number(item.commissionRate ?? 0)}%`,
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{compactMoney(Number(item.platformRevenue ?? 0))}</span>,
            ])
          }
        />

        <div className="ha-card">
          <div className="ha-card-title">Commission Rate Controls</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'defaultRate', title: 'Default Commission', sub: 'Applied to new salons' },
              { key: 'vipRate', title: 'VIP Salons Rate', sub: 'Top 10% by revenue' },
              { key: 'eventRate', title: 'Event Bookings Rate', sub: 'Bridal, party packages' },
              { key: 'promoRate', title: 'Launch Promo Rate', sub: 'First 50 salons · 3 months' }
            ].map((row: { key: string; title: string; sub: string }) => (
              <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="ha-salon-name" style={{ fontSize: 13 }}>{row.title}</div>
                  <div className="ha-salon-sub">{row.sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    className="ha-input"
                    style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontWeight: 700 }}
                    value={rates[row.key as keyof typeof rates]}
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


