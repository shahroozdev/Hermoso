import { Router } from 'express';
import { createCheckout, getPaymentStatus } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.post('/checkout', authorize(Roles.CUSTOMER), createCheckout);
router.get('/:tracker/status', authorize(Roles.CUSTOMER), getPaymentStatus);

export default router;
