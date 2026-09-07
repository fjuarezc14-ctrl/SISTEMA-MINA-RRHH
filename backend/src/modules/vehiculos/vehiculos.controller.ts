import { Request, Response, NextFunction } from 'express';
import { VehiculosService } from './vehiculos.service';
import { z } from 'zod';

const registrarVehiculoSchema = z.object({
  empresaId: z.string().uuid(),
  placaCodigo: z.string().min(3),
  tipoVehiculo: z.enum([
    'CAMIONETA_4X4',
    'VOLQUETE',
    'CISTERNA_COMBUSTIBLE',
    'SCOOP_MINERO',
    'RETROEXCAVADORA',
    'MINIBUS_PERSONAL',
  ]),
  marca: z.string().min(2),
  modelo: z.string().min(2),
  anioFabricacion: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
  color: z.string().optional(),
  soatVencimiento: z.string(),
  revTecnicaVencimiento: z.string(),
  polizaTrecVencimiento: z.string().optional(),
  checklistSeguridad: z.record(z.boolean()).optional(),
  observaciones: z.string().optional(),
});

const evaluarVehiculoSchema = z.object({
  decision: z.enum(['APROBAR', 'OBSERVAR']),
  observaciones: z.string().optional(),
});

export class VehiculosController {
  static async getVehiculos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await VehiculosService.getVehiculos();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registrarVehiculoSchema.parse(req.body);
      const vehiculo = await VehiculosService.registrarVehiculo(parsed as any);
      res.status(201).json(vehiculo);
    } catch (err) {
      next(err);
    }
  }

  static async evaluar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, observaciones } = evaluarVehiculoSchema.parse(req.body);
      const evaluadorId = req.user?.id;

      const updated = await VehiculosService.evaluarVehiculo(id, decision, observaciones, evaluadorId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}
