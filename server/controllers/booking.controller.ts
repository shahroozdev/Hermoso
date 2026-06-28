import { Response, NextFunction } from 'express';
import { Booking, type IBooking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Salon } from '../models/Salon.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { Roles, BookingStatus, type BookingStatusType } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notification.service.js';
import { sendEmail } from '../services/email.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const calculateCommission = (amount: number, commissionRate: number) => {
  const platformCommission = Number(((amount * commissionRate) / 100).toFixed(2));
  const salonAmount = Number((amount - platformCommission).toFixed(2));
  return { platformCommission, salonAmount };
};

interface CreateBookingBody {
  salonId: string;
  serviceId: string;
  staffId: string;
  bookingDate: string;
  bookingTime: string;
}

export const getBookingFormOptions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { salonId, serviceId } = req.query as Record<string, string | undefined>;
  if (!salonId) return next(new ApiError(400, 'salonId is required'));

  const [salon, services, staffUsers] = await Promise.all([
    Salon.findById(salonId).select('_id name'),
    Service.find({ salonId, active: true }).select('_id name price duration').sort({ createdAt: -1 }),
    User.find({ salonId, role: Roles.STAFF, status: 'active' }).select('_id name staffDetails.services').sort({ createdAt: -1 })
  ]);

  if (!salon) return next(new ApiError(404, 'Salon not found'));

  const filteredStaff = serviceId
    ? staffUsers.filter((member) =>
      Array.isArray(member.staffDetails?.services) && member.staffDetails.services.length > 0
        ? member.staffDetails.services.some((id) => String(id) === String(serviceId))
        : true
    )
    : staffUsers;

  res.json({
    success: true,
    data: {
      salon,
      services,
      staff: filteredStaff.map((member) => ({ _id: member._id, name: member.name }))
    }
  });
});

