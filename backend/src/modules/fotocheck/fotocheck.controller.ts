import { Request, Response, NextFunction } from 'express';
import { FotocheckService } from './fotocheck.service';

export class FotocheckController {
  static async getPendientes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FotocheckService.getPendientes();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getByPostulanteId(req: Request, res: Response, next: NextFunction) {
    try {
      const { postulanteId } = req.params;
      const data = await FotocheckService.getByPostulanteId(postulanteId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async marcarImpreso(req: Request, res: Response, next: NextFunction) {
    try {
      const { postulanteId } = req.params;
      const usuarioId = req.user?.id || 'b7777777-7777-7777-7777-777777777777';
      const result = await FotocheckService.marcarImpreso(postulanteId, usuarioId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
