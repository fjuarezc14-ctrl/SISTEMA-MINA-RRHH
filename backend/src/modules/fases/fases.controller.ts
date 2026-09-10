import { Request, Response, NextFunction } from 'express';
import { FasesService } from './fases.service';
import { z } from 'zod';

const evaluarSchema = z.object({
  postulanteId: z.string().uuid(),
  decision: z.enum(['APROBAR', 'OBSERVAR', 'NO_APTO']),
  observaciones: z.string().optional(),
  nota: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).max(20).optional()),
  fechaInicio: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  clinicaOrigen: z.string().optional(),
  numeroPoliza: z.string().optional(),
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
      const evaluadorNombre = req.user?.nombre;
      const evaluadorColegiatura = req.user?.colegiatura;
      const areaEvaluadora = req.user?.area_responsable || req.user?.rol;
      const archivoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.archivo_url;

      const result = await FasesService.evaluarFase({
        postulanteId: parsed.postulanteId,
        fase: fase.toUpperCase(),
        evaluadorId,
        evaluadorNombre,
        evaluadorColegiatura: req.user?.colegiatura || undefined,
        areaEvaluadora,
        decision: parsed.decision,
        observaciones: parsed.observaciones,
        nota: parsed.nota,
        fechaInicio: parsed.fechaInicio,
        fechaVencimiento: parsed.fechaVencimiento,
        clinicaOrigen: parsed.clinicaOrigen,
        numeroPoliza: parsed.numeroPoliza,
        archivoUrl,
        motivoListaNegra: parsed.motivoListaNegra,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