const normalizeDate = (dateInput: string) => {
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

const formatTime = (hours: number, minutes: number) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

const parseTimeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const formatSlotLabel = (startMinutes: number, endMinutes: number) => {
  const format = (mins: number) => {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
  };
  return `${format(startMinutes)} - ${format(endMinutes)}`;
};

const getDayKey = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase() as
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export const createBooking = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { salonId, serviceId, staffId, bookingDate, bookingTime } = req.body as CreateBookingBody;
  const normalizedDate = normalizeDate(bookingDate);
  if (!normalizedDate) return next(new ApiError(400, 'Invalid bookingDate'));

  const salon = await Salon.findById(salonId);
  if (!salon) return next(new ApiError(404, 'Salon not found'));

  const service = await Service.findOne({ _id: serviceId, salonId });
  if (!service) return next(new ApiError(404, 'Service not found for salon'));

  const staff = await User.findOne({ _id: staffId, salonId, role: Roles.STAFF, status: 'active' });
  if (!staff) return next(new ApiError(404, 'Staff not found for salon'));
  if (Array.isArray(staff.staffDetails?.services) && staff.staffDetails.services.length > 0) {
    const supportsService = staff.staffDetails.services.some((id) => String(id) === String(service._id));
    if (!supportsService) return next(new ApiError(400, 'Selected staff is not assigned to this service'));
  }

  const salonDayKey = getDayKey(normalizedDate);
  const dayHours = salon.workingHours?.[salonDayKey];
  if (!dayHours || dayHours.off || !dayHours.open || !dayHours.close) {
    return next(new ApiError(400, 'Salon is closed on selected date'));
  }

  const openMinutes = parseTimeToMinutes(dayHours.open);
  const closeMinutes = parseTimeToMinutes(dayHours.close);
  const startMinutes = parseTimeToMinutes(bookingTime);
  if (openMinutes === null || closeMinutes === null || startMinutes === null) {
    return next(new ApiError(400, 'Invalid booking time'));
  }
  const requestedEndMinutes = startMinutes + service.duration;
  if (startMinutes < openMinutes || requestedEndMinutes > closeMinutes) {
    return next(new ApiError(400, 'Selected time is outside salon working hours'));
  }

  const existingBookings = await Booking.find({
    salonId,
    staffId,
    bookingDate: normalizedDate,
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
  }).populate('serviceId', 'duration');

  const hasOverlap = existingBookings.some((existing) => {
    const existingStart = parseTimeToMinutes(existing.bookingTime);
    const existingDuration = Number((existing.serviceId as unknown as { duration?: number })?.duration || 0);
    if (existingStart === null || !existingDuration) return false;
    const existingEnd = existingStart + existingDuration;
    return startMinutes < existingEnd && existingStart < requestedEndMinutes;
  });
  if (hasOverlap) return next(new ApiError(409, 'Time slot is already booked'));

  let booking: IBooking;
  try {
    booking = await Booking.create({
      customerId: req.user?._id,
      salonId,
      serviceId,
      staffId,
      bookingDate: normalizedDate,
      bookingTime,
      price: service.price,
      status: BookingStatus.PENDING
    });
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err?.code === 11000 || err?.message?.includes('Time slot is already booked')) {
      return next(new ApiError(409, 'Time slot is already booked'));
    }
    throw error;
  }

  const { platformCommission, salonAmount } = calculateCommission(service.price, salon.commissionRate);

  const payment = await Payment.create({
    bookingId: booking._id,
    salonId,
    amount: service.price,
    platformCommission,
    salonAmount,
    status: 'pending'
  });

  await createNotification({
    title: 'Booking Created',
    message: `Your booking request for ${service.name} on ${new Date(bookingDate).toLocaleDateString()} at ${bookingTime} is pending.`,
    type: 'booking_update',
    targetRole: Roles.CUSTOMER,
    salonId,
    userId: String(req.user?._id)
  });

  const customer = await User.findById(req.user?._id).select('name email');
  if (customer?.email) {
    await sendEmail({
      to: customer.email,
      subject: 'Hermoso Booking Request Received',
      html: `<p>Hi ${customer.name},</p><p>Your booking request at ${salon.name} has been created and is pending confirmation.</p>`
    });
  }

  res.status(201).json({ success: true, data: { booking, payment } });
});

export const getBookingAvailability = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { salonId, serviceId, staffId, date } = req.query as Record<string, string | undefined>;
  if (!salonId || !serviceId || !staffId || !date) {
    return next(new ApiError(400, 'salonId, serviceId, staffId and date are required'));
  }

  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return next(new ApiError(400, 'Invalid date'));

  const [salon, service, staff] = await Promise.all([
    Salon.findById(salonId),
    Service.findOne({ _id: serviceId, salonId, active: true }),
    User.findOne({ _id: staffId, salonId, role: Roles.STAFF, status: 'active' }).select('name staffDetails')
  ]);

  if (!salon) return next(new ApiError(404, 'Salon not found'));
  if (!service) return next(new ApiError(404, 'Service not found for salon'));
  if (!staff) return next(new ApiError(404, 'Staff not found for salon'));

  if (Array.isArray(staff.staffDetails?.services) && staff.staffDetails?.services?.length > 0) {
    const supportsService = staff.staffDetails.services.some((id) => String(id) === String(service._id));
    if (!supportsService) return next(new ApiError(400, 'Selected staff is not assigned to this service'));
  }

  const dayKey = getDayKey(normalizedDate);
  const dayHours = salon.workingHours?.[dayKey];
  if (!dayHours || dayHours.off || !dayHours.open || !dayHours.close) {
    return res.json({
      success: true,
      data: { date: normalizedDate, staffId, serviceId, slots: [], reason: 'Salon is closed on this date' }
    });
  }

  const openMinutes = parseTimeToMinutes(dayHours.open);
  const closeMinutes = parseTimeToMinutes(dayHours.close);
  if (openMinutes === null || closeMinutes === null || closeMinutes <= openMinutes) {
    return res.json({
      success: true,
      data: { date: normalizedDate, staffId, serviceId, slots: [], reason: 'Invalid salon hours configuration' }
    });
  }

  const slotDuration = Math.max(Number(service.duration) || 0, 60);
  const slotInterval = 60;
  const lastStart = closeMinutes - slotDuration;
  const allSlots: { time: string; label: string; start: number; end: number }[] = [];
  for (let start = openMinutes; start <= lastStart; start += slotInterval) {
    const end = start + slotDuration;
    const hours = Math.floor(start / 60);
    const minutes = start % 60;
    allSlots.push({
      time: formatTime(hours, minutes),
      label: formatSlotLabel(start, end),
      start,
      end
    });
  }

  const booked = await Booking.find({
    salonId,
    staffId,
    bookingDate: normalizedDate,
    status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
  }).populate('serviceId', 'duration');

  const normalizedBooked = booked.map((b) => {
    const start = parseTimeToMinutes(b.bookingTime);
    const duration = Number((b.serviceId as { duration?: number })?.duration || 0);
    if (start === null || duration <= 0) return null;
    return { start, end: start + duration };
  }).filter(Boolean) as { start: number; end: number }[];

  const slots = allSlots.map((slot) => {
    const available = !normalizedBooked.some((b) => slot.start < b.end && b.start < slot.end);
    return {
      time: slot.time,
      label: slot.label,
      available
    };
  });

  res.json({
    success: true,
    data: {
      date: normalizedDate,
      salonId,
      serviceId,
      staffId,
      serviceDuration: service.duration,
      slots
    }
  });
});

