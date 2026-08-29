import { Router } from 'express';
import { changeMyPassword, createAdmin, createOwner, getMyProfile, listAdmins, listOwners, updateMyProfile, updateUser, updateUserStatus } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.patch('/me/password', changeMyPassword);

router.use(authorize(Roles.SUPER_ADMIN));

router.get('/owners', listOwners);
router.post('/owners', createOwner);
router.get('/admins', listAdmins);
router.post('/admins', createAdmin);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id', updateUser);

export default router;
