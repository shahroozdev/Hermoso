import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';

const donutColors = ['#d4a843', '#7c3aed', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b'];

const AdminDashboardPage = () => {
  const dashboard = useApi(() => dashboardService.admin(), []);
  if (dashboard.loading) return <AdminPageSkeleton variant="table" />;
  if (dashboard.error) return <ErrorBlock text={dashboard.error} />;

  const data = dashboard?.data;
  const months = (data?.data?.charts?.bookingsByMonth || []).slice(-7);
  const values = months.map((m) => m?.totalBookings);
  const max = Math.max(...values, 1);

  const categories = (data?.data?.charts?.categoryDistribution || []).slice(0, 4);
  const catPercents = categories.map((c) => c.percent);
  const catTotal = catPercents.reduce((s, v) => s + v, 0);
  const normalized = catTotal > 0 ? catPercents.map((p) => Math.round((p / catTotal) * 100)) : [100];
  const donut = normalized
    .map((p, i) => {
      const start = normalized.slice(0, i).reduce((s, x) => s + x, 0);
      const end = start + p;
      return `${donutColors[i % donutColors.length]} ${start}% ${end}%`;
    })
    .join(', ');

  const activity = data?.data?.activity || {};
  const recentSalons = data?.data?.recentSalons || [];

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Active Salons</div>
          <div className="ha-kpi-val">{data?.data?.totals?.salons}</div>
          <div className="ha-kpi-change up">Live on platform</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Total Customers</div>
          <div className="ha-kpi-val">{data?.data?.totals?.customers?.toLocaleString()}</div>
          <div className="ha-kpi-change up">Registered users</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Bookings This Month</div>
          <div className="ha-kpi-val">{data?.data?.totals?.bookings?.toLocaleString()}</div>
          <div className="ha-kpi-change up">Tenant bookings</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Platform Revenue</div>
          <div className="ha-kpi-val">{Math.round(data?.data?.totals?.platformRevenue || 0).toLocaleString()}</div>
          <div className="ha-kpi-change up">Commission earned</div>
        </div>
      </div>
      <div className="ha-row-2">
        <div className="ha-card">
          <div className="ha-card-title">Monthly Bookings Trend <span>Last 7 months</span></div>
          <div className="ha-trend-line" style={{ marginBottom: 8 }}>
            {months.map((m, i) => {
              const h = Math.max(24, Math.round((m?.totalBookings / max) * 80));
              return <div key={m?.month} className={`ha-tbar ${i === months.length - 1 ? 'hi' : ''}`} style={{ height: `${h}px` }} />;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            {months.map((m) => (
              <span key={m?.month}>{m?.month?.slice(5)}</span>
            ))}
          </div>
        </div>

        <div className="ha-card">
          <div className="ha-card-title">Bookings by Category</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: `conic-gradient(${donut || '#d4a843 0 100%'})`, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'var(--navy-card)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#f0c96a' }}>
                {data?.totals?.bookings?.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {categories.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: donutColors[i % donutColors.length] }} />
                  <div style={{ color: 'var(--text-muted)', flex: 1 }}>{c.name}</div>
                  <div style={{ fontWeight: 600 }}>{c.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ha-row-2">
        <div className="ha-card">
          <div className="ha-card-title">Recently Joined Salons <span>Pending approval</span></div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                <th className="border-b border-[var(--border)] px-2 pb-3 font-semibold">Salon</th>
                <th className="border-b border-[var(--border)] px-2 pb-3 font-semibold">City</th>
                <th className="border-b border-[var(--border)] px-2 pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSalons.map((s) => (
                <tr key={s._id} className="text-[13px]">
                  <td className="border-b border-[var(--border-soft)] px-2 py-3 font-semibold">{s.name}</td>
                  <td className="border-b border-[var(--border-soft)] px-2 py-3">{s.location?.city || '-'}</td>
                  <td className="border-b border-[var(--border-soft)] px-2 py-3">
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ha-card">
          <div className="ha-card-title">AI Scan Activity <span>Last 30 days</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Scans Completed', activity.scansCompleted || 0, 92, '#d4a843'],
              ['Led to Booking', activity.ledToBooking || 0, Math.min(100, activity.recommendationCtr || 0), '#0ea5e9'],
              ['Repeat Scanners', activity.repeatScanners || 0, Math.min(100, Math.round(((activity.repeatScanners || 0) / Math.max(1, activity.scansCompleted || 1)) * 100)), '#10b981'],
              ['Recommendation CTR', `${activity.recommendationCtr || 0}%`, activity.recommendationCtr || 0, '#a855f7']
            ].map((r) => (
              <div key={r[0]}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r[0]}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{typeof r[1] === 'number' ? r[1].toLocaleString() : r[1]}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(4, Number(r[2]))}%`, height: '100%', borderRadius: 3, background: r[3] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* </div> */}
    </>
  );
};

export default AdminDashboardPage;


