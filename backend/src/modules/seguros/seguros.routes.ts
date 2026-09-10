import { Router } from 'express';
import { SegurosController } from './seguros.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Consultar historial de pólizas y clínicas por postulante (roles internos autorizados, excluye contratistas)
router.get(
  '/historial/:postulanteId',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'ADMIN_CONTRATOS', 'STAFF_RRHH', 'MEDICO_OCUPACIONAL', 'CONTROL_ACCESOS'),
  SegurosController.getHistorialSeguros
);

// Registrar póliza en historial (solo administración de contratos y super admin)
router.post(
  '/historial',
  authenticateJWT,
  requireRoles('ADMIN_CONTRATOS', 'SUPER_ADMIN'),
  SegurosController.agregarPolizaHistorial
);

export default router;
