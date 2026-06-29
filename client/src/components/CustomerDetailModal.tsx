import GenericModal from './GenericModal';
import LoadingBlock from './LoadingBlock';
import { useApi } from '../hooks/useApi';
import { customerService } from '../services/customerService';

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
}

const CustomerDetailModal = ({ customerId, onClose }: CustomerDetailModalProps) => {
  const { data, loading, error } = useApi(() => customerService.getActivity(customerId), [customerId]);

  const customer = (data?.data as Record<string, unknown>)?.customer || {};
  const bookings = ((data?.data as Record<string, unknown>)?.bookings || []) as Record<string, unknown>[];

  return (
    <GenericModal title="Customer Details" onClose={onClose}>
      {loading ? (
        <LoadingBlock text="Loading customer details..." />
      ) : error ? (
        <div className="ha-error-banner">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Name</label>
              <p className="text-sm font-medium">{(customer as Record<string, string>)?.name || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Email</label>
              <p className="text-sm font-medium">{(customer as Record<string, string>)?.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Phone</label>
              <p className="text-sm font-medium">{(customer as Record<string, string>)?.phone || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Status</label>
              <p className="text-sm font-medium">{(customer as Record<string, string>)?.status || '-'}</p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Booking History ({bookings.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted">No bookings found.</p>
              ) : (
                bookings.map((b, idx) => (
                  <div key={idx} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{(b.salonId as Record<string, string>)?.name || 'N/A'}</span>
                      <span className="text-muted">{(b as Record<string, string>)?.bookingDate ? new Date((b as Record<string, string>).bookingDate).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted">
                      <span>{(b.serviceId as Record<string, string>)?.name || 'N/A'}</span>
                      <span>PKR {(b as Record<string, number>)?.price?.toLocaleString() || '0'}</span>
                    </div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize font-medium ${(b as Record<string, string>)?.status === 'confirmed' ? 'bg-green-100 text-green-800' : (b as Record<string, string>)?.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {(b as Record<string, string>)?.status || 'pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </GenericModal>
  );
};

export default CustomerDetailModal;