export const getBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, salonId, status, date } = req.query;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (date) {
    const normalizedDate = normalizeDate(date as string);
    if (normalizedDate) query.bookingDate = normalizedDate;
  }

  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (salonId) query.salonId = salonId;
  } else if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    query.salonId = req.user?.salonId;
  } else {
    query.customerId = req.user?._id;
  }

  const data = await Booking.find(query)
    .populate('customerId', 'name email')
    .populate('salonId', 'name location')
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name role')
    .sort({ bookingDate: -1, bookingTime: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Booking.countDocuments(query);
  res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
});

interface UpdateBookingBody {
  status: BookingStatusType;
}

export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.body as UpdateBookingBody;
  const booking = await Booking.findById(req.params.id).populate('serviceId', 'name').populate('salonId', 'name') as IBooking | null;
  if (!booking) return next(new ApiError(404, 'Booking not found'));

  const isOwnerOrStaff = req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF;
  const canManage = req.user?.role === Roles.SUPER_ADMIN ||
    (isOwnerOrStaff && String((booking.salonId as unknown as { _id?: string })?._id || booking.salonId) === String(req.user?.salonId)) ||
    (req.user?.role === Roles.CUSTOMER && String(booking.customerId) === String(req.user?._id));

  if (!canManage) return next(new ApiError(403, 'Forbidden'));

  booking.status = status;
  await booking.save();

  if (status === BookingStatus.COMPLETED) {
    await Payment.findOneAndUpdate({ bookingId: booking._id }, { status: 'paid' });
  }

  const customer = await User.findById(booking.customerId).select('name email');
  if (customer) {
    const serviceName = (booking.serviceId as unknown as { name?: string })?.name || 'service';
    const salonName = (booking.salonId as unknown as { name?: string })?.name || 'salon';
    const message = `Your booking for ${serviceName} at ${salonName} is now ${status}.`;
    await createNotification({
      title: 'Booking Status Updated',
      message,
      type: 'booking_update',
      targetRole: Roles.CUSTOMER,
      salonId: String((booking.salonId as unknown as { _id?: string })?._id || booking.salonId),
      userId: String(booking.customerId)
    });

    if (customer.email) {
      await sendEmail({
        to: customer.email,
        subject: 'Hermoso Booking Status Updated',
        html: `<p>Hi ${customer.name},</p><p>${message}</p>`
      });
    }
  }

  res.json({ success: true, data: booking });
});
