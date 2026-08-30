import { useSearchParams, Link } from 'react-router-dom';

const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const tracker = searchParams.get('tracker');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Payment Failed</h1>
        <p className="mb-6 text-slate-500">
          Your payment could not be processed. This could be due to insufficient funds, a declined card, or a timeout.
        </p>

        {tracker && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Transaction Reference</p>
            <p className="font-mono text-sm">{tracker}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/customer/booking" className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700">
            Try Again
          </Link>
          <Link to="/customer/bookings" className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-100">
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
