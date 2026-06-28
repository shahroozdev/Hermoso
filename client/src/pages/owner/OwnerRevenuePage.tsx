import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import LoadingBlock from '../../components/LoadingBlock';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { payoutService } from '../../services/payoutService';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/format';

const OwnerRevenuePage = () => {
  const dashboard = useApi(() => dashboardService.owner(), []);
  const payouts = useApi(() => payoutService.list({ page: 1, limit: 20 }), []);

  // if (dashboard.loading || payouts.loading) return <LoadingBlock text="Loading revenue..." />;
  if (dashboard.error) return <ErrorBlock text={dashboard.error} />;
  if (payouts.error) return <ErrorBlock text={payouts.error} />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Revenue</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Gross Revenue" value={formatCurrency(dashboard?.data?.totals?.grossRevenue)} />
        <StatCard title="Net Revenue" value={formatCurrency(dashboard?.data?.totals?.netRevenue)} />
        <StatCard
          title="Payout Requests"
          value={(payouts.data?.meta?.total || 0).toString()}
        />
      </div>
      <DataTable
      loading={payouts.loading}
        columns={['Amount', 'Status', 'Created', 'Payout Date']}
        rows={(payouts.data?.data || []).map((item) => [
          formatCurrency(item.amount),
          item.status,
          new Date(item.createdAt).toLocaleDateString(),
          item.payoutDate ? new Date(item.payoutDate).toLocaleDateString() : '-'
        ])}
      />
    </div>
  );
};

export default OwnerRevenuePage;
