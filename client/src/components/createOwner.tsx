import { useState } from "react";
import { z } from "zod";
import Form from "./form/Form";
import GenericModal from "./GenericModal";
import FormInput from "./form/FormInput";
import { ownerService, type OwnerRecord } from "@/services/ownerService";

const schema = z.object({
  name: z.string().min(2, "Owner name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  phone: z
    .union([
      z.string().regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number format"),
      z.literal(""),
    ])
    .optional(),
  bankAccount: z.string().optional(),
});

interface CreateOwnerModalProps {
  owner?: OwnerRecord;
  onClose: () => void;
  onCreated: (owner: OwnerRecord, meta?: { email?: string; password?: string; generated?: boolean }) => void;
}

const CreateOwnerModal = ({ owner, onClose, onCreated }: CreateOwnerModalProps) => {
  const isEdit = Boolean(owner);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    name: owner?.name || "",
    city: owner?.location?.city || "",
    country: owner?.location?.country || "Pakistan",
    email: owner?.email || "",
    phone: owner?.phone || "",
    bankAccount: owner?.bankAccount || "",
  };

  const handleSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const result = isEdit
        ? await ownerService.update(owner!._id, {
            name: data.name,
            city: data.city,
            country: data.country,
            phone: data.phone || undefined,
            bankAccount: data.bankAccount || undefined,
          })
        : await ownerService.create({
            name: data.name,
            city: data.city,
            country: data.country,
            email: data.email || undefined,
            phone: data.phone || undefined,
            bankAccount: data.bankAccount || undefined,
          });

      onCreated(result.data, result.credentials);
      onClose();
      return result;
    } catch (err) {
      setServerError(err.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} owner`);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <GenericModal
        title={isEdit ? "Edit Owner" : "+ Create Owner"}
        onClose={onClose}
        footer={<FormButtons onCancel={onClose} isSubmitting={isSubmitting} isEdit={isEdit} />}
      >
        <>
          {serverError ? <div className="ha-error-banner">{serverError}</div> : null}

          <div className="ha-form-row">
            <FormInput
              name="name"
              label="Owner Name"
              placeholder="e.g. Ayesha Khan"
              required
            />
            <FormInput
              name="phone"
              type="tel"
              label="Phone"
              placeholder="Optional contact number"
            />
          </div>

          <div className="ha-form-row">
            <FormInput
              name="city"
              label="Location City"
              placeholder="e.g. Karachi"
              required
            />
            <FormInput name="country" label="Country" required />
          </div>

          {isEdit ? (
            <div className="ha-form-group">
              <label>Email</label>
              <p className="ha-form-hint">{owner?.email} (email cannot be changed)</p>
            </div>
          ) : (
            <FormInput
              name="email"
              type="email"
              label="Email"
              placeholder="Optional. Leave blank to auto-generate."
            />
          )}

          <FormInput
            name="bankAccount"
            label="Bank Account"
            placeholder="Optional bank account details"
          />
        </>
      </GenericModal>
    </Form>
  );
};

const FormButtons = ({ onCancel, isSubmitting, isEdit }: { onCancel: () => void; isSubmitting: boolean; isEdit: boolean }) => (
  <>
    <button type="button" className="ha-btn-secondary" onClick={onCancel}>
      Cancel
    </button>
    <button type="submit" className="ha-btn-primary" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Owner"}
    </button>
  </>
);

export default CreateOwnerModal;
