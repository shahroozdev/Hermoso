import { z } from 'zod';
import { BookingStatus } from '../utils/constants.js';

// Create booking schema
export const createBookingSchema = z.object({
  body: z.object({
    salonId: z.string().min(1, 'Salon ID is required'),
    serviceId: z.string().min(1, 'Service ID is required'),
    staffId: z.string().min(1, 'Staff ID is required'),
    bookingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    bookingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    customerId: z.string().optional()
  })
});

// Update booking schema
export const updateBookingSchema = z.object({
  body: z.object({
    staffId: z.string().optional(),
    bookingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }).optional(),
    bookingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
    status: z.enum([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED
    ]).optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  })
});

// Get bookings query schema
export const getBookingsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    status: z.enum([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED
    ]).optional(),
    salonId: z.string().optional(),
    customerId: z.string().optional(),
    staffId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional()
  })
});

// Get booking by ID schema
export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  })
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  }),
  body: z.object({
    reason: z.string().optional()
  })
});

// Delete booking schema
export const deleteBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required')
  })
});
