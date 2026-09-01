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

interface CreateAdminModalProps {
  admin?: AdminRecord;
  onClose: () => void;
  onCreated: (admin: AdminRecord, meta?: { email?: string; password?: string; generated?: boolean }) => void;
}

const CreateAdminModal = ({ admin, onClose, onCreated }: CreateAdminModalProps) => {
  const isEdit = Boolean(admin);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegeneratePassword = async () => {
    if (!admin) return;
    setServerError("");
    setIsRegenerating(true);
    try {
      const result = await adminService.regeneratePassword(admin._id);
      onCreated(admin, result.credentials);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to regenerate password");
    } finally {
      setIsRegenerating(false);
    }
  };

  const defaultValues = {
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
  };

  const handleSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const result = isEdit
        ? await adminService.update(admin!._id, { name: data.name, phone: data.phone || undefined })
        : await adminService.create({
            name: data.name,
            email: data.email || undefined,
            phone: data.phone || undefined,
          });

      onCreated(result.data, result.credentials);
      onClose();
      return result;
    } catch (err) {
      setServerError(err.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} admin`);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <GenericModal
        title={isEdit ? "Edit Admin" : "+ Invite Admin"}
        onClose={onClose}
        footer={<FormButtons onCancel={onClose} isSubmitting={isSubmitting} isEdit={isEdit} />}
      >
        <>
          {serverError ? <div className="ha-error-banner">{serverError}</div> : null}

          <FormInput
            name="name"
            label="Admin Name"
            placeholder="e.g. Ayesha Khan"
            required
          />

          {isEdit ? (
            <>
              <div className="ha-form-group">
                <label>Email</label>
                <p className="ha-form-hint">{admin?.email} (email cannot be changed)</p>
              </div>
              <div className="ha-form-group">
                <label>Password</label>
                <p className="ha-form-hint">
                  Passwords cannot be viewed. Regenerate to issue a new one.
                </p>
                <button
                  type="button"
                  className="ha-btn-secondary"
                  onClick={handleRegeneratePassword}
                  disabled={isRegenerating}
                  style={{ marginTop: 6 }}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate Password"}
                </button>
              </div>
            </>
          ) : (
            <FormInput
              name="email"
              type="email"
              label="Email"
              placeholder="Optional. Leave blank to auto-generate."
            />
          )}

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

const FormButtons = ({ onCancel, isSubmitting, isEdit }: { onCancel: () => void; isSubmitting: boolean; isEdit: boolean }) => (
  <>
    <button type="button" className="ha-btn-secondary" onClick={onCancel}>
      Cancel
    </button>
    <button type="submit" className="ha-btn-primary" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Invite Admin"}
    </button>
  </>
);

export default CreateAdminModal;
