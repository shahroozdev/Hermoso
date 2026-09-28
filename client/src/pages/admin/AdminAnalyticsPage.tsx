import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import MetricChart from '../../components/MetricChart';
import { formatMoney } from '../../utils/money';

const AdminAnalyticsPage = () => {
  const query = new URLSearchParams(window.location.search);
  const range = query.get('bookingRange') || 'current_month';
  const year = query.get('registrationYear') || String(new Date().getFullYear());
  const { data, loading, error } = useApi(() => dashboardService.admin({ range, year }), ["admin-dashboard", range, year]);

  if (loading) return <AdminPageSkeleton variant="table" />;
  if (error) return <ErrorBlock text={error} />;

  const pm = data?.data?.productMetrics || {};
  const traffic = (data?.data?.charts?.trafficByCity || []).slice(0, 4);
  const trafficTotal = traffic.reduce((sum, city) => sum + (city.percent || 0), 0);
  const months = (data?.data?.charts?.bookingsByMonth || []).slice(-6);
  const bookingTrendLabel = `Last ${months.length || 0} month${months.length === 1 ? '' : 's'}`;
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
          <div className="ha-card-title">Booking Trend <span>{bookingTrendLabel}</span><select aria-label="Booking range" className="ha-input ml-auto" style={{ width: 132, minHeight: 30, padding: '4px 8px', fontSize: 12 }} value={range} onChange={(e) => { const url = new URL(window.location.href); url.searchParams.set('bookingRange', e.target.value); window.location.assign(url.toString()); }}><option value="current_week">Current Week</option><option value="last_week">Last Week</option><option value="current_month">Current Month</option><option value="last_month">Last Month</option><option value="current_year">Current Year</option><option value="last_year">Last Year</option></select></div>
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
            {trafficTotal < 100 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Others</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(100 - trafficTotal)}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(4, 100 - trafficTotal)}%`, height: '100%', borderRadius: 3, background: '#64748b' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="ha-row-2">
        <section className="ha-card"><div className="ha-card-title">Customer Registrations by Month <select aria-label="Registration year" className="ha-input ml-auto" style={{ width: 92, minHeight: 30, padding: '4px 8px', fontSize: 12 }} value={year} onChange={(e) => { const url = new URL(window.location.href); url.searchParams.set('registrationYear', e.target.value); window.location.assign(url.toString()); }}>{Array.from({ length: 10 }, (_, index) => String(new Date().getFullYear() - index)).map((value) => <option key={value} value={value}>{value}</option>)}</select></div><MetricChart title={`Registrations in ${year}`} points={(data?.data?.charts?.customerGrowth || []).map(item=>({label:item._id,value:item.count}))} /></section>
        <MetricChart title="Monthly Paid Revenue" points={(data?.data?.charts?.revenueByMonth || []).map(item=>({label:item._id,value:item.amountInPaisa}))} format={formatMoney} />
      </div>
    </>
  );
};

export default AdminAnalyticsPage;


