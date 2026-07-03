import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  salonId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: mongoose.Types.ObjectId;
  category: string;
  active: boolean;
  // CR-24: Link service to AI scan recommendation
  aiScanLink?: 'dehydration' | 'pigmentation' | 'tanning' | 'darkCircles' | 'acne' | 'lipPigmentation' | 'allConcerns' | 'notLinked';
}

const serviceSchema = new Schema<IService>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true},
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 5 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    active: { type: Boolean, default: true },
    // CR-24: Link service to AI scan recommendation
    aiScanLink: {
      type: String,
      enum: ['dehydration', 'pigmentation', 'tanning', 'darkCircles', 'acne', 'lipPigmentation', 'allConcerns', 'notLinked'],
      default: 'notLinked',
      index: true
    }
  },
  { timestamps: true }
);

serviceSchema.index({ salonId: 1, name: 1 }, { unique: true });

export const Service = mongoose.model<IService>('Service', serviceSchema);
