import { Router } from 'express';
import { createCategory, getCategories } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getCategories);
router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), createCategory);

export default router;
