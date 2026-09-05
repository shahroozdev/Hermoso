import { api } from './api';

// New comprehensive interfaces matching backend SkinScan model

export interface SkinToneResult {
  tone: string;
  evenness: number;
  tanningPattern: string;
  severity: number;
  recommendedTreatments: string[];
}

export interface EyebrowResult {
  archShape: 'flat' | 'natural' | 'over-arched' | 'uneven';
  fullness: number;
  leftRightSymmetry: number;
  tailLength: 'short' | 'medium' | 'long';
  sparseness: number;
  recommendedTreatments: string[];
}

export interface HydrationResult {
  hydrationPercent: number;
  dehydrationZones: string[];
  textureRating: number;
  poreCondition: string;
  recommendedTreatments: string[];
}

export interface DarkCirclesResult {
  type: 1 | 2 | 3;
  severity: 'mild' | 'moderate' | 'severe';
  colorDelta: number;
  recommendedTreatments: string[];
}

export interface AcneZone {
  area: 'forehead' | 'nose' | 'chin' | 'left-cheek' | 'right-cheek' | 'jawline';
  severity: number;
  type: 'active' | 'healing' | 'hormonal' | 'none';
}

export interface AcneResult {
  zones: AcneZone[];
  overallSeverity: number;
  recommendedTreatments: string[];
}

export interface LipPigmentationResult {
  melaninIndex: number;
  darknessLevel: 'light' | 'medium' | 'dark' | 'very-dark';
  unevenness: number;
  drynessLevel: number;
  recommendedTreatments: string[];
}

export interface TreatmentPlanItem {
  priority: number;
  treatmentName: string;
  reason: string;
  pkrPriceRange: string;
  estimatedDuration: string;
}

export interface DietFood {
  food: string;
  reason: string;
}

export interface DietPlanResult {
  foodsToEat: DietFood[];
  foodsToAvoid: DietFood[];
  dailyWaterIntake: string;
  specificToSkinTone: boolean;
}

export interface ScanMetric {
  key: string;
  score: number;
  label: string;
}

export interface ScanRecommendation {
  _id: string;
  name: string;
  priceInPaisa: number;
  duration: number;
}

export interface ScanResult {
  scanId: string;
  faceValid: boolean;
  faceGuidance: string[];
  overallSkinScore: number;
  summary: string;
  skinTone: SkinToneResult;
  eyebrows: EyebrowResult | null;
  hydration: HydrationResult;
  darkCircles: DarkCirclesResult;
  acne: AcneResult;
  lipPigmentation: LipPigmentationResult;
  treatmentPlan: TreatmentPlanItem[];
  dietPlan: DietPlanResult;
  recommendedServices: ScanRecommendation[];
  metrics: ScanMetric[];
}

export interface ScanHistoryItem {
  _id: string;
  customerId: string;
  imageMimeType: string;
  faceValid: boolean;
  faceGuidance: string[];
  overallSkinScore: number;
  summary: string;
  skinTone?: SkinToneResult;
  eyebrows?: EyebrowResult;
  hydration?: HydrationResult;
  darkCircles?: DarkCirclesResult;
  acne?: AcneResult;
  lipPigmentation?: LipPigmentationResult;
  treatmentPlan: TreatmentPlanItem[];
  dietPlan?: DietPlanResult;
  metrics: ScanMetric[];
  recommendationNotes: string[];
  recommendedServiceIds: ScanRecommendation[];
  createdAt: string;
  updatedAt: string;
}

export interface ScanImprovement {
  key: string;
  before: number;
  after: number;
  delta: number;
  positive: boolean;
}

export interface ScanImprovementsData {
  scansCount: number;
  firstScanAt?: string;
  latestScanAt?: string;
  overallImprovement?: ScanImprovement;
  improvements: ScanImprovement[];
  recentScores?: number[];
}

export interface SalonMatch {
  salonId: string;
  name: string;
  city: string;
  rating: number;
  matchPercent: number;
  matchedServices: string[];
  southAsianSpecialist: boolean;
}

export const scanService = {
  analyze: async (imageFile: File) => {
    const fd = new FormData();
    fd.append('image', imageFile);
    const { data } = await api.post('/scans/analyze', fd);
    return data;
  },

  getLatest: async () => {
    const { data } = await api.get('/scans/latest');
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get('/scans/history');
    return data;
  },

  getImprovements: async () => {
    const { data } = await api.get('/scans/improvements');
    return data;
  },

  getMatches: async () => {
    const { data } = await api.get('/scans/matches');
    return data;
  },
};
