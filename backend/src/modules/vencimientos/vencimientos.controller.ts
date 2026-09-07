import { Request, Response, NextFunction } from 'express';
import { VencimientosService } from './vencimientos.service';

export class VencimientosController {
  static async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const resumen = await VencimientosService.obtenerResumen();
      res.json(resumen);
    } catch (err) {
      next(err);
    }
  }

  static async ejecutarRevision(req: Request, res: Response, next: NextFunction) {
    try {
      const suspendidos = await VencimientosService.ejecutarRevisionVencimientos();
      res.json({
        mensaje: 'Revisión de vigencia ejecutada correctamente.',
        suspendidos,
      });
    } catch (err) {
      next(err);
    }
  }
}
