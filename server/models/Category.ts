import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  active: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
