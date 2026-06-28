import { Router } from 'express';
import { createBooking, getBookingAvailability, getBookingFormOptions, getBookings, updateBookingStatus } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       type: object
 *                     payment:
 *                       type: object
 *       404:
 *         description: Salon or Service not found
 *       409:
 *         description: Time slot already booked
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get bookings with pagination
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: salonId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingStatusRequest'
 *     responses:
 *       200:
 *         description: Booking status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 */

router.use(authenticate);

router.get('/options', authorize(Roles.CUSTOMER, Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF), getBookingFormOptions);
router.get('/availability', authorize(Roles.CUSTOMER, Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF), getBookingAvailability);
router.post('/', authorize(Roles.CUSTOMER), createBooking);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getBookings);
router.patch('/:id/status', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), updateBookingStatus);

export default router;
