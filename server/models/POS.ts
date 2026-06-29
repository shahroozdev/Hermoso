import mongoose, { Document, Schema } from 'mongoose';

export interface IPOSItem {
  serviceId: mongoose.Types.ObjectId;
  type: 'service' | 'event';
  name: string;
  price: number;
  qty: number;
  discount: number;
  total: number;
}

export interface IPOS extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  items: IPOSItem[];
  subtotal: number;
  itemDiscount: number;
  gstPercent: number;
  gstAmount: number;
  globalDiscountPercent: number;
  globalDiscountAmount: number;
  grandTotal: number;
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
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
      }
    ],
    subtotal: { type: Number, required: true, min: 0 },
    itemDiscount: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    gstAmount: { type: Number, default: 0, min: 0 },
    globalDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    globalDiscountAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    receiptRef: { type: String, required: true, unique: true },
    status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
  },
  { timestamps: true }
);

posSchema.index({ salonId: 1, createdAt: -1 });

export const POS = mongoose.model<IPOS>('POS', posSchema);
