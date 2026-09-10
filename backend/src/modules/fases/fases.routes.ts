import { Router, Request, Response, NextFunction } from 'express';
import { FasesController } from './fases.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Mapeo estricto de roles autorizados por cada fase de acreditación
const ROLES_POR_FASE: Record<string, string[]> = {
  FASE_1: ['STAFF_RRHH', 'SUPER_ADMIN'],
  FASE_2: ['MEDICO_OCUPACIONAL', 'SUPER_ADMIN'],
  FASE_3: ['SEGURIDAD_PATRIMONIAL', 'SUPER_ADMIN'],
  FASE_4: ['INSTRUCTOR_SSOMA', 'SUPER_ADMIN'],
  FASE_5: ['ADMIN_CONTRATOS', 'SUPER_ADMIN'],
};

// Middleware dinámico que valida que el usuario pertenezca al área de la fase solicitada
const requireRolePorFase = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  if (req.user.rol === 'SUPER_ADMIN') {
    return next();
  }

  const fase = req.params.fase?.toUpperCase();
  const rolesPermitidos = ROLES_POR_FASE[fase];

  if (!rolesPermitidos) {
    return res.status(400).json({ error: `Fase '${fase}' no válida en el sistema.` });
  }

  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({
      error: `Acceso denegado: El rol [${req.user.rol}] no tiene facultades para evaluar o consultar la ${fase}.`,
    });
  }

  next();
};

// Consultar candidatos pendientes en una fase específica (restringido por área)
router.get(
  '/:fase/pendientes',
  authenticateJWT,
  requireRolePorFase,
  FasesController.getCandidatosFase
);

// Evaluar una fase (Aprobar, Observar o Dictaminar No Apto con Lista Negra)
router.post(
  '/:fase/evaluar',
  authenticateJWT,
  requireRolePorFase,
  upload.single('archivo'),
  FasesController.evaluarFase
);

export default router;
