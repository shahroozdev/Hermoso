import mongoose, { Document, Schema } from 'mongoose';
import { FraudFlag, type FraudFlagType } from '../utils/constants.js';

export interface IFraudLog extends Document {
  customerId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId | null;
  flag: FraudFlagType;
  reason: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolvedBy: mongoose.Types.ObjectId | null;
  resolvedAt: Date | null;
}

const fraudLogSchema = new Schema<IFraudLog>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
    flag: {
      type: String,
      enum: Object.values(FraudFlag),
      required: true,
      index: true
    },
    reason: { type: String, required: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    resolved: { type: Boolean, default: false, index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

fraudLogSchema.index({ createdAt: -1 });
fraudLogSchema.index({ customerId: 1, createdAt: -1 });

export const FraudLog = mongoose.model<IFraudLog>('FraudLog', fraudLogSchema);
