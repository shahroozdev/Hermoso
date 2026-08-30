import { z } from 'zod';

export const createCheckoutSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required')
  })
});

export const requestRefundSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    reason: z.string().min(1, 'Reason is required').max(500)
  })
});

export const updateRefundSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Refund ID is required')
  }),
  body: z.object({
    status: z.enum(['completed', 'failed']),
    notes: z.string().optional()
  })
});

export const getRefundsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    salonId: z.string().optional()
  })
});
