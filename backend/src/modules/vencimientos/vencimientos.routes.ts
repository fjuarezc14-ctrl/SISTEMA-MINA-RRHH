import { Router } from 'express';
import { VencimientosController } from './vencimientos.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/resumen',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'STAFF_RRHH', 'ADMIN_CONTRATOS'),
  VencimientosController.getResumen
);

router.post(
  '/ejecutar-revision',
  authenticateJWT,
  requireRoles('SUPER_ADMIN'),
  VencimientosController.ejecutarRevision
);

export default router;
