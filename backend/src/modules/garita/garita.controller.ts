import { Request, Response, NextFunction } from 'express';
import { GaritaService } from './garita.service';
import { z } from 'zod';

const validarSchema = z.object({
  codigo: z.string().min(1, 'El código QR o DNI es requerido'),
});

const registrarSchema = z.object({
  tipoAcceso: z.enum(['PEATONAL_TRABAJADOR', 'VEHICULAR']),
  postulanteId: z.string().uuid().optional(),
  vehiculoId: z.string().uuid().optional(),
  resultado: z.enum(['AUTORIZADO', 'DENEGADO']),
  motivoDenegacion: z.string().optional(),
  garita: z.string().optional(),
  alcotestResultado: z.string().optional(),
});

export class GaritaController {
  static async validarQR(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo } = validarSchema.parse(req.body);
      const resultado = await GaritaService.validarAcceso(codigo);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }

  static async registrarIngreso(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registrarSchema.parse(req.body);
      const guardiaNombre = req.user?.nombre || 'Oficial de Garita';
      const guardiaId = req.user?.id;

      const log = await GaritaService.registrarIngreso({
        ...parsed,
        guardiaNombre,
        guardiaId,
      });

      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  }

  static async getPadronOffline(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await GaritaService.getPadronOffline();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async sincronizarOffline(req: Request, res: Response, next: NextFunction) {
    try {
      const lote = Array.isArray(req.body.lote) ? req.body.lote : [];
      const guardiaNombre = req.user?.nombre || 'Oficial de Garita';
      const guardiaId = req.user?.id;
      const result = await GaritaService.sincronizarOffline(lote, guardiaId, guardiaNombre);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getHistorial(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const historial = await GaritaService.getHistorial(limit);
      res.json(historial);
    } catch (err) {
      next(err);
    }
  }
}
