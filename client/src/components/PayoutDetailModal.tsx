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
  };
  onClose: () => void;
}

const periodLabel = (dateLike?: string) => {
  const d = new Date(dateLike || '');
  if (Number.isNaN(d.getTime())) return '-';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  if (day <= 10) return `${month} 1–10`;
  if (day <= 20) return `${month} 11–20`;
  return `${month} 21–${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
};

const fakeAccount = (name: string) => {
  const digits = String((name || '0000').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)).slice(-4);
  return `HBL ****${digits.padStart(4, '0')}`;
};

const PayoutDetailModal = ({ payout, onClose }: PayoutDetailModalProps) => {
  const p = payout;
  const isCompleted = p.status === 'completed';

  return (
    <GenericModal title="Payout Receipt" onClose={onClose}>
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
            <p className="text-sm font-medium">{fakeAccount(p.salonId?.name || '')}</p>
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