import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { broadcastByRole, deliverAnnouncement } from '../services/notification.service.js';
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

// Creates a single admin-managed record (not yet delivered to recipients). It shows
// up in the super admin's own list so it can be edited and sent later via a record
// action, instead of broadcasting immediately at creation time.
export const createNotificationRecord = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, message, targetRole, salonId = null } = req.body as AnnouncementBody;
  if (!title?.trim() || !message?.trim() || !targetRole) {
    return next(new ApiError(400, 'title, message and targetRole are required'));
  }

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type: 'announcement',
    targetRole,
    salonId,
    userId: null,
    status: 'draft'
  });

  res.status(201).json({ success: true, data: notification });
});

export const updateNotificationRecord = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new ApiError(404, 'Notification not found'));
  if (notification.status !== 'draft') {
    return next(new ApiError(400, 'Only draft notifications can be edited'));
  }

  const { title, message, targetRole, salonId } = req.body as Partial<AnnouncementBody>;
  if (title !== undefined) {
    if (!title.trim()) return next(new ApiError(400, 'Title is required'));
    notification.title = title.trim();
  }
  if (message !== undefined) {
    if (!message.trim()) return next(new ApiError(400, 'Message is required'));
    notification.message = message.trim();
  }
  if (targetRole !== undefined) notification.targetRole = targetRole;
  if (salonId !== undefined) notification.salonId = salonId as unknown as typeof notification.salonId;

  await notification.save();
  res.json({ success: true, data: notification });
});

export const sendNotificationRecord = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new ApiError(404, 'Notification not found'));
  if (notification.status === 'sent') return next(new ApiError(400, 'Notification has already been sent'));

  const recipients = await deliverAnnouncement(notification);
  res.json({ success: true, data: notification, count: recipients.length });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 15, unreadOnly = 'false' } = req.query;
  const query: Record<string, unknown> = {};

  if (req.user?.role === Roles.SUPER_ADMIN) {
    // Super admin manages campaign-level records here (one row per notification they
    // created), not every individual recipient's delivered copy.
    query.userId = null;
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