import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  amount: number;
  platformCommission: number;
  salonAmount: number;
  status: 'pending' | 'paid' | 'failed';
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    platformCommission: { type: Number, required: true, min: 0 },
    salonAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true }
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);