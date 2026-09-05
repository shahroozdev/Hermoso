import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF, Roles.CUSTOMER), getCategories);
router.post('/', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), createCategory);
router.patch('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), updateCategory);
router.delete('/:id', authorize(Roles.SUPER_ADMIN, Roles.SALON_OWNER), deleteCategory);

export default router;
