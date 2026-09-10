import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/db';

export class SegurosController {
  // 1. Obtener historial de pólizas y exámenes clínicos de un postulante
  static async getHistorialSeguros(req: Request, res: Response, next: NextFunction) {
    try {
      const { postulanteId } = req.params;
      const result = await query(
        `SELECT * FROM historial_seguros 
         WHERE postulante_id = $1 
         ORDER BY creado_en DESC`,
        [postulanteId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }

  // 2. Registrar una nueva póliza o examen en el histórico
  static async agregarPolizaHistorial(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        postulanteId,
        tipoSeguro,
        clinicaOrigen,
        numeroPoliza,
        fechaInicio,
        fechaVencimiento,
        archivoUrl,
      } = req.body;

      if (!postulanteId || !clinicaOrigen) {
        return res.status(400).json({ error: 'postulanteId y clinicaOrigen son obligatorios' });
      }

      const result = await query(
        `INSERT INTO historial_seguros 
         (postulante_id, tipo_seguro, clinica_origen, numero_poliza, fecha_inicio, fecha_vencimiento, archivo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          postulanteId,
          tipoSeguro || 'SCTR_SALUD_PENSION',
          clinicaOrigen,
          numeroPoliza || null,
          fechaInicio || null,
          fechaVencimiento || null,
          archivoUrl || null,
        ]
      );

      res.status(201).json({
        message: 'Registro de póliza añadido al histórico con éxito.',
        registro: result.rows[0],
      });
    } catch (err) {
      next(err);
    }
  }
}
