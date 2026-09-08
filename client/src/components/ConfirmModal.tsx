import GenericModal from "./GenericModal";

interface ConfirmModalProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ title = "Please Confirm", message, confirmLabel = "Confirm", danger, onConfirm, onCancel }: ConfirmModalProps) => (
  <GenericModal
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button type="button" className="ha-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? "ha-btn-danger" : "ha-btn-primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-sm">{message}</p>
  </GenericModal>
);

export default ConfirmModal;
