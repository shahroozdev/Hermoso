import { Response, NextFunction } from 'express';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { PaymentStatus } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as safepayService from '../services/safepay.service.js';
import * as fraudService from '../services/fraud.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const REDIRECT_BASE = process.env.SAFEPAY_REDIRECT_BASE || 'http://localhost:5173';

export const createCheckout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate('serviceId', 'name priceInPaisa');
  if (!booking) return next(new ApiError(404, 'Booking not found'));

  if (String(booking.customerId) !== String(req.user?._id)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  let payment = await Payment.findOne({ bookingId });

  if (payment && payment.status === PaymentStatus.PAID) {
    return res.json({
      success: true,
      data: { alreadyPaid: true, message: 'Payment already completed' }
    });
  }

  if (payment && payment.trackerId && payment.status === PaymentStatus.PENDING) {
    const createdAt = payment.get('createdAt') ? new Date(payment.get('createdAt') as Date).getTime() : 0;
    const age = Date.now() - createdAt;
    if (age < 60 * 60 * 1000) {
      const authToken = await safepayService.createAuthToken();
      const checkoutUrl = safepayService.generateCheckoutUrl({
        trackerToken: payment.trackerId,
        authToken,
        source: 'hosted',
        redirectUrl: `${REDIRECT_BASE}/customer/payment/success?tracker=${payment.trackerId}`,
        cancelUrl: `${REDIRECT_BASE}/customer/payment/failed?tracker=${payment.trackerId}`
      });

      return res.json({
        success: true,
        data: { checkoutUrl, tracker: payment.trackerId }
      });
    }
  }

  const service = booking.serviceId as unknown as { priceInPaisa: number };
  const fraudResult = await fraudService.checkFraud({
    customerId: String(booking.customerId),
    serviceId: String(booking.serviceId),
    bookingDate: booking.bookingDate,
    amountInPaisa: service.priceInPaisa,
    ipAddress: req.ip || undefined,
    userAgent: req.get('user-agent') || undefined
  });

  if (fraudResult.block) {
    for (const flag of fraudResult.flags) {
      await fraudService.logFraudEvent({
        customerId: String(booking.customerId),
        flag,
        reason: fraudResult.reasons[fraudResult.flags.indexOf(flag)],
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined
      });
    }
    return next(new ApiError(403, 'Payment blocked due to suspicious activity'));
  }

  const idempotencyKey = `${bookingId}-${Date.now()}`;

  if (!payment) {
    payment = await Payment.create({
      bookingId: booking._id,
      salonId: booking.salonId,
      amountInPaisa: service.priceInPaisa,
      platformCommissionInPaisa: 0,
      salonAmountInPaisa: service.priceInPaisa,
      status: PaymentStatus.PENDING,
      idempotencyKey,
      fraudFlag: fraudResult.flags[0] || 'none',
      fraudReasons: fraudResult.reasons,
      ipAddress: req.ip || undefined,
      userAgent: req.get('user-agent') || undefined
    });
  }

  const tracker = await safepayService.createPaymentTracker({
    amountInPaisa: service.priceInPaisa,
    currency: 'PKR',
    orderId: String(booking._id),
    customerId: String(booking.customerId)
  });

  payment.trackerId = tracker.trackerToken;
  payment.idempotencyKey = idempotencyKey;
  await payment.save();

  const authToken = await safepayService.createAuthToken();
  const checkoutUrl = safepayService.generateCheckoutUrl({
    trackerToken: tracker.trackerToken,
    authToken,
    source: 'hosted',
    redirectUrl: `${REDIRECT_BASE}/customer/payment/success?tracker=${tracker.trackerToken}`,
    cancelUrl: `${REDIRECT_BASE}/customer/payment/failed?tracker=${tracker.trackerToken}`
  });

  res.status(201).json({
    success: true,
    data: { checkoutUrl, tracker: tracker.trackerToken }
  });
});

export const getPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { tracker } = req.params;

  const payment = await Payment.findOne({ trackerId: tracker })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'serviceId', select: 'name priceInPaisa duration' },
        { path: 'salonId', select: 'name' },
        { path: 'staffId', select: 'name' }
      ]
    });

  if (!payment) return next(new ApiError(404, 'Payment not found'));

  const booking = payment.bookingId as unknown as { customerId?: string };
  if (booking?.customerId && String(booking.customerId) !== String(req.user?._id)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  if (payment.status === PaymentStatus.PENDING && payment.trackerId) {
    try {
      const trackerStatus = await safepayService.getTrackerStatus(payment.trackerId);
      payment.safepayStatus = trackerStatus.state;

      if (trackerStatus.state === 'TRACKER_ENDED') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });
      } else if (trackerStatus.state === 'TRACKER_ABANDONED' || trackerStatus.state === 'TRACKER_EXPIRED') {
        payment.status = PaymentStatus.FAILED;
        await payment.save();
      }
    } catch {
      // SafePay API error, return current DB status
    }
  }

  res.json({
    success: true,
    data: {
      status: payment.status,
      paidAt: payment.paidAt,
      amountInPaisa: payment.amountInPaisa,
      tracker: payment.trackerId,
      booking: payment.bookingId
    }
  });
});
