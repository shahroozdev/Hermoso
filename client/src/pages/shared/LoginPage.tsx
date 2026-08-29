import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import Form from '../../components/form/Form';
import FormInput from '../../components/form/FormInput';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const defaultValues = {
  email: '',
  password: ''
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
      const result = await authService.login(form);
      setAuth({ user: result.user });

      if (normalizedRole(result.user.role) === 'super_admin') navigate('/admin');
      else if (normalizedRole(result.user.role) === 'salon_owner') navigate('/owner');
      else navigate('/customer/salons');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] p-6">
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
