import { payoutPeriod as periodLabel } from '../../utils/payoutReceipt';
import { useMemo, useState } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import PayoutDetailModal from '../../components/PayoutDetailModal';
import ConfirmModal from '../../components/ConfirmModal';
import TABLE from '@/components/table';
import SearchableSelect from '@/components/form/SearchableSelect';
import RangeFilter from '@/components/form/RangeFilter';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { useToastStore } from '../../store/toastStore';
import { payoutService } from '../../services/payoutService';
import { downloadCsv } from '../../utils';
import { formatMoney, paisaToRupees, rupeesToPaisa } from '../../utils/money';

interface PayoutItem {
  _id: string;
  salonId?: { name?: string; _id?: string };
  amountInPaisa?: number;
  status?: string;
  payoutDate?: string;
  createdAt?: string;
  bankAccount?: string;
}

// Value is expected in paisa; formats the rupee amount compactly (1.2M, 45K).
const compactMoney = (valueInPaisa: number) => {
  const n = paisaToRupees(valueInPaisa);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};


const AdminPayoutsPage = () => {
  const [receiptPayout, setReceiptPayout] = useState<PayoutItem | null>(null);
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const statsReq = useApi(() => payoutService.getStats(), ["payout-stats"]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [netMin, setNetMin] = useState('');
  const [netMax, setNetMax] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [releasingAll, setReleasingAll] = useState(false);
  const [confirmReleaseAll, setConfirmReleaseAll] = useState(false);

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

  const hasActiveFilters = Boolean(
    search || statusFilter !== 'all' || dateFrom || dateTo || netMin || netMax || bankAccount,
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setNetMin('');
    setNetMax('');
    setBankAccount('');
  };

  const filterParams = {
    search,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(netMin ? { netMin: rupeesToPaisa(Number(netMin)) } : {}),
    ...(netMax ? { netMax: rupeesToPaisa(Number(netMax)) } : {}),
    ...(bankAccount ? { bankAccount } : {}),
  };

  const handleRelease = async (id: string) => {
    setPendingActionId(id);
    try {
      await payoutService.update(id, { status: 'completed' });
      invalidate();
      showToast('Payout released successfully.');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to release payout';
      showToast(message, 'error');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleRetry = async (id: string) => {
    setPendingActionId(id);
    try {
      await payoutService.update(id, { status: 'pending' });
      invalidate();
      showToast('Payout reset to pending — ready to release again.');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resolve payout';
      showToast(message, 'error');
    } finally {
      setPendingActionId(null);
    }
  };

  const releaseAll = () => setConfirmReleaseAll(true);

  const confirmAndReleaseAll = async () => {
    setConfirmReleaseAll(false);
    setReleasingAll(true);
    try {
      const res = await payoutService.list({ status: 'pending', limit: 500 });
      const pending: PayoutItem[] = res?.data || [];

      if (!pending.length) {
        showToast('No pending payouts to release.');
        return;
      }

      const results = await Promise.allSettled(
        pending.map((p) => payoutService.update(p._id, { status: 'completed' })),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;

      invalidate();

      if (succeeded > 0 && failed === 0) {
        showToast(`Released ${succeeded} pending payout${succeeded === 1 ? '' : 's'}.`);
      } else if (succeeded > 0 && failed > 0) {
        showToast(`Released ${succeeded} of ${pending.length} payouts — ${failed} failed.`, 'error');
      } else {
        showToast('Failed to release all payouts.', 'error');
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to release all payouts';
      showToast(message, 'error');
    } finally {
      setReleasingAll(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await payoutService.list({ ...filterParams, limit: 1000 });
      const items: PayoutItem[] = res?.data || [];
      const rows = [
        ['Salon', 'Period', 'Net Payout PKR', 'Bank Account', 'Status'],
        ...items.map((item) => [
          item.salonId?.name || 'Unknown Salon',
          periodLabel(item.createdAt),
          String(paisaToRupees(item.amountInPaisa || 0)),
          item.bankAccount || 'Not on file',
          item.status || '',
        ]),
      ];
      downloadCsv(`hermoso-payouts-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to export payouts';
      showToast(message, 'error');
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

      <div className="ha-card" style={{ paddingBottom: 0 }}>
        <div className="ha-card-title">
          Payout Queue
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <span style={{ minWidth: 160, display: 'inline-block' }}>
              <SearchableSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
            </span>
            <button className="ha-act-btn" onClick={handleExport}>
              Export
            </button>
            <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} onClick={releaseAll} disabled={releasingAll}>
              {releasingAll ? 'Releasing...' : 'Release All Pending'}
            </button>
          </span>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 320 }}
            placeholder="Search by salon name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="ha-btn-secondary"
            onClick={() => setShowMoreFilters((v) => !v)}
          >
            {showMoreFilters ? 'Hide Filters' : 'More Filters'}
          </button>
          {hasActiveFilters && (
            <button type="button" className="ha-btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {showMoreFilters && (
          <div className="ha-card" style={{ marginBottom: 12, background: 'var(--surface-soft)' }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">Period From</label>
                <input type="date" className="ha-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">Period To</label>
                <input type="date" className="ha-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <RangeFilter label="Net Payout PKR" min={netMin} max={netMax} onMin={setNetMin} onMax={setNetMax} />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">Bank Account</label>
                <input type="text" className="ha-input" placeholder="Search bank account..." value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      <TABLE<PayoutItem>
        noBorder
        queryKey={["admin-payouts"]}
        showPagination
        service={payoutService.list}
        serviceParams={filterParams}
        columns={[
          { title: 'Salon' },
          { title: 'Period' },
          { title: 'Net Payout PKR' },
          { title: 'Bank Account' },
          { title: 'Status' },
          { title: 'Action' },
        ]}
        rows={(data) =>
          data?.map((item) => {
            const isPending = pendingActionId === item._id;
            return [
              <span className="ha-salon-name" style={{ fontSize: 14 }}>{item.salonId?.name || 'Unknown Salon'}</span>,
              periodLabel(item.createdAt),
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-light)' }}>{formatMoney(item.amountInPaisa)}</div>
                <div className="ha-salon-sub">{item.status === 'completed' ? `Paid: ${item.payoutDate ? new Date(item.payoutDate).toLocaleDateString() : '-'}` : ''}</div>
              </div>,
              <span className="ha-salon-sub">{item.bankAccount || 'Not on file'}</span>,
              <span
                className={
                  item.status === 'completed'
                    ? 'ha-pill ha-pill-active'
                    : item.status === 'failed'
                      ? 'ha-pill ha-pill-suspended'
                      : 'ha-pill ha-pill-pending'
                }
              >
                {item.status === 'completed' ? 'Paid ✓' : item.status === 'failed' ? 'Failed' : 'Pending'}
              </span>,
              <div className="ha-actions">
                {item.status === 'completed' ? (
                  <button className="ha-act-btn" onClick={() => setReceiptPayout(item)}>Receipt</button>
                ) : item.status === 'failed' ? (
                  <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} disabled={isPending} onClick={() => handleRetry(item._id)}>
                    {isPending ? 'Resolving...' : 'Retry'}
                  </button>
                ) : (
                  <button className="ha-topbar-btn primary" style={{ padding: '6px 12px' }} disabled={isPending} onClick={() => handleRelease(item._id)}>
                    {isPending ? 'Releasing...' : 'Release'}
                  </button>
                )}
              </div>,
            ];
          })
        }
      />

      {receiptPayout && (
        <PayoutDetailModal payout={receiptPayout} onClose={() => setReceiptPayout(null)} />
      )}

      {confirmReleaseAll && (
        <ConfirmModal
          title="Release All Pending Payouts"
          message="This will mark every pending payout as completed. This action cannot be undone. Continue?"
          confirmLabel="Release All"
          danger
          onConfirm={confirmAndReleaseAll}
          onCancel={() => setConfirmReleaseAll(false)}
        />
      )}
    </>
  );
};

export default AdminPayoutsPage;
