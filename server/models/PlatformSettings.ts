import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  aiSkinScan: boolean;
  eventBookings: boolean;
  pushNotifications: boolean;
  selfRegistration: boolean;
  maintenanceMode: boolean;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    aiSkinScan: { type: Boolean, default: true },
    eventBookings: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    selfRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
