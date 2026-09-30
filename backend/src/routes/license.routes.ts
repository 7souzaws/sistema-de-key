import { Router } from 'express';
import { LicenseController } from '../controllers/license.controller';
import { adminAuth } from '../middleware/auth';

const router = Router();
const controller = new LicenseController();

router.get('/', adminAuth, controller.getAll.bind(controller));
router.get('/info', controller.getInfo.bind(controller));
router.get('/:id', adminAuth, controller.getById.bind(controller));
router.post('/generate', adminAuth, controller.generateKeys.bind(controller));
router.put('/:id/status', adminAuth, controller.updateStatus.bind(controller));
router.post('/:id/reset-hwid', adminAuth, controller.resetHwid.bind(controller));
router.delete('/:id', adminAuth, controller.delete.bind(controller));

export default router;
