import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { z } from 'zod';

const crearUsuarioSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().email(),
  passwordPlain: z.string().min(6),
  rol: z.enum([
    'SUPER_ADMIN',
    'STAFF_RRHH',
    'MEDICO_OCUPACIONAL',
    'SEGURIDAD_PATRIMONIAL',
    'INSTRUCTOR_SSOMA',
    'ADMIN_CONTRATOS',
    'CONTROL_ACCESOS',
    'CONTRATISTA',
  ]),
  area_responsable: z.string().min(3),
  empresa_id: z.string().uuid().optional(),
});

export class AdminController {
  static async getUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getUsuarios();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async crearUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = crearUsuarioSchema.parse(req.body);
      const data = await AdminService.crearUsuario(parsed);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async toggleEstadoUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const data = await AdminService.toggleEstadoUsuario(id, Boolean(activo));
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditoria(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getAuditoriaVistosBuenos();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboardStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}
