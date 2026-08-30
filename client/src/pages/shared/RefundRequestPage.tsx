import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';

const RefundRequestPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reasons = [
    { value: 'change_of_plan', label: 'Change of plan' },
    { value: 'salon_cancelled', label: 'Salon cancelled the booking' },
    { value: 'duplicate_charge', label: 'Duplicate charge' },
    { value: 'technical_error', label: 'Technical error - charged but not confirmed' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!bookingId || !reason) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const finalReason = reason === 'other' ? customReason : reasons.find(r => r.value === reason)?.label || reason;
      await bookingService.requestRefund({ bookingId, reason: finalReason });
      setMessage('Your refund request has been submitted. We will process it within 2 business days.');
      setTimeout(() => navigate('/customer/bookings'), 3000);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to submit refund request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500">No booking specified for refund.</p>
          <Link to="/customer/bookings" className="mt-4 inline-block text-emerald-600 hover:underline">
            Go to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Request Refund</h1>
          <p className="mb-6 text-sm text-slate-500">
            Please select a reason for your refund request. Refunds are processed within 3-5 business days and reflected in 7-14 business days.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Reason for refund</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                disabled={submitting}
              >
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {reason === 'other' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Please describe</label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe your reason..."
                  disabled={submitting}
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!reason || (reason === 'other' && !customReason) || submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Refund Request'}
            </button>

            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Link to="/customer/bookings" className="mt-4 block text-center text-sm text-slate-500 hover:underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RefundRequestPage;
