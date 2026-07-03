import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';
import { bookingService } from '../../services/bookingService';

const BookingForm = ({ selectedSalon, setSelectedSalon, salons, fromAiScan, preSelectedTreatments }: { selectedSalon: string; setSelectedSalon: (v: string) => void; salons: { loading: boolean; error: string; data: { data: { _id: string; name: string }[] } | null }; fromAiScan?: boolean; preSelectedTreatments?: string[] }) => {
  const [payload, setPayload] = useState({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<{ time: string; label?: string; available: boolean }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');

  const bookingOptions = useApi(
    () => (selectedSalon ? bookingService.getOptions({ salonId: selectedSalon, serviceId: payload.serviceId || undefined }) : Promise.resolve({ data: { services: [], staff: [] } })),
    [selectedSalon, payload.serviceId],
  );

  // CR-20: Auto-select first service that matches AI scan recommendations
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    if (fromAiScan && preSelectedTreatments?.length && bookingOptions.data?.data?.services?.length && !hasAutoSelectedRef.current) {
      const matchedService = bookingOptions.data.data.services.find((svc: { name: string }) =>
        preSelectedTreatments.some((treatment) => svc.name.toLowerCase().includes(treatment.toLowerCase()) || treatment.toLowerCase().includes(svc.name.toLowerCase()))
      );
      if (matchedService) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: auto-select service from AI scan on initial load
        setPayload((prev) => ({ ...prev, serviceId: matchedService._id }));
        hasAutoSelectedRef.current = true;
      }
    }
  }, [fromAiScan, preSelectedTreatments, bookingOptions.data]);

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
      } catch (err: unknown) {
        setSlots([]);
        setSlotError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load available slots');
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

  return (
    <div className="shell-panel rounded-2xl p-6">
      {/* CR-20: AI Scan Badge */}
      {fromAiScan && preSelectedTreatments?.length ? (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1l2 4.2 4.6.6-3.3 3.2.8 4.6L8 11.2 3.9 13.6l.8-4.6L1.4 5.8l4.6-.6L8 1z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-700">AI-Matched Booking</p>
              <p className="text-xs text-emerald-600">Recommended treatments: {preSelectedTreatments.join(', ')}</p>
            </div>
          </div>
        </div>
      ) : null}
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

      {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as { salonId?: string; preSelectedTreatments?: string[]; fromAiScan?: boolean } | null;

  const preSelectedSalon = locationState?.salonId || searchParams.get('salonId') || '';
  const [selectedSalon, setSelectedSalon] = useState(preSelectedSalon);
  const salons = useApi(() => salonService.list({ page: 1, limit: 50 }), []);

  if (salons.error) return <ErrorBlock text={salons.error} />;

  return (
    <div key={preSelectedSalon || '_'} className="mx-auto container space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <h2 className="text-2xl font-semibold">Book Appointment</h2>
        <p className="mt-2 text-sm text-slate-500">
          {locationState?.fromAiScan ? 'Complete your AI-recommended booking' : 'Select salon, service, date and pick a real-time available slot.'}
        </p>
      </div>

      <BookingForm
        key={selectedSalon || '_'}
        selectedSalon={selectedSalon}
        setSelectedSalon={setSelectedSalon}
        salons={salons}
        fromAiScan={locationState?.fromAiScan}
        preSelectedTreatments={locationState?.preSelectedTreatments}
      />
    </div>
  );
};

export default BookingPage;