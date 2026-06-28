import { Router } from 'express';
import { getAdminDashboardAnalytics, getOwnerDashboardAnalytics } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/analytics/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
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
 *                     totals:
 *                       type: object
 *                       properties:
 *                         salons:
 *                           type: number
 *                         customers:
 *                           type: number
 *                         bookings:
 *                           type: number
 *                         platformRevenue:
 *                           type: number
 *                         grossRevenue:
 *                           type: number
 *                     charts:
 *                       type: object
 *                     activity:
 *                       type: object
 *                     productMetrics:
 *                       type: object
 *                     recentSalons:
 *                       type: array
 */

/**
 * @swagger
 * /api/analytics/owner/dashboard:
 *   get:
 *     summary: Get salon owner dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner dashboard data
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
 *                     totals:
 *                       type: object
 *                       properties:
 *                         dailyBookings:
 *                           type: number
 *                         upcomingAppointments:
 *                           type: number
 *                         grossRevenue:
 *                           type: number
 *                         netRevenue:
 *                           type: number
 *                     charts:
 *                       type: object
 *       400:
 *         description: Salon ID not found
 */

router.use(authenticate);

router.get('/admin/dashboard', authorize(Roles.SUPER_ADMIN), getAdminDashboardAnalytics);
router.get('/owner/dashboard', authorize(Roles.SALON_OWNER), getOwnerDashboardAnalytics);

export default router;