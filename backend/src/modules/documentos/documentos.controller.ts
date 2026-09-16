import { Request, Response, NextFunction } from 'express';
import { DocumentosService } from './documentos.service';
import { DOCUMENT_PRIVACY_RULES } from '../../middlewares/privacy.middleware';

export class DocumentosController {
  static async getExpediente(req: Request, res: Response, next: NextFunction) {
    try {
      const { postulanteId } = req.params;
      const data = await DocumentosService.getExpedientePostulante(postulanteId);

      // Si el rol no es SUPER_ADMIN ni el rol autorizado, ocultar enlace de archivo sensible
      const userRol = req.user?.rol;
      if (userRol !== 'SUPER_ADMIN') {
        data.documentos = data.documentos.map((doc: any) => {
          const allowed = DOCUMENT_PRIVACY_RULES[doc.tipo_documento];
          if (allowed && !allowed.includes(userRol || '')) {
            return {
              ...doc,
              archivo_url: null,
              restringido: true,
              mensajePrivacidad: 'Documento confidencial reservado para ' + allowed.join(', '),
            };
          }
          return doc;
        });
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async streamDocumento(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { doc, filePath, fileName } = await DocumentosService.getDocumentoStream(id);

      // Validar regla de privacidad
      const userRol = req.user?.rol;
      const allowedRoles = DOCUMENT_PRIVACY_RULES[doc.tipo_documento];
      if (userRol !== 'SUPER_ADMIN' && allowedRoles && !allowedRoles.includes(userRol || '')) {
        return res.status(403).json({
          error: `Acceso restringido: El documento [${doc.tipo_documento}] está protegido por confidencialidad.`,
          confidencial: true,
        });
      }

      // Por defecto se envía en línea para poder visualizarlo dentro del expediente;
      // con ?download=1 se fuerza la descarga.
      if (req.query.download === '1') {
        return res.download(filePath, fileName);
      }
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}
