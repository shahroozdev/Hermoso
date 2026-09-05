import { Response, NextFunction } from 'express';
import { POS } from '../models/POS.js';
import { Service } from '../models/Service.js';
import { Event } from '../models/Event.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyPercent, sumPaisa } from '../utils/money.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { createPOSSchema, getPOSSchema } from '../schemas/pos.schema.js';

export const createPOS = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const salonId = req.user?.salonId ? String(req.user.salonId) : undefined;
    if (!salonId && req.user?.role !== Roles.SUPER_ADMIN) {
      return next(new ApiError(400, 'salonId is required'));
    }
    const resolvedSalonId = salonId || req.body.salonId;

    const { customerId, customerName, items, gstPercent, globalDiscountPercent, receiptRef } = req.body;

    // Never trust client-submitted prices/totals — look up the current catalog price
    // for each item and recompute everything server-side in integer paisa.
    const resolvedItems = await Promise.all(
      items.map(async (item: { serviceId: string; type: 'service' | 'event'; name: string; qty: number; discountInPaisa: number }) => {
        const catalogDoc = item.type === 'service'
          ? await Service.findOne({ _id: item.serviceId, salonId: resolvedSalonId }).select('priceInPaisa')
          : await Event.findOne({ _id: item.serviceId, salonId: resolvedSalonId }).select('finalPriceInPaisa');

        if (!catalogDoc) throw new ApiError(400, `Item ${item.serviceId} not found for this salon`);

        const catalogPriceInPaisa = item.type === 'service'
          ? (catalogDoc as { priceInPaisa: number }).priceInPaisa
          : (catalogDoc as { finalPriceInPaisa: number }).finalPriceInPaisa;

        const lineSubtotalInPaisa = catalogPriceInPaisa * item.qty;
        if (item.discountInPaisa > lineSubtotalInPaisa) {
          throw new ApiError(400, `Discount exceeds line total for item ${item.serviceId}`);
        }

        return {
          serviceId: item.serviceId,
          type: item.type,
          name: item.name,
          priceInPaisa: catalogPriceInPaisa,
          qty: item.qty,
          discountInPaisa: item.discountInPaisa,
          totalInPaisa: lineSubtotalInPaisa - item.discountInPaisa,
        };
      })
    );

    const subtotalInPaisa = sumPaisa(resolvedItems.map((item) => item.priceInPaisa * item.qty));
    const itemDiscountInPaisa = sumPaisa(resolvedItems.map((item) => item.discountInPaisa));
    const netAfterItemDiscountInPaisa = subtotalInPaisa - itemDiscountInPaisa;
    const gstAmountInPaisa = applyPercent(netAfterItemDiscountInPaisa, gstPercent);
    const globalDiscountAmountInPaisa = applyPercent(netAfterItemDiscountInPaisa, globalDiscountPercent);
    const grandTotalInPaisa = netAfterItemDiscountInPaisa + gstAmountInPaisa - globalDiscountAmountInPaisa;

    const pos = await POS.create({
      salonId: resolvedSalonId,
      customerId: customerId || undefined,
      customerName: customerName || 'Walk-in',
      items: resolvedItems,
      subtotalInPaisa,
      itemDiscountInPaisa,
      gstPercent,
      gstAmountInPaisa,
      globalDiscountPercent,
      globalDiscountAmountInPaisa,
      grandTotalInPaisa,
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
