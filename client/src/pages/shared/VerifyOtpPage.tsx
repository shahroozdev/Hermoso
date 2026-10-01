import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Form from '../../components/form/Form';
import FormInput from '../../components/form/FormInput';
import { authService } from '../../services/authService';

const schema = z.object({ otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits') });
const RESEND_DELAY_SECONDS = 30;

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(RESEND_DELAY_SECONDS);
  const emailParam = params.get('email') || '';

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setTimeout(() => setSecondsRemaining((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  const onSubmit = async (form: { otp: string }) => {
    setError('');
    setMessage('');
    try {
      if (!emailParam) { setError('Your registration email is missing. Please register again.'); return; }
      await authService.verifyOtp({ ...form, email: emailParam });
      setMessage('OTP verified successfully. Please log in to continue.');
      navigate('/login');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'OTP verification failed');
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    try {
      if (!z.string().email().safeParse(emailParam).success) { setError('Your registration email is missing. Please register again.'); return; }
      setResending(true);
      await authService.resendOtp(emailParam);
      setMessage('OTP resent successfully.');
      setSecondsRemaining(RESEND_DELAY_SECONDS);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--surface)] p-6">
      <Form
        schema={schema}
        defaultValues={{ otp: '' }}
        onSubmit={onSubmit}
        className="w-full max-w-md shell-panel rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold">Verify OTP</h2>
        <p className="mt-1 text-sm text-slate-500">Enter the OTP sent to {emailParam || 'your registered email'}.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text-muted)]"><strong className="block text-[var(--text)]">Code validity</strong>Expires in 10 minutes</p>
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text-muted)]"><strong className="block text-[var(--text)]">Resend wait</strong>{secondsRemaining > 0 ? `Available in 00:${String(secondsRemaining).padStart(2, '0')}` : 'Available now'}</p>
        </div>
        <div className="mt-4 grid gap-3">
          <FormInput name="otp" type="text" label="OTP" placeholder="6-digit code" required maxLength={6} inputMode="numeric" />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}
        <button type="submit" className="mt-4 w-full rounded bg-primary p-2 text-white">Verify OTP</button>
        <button type="button" className="mt-2 w-full rounded border p-2 disabled:cursor-not-allowed disabled:opacity-60" onClick={resend} disabled={!emailParam || resending || secondsRemaining > 0}>
          {resending ? 'Sending...' : secondsRemaining > 0 ? 'Resend OTP (wait for timer)' : 'Resend OTP'}
        </button>
        <Link
          to="/login"
          className="mt-2 block w-full rounded border p-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Login
        </Link>
      </Form>
    </div>
  );
};

export default VerifyOtpPage;
