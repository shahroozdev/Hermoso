import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Payout } from '../models/Payout.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as deductionService from '../services/deduction.service.js';
import { numericRange } from '../utils/numericRange.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

// 'admin' gets the same access as 'super_admin' everywhere in this app (see
// rbac.middleware normalizeRole) — the route-level authorize() already treats
// them as equivalent, so checks inside controllers must not compare against
// Roles.SUPER_ADMIN alone or admin-role users get a spurious 403 here even
// though the route let them through.
const isSuperAdminLike = (role?: string) =>
  role === Roles.SUPER_ADMIN || role === Roles.ADMIN;

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
  if (!isSuperAdminLike(req.user?.role as string | undefined)) {
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
  const {
    page = 1,
    limit = 10,
    salonId,
    status,
    search,
    bankAccount,
    dateFrom,
    dateTo,
    netMin,
    netMax,
  } = req.query;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (isSuperAdminLike(req.user?.role as string | undefined)) {
    if (salonId) query.salonId = new mongoose.Types.ObjectId(salonId as string);
  } else {
    query.salonId = req.user?.salonId;
  }

  const netRange = numericRange(netMin, netMax, req.query.netOp);
  if (netRange) query.amountInPaisa = netRange;

  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.$gte = new Date(dateFrom as string);
    if (dateTo) {
      const end = new Date(dateTo as string);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    query.createdAt = range;
  }

  // salon-name and bank-account filters need the joined salon/owner docs, so
  // they're applied in a second $match after the lookups below (same pattern
  // as getSalons's computedMatch for post-lookup fields).
  const computedMatch: Record<string, unknown> = {};
  if (search) computedMatch['salon.name'] = new RegExp(search as string, 'i');
  if (bankAccount) computedMatch['owner.bankAccount'] = new RegExp(bankAccount as string, 'i');

  const pipeline: mongoose.PipelineStage[] = [
    { $match: query },
    { $lookup: { from: 'salons', localField: 'salonId', foreignField: '_id', as: 'salon' } },
    { $addFields: { salon: { $arrayElemAt: ['$salon', 0] } } },
    { $lookup: { from: 'users', localField: 'salon.ownerId', foreignField: '_id', as: 'owner' } },
    { $addFields: { owner: { $arrayElemAt: ['$owner', 0] } } },
  ];

  if (Object.keys(computedMatch).length) pipeline.push({ $match: computedMatch });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $project: {
              amountInPaisa: 1,
              status: 1,
              payoutDate: 1,
              createdAt: 1,
              salonId: { _id: '$salon._id', name: '$salon.name' },
              bankAccount: '$owner.bankAccount',
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  );

  const [result] = await Payout.aggregate(pipeline);
  const data = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

interface UpdatePayoutBody {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const updatePayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) return next(new ApiError(404, 'Payout not found'));

  if (!isSuperAdminLike(req.user?.role as string | undefined)) return next(new ApiError(403, 'Forbidden'));

  const nextStatus = (req.body as UpdatePayoutBody).status;
  const allowedStatuses = ['pending', 'processing', 'completed', 'failed'];
  if (!allowedStatuses.includes(nextStatus)) {
    return next(new ApiError(400, 'Invalid payout status'));
  }

  payout.status = nextStatus;
  payout.payoutDate = nextStatus === 'completed' ? new Date() : payout.payoutDate;
  await payout.save();

  res.json({ success: true, data: payout });
});