import { payoutService } from '../../services/payoutService';
import { formatMoney } from '../../utils/money';
import TABLE from "@/components/table";

interface PayoutItem {
  amountInPaisa?: number;
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
            formatMoney(item.amountInPaisa),
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
