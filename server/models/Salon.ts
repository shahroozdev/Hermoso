import mongoose, { Document, Schema } from 'mongoose';
import { SalonStatus, type SalonStatusType } from '../utils/constants.js';
import { integerPaisaValidator } from '../utils/money.js';

export interface IDayHours {
  open?: string;
  close?: string;
  off: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface ISalon extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  description: string;
  address: string;
  phone: string;
  imageUrl?: string;
  images: string[];
  workingHours: {
    monday: IDayHours;
    tuesday: IDayHours;
    wednesday: IDayHours;
    thursday: IDayHours;
    friday: IDayHours;
    saturday: IDayHours;
    sunday: IDayHours;
  };
  // Alias for workingHours (for consistency with controller)
  openingHours?: {
    monday?: IDayHours;
    tuesday?: IDayHours;
    wednesday?: IDayHours;
    thursday?: IDayHours;
    friday?: IDayHours;
    saturday?: IDayHours;
    sunday?: IDayHours;
  };
  commissionRate: number;
  status: SalonStatusType;
  verified: boolean;
  approvedBy?: mongoose.Types.ObjectId | null;
  location: {
    city?: string;
    country?: string;
    coordinates?: [number, number]; // [longitude, latitude] for GeoJSON
  };
  // CR-25: South Asian skin specialist flag
  southAsianSpecialist?: boolean;
  // Additional fields for enhanced matching
  rating: number;
  averagePriceInPaisa?: number;
}

const salonSchema = new Schema<ISalon>(
  {
    name: { type: String, required: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    workingHours: {
      monday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      tuesday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      wednesday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      thursday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      friday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      saturday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String },
      sunday: { open: String, close: String, off: { type: Boolean, default: false }, breakStart: String, breakEnd: String }
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    status: { type: String, enum: Object.values(SalonStatus), default: SalonStatus.PENDING, index: true },
    verified: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    location: {
      city: { type: String, index: true },
      country: { type: String, index: true },
      coordinates: { type: [Number], index: '2dsphere' } // GeoJSON coordinates [lng, lat]
    },
    // CR-25: South Asian skin specialist flag
    southAsianSpecialist: { type: Boolean, default: false, index: true },
    // Additional fields for enhanced matching
    rating: { type: Number, default: 0, min: 0, max: 5 },
    averagePriceInPaisa: { type: Number, min: 0, validate: integerPaisaValidator }
  },
  { timestamps: true }
);

// Virtual field to alias workingHours as openingHours for consistency
salonSchema.virtual('openingHours').get(function () {
  return this.workingHours;
});

export const Salon = mongoose.model<ISalon>('Salon', salonSchema);
