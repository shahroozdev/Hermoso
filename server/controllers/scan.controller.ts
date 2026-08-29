import { NextFunction, Response } from 'express';
import { SkinScan } from '../models/SkinScan.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { Salon } from '../models/Salon.js';
import { SalonStatus } from '../utils/constants.js';
import { analyzeFaceComprehensive, checkOpenRouterAvailability, type EyebrowLandmarks } from '../services/openrouter.service.js';
import { generateDietPlanFromAnalysis } from '../services/diet.service.js';
import { signUploadParams } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const SCAN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // CR-32: 1 scan/day to limit AI token consumption

/**
 * Returns when the customer can next scan, or null if they're eligible now.
 * Only successful (faceValid) scans count against the cooldown, so a rejected
 * photo (bad lighting, no face, etc.) doesn't cost the user their daily scan.
 */
async function getNextScanAt(customerId: string): Promise<Date | null> {
  const lastScan = await SkinScan.findOne({ customerId, faceValid: true })
    .sort({ createdAt: -1 })
    .select('createdAt');

  if (!lastScan) return null;

  const nextAt = new Date(lastScan.createdAt.getTime() + SCAN_COOLDOWN_MS);
  return nextAt > new Date() ? nextAt : null;
}

/**
 * Returns a signed Cloudinary upload payload so the mobile client can upload the
 * scan photo directly to Cloudinary, bypassing the backend entirely for the binary
 * transfer (works around Vercel serverless functions' 4.5MB request body cap).
 */
export const getScanUploadSignature = asyncHandler(async (req: AuthRequest, res: Response) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `scans/${req.user?._id}`;
  const signature = signUploadParams({ timestamp, folder });

  res.json({
    success: true,
    data: {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder
    }
  });
});

/**
 * AI availability + daily scan eligibility, for the mobile "AI online/offline"
 * indicator and the 1-scan-per-day gate.
 */
export const getScanStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [aiAvailable, nextScanAt] = await Promise.all([
    checkOpenRouterAvailability(),
    getNextScanAt(String(req.user?._id))
  ]);

  res.json({
    success: true,
    data: {
      aiAvailable,
      canScan: !nextScanAt,
      nextScanAt
    }
  });
});

/**
 * Analyze face image with comprehensive AI skin analysis
 * CR-27: AI skin analysis via OpenRouter
 * CR-05: South Asian calibration
 * CR-29: Scan history storage with comprehensive data
 * CR-31: Diet plan generation
 * CR-32: 1 scan/day limit
 */
