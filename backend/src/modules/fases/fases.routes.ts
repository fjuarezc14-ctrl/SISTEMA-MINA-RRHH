import { Router } from 'express';
import { FasesController } from './fases.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Consultar candidatos pendientes en una fase específica
router.get(
  '/:fase/pendientes',
  authenticateJWT,
  FasesController.getCandidatosFase
);

// Evaluar una fase (Aprobar, Observar o Dictaminar No Apto con Lista Negra)
router.post(
  '/:fase/evaluar',
  authenticateJWT,
  upload.single('archivo'),
  FasesController.evaluarFase
);

export default router;
