import { Router } from 'express';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorize(Roles.SUPER_ADMIN, Roles.ADMIN));

router.get('/', getPlatformSettings);
router.patch('/', updatePlatformSettings);

export default router;
