import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const scopedSalonId = (req: AuthRequest): string | undefined => {
  if (req.user?.role === Roles.SUPER_ADMIN && req.body.salonId) return req.body.salonId;
  return req.user?.salonId ? String(req.user.salonId) : undefined;
};

const isAuthorized = (req: AuthRequest, staffSalonId: any): boolean => {
  return req.user?.role === Roles.SUPER_ADMIN || String(staffSalonId) === String(req.user?.salonId);
};

// ─── POST /staff ─────────────────────────────────────────────────────────────
export const createStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const salonId = scopedSalonId(req);
  if (!salonId) return next(new ApiError(400, 'salonId is required'));

  const {
    name,
    email,
    password=123456,
    phone,
    bankAccount,
    location,
    staffDetails,
  } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return next(new ApiError(409, 'Email already in use'));

  const staff = await User.create({
    name,
    email,
    password,
    phone,
    bankAccount,
    location,
    salonId,
    role: Roles.STAFF,
    staffDetails,
    isVerified: true, // Staff accounts are verified by default
  });

  // Remove password from response
  const result = staff.toObject() as Record<string, any>;
  delete result.password;

  res.status(201).json({ success: true, data: result });
});

// ─── GET /staff ───────────────────────────────────────────────────────────────
export const getStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '', salonId, designation } = req.query;

  const query: Record<string, any> = { role: Roles.STAFF };

  if (req.user?.role === Roles.SUPER_ADMIN) {
    if (salonId) query.salonId = salonId;
  } else if (req.user?.role === Roles.CUSTOMER) {
    if (salonId) query.salonId = salonId;
    query.status = 'active';
  } else {
    query.salonId = req.user?.salonId;
  }

  if (search) query.name = new RegExp(search as string, 'i');
  if (designation) query['staffDetails.designation'] = new RegExp(designation as string, 'i');

  const [data, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('staffDetails.services', 'name price duration')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── GET /staff/:id ───────────────────────────────────────────────────────────
export const getStaffById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await User.findOne({ _id: req.params.id, role: Roles.STAFF })
    .select('-password')
    .populate('staffDetails.services', 'name price duration');

  if (!staff) return next(new ApiError(404, 'Staff not found'));
  if (!isAuthorized(req, staff.salonId)) return next(new ApiError(403, 'Forbidden'));

  res.json({ success: true, data: staff });
});

// ─── PUT /staff/:id ───────────────────────────────────────────────────────────
export const updateStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await User.findOne({ _id: req.params.id, role: Roles.STAFF });
  if (!staff) return next(new ApiError(404, 'Staff not found'));
  if (!isAuthorized(req, staff.salonId)) return next(new ApiError(403, 'Forbidden'));

  // Strip fields that must never be updated this way
  const { role, salonId, password, ...safeBody } = req.body;

  // Deep merge staffDetails instead of overwriting
  if (safeBody.staffDetails) {
    safeBody.staffDetails = {
      ...(staff.staffDetails as Record<string, any>) ?? staff.staffDetails,
      ...safeBody.staffDetails,
    };
  }

  Object.assign(staff, safeBody);
  await staff.save();

  const result = staff.toObject() as Record<string, any>;
  delete result.password;

  res.json({ success: true, data: result });
});

// ─── PATCH /staff/:id/services ────────────────────────────────────────────────
export const assignServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await User.findOne({ _id: req.params.id, role: Roles.STAFF });
  if (!staff) return next(new ApiError(404, 'Staff not found'));
  if (!isAuthorized(req, staff.salonId)) return next(new ApiError(403, 'Forbidden'));

  const { services } = req.body;
  if (!Array.isArray(services)) return next(new ApiError(400, 'services must be an array'));

  staff.staffDetails!.services = services;
  await staff.save();

  res.json({ success: true, data: staff.staffDetails?.services });
});

// ─── PATCH /staff/:id/status ──────────────────────────────────────────────────
export const toggleStaffStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await User.findOne({ _id: req.params.id, role: Roles.STAFF });
  if (!staff) return next(new ApiError(404, 'Staff not found'));
  if (!isAuthorized(req, staff.salonId)) return next(new ApiError(403, 'Forbidden'));

  staff.status = staff.status === 'active' ? 'inactive' : 'active';
  await staff.save();

  res.json({ success: true, data: { status: staff.status } });
});

// ─── DELETE /staff/:id ────────────────────────────────────────────────────────
export const deleteStaff = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const staff = await User.findOne({ _id: req.params.id, role: Roles.STAFF });
  if (!staff) return next(new ApiError(404, 'Staff not found'));
  if (!isAuthorized(req, staff.salonId)) return next(new ApiError(403, 'Forbidden'));

  await staff.deleteOne();
  res.json({ success: true, message: 'Staff deleted successfully' });
});