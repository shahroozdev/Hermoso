import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';
import { bookingService } from '../../services/bookingService';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const preSelectedSalon = searchParams.get('salonId') || '';
  const salons = useApi(() => salonService.list({ page: 1, limit: 50 }), []);
  const [selectedSalon, setSelectedSalon] = useState(preSelectedSalon);
  const [payload, setPayload] = useState({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
  const bookingOptions = useApi(
    () => (selectedSalon ? bookingService.getOptions({ salonId: selectedSalon, serviceId: payload.serviceId || undefined }) : Promise.resolve({ data: { services: [], staff: [] } })),
    [selectedSalon, payload.serviceId],
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<{ time: string; label?: string; available: boolean }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    if (preSelectedSalon) setSelectedSalon(preSelectedSalon);
  }, [preSelectedSalon]);

  useEffect(() => {
    setPayload({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
    setSlots([]);
    setSlotError('');
  }, [selectedSalon]);

  const canFetchSlots = useMemo(
    () => Boolean(selectedSalon && payload.serviceId && payload.staffId && payload.bookingDate),
    [selectedSalon, payload.serviceId, payload.staffId, payload.bookingDate],
  );

  useEffect(() => {
    const fetchSlots = async () => {
      if (!canFetchSlots) {
        setSlots([]);
        setSlotError('');
        return;
      }
      setSlotLoading(true);
      setSlotError('');
      try {
        const result = await bookingService.getAvailability({
          salonId: selectedSalon,
          serviceId: payload.serviceId,
          staffId: payload.staffId,
          date: payload.bookingDate,
        });
        setSlots(result?.data?.slots || []);
        setPayload((prev) => ({ ...prev, bookingTime: '' }));
      } catch (err: any) {
        setSlots([]);
        setSlotError(err.response?.data?.message || 'Failed to load available slots');
      } finally {
        setSlotLoading(false);
      }
    };

    fetchSlots();
  }, [canFetchSlots, selectedSalon, payload.serviceId, payload.staffId, payload.bookingDate]);
  const submit = async () => {
    setMessage('');
    setError('');
    try {
      await bookingService.create({ salonId: selectedSalon, ...payload });
      setMessage('Booking created successfully.');
      setPayload({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  // if (salons.loading) return <LoadingBlock text="Loading booking form..." />;
  if (salons.error) return <ErrorBlock text={salons.error} />;

  return (
    <div className="mx-auto container space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <h2 className="text-2xl font-semibold">Book Appointment</h2>
        <p className="mt-2 text-sm text-slate-500">Select salon, service, date and pick a real-time available slot.</p>
      </div>

      <div className="shell-panel rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <select className="rounded border p-2" value={selectedSalon} onChange={(e) => setSelectedSalon(e.target.value)} disabled={salons.loading}>
          <option value="">Select Salon</option>
          {(salons.data?.data || []).map((salon) => <option key={salon._id} value={salon._id}>{salon.name}</option>)}
        </select>

          <select className="rounded border p-2" value={payload.serviceId} onChange={(e) => setPayload({ ...payload, serviceId: e.target.value })} disabled={!selectedSalon}>
          <option value="">Select Service</option>
          {(bookingOptions.data?.data?.services || []).map((item) => <option key={item._id} value={item._id}>{item.name} (${item.price})</option>)}
        </select>

          <select className="rounded border p-2" value={payload.staffId} onChange={(e) => setPayload({ ...payload, staffId: e.target.value })} disabled={!selectedSalon}>
          <option value="">Select Staff</option>
          {(bookingOptions.data?.data?.staff || []).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select>

          <input className="rounded border p-2" type="date" min={new Date().toISOString().split('T')[0]} value={payload.bookingDate} onChange={(e) => setPayload({ ...payload, bookingDate: e.target.value })} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Available Slots</h3>
          {slotLoading ? <p className="mt-2 text-sm text-slate-500">Loading slots...</p> : null}
          {slotError ? <p className="mt-2 text-sm text-red-600">{slotError}</p> : null}
          {!slotLoading && !slotError && canFetchSlots ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.length ? slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setPayload({ ...payload, bookingTime: slot.time })}
                  className={`rounded-full border px-4 py-2 text-sm ${payload.bookingTime === slot.time ? 'border-primary bg-primary text-white' : 'border-slate-300 text-slate-700'} ${!slot.available ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {slot.label || slot.time}
                </button>
              )) : <p className="text-sm text-slate-500">No slots available for this date.</p>}
            </div>
          ) : null}
          {!canFetchSlots ? <p className="mt-2 text-sm text-slate-500">Pick service, staff and date to load slots.</p> : null}
        </div>

        <button
          onClick={submit}
          disabled={!selectedSalon || !payload.serviceId || !payload.staffId || !payload.bookingDate || !payload.bookingTime}
          className="mt-6 rounded bg-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Booking
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default BookingPage;
