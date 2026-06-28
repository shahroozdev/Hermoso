import { NextFunction, Response } from 'express';
import { SkinScan } from '../models/SkinScan.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { Salon } from '../models/Salon.js';
import { SalonStatus } from '../utils/constants.js';
import { analyzeFaceWithOpenRouter } from '../services/openrouter.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const metricOrder = ['hydration', 'sunDamage', 'skinClarity', 'pigmentation', 'skinBarrier'] as const;

export const analyzeScanImage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const file = (req as any).file as any;
  if (!file?.buffer || !file?.mimetype) {
    return next(new ApiError(400, 'Image file is required as multipart field "image"'));
  }

  const analysis = await analyzeFaceWithOpenRouter(file.buffer, file.mimetype);

  const safeGuidance = (analysis.faceGuidance || []).slice(0, 5).filter(Boolean);
  if (!analysis.faceValid) {
    const rejected = await SkinScan.create({
      customerId: req.user?._id,
      imageMimeType: file.mimetype,
      faceValid: false,
      faceGuidance: safeGuidance.length ? safeGuidance : ['Move face to center and ensure clear front lighting.'],
      metrics: [],
      summary: '',
      recommendationNotes: [],
      recommendedServiceIds: []
    });

    return res.status(422).json({
      success: false,
      message: 'Image failed face quality check',
      data: {
        scanId: rejected._id,
        faceValid: false,
        faceGuidance: rejected.faceGuidance
      }
    });
  }

  const user = await User.findById(req.user?._id).select('salonId');
  const salonId = user?.salonId ? String(user.salonId) : undefined;
  const serviceQuery: Record<string, any> = { active: true };
  if (salonId) serviceQuery.salonId = salonId;
  const services = await Service.find(serviceQuery).select('name price duration');

  const recommendations = (analysis.recommendations || []).map((v) => String(v || '').trim()).filter(Boolean);
  const recommendedServices = services.filter((s) =>
    recommendations.some((name) => s.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.name.toLowerCase()))
  );

  const normalizedMetrics = metricOrder.map((key) => {
    const source = (analysis.metrics || []).find((m) => m.key === key);
    return {
      key,
      score: Math.max(0, Math.min(100, Math.round(Number(source?.score || 0)))),
      label: source?.label || ''
    };
  });

  const scan = await SkinScan.create({
    customerId: req.user?._id,
    imageMimeType: file.mimetype,
    faceValid: true,
    faceGuidance: safeGuidance,
    metrics: normalizedMetrics,
    summary: analysis.summary || '',
    recommendationNotes: recommendations,
    recommendedServiceIds: recommendedServices.map((s) => s._id)
  });

  res.json({
    success: true,
    data: {
      scanId: scan._id,
      faceValid: true,
      faceGuidance: scan.faceGuidance,
      summary: scan.summary,
      metrics: scan.metrics,
      recommendedServices: recommendedServices.map((s) => ({
        _id: s._id,
        name: s.name,
        price: s.price,
        duration: s.duration
      }))
    }
  });
});

export const getMyScanHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await SkinScan.find({ customerId: req.user?._id, faceValid: true })
    .populate('recommendedServiceIds', 'name price duration')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: history });
});

export const getLatestScan = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const latest = await SkinScan.findOne({ customerId: req.user?._id, faceValid: true })
    .populate('recommendedServiceIds', 'name price duration')
    .sort({ createdAt: -1 });
  if (!latest) return next(new ApiError(404, 'No successful scan found'));
  res.json({ success: true, data: latest });
});

export const getScanImprovements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const scans = await SkinScan.find({ customerId: req.user?._id, faceValid: true })
    .sort({ createdAt: 1 })
    .limit(50);

  if (scans.length < 2) {
    return res.json({
      success: true,
      data: {
        scansCount: scans.length,
        improvements: []
      }
    });
  }

  const first:any = scans[0];
  const latest:any = scans[scans.length - 1];
  const firstMap = new Map(first.metrics.map((m) => [m.key, m.score]));
  const latestMap = new Map(latest.metrics.map((m) => [m.key, m.score]));

  const improvements = Array.from(latestMap.keys()).map((key) => {
    const before = Number(firstMap.get(key) || 0);
    const after = Number(latestMap.get(key) || 0);
    const delta = after - before;
    return {
      key,
      before,
      after,
      delta,
      positive: delta >= 0
    };
  });

  res.json({
    success: true,
    data: {
      scansCount: scans.length,
      firstScanAt: first.createdAt,
      latestScanAt: latest.createdAt,
      improvements
    }
  });
});

export const getScanMatches = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const latest = await SkinScan.findOne({ customerId: req.user?._id, faceValid: true }).sort({ createdAt: -1 });
  if (!latest) return next(new ApiError(404, 'No successful scan found'));

  const allServices = await Service.find({ active: true }).select('_id name salonId');
  const salons = await Salon.find({ status: SalonStatus.APPROVED, verified: true }).select('_id name location');
  const recommendationTerms = latest.recommendationNotes.map((r) => r.toLowerCase());

  const servicesBySalon = new Map<string, Array<{ id: string; name: string }>>();
  allServices.forEach((service) => {
    const key = String(service.salonId);
    const list = servicesBySalon.get(key) || [];
    list.push({ id: String(service._id), name: service.name });
    servicesBySalon.set(key, list);
  });

  const matches = salons.map((salon) => {
    const salonServices = servicesBySalon.get(String(salon._id)) || [];
    const matchedServices = salonServices.filter((service) =>
      recommendationTerms.some((term) => service.name.toLowerCase().includes(term) || term.includes(service.name.toLowerCase()))
    );

    const scoreBase = recommendationTerms.length || 1;
    const score = Math.max(20, Math.min(100, Math.round((matchedServices.length / scoreBase) * 100)));
    return {
      salonId: salon._id,
      name: salon.name,
      city: salon.location?.city || '',
      matchPercent: score,
      matchedServices: matchedServices.map((s) => s.name)
    };
  }).sort((a, b) => b.matchPercent - a.matchPercent);

  res.json({
    success: true,
    data: {
      scanId: latest._id,
      recommendations: latest.recommendationNotes,
      matches
    }
  });
});
