import { Router } from 'express';
import { requestPayout, getPayouts, updatePayout } from '../controllers/payout.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/payouts/request:
 *   post:
 *     summary: Request a payout (Salon Owner only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestPayoutRequest'
 *     responses:
 *       201:
 *         description: Payout requested
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 availableBalance:
 *                   type: number
 *       400:
 *         description: Invalid payout amount or Salon owner required
 */

/**
 * @swagger
 * /api/payouts:
 *   get:
 *     summary: Get payouts with pagination
 *     tags: [Payouts]
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
 *         name: salonId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *     responses:
 *       200:
 *         description: List of payouts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/payouts/{id}:
 *   patch:
 *     summary: Update payout status (Super Admin only)
 *     tags: [Payouts]
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
 *             $ref: '#/components/schemas/UpdatePayoutRequest'
 *     responses:
 *       200:
 *         description: Payout updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payout not found
 */

router.use(authenticate);

router.post('/request', authorize(Roles.SALON_OWNER), requestPayout);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), getPayouts);
router.patch('/:id', authorize(Roles.SUPER_ADMIN), updatePayout);

export default router;