import mongoose, { Document, Schema } from 'mongoose';
import { EventCategory, type EventCategoryType } from '../utils/constants.js';
import { applyPercent, integerPaisaValidator, sumPaisa } from '../utils/money.js';

export interface IEvent extends Document {
  salonId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: EventCategoryType;
  services: Array<{
    serviceId: mongoose.Types.ObjectId;
    serviceName: string;
    priceInPaisa: number;
    duration: number;
  }>;
  totalPriceInPaisa: number;
  totalDuration: number;
  discount: number;
  finalPriceInPaisa: number;
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
        priceInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
        duration: { type: Number, required: true, min: 5 }
      }
    ],
    totalPriceInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
    totalDuration: { type: Number, required: true, min: 5 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    finalPriceInPaisa: { type: Number, required: true, min: 0, validate: integerPaisaValidator },
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
    this.totalPriceInPaisa = sumPaisa(this.services.map((service) => service.priceInPaisa));
    this.totalDuration = this.services.reduce((sum, service) => sum + service.duration, 0);
    this.finalPriceInPaisa = this.totalPriceInPaisa - applyPercent(this.totalPriceInPaisa, this.discount);
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
