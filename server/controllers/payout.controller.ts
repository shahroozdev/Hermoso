import { Response, NextFunction } from 'express';
import { Payout } from '../models/Payout.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as deductionService from '../services/deduction.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const requestPayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.salonId) return next(new ApiError(400, 'Salon owner account is required'));

  const availableInPaisa = await deductionService.calculateAvailableBalance(String(req.user.salonId));

  const amountInPaisa = Number(req.body.amountInPaisa);
  if (!Number.isInteger(amountInPaisa) || amountInPaisa <= 0 || amountInPaisa > availableInPaisa) {
    return next(new ApiError(400, `Invalid payout amount. Available balance: ${availableInPaisa}`));
  }

  const payout = await Payout.create({ salonId: req.user.salonId, amountInPaisa, status: 'pending' });
  res.status(201).json({ success: true, data: payout, availableBalanceInPaisa: availableInPaisa });
});

export const getPayoutStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query: Record<string, unknown> = {};
  if (req.user?.role !== Roles.SUPER_ADMIN) {
    query.salonId = req.user?.salonId;
  }

  const [stats] = await Payout.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        pendingPayouts: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] } },
        pendingTotalInPaisa: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, '$amountInPaisa', 0] } },
        paidPayouts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        paidTotalInPaisa: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amountInPaisa', 0] } },
        totalAmountInPaisa: { $sum: '$amountInPaisa' },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      pendingPayouts: stats?.pendingPayouts || 0,
      pendingTotalInPaisa: stats?.pendingTotalInPaisa || 0,
      paidPayouts: stats?.paidPayouts || 0,
      paidTotalInPaisa: stats?.paidTotalInPaisa || 0,
      avgPayoutInPaisa: stats?.totalCount ? Math.round(stats.totalAmountInPaisa / stats.totalCount) : 0,
    },
  });
});

export const getPayouts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, salonId, status } = req.query;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (salonId) query.salonId = salonId;
  } else {
    query.salonId = req.user?.salonId;
  }

  const data = await Payout.find(query)
    .populate('salonId', 'name')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Payout.countDocuments(query);
  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

interface UpdatePayoutBody {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const updatePayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) return next(new ApiError(404, 'Payout not found'));

  if (req.user?.role !== Roles.SUPER_ADMIN) return next(new ApiError(403, 'Forbidden'));

  payout.status = (req.body as UpdatePayoutBody).status;
  payout.payoutDate = (req.body as UpdatePayoutBody).status === 'completed' ? new Date() : payout.payoutDate;
  await payout.save();

  res.json({ success: true, data: payout });
});