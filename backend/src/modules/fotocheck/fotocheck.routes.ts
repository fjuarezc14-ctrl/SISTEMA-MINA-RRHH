import { Router } from 'express';
import { FotocheckController } from './fotocheck.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/pendientes',
  authenticateJWT,
  FotocheckController.getPendientes
);

router.get(
  '/:postulanteId',
  authenticateJWT,
  FotocheckController.getByPostulanteId
);

router.post(
  '/:postulanteId/imprimir',
  authenticateJWT,
  requireRoles('CONTROL_ACCESOS', 'STAFF_RRHH', 'SUPER_ADMIN'),
  FotocheckController.marcarImpreso
);

export default router;
