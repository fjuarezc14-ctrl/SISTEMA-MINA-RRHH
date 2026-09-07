import { Router } from 'express';
import { GaritaController } from './garita.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

// Para agilidad en garita, validarQR puede autenticarse o permitir token de garita
router.post('/validar-qr', GaritaController.validarQR);
router.post('/registrar-ingreso', authenticateJWT, GaritaController.registrarIngreso);
router.get('/historial', authenticateJWT, GaritaController.getHistorial);

export default router;
