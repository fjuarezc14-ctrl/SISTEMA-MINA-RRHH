import { Router } from 'express';
import { MetricasController } from './metricas.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/slas', authenticateJWT, requireRoles('SUPER_ADMIN'), MetricasController.getSlas);
router.get('/ranking', authenticateJWT, requireRoles('SUPER_ADMIN'), MetricasController.getRanking);
router.get('/exportar-excel', authenticateJWT, requireRoles('SUPER_ADMIN'), MetricasController.exportarExcel);

export default router;
