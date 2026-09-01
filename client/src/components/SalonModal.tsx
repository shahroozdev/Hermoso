import { CreateSalonPayload, salonService } from "@/services/salonService";
import { ownerService, type OwnerRecord } from "@/services/ownerService";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import Form from "./form/Form";
import GenericModal from "./GenericModal";
import FormInput from "./form/FormInput";
import CreateOwnerModal from "./createOwner";
import OwnerCredentialsModal from "./OwnerCredentialsModal";
import SearchableSelect from "./form/SearchableSelect";

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

interface SalonEditData {
  _id?: string;
  name?: string;
  phone?: string;
  address?: string;
  description?: string;
  location?: { city?: string; country?: string };
  commissionRate?: number;
  imageUrl?: string;
  workingHours?: Record<string, { open: string; close: string; off: boolean }>;
  owner?: { _id?: string; name?: string; email?: string };
  ownerId?: string | { _id?: string };
}

const resolveOwnerId = (value: SalonEditData): string => {
  if (value?.owner?._id) return String(value.owner._id);
  if (typeof value?.ownerId === "object" && value.ownerId?._id) return String(value.ownerId._id);
  if (typeof value?.ownerId === "string") return String(value.ownerId);
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

type FormValues = z.infer<typeof schema>;

const SalonModal = ({
  onClose,
  onCreated,
  editDefaultValues,
}: {
  onClose: () => void;
  onCreated: (salon: Record<string, unknown>) => void;
  editDefaultValues?: SalonEditData;
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
  const [ownerIdOverride, setOwnerIdOverride] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const selectedOwnerIdOverride = useMemo(
    () => ownerIdOverride || resolveOwnerId(editDefaultValues),
    [ownerIdOverride, editDefaultValues],
  );
  const hasExistingImage = !!(editDefaultValues?.imageUrl && !showImageUpload);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("");
    }
  };

  const handleRemoveImage = () => {
    setShowImageUpload(true);
    setImageFile(null);
    setImagePreview("");
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const loadOwners = async () => {
      setOwnersLoading(true);
      setOwnersError("");
      try {
        const result = await ownerService.list();
        const activeOwners = (result.data || []).filter(
          (owner: OwnerRecord) => owner.status !== "suspended" && owner.status !== "inactive",
        );
        setOwners(activeOwners);
      } catch (err) {
        setOwnersError(err.response?.data?.message || "Failed to load owners");
      } finally {
        setOwnersLoading(false);
      }
    };

    loadOwners();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setIsSubmitting(true);
    const payload: CreateSalonPayload = {
      ownerId: data.ownerId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      description: data.description || "",
      location: { city: data?.city, country: data?.country },
      workingHours: data.workingHours,
      commissionRate: data.commissionRate,
      imageFile: imageFile || null,
    };
    if (imageFile) {
      payload.imageFile = imageFile;  
    }
    try {
      const result = await (editDefaultValues
        ? salonService.update(editDefaultValues._id!, payload as CreateSalonPayload)
        : salonService.create(payload as CreateSalonPayload));
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

            <OwnerPicker
              owners={owners}
              loading={ownersLoading}
              error={ownersError}
              ownerIdOverride={selectedOwnerIdOverride}
              currentOwner={editDefaultValues?.owner}
              onCreateClick={() => setOwnerModalOpen(true)}
            />

            <div className="ha-form-group">
              <label className="ha-form-label-row">
                <span>Salon Image</span>
              </label>
              {hasExistingImage ? (
                <div className="ha-image-preview">
                  <img
                    src={editDefaultValues!.imageUrl}
                    alt="Salon"
                    className="ha-image-preview-img"
                  />
                  <button
                    type="button"
                    className="ha-image-remove-btn"
                    onClick={handleRemoveImage}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  className="ha-input"
                  onChange={handleImageChange}
                />
              )}
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
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                    aria-label="Remove selected image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

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
            setOwnerCredentials(credentials?.generated ? credentials : null);
            setOwnerIdOverride(owner._id);
          }}
        />
      ) : null}

      {ownerCredentials?.generated ? (
        <OwnerCredentialsModal
          email={ownerCredentials.email}
          password={ownerCredentials.password}
          onClose={() => setOwnerCredentials(null)}
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
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const ownerId = watch("ownerId");
  const ownerOptions = useMemo(() => {
    const eligibleOwners = owners.filter(
      (owner) =>
        !owner.salonsCount ||
        String(owner._id) === String(currentOwner?._id),
    );
    if (!currentOwner?._id) return eligibleOwners;
    const exists = eligibleOwners.some((owner) => String(owner._id) === String(currentOwner._id));
    if (exists) return eligibleOwners;
    return [
      ...eligibleOwners,
      {
        _id: String(currentOwner._id),
        name: currentOwner.name || "Current Owner",
        email: currentOwner.email || "",
      },
    ];
  }, [owners, currentOwner]);
  const ownerSelectOptions = useMemo(
    () =>
      ownerOptions.map((owner) => ({
        value: String(owner._id),
        label: `${owner.name}${owner.location?.city ? ` - ${owner.location.city}` : ""}`,
      })),
    [ownerOptions],
  );

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
        <div style={{ flex: 1 }}>
          <SearchableSelect
            value={ownerId || ""}
            onChange={(v) => setValue("ownerId", v, { shouldValidate: true })}
            options={ownerSelectOptions}
            placeholder="Search and select salon owner..."
            loading={loading}
            disabled={loading}
          />
        </div>
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

  const handleDayToggle = (day: string) => {
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
