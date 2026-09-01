import { Router } from 'express';
import {
  createAnnouncement,
  createNotificationRecord,
  getNotifications,
  markNotificationRead,
  sendNotificationRecord,
  updateNotificationRecord
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/notifications/announcement:
 *   post:
 *     summary: Create a system announcement (Super Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnnouncementRequest'
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 count:
 *                   type: number
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications with pagination
 *     tags: [Notifications]
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
 *           default: 15
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */

router.use(authenticate);

router.post('/announcement', authorize(Roles.SUPER_ADMIN), createAnnouncement);
router.post('/', authorize(Roles.SUPER_ADMIN), createNotificationRecord);
router.patch('/:id', authorize(Roles.SUPER_ADMIN), updateNotificationRecord);
router.post('/:id/send', authorize(Roles.SUPER_ADMIN), sendNotificationRecord);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getNotifications);
router.patch('/:id/read', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), markNotificationRead);

export default router;