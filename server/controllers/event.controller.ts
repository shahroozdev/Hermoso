import { Response, NextFunction } from 'express';
import { Event } from '../models/Event.js';
import { Service } from '../models/Service.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyPercent, sumPaisa } from '../utils/money.js';
import { numericRange } from '../utils/numericRange.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
  getEventByIdSchema,
  deleteEventSchema,
  getEventsByCategorySchema
} from '../schemas/event.schema.js';

const resolveSalonId = (req: AuthRequest): string | undefined => {
  if (req.user?.role === Roles.SUPER_ADMIN && req.body.salonId) return req.body.salonId;
  return req.user?.salonId ? String(req.user.salonId) : undefined;
};

export const createEvent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const salonId = resolveSalonId(req);
    if (!salonId) return next(new ApiError(400, 'salonId is required'));

    const { name, description, category, services, discount = 0, images = [] } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return next(new ApiError(400, 'At least one service is required'));
    }

    // Validate all services exist and belong to the same salon
    const serviceIds = services.map(s => s.serviceId);
    // BUG-144: reject duplicate service selections explicitly, with a clear message —
    // otherwise duplicates silently skew totalPriceInPaisa/totalDuration, or (since
    // Mongo's $in de-dupes matches) surface as a confusing "not found" error instead.
    if (new Set(serviceIds).size !== serviceIds.length) {
      return next(new ApiError(400, 'The same service cannot be selected more than once'));
    }
    const foundServices = await Service.find({
      _id: { $in: serviceIds },
      salonId: salonId,
      active: true
    });

    if (foundServices.length !== services.length) {
      return next(new ApiError(400, 'One or more services not found or inactive'));
    }

    // Build services array with all details.
    // BUG-144: a legacy/corrupt service doc can carry an undefined or non-numeric
    // priceInPaisa/duration. Silently propagating that into sumPaisa() produces NaN,
    // which then blows up as an opaque Mongoose "Cast to Number failed for value NaN"
    // error on save. Reject it here instead with a clear, actionable 400.
    const invalidService = foundServices.find(
      (service) => !Number.isFinite(service.priceInPaisa) || !Number.isFinite(service.duration)
    );
    if (invalidService) {
      return next(new ApiError(
        400,
        `Service '${invalidService.name}' has an invalid price and cannot be added to an event — please edit it first`
      ));
    }

    const eventServices = foundServices.map(service => ({
      serviceId: service._id,
      serviceName: service.name,
      priceInPaisa: service.priceInPaisa,
      duration: service.duration,
    }));

    // Calculate totals
    const totalPriceInPaisa = sumPaisa(eventServices.map((s) => s.priceInPaisa));
    const totalDuration = eventServices.reduce((sum, s) => sum + s.duration, 0);
    const finalPriceInPaisa = totalPriceInPaisa - applyPercent(totalPriceInPaisa, discount);

    const event = await Event.create({
      salonId,
      name,
      description,
      category,
      services: eventServices,
      totalPriceInPaisa,
      totalDuration,
      discount,
      finalPriceInPaisa,
      images
    });

    res.status(201).json({ success: true, data: event });
  },
  { body: createEventSchema.shape.body }
);

export const getEvents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      category,
      salonId,
      servicesSearch,
      durationMin,
      durationMax,
      priceMin,
      priceMax,
      discountMin,
      discountMax,
      finalPriceMin,
      finalPriceMax
    } = req.query;
    const query: Record<string, unknown> = { active: true };

    if (req.user?.role === Roles.SUPER_ADMIN) {
      if (salonId) query.salonId = salonId;
    } else if (req.user?.role === Roles.CUSTOMER) {
      if (salonId) query.salonId = salonId;
    } else {
      query.salonId = req.user?.salonId;
    }

    if (category) query.category = category;
    if (search) query.name = new RegExp(search as string, 'i');
    // BUG-139: match against the included services' names
    if (servicesSearch) query['services.serviceName'] = new RegExp(servicesSearch as string, 'i');

    const durationRange = numericRange(durationMin, durationMax, req.query.durationOp);
    if (durationRange) query.totalDuration = durationRange;
    const priceRange = numericRange(priceMin, priceMax, req.query.priceOp);
    if (priceRange) query.totalPriceInPaisa = priceRange;
    const discountRange = numericRange(discountMin, discountMax, req.query.discountOp);
    if (discountRange) query.discount = discountRange;
    const finalPriceRange = numericRange(finalPriceMin, finalPriceMax, req.query.finalPriceOp);
    if (finalPriceRange) query.finalPriceInPaisa = finalPriceRange;

    const data = await Event.find(query)
      .populate('salonId', 'name')
      .populate('services.serviceId', 'name description category')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(query);
    res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
  },
  { query: getEventsSchema.shape.query }
);

