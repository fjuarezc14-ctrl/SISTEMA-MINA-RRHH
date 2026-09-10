import { Router } from 'express';
import { GaritaController } from './garita.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Todos los endpoints de Garita requieren autenticación y rol de Control de Accesos o Super Admin
const garitaAuth = [authenticateJWT, requireRoles('CONTROL_ACCESOS', 'SUPER_ADMIN')];

// Validación y escaneo en garita
router.post('/validar-qr', ...garitaAuth, GaritaController.validarQR);
router.post('/registrar-ingreso', ...garitaAuth, GaritaController.registrarIngreso);

// Descarga de padrón para modo offline (estrictamente restringido a personal de garita autenticado)
router.get('/padron-offline', ...garitaAuth, GaritaController.getPadronOffline);

// Sincronización y auditoría
router.post('/sincronizar-offline', ...garitaAuth, GaritaController.sincronizarOffline);
router.get('/historial', ...garitaAuth, GaritaController.getHistorial);

export default router;
