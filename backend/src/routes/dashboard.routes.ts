import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new DashboardController();

router.get('/stats', adminAuth, controller.getStats.bind(controller));

export default router;
