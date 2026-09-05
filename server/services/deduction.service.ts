import { Payment } from '../models/Payment.js';
import { Payout } from '../models/Payout.js';
import { Refund } from '../models/Refund.js';
import { PaymentStatus, RefundStatus } from '../utils/constants.js';

export interface DeductionBreakdown {
  totalPaymentsInPaisa: number;
  totalPaidOutInPaisa: number;
  salonInitiatedRefundsInPaisa: number;
  platformInitiatedRefundsInPaisa: number;
  availableBalanceInPaisa: number;
}

export async function calculateAvailableBalance(salonId: string): Promise<number> {
  const [totalNetResult, paidOutResult, salonRefundsResult] = await Promise.all([
    Payment.aggregate([
      { $match: { salonId: salonId, status: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$salonAmountInPaisa' } } }
    ]),
    Payout.aggregate([
      { $match: { salonId: salonId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountInPaisa' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['salon_owner', 'salon'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amountInPaisa' } } }
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
      { $group: { _id: null, total: { $sum: '$salonAmountInPaisa' } } }
    ]),
    Payout.aggregate([
      { $match: { salonId: salonId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountInPaisa' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['salon_owner', 'salon'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amountInPaisa' } } }
    ]),
    Refund.aggregate([
      {
        $match: {
          salonId: salonId,
          status: RefundStatus.COMPLETED,
          initiatedByType: { $in: ['admin', 'system', 'customer'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amountInPaisa' } } }
    ])
  ]);

  const totalPaymentsInPaisa = totalPaymentsResult[0]?.total || 0;
  const totalPaidOutInPaisa = paidOutResult[0]?.total || 0;
  const salonInitiatedRefundsInPaisa = salonRefundsResult[0]?.total || 0;
  const platformInitiatedRefundsInPaisa = platformRefundsResult[0]?.total || 0;

  return {
    totalPaymentsInPaisa,
    totalPaidOutInPaisa,
    salonInitiatedRefundsInPaisa,
    platformInitiatedRefundsInPaisa,
    availableBalanceInPaisa: totalPaymentsInPaisa - totalPaidOutInPaisa - salonInitiatedRefundsInPaisa
  };
}
