import { Response, NextFunction } from 'express';
import { Review } from '../models/Review.js';
import { Roles, ReviewStatus, type ReviewStatusType } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface CreateReviewBody {
  salonId: string;
  rating: number;
  comment?: string;
}

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { salonId, rating, comment } = req.body as CreateReviewBody;
  const review = await Review.create({
    salonId,
    customerId: req.user?._id,
    rating,
    comment: comment || '',
    status: ReviewStatus.PENDING
  });

  res.status(201).json({ success: true, data: review });
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, salonId, status } = req.query;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;

  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (salonId) query.salonId = salonId;
  } else if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    query.salonId = req.user?.salonId;
  } else {
    query.customerId = req.user?._id;
  }

  const data = await Review.find(query)
    .populate('customerId', 'name')
    .populate('salonId', 'name location')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Review.countDocuments(query);
  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

interface ModerateBody {
  status: ReviewStatusType;
}

const MODERATABLE_STATUSES = [ReviewStatus.APPROVED, ReviewStatus.FLAGGED, ReviewStatus.DELETED] as const;

export const moderateReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.body as ModerateBody;
  if (!(MODERATABLE_STATUSES as readonly string[]).includes(status)) {
    return next(new ApiError(400, 'Invalid moderation status'));
  }

  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) return next(new ApiError(404, 'Review not found'));

  res.json({ success: true, data: review });
});

interface ReplyBody {
  reply?: string;
}

export const replyReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new ApiError(404, 'Review not found'));

  if (req.user?.role !== Roles.SUPER_ADMIN && String(review.salonId) !== String(req.user?.salonId)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  review.reply = (req.body as ReplyBody).reply || '';
  await review.save();
  res.json({ success: true, data: review });
});