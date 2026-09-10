import { Router } from 'express';
import { NotificacionesController } from './notificaciones.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, NotificacionesController.getNotificaciones);
router.patch('/:id/leido', authenticateJWT, NotificacionesController.marcarLeida);
router.delete('/limpiar', authenticateJWT, NotificacionesController.limpiarLeidas);
router.delete('/:id', authenticateJWT, NotificacionesController.borrarNotificacion);

export default router;
