import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new AdminController();

router.post('/login', controller.login.bind(controller));
router.get('/me', adminAuth, controller.me.bind(controller));
router.post('/logout', controller.logout.bind(controller));
router.post('/change-password', adminAuth, controller.changePassword.bind(controller));

export default router;
