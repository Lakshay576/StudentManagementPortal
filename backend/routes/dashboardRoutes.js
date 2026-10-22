import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin'));

router.get('/summary', getDashboardSummary);

export default router;