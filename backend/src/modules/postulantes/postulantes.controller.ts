import { Request, Response, NextFunction } from 'express';
import { PostulantesService } from './postulantes.service';
import { z } from 'zod';

const createPostulanteSchema = z.object({
  tipo_documento: z.enum(['DNI', 'CE', 'PASAPORTE']).default('DNI'),
  numero_documento: z.string().trim(),
  nombres: z.string().trim().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,50}$/, 'Los nombres solo deben contener letras (de 2 a 50 caracteres)'),
  apellidos: z.string().trim().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,50}$/, 'Los apellidos solo deben contener letras (de 2 a 50 caracteres)'),
  cargo: z.string().trim().min(2, 'El cargo debe tener al menos 2 caracteres'),
  telefono: z.string().trim().regex(/^9\d{8}$/, 'El teléfono celular debe tener 9 dígitos y empezar con 9').optional().or(z.literal('')),
  email: z.string().trim().email('Formato de correo electrónico inválido').optional().or(z.literal('')),
  grupo_sanguineo: z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).optional().or(z.literal('')),
  tipo_pase: z.enum(['PERMANENTE', 'VISITA_TECNICA', 'PROVEEDOR_LOGISTICO']).default('PERMANENTE'),
  vigencia_inicio: z.string().optional().or(z.literal('')),
  vigencia_fin: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.tipo_documento === 'DNI' && !/^\d{8}$/.test(data.numero_documento)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El DNI debe tener exactamente 8 dígitos numéricos.',
      path: ['numero_documento'],
    });
  }
  if (data.tipo_documento === 'CE' && !/^[A-Z0-9]{9}$/i.test(data.numero_documento)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El Carné de Extranjería (CE) debe tener exactamente 9 caracteres alfanuméricos.',
      path: ['numero_documento'],
    });
  }
  if (data.tipo_documento === 'PASAPORTE' && !/^[A-Z0-9]{6,12}$/i.test(data.numero_documento)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.',
      path: ['numero_documento'],
    });
  }
  if (data.vigencia_inicio && data.vigencia_fin && data.vigencia_fin < data.vigencia_inicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de término debe ser posterior o igual a la fecha de inicio del pase.',
      path: ['vigencia_fin'],
    });
  }
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
