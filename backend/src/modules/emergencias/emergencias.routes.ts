import { Router } from 'express';
import { EmergenciasController } from './emergencias.controller';
import { authenticateJWT, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Autorizar bajada anticipada (Médico de guardia, RRHH o Admin)
router.post('/autorizar', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'MEDICO_OCUPACIONAL', 'RRHH_RELACIONES_LABORALES'), EmergenciasController.autorizarBajada);

// Listar emergencias pendientes para Garita
router.get('/activas', authenticateJWT, EmergenciasController.getEmergenciasActivas);

// Ejecutar salida en Garita
router.post('/ejecutar-garita', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'GARITA_SEGURIDAD'), EmergenciasController.ejecutarSalidaGarita);

export default router;
