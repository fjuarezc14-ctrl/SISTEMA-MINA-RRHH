import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas solo para SUPER_ADMIN
router.use(authenticateJWT);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/usuarios', AdminController.getUsuarios);
router.post('/usuarios', AdminController.crearUsuario);
router.patch('/usuarios/:id/estado', AdminController.toggleEstadoUsuario);
router.patch('/usuarios/:id/desbloquear', AdminController.desbloquearUsuario);
router.get('/auditoria', AdminController.getAuditoria);
router.get('/stats', AdminController.getDashboardStats);

export default router;
