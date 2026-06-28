import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByCategory
} from '../controllers/event.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event with services
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - services
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [bridal, party, eid, independence_day, birthday, engagement, anniversary, corporate, wedding, other]
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serviceId:
 *                       type: string
 *               discount:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request
 *   get:
 *     summary: Get events with pagination
 *     tags: [Events]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: salonId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of events
 */

/**
 * @swagger
 * /api/events/category/{category}:
 *   get:
 *     summary: Get events by category
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of events by category
 */

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
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
 *         description: Event details
 *       404:
 *         description: Event not found
 *   put:
 *     summary: Update an event
 *     tags: [Events]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               services:
 *                 type: array
 *               discount:
 *                 type: number
 *               images:
 *                 type: array
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
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
 *         description: Event deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */

router.use(authenticate);

router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), createEvent);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getEvents);
router.get('/category/:category', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getEventsByCategory);
router.get('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getEventById);
router.put('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), updateEvent);
router.delete('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), deleteEvent);

export default router;
