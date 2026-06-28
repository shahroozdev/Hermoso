import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { Roles } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { broadcastByRole } from '../services/notification.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface AnnouncementBody {
  title: string;
  message: string;
  targetRole: string;
  salonId?: string | null;
}

export const createAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, message, targetRole, salonId = null } = req.body as AnnouncementBody;
  const notifications = await broadcastByRole({
    title,
    message,
    type: 'announcement',
    targetRole,
    salonId
  });

  res.status(201).json({ success: true, data: notifications, count: notifications.length });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 15, unreadOnly = 'false' } = req.query;
  const query: Record<string, unknown> = {};

  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (unreadOnly === 'true') query.isRead = false;
  } else {
    query.userId = req.user?._id;
    if (req.user?.salonId) query.salonId = req.user.salonId;
    if (unreadOnly === 'true') query.isRead = false;
  }

  const data = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Notification.countDocuments(query);
  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query: Record<string, unknown> = { _id: req.params.id };
  if (req.user?.role !== Roles.SUPER_ADMIN) query.userId = req.user?._id;

  const notification = await Notification.findOneAndUpdate(query, { isRead: true }, { new: true });
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  res.json({ success: true, data: notification });
});