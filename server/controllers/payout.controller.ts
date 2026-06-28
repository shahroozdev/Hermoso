import { Response, NextFunction } from 'express';
import { Payout } from '../models/Payout.js';
import { Payment } from '../models/Payment.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const requestPayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.salonId) return next(new ApiError(400, 'Salon owner account is required'));

  const paid = await Payment.aggregate([
    { $match: { salonId: req.user.salonId, status: 'paid' } },
    { $group: { _id: null, net: { $sum: '$salonAmount' } } }
  ]);

  const completedPayouts = await Payout.aggregate([
    { $match: { salonId: req.user.salonId, status: 'completed' } },
    { $group: { _id: null, paidOut: { $sum: '$amount' } } }
  ]);

  const totalNet = paid[0]?.net || 0;
  const paidOut = completedPayouts[0]?.paidOut || 0;
  const available = Number((totalNet - paidOut).toFixed(2));

  const amount = Number(req.body.amount);
  if (amount <= 0 || amount > available) {
    return next(new ApiError(400, `Invalid payout amount. Available balance: ${available}`));
  }

  const payout = await Payout.create({ salonId: req.user.salonId, amount, status: 'pending' });
  res.status(201).json({ success: true, data: payout, availableBalance: available });
});

export const getPayouts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, salonId, status } = req.query;
  const query: Record<string, any> = {};

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