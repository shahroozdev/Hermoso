import { Router } from 'express';
import { requestRefund, getRefunds, getRefundById, updateRefund, getRefundStats } from '../controllers/refund.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.post('/request', authorize(Roles.CUSTOMER), requestRefund);
router.get('/stats', authorize(Roles.SUPER_ADMIN), getRefundStats);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), getRefunds);
router.get('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), getRefundById);
router.patch('/:id', authorize(Roles.SUPER_ADMIN), updateRefund);

export default router;
