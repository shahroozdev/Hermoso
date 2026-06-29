import { z } from 'zod';

const posItemSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  type: z.enum(['service', 'event']),
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be >= 0'),
  qty: z.number().min(1, 'Qty must be at least 1'),
  discount: z.number().min(0, 'Discount must be >= 0').default(0),
  total: z.number().min(0, 'Total must be >= 0'),
});

export const createPOSSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional().default('Walk-in'),
    items: z.array(posItemSchema).min(1, 'At least one item is required'),
    subtotal: z.number().min(0),
    itemDiscount: z.number().min(0).default(0),
    gstPercent: z.number().min(0).max(100).default(0),
    gstAmount: z.number().min(0).default(0),
    globalDiscountPercent: z.number().min(0).max(100).default(0),
    globalDiscountAmount: z.number().min(0).default(0),
    grandTotal: z.number().min(0),
    receiptRef: z.string().min(1, 'Receipt reference is required'),
  }),
});

export const getPOSSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
});
