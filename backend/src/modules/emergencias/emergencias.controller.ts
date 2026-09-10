import { Request, Response, NextFunction } from 'express';
import { query } from '../../config/db';

export class EmergenciasController {
  // 1. Autorizar bajada anticipada antes de los 14 días (Médico de guardia o RRHH/Super Admin)
  static async autorizarBajada(req: Request, res: Response, next: NextFunction) {
    try {
      const { postulanteId, tipoEmergencia, motivoDetalle } = req.body;
      const autorizadoPor = `${req.user?.nombre || 'Autorizador'} (${req.user?.rol || 'SUPER_ADMIN'})`;

      if (!postulanteId || !motivoDetalle) {
        return res.status(400).json({ error: 'postulanteId y motivoDetalle son obligatorios' });
      }

      const result = await query(
        `INSERT INTO bajas_emergencia 
         (postulante_id, tipo_emergencia, motivo_detalle, autorizado_por, estado)
         VALUES ($1, $2, $3, $4, 'AUTORIZADO')
         RETURNING *`,
        [postulanteId, tipoEmergencia || 'MEDICA_TRABAJADOR', motivoDetalle, autorizadoPor]
      );

      res.status(201).json({
        message: 'Bajada anticipada por emergencia autorizada con éxito.',
        baja: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }

  // 2. Listar emergencias activas/autorizadas para verificación en Garita
  static async getEmergenciasActivas(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT b.*, p.nombres, p.apellidos, p.numero_documento, p.cargo, e.razon_social as empresa_nombre
         FROM bajas_emergencia b
         JOIN postulantes p ON b.postulante_id = p.id
         JOIN empresas_contratistas e ON p.empresa_id = e.id
         WHERE b.estado = 'AUTORIZADO'
         ORDER BY b.creado_en DESC`
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }

  // 3. Ejecutar salida en Garita (marca como EJECUTADO_EN_GARITA evitando abandono 14x7)
  static async ejecutarSalidaGarita(req: Request, res: Response, next: NextFunction) {
    try {
      const { bajaId, numeroDocumento } = req.body;

      let sql = `UPDATE bajas_emergencia SET estado = 'EJECUTADO_EN_GARITA', fecha_hora_salida = CURRENT_TIMESTAMP WHERE `;
      const params: any[] = [];

      if (bajaId) {
        sql += `id = $1 RETURNING *`;
        params.push(bajaId);
      } else if (numeroDocumento) {
        sql += `postulante_id = (SELECT id FROM postulantes WHERE numero_documento = $1) AND estado = 'AUTORIZADO' RETURNING *`;
        params.push(numeroDocumento);
      } else {
        return res.status(400).json({ error: 'Debe enviar bajaId o numeroDocumento' });
      }

      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No se encontró autorización de bajada activa para este trabajador' });
      }

      res.json({
        message: 'Salida de emergencia registrada y validada en Garita sin cómputo de abandono.',
        baja: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
}
