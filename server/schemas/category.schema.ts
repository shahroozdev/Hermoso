import { z } from 'zod';

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100)
  })
});

// Update category schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    active: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  })
});

// Get categories query schema
export const getCategoriesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional().default('')
  })
});

// Get category by ID schema
export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  })
});

// Delete category schema
export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  })
});
