import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import Form from '../../components/form/Form';
import FormInput from '../../components/form/FormInput';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const REMEMBERED_EMAIL_KEY = 'hermoso_remembered_email';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

const defaultValues = {
  email: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
  password: '',
  rememberMe: Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY))
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const normalizedRole = (role?: string) => role === 'admin' ? 'super_admin' : role;

  const onSubmit = async (form) => {
    setIsLoading(true);
    setError('');
    try {
      const { rememberMe, ...payload } = form;
      const result = await authService.login(payload);
      setAuth({ user: result.user });

      if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, payload.email);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

      if (normalizedRole(result.user.role) === 'super_admin') navigate('/admin');
      else if (normalizedRole(result.user.role) === 'salon_owner') navigate('/owner');
      else navigate('/customer/salons');
    } catch (err) {
      if (err.response?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--surface)] p-6">
      <Form
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="w-full max-w-md shell-panel rounded-2xl p-6"
      >
        <h2 className="text-xl font-semibold">Login to Hermoso</h2>
        <div className="mt-4 grid gap-3">
          <FormInput
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            required
            noStar
            autoComplete="username"
          />
          <FormInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            required
            noStar
            autoComplete="current-password"
          />
          <FormInput name="rememberMe" type="checkbox" label="Remember Me" />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="mt-4 w-full rounded bg-primary p-2 text-white" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <p className="mt-4 text-sm text-slate-500">No account? <Link to="/register" className="text-primary">Register</Link></p>
      </Form>
    </div>
  );
};

export default LoginPage;
