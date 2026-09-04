import { query } from '../../config/db';

export class ListaNegraService {
  static async getBloqueados() {
    const res = await query(
      `SELECT ln.*, u.nombre as reportado_por_nombre 
       FROM lista_negra ln
       LEFT JOIN usuarios u ON ln.reportado_por = u.id
       ORDER BY ln.fecha_registro DESC`
    );
    return res.rows;
  }

  static async bloquear(data: {
    numero_documento: string;
    tipo_documento?: string;
    nombres: string;
    apellidos: string;
    motivo: string;
    tipo_falta: string;
    estado_bloqueo?: string;
    reportado_por?: string;
  }) {
    const res = await query(
      `INSERT INTO lista_negra 
       (numero_documento, tipo_documento, nombres, apellidos, motivo, tipo_falta, estado_bloqueo, reportado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (numero_documento) DO UPDATE 
       SET motivo = EXCLUDED.motivo, tipo_falta = EXCLUDED.tipo_falta, fecha_registro = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        data.numero_documento,
        data.tipo_documento || 'DNI',
        data.nombres,
        data.apellidos,
        data.motivo,
        data.tipo_falta,
        data.estado_bloqueo || 'PERMANENTE',
        data.reportado_por || null,
      ]
    );

    return res.rows[0];
  }
}
