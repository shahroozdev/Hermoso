import { Response, NextFunction } from 'express';
import { Refund } from '../models/Refund.js';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as refundService from '../services/refund.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Roles } from '../utils/constants.js';

export const requestRefund = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookingId, reason } = req.body;

  const eligibility = await refundService.getRefundEligibility(bookingId, String(req.user?._id));
  if (!eligibility.eligible) {
    return next(new ApiError(400, eligibility.reason));
  }

  const payment = await Payment.findOne({ bookingId });
  if (!payment) return next(new ApiError(404, 'Payment not found'));

  const result = await refundService.createRefund({
    paymentId: String(payment._id),
    bookingId,
    reason,
    initiatedBy: String(req.user?._id),
    initiatedByType: 'customer'
  });

  res.status(201).json({
    success: true,
    data: {
      refund: result.refund,
      message: result.message
    }
  });
});

export const getRefunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status, salonId } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;

  if (req.user?.role === Roles.SALON_OWNER) {
    query.salonId = req.user.salonId;
  } else if (salonId) {
    query.salonId = salonId;
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Refund.find(query)
      .populate('customerId', 'name email')
      .populate('bookingId', 'bookingDate bookingTime')
      .populate({
        path: 'bookingId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Refund.countDocuments(query)
  ]);

  res.json({
    success: true,
    data,
    meta: { page: pageNum, limit: limitNum, total }
  });
});

export const getRefundById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const refund = await Refund.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate('initiatedBy', 'name email')
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'serviceId', select: 'name price' },
        { path: 'salonId', select: 'name' }
      ]
    });

  if (!refund) return next(new ApiError(404, 'Refund not found'));

  if (req.user?.role === Roles.SALON_OWNER && String(refund.salonId) !== String(req.user.salonId)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  res.json({ success: true, data: refund });
});

export const updateRefund = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status, notes } = req.body;

  const refund = await Refund.findById(req.params.id);
  if (!refund) return next(new ApiError(404, 'Refund not found'));

  refund.status = status;
  if (notes) refund.notes = notes;
  if (status === 'completed') refund.processedAt = new Date();
  await refund.save();

  if (status === 'completed') {
    const payment = await Payment.findById(refund.paymentId);
    if (payment) {
      const newRefundTotal = payment.refundAmount + refund.amount;
      payment.refundAmount = newRefundTotal;
      if (newRefundTotal >= payment.amount) {
        payment.status = 'refunded';
      } else {
        payment.status = 'partially_refunded';
      }
      payment.refundedAt = new Date();
      await payment.save();
    }

    await Booking.findByIdAndUpdate(refund.bookingId, { status: 'cancelled' });
  }

  res.json({ success: true, data: refund });
});

export const getRefundStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [totalRefunds, pendingRefunds, completedRefunds, refundRate] = await Promise.all([
    Refund.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]),
    Refund.countDocuments({ status: 'pending' }),
    Refund.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]),
    Refund.aggregate([
      {
        $group: {
          _id: null,
          refundCount: { $sum: 1 }
        }
      }
    ])
  ]);

  const totalPayments = await Payment.countDocuments({ status: 'paid' });
  const rate = totalPayments > 0
    ? ((refundRate[0]?.refundCount || 0) / totalPayments * 100).toFixed(2)
    : '0.00';

  res.json({
    success: true,
    data: {
      total: {
        count: totalRefunds[0]?.count || 0,
        amount: totalRefunds[0]?.totalAmount || 0
      },
      pending: pendingRefunds,
      completed: {
        count: completedRefunds[0]?.count || 0,
        amount: completedRefunds[0]?.totalAmount || 0
      },
      refundRate: `${rate}%`
    }
  });
});
