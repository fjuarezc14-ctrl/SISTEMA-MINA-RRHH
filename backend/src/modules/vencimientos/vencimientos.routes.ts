import { Router } from 'express';
import { VencimientosController } from './vencimientos.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/resumen', authenticateJWT, VencimientosController.getResumen);
router.post('/ejecutar-revision', authenticateJWT, VencimientosController.ejecutarRevision);

export default router;
