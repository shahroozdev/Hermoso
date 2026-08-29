import { useState } from "react";
import GenericModal from "./GenericModal";

interface OwnerCredentialsModalProps {
  email?: string;
  password?: string;
  onClose: () => void;
}

const OwnerCredentialsModal = ({ email, password, onClose }: OwnerCredentialsModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions/insecure context); credentials are still visible on screen.
    }
  };

  return (
    <GenericModal
      title="Owner Account Created"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ha-btn-secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Credentials"}
          </button>
          <button type="button" className="ha-btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <p className="ha-form-hint" style={{ marginBottom: 12 }}>
        Share these login details with the salon owner. This password won&apos;t be shown again.
      </p>
      <div className="ha-form-group">
        <label>Email</label>
        <div className="ha-input" style={{ userSelect: "all" }}>{email}</div>
      </div>
      <div className="ha-form-group">
        <label>Password</label>
        <div className="ha-input" style={{ userSelect: "all" }}>{password}</div>
      </div>
    </GenericModal>
  );
};

export default OwnerCredentialsModal;
