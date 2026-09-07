import { Router } from 'express';
import { VehiculosController } from './vehiculos.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, VehiculosController.getVehiculos);
router.post('/', authenticateJWT, VehiculosController.registrar);
router.patch(
  '/:id/evaluar',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'SEGURIDAD_PATRIMONIAL', 'CONTROL_ACCESOS'),
  VehiculosController.evaluar
);

export default router;
