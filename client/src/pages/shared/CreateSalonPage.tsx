import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../../components/form/FormInput";
import { salonService } from "../../services/salonService";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const defaultHours = { open: "09:00", close: "18:00", off: false };

const schema = z.object({
  name: z.string().min(2, "Salon name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number format"),
  address: z.string().min(5, "Full address required"),
  city: z.string().min(2, "City name required"),
  country: z.string().min(2, "Country required"),
  description: z.string().optional(),
  workingHours: z.record(
    z.enum(DAYS as [string, ...string[]]),
    z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/),
      close: z.string().regex(/^\d{2}:\d{2}$/),
      off: z.boolean(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

const CreateSalonPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      country: "Pakistan",
      description: "",
      workingHours: Object.fromEntries(DAYS.map((d) => [d, { ...defaultHours }])) as FormValues["workingHours"],
    },
  });

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError("");
    setIsSubmitting(true);
    try {
      // Log in first so the salon-creation request carries a valid token for this
      // owner; otherwise it goes out unauthenticated (or with a stale token from a
      // previous session) and the backend rejects it.
      const password = sessionStorage.getItem("pendingSalonPassword");
      if (!emailParam || !password) {
        navigate("/login");
        return;
      }
      const loginResult = await authService.login({ email: emailParam, password });
      setAuth({ user: loginResult.user });

      await salonService.create({
        name: data.name,
        phone: data.phone,
        address: data.address,
        description: data.description || "",
        location: { city: data.city, country: data.country },
        workingHours: data.workingHours,
        imageFile: imageFile || null,
      });

      sessionStorage.removeItem("pendingSalonEmail");
      sessionStorage.removeItem("pendingSalonPassword");
      navigate("/owner");
    } catch (err) {
      const detail = err.response?.data?.message || "Failed to create salon";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--surface)] p-6">
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="w-full max-w-lg shell-panel rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold">Create Your Salon</h2>
          <p className="mt-1 text-sm text-slate-500">
            Set up your salon profile to get started.
          </p>

          <div className="mt-4 grid gap-3">
            <div className="ha-form-group">
              <label>Salon Image</label>
              <input
                type="file"
                accept="image/*"
                className="ha-input"
                onChange={handleImageChange}
              />
              {imageFile && imagePreview && (
                <div className="ha-image-preview" style={{ marginTop: 8 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="ha-image-preview-img"
                  />
                  <button
                    type="button"
                    className="ha-image-remove-btn"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <FormInput
              name="name"
              label="Salon Name"
              placeholder="e.g. Glamour Studio"
              required
            />
            <FormInput
              name="phone"
              type="tel"
              label="Phone"
              placeholder="e.g. +92 300 1234567"
              required
            />
            <FormInput
              name="address"
              label="Address"
              placeholder="Full street address"
              required
            />
            <div className="ha-form-row">
              <FormInput name="city" label="City" placeholder="e.g. Karachi" required />
              <FormInput name="country" label="Country" />
            </div>
            <FormInput
              name="description"
              type="textarea"
              label="Description"
              placeholder="Brief description of your salon"
            />

            <div className="ha-form-group">
              <label className="ha-form-label-row">
                <span>Working Hours</span>
                <span className="ha-form-hint">Toggle days off as needed</span>
              </label>
              <WorkingHoursControl />
            </div>
          </div>

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="mt-4 w-full rounded bg-primary p-2 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Salon..." : "Create Salon"}
          </button>
        </form>
      </FormProvider>
    </div>
  );
};

const WorkingHoursControl = () => {
  const { watch, setValue } = useFormContext();
  const workingHours = watch("workingHours");

  return (
    <div className="ha-hours-grid">
      {DAYS.map((day) => {
        const h = workingHours?.[day] || defaultHours;
        return (
          <div key={day} className={`ha-hours-row ${h.off ? "off" : ""}`}>
            <label className="ha-day-label">
              <input
                type="checkbox"
                checked={!h.off}
                onChange={() => setValue(`workingHours.${day}.off`, !h.off)}
              />
              <span className="ha-day-name">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </span>
            </label>
            {!h.off && (
              <div className="ha-hours-time">
                <input
                  type="time"
                  className="ha-input ha-input-sm"
                  value={h.open}
                  onChange={(e) => setValue(`workingHours.${day}.open`, e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  className="ha-input ha-input-sm"
                  value={h.close}
                  onChange={(e) => setValue(`workingHours.${day}.close`, e.target.value)}
                />
              </div>
            )}
            {h.off && <span className="ha-day-off">Closed</span>}
          </div>
        );
      })}
    </div>
  );
};

export default CreateSalonPage;
