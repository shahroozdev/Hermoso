import { Response, NextFunction } from "express";
import { Salon } from "../models/Salon.js";
import { User } from "../models/User.js";
import {
  Roles,
  SalonStatus,
} from "../utils/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { Service } from "../models/Service.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../config/cloudinary.js";

const isSuperAdminLike = (role?: string) =>
  role === Roles.SUPER_ADMIN || role === "admin";

const parseMultipartFields = (body: Record<string, unknown>): Record<string, unknown> => {
  const parsed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      try {
        parsed[key] = JSON.parse(value);
      } catch {
        parsed[key] = value;
      }
    } else {
      parsed[key] = value;
    }
  }
  return parsed;
};

export const createSalon = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const fields = parseMultipartFields(req.body);
    const { ownerId } = fields;
    const isAdmin = isSuperAdminLike(req.user?.role as string | undefined);

    const finalOwnerId = isAdmin && ownerId ? ownerId : req.user?._id;
    if (!finalOwnerId) {
      throw new ApiError(400, "Owner is required");
    }

    const owner = await User.findById(finalOwnerId);
    if (!owner) {
      throw new ApiError(404, "Owner not found");
    }

    const existingSalon = await Salon.exists({ ownerId: finalOwnerId });
    if (existingSalon) {
      throw new ApiError(400, "This owner already has a salon");
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const { ownerId: _ownerId, ...rest } = fields;
    void _ownerId;
    const salonData = { ...rest, ownerId: finalOwnerId, imageUrl: imageUrl || rest.imageUrl };

    const salon = await Salon.create(salonData);

    owner.salonId = salon._id;
    owner.role = Roles.SALON_OWNER;
    await owner.save();

    res.status(201).json({ success: true, data: salon });
  },
);

const numericRange = (min: unknown, max: unknown): Record<string, number> | undefined => {
  const range: Record<string, number> = {};
  if (min !== undefined && min !== "") range.$gte = Number(min);
  if (max !== undefined && max !== "") range.$lte = Number(max);
  return Object.keys(range).length ? range : undefined;
};

export const getSalons = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      city,
      ownerId,
      commissionMin,
      commissionMax,
      servicesMin,
      servicesMax,
      bookingsMin,
      bookingsMax,
      revenueMin,
      revenueMax,
    } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (city) query["location.city"] = new RegExp(city as string, "i");
    if (search) query.name = new RegExp(search as string, "i");
    if (ownerId) query.ownerId = new mongoose.Types.ObjectId(ownerId as string);

    const commissionRange = numericRange(commissionMin, commissionMax);
    if (commissionRange) query.commissionRate = commissionRange;

    if (req.user?.role === Roles.SALON_OWNER) {
      query.ownerId = req.user._id;
    }

    if (req.user?.role === Roles.CUSTOMER) {
      query.status = SalonStatus.APPROVED;
      query.verified = true;
    }

    // servicesCount/bookingsCount/revenue only exist after the lookups below, so
    // filtering on them (and paginating correctly afterward) needs a second $match
    // post-lookup, with a $facet to get the total alongside the paginated page.
    const computedMatch: Record<string, unknown> = {};
    const servicesRange = numericRange(servicesMin, servicesMax);
    if (servicesRange) computedMatch.servicesCount = servicesRange;
    const bookingsRange = numericRange(bookingsMin, bookingsMax);
    if (bookingsRange) computedMatch.bookingsCount = bookingsRange;
    const revenueRange = numericRange(revenueMin, revenueMax);
    if (revenueRange) computedMatch.revenue = revenueRange;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: query },
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
        $lookup: {
          from: "users",
          localField: "approvedBy",
          foreignField: "_id",
          as: "approvedByUser",
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] },
          approvedByUser: { $arrayElemAt: ["$approvedByUser", 0] },
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
    ];

    if (Object.keys(computedMatch).length) {
      pipeline.push({ $match: computedMatch });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
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
                imageUrl: 1,
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
                approvedBy: {
                  _id: "$approvedByUser._id",
                  name: "$approvedByUser.name",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    );

    const [result] = await Salon.aggregate(pipeline);
    const salons = result?.data || [];
    const total = result?.totalCount?.[0]?.count || 0;

    res.json({
      success: true,
      data: salons,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  },
);

export const getSalonById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const match: Record<string, unknown> = { _id: new mongoose.Types.ObjectId(req.params.id) };

    if (req.user?.role === Roles.CUSTOMER) {
      match.status = SalonStatus.APPROVED;
      match.verified = true;
    }

    if (req.user?.role === Roles.SALON_OWNER) {
      match.ownerId = new mongoose.Types.ObjectId(req.user._id);
    }

    const salon = await Salon.aggregate([
      // 1. Match salon (scoped by role: customers only see approved+verified
      // salons, owners only see their own — see match above)
      { $match: match },

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
    if (salon.length === 0) return next(new ApiError(404, "Salon not found"));
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

    const fields = parseMultipartFields(req.body);

    if (req.file) {
      fields.imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const newOwnerId = fields.ownerId as string | undefined;
    const isOwnerChanging = !!newOwnerId && String(newOwnerId) !== String(salon.ownerId);

    if (isOwnerChanging) {
      const newOwner = await User.findById(newOwnerId);
      if (!newOwner) {
        throw new ApiError(404, "Owner not found");
      }

      const ownerHasOtherSalon = await Salon.exists({
        ownerId: newOwnerId,
        _id: { $ne: salon._id },
      });
      if (ownerHasOtherSalon) {
        throw new ApiError(400, "This owner already has a salon");
      }

      const previousOwner = await User.findById(salon.ownerId);
      if (previousOwner && String(previousOwner.salonId) === String(salon._id)) {
        previousOwner.salonId = null;
        await previousOwner.save();
      }

      newOwner.salonId = salon._id;
      newOwner.role = Roles.SALON_OWNER;
      await newOwner.save();
    }

    Object.assign(salon, fields);
    await salon.save();
    res.json({ success: true, data: salon });
  },
);

export const approveOrSuspendSalon = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, commissionRate } = req.body;
      if (
        ![SalonStatus.APPROVED, SalonStatus.SUSPENDED].includes(status)
      ) {
        return next(new ApiError(400, "Invalid status update"));
      }

      const update: Record<string, unknown> = {
        status,
        verified: status === SalonStatus.APPROVED,
      };
      if (commissionRate !== undefined) update.commissionRate = commissionRate;
      if (status === SalonStatus.APPROVED) update.approvedBy = req.user?._id;

      const salon = await Salon.findByIdAndUpdate(req.params.id, update, {
        new: true,
      }).populate('approvedBy', 'name');
      if (!salon) return next(new ApiError(404, "Salon not found"));

      res.json({ success: true, data: salon });
    } catch (error) {
      next(error);
    }
  },
);

