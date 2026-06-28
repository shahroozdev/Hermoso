import { z } from 'zod';
import { ReviewStatus } from '../utils/constants.js';

// Create review schema
export const createReviewSchema = z.object({
  body: z.object({
    salonId: z.string().min(1, 'Salon ID is required'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().max(1000, 'Comment must not exceed 1000 characters').optional().default(''),
    customerId: z.string().optional()
  })
});

// Update review schema
export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
    comment: z.string().max(1000, 'Comment must not exceed 1000 characters').optional(),
    status: z.enum([
      ReviewStatus.PENDING,
      ReviewStatus.APPROVED,
      ReviewStatus.FLAGGED,
      ReviewStatus.DELETED
    ]).optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  })
});

// Get reviews query schema
export const getReviewsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    salonId: z.string().optional(),
    customerId: z.string().optional(),
    status: z.enum([
      ReviewStatus.PENDING,
      ReviewStatus.APPROVED,
      ReviewStatus.FLAGGED,
      ReviewStatus.DELETED
    ]).optional(),
    minRating: z.string().regex(/^[1-5]$/, 'Rating must be between 1 and 5').optional(),
    maxRating: z.string().regex(/^[1-5]$/, 'Rating must be between 1 and 5').optional()
  })
});

// Get review by ID schema
export const getReviewByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  })
});

// Delete review schema
export const deleteReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  })
});

// Update review status schema
export const updateReviewStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      ReviewStatus.APPROVED,
      ReviewStatus.FLAGGED,
      ReviewStatus.DELETED
    ])
  }),
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  })
});
