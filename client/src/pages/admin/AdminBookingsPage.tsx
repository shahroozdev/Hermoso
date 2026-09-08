import { useMemo, useState } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { bookingService } from '../../services/bookingService';
import { useToastStore } from '../../store/toastStore';
import { formatMoney, rupeesToPaisa } from '../../utils/money';
import { downloadCsv } from '../../utils';
import SearchableSelect from '@/components/form/SearchableSelect';
import RangeFilter from '@/components/form/RangeFilter';

interface BookingItem {
  _id: string;
  customerId?: { name?: string; email?: string };
  salonId?: { name?: string; location?: { city?: string } };
  serviceId?: { name?: string };
  bookingDate?: string;
  bookingTime?: string;
  priceInPaisa?: number;
  status?: string;
}

type DatePreset = 'all' | 'current_month' | 'last_month' | 'current_year' | 'last_year' | 'custom';

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

const computePresetRange = (preset: DatePreset): { from: string; to: string } => {
  const now = new Date();
  switch (preset) {
    case 'current_month':
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIsoDate(now) };
    case 'last_month':
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case 'current_year':
      return { from: toIsoDate(new Date(now.getFullYear(), 0, 1)), to: toIsoDate(now) };
    case 'last_year':
      return {
        from: toIsoDate(new Date(now.getFullYear() - 1, 0, 1)),
        to: toIsoDate(new Date(now.getFullYear() - 1, 11, 31)),
      };
    default:
      return { from: '', to: '' };
  }
};

const statusPillClass = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'ha-pill ha-pill-active';
  if (s === 'cancelled') return 'ha-pill ha-pill-suspended';
  if (s === 'confirmed') return 'ha-pill ha-pill-pending';
  return 'ha-pill ha-pill-booking';
};

const bookingIdOf = (id: string) => `#HRM-${id.slice(-4).toUpperCase()}`;

