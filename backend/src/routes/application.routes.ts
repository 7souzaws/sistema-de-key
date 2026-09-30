import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new ApplicationController();

router.get('/', adminAuth, controller.getAll.bind(controller));
router.get('/:id', adminAuth, controller.getById.bind(controller));
router.post('/', adminAuth, controller.create.bind(controller));
router.put('/:id', adminAuth, controller.update.bind(controller));
router.post('/:id/regenerate-secret', adminAuth, controller.regenerateSecret.bind(controller));
router.delete('/:id', adminAuth, controller.delete.bind(controller));

export default router;
