import mongoose, { Document, Schema } from 'mongoose';
import { EventCategory, type EventCategoryType } from '../utils/constants.js';

export interface IEvent extends Document {
  salonId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: EventCategoryType;
  services: Array<{
    serviceId: mongoose.Types.ObjectId;
    serviceName: string;
    price: number;
    duration: number;
  }>;
  totalPrice: number;
  totalDuration: number;
  discount: number;
  finalPrice: number;
  active: boolean;
  images: string[];
}

const eventSchema = new Schema<IEvent>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: Object.values(EventCategory),
      required: true,
      index: true
    },
    services: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        serviceName: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        duration: { type: Number, required: true, min: 5 }
      }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    totalDuration: { type: Number, required: true, min: 5 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    finalPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    images: [{ type: String }]
  },
  { timestamps: true }
);

eventSchema.index({ salonId: 1, name: 1 }, { unique: true });
eventSchema.index({ salonId: 1, category: 1 });
eventSchema.index({ salonId: 1, active: 1 });

// Pre-save hook to calculate totals and final price
eventSchema.pre('save', function(next) {
  if (this.services && this.services.length > 0) {
    this.totalPrice = this.services.reduce((sum, service) => sum + service.price, 0);
    this.totalDuration = this.services.reduce((sum, service) => sum + service.duration, 0);
    this.finalPrice = this.totalPrice - (this.totalPrice * this.discount / 100);
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
