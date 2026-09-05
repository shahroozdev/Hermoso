import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'announcement' | 'system' | 'booking_reminder' | 'booking_update' | 'payout' | 'review';
  targetRole: string;
  salonId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  isRead: boolean;
  status: 'draft' | 'sent';
  recipientCount: number;
  // Links a fanned-out per-recipient copy back to the admin-managed campaign
  // record it was sent from, so a recipient report can be queried per campaign.
  campaignId: mongoose.Types.ObjectId | null;
  meta: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['announcement', 'system', 'booking_reminder', 'booking_update', 'payout', 'review'],
      default: 'system',
      index: true
    },
    targetRole: { type: String, required: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isRead: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['draft', 'sent'], default: 'sent', index: true },
    recipientCount: { type: Number, default: 0 },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Notification', default: null, index: true },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

notificationSchema.index({ targetRole: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);