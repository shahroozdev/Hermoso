import mongoose, { Document, Schema } from 'mongoose';
import { integerPaisaValidator } from '../utils/money.js';

export interface IPOSItem {
  serviceId: mongoose.Types.ObjectId;
  type: 'service' | 'event';
  name: string;
  priceInPaisa: number;
  qty: number;
  discountInPaisa: number;
  totalInPaisa: number;
}

export interface IPOS extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  items: IPOSItem[];
  subtotalInPaisa: number;
  itemDiscountInPaisa: number;
  gstPercent: number;
  gstAmountInPaisa: number;
  globalDiscountPercent: number;
  globalDiscountAmountInPaisa: number;
  grandTotalInPaisa: number;
  receiptRef: string;
  status: 'completed' | 'refunded';
}

const posSchema = new Schema<IPOS>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, default: 'Walk-in' },
    items: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        type: { type: String, enum: ['service', 'event'], required: true },
        name: { type: String, required: true },
        priceInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
        qty: { type: Number, required: true, min: 1 },
        discountInPaisa: { type: Number, default: 0, min: 0, validate: integerPaisaValidator },
        totalInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
      }
    ],
    subtotalInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
    itemDiscountInPaisa: { type: Number, default: 0, min: 0, validate: integerPaisaValidator },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    gstAmountInPaisa: { type: Number, default: 0, min: 0, validate: integerPaisaValidator },
    globalDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    globalDiscountAmountInPaisa: { type: Number, default: 0, min: 0, validate: integerPaisaValidator },
    grandTotalInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
    receiptRef: { type: String, required: true, unique: true },
    status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
  },
  { timestamps: true }
);

posSchema.index({ salonId: 1, createdAt: -1 });

export const POS = mongoose.model<IPOS>('POS', posSchema);
