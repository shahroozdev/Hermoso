import { literalRegex } from '../utils/literalRegex.js';
import { dateRange } from '../utils/dateRange.js';
import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { numericRange } from '../utils/numericRange.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query: Record<string, unknown> = { role: Roles.CUSTOMER };

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

  if (req.query.name) query.name = literalRegex(req.query.name);
  if (req.query.email) query.email = literalRegex(req.query.email);
  if (req.query.status) query.status = req.query.status;
  const joinedRange = dateRange(req.query.fromDate, req.query.toDate);
  if (joinedRange) query.createdAt = joinedRange;
  const customers = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(query);
  res.json({ success: true, data: customers, meta: { page: Number(page), limit: Number(limit), total } });
});

export const getCustomersOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    bookingsMin,
    bookingsMax,
    spentMin,
    spentMax,
    fromDate,
    toDate,
  } = req.query;
  const query: Record<string, unknown> = { role: Roles.CUSTOMER };

  if (search) {
    query.$or = [
      { name: new RegExp(search as string, 'i') },
      { email: new RegExp(search as string, 'i') },
    ];
  }

  if (status) query.status = status;

  const createdRange = dateRange(fromDate, toDate);
  if (createdRange) query.createdAt = createdRange;

  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    const customerIds = await Booking.distinct('customerId', { salonId: req.user.salonId });
    query._id = { $in: customerIds };
  }

  // bookingsCount/totalSpentInPaisa only exist after the lookup below, so filtering
  // on them (and paginating correctly afterward) needs a second $match post-lookup,
  // with a $facet to get the total alongside the paginated page.
  const computedMatch: Record<string, unknown> = {};
  const bookingsRange = numericRange(bookingsMin, bookingsMax, req.query.bookingsOp);
  if (bookingsRange) computedMatch.bookingsCount = bookingsRange;
  const spentRange = numericRange(spentMin, spentMax, req.query.spentOp);
  if (spentRange) computedMatch.totalSpentInPaisa = spentRange;

  const pipeline: mongoose.PipelineStage[] = [
    { $match: query },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customerId',
        as: 'bookings',
      },
    },
    {
      $addFields: {
        bookingsCount: { $size: '$bookings' },
        totalSpentInPaisa: { $ifNull: [{ $sum: '$bookings.priceInPaisa' }, 0] },
        eventCount: {
          $size: {
            $filter: {
              input: {
                $map: {
                  input: '$bookings',
                  as: 'b',
                  in: { $ifNull: ['$$b.serviceId', null] },
                },
              },
              as: 's',
              cond: { $ne: ['$$s', null] },
            },
          },
        },
      },
    },
  ];

  if (Object.keys(computedMatch).length) {
    pipeline.push({ $match: computedMatch });
  }

  pipeline.push(
    { $project: { password: 0, bookings: 0 } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  );

  const [result] = await User.aggregate(pipeline);
  const customers = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  const stats = await User.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customerId',
        as: 'bookings',
      },
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        returningCustomers: { $sum: { $cond: [{ $gte: [{ $size: '$bookings' }, 2] }, 1, 0] } },
        flaggedAccounts: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        totalRevenueInPaisa: { $sum: { $ifNull: [{ $sum: '$bookings.priceInPaisa' }, 0] } },
      },
    },
  ]);

  const defaultStats = { totalCustomers: 0, returningCustomers: 0, flaggedAccounts: 0, totalRevenueInPaisa: 0 };
  const summary = stats[0] || defaultStats;

  res.json({
    success: true,
    data: customers,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      ...summary,
    },
  });
});

export const getCustomerActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await User.findById(req.params.id).select('-password');
  const bookingQuery: Record<string, unknown> = { customerId: req.params.id };

  if (req.user?.role === Roles.SALON_OWNER || req.user?.role === Roles.STAFF) {
    bookingQuery.salonId = req.user.salonId;
  }

  const bookings = await Booking.find(bookingQuery)
    .populate('salonId', 'name')
    .populate('serviceId', 'name priceInPaisa')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { customer, bookings } });
});
