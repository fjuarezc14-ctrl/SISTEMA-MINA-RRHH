import { Router } from 'express';
import { ListaNegraController } from './lista-negra.controller';
import { authenticateJWT, requireRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRoles('STAFF_RRHH', 'MEDICO_OCUPACIONAL', 'SEGURIDAD_PATRIMONIAL', 'SUPER_ADMIN'),
  ListaNegraController.getBloqueados
);

export default router;
