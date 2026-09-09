import { Router } from 'express';
import { GaritaController } from './garita.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

// Endpoints de garita
router.post('/validar-qr', GaritaController.validarQR);
router.post('/registrar-ingreso', authenticateJWT, GaritaController.registrarIngreso);
router.get('/padron-offline', GaritaController.getPadronOffline);
router.post('/sincronizar-offline', authenticateJWT, GaritaController.sincronizarOffline);
router.get('/historial', authenticateJWT, GaritaController.getHistorial);

export default router;
