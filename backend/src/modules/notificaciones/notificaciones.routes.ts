import { Router } from 'express';
import { NotificacionesController } from './notificaciones.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, NotificacionesController.getNotificaciones);
router.patch('/:id/leido', authenticateJWT, NotificacionesController.marcarLeida);

export default router;
