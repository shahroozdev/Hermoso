import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { Refund } from '../models/Refund.js';
import { RefundStatus, PaymentStatus, BookingStatus } from '../utils/constants.js';
import { paisaToRupees } from '../utils/money.js';
import * as safepayService from './safepay.service.js';
import { createNotification } from './notification.service.js';
import { sendEmail } from './email.service.js';
import { User } from '../models/User.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface RefundEligibility {
  eligible: boolean;
  reason: string;
  amountInPaisa: number;
}

export async function getRefundEligibility(
  bookingId: string,
  customerId: string
): Promise<RefundEligibility> {
  const booking = await Booking.findById(bookingId)
    .populate('serviceId', 'name')
    .populate('salonId', 'name');

  if (!booking) {
    return { eligible: false, reason: 'Booking not found', amountInPaisa: 0 };
  }

  if (String(booking.customerId) !== customerId) {
    return { eligible: false, reason: 'Not your booking', amountInPaisa: 0 };
  }

  const payment = await Payment.findOne({ bookingId });
  if (!payment || payment.status !== PaymentStatus.PAID) {
    return { eligible: false, reason: 'No paid payment found for this booking', amountInPaisa: 0 };
  }

  const existingRefund = await Refund.findOne({
    bookingId,
    status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING] }
  });
  if (existingRefund) {
    return { eligible: false, reason: 'A refund is already being processed', amountInPaisa: 0 };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { eligible: true, reason: 'Booking was cancelled', amountInPaisa: payment.amountInPaisa };
  }

  const appointmentTime = new Date(booking.bookingDate);
  const [hours, minutes] = booking.bookingTime.split(':').map(Number);
  appointmentTime.setUTCHours(hours, minutes, 0, 0);

  const now = new Date();
  const timeUntilAppointment = appointmentTime.getTime() - now.getTime();

  if (timeUntilAppointment >= TWENTY_FOUR_HOURS_MS) {
    return { eligible: true, reason: 'Cancellation within 24-hour window', amountInPaisa: payment.amountInPaisa };
  }

  return {
    eligible: false,
    reason: 'Cancellations less than 24 hours before appointment are non-refundable',
    amountInPaisa: 0
  };
}

export async function createRefund(params: {
  paymentId: string;
  bookingId: string;
  reason: string;
  initiatedBy: string;
  initiatedByType: 'customer' | 'salon_owner' | 'admin' | 'system';
  amountInPaisa?: number;
}): Promise<{ refund: InstanceType<typeof Refund>; success: boolean; message: string }> {
  const payment = await Payment.findById(params.paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw new Error('Payment is not in paid status');
  }

  const refundAmountInPaisa = params.amountInPaisa || payment.amountInPaisa;
  if (refundAmountInPaisa > payment.amountInPaisa - payment.refundAmountInPaisa) {
    throw new Error('Refund amount exceeds available amount');
  }

  const refund = await Refund.create({
    paymentId: params.paymentId,
    bookingId: params.bookingId,
    salonId: payment.salonId,
    customerId: payment.bookingId ? (await Booking.findById(params.bookingId))?.customerId : undefined,
    amountInPaisa: refundAmountInPaisa,
    reason: params.reason,
    initiatedBy: params.initiatedBy,
    initiatedByType: params.initiatedByType,
    status: RefundStatus.PENDING
  });

  try {
    if (!payment.trackerId) {
      throw new Error('Payment tracker not found');
    }

    const booking = await Booking.findById(params.bookingId);
    const result = await safepayService.initiateRefund({
      trackerToken: payment.trackerId,
      amountInPaisa: refundAmountInPaisa,
      currency: 'PKR'
    });

    refund.status = RefundStatus.PROCESSING;
    refund.safepayRefundId = result.state;
    await refund.save();

    const newRefundTotalInPaisa = payment.refundAmountInPaisa + refundAmountInPaisa;
    payment.refundAmountInPaisa = newRefundTotalInPaisa;
    payment.refundTrackerId = result.state;

    if (newRefundTotalInPaisa >= payment.amountInPaisa) {
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
      payment.refundedAt = new Date();
    }
    await payment.save();

    if (booking) {
      booking.status = BookingStatus.CANCELLED;
      await booking.save();
    }

    const customer = await User.findById(payment.bookingId ? (await Booking.findById(params.bookingId))?.customerId : null);
    if (customer) {
      const refundAmountInRupees = paisaToRupees(refundAmountInPaisa);
      await createNotification({
        title: 'Refund Processed',
        message: `Your refund of PKR ${refundAmountInRupees} has been initiated. It will be reflected in 7-14 business days.`,
        type: 'booking_update',
        targetRole: 'customer',
        userId: String(customer._id)
      });

      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Hermoso Refund Confirmation',
          html: `<p>Hi ${customer.name},</p><p>Your refund of <strong>PKR ${refundAmountInRupees}</strong> has been initiated.</p><p>It will be reflected in your account within 7-14 business days.</p><p>Reason: ${params.reason}</p>`
        });
      }
    }

    return { refund, success: true, message: 'Refund initiated successfully' };
  } catch {
    refund.status = RefundStatus.FAILED;
    await refund.save();
    return { refund, success: false, message: 'Failed to process refund' };
  }
}

export async function createAutoRefund(params: {
  bookingId: string;
  reason: string;
  initiatedByType: 'salon_owner' | 'system';
}): Promise<void> {
  const booking = await Booking.findById(params.bookingId);
  if (!booking) return;

  const payment = await Payment.findOne({ bookingId: params.bookingId });
  if (!payment || payment.status !== PaymentStatus.PAID) return;

  const initiatedBy = params.initiatedByType === 'salon_owner'
    ? booking.salonId
    : booking.customerId;

  await createRefund({
    paymentId: String(payment._id),
    bookingId: params.bookingId,
    reason: params.reason,
    initiatedBy: String(initiatedBy),
    initiatedByType: params.initiatedByType
  });
}

export async function handleRefundWebhook(params: {
  refundId: string;
  status: 'succeeded' | 'failed';
}): Promise<void> {
  const refund = await Refund.findOne({ safepayRefundId: params.refundId });
  if (!refund) return;

  if (params.status === 'succeeded') {
    refund.status = RefundStatus.COMPLETED;
    refund.processedAt = new Date();
  } else {
    refund.status = RefundStatus.FAILED;
  }
  await refund.save();

  const payment = await Payment.findById(refund.paymentId);
  if (payment) {
    if (params.status === 'failed') {
      payment.status = PaymentStatus.PAID;
      payment.refundAmountInPaisa = Math.max(0, payment.refundAmountInPaisa - refund.amountInPaisa);
      payment.refundedAt = null;
      await payment.save();
    }
  }
}
