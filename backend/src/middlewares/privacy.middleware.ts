import { Request, Response, NextFunction } from 'express';

// Tipos de documentos y sus roles con permiso exclusivo
export const DOCUMENT_PRIVACY_RULES: Record<string, string[]> = {
  // Datos Médicos Sensibles (Secreto Médico / Ley de Datos Personales)
  FICHA_EMO_TOX: ['MEDICO_OCUPACIONAL', 'SUPER_ADMIN'],
  
  // Antecedentes Penales / Judiciales Reservados
  ANTECEDENTES_PENALES: ['SEGURIDAD_PATRIMONIAL', 'SUPER_ADMIN'],
  
  // Examen de Seguridad SSOMA
  INDUCCION_SSOMA: ['INSTRUCTOR_SSOMA', 'SUPER_ADMIN'],
  
  // Póliza y Seguro SCTR
  POLIZA_SCTR: ['ADMIN_CONTRATOS', 'CONTRATISTA', 'SUPER_ADMIN'],
  
  // CV y Documento de Identidad
  CV_Y_DNI: ['STAFF_RRHH', 'CONTRATISTA', 'SUPER_ADMIN'],
};

export const checkDocumentPrivacy = (tipoDocumento: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado para acceder al documento.' });
    }

    if (req.user.rol === 'SUPER_ADMIN') {
      return next();
    }

    const allowedRoles = DOCUMENT_PRIVACY_RULES[tipoDocumento];
    if (allowedRoles && !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso restringido por confidencialidad: El documento [${tipoDocumento}] solo puede ser visualizado por [${allowedRoles.join(', ')}].`,
        confidencial: true,
      });
    }

    next();
  };
};
