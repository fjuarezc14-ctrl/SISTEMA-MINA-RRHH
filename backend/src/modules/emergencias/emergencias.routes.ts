import { Router } from 'express';
import { EmergenciasController } from './emergencias.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Autorizar bajada anticipada (Médico de guardia, RRHH o Admin)
router.post(
  '/autorizar',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'MEDICO_OCUPACIONAL', 'STAFF_RRHH'),
  EmergenciasController.autorizarBajada
);

// Listar emergencias pendientes para Garita y supervisores
router.get(
  '/activas',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'CONTROL_ACCESOS', 'MEDICO_OCUPACIONAL', 'STAFF_RRHH'),
  EmergenciasController.getEmergenciasActivas
);

// Ejecutar salida en Garita (Guardia de control o Super Admin)
router.post(
  '/ejecutar-garita',
  authenticateJWT,
  requireRoles('SUPER_ADMIN', 'CONTROL_ACCESOS'),
  EmergenciasController.ejecutarSalidaGarita
);

export default router;
