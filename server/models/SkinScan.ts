import mongoose, { Document, Schema } from 'mongoose';

// Skin Tone & Tanning Analysis
export interface ISkinTone {
  tone: string; // e.g., "medium-warm", "light-cool", "dark-neutral"
  evenness: number; // 0-100
  tanningPattern: string; // e.g., "uneven distribution on forehead and cheeks"
  severity: number; // 0-100
  recommendedTreatments: string[]; // e.g., ["Tan Correction Facial", "Vitamin C Brightening"]
}

// Eyebrow Assessment (from MediaPipe on-device)
export interface IEyebrowAssessment {
  archShape: 'flat' | 'natural' | 'over-arched' | 'uneven';
  fullness: number; // 1-5 scale
  leftRightSymmetry: number; // 0-100, 100 = perfect symmetry
  tailLength: 'short' | 'medium' | 'long';
  sparseness: number; // 0-100, higher = more sparse
  recommendedTreatments: string[]; // e.g., ["Threading & Shaping", "Brow Tinting", "Microblading"]
}

// Hydration & Texture
export interface IHydration {
  hydrationPercent: number; // 0-100
  dehydrationZones: string[]; // e.g., ["T-zone", "cheeks"]
  textureRating: number; // 0-100
  poreCondition: string; // e.g., "enlarged pores in T-zone"
  recommendedTreatments: string[];
}

// Dark Circles & Under-Eye Analysis
export interface IDarkCircles {
  type: 1 | 2 | 3; // Type 1: pigmentation, Type 2: vascular, Type 3: structural/sunken
  severity: 'mild' | 'moderate' | 'severe';
  colorDelta: number; // periorbital color difference (from OpenCV)
  recommendedTreatments: string[]; // e.g., ["Under-Eye Brightening", "Vitamin K Therapy", "LED Eye Treatment"]
}

// Acne & Breakout Zones
export interface IAcneAnalysis {
  zones: Array<{
    area: 'forehead' | 'nose' | 'chin' | 'left-cheek' | 'right-cheek' | 'jawline';
    severity: number; // 0-100
    type: 'active' | 'healing' | 'hormonal' | 'none';
  }>;
  overallSeverity: number; // 0-100
  recommendedTreatments: string[]; // e.g., ["Deep Pore Cleansing", "Clay Mask", "Acne Facial"]
}

// Lip Pigmentation Analysis
export interface ILipPigmentation {
  melaninIndex: number; // 0-100, from OpenCV HSL analysis
  darknessLevel: 'light' | 'medium' | 'dark' | 'very-dark';
  unevenness: number; // 0-100
  drynessLevel: number; // 0-100
  recommendedTreatments: string[]; // e.g., ["Lip Lightening Treatment", "Exfoliation", "Hydration Mask"]
}

// AI Treatment Priority Plan
export interface ITreatmentPlan {
  priority: number; // 1, 2, 3 (most to least important)
  treatmentName: string;
  reason: string; // linked to finding
  pkrPriceRange: string; // e.g., "2000-5000"
  estimatedDuration: string; // e.g., "45-60 minutes"
}

// Diet & Nutrition Plan
export interface IDietPlan {
  foodsToEat: Array<{
    food: string;
    reason: string; // tied to skin condition
  }>;
  foodsToAvoid: Array<{
    food: string;
    reason: string;
  }>;
  dailyWaterIntake: string; // e.g., "8-10 glasses (2-2.5 liters)"
  specificToSkinTone: boolean; // true if calibrated for South Asian skin
}

// Main Skin Scan Document Interface
export interface ISkinScan extends Document {
  customerId: mongoose.Types.ObjectId;
  imageUrl?: string;
  imageMimeType: string;
  faceValid: boolean;
  faceGuidance: string[];

  // Overall Analysis
  overallSkinScore: number; // 0-100, weighted average
  summary: string;

  // Detailed Analysis Sections (new comprehensive structure)
  skinTone?: ISkinTone;
  eyebrows?: IEyebrowAssessment;
  hydration?: IHydration;
  darkCircles?: IDarkCircles;
  acne?: IAcneAnalysis;
  lipPigmentation?: ILipPigmentation;

  // Treatment & Diet Plans
  treatmentPlan: ITreatmentPlan[];
  dietPlan?: IDietPlan;

  // Legacy fields (for backward compatibility)
  metrics: Array<{
    key: string;
    score: number;
    label: string;
  }>;
  recommendationNotes: string[];
  recommendedServiceIds: mongoose.Types.ObjectId[];

