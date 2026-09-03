import { payoutService } from '../../services/payoutService';
import { formatCurrency } from '../../utils/format';
import TABLE from "@/components/table";

interface PayoutItem {
  amount?: number;
  status?: string;
  createdAt?: string;
  payoutDate?: string;
}

const OwnerRevenuePage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Revenue</h2>
      <TABLE<PayoutItem>
        title="Payouts"
        queryKey={["owner-payouts"]}
        showPagination
        service={payoutService.list}
        columns={[{ title: 'Amount' }, { title: 'Status' }, { title: 'Created' }, { title: 'Payout Date' }]}
        rows={(data) =>
          data?.map((item) => [
            formatCurrency(item.amount),
            item.status,
            item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
            item.payoutDate ? new Date(item.payoutDate).toLocaleDateString() : '-',
          ])
        }
      />
    </div>
  );
};

export default OwnerRevenuePage;
