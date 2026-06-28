import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';

interface GenericModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isSubmitting?: boolean;
}

const GenericModal = ({ title, onClose, children, footer }: GenericModalProps) => {
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const { theme } = useUIStore();

  useEffect(() => {
    firstFocusRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      <div className={`ha-modal-overlay h-screen ${theme === 'light' ? 'light' : ''}`} onClick={onClose} />
      <div className={`ha-modal ${theme === 'light' ? 'light' : ''}`}>
        <div className="ha-modal-header">
          <h3>{title}</h3>
          <button
            ref={firstFocusRef}
            className="ha-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="ha-modal-body">
          {children}
        </div>
        {footer && (
          <div className="ha-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default GenericModal;
