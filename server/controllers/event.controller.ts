import { Response, NextFunction } from 'express';
import { Event } from '../models/Event.js';
import { Service } from '../models/Service.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
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
    const foundServices = await Service.find({
      _id: { $in: serviceIds },
      salonId: salonId,
      active: true
    });

    if (foundServices.length !== services.length) {
      return next(new ApiError(400, 'One or more services not found or inactive'));
    }

    // Build services array with all details
    const eventServices = foundServices.map(service => ({
      serviceId: service._id,
      serviceName: service.name,
      price: service.price,
      duration: service.duration,
    }));

    // Calculate totals
    const totalPrice = eventServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = eventServices.reduce((sum, s) => sum + s.duration, 0);
    const finalPrice = totalPrice - (totalPrice * discount / 100);

    const event = await Event.create({
      salonId,
      name,
      description,
      category,
      services: eventServices,
      totalPrice,
      totalDuration,
      discount,
      finalPrice,
      images
    });

    res.status(201).json({ success: true, data: event });
  },
  { body: createEventSchema.shape.body }
);

export const getEvents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, search = '', category, salonId } = req.query;
    const query: Record<string, any> = { active: true };

    if (req.user?.role === Roles.SUPER_ADMIN) {
      if (salonId) query.salonId = salonId;
    } else if (req.user?.role === Roles.CUSTOMER) {
      if (salonId) query.salonId = salonId;
    } else {
      query.salonId = req.user?.salonId;
    }

    if (category) query.category = category;
    if (search) query.name = new RegExp(search as string, 'i');

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
      const foundServices = await Service.find({
        _id: { $in: serviceIds },
        salonId: String(event.salonId),
        active: true
      });

      if (foundServices.length !== services.length) {
        return next(new ApiError(400, 'One or more services not found or inactive'));
      }

      const eventServices = foundServices.map(service => ({
        serviceId: service._id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration
      }));

      event.services = eventServices;
      event.totalPrice = eventServices.reduce((sum, s) => sum + s.price, 0);
      event.totalDuration = eventServices.reduce((sum, s) => sum + s.duration, 0);
    }

    event.name = name || event.name;
    event.description = description || event.description;
    event.category = category || event.category;
    event.discount = discount;
    event.finalPrice = event.totalPrice - (event.totalPrice * discount / 100);
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

    const query: Record<string, any> = { active: true, category };

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
