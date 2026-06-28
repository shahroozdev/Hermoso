import { salonService } from "@/services/salonService";
import { ownerService, type OwnerRecord } from "@/services/ownerService";
import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import Form from "./Form";
import GenericModal from "./GenericModal";
import FormInput from "./FormInput";
import CreateOwnerModal from "./createOwner";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const defaultHours = {
  open: "09:00",
  close: "18:00",
  off: false,
};

const resolveOwnerId = (value: any): string => {
  if (value?.owner?._id) return String(value.owner._id);
  if (value?.ownerId?._id) return String(value.ownerId._id);
  if (value?.ownerId) return String(value.ownerId);
  return "";
};

const schema = z.object({
  ownerId: z.string().min(1, "Owner is required"),
  name: z.string().min(2, "Salon name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number format"),
  address: z.string().min(5, "Full address required"),
  city: z.string().min(2, "City name required"),
  country: z.string().min(2, "Country required"),
  description: z.string().optional(),
  commissionRate: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
  workingHours: z.record(
    z.enum(DAYS),
    z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      off: z.boolean(),
    }),
  ),
});

const SalonModal = ({
  onClose,
  onCreated,
  editDefaultValues,
}: {
  onClose: () => void;
  onCreated: (salon: any) => void;
  editDefaultValues?: any;
}) => {
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [ownersError, setOwnersError] = useState("");
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerCredentials, setOwnerCredentials] = useState<{
    email?: string;
    password?: string;
    generated?: boolean;
  } | null>(null);
  const [selectedOwnerIdOverride, setSelectedOwnerIdOverride] = useState("");

  useEffect(() => {
    setSelectedOwnerIdOverride(resolveOwnerId(editDefaultValues));
  }, [editDefaultValues]);

  useEffect(() => {
    const loadOwners = async () => {
      setOwnersLoading(true);
      setOwnersError("");
      try {
        const result = await ownerService.list();
        setOwners(result.data || []);
      } catch (err) {
        setOwnersError(err.response?.data?.message || "Failed to load owners");
      } finally {
        setOwnersLoading(false);
      }
    };

    loadOwners();
  }, []);

  const onSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);
    const payload = {
      ownerId: data.ownerId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      description: data.description || "",
      location: { city: data.city, country: data.country },
      workingHours: data.workingHours,
      commissionRate: data.commissionRate,
    };
    try {
      const result = await (editDefaultValues
        ? salonService.update(editDefaultValues._id, payload)
        : salonService.create(payload));
      onCreated(result.data);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to create salon");
    } finally {
      setIsSubmitting(false);
    }
  };
  const defaultValues = useMemo(
    () =>
      editDefaultValues
        ? {
            ownerId: resolveOwnerId(editDefaultValues),
            name: editDefaultValues.name || "",
            phone: editDefaultValues.phone || "",
            address: editDefaultValues.address || "",
            city: editDefaultValues.location?.city || "",
            country: editDefaultValues.location?.country || "Pakistan",
            description: editDefaultValues.description || "",
            commissionRate: editDefaultValues.commissionRate ?? 10,
            workingHours:
              editDefaultValues.workingHours ||
              Object.fromEntries(DAYS.map((d) => [d, { ...defaultHours }])),
          }
        : {
            ownerId: "",
            name: "",
            phone: "",
            address: "",
            city: "",
            country: "Pakistan",
            description: "",
            commissionRate: 10,
            workingHours: Object.fromEntries(
              DAYS.map((d) => [d, { ...defaultHours }]),
            ),
          },
    [editDefaultValues],
  );
  return (
    <>
      <Form
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="salon-form"
      >
        <GenericModal
          title="+ Add Salon"
          onClose={onClose}
          footer={
            <FormButtons onCancel={onClose} isSubmitting={isSubmitting} isUpdating={!!editDefaultValues}/>
          }
        >
          <>
            {serverError ? (
              <div className="ha-error-banner">{serverError}</div>
            ) : null}

            {ownerCredentials?.generated ? (
              <div className="ha-form-hint" style={{ marginBottom: 12 }}>
                Owner created with generated login: {ownerCredentials.email} /{" "}
                {ownerCredentials.password}
              </div>
            ) : null}

            <OwnerPicker
              owners={owners}
              loading={ownersLoading}
              error={ownersError}
              ownerIdOverride={selectedOwnerIdOverride}
              currentOwner={editDefaultValues?.owner}
              onCreateClick={() => setOwnerModalOpen(true)}
            />

            <div className="ha-form-row">
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
            </div>

            <FormInput
              name="address"
              label="Address"
              placeholder="Full street address"
              required
            />

            <div className="ha-form-row">
              <FormInput
                name="city"
                label="City"
                placeholder="e.g. Karachi"
                required
              />
              <FormInput name="country" label="Country" />
            </div>

            <FormInput
              name="description"
              type="textarea"
              label="Description"
              placeholder="Brief description of your salon"
            />

            <FormInput
              name="commissionRate"
              type="number"
              label="Commission Rate (%)"
            />

            <div className="ha-form-group">
              <label className="ha-form-label-row">
                <span>Working Hours</span>
                <span className="ha-form-hint">Toggle days off as needed</span>
              </label>
              <WorkingHours />
            </div>
          </>
        </GenericModal>
      </Form>

      {ownerModalOpen ? (
        <CreateOwnerModal
          onClose={() => setOwnerModalOpen(false)}
          onCreated={(owner, credentials) => {
            setOwners((current) =>
              [...current, owner].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setOwnerCredentials(credentials || null);
            setSelectedOwnerIdOverride(owner._id);
          }}
        />
      ) : null}
    </>
  );
};

