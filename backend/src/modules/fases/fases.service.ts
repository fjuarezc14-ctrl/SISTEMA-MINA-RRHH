import { query } from '../../config/db';
import { ListaNegraService } from '../lista-negra/lista-negra.service';

export class FasesService {
  static async getCandidatosPorFase(fase: string) {
    const res = await query(
      `SELECT 
         p.id,
         p.tipo_documento,
         p.numero_documento,
         p.nombres,
         p.apellidos,
         p.cargo,
         p.fase_actual,
         p.estado_global,
         p.cv_url,
         e.razon_social as empresa_nombre,
         (
           SELECT json_build_object(
             'nota', ef.nota,
             'fecha_vencimiento', ef.fecha_vencimiento,
             'archivo_url', ef.archivo_adjunto_url,
             'observaciones', ef.observaciones
           )
           FROM evaluaciones_fase ef
           WHERE ef.postulante_id = p.id
           ORDER BY ef.creado_en DESC
           LIMIT 1
         ) as ultima_evaluacion
       FROM postulantes p
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       WHERE p.fase_actual = $1 AND p.estado_global != 'NO_APTO'
       ORDER BY p.creado_en ASC`,
      [fase]
    );

    return res.rows;
  }

  static async evaluarFase(params: {
    postulanteId: string;
    fase: string;
    evaluadorId?: string;
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO';
    observaciones?: string;
    nota?: number;
    fechaVencimiento?: string;
    archivoUrl?: string;
    motivoListaNegra?: string;
  }) {
    const {
      postulanteId,
      fase,
      evaluadorId,
      decision,
      observaciones,
      nota,
      fechaVencimiento,
      archivoUrl,
      motivoListaNegra,
    } = params;

    // Obtener datos del postulante
    const postRes = await query(`SELECT * FROM postulantes WHERE id = $1`, [postulanteId]);
    if (postRes.rows.length === 0) {
      throw new Error('Postulante no encontrado.');
    }
    const postulante = postRes.rows[0];

    // 1. CASO NO APTO: Inclusión automática en Lista Negra y Bloqueo
    if (decision === 'NO_APTO') {
      const motivoFinal = motivoListaNegra || observaciones || 'No Apto por evaluación en ' + fase;
      const tipoFalta = fase === 'FASE_2' ? 'MEDICA_CRITICA' : 'ANTECEDENTES_PENALES';

      await ListaNegraService.bloquear({
        numero_documento: postulante.numero_documento,
        tipo_documento: postulante.tipo_documento,
        nombres: postulante.nombres,
        apellidos: postulante.apellidos,
        motivo: motivoFinal,
        tipo_falta: tipoFalta,
        reportado_por: evaluadorId,
      });

      await query(
        `UPDATE postulantes 
         SET estado_global = 'NO_APTO', actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [postulanteId]
      );

      await query(
        `INSERT INTO evaluaciones_fase 
         (postulante_id, fase, evaluador_id, estado_resultado, observaciones, archivo_adjunto_url)
         VALUES ($1, $2, $3, 'NO_APTO', $4, $5)`,
        [postulanteId, fase, evaluadorId || null, motivoFinal, archivoUrl || null]
      );

      return { estado: 'NO_APTO', mensaje: 'Postulante dictaminado NO APTO e ingresado a Lista Negra.' };
    }

    // 2. CASO OBSERVADO (Subsanable por el contratista)
    if (decision === 'OBSERVAR') {
      await query(
        `UPDATE postulantes 
         SET estado_global = 'OBSERVADO', actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [postulanteId]
      );

      await query(
        `INSERT INTO evaluaciones_fase 
         (postulante_id, fase, evaluador_id, estado_resultado, observaciones, nota, fecha_vencimiento, archivo_adjunto_url)
         VALUES ($1, $2, $3, 'OBSERVADO', $4, $5, $6, $7)`,
        [
          postulanteId,
          fase,
          evaluadorId || null,
          observaciones || 'Observado en ' + fase,
          nota || null,
          fechaVencimiento || null,
          archivoUrl || null,
        ]
      );

      return { estado: 'OBSERVADO', mensaje: 'Postulante observado. Se notificó a la contratista para subsanación.' };
    }

    // 3. CASO APROBADO: Pasa a la siguiente fase
    let siguienteFase = 'FINALIZADO';
    let estadoGlobal = 'EN_PROCESO';

    switch (fase) {
      case 'FASE_1':
        siguienteFase = 'FASE_2';
        break;
      case 'FASE_2':
        siguienteFase = 'FASE_3';
        break;
      case 'FASE_3':
        siguienteFase = 'FASE_4';
        break;
      case 'FASE_4':
        siguienteFase = 'FASE_5';
        break;
      case 'FASE_5':
        siguienteFase = 'FOTOCHECK';
        estadoGlobal = 'APROBADO_TOTAL';
        // Generar registro de Fotocheck listo para imprimir
        await query(
          `INSERT INTO fotochecks (postulante_id, codigo_credencial, codigo_qr, fecha_emision, fecha_vencimiento)
           VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year')
           ON CONFLICT (postulante_id) DO NOTHING`,
          [
            postulanteId,
            `VT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            `QR-VT-${postulante.numero_documento}-${Date.now()}`,
          ]
        );
        break;
    }

    await query(
      `UPDATE postulantes 
       SET fase_actual = $1, estado_global = $2, actualizado_en = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [siguienteFase, estadoGlobal, postulanteId]
    );

    await query(
      `INSERT INTO evaluaciones_fase 
       (postulante_id, fase, evaluador_id, estado_resultado, nota, fecha_vencimiento, archivo_adjunto_url, observaciones)
       VALUES ($1, $2, $3, 'APROBADO', $4, $5, $6, $7)`,
      [
        postulanteId,
        fase,
        evaluadorId || null,
        nota || null,
        fechaVencimiento || null,
        archivoUrl || null,
        observaciones || 'Aprobado satisfactoriamente.',
      ]
    );

    return {
      estado: 'APROBADO',
      siguienteFase,
      mensaje: `Fase superada con éxito. Avanza a ${siguienteFase}.`,
    };
  }
}
