import mongoose, { Document, Schema } from 'mongoose';
import { PaymentStatus, FraudFlag, type PaymentStatusType, type FraudFlagType } from '../utils/constants.js';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  amount: number;
  platformCommission: number;
  salonAmount: number;
  status: PaymentStatusType;
  trackerId: string | null;
  idempotencyKey: string;
  safepayStatus: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  refundAmount: number;
  refundTrackerId: string | null;
  fraudFlag: FraudFlagType;
  fraudReasons: string[];
  ipAddress: string | null;
  userAgent: string | null;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    platformCommission: { type: Number, required: true, min: 0 },
    salonAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    trackerId: { type: String, default: null, sparse: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    safepayStatus: { type: String, default: null },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundTrackerId: { type: String, default: null },
    fraudFlag: {
      type: String,
      enum: Object.values(FraudFlag),
      default: FraudFlag.NONE,
      index: true
    },
    fraudReasons: { type: [String], default: [] },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