  // South Asian Calibration Flag
  southAsianCalibrated: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const skinToneSchema = new Schema<ISkinTone>(
  {
    tone: { type: String, required: true },
    evenness: { type: Number, required: true, min: 0, max: 100 },
    tanningPattern: { type: String, required: true },
    severity: { type: Number, required: true, min: 0, max: 100 },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const eyebrowSchema = new Schema<IEyebrowAssessment>(
  {
    archShape: { type: String, enum: ['flat', 'natural', 'over-arched', 'uneven'], required: true },
    fullness: { type: Number, required: true, min: 1, max: 5 },
    leftRightSymmetry: { type: Number, required: true, min: 0, max: 100 },
    tailLength: { type: String, enum: ['short', 'medium', 'long'], required: true },
    sparseness: { type: Number, required: true, min: 0, max: 100 },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const hydrationSchema = new Schema<IHydration>(
  {
    hydrationPercent: { type: Number, required: true, min: 0, max: 100 },
    dehydrationZones: [{ type: String }],
    textureRating: { type: Number, required: true, min: 0, max: 100 },
    poreCondition: { type: String, required: true },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const darkCirclesSchema = new Schema<IDarkCircles>(
  {
    type: { type: Number, enum: [1, 2, 3], required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
    colorDelta: { type: Number, required: true },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const acneZoneSchema = new Schema(
  {
    area: {
      type: String,
      enum: ['forehead', 'nose', 'chin', 'left-cheek', 'right-cheek', 'jawline'],
      required: true
    },
    severity: { type: Number, required: true, min: 0, max: 100 },
    type: { type: String, enum: ['active', 'healing', 'hormonal', 'none'], required: true }
  },
  { _id: false }
);

const acneSchema = new Schema<IAcneAnalysis>(
  {
    zones: [acneZoneSchema],
    overallSeverity: { type: Number, required: true, min: 0, max: 100 },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const lipPigmentationSchema = new Schema<ILipPigmentation>(
  {
    melaninIndex: { type: Number, required: true, min: 0, max: 100 },
    darknessLevel: { type: String, enum: ['light', 'medium', 'dark', 'very-dark'], required: true },
    unevenness: { type: Number, required: true, min: 0, max: 100 },
    drynessLevel: { type: Number, required: true, min: 0, max: 100 },
    recommendedTreatments: [{ type: String }]
  },
  { _id: false }
);

const treatmentPlanSchema = new Schema<ITreatmentPlan>(
  {
    priority: { type: Number, required: true, min: 1, max: 3 },
    treatmentName: { type: String, required: true },
    reason: { type: String, required: true },
    pkrPriceRange: { type: String, required: true },
    estimatedDuration: { type: String, required: true }
  },
  { _id: false }
);

const dietPlanSchema = new Schema<IDietPlan>(
  {
    foodsToEat: [{
      food: { type: String, required: true },
      reason: { type: String, required: true }
    }],
    foodsToAvoid: [{
      food: { type: String, required: true },
      reason: { type: String, required: true }
    }],
    dailyWaterIntake: { type: String, required: true },
    specificToSkinTone: { type: Boolean, default: true }
  },
  { _id: false }
);

const legacyMetricSchema = new Schema(
  {
    key: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    label: { type: String, required: true }
  },
  { _id: false }
);

// Main Skin Scan Schema
const skinScanSchema = new Schema<ISkinScan>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String },
    imageMimeType: { type: String, default: 'image/jpeg' },
    faceValid: { type: Boolean, required: true, index: true },
    faceGuidance: [{ type: String }],

    // Overall Analysis
    overallSkinScore: { type: Number, default: 0, min: 0, max: 100 },
    summary: { type: String, default: '' },

    // Detailed Analysis Sections
    skinTone: { type: skinToneSchema },
    eyebrows: { type: eyebrowSchema },
    hydration: { type: hydrationSchema },
    darkCircles: { type: darkCirclesSchema },
    acne: { type: acneSchema },
    lipPigmentation: { type: lipPigmentationSchema },

    // Treatment & Diet Plans
    treatmentPlan: { type: [treatmentPlanSchema], default: [] },
    dietPlan: { type: dietPlanSchema },

    // Legacy fields (backward compatibility)
    metrics: { type: [legacyMetricSchema], default: [] },
    recommendationNotes: [{ type: String }],
    recommendedServiceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

    // South Asian Calibration
    southAsianCalibrated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for efficient queries
skinScanSchema.index({ customerId: 1, createdAt: -1 });
skinScanSchema.index({ customerId: 1, faceValid: 1, createdAt: -1 });

export const SkinScan = mongoose.model<ISkinScan>('SkinScan', skinScanSchema);
