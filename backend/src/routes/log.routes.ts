import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new LogController();

router.get('/', adminAuth, controller.getAll.bind(controller));

export default router;