export const analyzeScanImage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { imageUrl, eyebrowData } = req.body as { imageUrl?: string; eyebrowData?: EyebrowLandmarks };
  if (!imageUrl) {
    return next(new ApiError(400, 'imageUrl is required'));
  }

  const nextScanAt = await getNextScanAt(String(req.user?._id));
  if (nextScanAt) {
    return res.status(429).json({
      success: false,
      message: 'Daily scan limit reached. You can scan again tomorrow.',
      data: { nextScanAt }
    });
  }

  // Perform comprehensive AI analysis with South Asian calibration
  const analysis = await analyzeFaceComprehensive(imageUrl, eyebrowData);

  // Handle rate limit / service unavailable
  if (analysis.error) {
    return next(new ApiError(503, analysis.error));
  }

  // Handle invalid face detection
  if (!analysis.faceValid) {
    const rejected = await SkinScan.create({
      customerId: req.user?._id,
      imageUrl,
      faceValid: false,
      faceGuidance: analysis.faceGuidance.slice(0, 5),
      overallSkinScore: 0,
      summary: '',
      metrics: [],
      recommendationNotes: [],
      recommendedServiceIds: [],
      treatmentPlan: [],
      southAsianCalibrated: true
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

  // Generate personalized diet plan based on analysis (CR-31)
  const dietPlan = generateDietPlanFromAnalysis({
    skinTone: analysis.skinTone,
    hydration: analysis.hydration,
    darkCircles: analysis.darkCircles,
    acne: analysis.acne,
    lipPigmentation: analysis.lipPigmentation
  });

  // Find matching services based on treatment recommendations
  const user = await User.findById(req.user?._id).select('salonId');
  const salonId = user?.salonId ? String(user.salonId) : undefined;
  const serviceQuery: Record<string, unknown> = { active: true };
  if (salonId) serviceQuery.salonId = salonId;
  const services = await Service.find(serviceQuery).select('name price duration');

  // Extract all treatment names from the analysis
  const allTreatments = [
    ...analysis.skinTone.recommendedTreatments,
    ...analysis.hydration.recommendedTreatments,
    ...analysis.darkCircles.recommendedTreatments,
    ...analysis.acne.recommendedTreatments,
    ...analysis.lipPigmentation.recommendedTreatments,
    ...analysis.treatmentPlan.map((t) => t.treatmentName)
  ];

  const uniqueTreatments = [...new Set(allTreatments.map((t) => t.toLowerCase()))];

  // Match services to recommended treatments
  const recommendedServices = services.filter((s) =>
    uniqueTreatments.some(
      (treatment) =>
        s.name.toLowerCase().includes(treatment) || treatment.includes(s.name.toLowerCase())
    )
  );

  // Create comprehensive scan record (CR-29)
  const scan = await SkinScan.create({
    customerId: req.user?._id,
    imageUrl,
    faceValid: true,
    faceGuidance: analysis.faceGuidance.slice(0, 5),
    overallSkinScore: analysis.overallSkinScore,
    summary: analysis.summary,

    // Comprehensive analysis sections
    skinTone: analysis.skinTone,
    eyebrows: eyebrowData,
    hydration: analysis.hydration,
    darkCircles: analysis.darkCircles,
    acne: analysis.acne,
    lipPigmentation: analysis.lipPigmentation,

    // Treatment and diet plans
    treatmentPlan: analysis.treatmentPlan,
    dietPlan,

    // Legacy fields for backward compatibility
    metrics: [
      {
        key: 'hydration',
        score: analysis.hydration.hydrationPercent,
        label: 'Hydration Level'
      },
      {
        key: 'skinClarity',
        score: analysis.hydration.textureRating,
        label: 'Skin Clarity & Texture'
      },
      {
        key: 'pigmentation',
        score: Math.max(0, 100 - analysis.skinTone.severity),
        label: 'Pigmentation Balance'
      },
      {
        key: 'overallHealth',
        score: analysis.overallSkinScore,
        label: 'Overall Skin Health'
      }
    ],
    recommendationNotes: uniqueTreatments,
    recommendedServiceIds: recommendedServices.map((s) => s._id),
    southAsianCalibrated: true
  });

  // Return comprehensive analysis result
  res.json({
    success: true,
    data: {
      scanId: scan._id,
      faceValid: true,
      overallSkinScore: scan.overallSkinScore,
      summary: scan.summary,

      // Detailed analysis sections
      skinTone: scan.skinTone,
      eyebrows: scan.eyebrows,
      hydration: scan.hydration,
      darkCircles: scan.darkCircles,
      acne: scan.acne,
      lipPigmentation: scan.lipPigmentation,

      // Plans
      treatmentPlan: scan.treatmentPlan,
      dietPlan: scan.dietPlan,

      // Matched services
      recommendedServices: recommendedServices.map((s) => ({
        _id: s._id,
        name: s.name,
        price: s.price,
        duration: s.duration
      })),

      // Legacy fields for backward compatibility
      metrics: scan.metrics
    }
  });
});

/**
 * Get scan history for the current user
 * CR-29: Enhanced scan history with comprehensive data
 */
export const getMyScanHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await SkinScan.find({ customerId: req.user?._id, faceValid: true })
    .populate('recommendedServiceIds', 'name price duration')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: history });
});

/**
 * Get latest scan for the current user
 */
export const getLatestScan = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const latest = await SkinScan.findOne({ customerId: req.user?._id, faceValid: true })
    .populate('recommendedServiceIds', 'name price duration')
    .sort({ createdAt: -1 });

  if (!latest) return next(new ApiError(404, 'No successful scan found'));

  res.json({ success: true, data: latest });
});

/**
 * Get skin improvements over time
 */
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

  const first = scans[0];
  const latest = scans[scans.length - 1];

  // Compare overall skin scores
  const overallImprovement = {
    key: 'overallSkinScore',
    before: first.overallSkinScore,
    after: latest.overallSkinScore,
    delta: latest.overallSkinScore - first.overallSkinScore,
    positive: latest.overallSkinScore >= first.overallSkinScore
  };

  // Compare specific metrics if available
  const firstMap = new Map(first.metrics.map((m) => [m.key, m.score]));
  const latestMap = new Map(latest.metrics.map((m) => [m.key, m.score]));

  const metricImprovements = Array.from(latestMap.keys()).map((key) => {
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
      overallImprovement,
      improvements: metricImprovements
    }
  });
});

