import { Response, NextFunction } from 'express';
import { Service } from '../models/Service.js';
import { Category } from '../models/Category.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  getServicesSchema,
  deleteServiceSchema
} from '../schemas/service.schema.js';

const resolveSalonId = (req: AuthRequest): string | undefined => {
  if (req.user?.role === Roles.SUPER_ADMIN && req.body.salonId) return req.body.salonId;
  return req.user?.salonId ? String(req.user.salonId) : undefined;
};

export const createService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const salonId = resolveSalonId(req);
    if (!salonId) return next(new ApiError(400, 'salonId is required'));

    const category = await Category.findOne({ _id: req.body.categoryId, active: true });
    if (!category) return next(new ApiError(400, 'Valid category is required'));

    const service = await Service.create({
      ...req.body,
      salonId,
      categoryId: category._id,
      category: category.name
    });
    res.status(201).json({ success: true, data: service });
  },
  { body: createServiceSchema.shape.body }
);

export const getServices = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, search = '', category, categoryId, salonId } = req.query;
    const query: Record<string, any> = { active: true };

    if (req.user?.role === Roles.SUPER_ADMIN) {
      if (salonId) query.salonId = salonId;
    } else if (req.user?.role === Roles.CUSTOMER) {
      if (salonId) query.salonId = salonId;
    } else {
      query.salonId = req.user?.salonId;
    }

    if (category) query.category = new RegExp(category as string, 'i');
    if (categoryId) query.categoryId = categoryId;
    if (search) query.name = new RegExp(search as string, 'i');

    const data = await Service.find(query)
      .populate('categoryId', 'name')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Service.countDocuments(query);
    res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
  },
  { query: getServicesSchema.shape.query }
);

export const updateService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new ApiError(404, 'Service not found'));

    if (req.user?.role !== Roles.SUPER_ADMIN && String(service.salonId) !== String(req.user?.salonId)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    if (req.body.categoryId) {
      const category = await Category.findOne({
        _id: req.body.categoryId,
        active: true
      });
      if (!category) return next(new ApiError(400, 'Valid category is required'));
      service.categoryId = category._id as any;
      service.category = category.name;
    }

    Object.assign(service, { ...req.body, category: service.category, categoryId: service.categoryId });
    await service.save();

    await service.populate('categoryId', 'name');
    res.json({ success: true, data: service });
  },
  { body: updateServiceSchema.shape.body, params: updateServiceSchema.shape.params }
);

export const deleteService = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new ApiError(404, 'Service not found'));

    if (req.user?.role !== Roles.SUPER_ADMIN && String(service.salonId) !== String(req.user?.salonId)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted' });
  },
  { params: deleteServiceSchema.shape.params }
);
