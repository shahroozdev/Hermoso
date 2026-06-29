import { Response, NextFunction } from 'express';
import { POS } from '../models/POS.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { createPOSSchema, getPOSSchema } from '../schemas/pos.schema.js';

export const createPOS = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const salonId = req.user?.salonId ? String(req.user.salonId) : undefined;
    if (!salonId && req.user?.role !== Roles.SUPER_ADMIN) {
      return next(new ApiError(400, 'salonId is required'));
    }

    const { customerId, customerName, items, subtotal, itemDiscount, gstPercent, gstAmount, globalDiscountPercent, globalDiscountAmount, grandTotal, receiptRef } = req.body;

    const pos = await POS.create({
      salonId: salonId || req.body.salonId,
      customerId: customerId || undefined,
      customerName: customerName || 'Walk-in',
      items,
      subtotal,
      itemDiscount,
      gstPercent,
      gstAmount,
      globalDiscountPercent,
      globalDiscountAmount,
      grandTotal,
      receiptRef,
    });

    await pos.populate('customerId', 'name email phone');

    res.status(201).json({ success: true, data: pos });
  },
  { body: createPOSSchema.shape.body }
);

export const listPOS = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = {};

    if (req.user?.role === Roles.SUPER_ADMIN) {
      // admin can optionally filter by salonId
      if (req.query.salonId) query.salonId = req.query.salonId;
    } else {
      query.salonId = req.user?.salonId;
    }

    const data = await POS.find(query)
      .populate('customerId', 'name email phone')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await POS.countDocuments(query);
    res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
  },
  { query: getPOSSchema.shape.query }
);

export const getPOSById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pos = await POS.findById(req.params.id)
      .populate('customerId', 'name email phone');

    if (!pos) return next(new ApiError(404, 'POS transaction not found'));

    if (req.user?.role !== Roles.SUPER_ADMIN && String(pos.salonId) !== String(req.user?.salonId)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    res.json({ success: true, data: pos });
  }
);
