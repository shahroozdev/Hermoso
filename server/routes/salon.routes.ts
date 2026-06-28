import { Router } from 'express';
import { createSalon, getSalons, getSalonById, updateSalon, approveOrSuspendSalon, getSalonRevenue } from '../controllers/salon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/salons:
 *   post:
 *     summary: Create a new salon
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSalonRequest'
 *     responses:
 *       201:
 *         description: Salon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *   get:
 *     summary: Get salons with pagination and filters
 *     tags: [Salons]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, suspended]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of salons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/salons/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics for all salons
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       commissionRate:
 *                         type: number
 *                       grossRevenue:
 *                         type: number
 *                       platformRevenue:
 *                         type: number
 *                       salonNetRevenue:
 *                         type: number
 */

/**
 * @swagger
 * /api/salons/{id}:
 *   get:
 *     summary: Get salon by ID
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon details
 *       404:
 *         description: Salon not found
 *   put:
 *     summary: Update salon
 *     tags: [Salons]
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
 *             $ref: '#/components/schemas/CreateSalonRequest'
 *     responses:
 *       200:
 *         description: Salon updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Salon not found
 */

/**
 * @swagger
 * /api/salons/{id}/status:
 *   patch:
 *     summary: Approve or suspend a salon
 *     tags: [Salons]
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
 *             $ref: '#/components/schemas/UpdateSalonStatusRequest'
 *     responses:
 *       200:
 *         description: Salon status updated
 *       400:
 *         description: Invalid status update
 *       404:
 *         description: Salon not found
 */

router.use(authenticate);

router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), upload.single('imageUrl'), createSalon);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.CUSTOMER), getSalons);
router.get('/analytics/revenue', authorize(Roles.SUPER_ADMIN), getSalonRevenue);
router.get('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.CUSTOMER), getSalonById);
router.put('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), upload.single('imageUrl'), updateSalon);
router.patch('/:id/status', authorize(Roles.SUPER_ADMIN), approveOrSuspendSalon);

export default router;