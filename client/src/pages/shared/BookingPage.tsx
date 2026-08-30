import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ErrorBlock from '../../components/ErrorBlock';
import { useApi } from '../../hooks/useApi';
import { salonService } from '../../services/salonService';
import { bookingService } from '../../services/bookingService';

interface ServiceCardState {
  serviceId: string;
  serviceName: string;
  staffId: string;
  bookingDate: string;
  bookingTime: string;
  slots: { time: string; label?: string; available: boolean }[];
  slotLoading: boolean;
  slotError: string;
  submitting: boolean;
  message: string;
  error: string;
}

const createCardState = (serviceId: string, serviceName: string): ServiceCardState => ({
  serviceId,
  serviceName,
  staffId: '',
  bookingDate: '',
  bookingTime: '',
  slots: [],
  slotLoading: false,
  slotError: '',
  submitting: false,
  message: '',
  error: '',
});

const BookingCard = ({
  state,
  setState,
  selectedSalon,
  staffList,
  staffLoading,
}: {
  state: ServiceCardState;
  setState: (s: ServiceCardState) => void;
  selectedSalon: string;
  staffList: { _id: string; name: string; services: string[] }[];
  staffLoading: boolean;
}) => {
  const serviceStaff = staffList.filter(
    (s) => !s.services.length || s.services.includes(state.serviceId)
  );
  const canFetchSlots = Boolean(selectedSalon && state.serviceId && state.staffId && state.bookingDate);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!canFetchSlots) {
        setState({ ...state, slots: [], slotError: '', slotLoading: false });
        return;
      }
      setState({ ...state, slotLoading: true, slotError: '' });
      try {
        const result = await bookingService.getAvailability({
          salonId: selectedSalon,
          serviceId: state.serviceId,
          staffId: state.staffId,
          date: state.bookingDate,
        });
        setState({ ...state, slots: result?.data?.slots || [], slotLoading: false, bookingTime: '' });
      } catch (err: unknown) {
        setState({
          ...state,
          slots: [],
          slotError: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load slots',
          slotLoading: false,
        });
      }
    };
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchSlots, selectedSalon, state.serviceId, state.staffId, state.bookingDate]);

  const submit = async () => {
    setState({ ...state, submitting: true, message: '', error: '' });
    try {
      const result = await bookingService.create({
        salonId: selectedSalon,
        serviceId: state.serviceId,
        staffId: state.staffId,
        bookingDate: state.bookingDate,
        bookingTime: state.bookingTime,
      });

      const bookingId = result?.data?.booking?._id;
      if (bookingId) {
        const checkoutResult = await bookingService.createCheckout(bookingId);
        if (checkoutResult?.data?.checkoutUrl) {
          window.location.href = checkoutResult.data.checkoutUrl;
          return;
        }
      }

      setState({
        ...state,
        submitting: false,
        message: `${state.serviceName} booked successfully!`,
        staffId: '',
        bookingDate: '',
        bookingTime: '',
        slots: [],
      });
    } catch (err) {
      setState({
        ...state,
        submitting: false,
        error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Booking failed',
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <h3 className="font-semibold text-lg text-slate-800">{state.serviceName}</h3>

      <select
        className="w-full rounded border p-2 text-sm"
        value={state.staffId}
        onChange={(e) => setState({ ...state, staffId: e.target.value, bookingTime: '', slots: [] })}
        disabled={staffLoading || state.submitting}
      >
        <option value="">Select Staff</option>
        {serviceStaff.map((item) => (
          <option key={item._id} value={item._id}>{item.name}</option>
        ))}
      </select>

      <input
        className="w-full rounded border p-2 text-sm"
        type="date"
        min={new Date().toISOString().split('T')[0]}
        value={state.bookingDate}
        onChange={(e) => setState({ ...state, bookingDate: e.target.value })}
        disabled={state.submitting}
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Available Slots</p>
        {state.slotLoading ? <p className="text-sm text-slate-500">Loading slots...</p> : null}
        {state.slotError ? <p className="text-sm text-red-600">{state.slotError}</p> : null}
        {!state.slotLoading && !state.slotError && canFetchSlots ? (
          <div className="flex flex-wrap gap-2">
            {state.slots.length ? state.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available || state.submitting}
                onClick={() => setState({ ...state, bookingTime: slot.time })}
                className={`rounded-full border px-4 py-2 text-sm ${state.bookingTime === slot.time ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-700'} ${!slot.available ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {slot.label || slot.time}
              </button>
            )) : <p className="text-sm text-slate-500">No slots available for this date.</p>}
          </div>
        ) : null}
        {!canFetchSlots ? <p className="text-sm text-slate-500">Pick staff and date to load slots.</p> : null}
      </div>

      <button
        onClick={submit}
        disabled={!selectedSalon || !state.staffId || !state.bookingDate || !state.bookingTime || state.submitting}
        className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.submitting ? 'Booking...' : `Book ${state.serviceName}`}
      </button>

      {state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </div>
  );
};

const BookingForm = ({ selectedSalon, setSelectedSalon, salons, fromAiScan, preSelectedTreatments }: { selectedSalon: string; setSelectedSalon: (v: string) => void; salons: { loading: boolean; error: string; data: { data: { _id: string; name: string }[] } | null }; fromAiScan?: boolean; preSelectedTreatments?: string[] }) => {
  const [payload, setPayload] = useState({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<{ time: string; label?: string; available: boolean }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');

  const bookingOptions = useApi(
    () => {
      if (!selectedSalon) return Promise.resolve({ data: { services: [], staff: [] } });
      if (fromAiScan) return bookingService.getOptions({ salonId: selectedSalon });
      return bookingService.getOptions({ salonId: selectedSalon, serviceId: payload.serviceId || undefined });
    },
    [selectedSalon, fromAiScan, payload.serviceId],
  );

  const matchedServices = useMemo(() => {
    if (!fromAiScan || !preSelectedTreatments?.length || !bookingOptions.data?.data?.services?.length) return [];
    return bookingOptions.data.data.services.filter((svc: { name: string }) =>
      preSelectedTreatments.some(
        (treatment) => svc.name.toLowerCase().includes(treatment.toLowerCase()) || treatment.toLowerCase().includes(svc.name.toLowerCase())
      )
    );
  }, [fromAiScan, preSelectedTreatments, bookingOptions.data]);

  const [cardStates, setCardStates] = useState<ServiceCardState[]>([]);

   
  useEffect(() => {
    if (matchedServices.length && !cardStates.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: Derive initial card states from matched services once on mount
      setCardStates(
        matchedServices.map((svc: { _id: string; name: string }) => createCardState(svc._id, svc.name))
      );
    }
  }, [matchedServices, cardStates.length]);

  const updateCard = useCallback((index: number, newState: ServiceCardState) => {
    setCardStates((prev) => {
      const next = [...prev];
      next[index] = newState;
      return next;
    });
  }, []);

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
      const result = await bookingService.create({ salonId: selectedSalon, ...payload });
      const bookingId = result?.data?.booking?._id;
      if (bookingId) {
        const checkoutResult = await bookingService.createCheckout(bookingId);
        if (checkoutResult?.data?.checkoutUrl) {
          window.location.href = checkoutResult.data.checkoutUrl;
          return;
        }
      }
      setMessage('Booking created successfully.');
      setPayload({ serviceId: '', staffId: '', bookingDate: '', bookingTime: '' });
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Booking failed');
    }
  };

  const staffList = bookingOptions.data?.data?.staff || [];

  if (fromAiScan && preSelectedTreatments?.length) {
    return (
      <div className="shell-panel rounded-2xl p-6 space-y-6">
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1l2 4.2 4.6.6-3.3 3.2.8 4.6L8 11.2 3.9 13.6l.8-4.6L1.4 5.8l4.6-.6L8 1z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-700">AI-Recommended Treatments</p>
              <p className="text-xs text-emerald-600">Book each treatment individually with your preferred staff</p>
            </div>
          </div>
        </div>

        {bookingOptions.loading ? (
          <p className="text-sm text-slate-500">Loading services...</p>
        ) : matchedServices.length === 0 ? (
          <p className="text-sm text-slate-500">No matching services found for this salon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cardStates.map((card, idx) => (
              <BookingCard
                key={card.serviceId}
                state={card}
                setState={(newState) => updateCard(idx, newState)}
                selectedSalon={selectedSalon}
                staffList={staffList}
                staffLoading={bookingOptions.loading}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="shell-panel rounded-2xl p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <select className="rounded border p-2" value={selectedSalon} onChange={(e) => setSelectedSalon(e.target.value)} disabled={salons.loading}>
          <option value="">Select Salon</option>
          {(salons?.data?.data || [])?.map((salon) => <option key={salon._id} value={salon._id}>{salon.name}</option>)}
        </select>

        <select className="rounded border p-2" value={payload.serviceId} onChange={(e) => setPayload({ ...payload, serviceId: e.target.value })} disabled={!selectedSalon}>
          <option value="">Select Service</option>
          {(bookingOptions.data?.data?.services || []).map((item: { _id: string; name: string; price: number }) => (
            <option key={item._id} value={item._id}>{item.name} (${item.price})</option>
          ))}
        </select>

        <select className="rounded border p-2" value={payload.staffId} onChange={(e) => setPayload({ ...payload, staffId: e.target.value })} disabled={!selectedSalon}>
          <option value="">Select Staff</option>
          {(bookingOptions.data?.data?.staff || []).map((item: { _id: string; name: string }) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
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
          {locationState?.fromAiScan ? 'Book your AI-recommended treatments' : 'Select salon, service, date and pick a real-time available slot.'}
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
