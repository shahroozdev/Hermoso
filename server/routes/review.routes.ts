import { Router } from 'express';
import { createReview, getReviews, moderateReview, replyReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *   get:
 *     summary: Get reviews with pagination
 *     tags: [Reviews]
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
 *           enum: [pending, approved, flagged, deleted]
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/reviews/{id}/moderate:
 *   patch:
 *     summary: Moderate a review (Super Admin only)
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/ModerateReviewRequest'
 *     responses:
 *       200:
 *         description: Review moderated
 *       400:
 *         description: Invalid moderation status
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/reviews/{id}/reply:
 *   patch:
 *     summary: Reply to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplyReviewRequest'
 *     responses:
 *       200:
 *         description: Reply added
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */

router.use(authenticate);

router.post('/', authorize(Roles.CUSTOMER), createReview);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getReviews);
router.patch('/:id/moderate', authorize(Roles.SUPER_ADMIN), moderateReview);
router.patch('/:id/reply', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF), replyReview);

export default router;