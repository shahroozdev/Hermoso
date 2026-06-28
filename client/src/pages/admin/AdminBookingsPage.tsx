import AdminPageSkeleton from '../../components/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { bookingService } from '../../services/bookingService';

const toLower = (value) => String(value || '').toLowerCase();

const isEventService = (serviceName) => {
  const name = toLower(serviceName);
  return name.includes('bridal') || name.includes('package') || name.includes('event');
};

const formatDateTime = (bookingDate, bookingTime) => {
  const d = new Date(bookingDate);
  const datePart = Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  const timePart = bookingTime || '-';
  return `${datePart} ${timePart}`;
};

const statusPill = (status) => {
  const normalized = toLower(status);
  if (normalized === 'completed') return 'ha-pill ha-pill-active';
  if (normalized === 'cancelled') return 'ha-pill ha-pill-suspended';
  if (normalized === 'confirmed') return 'ha-pill ha-pill-pending';
  return 'ha-pill ha-pill-booking';
};

const AdminBookingsPage = () => {
  const req = useApi(() => bookingService.list({ page: 1, limit: 100 }), []);

  if (req.loading) return <AdminPageSkeleton variant="table" />;
  if (req.error) return <ErrorBlock text={req.error} />;

  const bookings = Array.isArray(req.data?.data) ? req.data.data : [];

  const todayStr = new Date().toDateString();
  const metrics = {
    completedToday: bookings.filter((b) => toLower(b?.status) === 'completed' && new Date(b?.bookingDate).toDateString() === todayStr).length,
    upcoming: bookings.filter((b) => ['pending', 'confirmed'].includes(toLower(b?.status))).length,
    cancellations: bookings.filter((b) => toLower(b?.status) === 'cancelled').length,
    events: bookings.filter((b) => isEventService(b?.serviceId?.name)).length
  };

  const rows = bookings.map((b, idx) => {
    const safeId = b?._id ? String(b._id) : `tmp-${idx}`;
    const bookingId = `#HRM-${safeId.slice(-4).toUpperCase()}`;
    const amount = Math.round(Number(b?.price || 0));
    const commission = Math.round(amount * 0.1);

    return {
      id: safeId,
      bookingId,
      customer: b?.customerId?.name || '-',
      salon: b?.salonId?.name || '-',
      service: b?.serviceId?.name || '-',
      datetime: formatDateTime(b?.bookingDate, b?.bookingTime),
      amount,
      commission,
      type: isEventService(b?.serviceId?.name) ? 'event' : 'appointment',
      status: b?.status || 'pending'
    };
  });

  return (
    <>
      <div className="ha-kpi-row">
        <div className="ha-kpi-card"><div className="ha-kpi-label">Completed Today</div><div className="ha-kpi-val">{metrics.completedToday}</div><div className="ha-kpi-change up">Live closures</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Upcoming Today</div><div className="ha-kpi-val white">{metrics.upcoming}</div><div className="ha-kpi-change up">Pending/confirmed</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Cancellations</div><div className="ha-kpi-val white">{metrics.cancellations}</div><div className="ha-kpi-change" style={{ color: 'var(--rose)' }}>Needs attention</div></div>
        <div className="ha-kpi-card"><div className="ha-kpi-label">Event Bookings</div><div className="ha-kpi-val">{metrics.events}</div><div className="ha-kpi-change up">Bridal packages</div></div>
      </div>

      <div className="ha-card">
        <div className="ha-card-title">All Bookings <span>Live feed</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ha-salon-table">
            <thead>
              <tr>
                <th>Booking ID</th><th>Customer</th><th>Salon</th><th>Service</th><th>Date & Time</th><th>Amount</th><th>Commission</th><th>Type</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ color: 'var(--text-muted)' }}>No bookings found.</td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--teal)' }}>{r.bookingId}</td>
                  <td>{r.customer}</td>
                  <td>{r.salon}</td>
                  <td>{r.service}</td>
                  <td>{r.datetime}</td>
                  <td className="ha-money">{r.amount.toLocaleString()}</td>
                  <td style={{ color: r.commission > 0 ? 'var(--green)' : 'var(--rose)', fontWeight: 700 }}>{r.commission.toLocaleString()}</td>
                  <td>
                    <span className={r.type === 'event' ? 'ha-pill ha-pill-event' : 'ha-pill ha-pill-booking'}>{r.type}</span>
                  </td>
                  <td>
                    <span className={statusPill(r.status)}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminBookingsPage;


