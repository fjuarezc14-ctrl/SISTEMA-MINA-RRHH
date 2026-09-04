import { Router } from 'express';
import { PostulantesController } from './postulantes.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Listado de postulantes (Filtrado según rol)
router.get('/', authenticateJWT, PostulantesController.getMisPostulantes);
router.get('/:id', authenticateJWT, PostulantesController.getById);

// Registro de nuevo postulante por contratista
router.post(
  '/',
  authenticateJWT,
  requireRoles('CONTRATISTA', 'STAFF_RRHH', 'SUPER_ADMIN'),
  upload.single('cv'),
  PostulantesController.create
);

// Subsanación de observaciones
router.post(
  '/:id/subsanar',
  authenticateJWT,
  requireRoles('CONTRATISTA', 'STAFF_RRHH', 'SUPER_ADMIN'),
  upload.single('archivo'),
  PostulantesController.subsanar
);

export default router;
