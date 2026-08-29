import { Router } from 'express';
import {
  analyzeScanImage,
  getLatestScan,
  getMyScanHistory,
  getScanImprovements,
  getScanMatches,
  getScanStatus,
  getScanUploadSignature,
  matchSalons
} from '../controllers/scan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();

router.use(authenticate);
router.use(authorize(Roles.CUSTOMER, Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF));

router.get('/upload-signature', getScanUploadSignature);
router.get('/status', getScanStatus);
router.post('/analyze', analyzeScanImage);
router.get('/latest', getLatestScan);
router.get('/history', getMyScanHistory);
router.get('/improvements', getScanImprovements);
router.get('/matches', getScanMatches);

// CR-30: Treatment-to-salon matching API
router.post('/match-salons', matchSalons);

export default router;
