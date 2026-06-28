import mongoose, { Document, Schema } from 'mongoose';
import { ReviewStatus, type ReviewStatusType } from '../utils/constants.js';

export interface IReview extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  reply: string;
  status: ReviewStatusType;
}

const reviewSchema = new Schema<IReview>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    reply: { type: String, default: '' },
    status: { type: String, enum: Object.values(ReviewStatus), default: ReviewStatus.PENDING, index: true }
  },
  { timestamps: true }
);

reviewSchema.index({ salonId: 1, customerId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);