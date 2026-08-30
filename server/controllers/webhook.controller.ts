import { Request, Response } from 'express';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { PaymentStatus, BookingStatus } from '../utils/constants.js';
import { createNotification } from '../services/notification.service.js';
import { sendEmail } from '../services/email.service.js';
import { User } from '../models/User.js';
import * as refundService from '../services/refund.service.js';

const WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || '';

function verifyWebhookSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) return true;

  const signature = req.headers['x-safepay-signature'] as string;
  const timestamp = req.headers['x-safepay-timestamp'] as string;
  if (!signature || !timestamp) return false;

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const signingPayload = `${timestamp}.${rawBody}`;

  // Webhook secret is base64-encoded
  const key = Buffer.from(WEBHOOK_SECRET, 'base64');
  const hmac = crypto.createHmac('sha256', key);
  const digest = hmac.update(signingPayload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.event_type || event.type;
    const data = event.data || event;

    switch (eventType) {
      case 'payment.succeeded': {
        const trackerToken = data.tracker?.token || data.tracker;
        if (!trackerToken) break;

        const payment = await Payment.findOne({ trackerId: trackerToken });
        if (!payment) break;

        if (payment.status === PaymentStatus.PAID) break;

        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        payment.safepayStatus = 'TRACKER_ENDED';
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, {
          status: BookingStatus.CONFIRMED
        });

        const booking = await Booking.findById(payment.bookingId)
          .populate('serviceId', 'name')
          .populate('salonId', 'name');

        if (booking) {
          const customer = await User.findById(booking.customerId);
          if (customer) {
            const serviceName = (booking.serviceId as unknown as { name?: string })?.name || 'service';
            const salonName = (booking.salonId as unknown as { name?: string })?.name || 'salon';

            await createNotification({
              title: 'Payment Confirmed',
              message: `Your payment of PKR ${payment.amount} for ${serviceName} at ${salonName} has been confirmed.`,
              type: 'booking_update',
              targetRole: 'customer',
              userId: String(customer._id)
            });

            if (customer.email) {
              await sendEmail({
                to: customer.email,
                subject: 'Hermoso Payment Confirmed',
                html: `<p>Hi ${customer.name},</p><p>Your payment of <strong>PKR ${payment.amount}</strong> for ${serviceName} at ${salonName} has been confirmed.</p><p>Your booking is now confirmed.</p>`
              });
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        const trackerToken = data.tracker?.token || data.tracker;
        if (!trackerToken) break;

        const payment = await Payment.findOne({ trackerId: trackerToken });
        if (!payment) break;

        if (payment.status === PaymentStatus.PAID) break;

        payment.status = PaymentStatus.FAILED;
        payment.safepayStatus = 'TRACKER_FAILED';
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, {
          status: BookingStatus.CANCELLED
        });

        const booking = await Booking.findById(payment.bookingId)
          .populate('serviceId', 'name')
          .populate('salonId', 'name');

        if (booking) {
          const customer = await User.findById(booking.customerId);
          if (customer) {
            await createNotification({
              title: 'Payment Failed',
              message: `Your payment could not be processed. Please try again.`,
              type: 'booking_update',
              targetRole: 'customer',
              userId: String(customer._id)
            });

            if (customer.email) {
              await sendEmail({
                to: customer.email,
                subject: 'Hermoso Payment Failed',
                html: `<p>Hi ${customer.name},</p><p>Your payment could not be processed.</p><p>Please try booking again.</p>`
              });
            }
          }
        }
        break;
      }

      case 'refund.succeeded': {
        const refundId = data.refund_id || data.refund?.id;
        if (refundId) {
          await refundService.handleRefundWebhook({ refundId, status: 'succeeded' });
        }
        break;
      }

      case 'refund.failed': {
        const refundId = data.refund_id || data.refund?.id;
        if (refundId) {
          await refundService.handleRefundWebhook({ refundId, status: 'failed' });
        }
        break;
      }

      default:
        break;
    }

    res.status(200).json({ success: true });
  } catch {
    res.status(200).json({ success: true });
  }
};
