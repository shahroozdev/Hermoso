import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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

export const getReviewStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query: Record<string, unknown> = {};

  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    query.salonId = req.user?.salonId;
  } else if (req.user?.role === Roles.CUSTOMER) {
    query.customerId = req.user?._id;
  }

  const [stats] = await Review.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        flaggedCount: { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
        approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      totalReviews: stats?.totalReviews || 0,
      averageRating: stats?.averageRating ? Number(stats.averageRating.toFixed(1)) : 0,
      flaggedCount: stats?.flaggedCount || 0,
      approvedCount: stats?.approvedCount || 0,
      approvedPercentage: stats?.totalReviews ? Math.round((stats.approvedCount / stats.totalReviews) * 100) : 0,
    },
  });
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, salonId, status, customer, salon, rating, search } = req.query;
  const match: Record<string, unknown> = {};

  if (status) match.status = status;
  if (rating) match.rating = Number(rating);
  if (search) match.comment = new RegExp(search as string, 'i');

  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (salonId) match.salonId = new mongoose.Types.ObjectId(salonId as string);
  } else if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    match.salonId = req.user?.salonId;
  } else {
    match.customerId = req.user?._id;
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    { $lookup: { from: 'users', localField: 'customerId', foreignField: '_id', as: 'customerId' } },
    { $unwind: { path: '$customerId', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'salons', localField: 'salonId', foreignField: '_id', as: 'salonId' } },
    { $unwind: { path: '$salonId', preserveNullAndEmptyArrays: true } },
  ];

  if (customer) pipeline.push({ $match: { 'customerId.name': new RegExp(customer as string, 'i') } });
  if (salon) pipeline.push({ $match: { 'salonId.name': new RegExp(salon as string, 'i') } });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $project: {
              rating: 1,
              comment: 1,
              reply: 1,
              status: 1,
              createdAt: 1,
              customerId: { _id: '$customerId._id', name: '$customerId.name' },
              salonId: { _id: '$salonId._id', name: '$salonId.name', location: '$salonId.location' },
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  );

  const [result] = await Review.aggregate(pipeline);
  const data = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

export const moderateAllReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query: Record<string, unknown> = { status: ReviewStatus.PENDING };
  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    query.salonId = req.user?.salonId;
  }
  const result = await Review.updateMany(query, { status: ReviewStatus.APPROVED });
  res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
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

  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, status: { $nin: [status, ReviewStatus.DELETED] } },
    { status }, { new: true, runValidators: true }
  );
  if (!review) return next(new ApiError(409, 'Review is unavailable or this action is no longer valid'));

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
