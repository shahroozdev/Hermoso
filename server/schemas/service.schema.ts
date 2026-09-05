import { z } from 'zod';

// Create service schema
export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional().default(''),
    priceInPaisa: z.number().int('Price must be an integer number of paisa').nonnegative('Price must be greater than or equal to 0'),
    duration: z.number().min(5, 'Duration must be at least 5 minutes'),
    categoryId: z.string().min(1, 'Category ID is required'),
    salonId: z.string().optional(),
    aiScanLink: z.string().optional()
  })
});

// Update service schema
export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    description: z.string().max(500).optional(),
    priceInPaisa: z.number().int('Price must be an integer number of paisa').nonnegative('Price must be greater than or equal to 0').optional(),
    duration: z.number().min(5, 'Duration must be at least 5 minutes').optional(),
    categoryId: z.string().optional(),
    active: z.boolean().optional(),
    aiScanLink: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Service ID is required')
  })
});

// Get services query schema
export const getServicesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional().default(''),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    salonId: z.string().optional()
  })
});

// Delete service schema
export const deleteServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Service ID is required')
  })
});
