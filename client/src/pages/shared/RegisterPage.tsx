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
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
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
      setError(err.response?.data?.message || "Registration failed");
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
          />
          <FormInput
            name="phone"
            type="tel"
            label="Phone"
            placeholder="Enter your Whatsapp number"
            required
          />
          <FormInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            required
          />
          <FormInput
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            required
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
