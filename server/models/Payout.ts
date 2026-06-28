import mongoose, { Document, Schema } from 'mongoose';

export interface IPayout extends Document {
  salonId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payoutDate: Date | null;
}

const payoutSchema = new Schema<IPayout>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
    payoutDate: { type: Date, default: null }
  },
  { timestamps: true }
);

payoutSchema.index({ salonId: 1, createdAt: -1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);