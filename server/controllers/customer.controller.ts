import { Response } from 'express';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query: Record<string, any> = { role: Roles.CUSTOMER };

  if (search) {
    query.$or = [
      { name: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') }
    ];
  }

  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    const customerIds = await Booking.distinct('customerId', { salonId: req.user.salonId });
    query._id = { $in: customerIds };
  }

  const customers = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(query);
  res.json({ success: true, data: customers, meta: { page: Number(page), limit: Number(limit), total } });
});

export const getCustomerActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await User.findById(req.params.id).select('-password');
  const bookingQuery: Record<string, any> = { customerId: req.params.id };

  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    bookingQuery.salonId = req.user.salonId;
  }

  const bookings = await Booking.find(bookingQuery)
    .populate('salonId', 'name')
    .populate('serviceId', 'name price')
    .sort({ bookingDate: -1, createdAt: -1 });

  res.json({ success: true, data: { customer, bookings } });
});