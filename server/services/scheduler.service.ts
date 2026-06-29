/* eslint-disable no-console */
import cron from 'node-cron';
import { Booking, type IBooking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { BookingStatus, Roles } from '../utils/constants.js';
import { createNotification } from './notification.service.js';
import { sendEmail } from './email.service.js';

const toDateTime = (date: Date | string, time: string): Date => {
  const yyyyMmDd = new Date(date).toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T${time}:00`);
};

export const runBookingReminderJob = async () => {
  const windowHours = Number(process.env.BOOKING_REMINDER_HOURS || 24);
  const now = new Date();
  const end = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  const candidates = await Booking.find({
    status: BookingStatus.CONFIRMED,
    reminderSentAt: null,
    bookingDate: { $gte: new Date(now.toISOString().slice(0, 10)), $lte: end }
  }).populate('serviceId', 'name') as IBooking[];

  for (const booking of candidates) {
    const bookingDateTime = toDateTime(booking.bookingDate, booking.bookingTime);
    if (bookingDateTime < now || bookingDateTime > end) continue;

    const customer = await User.findById(booking.customerId).select('name email role');
    if (!customer || customer.role !== Roles.CUSTOMER) continue;

    const serviceName = (booking.serviceId && typeof booking.serviceId === 'object' && 'name' in booking.serviceId) ? (booking.serviceId as { name: string }).name : 'service';
    const message = `Reminder: You have an appointment on ${bookingDateTime.toLocaleString()} for ${serviceName}.`;

    await createNotification({
      title: 'Upcoming Appointment Reminder',
      message,
      type: 'booking_reminder',
      targetRole: Roles.CUSTOMER,
      salonId: String(booking.salonId),
      userId: String(customer._id)
    });

    await sendEmail({
      to: customer.email,
      subject: 'Hermoso Booking Reminder',
      html: `<p>Hi ${customer.name},</p><p>${message}</p>`
    });

    booking.reminderSentAt = new Date();
    await booking.save();
  }
};

export const runBookingExpiryJob = async () => {
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);

  const expired = await Booking.find({
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    bookingDate: { $lt: threshold },
  }).populate('serviceId', 'name');

  for (const booking of expired) {
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    const customer = await User.findById(booking.customerId).select('name email');
    if (customer) {
      const serviceName = (booking.serviceId && typeof booking.serviceId === 'object' && 'name' in booking.serviceId)
        ? (booking.serviceId as { name: string }).name
        : 'service';
      await createNotification({
        title: 'Booking Expired',
        message: `Your booking for ${serviceName} on ${new Date(booking.bookingDate).toLocaleDateString()} has been auto-cancelled as the date has passed.`,
        type: 'booking_update',
        targetRole: Roles.CUSTOMER,
        salonId: String(booking.salonId),
        userId: String(customer._id),
      });
    }
  }

  if (expired.length > 0) {
    console.log(`Auto-expired ${expired.length} overdue bookings`);
  }
};

export const startSchedulers = () => {
  cron.schedule('*/15 * * * *', () => {
    runBookingReminderJob().catch((err) => {
      console.error('Booking reminder job failed', err.message);
    });
  });

  cron.schedule('0 */6 * * *', () => {
    runBookingExpiryJob().catch((err) => {
      console.error('Booking expiry job failed', err.message);
    });
  });

  console.log('Schedulers started: booking reminders every 15 min, expiry every 6 hours');
};