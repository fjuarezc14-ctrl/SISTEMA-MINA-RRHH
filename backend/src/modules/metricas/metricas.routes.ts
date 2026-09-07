import { Router } from 'express';
import { MetricasController } from './metricas.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/slas', authenticateJWT, MetricasController.getSlas);
router.get('/ranking', authenticateJWT, MetricasController.getRanking);
router.get('/exportar-excel', authenticateJWT, MetricasController.exportarExcel);

export default router;
