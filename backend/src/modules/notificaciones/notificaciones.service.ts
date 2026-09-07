import { query } from '../../config/db';

export class NotificacionesService {
  static async getNotificaciones(usuarioId?: string | null, empresaId?: string | null) {
    let sql = `SELECT * FROM notificaciones WHERE 1=1`;
    const params: any[] = [];

    if (usuarioId && empresaId) {
      params.push(usuarioId, empresaId);
      sql += ` AND (usuario_id = $1 OR empresa_id = $2 OR (usuario_id IS NULL AND empresa_id IS NULL))`;
    } else if (usuarioId) {
      params.push(usuarioId);
      sql += ` AND (usuario_id = $1 OR usuario_id IS NULL)`;
    } else if (empresaId) {
      params.push(empresaId);
      sql += ` AND (empresa_id = $1 OR empresa_id IS NULL)`;
    }

    sql += ` ORDER BY creado_en DESC LIMIT 30`;

    const res = await query(sql, params);
    return res.rows;
  }

  static async marcarLeida(id: string) {
    const res = await query(
      `UPDATE notificaciones SET leido = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  static async crearNotificacion(params: {
    usuarioId?: string;
    empresaId?: string;
    titulo: string;
    mensaje: string;
    tipo?: 'INFO' | 'OBSERVACION' | 'VENCIMIENTO_SCTR' | 'ALERTA_CRITICA' | 'APROBADO';
  }) {
    const res = await query(
      `INSERT INTO notificaciones (usuario_id, empresa_id, titulo, mensaje, tipo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        params.usuarioId || null,
        params.empresaId || null,
        params.titulo,
        params.mensaje,
        params.tipo || 'INFO',
      ]
    );
    return res.rows[0];
  }
}
