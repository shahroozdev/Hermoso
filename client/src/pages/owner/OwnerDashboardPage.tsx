import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import MiniBarChart from '../../components/MiniBarChart';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import { formatMoney } from '../../utils/money';

const OwnerDashboardPage = () => {
  const { data, loading, error } = useApi(() => dashboardService.owner(), ["owner-dashboard"]);

  if (loading) return <LoadingBlock text="Loading owner dashboard..." />;
  if (error) return <ErrorBlock text={error} />;

  if (data?.data?.needsSetup) {
    return (
      <div className="shell-panel rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold">Set Up Your Salon</h2>
        <p className="mt-2 text-sm text-muted">
          Your account isn&apos;t linked to a salon yet. Create your salon profile to start
          accepting bookings and see your dashboard data.
        </p>
        <Link to="/create-salon" className="mt-4 inline-block rounded-xl bg-[var(--accent-2)] px-5 py-3 text-sm font-semibold text-slate-900">
          Create Your Salon
        </Link>
      </div>
    );
  }

  // CR-26: AI Scan referral bookings
  const aiScanBookings = data?.data?.totals?.aiScanBookings || 0;
  const aiScanRevenueInPaisa = data?.data?.totals?.aiScanRevenueInPaisa || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Salon Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Daily Bookings" value={data?.data?.totals?.dailyBookings} />
        <StatCard title="Upcoming Appointments" value={data?.data?.totals?.upcomingAppointments} />
        <StatCard title="Gross Revenue" value={formatMoney(data?.data?.totals?.grossRevenueInPaisa)} />
        <StatCard title="Net Revenue" value={formatMoney(data?.data?.totals?.netRevenueInPaisa)} />
      </div>

      {/* CR-26: AI Scan Referral Metrics */}
      {(aiScanBookings > 0 || aiScanRevenueInPaisa > 0) && (
        <div className="shell-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-700">AI Scan Referrals</h3>
              <p className="text-xs text-emerald-600">Bookings from AI Skin Scan matching</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white/50 p-4">
              <p className="text-2xl font-bold text-emerald-700">{aiScanBookings}</p>
              <p className="text-xs text-muted">Bookings from AI Match</p>
            </div>
            <div className="rounded-xl bg-white/50 p-4">
              <p className="text-2xl font-bold text-emerald-700">{formatMoney(aiScanRevenueInPaisa)}</p>
              <p className="text-xs text-muted">Revenue from AI Referrals</p>
            </div>
          </div>
        </div>
      )}

      <div className="shell-panel rounded-2xl p-6">
        <h3 className="font-semibold">Bookings Growth (Monthly)</h3>
        <div className="mt-4">
          <MiniBarChart items={data?.data?.charts?.bookingsByMonth || []} valueKey="totalBookings" labelKey="month" />
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;

