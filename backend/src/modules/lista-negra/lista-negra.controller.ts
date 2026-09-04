import { Request, Response, NextFunction } from 'express';
import { ListaNegraService } from './lista-negra.service';

export class ListaNegraController {
  static async getBloqueados(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ListaNegraService.getBloqueados();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}
