import { useMemo } from 'react';
import AdminPageSkeleton from '../../components/skeletons/AdminPageSkeleton';
import ErrorBlock from '../../components/ErrorBlock';
import TABLE from '@/components/table';
import { useApi } from '../../hooks/useApi';
import { useInvalidate } from '../../hooks/useInvalidate';
import { bookingService } from '../../services/bookingService';

interface BookingItem {
  _id: string;
  customerId?: { name?: string; email?: string };
  salonId?: { name?: string; location?: { city?: string } };
  serviceId?: { name?: string };
  bookingDate?: string;
  bookingTime?: string;
  price?: number;
  status?: string;
}

const statusPillClass = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'ha-pill ha-pill-active';
  if (s === 'cancelled') return 'ha-pill ha-pill-suspended';
  if (s === 'confirmed') return 'ha-pill ha-pill-pending';
  return 'ha-pill ha-pill-booking';
};

const AdminBookingsPage = () => {
  const invalidate = useInvalidate();
  const statsReq = useApi(() => bookingService.getStats(), []);

  const metrics = useMemo(() => ({
    completedToday: statsReq.data?.data?.completedToday ?? 0,
    upcoming: statsReq.data?.data?.upcoming ?? 0,
    cancellations: statsReq.data?.data?.cancellations ?? 0,
    events: statsReq.data?.data?.events ?? 0,
  }), [statsReq.data]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await bookingService.updateStatus(id, status);
      invalidate();
    } catch {
      alert('Failed to update booking status');
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

      <TABLE<BookingItem>
        title="All Bookings"
        showPagination
        service={bookingService.list}
        columns={[
          { title: 'Booking ID' },
          { title: 'Customer' },
          { title: 'Salon' },
          { title: 'Service' },
          { title: 'Date & Time' },
          { title: 'Amount' },
          { title: 'Type' },
          { title: 'Status' },
          { title: 'Actions' },
        ]}
        rows={(data) =>
          data?.map((item) => {
            const safeId = String(item._id);
            const bookingId = `#HRM-${safeId.slice(-4).toUpperCase()}`;
            const amount = Math.round(Number(item.price ?? 0));
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
              `${datePart} ${timePart}`,
              <span className="ha-money">{amount.toLocaleString()}</span>,
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
    </>
  );
};

export default AdminBookingsPage;


