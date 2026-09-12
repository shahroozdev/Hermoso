import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { numericRange } from '../utils/numericRange.js';
import { broadcastByRole, deliverAnnouncement } from '../services/notification.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface AnnouncementBody {
  title: string;
  message: string;
  targetRole: string;
  salonId?: string | null;
  type?: string;
}

// Mirrors the `type` enum on models/Notification.ts. Kept as a plain array here
// (rather than importing mongoose schema internals) since it's only used for
// request-body validation.
const ALLOWED_NOTIFICATION_TYPES = [
  'announcement',
  'system',
  'booking_reminder',
  'booking_update',
  'payout',
  'review'
];

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
  const { title, message, targetRole, salonId = null, type } = req.body as AnnouncementBody;
  if (!title?.trim() || !message?.trim() || !targetRole) {
    return next(new ApiError(400, 'title, message and targetRole are required'));
  }
  if (!type || !ALLOWED_NOTIFICATION_TYPES.includes(type)) {
    return next(new ApiError(400, 'A valid notification type is required'));
  }

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type,
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

  const { title, message, targetRole, salonId, type } = req.body as Partial<AnnouncementBody>;
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
  if (type !== undefined) {
    if (!ALLOWED_NOTIFICATION_TYPES.includes(type)) return next(new ApiError(400, 'Invalid notification type'));
    notification.type = type as typeof notification.type;
  }

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

export const getNotificationRecipients = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const campaign = await Notification.findById(req.params.id);
  if (!campaign) return next(new ApiError(404, 'Notification not found'));
  if (campaign.status !== 'sent') return next(new ApiError(400, 'This notification has not been sent yet'));

  const recipients = await Notification.find({ campaignId: campaign._id })
    .populate('userId', 'name email role')
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: recipients.map((r) => ({
      _id: r._id,
      user: r.userId,
      isRead: r.isRead
    })),
    // Campaign-level context (title/message) so the recipients report can show
    // which notification it belongs to without a second request.
    notification: {
      title: campaign.title,
      message: campaign.message
    }
  });
});

// Aggregated, one-row-per-campaign report of every sent notification, used by the
// "Export All Sent Notifications" action on the admin notifications list. Recipient
// and read counts are computed live from the fanned-out per-recipient copies
// (linked via campaignId) rather than trusted from the stored recipientCount field,
// so the report stays correct even if recipient docs are later removed.
export const getSentNotificationsSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaigns = await Notification.aggregate([
    { $match: { userId: null, status: 'sent' } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'notifications',
        localField: '_id',
        foreignField: 'campaignId',
        as: 'recipients'
      }
    },
    {
      $addFields: {
        recipientCount: { $size: '$recipients' },
        sentAt: { $ifNull: ['$sentAt', { $ifNull: [{ $min: '$recipients.createdAt' }, '$createdAt'] }] },
        readCount: {
          $size: {
            $filter: {
              input: '$recipients',
              as: 'r',
              cond: { $eq: ['$$r.isRead', true] }
            }
          }
        }
      }
    },
    {
      $project: {
        title: 1,
        message: 1,
        targetRole: 1,
        createdAt: 1,
        sentAt: 1,
        recipientCount: 1,
        readCount: 1
      }
    }
  ]);

  res.json({ success: true, data: campaigns });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 15,
    unreadOnly = 'false',
    search,
    targetRole,
    status,
    dateFrom,
    dateTo,
    recipientsMin,
    recipientsMax
  } = req.query;
  const query: Record<string, unknown> = {};

  if (req.user?.role === Roles.SUPER_ADMIN) {
    // Super admin manages campaign-level records here (one row per notification they
    // created), not every individual recipient's delivered copy.
    query.userId = null;
    if (unreadOnly === 'true') query.isRead = false;
  } else {
    // Each recipient's copy is already scoped to them via userId, so it's not
    // filtered by the recipient's own salonId here — broadcastByRole stamps every
    // recipient copy with the campaign's salonId (null unless the admin targeted a
    // specific salon), which won't match a salon owner/staff member's own salonId.
    query.userId = req.user?._id;
    if (unreadOnly === 'true') query.isRead = false;
  }

  if (search) {
    const re = new RegExp(String(search), 'i');
    query.$or = [{ title: re }, { message: re }];
  }
  if (targetRole) query.targetRole = targetRole;
  if (status) query.status = status;
  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.$gte = new Date(String(dateFrom));
    if (dateTo) {
      const end = new Date(String(dateTo));
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    query.createdAt = range;
  }
  const recipientsRange = numericRange(recipientsMin, recipientsMax, req.query.recipientsOp);
  if (recipientsRange) query.recipientCount = recipientsRange;

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
