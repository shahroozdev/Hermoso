import { payoutPeriod as periodLabel, downloadReceiptImage } from '../utils/payoutReceipt';
import GenericModal from './GenericModal';
import { formatMoney } from '../utils/money';

interface PayoutDetailModalProps {
  payout: {
    _id: string;
    salonId?: { name?: string; _id?: string };
    amountInPaisa?: number;
    status?: string;
    payoutDate?: string;
    createdAt?: string;
    bankAccount?: string;
  };
  onClose: () => void;
}


const PayoutDetailModal = ({ payout, onClose }: PayoutDetailModalProps) => {
  const p = payout;
  const isCompleted = p.status === 'completed';
  const bankAccount = p.bankAccount || 'Not on file';

  const handleDownloadReceipt = () => {
    downloadReceiptImage(String(p._id), [
      ['Payout ID', p._id], ['Salon', p.salonId?.name || 'Unknown'],
      ['Period', periodLabel(p.createdAt)], ['Amount (PKR)', ((p.amountInPaisa || 0) / 100).toFixed(2)],
      ['Status', p.status || ''], ['Paid Date', p.payoutDate ? new Date(p.payoutDate).toLocaleDateString() : '-'],
      ['Bank Account', bankAccount],
    ]);
  };

  return (
    <GenericModal
      title="Payout Receipt"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ha-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="ha-btn-primary" onClick={handleDownloadReceipt}>
            Download Receipt
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-[var(--border)] p-4 text-center">
          <div className="text-xs font-semibold uppercase text-muted">Net Amount</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold-light)' }}>
            {formatMoney(p.amountInPaisa)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Salon</label>
            <p className="text-sm font-medium">{p.salonId?.name || 'Unknown'}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Payout Period</label>
            <p className="text-sm font-medium">{periodLabel(p.createdAt)}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Status</label>
            <p className="text-sm font-medium">
              <span className={isCompleted ? 'ha-pill ha-pill-active' : 'ha-pill ha-pill-pending'}>
                {isCompleted ? 'Paid ✓' : p.status}
              </span>
            </p>
          </div>
          {isCompleted && p.payoutDate && (
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Paid On</label>
              <p className="text-sm font-medium">{new Date(p.payoutDate).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Bank Account</label>
            <p className="text-sm font-medium">{bankAccount}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted">Payout ID</label>
            <p className="text-sm font-mono text-muted">#{String(p._id).slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {isCompleted && (
          <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-800">
            This payout has been completed and funds have been transferred to the salon's bank account.
          </div>
        )}
      </div>
    </GenericModal>
  );
};

export default PayoutDetailModal;
