import { Request, Response, NextFunction } from 'express';
import { PostulantesService } from './postulantes.service';
import { z } from 'zod';

const createPostulanteSchema = z.object({
  tipo_documento: z.string().default('DNI'),
  numero_documento: z.string().min(5),
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  cargo: z.string().min(2),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  grupo_sanguineo: z.string().optional(),
  tipo_pase: z.enum(['PERMANENTE', 'VISITA_TECNICA', 'PROVEEDOR_LOGISTICO']).default('PERMANENTE'),
  vigencia_inicio: z.string().optional(),
  vigencia_fin: z.string().optional(),
});

export class PostulantesController {
  static async getMisPostulantes(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.rol === 'CONTRATISTA' ? req.user.empresa_id : null;
      const data = await PostulantesService.getMisPostulantes(empresaId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await PostulantesService.getById(id);
      if (!data) {
        return res.status(404).json({ error: 'Postulante no encontrado.' });
      }

      // Verificación IDOR: Contratistas solo pueden ver postulantes de su propia empresa
      if (req.user?.rol === 'CONTRATISTA' && data.empresa_id !== req.user.empresa_id) {
        return res.status(403).json({ error: 'Acceso denegado: El postulante no pertenece a su empresa contratista.' });
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Forzar la empresa del usuario si es CONTRATISTA para evitar inyección de empresas ajenas
      const empresaId = req.user?.rol === 'CONTRATISTA' ? req.user.empresa_id : (req.user?.empresa_id || req.body.empresa_id);
      if (!empresaId) {
        return res.status(400).json({ error: 'Se requiere ID de la empresa contratista.' });
      }

      const parsed = createPostulanteSchema.parse(req.body);
      const cvFileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const data = await PostulantesService.create(empresaId, parsed, cvFileUrl);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async subsanar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Verificación IDOR previa a subsanación
      if (req.user?.rol === 'CONTRATISTA') {
        const postulante = await PostulantesService.getById(id);
        if (!postulante || postulante.empresa_id !== req.user.empresa_id) {
          return res.status(403).json({ error: 'Acceso denegado: No tiene permisos para subsanar este postulante.' });
        }
      }

      const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.archivo_url;
      const notas = req.body.notas;

      if (!fileUrl) {
        return res.status(400).json({ error: 'Debe adjuntar el archivo corregido para subsanar.' });
      }

      const result = await PostulantesService.subsanar(id, fileUrl, notas);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
