import { Request, Response, NextFunction } from 'express';
import { MetricasService } from './metricas.service';

export class MetricasController {
  static async getSlas(req: Request, res: Response, next: NextFunction) {
    try {
      const slas = await MetricasService.obtenerSlasPorArea();
      res.json(slas);
    } catch (err) {
      next(err);
    }
  }

  static async getRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const ranking = await MetricasService.obtenerRankingContratistas();
      res.json(ranking);
    } catch (err) {
      next(err);
    }
  }

  static async exportarExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await MetricasService.generarCsvSabana();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sabana_acreditacion_mina_valetec.csv"');
      // BOM para compatibilidad con Microsoft Excel en español
      res.send('\uFEFF' + csv);
    } catch (err) {
      next(err);
    }
  }
}
