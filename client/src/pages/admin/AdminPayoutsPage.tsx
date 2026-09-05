import { useMemo, useState } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import PayoutDetailModal from '../../components/PayoutDetailModal';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { payoutService } from '../../services/payoutService';
import { formatMoney, paisaToRupees } from '../../utils/money';

interface PayoutItem {
  _id: string;
  salonId?: { name?: string; _id?: string };
  amountInPaisa?: number;
  status?: string;
  payoutDate?: string;
  createdAt?: string;
}

// Value is expected in paisa; formats the rupee amount compactly (1.2M, 45K).
const compactMoney = (valueInPaisa: number) => {
  const n = paisaToRupees(valueInPaisa);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const fakeAccount = (name: string) => {
  const digits = String((name || '0000').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)).slice(-4);
  return `HBL ****${digits.padStart(4, '0')}`;
};

const periodLabel = (dateLike?: string) => {
  const d = new Date(dateLike || '');
  if (Number.isNaN(d.getTime())) return '-';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  if (day <= 10) return `${month} 1–10`;
  if (day <= 20) return `${month} 11–20`;
  return `${month} 21–${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
};

const AdminPayoutsPage = () => {
  const [receiptPayout, setReceiptPayout] = useState<PayoutItem | null>(null);
  const invalidate = useInvalidate();
  const statsReq = useApi(() => payoutService.getStats(), ["payout-stats"]);

  const kpi = useMemo(() => {
    const d = statsReq.data?.data;
    return {
      pendingPayouts: d?.pendingPayouts ?? 0,
      pendingTotalInPaisa: d?.pendingTotalInPaisa ?? 0,
      paidPayouts: d?.paidPayouts ?? 0,
      paidTotalInPaisa: d?.paidTotalInPaisa ?? 0,
      avgPayoutInPaisa: d?.avgPayoutInPaisa ?? 0,
    };
  }, [statsReq.data]);

  const nextCycle = useMemo(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 10);
    if (now > next) next.setMonth(next.getMonth() + 1);
    const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { date: next.toLocaleString('en-US', { month: 'short', day: 'numeric' }), days };
  }, []);

  const handleRelease = async (id: string) => {
    try {
      await payoutService.update(id, { status: 'completed' });
      invalidate();
    } catch {
      alert('Failed to release payout');
    }
  };

  const releaseAll = async () => {
    try {
      const res = await payoutService.list({ status: 'pending', limit: 500 });
      const pending: PayoutItem[] = res?.data || [];
      for (const p of pending) {
        await payoutService.update(p._id, { status: 'completed' });
      }
      invalidate();
    } catch {
      alert('Failed to release all payouts');
    }
  };

  if (statsReq.loading) return <AdminPageSkeleton variant="split" />;
  if (statsReq.error) return <ErrorBlock text={statsReq.error} />;

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Pending Payouts</div>
          <div className="ha-kpi-val white">{kpi.pendingPayouts}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--amber)' }}>PKR {compactMoney(kpi.pendingTotalInPaisa)} total</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Paid This Month</div>
          <div className="ha-kpi-val">{kpi.paidPayouts}</div>
          <div className="ha-kpi-change up">PKR {compactMoney(kpi.paidTotalInPaisa)} sent</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Next Payout Cycle</div>
          <div className="ha-kpi-val white">{nextCycle.date}</div>
          <div className="ha-kpi-change" style={{ color: 'var(--teal)' }}>{nextCycle.days} days away</div>
        </div>
        <div className="ha-kpi-card">
          <div className="ha-kpi-label">Avg Payout</div>
          <div className="ha-kpi-val">{compactMoney(kpi.avgPayoutInPaisa)}</div>
          <div className="ha-kpi-change up">PKR per salon</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} onClick={releaseAll}>Release All Pending</button>
      </div>

      <TABLE<PayoutItem>
        title="Payout Queue"
        queryKey={["admin-payouts"]}
        showPagination
        service={payoutService.list}
        columns={[
          { title: 'Salon' },
          { title: 'Period' },
          { title: 'Net Payout PKR' },
          { title: 'Bank Account' },
          { title: 'Status' },
          { title: 'Action' },
        ]}
        rows={(data) =>
          data?.map((item) => [
            <span className="ha-salon-name" style={{ fontSize: 14 }}>{item.salonId?.name || 'Unknown Salon'}</span>,
            periodLabel(item.createdAt),
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-light)' }}>{formatMoney(item.amountInPaisa)}</div>
              <div className="ha-salon-sub">{item.status === 'completed' ? `Paid: ${item.payoutDate ? new Date(item.payoutDate).toLocaleDateString() : '-'}` : ''}</div>
            </div>,
            <span className="ha-salon-sub">{fakeAccount(item.salonId?.name || '')}</span>,
            <span className={item.status === 'completed' ? 'ha-pill ha-pill-active' : 'ha-pill ha-pill-pending'}>
              {item.status === 'completed' ? 'Paid ✓' : 'Pending'}
            </span>,
            <div className="ha-actions">
              {item.status === 'completed' ? (
                <button className="ha-act-btn" onClick={() => setReceiptPayout(item)}>Receipt</button>
              ) : (
                <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} onClick={() => handleRelease(item._id)}>Release</button>
              )}
            </div>,
          ])
        }
      />

      {receiptPayout && (
        <PayoutDetailModal payout={receiptPayout} onClose={() => setReceiptPayout(null)} />
      )}
    </>
  );
};

export default AdminPayoutsPage;