export const getSalonStatusStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const match: Record<string, unknown> = {};

    if (req.user?.role === Roles.SALON_OWNER) {
      match.ownerId = req.user._id;
    }

    const stats = await Salon.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    const result: Record<string, number> = {};
    for (const s of [SalonStatus.PENDING, SalonStatus.APPROVED, SalonStatus.SUSPENDED]) {
      result[s] = 0;
    }
    for (const stat of stats) {
      result[stat.status] = stat.count;
    }

    res.json({ success: true, data: result });
  },
);

export const getSalonCities = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const match: Record<string, unknown> = {
      "location.city": { $exists: true, $ne: "" },
    };

    if (req.user?.role === Roles.CUSTOMER) {
      match.status = SalonStatus.APPROVED;
      match.verified = true;
    }

    const cities = await Salon.distinct("location.city", match);

    res.json({ success: true, data: cities });
  },
);

export const getSalonRevenue = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

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
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "salonId",
          as: "bookings",
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          commissionRate: 1,
          bookingsCount: { $size: "$bookings" },
          grossRevenue: { $sum: "$payments.amount" },
          platformRevenue: { $sum: "$payments.platformCommission" },
          salonNetRevenue: { $sum: "$payments.salonAmount" },
        },
      },
      { $sort: { grossRevenue: -1 } as const },
      { $skip: skip },
      { $limit: limitNum },
    ] as mongoose.PipelineStage[]);

    const countResult = await Salon.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "salonId",
          as: "payments",
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
        $project: {
          name: 1,
          status: 1,
          commissionRate: 1,
          bookingsCount: { $size: "$bookings" },
          grossRevenue: { $sum: "$payments.amount" },
          platformRevenue: { $sum: "$payments.platformCommission" },
          salonNetRevenue: { $sum: "$payments.salonAmount" },
        },
      },
      { $sort: { grossRevenue: -1 } as const },
      { $count: "total" },
    ] as mongoose.PipelineStage[]);

    const total = (countResult[0] as { total?: number } | undefined)?.total || 0;

    res.json({
      success: true,
      data: salons,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  },
);


export const getRevenueStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const [revenueAgg] = await Salon.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "salonId",
          as: "payments",
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
        $group: {
          _id: null,
          totalGMV: { $sum: { $sum: "$payments.amount" } },
          platformCommission: { $sum: { $sum: "$payments.platformCommission" } },
          totalBookings: { $sum: { $size: "$bookings" } },
        },
      },
    ] as mongoose.PipelineStage[]);

    const [payoutAgg] = await mongoose.model("Payment").aggregate([
      { $match: { status: "pending" } },
      {
        $group: {
          _id: null,
          pendingPayouts: { $sum: 1 },
          pendingPayoutAmount: { $sum: "$salonAmount" },
        },
      },
    ] as mongoose.PipelineStage[]);

    res.json({
      success: true,
      data: {
        totalGMV: revenueAgg?.totalGMV || 0,
        platformCommission: revenueAgg?.platformCommission || 0,
        totalBookings: revenueAgg?.totalBookings || 0,
        pendingPayouts: payoutAgg?.pendingPayouts || 0,
        pendingPayoutAmount: payoutAgg?.pendingPayoutAmount || 0,
        avgBookingValue: revenueAgg?.totalBookings
          ? Math.round((revenueAgg?.totalGMV || 0) / revenueAgg.totalBookings)
          : 0,
      },
    });
  },
);

