import { Response, NextFunction } from "express";
import { Salon, type ISalon } from "../models/Salon.js";
import { User } from "../models/User.js";
import {
  Roles,
  SalonStatus,
  type SalonStatusType,
} from "../utils/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { Service } from "../models/Service.js";
import mongoose from "mongoose";

const isSuperAdminLike = (role?: string) =>
  role === Roles.SUPER_ADMIN || role === "admin";

export const createSalon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { ownerId } = req.body;
    const isAdmin = isSuperAdminLike(req.user?.role as string | undefined);

    const finalOwnerId = isAdmin && ownerId ? ownerId : req.user?._id;
    if (!finalOwnerId) {
      throw new ApiError(400, "Owner is required");
    }

    const salonData = { ...req.body };
    delete (salonData as any).ownerId;
    (salonData as any).ownerId = finalOwnerId;

    const salon = await Salon.create(salonData);

    const owner = await User.findById(finalOwnerId);
    if (!owner) {
      await salon.deleteOne();
      throw new ApiError(404, "Owner not found");
    }

    if (!owner.salonId) {
      owner.salonId = salon._id as any;
    }
    owner.role = Roles.SALON_OWNER;
    await owner.save();

    res.status(201).json({ success: true, data: salon });
  },
);

export const getSalons = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, search = "", status, city } = req.query;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (city) query["location.city"] = new RegExp(city as string, "i");
    if (search) query.name = new RegExp(search as string, "i");

    if (req.user?.role === Roles.SALON_OWNER) {
      query.ownerId = req.user._id;
    }

    if (req.user?.role === Roles.CUSTOMER) {
      query.status = SalonStatus.APPROVED;
      query.verified = true;
    }

    const salons = await Salon.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "salonId",
          as: "services",
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "salonId",
          as: "bookings",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "salonId",
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "salonId",
          as: "payments",
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] },
          servicesCount: { $size: "$services" },
          bookingsCount: { $size: "$bookings" },
          reviewsCount: { $size: "$reviews" },
          revenue: { $sum: "$payments.amount" },
          active: { $eq: ["$status", "approved"] },
        },
      },
      {
        $addFields: {
          avgRating: {
            $round: [
              {
                $cond: [
                  { $gt: ["$reviewsCount", 0] },
                  { $divide: [{ $sum: "$reviews.rating" }, "$reviewsCount"] },
                  0,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          verified: 1,
          commissionRate: 1,
          location: 1,
          phone: 1,
          address: 1,
          description: 1,
          workingHours: 1,
          createdAt: 1,
          servicesCount: 1,
          bookingsCount: 1,
          reviewsCount: 1,
          avgRating: 1,
          revenue: 1,
          active: 1,
          owner: {
            _id: "$owner._id",
            name: "$owner.name",
            email: "$owner.email",
          },
        },
      },
    ]);

    const total = await Salon.countDocuments(query);
    res.json({
      success: true,
      data: salons,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  },
);

export const getSalonById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const query: Record<string, any> = { _id: req.params.id };

    if (req.user?.role === Roles.CUSTOMER) {
      query.status = SalonStatus.APPROVED;
      query.verified = true;
    }

    if (req.user?.role === Roles.SALON_OWNER) {
      query.ownerId = req.user._id;
    }

    const salon = await Salon.aggregate([
      // 1. Match salon
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },

      // 2. Lookup reviews
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "salonId",
          as: "reviews",
        },
      },

      // 3. Add review count
      {
        $addFields: {
          reviewsCount: { $size: "$reviews" },
        },
      },

      // 4. Calculate average rating
      {
        $addFields: {
          avgRating: {
            $round: [
              {
                $cond: [
                  { $gt: ["$reviewsCount", 0] },
                  { $avg: "$reviews.rating" },
                  0,
                ],
              },
              1,
            ],
          },
        },
      },
    ]);
    if (!salon) return next(new ApiError(404, "Salon not found"));
    const services = await Service.find({ salonId: salon[0]._id });
    res.json({ success: true, data: { ...salon[0], services } });
  },
);

export const updateSalon = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const salon = await Salon.findById(req.params.id);
    if (!salon) return next(new ApiError(404, "Salon not found"));

    if (
      !isSuperAdminLike(req.user?.role as string | undefined) &&
      String(salon.ownerId) !== String(req.user?._id)
    ) {
      return next(new ApiError(403, "Forbidden"));
    }

    Object.assign(salon, req.body);
    await salon.save();
    res.json({ success: true, data: salon });
  },
);

export const approveOrSuspendSalon = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, commissionRate } = req.body;
      if (
        ![SalonStatus.APPROVED, SalonStatus.SUSPENDED].includes(status as any)
      ) {
        return next(new ApiError(400, "Invalid status update"));
      }

      const update: Record<string, any> = {
        status,
        verified: status === SalonStatus.APPROVED,
      };
      if (commissionRate !== undefined) update.commissionRate = commissionRate;

      const salon = await Salon.findByIdAndUpdate(req.params.id, update, {
        new: true,
      });
      if (!salon) return next(new ApiError(404, "Salon not found"));

      res.json({ success: true, data: salon });
    } catch (error) {
      next(error);
    }
  },
);

export const getSalonRevenue = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const salons = await Salon.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "salonId",
          as: "payments",
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          commissionRate: 1,
          grossRevenue: { $sum: "$payments.amount" },
          platformRevenue: { $sum: "$payments.platformCommission" },
          salonNetRevenue: { $sum: "$payments.salonAmount" },
        },
      },
    ]);

    res.json({ success: true, data: salons });
  },
);
