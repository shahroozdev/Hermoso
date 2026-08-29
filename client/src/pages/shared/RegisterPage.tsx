import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import Form from "../../components/form/Form";
import FormInput from "../../components/form/FormInput";
import { authService } from "../../services/authService";

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['customer', 'salon_owner']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const defaultValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "customer",
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (form) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await authService.register(form);
      navigate(`/verify-otp?email=${encodeURIComponent(result?.data?.email || form.email)}`);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const detail = Array.isArray(apiErrors) && apiErrors.length
        ? apiErrors.map((e) => e.message).join(' ')
        : err.response?.data?.message;
      setError(detail || "Registration failed");
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
        <h2 className="text-xl font-semibold">Create account</h2>
        <div className="mt-4 grid gap-3">
          <FormInput
            name="name"
            type="text"
            label="Name"
            placeholder="Enter your name"
            required
          />
          <FormInput
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
          <FormInput
            name="phone"
            type="tel"
            label="Phone"
            placeholder="Enter your Whatsapp number"
            required
            autoComplete="tel"
          />
          <FormInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            required
            autoComplete="new-password"
          />
          <p className="-mt-2 text-xs text-slate-500">
            At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
          </p>
          <FormInput
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
          />
          <FormInput
            name="role"
            type="select"
            label="Role"
            options={[
              { value: "customer", label: "Customer" },
              { value: "salon_owner", label: "Salon Owner" },
            ]}
            required
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 w-full rounded bg-primary p-2 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="text-primary">
            Login
          </Link>
        </p>
      </Form>
    </div>
  );
};

export default RegisterPage;
