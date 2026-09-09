import { query } from '../../config/db';

export class PostulantesService {
  static async getMisPostulantes(empresaId?: string | null) {
    let sql = `
      SELECT 
        p.id,
        p.nombres,
        p.apellidos,
        p.tipo_documento,
        p.numero_documento,
        p.cargo,
        p.fase_actual,
        p.estado_global,
        p.tipo_pase,
        p.vigencia_inicio,
        p.vigencia_fin,
        p.sctr_vencimiento,
        p.emo_vencimiento,
        p.cv_url,
        e.razon_social as empresa_nombre,
        (
          SELECT ef.observaciones 
          FROM evaluaciones_fase ef 
          WHERE ef.postulante_id = p.id 
          ORDER BY ef.creado_en DESC 
          LIMIT 1
        ) as ultima_observacion,
        (
          SELECT ef.archivo_adjunto_url 
          FROM evaluaciones_fase ef 
          WHERE ef.postulante_id = p.id 
          ORDER BY ef.creado_en DESC 
          LIMIT 1
        ) as ultimo_archivo
      FROM postulantes p
      JOIN empresas_contratistas e ON p.empresa_id = e.id
    `;
    const params: any[] = [];

    if (empresaId) {
      sql += ` WHERE p.empresa_id = $1`;
      params.push(empresaId);
    }

    sql += ` ORDER BY p.actualizado_en DESC`;
    const res = await query(sql, params);
    return res.rows;
  }

  static async getById(id: string) {
    const res = await query(
      `SELECT p.*, e.razon_social as empresa_nombre
       FROM postulantes p
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       WHERE p.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new Error('Postulante no encontrado.');
    }

    // Historial de evaluaciones
    const evaluaciones = await query(
      `SELECT ef.*, u.nombre as evaluador_nombre, u.rol as evaluador_rol
       FROM evaluaciones_fase ef
       LEFT JOIN usuarios u ON ef.evaluador_id = u.id
       WHERE ef.postulante_id = $1
       ORDER BY ef.creado_en ASC`,
      [id]
    );

    return {
      ...res.rows[0],
      historial_evaluaciones: evaluaciones.rows,
    };
  }

  static async create(empresaId: string, data: {
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    telefono?: string;
    email?: string;
    grupo_sanguineo?: string;
    tipo_pase?: string;
    vigencia_inicio?: string;
    vigencia_fin?: string;
  }, cvUrl?: string) {
    // 1. Verificar si está en LISTA NEGRA
    const checkListaNegra = await query(
      `SELECT * FROM lista_negra WHERE numero_documento = $1`,
      [data.numero_documento]
    );

    if (checkListaNegra.rows.length > 0) {
      throw new Error(
        `El postulante ${data.nombres} ${data.apellidos} (Doc: ${data.numero_documento}) figura en LISTA NEGRA por motivo: ${checkListaNegra.rows[0].motivo}`
      );
    }

    const res = await query(
      `INSERT INTO postulantes 
       (empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, telefono, email, grupo_sanguineo, tipo_pase, vigencia_inicio, vigencia_fin, cv_url, fase_actual, estado_global)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'FASE_1', 'EN_PROCESO')
       RETURNING *`,
      [
        empresaId,
        data.tipo_documento || 'DNI',
        data.numero_documento,
        data.nombres,
        data.apellidos,
        data.cargo,
        data.telefono || null,
        data.email || null,
        data.grupo_sanguineo || 'O+',
        data.tipo_pase || 'PERMANENTE',
        data.vigencia_inicio || null,
        data.vigencia_fin || null,
        cvUrl || null,
      ]
    );

    return res.rows[0];
  }

  static async subsanar(id: string, nuevoArchivoUrl: string, notasSubsanacion?: string) {
    await query(
      `UPDATE postulantes 
       SET estado_global = 'EN_PROCESO', actualizado_en = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    // Marcar última observación como subsanada
    await query(
      `UPDATE evaluaciones_fase 
       SET subsanado = true, archivo_adjunto_url = COALESCE($2, archivo_adjunto_url)
       WHERE id = (
         SELECT id FROM evaluaciones_fase WHERE postulante_id = $1 ORDER BY creado_en DESC LIMIT 1
       )`,
      [id, nuevoArchivoUrl]
    );

    return { mensaje: 'Observación subsanada con éxito y enviada a revisión.' };
  }
}
