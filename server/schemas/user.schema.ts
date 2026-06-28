import { z } from 'zod';
import { UserStatus } from '../utils/constants.js';

// Update user profile schema
export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().optional(),
    location: z.object({
      city: z.string().optional(),
      country: z.string().optional()
    }).optional()
  })
});

// Update user status schema
export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
  }),
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  })
});

// Get users query schema
export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional().default(''),
    role: z.string().optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]).optional()
  })
});

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  })
});

// Delete user schema
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required')
  })
});

// Get current user schema (no params/query needed)
export const getCurrentUserSchema = z.object({
  body: z.object({})
});