export const getEventById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const event = await Event.findById(req.params.id)
      .populate('salonId', 'name')
      .populate('services.serviceId', 'name description');

    if (!event) return next(new ApiError(404, 'Event not found'));

    res.json({ success: true, data: event });
  },
  { params: getEventByIdSchema.shape.params }
);

export const updateEvent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new ApiError(404, 'Event not found'));

    if (req.user?.role !== Roles.SUPER_ADMIN && String(event.salonId) !== String(req.user?.salonId)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    const { name, description, category, services, discount = event.discount, images } = req.body;

    // If services are updated, validate them
    if (services && Array.isArray(services) && services.length > 0) {
      const serviceIds = services.map(s => s.serviceId);
      // BUG-144: same duplicate guard as createEvent.
      if (new Set(serviceIds).size !== serviceIds.length) {
        return next(new ApiError(400, 'The same service cannot be selected more than once'));
      }
      const foundServices = await Service.find({
        _id: { $in: serviceIds },
        salonId: String(event.salonId),
        active: true
      });

      if (foundServices.length !== services.length) {
        return next(new ApiError(400, 'One or more services not found or inactive'));
      }

      // BUG-144: same NaN guard as createEvent — reject invalid price/duration
      // before it corrupts totalPriceInPaisa/finalPriceInPaisa on save.
      const invalidService = foundServices.find(
        (service) => !Number.isFinite(service.priceInPaisa) || !Number.isFinite(service.duration)
      );
      if (invalidService) {
        return next(new ApiError(
          400,
          `Service '${invalidService.name}' has an invalid price and cannot be added to an event — please edit it first`
        ));
      }

      const eventServices = foundServices.map(service => ({
        serviceId: service._id,
        serviceName: service.name,
        priceInPaisa: service.priceInPaisa,
        duration: service.duration
      }));

      event.services = eventServices;
      event.totalPriceInPaisa = sumPaisa(eventServices.map((s) => s.priceInPaisa));
      event.totalDuration = eventServices.reduce((sum, s) => sum + s.duration, 0);
    }

    event.name = name || event.name;
    event.description = description || event.description;
    event.category = category || event.category;
    event.discount = discount;
    event.finalPriceInPaisa = event.totalPriceInPaisa - applyPercent(event.totalPriceInPaisa, discount);
    if (images) event.images = images;

    await event.save();

    await event.populate('salonId', 'name');
    await event.populate('services.serviceId', 'name description');
    res.json({ success: true, data: event });
  },
  { body: updateEventSchema.shape.body, params: updateEventSchema.shape.params }
);

export const deleteEvent = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new ApiError(404, 'Event not found'));

    if (req.user?.role !== Roles.SUPER_ADMIN && String(event.salonId) !== String(req.user?.salonId)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  },
  { params: deleteEventSchema.shape.params }
);

export const getEventsByCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { category, salonId, page = 1, limit = 10 } = req.query;

    if (!category) return res.status(400).json({ success: false, message: 'Category is required' });

    const query: Record<string, unknown> = { active: true, category };

    if (req.user?.role === Roles.SUPER_ADMIN) {
      if (salonId) query.salonId = salonId;
    } else if (req.user?.role === Roles.CUSTOMER) {
      if (salonId) query.salonId = salonId;
    } else {
      query.salonId = req.user?.salonId;
    }

    const data = await Event.find(query)
      .populate('salonId', 'name')
      .populate('services.serviceId', 'name description')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(query);
    res.json({ success: true, data, meta: { page: Number(page), limit: Number(limit), total } });
  },
  { params: getEventsByCategorySchema.shape.params, query: getEventsByCategorySchema.shape.query }
);
