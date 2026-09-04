import { Request, Response, NextFunction } from 'express';
import { FasesService } from './fases.service';
import { z } from 'zod';

const evaluarSchema = z.object({
  postulanteId: z.string().uuid(),
  decision: z.enum(['APROBAR', 'OBSERVAR', 'NO_APTO']),
  observaciones: z.string().optional(),
  nota: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).max(20).optional()),
  fechaVencimiento: z.string().optional(),
  motivoListaNegra: z.string().optional(),
});

export class FasesController {
  static async getCandidatosFase(req: Request, res: Response, next: NextFunction) {
    try {
      const { fase } = req.params;
      const data = await FasesService.getCandidatosPorFase(fase.toUpperCase());
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async evaluarFase(req: Request, res: Response, next: NextFunction) {
    try {
      const { fase } = req.params;
      const parsed = evaluarSchema.parse(req.body);
      const evaluadorId = req.user?.id;
      const archivoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.archivo_url;

      const result = await FasesService.evaluarFase({
        postulanteId: parsed.postulanteId,
        fase: fase.toUpperCase(),
        evaluadorId,
        decision: parsed.decision,
        observaciones: parsed.observaciones,
        nota: parsed.nota,
        fechaVencimiento: parsed.fechaVencimiento,
        archivoUrl,
        motivoListaNegra: parsed.motivoListaNegra,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
