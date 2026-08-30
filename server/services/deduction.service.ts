import { Payment } from '../models/Payment.js';
import { Payout } from '../models/Payout.js';
import { Refund } from '../models/Refund.js';
import { PaymentStatus, RefundStatus } from '../utils/constants.js';

export interface DeductionBreakdown {
  totalPayments: number;
  totalPaidOut: number;
  salonInitiatedRefunds: number;
  platformInitiatedRefunds: number;
  availableBalance: number;
}

export async function calculateAvailableBalance(salonId: string): Promise<number> {
  const [totalNetResult, paidOutResult, salonRefundsResult] = await Promise.all([
    Payment.aggregate([
      { $match: { salonId: salonId, status: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$salonAmount' } } }
    ]),
    Payout.aggregate([
      { $match: { salonId: salonId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['salon_owner', 'salon'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalNet = totalNetResult[0]?.total || 0;
  const paidOut = paidOutResult[0]?.total || 0;
  const salonRefunds = salonRefundsResult[0]?.total || 0;

  return totalNet - paidOut - salonRefunds;
}

export async function getDeductionBreakdown(salonId: string): Promise<DeductionBreakdown> {
  const [totalPaymentsResult, paidOutResult, salonRefundsResult, platformRefundsResult] = await Promise.all([
    Payment.aggregate([
      { $match: { salonId: salonId, status: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$salonAmount' } } }
    ]),
    Payout.aggregate([
      { $match: { salonId: salonId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['salon_owner', 'salon'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['admin', 'system', 'customer'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalPayments = totalPaymentsResult[0]?.total || 0;
  const totalPaidOut = paidOutResult[0]?.total || 0;
  const salonInitiatedRefunds = salonRefundsResult[0]?.total || 0;
  const platformInitiatedRefunds = platformRefundsResult[0]?.total || 0;

  return {
    totalPayments,
    totalPaidOut,
    salonInitiatedRefunds,
    platformInitiatedRefunds,
    availableBalance: totalPayments - totalPaidOut - salonInitiatedRefunds
  };
}
