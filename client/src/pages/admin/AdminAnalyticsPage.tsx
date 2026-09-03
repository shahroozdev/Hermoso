import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';

const AdminAnalyticsPage = () => {
  const { data, loading, error } = useApi(() => dashboardService.admin(), ["admin-dashboard"]);

  if (loading) return <AdminPageSkeleton variant="table" />;
  if (error) return <ErrorBlock text={error} />;

  const pm = data?.data?.productMetrics || {};
  const traffic = (data?.data?.charts?.trafficByCity || []).slice(0, 4);
  const months = (data?.data?.charts?.bookingsByMonth || []).slice(-6);
  const max = Math.max(...months.map((m) => m?.totalBookings), 1);

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">App Downloads</div>
          <div className="ha-kpi-val">{(pm.appDownloads || 0).toLocaleString()}</div>
          <div className="ha-kpi-change up">From customer adoption</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">DAU (Daily Active)</div>
          <div className="ha-kpi-val">{(pm.dau || 0).toLocaleString()}</div>
          <div className="ha-kpi-change up">Last 7 days active</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Session Time</div>
          <div className="ha-kpi-val">{pm.avgSessionMinutes || 0}m</div>
          <div className="ha-kpi-change up">Behavioral estimate</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">AI Feature Engagement</div>
          <div className="ha-kpi-val">{pm.aiEngagement || 0}%</div>
          <div className="ha-kpi-change up">Repeat user ratio</div>
        </div>
      </div>

      <div className="ha-row-2">
        <div className="ha-card">
          <div className="ha-card-title">User Growth <span>Last 6 months</span></div>
          <div className="ha-trend-line" style={{ height: 90, marginBottom: 8 }}>
            {months.map((m, i) => {
              const h = Math.max(24, Math.round((m?.totalBookings / max) * 90));
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
          <div className="ha-card-title">Traffic by City</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {traffic.map((city, idx) => (
              <div key={city.city}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{city.city}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{city.percent}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(4, city.percent)}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: ['#d4a843', '#0ea5e9', '#10b981', '#a855f7'][idx % 4]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAnalyticsPage;


