import { Router } from 'express';
import { createPOS, listPOS, getPOSById } from '../controllers/pos.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), createPOS);
router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), listPOS);
router.get('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), getPOSById);

export default router;
