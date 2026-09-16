import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Salon } from '../models/Salon.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/constants.js';
import { literalRegex } from '../utils/literalRegex.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

// A booking's user-facing ID is the last 4 hex chars of its Mongo _id (see
// AdminBookingsPage's bookingIdOf) — strip any "#"/"HRM-" decoration to match it.
const sanitizeBookingIdSearch = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').replace(/^HRM/i, '');

export const globalSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = 5;

  if (!q) {
    res.json({ success: true, data: { customers: [], bookings: [], salons: [] } });
    return;
  }

  const regex = literalRegex(q);
  const isSalonScoped = req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF;
  const salonId = req.user?.salonId;

  const customerQuery: Record<string, unknown> = {
    role: Roles.CUSTOMER,
    $or: [{ name: regex }, { email: regex }, { phone: regex }],
  };
  if (isSalonScoped) {
    const customerIds = await Booking.distinct('customerId', { salonId });
    customerQuery._id = { $in: customerIds };
  }

  const salonQuery: Record<string, unknown> = {
    $or: [{ name: regex }, { 'location.city': regex }],
  };
  if (isSalonScoped) salonQuery._id = salonId;

  const bookingMatch: Record<string, unknown> = {};
  if (isSalonScoped) bookingMatch.salonId = salonId;

  const bookingOr: Record<string, unknown>[] = [
    { 'customerId.name': regex },
    { 'salonId.name': regex },
  ];
  const sanitizedBookingId = sanitizeBookingIdSearch(q);
  if (sanitizedBookingId) {
    bookingOr.push({
      $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: sanitizedBookingId, options: 'i' } },
    });
  }

  const bookingPipeline: mongoose.PipelineStage[] = [
    { $match: bookingMatch },
    { $lookup: { from: 'users', localField: 'customerId', foreignField: '_id', as: 'customerId' } },
    { $unwind: { path: '$customerId', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'salons', localField: 'salonId', foreignField: '_id', as: 'salonId' } },
    { $unwind: { path: '$salonId', preserveNullAndEmptyArrays: true } },
    { $match: { $or: bookingOr } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        bookingDate: 1,
        bookingTime: 1,
        status: 1,
        customer: { _id: '$customerId._id', name: '$customerId.name' },
        salon: { _id: '$salonId._id', name: '$salonId.name' },
      },
    },
  ];

  const [customers, salons, bookings] = await Promise.all([
    User.find(customerQuery).select('name email phone').limit(limit),
    Salon.find(salonQuery).select('name location.city').limit(limit),
    Booking.aggregate(bookingPipeline),
  ]);

  res.json({ success: true, data: { customers, bookings, salons } });
});
