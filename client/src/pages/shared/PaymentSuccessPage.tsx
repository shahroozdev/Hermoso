import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const tracker = searchParams.get('tracker');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(tracker ? 'loading' : 'failed');
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!tracker) return;

    const pollStatus = async () => {
      try {
        const result = await bookingService.getPaymentStatus(tracker);
        if (result?.data?.status === 'paid') {
          setStatus('success');
          setBooking(result.data.booking);
        } else if (result?.data?.status === 'failed') {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [tracker]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-lg font-medium text-slate-700">Confirming your payment...</p>
          <p className="text-sm text-slate-500">Please wait while we verify your transaction.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Payment Failed</h1>
          <p className="mb-6 text-slate-500">Your payment could not be processed.</p>
          <Link to="/customer/booking" className="rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Payment Confirmed</h1>
        <p className="mb-6 text-slate-500">Your booking has been confirmed successfully.</p>

        {booking && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-left">
            <p className="text-sm text-slate-500">Service</p>
            <p className="font-medium">{(booking.serviceId as { name?: string })?.name || 'N/A'}</p>
            <p className="mt-2 text-sm text-slate-500">Salon</p>
            <p className="font-medium">{(booking.salonId as { name?: string })?.name || 'N/A'}</p>
            <p className="mt-2 text-sm text-slate-500">Date & Time</p>
            <p className="font-medium">{booking.bookingDate ? new Date(String(booking.bookingDate)).toLocaleDateString() : 'N/A'} at {String(booking.bookingTime || 'N/A')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/customer/bookings" className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-100">
            View Bookings
          </Link>
          <Link to="/customer/booking" className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700">
            Book Another
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
