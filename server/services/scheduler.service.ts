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

    const message = `Reminder: You have an appointment on ${bookingDateTime.toLocaleString()} for ${(booking.serviceId as any)?.name || 'service'}.`;

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

export const startSchedulers = () => {
  cron.schedule('*/15 * * * *', () => {
    runBookingReminderJob().catch((err) => {
      console.error('Booking reminder job failed', err.message);
    });
  });

  console.log('Schedulers started: booking reminders every 15 minutes');
};