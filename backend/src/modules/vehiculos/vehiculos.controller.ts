import { Request, Response, NextFunction } from 'express';
import { VehiculosService } from './vehiculos.service';
import { z } from 'zod';

const anioActual = new Date().getFullYear();

const registrarVehiculoSchema = z.object({
  empresaId: z.string().uuid('ID de empresa contratista inválido'),
  placaCodigo: z.string().trim().toUpperCase().refine((val) => {
    const regexVehiculo = /^[A-Z0-9]{3}-?[A-Z0-9]{3}$/;
    const regexMaquinaria = /^(SCOOP|VOL|CIST|RETRO|DUMPER|MINIBUS|CAM)-\d{2,3}$/;
    return regexVehiculo.test(val) || regexMaquinaria.test(val) || val.length >= 3;
  }, 'Formato de placa inválido. Ejemplos válidos: V8X-921, VOL-04, SCOOP-02'),
  tipoVehiculo: z.enum([
    'CAMIONETA_4X4',
    'VOLQUETE',
    'CISTERNA_COMBUSTIBLE',
    'SCOOP_MINERO',
    'RETROEXCAVADORA',
    'MINIBUS_PERSONAL',
  ]),
  marca: z.string().trim().min(2, 'La marca debe tener al menos 2 caracteres'),
  modelo: z.string().trim().min(2, 'El modelo debe tener al menos 2 caracteres'),
  anioFabricacion: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(2015, 'El año mínimo permitido por estándar minero es 2015').max(anioActual + 1, `El año de fabricación no puede exceder ${anioActual + 1}`).optional()
  ),
  color: z.string().trim().optional(),
  soatVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vigencia de SOAT obligatoria en formato YYYY-MM-DD'),
  revTecnicaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vigencia de Revisión Técnica obligatoria en formato YYYY-MM-DD'),
  polizaTrecVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha TREC inválido (YYYY-MM-DD)').optional().or(z.literal('')),
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
      const empresaId = req.user?.rol === 'CONTRATISTA' ? req.user.empresa_id : (req.query.empresa_id as string || null);
      const data = await VehiculosService.getVehiculos(empresaId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registrarVehiculoSchema.parse(req.body);

      // Si es contratista, forzar la empresa del token para evitar registrar vehículos para contratas ajenas
      if (req.user?.rol === 'CONTRATISTA' && req.user.empresa_id) {
        parsed.empresaId = req.user.empresa_id;
      }

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
