import { Router } from 'express';
import multer from 'multer';
import { analyzeScanImage, getLatestScan, getMyScanHistory, getScanImprovements, getScanMatches, matchSalons } from '../controllers/scan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { Roles } from '../utils/constants.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.use(authenticate);
router.use(authorize(Roles.CUSTOMER, Roles.SUPER_ADMIN, Roles.SALON_OWNER, Roles.STAFF));

router.post('/analyze', upload.single('image'), analyzeScanImage);
router.get('/latest', getLatestScan);
router.get('/history', getMyScanHistory);
router.get('/improvements', getScanImprovements);
router.get('/matches', getScanMatches);

// CR-30: Treatment-to-salon matching API
router.post('/match-salons', matchSalons);

export default router;
