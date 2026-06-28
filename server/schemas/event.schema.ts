import { z } from 'zod';
import { EventCategory } from '../utils/constants.js';

// Create event schema
export const createEventSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional().default(''),
    category: z.enum([
      EventCategory.BRIDAL,
      EventCategory.PARTY,
      EventCategory.EID,
      EventCategory.INDEPENDENCE_DAY,
      EventCategory.BIRTHDAY,
      EventCategory.ENGAGEMENT,
      EventCategory.ANNIVERSARY,
      EventCategory.CORPORATE,
      EventCategory.WEDDING,
      EventCategory.OTHER
    ]),
    services: z.array(
      z.object({
        serviceId: z.string().min(1, 'Service ID is required')
      })
    ).min(1, 'At least one service is required'),
    discount: z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100').optional().default(0),
    images: z.array(z.string().url('Invalid image URL')).optional().default([]),
    salonId: z.string().optional()
  })
});

// Update event schema
export const updateEventSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    description: z.string().max(500).optional(),
    category: z.enum([
      EventCategory.BRIDAL,
      EventCategory.PARTY,
      EventCategory.EID,
      EventCategory.INDEPENDENCE_DAY,
      EventCategory.BIRTHDAY,
      EventCategory.ENGAGEMENT,
      EventCategory.ANNIVERSARY,
      EventCategory.CORPORATE,
      EventCategory.WEDDING,
      EventCategory.OTHER
    ]).optional(),
    services: z.array(
      z.object({
        serviceId: z.string().min(1, 'Service ID is required')
      })
    ).min(1, 'At least one service is required').optional(),
    discount: z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100').optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    active: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Event ID is required')
  })
});

// Get events query schema
export const getEventsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional().default(''),
    category: z.enum([
      EventCategory.BRIDAL,
      EventCategory.PARTY,
      EventCategory.EID,
      EventCategory.INDEPENDENCE_DAY,
      EventCategory.BIRTHDAY,
      EventCategory.ENGAGEMENT,
      EventCategory.ANNIVERSARY,
      EventCategory.CORPORATE,
      EventCategory.WEDDING,
      EventCategory.OTHER
    ]).optional(),
    salonId: z.string().optional()
  })
});

// Get event by ID schema
export const getEventByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required')
  })
});

// Delete event schema
export const deleteEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required')
  })
});

// Get events by category schema
export const getEventsByCategorySchema = z.object({
  params: z.object({
    category: z.enum([
      EventCategory.BRIDAL,
      EventCategory.PARTY,
      EventCategory.EID,
      EventCategory.INDEPENDENCE_DAY,
      EventCategory.BIRTHDAY,
      EventCategory.ENGAGEMENT,
      EventCategory.ANNIVERSARY,
      EventCategory.CORPORATE,
      EventCategory.WEDDING,
      EventCategory.OTHER
    ])
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    salonId: z.string().optional()
  })
});