const OwnerPicker = ({
  owners,
  loading,
  error,
  ownerIdOverride,
  currentOwner,
  onCreateClick,
}) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const selectedOwnerId = watch("ownerId");
  const ownerOptions = useMemo(() => {
    if (!currentOwner?._id) return owners;
    const exists = owners.some((owner) => String(owner._id) === String(currentOwner._id));
    if (exists) return owners;
    return [
      ...owners,
      {
        _id: String(currentOwner._id),
        name: currentOwner.name || "Current Owner",
        email: currentOwner.email || "",
      },
    ];
  }, [owners, currentOwner]);

  useEffect(() => {
    if (ownerIdOverride) {
      setValue("ownerId", ownerIdOverride, { shouldValidate: true });
    }
  }, [ownerIdOverride, setValue]);

  return (
    <div className="ha-form-group" data-field="ownerId">
      <label htmlFor="ownerId">
        Owner <span className="ha-req-mark">*</span>
      </label>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <select
          id="ownerId"
          className="ha-input"
          style={{ flex: 1 }}
          disabled={loading}
          {...register("ownerId")}
        >
          <option value="">
            {loading ? "Loading owners..." : "Select salon owner"}
          </option>
          {ownerOptions.map((owner) => (
            <option key={owner._id} value={owner._id}>
              {owner.name}
              {owner.location?.city ? ` - ${owner.location.city}` : ""}
              {typeof owner.salonsCount === "number"
                ? ` (${owner.salonsCount} salon${owner.salonsCount === 1 ? "" : "s"})`
                : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ha-btn-primary"
          style={{ minWidth: 48, paddingInline: 0 }}
          onClick={onCreateClick}
          aria-label="Create owner"
          title="Create owner"
        >
          +
        </button>
      </div>
      {selectedOwnerId ? (
        <div className="ha-form-hint" style={{ marginTop: 6 }}>
          Selected owner can be linked with multiple salons.
        </div>
      ) : null}
      {error ? <span className="ha-field-error">{error}</span> : null}
      {errors.ownerId ? (
        <span className="ha-field-error">
          {errors.ownerId.message as string}
        </span>
      ) : null}
    </div>
  );
};

const WorkingHours = () => {
  const { watch, setValue } = useFormContext();
  const workingHours = watch("workingHours");

  const handleDayToggle = (day) => {
    setValue(`workingHours.${day}.off`, !workingHours[day].off);
  };

  return (
    <div className="ha-hours-grid">
      {DAYS.map((day) => {
        const h = workingHours[day];
        return (
          <div key={day} className={`ha-hours-row ${h.off ? "off" : ""}`}>
            <label className="ha-day-label">
              <input
                type="checkbox"
                checked={!h.off}
                onChange={() => handleDayToggle(day)}
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
                  onChange={(e) =>
                    setValue(`workingHours.${day}.open`, e.target.value)
                  }
                />
                <span>to</span>
                <input
                  type="time"
                  className="ha-input ha-input-sm"
                  value={h.close}
                  onChange={(e) =>
                    setValue(`workingHours.${day}.close`, e.target.value)
                  }
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

const FormButtons = ({ onCancel, isSubmitting, isUpdating }) => (
  <>
    <button type="button" className="ha-btn-secondary" onClick={onCancel}>
      Cancel
    </button>
    <button
      type="submit"
      // form="salon-form"
      className="ha-btn-primary"
      disabled={isSubmitting}
    >
      {isSubmitting
        ? isUpdating
          ? "Updating..."
          : "Creating..."
        : isUpdating
          ? "Update Salon"
          : "Create Salon"}
    </button>
  </>
);

export default SalonModal;
