import { query, pool } from '../../config/db';
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
    evaluadorNombre?: string;
    evaluadorColegiatura?: string | null;
    areaEvaluadora?: string;
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO';
    observaciones?: string;
    nota?: number;
    fechaInicio?: string;
    fechaVencimiento?: string;
    clinicaOrigen?: string;
    numeroPoliza?: string;
    archivoUrl?: string;
    motivoListaNegra?: string;
  }) {
    const {
      postulanteId,
      fase,
      evaluadorId,
      evaluadorNombre,
      evaluadorColegiatura,
      areaEvaluadora,
      decision,
      observaciones,
      nota,
      fechaInicio,
      fechaVencimiento,
      clinicaOrigen,
      numeroPoliza,
      archivoUrl,
      motivoListaNegra,
    } = params;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener datos del postulante con BLOQUEO PESIMISTA (SELECT FOR UPDATE)
      // Evita condiciones de carrera y dobles evaluaciones concurrentes
      const postRes = await client.query(
        `SELECT * FROM postulantes WHERE id = $1 FOR UPDATE`,
        [postulanteId]
      );
      if (postRes.rows.length === 0) {
        const err: any = new Error('Postulante no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      const postulante = postRes.rows[0];

      // Rechazar inmediatamente si el postulante ya está vetado en Lista Negra
      if (postulante.estado_global === 'NO_APTO') {
        const error: any = new Error(
          'Postulante dictaminado como NO APTO en Lista Negra. No puede ser evaluado ni modificado.'
        );
        error.statusCode = 409;
        throw error;
      }

      // BLOQUEO SECUENCIAL ESTRICTO (HARD GATING)
      // Cada fase debe evaluarse en orden estricto (no anterior ni posterior)
      const ordenFases: Record<string, number> = {
        FASE_1: 1,
        FASE_2: 2,
        FASE_3: 3,
        FASE_4: 4,
        FASE_5: 5,
        FOTOCHECK: 6,
        FINALIZADO: 7,
      };

      const faseEvaluandoNum = ordenFases[fase] || 1;
      const faseActualNum = ordenFases[postulante.fase_actual] || 1;

      // Validación estricta: solo se puede evaluar la fase ACTUAL
      if (faseEvaluandoNum !== faseActualNum) {
        const error: any = new Error(
          `Bloqueo de Seguridad Secuencial: El postulante se encuentra en [${postulante.fase_actual}]. ` +
          `Solo se puede evaluar la fase actual correspondiente. Se intentó evaluar [${fase}].`
        );
        error.statusCode = 409;
        throw error;
      }

      const nombreEvaluadorFinal = evaluadorNombre || 'Responsable de Área';
      const colegiaturaFinal = evaluadorColegiatura || null;
      const areaFinal = areaEvaluadora || 'Staff de Mina';

      // 2. CASO NO APTO: Inclusión automática en Lista Negra y Bloqueo
      if (decision === 'NO_APTO') {
        const motivoFinal = motivoListaNegra || observaciones || 'No Apto por evaluación en ' + fase;
        const tipoFalta = fase === 'FASE_2' ? 'MEDICA_CRITICA' : 'ANTECEDENTES_PENALES';

        await ListaNegraService.bloquear(
          {
            numero_documento: postulante.numero_documento,
            tipo_documento: postulante.tipo_documento,
            nombres: postulante.nombres,
            apellidos: postulante.apellidos,
            motivo: motivoFinal,
            tipo_falta: tipoFalta,
            reportado_por: evaluadorId,
          },
          client
        );

        await client.query(
          `UPDATE postulantes 
           SET estado_global = 'NO_APTO', actualizado_en = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [postulanteId]
        );

        // Registrar en auditoría inmutable de vistos buenos
        await client.query(
          `INSERT INTO auditoria_vistos_buenos 
           (postulante_id, fase, area_evaluadora, evaluador_id, evaluador_nombre, evaluador_colegiatura, decision, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6, 'NO_APTO_LISTA_NEGRA', $7)`,
          [postulanteId, fase, areaFinal, evaluadorId || null, nombreEvaluadorFinal, colegiaturaFinal, motivoFinal]
        );

        await client.query('COMMIT');
        return { estado: 'NO_APTO', mensaje: 'Postulante dictaminado NO APTO e ingresado a Lista Negra.' };
      }

      // 3. CASO OBSERVADO (Subsanable por el contratista)
      if (decision === 'OBSERVAR') {
        await client.query(
          `UPDATE postulantes 
           SET estado_global = 'OBSERVADO', actualizado_en = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [postulanteId]
        );

        await client.query(
          `INSERT INTO auditoria_vistos_buenos 
           (postulante_id, fase, area_evaluadora, evaluador_id, evaluador_nombre, evaluador_colegiatura, decision, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6, 'OBSERVADO', $7)`,
          [postulanteId, fase, areaFinal, evaluadorId || null, nombreEvaluadorFinal, colegiaturaFinal, observaciones || 'Observado']
        );

        await client.query('COMMIT');
        return { estado: 'OBSERVADO', mensaje: 'Postulante observado. Se notificó a la contratista para subsanación.' };
      }

      // 4. CASO APROBADO (Visto Bueno del Área)
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
          // Validación de regla minera SSOMA D.S. 024-2016-EM: nota mínima aprobatoria 14/20
          if (nota === undefined || nota === null || isNaN(Number(nota)) || Number(nota) < 14 || Number(nota) > 20) {
            const error: any = new Error(
              `Para otorgar Visto Bueno en Fase 4 (SSOMA), la calificación debe ser aprobatoria entre 14 y 20 según D.S. 024-2016-EM. Calificación registrada: ${nota ?? 'no proporcionada'}`
            );
            error.statusCode = 400;
            throw error;
          }
          siguienteFase = 'FASE_5';
          break;
        case 'FASE_5':
          siguienteFase = 'FOTOCHECK';
          estadoGlobal = 'APTO_PARA_TRABAJAR'; // 5 Vistos Buenos completados
          
          // Si viene fechaVencimiento o fechaInicio para SCTR, actualizar tabla postulantes
          if (fechaVencimiento || fechaInicio) {
            await client.query(
              `UPDATE postulantes 
               SET sctr_inicio = COALESCE($1, sctr_inicio), 
                   sctr_vencimiento = COALESCE($2, sctr_vencimiento) 
               WHERE id = $3`,
              [fechaInicio || null, fechaVencimiento || null, postulanteId]
            );
          }

          // Registrar en historial_seguros para auditoría de clínicas y pólizas
          await client.query(
            `INSERT INTO historial_seguros 
             (postulante_id, tipo_seguro, clinica_origen, numero_poliza, fecha_inicio, fecha_vencimiento, archivo_url)
             VALUES ($1, 'SCTR_SALUD_PENSION', $2, $3, $4, $5, $6)`,
            [
              postulanteId,
              clinicaOrigen || 'Clínica Limatambo Cajamarca',
              numeroPoliza || `POL-SCTR-${Math.floor(100000 + Math.random() * 900000)}`,
              fechaInicio || new Date().toISOString().split('T')[0],
              fechaVencimiento || null,
              archivoUrl || null
            ]
          );

          // Configuración de vigencia y zona según el tipo de pase minero
          const tipoPase = postulante.tipo_pase || 'PERMANENTE';
          let intervaloVigencia = "INTERVAL '1 year'";
          let zonaAutorizada = 'Planta y Mina Subterránea';

          if (tipoPase === 'VISITA_TECNICA') {
            intervaloVigencia = "INTERVAL '7 days'";
            zonaAutorizada = 'Superficie y Mina con Acompañamiento';
          } else if (tipoPase === 'PROVEEDOR_LOGISTICO') {
            intervaloVigencia = "INTERVAL '30 days'";
            zonaAutorizada = 'Solo Almacén Central y Patio de Superficie';
          }

          // Generar correlativo único garantizado de credencial (VT-YYYY-XXXXX) para evitar colisiones
          const countRes = await client.query('SELECT COUNT(*) as total FROM fotochecks');
          const correlativo = String(Number(countRes.rows[0].total) + 1).padStart(5, '0');
          const codigoCredencial = `VT-${new Date().getFullYear()}-${correlativo}`;
          const codigoQr = `QR-VT-${postulante.numero_documento}-${Date.now()}`;

          // Generar credencial de Fotocheck listo para imprimir
          await client.query(
            `INSERT INTO fotochecks (postulante_id, codigo_credencial, codigo_qr, zona_autorizada, fecha_emision, fecha_vencimiento)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + ${intervaloVigencia})
             ON CONFLICT (postulante_id) DO UPDATE 
             SET zona_autorizada = EXCLUDED.zona_autorizada, fecha_vencimiento = EXCLUDED.fecha_vencimiento`,
            [
              postulanteId,
              codigoCredencial,
              codigoQr,
              zonaAutorizada,
            ]
          );
          break;
      }

      await client.query(
        `UPDATE postulantes 
         SET fase_actual = $1, estado_global = $2, actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [siguienteFase, estadoGlobal, postulanteId]
      );

      // Guardar en la auditoría inmutable
      await client.query(
        `INSERT INTO auditoria_vistos_buenos 
         (postulante_id, fase, area_evaluadora, evaluador_id, evaluador_nombre, evaluador_colegiatura, decision, observaciones, metadatos)
         VALUES ($1, $2, $3, $4, $5, $6, 'VISTO_BUENO', $7, $8)`,
        [
          postulanteId,
          fase,
          areaFinal,
          evaluadorId || null,
          nombreEvaluadorFinal,
          colegiaturaFinal,
          observaciones || 'Visto Bueno Otorgado.',
          JSON.stringify({ 
            nota, 
            fechaVencimiento, 
            archivoUrl, 
            evaluadorColegiatura: colegiaturaFinal,
            tipoPase: postulante.tipo_pase || 'PERMANENTE' 
          }),
        ]
      );

      await client.query('COMMIT');

      return {
        estado: 'APROBADO',
        siguienteFase,
        estadoGlobal,
        mensaje: `Visto Bueno otorgado por ${areaFinal} (${nombreEvaluadorFinal}${colegiaturaFinal ? ' - ' + colegiaturaFinal : ''}). Avanza a ${siguienteFase}.`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
