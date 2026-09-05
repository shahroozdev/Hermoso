import { Payment } from '../models/Payment.js';
import { FraudLog } from '../models/FraudLog.js';
import { FraudFlag, type FraudFlagType } from '../utils/constants.js';

const RAPID_BOOKING_WINDOW_MS = 10 * 60 * 1000;
const VELOCITY_WINDOW_MS = 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const VELOCITY_LIMIT = 5;
const RAPID_LIMIT = 3;
const MAX_AMOUNT_IN_PAISA = 50000 * 100;
const MIN_AMOUNT_IN_PAISA = 1 * 100;

export interface FraudCheckResult {
  allowed: boolean;
  block: boolean;
  flags: FraudFlagType[];
  reasons: string[];
}

export async function checkFraud(params: {
  customerId: string;
  serviceId: string;
  bookingDate: Date;
  amountInPaisa: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<FraudCheckResult> {
  const flags: FraudFlagType[] = [];
  const reasons: string[] = [];
  let block = false;

  const now = new Date();

  const recentDuplicate = await Payment.findOne({
    salonId: { $exists: true },
    createdAt: { $gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
    fraudFlag: { $ne: FraudFlag.DUPLICATE_TRANSACTION }
  }).populate({
    path: 'bookingId',
    match: {
      customerId: params.customerId,
      serviceId: params.serviceId,
      bookingDate: params.bookingDate
    }
  });

  if (recentDuplicate && recentDuplicate.bookingId) {
    flags.push(FraudFlag.DUPLICATE_TRANSACTION);
    reasons.push('Duplicate booking detected within 5 minutes');
    block = true;
  }

  const customerRecentCount = await Payment.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: '$booking' },
    {
      $match: {
        'booking.customerId': params.customerId,
        createdAt: { $gte: new Date(now.getTime() - VELOCITY_WINDOW_MS) }
      }
    },
    { $count: 'count' }
  ]);

  const count = customerRecentCount[0]?.count || 0;
  if (count >= VELOCITY_LIMIT) {
    flags.push(FraudFlag.VELOCITY_EXCEEDED);
    reasons.push(`Customer has made ${count} bookings in the last hour`);
  }

  const recentRapid = await Payment.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking'
      }
    },
    { $unwind: '$booking' },
    {
      $match: {
        'booking.customerId': params.customerId,
        createdAt: { $gte: new Date(now.getTime() - RAPID_BOOKING_WINDOW_MS) }
      }
    },
    { $count: 'count' }
  ]);

  const rapidCount = recentRapid[0]?.count || 0;
  if (rapidCount >= RAPID_LIMIT) {
    flags.push(FraudFlag.RAPID_BOOKING);
    reasons.push(`Customer has made ${rapidCount} bookings in the last 10 minutes`);
  }

  if (params.amountInPaisa > MAX_AMOUNT_IN_PAISA) {
    flags.push(FraudFlag.SUSPICIOUS_AMOUNT);
    reasons.push(`Payment amount PKR ${params.amountInPaisa / 100} exceeds maximum threshold`);
  }

  if (params.amountInPaisa < MIN_AMOUNT_IN_PAISA) {
    flags.push(FraudFlag.SUSPICIOUS_AMOUNT);
    reasons.push(`Payment amount PKR ${params.amountInPaisa / 100} is below minimum threshold`);
  }

  return {
    allowed: !block,
    block,
    flags,
    reasons
  };
}

export async function logFraudEvent(params: {
  customerId: string;
  paymentId?: string;
  flag: FraudFlagType;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await FraudLog.create({
    customerId: params.customerId,
    paymentId: params.paymentId || null,
    flag: params.flag,
    reason: params.reason,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    metadata: params.metadata || {},
    resolved: false
  });
}

export async function getUnresolvedFrauds(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    FraudLog.find({ resolved: false })
      .populate('customerId', 'name email')
      .populate('paymentId', 'amountInPaisa status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    FraudLog.countDocuments({ resolved: false })
  ]);

  return { data, meta: { page, limit, total } };
}

export async function resolveFraud(fraudId: string, resolvedBy: string): Promise<void> {
  await FraudLog.findByIdAndUpdate(fraudId, {
    resolved: true,
    resolvedBy,
    resolvedAt: new Date()
  });
}
