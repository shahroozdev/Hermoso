import { Router } from 'express';
import { createStaff, getStaff, updateStaff, deleteStaff } from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff created
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
 *         description: Bad request - salonId required
 *   get:
 *     summary: Get staff members with pagination
 *     tags: [Staff]
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
 *         name: salonId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of staff members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update a staff member
 *     tags: [Staff]
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
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       200:
 *         description: Staff updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Staff]
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
 *         description: Staff deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 */

router.use(authenticate);

router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), createStaff);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getStaff);
router.put('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), updateStaff);
router.delete('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), deleteStaff);

export default router;