const AdminBookingsPage = () => {
  const invalidate = useInvalidate();
  const { showToast } = useToastStore();
  const statsReq = useApi(() => bookingService.getStats(), ["booking-stats"]);

  const [bookingIdSearch, setBookingIdSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [salonSearch, setSalonSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const metrics = useMemo(() => ({
    completedToday: statsReq.data?.data?.completedToday ?? 0,
    upcoming: statsReq.data?.data?.upcoming ?? 0,
    cancellations: statsReq.data?.data?.cancellations ?? 0,
    events: statsReq.data?.data?.events ?? 0,
  }), [statsReq.data]);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'all' || preset === 'custom') {
      if (preset === 'all') {
        setFromDate('');
        setToDate('');
      }
      return;
    }
    const range = computePresetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await bookingService.updateStatus(id, status);
      invalidate();
      showToast(status === 'cancelled' ? 'Booking cancelled.' : 'Booking confirmed.');
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showToast(apiErr.response?.data?.message || 'Failed to update booking status. Please try again.', 'error');
    }
  };

  const hasActiveFilters = Boolean(
    bookingIdSearch || customerSearch || salonSearch || serviceSearch ||
      amountMin || amountMax || statusFilter !== 'all' || fromDate || toDate,
  );

  const clearFilters = () => {
    setBookingIdSearch('');
    setCustomerSearch('');
    setSalonSearch('');
    setServiceSearch('');
    setAmountMin('');
    setAmountMax('');
    setStatusFilter('all');
    setDatePreset('all');
    setFromDate('');
    setToDate('');
  };

  const filterParams = {
    ...(bookingIdSearch ? { bookingId: bookingIdSearch } : {}),
    ...(customerSearch ? { customer: customerSearch } : {}),
    ...(salonSearch ? { salon: salonSearch } : {}),
    ...(serviceSearch ? { service: serviceSearch } : {}),
    ...(amountMin ? { amountMin: rupeesToPaisa(Number(amountMin)) } : {}),
    ...(amountMax ? { amountMax: rupeesToPaisa(Number(amountMax)) } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const handleExport = async () => {
    try {
      const res = await bookingService.list({ page: 1, limit: 1000, ...filterParams });
      const items: BookingItem[] = res?.data || [];
      const rows = [
        ['Booking ID', 'Customer', 'Salon', 'Service', 'Date', 'Time', 'Amount', 'Status'],
        ...items.map((item) => {
          const d = item.bookingDate ? new Date(item.bookingDate) : null;
          const datePart = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
          return [
            bookingIdOf(String(item._id)),
            item.customerId?.name || '-',
            item.salonId?.name || '-',
            item.serviceId?.name || '-',
            datePart,
            item.bookingTime || '-',
            String(Math.round((item.priceInPaisa || 0) / 100)),
            item.status || 'pending',
          ];
        }),
      ];
      downloadCsv(`hermoso-bookings-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showToast(apiErr.response?.data?.message || 'Failed to export bookings', 'error');
    }
  };

  if (statsReq.loading) return <AdminPageSkeleton variant="table" />;
  if (statsReq.error) return <ErrorBlock text={statsReq.error} />;

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Completed Today</div><div className="ha-kpi-val">{metrics.completedToday}</div><div className="ha-kpi-change up">Live closures</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Upcoming</div><div className="ha-kpi-val white">{metrics.upcoming}</div><div className="ha-kpi-change up">Pending/confirmed</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Cancellations</div><div className="ha-kpi-val white">{metrics.cancellations}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs attention</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Event Bookings</div><div className="ha-kpi-val">{metrics.events}</div><div className="ha-kpi-change up">Bridal packages</div></div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">
          All Bookings
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button className="ha-act-btn" onClick={handleExport}>Export</button>
          </span>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 160 }}
            placeholder="Booking ID..."
            value={bookingIdSearch}
            onChange={(e) => setBookingIdSearch(e.target.value)}
          />
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 180 }}
            placeholder="Customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 180 }}
            placeholder="Salon..."
            value={salonSearch}
            onChange={(e) => setSalonSearch(e.target.value)}
          />
          <input
            type="text"
            className="ha-input"
            style={{ maxWidth: 180 }}
            placeholder="Service..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
          />
          <span style={{ minWidth: 150, display: 'inline-block' }}>
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </span>
          <button type="button" className="ha-btn-secondary" onClick={() => setShowMoreFilters((v) => !v)}>
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
              <RangeFilter label="Amount" min={amountMin} max={amountMax} onMin={setAmountMin} onMax={setAmountMax} />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">Date Preset</label>
                <SearchableSelect
                  value={datePreset}
                  onChange={(v) => handleDatePresetChange(v as DatePreset)}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'current_year', label: 'Current Year' },
                    { value: 'last_year', label: 'Last Year' },
                    { value: 'current_month', label: 'Current Month' },
                    { value: 'last_month', label: 'Last Month' },
                    { value: 'custom', label: 'Custom Range' },
                  ]}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">From Date</label>
                <input
                  type="date"
                  className="ha-input"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setDatePreset('custom'); }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted">To Date</label>
                <input
                  type="date"
                  className="ha-input"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setDatePreset('custom'); }}
                />
              </div>
            </div>
          </div>
        )}

        <TABLE<BookingItem>
          noBorder
          queryKey={["admin-bookings"]}
          showPagination
          service={bookingService.list}
          serviceParams={filterParams}
          columns={[
            { title: 'Booking ID' },
            { title: 'Customer' },
            { title: 'Salon' },
            { title: 'Service' },
            { title: 'Date' },
            { title: 'Time' },
            { title: 'Amount' },
            { title: 'Type' },
            { title: 'Status' },
            { title: 'Actions' },
          ]}
          rows={(data) =>
            data?.map((item) => {
              const safeId = String(item._id);
              const bookingId = bookingIdOf(safeId);
              const svc = (item.serviceId?.name ?? '').toLowerCase();
              const type = svc.includes('bridal') || svc.includes('package') || svc.includes('event') ? 'event' : 'appointment';
              const d = item.bookingDate ? new Date(item.bookingDate) : null;
              const datePart = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
              const timePart = item.bookingTime || '-';
              return [
                <span style={{ color: 'var(--teal)' }}>{bookingId}</span>,
                item.customerId?.name || '-',
                item.salonId?.name || '-',
                item.serviceId?.name || '-',
                datePart,
                timePart,
                <span className="ha-money">{formatMoney(item.priceInPaisa)}</span>,
                <span className={type === 'event' ? 'ha-pill ha-pill-event' : 'ha-pill ha-pill-booking'}>{type}</span>,
                <span className={statusPillClass(item.status ?? 'pending')}>{item.status || 'pending'}</span>,
                <div className="ha-actions">
                  {item.status === 'pending' && (
                    <button className="ha-act-btn" onClick={() => handleStatusUpdate(safeId, 'confirmed')}>Confirm</button>
                  )}
                  {item.status !== 'cancelled' && item.status !== 'completed' && (
                    <button className="ha-act-btn" onClick={() => handleStatusUpdate(safeId, 'cancelled')}>Cancel</button>
                  )}
                </div>,
              ];
            })
          }
        />
      </div>
    </>
  );
};

export default AdminBookingsPage;
