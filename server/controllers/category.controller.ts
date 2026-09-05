import { Response, NextFunction } from 'express';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const name = String(req.body.name || '').trim();
  if (!name) return next(new ApiError(400, 'Category name is required'));

  const category = await Category.create({ name });
  res.status(201).json({ success: true, data: category });
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await Category.find({ active: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const name = String(req.body.name || '').trim();
  if (!name) return next(new ApiError(400, 'Category name is required'));

  const category = await Category.findById(req.params.id);
  if (!category) return next(new ApiError(404, 'Category not found'));

  category.name = name;
  await category.save();
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new ApiError(404, 'Category not found'));

  // Soft delete: existing services keep their denormalized category name/id, but
  // the category stops appearing in the picker for new/edited services.
  category.active = false;
  await category.save();
  res.json({ success: true, message: 'Category deleted' });
});
