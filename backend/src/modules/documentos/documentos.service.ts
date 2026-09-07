import { query } from '../../config/db';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

export class DocumentosService {
  static async getExpedientePostulante(postulanteId: string) {
    // 1. Obtener postulante
    const postRes = await query(`SELECT * FROM postulantes WHERE id = $1`, [postulanteId]);
    if (postRes.rows.length === 0) {
      throw new Error('Postulante no encontrado.');
    }
    const postulante = postRes.rows[0];

    // 2. Obtener documentos versionados
    const docsRes = await query(
      `SELECT * FROM expediente_documentos 
       WHERE postulante_id = $1 
       ORDER BY fase ASC, version DESC`,
      [postulanteId]
    );

    // 3. Obtener bitácora de auditoría
    const auditRes = await query(
      `SELECT * FROM auditoria_vistos_buenos 
       WHERE postulante_id = $1 
       ORDER BY fecha_registro DESC`,
      [postulanteId]
    );

    return {
      postulante,
      documentos: docsRes.rows,
      historialAuditoria: auditRes.rows,
    };
  }

  static async getDocumentoStream(documentoId: string) {
    const res = await query(`SELECT * FROM expediente_documentos WHERE id = $1`, [documentoId]);
    if (res.rows.length === 0) {
      throw new Error('Documento no encontrado.');
    }
    const doc = res.rows[0];

    const filePath = path.resolve(env.UPLOAD_DIR, path.basename(doc.archivo_url));
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo físico no encontrado en el servidor.');
    }

    return {
      doc,
      filePath,
      fileName: doc.nombre_archivo,
    };
  }
}
