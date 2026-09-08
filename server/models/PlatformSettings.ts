import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionRules {
  defaultRate: number;
  vipRate: number;
  eventRate: number;
  promoRate: number;
}

export interface IPlatformSettings extends Document {
  aiSkinScan: boolean;
  eventBookings: boolean;
  pushNotifications: boolean;
  selfRegistration: boolean;
  maintenanceMode: boolean;
  commissionRules: ICommissionRules;
}

const commissionRulesSchema = new Schema<ICommissionRules>(
  {
    defaultRate: { type: Number, default: 10, min: 0, max: 100 },
    vipRate: { type: Number, default: 8, min: 0, max: 100 },
    eventRate: { type: Number, default: 12, min: 0, max: 100 },
    promoRate: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    aiSkinScan: { type: Boolean, default: true },
    eventBookings: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    selfRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    commissionRules: {
      type: commissionRulesSchema,
      default: () => ({ defaultRate: 10, vipRate: 8, eventRate: 12, promoRate: 0 })
    }
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
