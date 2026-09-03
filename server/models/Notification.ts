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
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

notificationSchema.index({ targetRole: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);