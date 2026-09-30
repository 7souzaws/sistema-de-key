import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new SessionController();

router.get('/', adminAuth, controller.getAll.bind(controller));
router.delete('/:id', adminAuth, controller.delete.bind(controller));
router.post('/clean', adminAuth, controller.cleanExpired.bind(controller));

export default router;
