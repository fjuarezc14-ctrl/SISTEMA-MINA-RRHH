import { Router } from 'express';
import { SegurosController } from './seguros.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

// Consultar historial de pólizas y clínicas por postulante
router.get('/historial/:postulanteId', authenticateJWT, SegurosController.getHistorialSeguros);

// Registrar póliza en historial
router.post('/historial', authenticateJWT, SegurosController.agregarPolizaHistorial);

export default router;
