import { query } from '../../config/db';

export class FotocheckService {
  static async getPendientes() {
    const res = await query(
      `SELECT 
         fc.*,
         p.nombres,
         p.apellidos,
         p.tipo_documento,
         p.numero_documento,
         p.cargo,
         p.grupo_sanguineo,
         e.razon_social as empresa_nombre
       FROM fotochecks fc
       JOIN postulantes p ON fc.postulante_id = p.id
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       WHERE fc.impreso = false
       ORDER BY fc.creado_en DESC`
    );
    return res.rows;
  }

  static async getByPostulanteId(postulanteId: string) {
    const res = await query(
      `SELECT 
         fc.*,
         p.nombres,
         p.apellidos,
         p.tipo_documento,
         p.numero_documento,
         p.cargo,
         p.grupo_sanguineo,
         e.razon_social as empresa_nombre
       FROM fotochecks fc
       JOIN postulantes p ON fc.postulante_id = p.id
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       WHERE fc.postulante_id = $1`,
      [postulanteId]
    );

    if (res.rows.length === 0) {
      throw new Error('Fotocheck no encontrado para este postulante.');
    }

    return res.rows[0];
  }

  static async marcarImpreso(postulanteId: string, usuarioId: string) {
    const res = await query(
      `UPDATE fotochecks 
       SET impreso = true, fecha_impresion = CURRENT_TIMESTAMP, impreso_por = $2
       WHERE postulante_id = $1
       RETURNING *`,
      [postulanteId, usuarioId]
    );

    if (res.rows.length === 0) {
      throw new Error('No se pudo marcar como impreso el fotocheck.');
    }

    return res.rows[0];
  }
}
