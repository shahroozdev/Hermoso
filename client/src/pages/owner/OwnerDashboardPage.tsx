import StatCard from '../../components/StatCard';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import MiniBarChart from '../../components/MiniBarChart';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/format';

const OwnerDashboardPage = () => {
  const { data, loading, error } = useApi(() => dashboardService.owner(), []);

  if (loading) return <LoadingBlock text="Loading owner dashboard..." />;
  if (error) return <ErrorBlock text={error} />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Salon Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Daily Bookings" value={data?.data?.totals?.dailyBookings} />
        <StatCard title="Upcoming Appointments" value={data?.data?.totals?.upcomingAppointments} />
        <StatCard title="Gross Revenue" value={formatCurrency(data?.data?.totals?.grossRevenue)} />
        <StatCard title="Net Revenue" value={formatCurrency(data?.data?.totals?.netRevenue)} />
      </div>
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

