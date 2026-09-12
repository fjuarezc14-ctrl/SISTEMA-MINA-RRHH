import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { query } from '../config/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  empresa_id?: string | null;
  colegiatura?: string | null;
  area_responsable?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;

    // Verificar que el usuario siga activo y no bloqueado en la BD, y sincronizar su rol actual
    const userCheck = await query(
      'SELECT activo, bloqueado_definitivo, rol, empresa_id FROM usuarios WHERE id = $1',
      [decoded.id]
    );
    if (!userCheck.rows[0] || !userCheck.rows[0].activo || userCheck.rows[0].bloqueado_definitivo) {
      return res.status(401).json({ error: 'Sesión revocada. El usuario fue desactivado o bloqueado.' });
    }

    // Asegurar que req.user use el rol y empresa_id vigentes en la base de datos
    req.user = {
      ...decoded,
      rol: userCheck.rows[0].rol,
      empresa_id: userCheck.rows[0].empresa_id,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
  }
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (req.user.rol === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: `Acceso denegado: Su rol [${req.user.rol}] no tiene permisos para esta acción.` 
      });
    }

    next();
  };
};
