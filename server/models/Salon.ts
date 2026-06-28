import mongoose, { Document, Schema } from 'mongoose';
import { SalonStatus, type SalonStatusType } from '../utils/constants.js';

export interface ISalon extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  description: string;
  address: string;
  phone: string;
  images: string[];
  workingHours: {
    monday: { open?: string; close?: string; off: boolean };
    tuesday: { open?: string; close?: string; off: boolean };
    wednesday: { open?: string; close?: string; off: boolean };
    thursday: { open?: string; close?: string; off: boolean };
    friday: { open?: string; close?: string; off: boolean };
    saturday: { open?: string; close?: string; off: boolean };
    sunday: { open?: string; close?: string; off: boolean };
  };
  commissionRate: number;
  status: SalonStatusType;
  verified: boolean;
  location: {
    city?: string;
    country?: string;
  };
}

const salonSchema = new Schema<ISalon>(
  {
    name: { type: String, required: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    images: [{ type: String }],
    workingHours: {
      monday: { open: String, close: String, off: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, off: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, off: { type: Boolean, default: false } },
      thursday: { open: String, close: String, off: { type: Boolean, default: false } },
      friday: { open: String, close: String, off: { type: Boolean, default: false } },
      saturday: { open: String, close: String, off: { type: Boolean, default: false } },
      sunday: { open: String, close: String, off: { type: Boolean, default: false } }
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    status: { type: String, enum: Object.values(SalonStatus), default: SalonStatus.PENDING, index: true },
    verified: { type: Boolean, default: false, index: true },
    location: {
      city: { type: String, index: true },
      country: { type: String, index: true }
    }
  },
  { timestamps: true }
);

export const Salon = mongoose.model<ISalon>('Salon', salonSchema);