/**
 * Get AI-matched salons based on scan results
 * CR-18: AI match score algorithm
 * CR-30: Treatment-to-salon matching API with enhanced scoring
 */
export const getScanMatches = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const latest = await SkinScan.findOne({ customerId: req.user?._id, faceValid: true })
    .sort({ createdAt: -1 });

  if (!latest) return next(new ApiError(404, 'No successful scan found'));

  // Get user location for proximity calculations (if available)
  const user = await User.findById(req.user?._id).select('location');
  const userLat = user?.location?.coordinates?.[1];
  const userLng = user?.location?.coordinates?.[0];

  // Get all active services grouped by salon
  const allServices = await Service.find({ active: true }).select('_id name salonId aiScanLink');

  // Get approved salons
  const salons = await Salon.find({ status: SalonStatus.APPROVED, verified: true })
    .select('_id name location rating averagePrice openingHours southAsianSpecialist');

  // Extract recommended treatment names from scan
  const recommendedTreatments = latest.treatmentPlan.map((t) => t.treatmentName.toLowerCase());
  const allRecommendations = [
    ...recommendedTreatments,
    ...latest.recommendationNotes.map((r) => r.toLowerCase())
  ];

  // Group services by salon
  const servicesBySalon = new Map<string, Array<{ id: string; name: string; aiScanLink?: string }>>();
  allServices.forEach((service) => {
    const key = String(service.salonId);
    const list = servicesBySalon.get(key) || [];
    list.push({
      id: String(service._id),
      name: service.name,
      aiScanLink: service.aiScanLink
    });
    servicesBySalon.set(key, list);
  });

  // Calculate match scores for each salon
  const matches = salons
    .map((salon) => {
      const salonServices = servicesBySalon.get(String(salon._id)) || [];

      // Find services that match scan recommendations
      const matchedServices = salonServices.filter((service) =>
        allRecommendations.some(
          (rec) =>
            service.name.toLowerCase().includes(rec) ||
            rec.includes(service.name.toLowerCase()) ||
            service.aiScanLink === rec
        )
      );

      // Calculate distance if user location is available
      let distance: number | null = null;
      if (userLat && userLng && salon.location?.coordinates) {
        const salonLat = salon.location.coordinates[1];
        const salonLng = salon.location.coordinates[0];
        distance = calculateDistance(userLat, userLng, salonLat, salonLng);
      }

      // Base score: percentage of recommended treatments available
      const totalRecommended = recommendedTreatments.length || 1;
      let score = Math.round((matchedServices.length / totalRecommended) * 100);

      // Proximity boost (CR-18)
      if (distance !== null) {
        if (distance <= 2) score += 5;
        else if (distance <= 5) score += 3;
      }

      // Rating boost (CR-18)
      if (salon.rating >= 4.8) score += 5;
      else if (salon.rating >= 4.5) score += 3;

      // South Asian specialist boost (CR-18, CR-25)
      if (salon.southAsianSpecialist && latest.southAsianCalibrated) {
        score += 8;
      }

      // Price match boost (simplified for now)
      // TODO: Add user budget from profile when available

      // Availability penalty (simplified - checking if salon has opening hours)
      if (!salon.openingHours || Object.keys(salon.openingHours).length === 0) {
        score -= 10;
      }

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      return {
        salonId: salon._id,
        name: salon.name,
        city: salon.location?.city || '',
        rating: salon.rating,
        matchPercent: score,
        matchedServices: matchedServices.map((s) => s.name),
        southAsianSpecialist: salon.southAsianSpecialist || false,
        distance: distance !== null ? Number(distance.toFixed(1)) : null,
        distanceUnit: 'km'
      };
    })
    .filter((match) => match.matchPercent >= 60) // Min threshold (CR-18)
    .sort((a, b) => {
      // Sort by distance first (closest first), then by match score
      if (a.distance !== null && b.distance !== null) {
        const distanceDiff = a.distance - b.distance;
        if (Math.abs(distanceDiff) > 0.5) { // If distance difference > 0.5km
          return distanceDiff;
        }
      }
      // If distances are similar or unavailable, sort by match score
      return b.matchPercent - a.matchPercent;
    })
    .slice(0, 5); // Top 5 (CR-18)

  res.json({
    success: true,
    data: {
      scanId: latest._id,
      recommendations: latest.treatmentPlan,
      matches
    }
  });
});

