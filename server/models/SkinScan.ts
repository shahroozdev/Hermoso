import mongoose, { Document, Schema } from 'mongoose';

export interface ISkinMetric {
  key: 'hydration' | 'sunDamage' | 'skinClarity' | 'pigmentation' | 'skinBarrier';
  score: number;
  label: string;
}

export interface ISkinScan extends Document {
  customerId: mongoose.Types.ObjectId;
  imageMimeType: string;
  faceValid: boolean;
  faceGuidance: string[];
  metrics: ISkinMetric[];
  summary: string;
  recommendationNotes: string[];
  recommendedServiceIds: mongoose.Types.ObjectId[];
}

const skinMetricSchema = new Schema<ISkinMetric>(
  {
    key: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    label: { type: String, required: true }
  },
  { _id: false }
);

const skinScanSchema = new Schema<ISkinScan>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageMimeType: { type: String, required: true },
    faceValid: { type: Boolean, required: true, index: true },
    faceGuidance: [{ type: String }],
    metrics: [skinMetricSchema],
    summary: { type: String, default: '' },
    recommendationNotes: [{ type: String }],
    recommendedServiceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }]
  },
  { timestamps: true }
);

export const SkinScan = mongoose.model<ISkinScan>('SkinScan', skinScanSchema);
