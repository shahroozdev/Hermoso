import { useState } from "react";
import { z } from "zod";
import Form from "./form/Form";
import GenericModal from "./GenericModal";
import FormInput from "./form/FormInput";
import { adminService, type AdminRecord } from "@/services/adminService";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  phone: z
    .union([
      z.string().regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number format"),
      z.literal(""),
    ])
    .optional(),
});

const defaultValues = {
  name: "",
  email: "",
  phone: "",
};

interface CreateAdminModalProps {
  onClose: () => void;
  onCreated: (admin: AdminRecord, meta?: { email?: string; password?: string; generated?: boolean }) => void;
}

const CreateAdminModal = ({ onClose, onCreated }: CreateAdminModalProps) => {
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const result = await adminService.create({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });

      onCreated(result.data, result.credentials);
      onClose();
      return result;
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to create admin");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <GenericModal
        title="+ Invite Admin"
        onClose={onClose}
        footer={<FormButtons onCancel={onClose} isSubmitting={isSubmitting} />}
      >
        <>
          {serverError ? <div className="ha-error-banner">{serverError}</div> : null}

          <FormInput
            name="name"
            label="Admin Name"
            placeholder="e.g. Ayesha Khan"
            required
          />

          <FormInput
            name="email"
            type="email"
            label="Email"
            placeholder="Optional. Leave blank to auto-generate."
          />

          <FormInput
            name="phone"
            type="tel"
            label="Phone"
            placeholder="Optional contact number"
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
      {isSubmitting ? "Inviting..." : "Invite Admin"}
    </button>
  </>
);

export default CreateAdminModal;
