import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Form from '../../components/form/Form';
import FormInput from '../../components/form/FormInput';
import { authService } from '../../services/authService';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const emailParam = params.get('email') || '';

  const onSubmit = async (form: { email: string; otp: string }) => {
    setError('');
    setMessage('');
    try {
      await authService.verifyOtp(form);
      setMessage('OTP verified successfully. Setting up your salon...');
      setTimeout(() => navigate(`/create-salon?email=${encodeURIComponent(form.email)}`), 1200);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'OTP verification failed');
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    try {
      await authService.resendOtp(emailParam);
      setMessage('OTP resent successfully.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--surface)] p-6">
      <Form
        schema={schema}
        defaultValues={{ email: emailParam, otp: '' }}
        onSubmit={onSubmit}
        className="w-full max-w-md shell-panel rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold">Verify OTP</h2>
        <p className="mt-1 text-sm text-slate-500">Enter the OTP sent to your email and phone.</p>
        <div className="mt-4 grid gap-3">
          <FormInput name="email" type="email" label="Email" required />
          <FormInput name="otp" type="text" label="OTP" placeholder="6-digit code" required />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}
        <button type="submit" className="mt-4 w-full rounded bg-primary p-2 text-white">Verify OTP</button>
        <button type="button" className="mt-2 w-full rounded border p-2" onClick={resend} disabled={!emailParam}>
          Resend OTP
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Back to <Link to="/login" className="text-primary">Login</Link>
        </p>
      </Form>
    </div>
  );
};

export default VerifyOtpPage;
