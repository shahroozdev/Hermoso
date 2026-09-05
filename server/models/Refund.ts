import mongoose, { Document, Schema } from 'mongoose';
import { RefundStatus, type RefundStatusType } from '../utils/constants.js';
import { integerPaisaValidator } from '../utils/money.js';

export interface IRefund extends Document {
  paymentId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amountInPaisa: number;
  reason: string;
  initiatedBy: mongoose.Types.ObjectId;
  initiatedByType: 'customer' | 'salon_owner' | 'admin' | 'system';
  status: RefundStatusType;
  safepayRefundId: string | null;
  processedAt: Date | null;
  notes: string;
}

const refundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
    reason: { type: String, required: true, trim: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    initiatedByType: {
      type: String,
      enum: ['customer', 'salon_owner', 'admin', 'system'],
      required: true
    },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      index: true
    },
    safepayRefundId: { type: String, default: null },
    processedAt: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

refundSchema.index({ createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
