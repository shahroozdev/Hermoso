import { Notification, type INotification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendEmail } from './email.service.js';

interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'announcement' | 'system' | 'booking_reminder' | 'booking_update' | 'payout' | 'review';
  targetRole: string;
  salonId?: string | null;
  userId?: string | null;
  meta?: Record<string, unknown>;
  sendEmailToUser?: boolean;
}

export const createNotification = async ({
  title,
  message,
  type = 'system',
  targetRole,
  salonId = null,
  userId = null,
  meta = {},
  sendEmailToUser = false
}: CreateNotificationParams): Promise<INotification> => {
  const notification = await Notification.create({
    title,
    message,
    type,
    targetRole,
    salonId,
    userId,
    meta
  });

  if (sendEmailToUser && userId) {
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<p>Hi ${user.name || 'there'},</p><p>${message}</p>`
      });
    }
  }

  return notification;
};

interface BroadcastParams {
  title: string;
  message: string;
  type?: 'announcement' | 'system' | 'booking_reminder' | 'booking_update' | 'payout' | 'review';
  targetRole: string;
  salonId?: string | null;
}

export const broadcastByRole = async ({ title, message, type = 'announcement', targetRole, salonId = null }: BroadcastParams) => {
  const query: Record<string, unknown> = { role: targetRole };
  if (salonId) query.salonId = salonId;

  const users = await User.find(query).select('_id');
  if (!users.length) return [];

  const docs = users.map((u) => ({
    title,
    message,
    type,
    targetRole,
    salonId,
    userId: u._id
  }));

  return Notification.insertMany(docs);
};