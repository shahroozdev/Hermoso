import { useState } from "react";
import { z } from "zod";
import Form from "./Form";
import GenericModal from "./GenericModal";
import FormInput from "./FormInput";
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

const defaultValues = {
  name: "",
  city: "",
  country: "Pakistan",
  email: "",
  phone: "",
  bankAccount: "",
};

interface CreateOwnerModalProps {
  onClose: () => void;
  onCreated: (owner: OwnerRecord, meta?: { email?: string; password?: string; generated?: boolean }) => void;
}

const CreateOwnerModal = ({ onClose, onCreated }: CreateOwnerModalProps) => {
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const result = await ownerService.create({
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
      setServerError(err.response?.data?.message || "Failed to create owner");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <GenericModal
        title="+ Create Owner"
        onClose={onClose}
        footer={<FormButtons onCancel={onClose} isSubmitting={isSubmitting} />}
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

          <FormInput
            name="email"
            type="email"
            label="Email"
            placeholder="Optional. Leave blank to auto-generate."
          />

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

const FormButtons = ({ onCancel, isSubmitting }) => (
  <>
    <button type="button" className="ha-btn-secondary" onClick={onCancel}>
      Cancel
    </button>
    <button type="submit" className="ha-btn-primary" disabled={isSubmitting}>
      {isSubmitting ? "Creating..." : "Create Owner"}
    </button>
  </>
);

export default CreateOwnerModal;
