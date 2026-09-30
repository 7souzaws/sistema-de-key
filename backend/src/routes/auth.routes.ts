import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login.bind(controller));
router.post('/validate', controller.validate.bind(controller));
router.post('/logout', controller.logout.bind(controller));

export default router;
