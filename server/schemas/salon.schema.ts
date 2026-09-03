import { z } from 'zod';
import { SalonStatus } from '../utils/constants.js';

const workingHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  off: z.boolean().default(false),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional()
});

// Create salon schema
export const createSalonSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(1000).optional().default(''),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    images: z.array(z.string().url('Invalid image URL')).optional().default([]),
    workingHours: z.object({
      monday: workingHoursSchema,
      tuesday: workingHoursSchema,
      wednesday: workingHoursSchema,
      thursday: workingHoursSchema,
      friday: workingHoursSchema,
      saturday: workingHoursSchema,
      sunday: workingHoursSchema
    }).optional(),
    commissionRate: z.number().min(0, 'Commission rate must be >= 0').max(100, 'Commission rate must be <= 100').optional().default(10),
    location: z.object({
      city: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    salonId: z.string().optional()
  })
});

// Update salon schema
export const updateSalonSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    description: z.string().max(1000).optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    workingHours: z.object({
      monday: workingHoursSchema,
      tuesday: workingHoursSchema,
      wednesday: workingHoursSchema,
      thursday: workingHoursSchema,
      friday: workingHoursSchema,
      saturday: workingHoursSchema,
      sunday: workingHoursSchema
    }).optional(),
    commissionRate: z.number().min(0, 'Commission rate must be >= 0').max(100, 'Commission rate must be <= 100').optional(),
    location: z.object({
      city: z.string().optional(),
      country: z.string().optional()
    }).optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Salon ID is required')
  })
});

// Get salons query schema
export const getSalonsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional().default(''),
    city: z.string().optional(),
    status: z.enum([SalonStatus.PENDING, SalonStatus.APPROVED, SalonStatus.SUSPENDED]).optional()
  })
});

// Get salon by ID schema
export const getSalonByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Salon ID is required')
  })
});

// Delete salon schema
export const deleteSalonSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Salon ID is required')
  })
});

// Approve/Suspend salon schema
export const updateSalonStatusSchema = z.object({
  body: z.object({
    status: z.enum([SalonStatus.APPROVED, SalonStatus.SUSPENDED]),
    reason: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Salon ID is required')
  })
});