/**
 * Match salons based on treatment IDs or names
 * CR-30: Treatment-to-salon matching API
 * POST /api/scans/match-salons
 * Input: { treatmentIds?: string[], treatmentNames?: string[], userLocation?: { lat: number, lng: number } }
 * Output: ranked salons with match score, matched treatment tags
 */
export const matchSalons = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { treatmentIds, treatmentNames, userLocation } = req.body;

  if ((!treatmentIds || treatmentIds.length === 0) && (!treatmentNames || treatmentNames.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Either treatmentIds or treatmentNames must be provided'
    });
  }

  // Get user location for proximity calculations
  let userLat: number | undefined;
  let userLng: number | undefined;

  if (userLocation?.lat && userLocation?.lng) {
    userLat = userLocation.lat;
    userLng = userLocation.lng;
  } else {
    // Try to get from user profile
    const user = await User.findById(req.user?._id).select('location');
    userLat = user?.location?.coordinates?.[1];
    userLng = user?.location?.coordinates?.[0];
  }

  // Get all active services grouped by salon
  const allServices = await Service.find({ active: true }).select('_id name salonId aiScanLink');

  // Get approved salons
  const salons = await Salon.find({ status: SalonStatus.APPROVED, verified: true })
    .select('_id name location rating averagePrice openingHours workingHours southAsianSpecialist');

  // Build list of treatment names to match against
  const treatmentNamesToMatch: string[] = [];

  if (treatmentNames && treatmentNames.length > 0) {
    treatmentNamesToMatch.push(...treatmentNames.map((t: string) => t.toLowerCase()));
  }

  if (treatmentIds && treatmentIds.length > 0) {
    // Get treatment names from IDs
    const treatments = await Service.find({ _id: { $in: treatmentIds } }).select('name');
    treatmentNamesToMatch.push(...treatments.map((t) => t.name.toLowerCase()));
  }

  // Group services by salon
  const servicesBySalon = new Map<string, Array<{ id: string; name: string; aiScanLink?: string }>>();
  allServices.forEach((service) => {
    const key = String(service.salonId);
    const list = servicesBySalon.get(key) || [];
    list.push({
      id: String(service._id),
      name: service.name,
      aiScanLink: service.aiScanLink
    });
    servicesBySalon.set(key, list);
  });

  // Calculate match scores for each salon
  const matches = salons
    .map((salon) => {
      const salonServices = servicesBySalon.get(String(salon._id)) || [];

      // Find services that match requested treatments
      const matchedServices = salonServices.filter((service) =>
        treatmentNamesToMatch.some(
          (treatment) =>
            service.name.toLowerCase().includes(treatment) ||
            treatment.includes(service.name.toLowerCase()) ||
            service.aiScanLink === treatment
        )
      );

      // Base score: percentage of requested treatments available (CR-18)
      const totalRequested = treatmentNamesToMatch.length || 1;
      let score = Math.round((matchedServices.length / totalRequested) * 100);

      // Proximity boost (CR-18)
      if (userLat && userLng && salon.location?.coordinates) {
        const salonLat = salon.location.coordinates[1];
        const salonLng = salon.location.coordinates[0];
        const distance = calculateDistance(userLat, userLng, salonLat, salonLng);

        if (distance <= 2) score += 5;
        else if (distance <= 5) score += 3;
      }

      // Rating boost (CR-18)
      if (salon.rating >= 4.8) score += 5;
      else if (salon.rating >= 4.5) score += 3;

      // South Asian specialist boost (CR-18, CR-25)
      if (salon.southAsianSpecialist) {
        score += 8;
      }

      // Availability check - use workingHours (simplified)
      const hours = salon.workingHours || salon.openingHours;
      if (!hours || Object.keys(hours).length === 0) {
        score -= 10;
      }

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      return {
        salonId: salon._id,
        name: salon.name,
        city: salon.location?.city || '',
        rating: salon.rating,
        matchPercent: score,
        matchedServices: matchedServices.map((s) => s.name),
        southAsianSpecialist: salon.southAsianSpecialist || false,
        averagePrice: salon.averagePrice
      };
    })
    .filter((match) => match.matchPercent >= 60) // Min threshold (CR-18)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 5); // Top 5 (CR-18)

  res.json({
    success: true,
    data: {
      requestedTreatments: treatmentNamesToMatch,
      matchCount: matches.length,
      matches
    }
  });
});

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
