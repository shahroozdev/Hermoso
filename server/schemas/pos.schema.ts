import { z } from 'zod';

// Only identity/quantity/discount are client-writable — price, subtotal, GST amount,
// global discount amount and grand total are always recomputed server-side from the
// current Service/Event catalog price so a tampered request can't set an arbitrary total.
const posItemSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  type: z.enum(['service', 'event']),
  name: z.string().min(1, 'Name is required'),
  qty: z.number().min(1, 'Qty must be at least 1'),
  discountInPaisa: z.number().int('Discount must be an integer number of paisa').nonnegative('Discount must be >= 0').default(0),
});

export const createPOSSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional().default('Walk-in'),
    items: z.array(posItemSchema).min(1, 'At least one item is required'),
    gstPercent: z.number().min(0).max(100).default(0),
    globalDiscountPercent: z.number().min(0).max(100).default(0),
    receiptRef: z.string().min(1, 'Receipt reference is required'),
  }),
});

export const getPOSSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
});
