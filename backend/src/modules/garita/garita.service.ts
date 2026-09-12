import { query, pool } from '../../config/db';

export class GaritaService {
  static async validarAcceso(codigo: string) {
    const cleanCode = codigo.trim().toUpperCase();

    // 1. Buscar si corresponde a un postulante / trabajador por QR, credencial o DNI
    const postRes = await query(
      `SELECT 
         p.id,
         p.tipo_documento,
         p.numero_documento,
         p.nombres,
         p.apellidos,
         p.cargo,
         p.tipo_pase,
         p.vigencia_inicio,
         p.vigencia_fin,
         p.fase_actual,
         p.estado_global,
         p.grupo_sanguineo,
         p.sctr_vencimiento,
         e.razon_social as empresa_nombre,
         f.codigo_credencial,
         f.codigo_qr,
         f.zona_autorizada,
         f.fecha_vencimiento as fotocheck_vencimiento
       FROM postulantes p
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       LEFT JOIN fotochecks f ON f.postulante_id = p.id
       WHERE UPPER(f.codigo_qr) = $1 
          OR UPPER(f.codigo_credencial) = $1 
          OR p.numero_documento = $1
       LIMIT 1`,
      [cleanCode]
    );

    if (postRes.rows.length > 0) {
      const p = postRes.rows[0];

      // A. Verificar Lista Negra
      const lnRes = await query(
        `SELECT motivo, tipo_falta, fecha_registro 
         FROM lista_negra 
         WHERE numero_documento = $1`,
        [p.numero_documento]
      );

      if (lnRes.rows.length > 0) {
        return {
          tipo: 'TRABAJADOR' as const,
          autorizado: false,
          motivo: `ACCESO DENEGADO: Reportado en LISTA NEGRA por ${lnRes.rows[0].tipo_falta}. Motivo: ${lnRes.rows[0].motivo}`,
          trabajador: {
            id: p.id,
            nombreCompleto: `${p.nombres} ${p.apellidos}`,
            dni: p.numero_documento,
            empresa: p.empresa_nombre,
            cargo: p.cargo,
            estado: 'LISTA_NEGRA',
          },
        };
      }

      // B. Verificar estado de acreditación (5/5 V°B°)
      if (p.estado_global !== 'APTO_PARA_TRABAJAR' && p.estado_global !== 'APROBADO_TOTAL') {
        return {
          tipo: 'TRABAJADOR' as const,
          autorizado: false,
          motivo: `ACCESO DENEGADO: Acreditación Incompleta. El trabajador se encuentra en [${p.fase_actual}] con estado [${p.estado_global}]. No cuenta con V°B° final.`,
          trabajador: {
            id: p.id,
            nombreCompleto: `${p.nombres} ${p.apellidos}`,
            dni: p.numero_documento,
            empresa: p.empresa_nombre,
            cargo: p.cargo,
            estado: p.estado_global,
          },
        };
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // C. Verificar vigencia de Credencial / Fotocheck
      if (p.fotocheck_vencimiento && new Date(p.fotocheck_vencimiento) < hoy) {
        const fVencStr = new Date(p.fotocheck_vencimiento).toLocaleDateString('es-PE');
        return {
          tipo: 'TRABAJADOR' as const,
          autorizado: false,
          motivo: `ACCESO DENEGADO: Fotocheck / Credencial VENCIDA (expiró el ${fVencStr}). Debe renovar credencial en Control de Accesos.`,
          trabajador: {
            id: p.id,
            nombreCompleto: `${p.nombres} ${p.apellidos}`,
            dni: p.numero_documento,
            empresa: p.empresa_nombre,
            cargo: p.cargo,
            estado: 'FOTOCHECK_VENCIDO',
            fotocheckVencimiento: fVencStr,
          },
        };
      }

      // D. Verificar vigencia de Pase Temporal (Visita Técnica / Proveedor Logístico)
      if (p.tipo_pase !== 'PERMANENTE' && p.vigencia_fin && new Date(p.vigencia_fin) < hoy) {
        const finStr = new Date(p.vigencia_fin).toLocaleDateString('es-PE');
        return {
          tipo: 'TRABAJADOR' as const,
          autorizado: false,
          motivo: `ACCESO DENEGADO: Pase Temporal de [${p.tipo_pase}] VENCIDO (vigencia culminó el ${finStr}). Infracción de permanencia no autorizada en campamento minero.`,
          trabajador: {
            id: p.id,
            nombreCompleto: `${p.nombres} ${p.apellidos}`,
            dni: p.numero_documento,
            empresa: p.empresa_nombre,
            cargo: p.cargo,
            estado: 'PASE_EXPIRADO',
            vigenciaFin: finStr,
          },
        };
      }

      // E. Verificar vigencia de SCTR
      if (p.sctr_vencimiento && new Date(p.sctr_vencimiento) < hoy) {
        const fechaStr = new Date(p.sctr_vencimiento).toLocaleDateString('es-PE');
        return {
          tipo: 'TRABAJADOR' as const,
          autorizado: false,
          motivo: `ACCESO DENEGADO: Póliza SCTR Salud y Pensión VENCIDA (expiró el ${fechaStr}). Requiere renovación urgente para ingresar a labores de alto riesgo.`,
          trabajador: {
            id: p.id,
            nombreCompleto: `${p.nombres} ${p.apellidos}`,
            dni: p.numero_documento,
            empresa: p.empresa_nombre,
            cargo: p.cargo,
            estado: 'SCTR_VENCIDO',
            sctrVencimiento: fechaStr,
          },
        };
      }

      // ACCESO AUTORIZADO
      const tipoPase = p.tipo_pase || 'PERMANENTE';
      let zona = p.zona_autorizada || 'Planta y Mina Subterránea';
      if (tipoPase === 'PROVEEDOR_LOGISTICO') {
        zona = 'Solo Almacén Central y Patio de Superficie';
      } else if (tipoPase === 'VISITA_TECNICA') {
        zona = 'Superficie y Mina con Acompañamiento';
      }

      return {
        tipo: 'TRABAJADOR' as const,
        autorizado: true,
        motivo: `ACCESO AUTORIZADO - Pase [${tipoPase}] Vigente y SCTR Activo`,
        trabajador: {
          id: p.id,
          nombreCompleto: `${p.nombres} ${p.apellidos}`,
          dni: p.numero_documento,
          empresa: p.empresa_nombre,
          cargo: p.cargo,
          grupoSanguineo: p.grupo_sanguineo,
          tipoPase,
          codigoCredencial: p.codigo_credencial || 'VT-2026-AUT',
          zonaAutorizada: zona,
          sctrVencimiento: p.sctr_vencimiento ? new Date(p.sctr_vencimiento).toLocaleDateString('es-PE') : 'Vigente',
          estado: 'APTO_PARA_TRABAJAR',
        },
      };
    }

    // 2. Buscar si corresponde a un Vehículo o Maquinaria Pesada
    const vehRes = await query(
      `SELECT 
         v.*,
         e.razon_social as empresa_nombre
       FROM vehiculos_maquinaria v
       JOIN empresas_contratistas e ON v.empresa_id = e.id
       WHERE UPPER(v.codigo_pase_qr) = $1 
          OR UPPER(v.placa_codigo) = $1
       LIMIT 1`,
      [cleanCode]
    );

    if (vehRes.rows.length > 0) {
      const v = vehRes.rows[0];
      const hoy = new Date();

      if (v.estado_acreditacion !== 'APTO_TRANSITO_MINA') {
        return {
          tipo: 'VEHICULO' as const,
          autorizado: false,
          motivo: `ACCESO VEHICULAR DENEGADO: Pase Vehicular no autorizado. Estado actual: [${v.estado_acreditacion}].`,
          vehiculo: {
            id: v.id,
            placa: v.placa_codigo,
            tipo: v.tipo_vehiculo,
            empresa: v.empresa_nombre,
            marcaModelo: `${v.marca} ${v.modelo}`,
            estado: v.estado_acreditacion,
          },
        };
      }

      if (new Date(v.soat_vencimiento) < hoy) {
        return {
          tipo: 'VEHICULO' as const,
          autorizado: false,
          motivo: `ACCESO VEHICULAR DENEGADO: SOAT Vencido el ${new Date(v.soat_vencimiento).toLocaleDateString('es-PE')}.`,
          vehiculo: {
            id: v.id,
            placa: v.placa_codigo,
            tipo: v.tipo_vehiculo,
            empresa: v.empresa_nombre,
            marcaModelo: `${v.marca} ${v.modelo}`,
            estado: 'SOAT_VENCIDO',
          },
        };
      }

      if (new Date(v.rev_tecnica_vencimiento) < hoy) {
        return {
          tipo: 'VEHICULO' as const,
          autorizado: false,
          motivo: `ACCESO VEHICULAR DENEGADO: Inspección / Revisión Técnica Vencida el ${new Date(v.rev_tecnica_vencimiento).toLocaleDateString('es-PE')}.`,
          vehiculo: {
            id: v.id,
            placa: v.placa_codigo,
            tipo: v.tipo_vehiculo,
            empresa: v.empresa_nombre,
            marcaModelo: `${v.marca} ${v.modelo}`,
            estado: 'REV_TECNICA_VENCIDA',
          },
        };
      }

      return {
        tipo: 'VEHICULO' as const,
        autorizado: true,
        motivo: 'PASE VEHICULAR VÁLIDO - Unidad Inspeccionada y Autorizada',
        vehiculo: {
          id: v.id,
          placa: v.placa_codigo,
          tipo: v.tipo_vehiculo,
          empresa: v.empresa_nombre,
          marcaModelo: `${v.marca} ${v.modelo}`,
          color: v.color,
          anio: v.anio_fabricacion,
          soatVencimiento: new Date(v.soat_vencimiento).toLocaleDateString('es-PE'),
          revTecnicaVencimiento: new Date(v.rev_tecnica_vencimiento).toLocaleDateString('es-PE'),
          estado: 'APTO_TRANSITO_MINA',
        },
      };
    }

    // Código no encontrado en la base de datos
    return {
      tipo: 'DESCONOCIDO' as const,
      autorizado: false,
      motivo: `CÓDIGO NO REGISTRADO: No se encontró ningún trabajador ni vehículo con el código [${cleanCode}] en la unidad minera.`,
    };
  }

  static async registrarIngreso(params: {
    tipoAcceso: 'PEATONAL_TRABAJADOR' | 'VEHICULAR';
    postulanteId?: string;
    vehiculoId?: string;
    resultado: 'AUTORIZADO' | 'DENEGADO';
    motivoDenegacion?: string;
    garita?: string;
    guardiaNombre?: string;
    guardiaId?: string;
    alcotestResultado?: string;
    sincronizadoOffline?: boolean;
    creadoEn?: string;
  }) {
    const { 
      tipoAcceso, 
      postulanteId, 
      vehiculoId, 
      resultado, 
      motivoDenegacion, 
      garita, 
      guardiaNombre, 
      guardiaId,
      alcotestResultado,
      sincronizadoOffline,
      creadoEn 
    } = params;

    let finalResultado = resultado;
    let finalMotivo = motivoDenegacion;

    // Validación estricta de seguridad minera: Tolerancia CERO al alcohol (D.S. 024-2016-EM Art. 40)
    if (alcotestResultado) {
      const alcUpper = String(alcotestResultado).toUpperCase().trim();
      let esPositivo = false;
      let detalleInfraccion = alcotestResultado;

      if (alcUpper.includes('POSITIVO') || alcUpper.includes('EBRIEDAD') || alcUpper.includes('ALCOHOL')) {
        esPositivo = true;
      } else {
        const numMatch = alcUpper.match(/(\d+(\.\d+)?)/);
        if (numMatch) {
          const valor = parseFloat(numMatch[1]);
          if (valor > 0.0) {
            esPositivo = true;
            detalleInfraccion = `${valor} g/L`;
          }
        } else if (!alcUpper.includes('NEGATIVO') && !alcUpper.includes('APTO') && !alcUpper.includes('0.00')) {
          esPositivo = true;
        }
      }

      if (esPositivo) {
        finalResultado = 'DENEGADO';
        finalMotivo = `ALCOTEST POSITIVO: [${detalleInfraccion}]. Acceso denegado automáticamente por normativa de seguridad minera (D.S. 024-2016-EM Art. 40 - Tolerancia Cero).`;
      }
    }

    const res = await query(
      `INSERT INTO accesos_garita 
       (tipo_acceso, postulante_id, vehiculo_id, resultado, motivo_denegacion, garita, guardia_nombre, guardia_id, alcotest_resultado, sincronizado_offline, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_TIMESTAMP))
       RETURNING *`,
      [
        tipoAcceso, 
        postulanteId || null, 
        vehiculoId || null, 
        finalResultado, 
        finalMotivo || null, 
        garita || 'Garita Principal - Control Mina', 
        guardiaNombre || 'Guardia de Turno', 
        guardiaId || null,
        alcotestResultado || '0.00 g/L (Apto)',
        sincronizadoOffline || false,
        creadoEn || null
      ]
    );

    return res.rows[0];
  }

  static async getPadronOffline() {
    // 1. Trabajadores autorizados
    const trabajadores = await query(
      `SELECT 
         p.id,
         p.tipo_documento,
         p.numero_documento,
         p.nombres,
         p.apellidos,
         p.cargo,
         p.tipo_pase,
         p.grupo_sanguineo,
         p.sctr_vencimiento,
         p.estado_global,
         e.razon_social as empresa_nombre,
         f.codigo_credencial,
         f.codigo_qr,
         f.zona_autorizada,
         f.fecha_vencimiento as fotocheck_vencimiento
       FROM postulantes p
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       LEFT JOIN fotochecks f ON f.postulante_id = p.id
       WHERE p.estado_global IN ('APTO_PARA_TRABAJAR', 'APROBADO_TOTAL')`
    );

    // 2. Vehículos aptos
    const vehiculos = await query(
      `SELECT 
         v.id,
         v.placa_codigo,
         v.tipo_vehiculo,
         v.marca,
         v.modelo,
         v.color,
         v.codigo_pase_qr,
         v.soat_vencimiento,
         v.rev_tecnica_vencimiento,
         v.estado_acreditacion,
         e.razon_social as empresa_nombre
       FROM vehiculos_maquinaria v
       JOIN empresas_contratistas e ON v.empresa_id = e.id
       WHERE v.estado_acreditacion = 'APTO_TRANSITO_MINA'`
    );

    // 3. Lista Negra
    const listaNegra = await query(
      `SELECT numero_documento, tipo_falta, motivo FROM lista_negra`
    );

    return {
      fechaGeneracion: new Date().toISOString(),
      unidadMinera: 'Unidad de Operaciones Mina Central - VALETEC',
      totalTrabajadores: trabajadores.rows.length,
      totalVehiculos: vehiculos.rows.length,
      trabajadores: trabajadores.rows,
      vehiculos: vehiculos.rows,
      listaNegra: listaNegra.rows,
    };
  }

  static async sincronizarOffline(lote: any[], guardiaId?: string, guardiaNombre?: string) {
    if (!Array.isArray(lote) || lote.length === 0) {
      return { totalSincronizados: 0, mensaje: 'Lote vacío o no válido.' };
    }

    const client = await pool.connect();
    const insertados = [];

    try {
      await client.query('BEGIN');

      for (const item of lote) {
        let finalResultado = item.resultado || 'AUTORIZADO';
        let finalMotivo = item.motivoDenegacion;

        // Validación estricta de alcotest también en sincronización offline
        if (item.alcotestResultado) {
          const alcUpper = String(item.alcotestResultado).toUpperCase().trim();
          let esPositivo = false;
          let detalleInfraccion = item.alcotestResultado;

          if (alcUpper.includes('POSITIVO') || alcUpper.includes('EBRIEDAD') || alcUpper.includes('ALCOHOL')) {
            esPositivo = true;
          } else {
            const numMatch = alcUpper.match(/(\d+(\.\d+)?)/);
            if (numMatch) {
              const valor = parseFloat(numMatch[1]);
              if (valor > 0.0) {
                esPositivo = true;
                detalleInfraccion = `${valor} g/L`;
              }
            } else if (!alcUpper.includes('NEGATIVO') && !alcUpper.includes('APTO') && !alcUpper.includes('0.00')) {
              esPositivo = true;
            }
          }

          if (esPositivo) {
            finalResultado = 'DENEGADO';
            finalMotivo = `ALCOTEST POSITIVO (OFFLINE): [${detalleInfraccion}]. Infracción D.S. 024-2016-EM Art. 40.`;
          }
        }

        const res = await client.query(
          `INSERT INTO accesos_garita 
           (tipo_acceso, postulante_id, vehiculo_id, resultado, motivo_denegacion, garita, guardia_nombre, guardia_id, alcotest_resultado, sincronizado_offline, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, COALESCE($10, CURRENT_TIMESTAMP))
           RETURNING *`,
          [
            item.tipoAcceso || 'PEATONAL_TRABAJADOR',
            item.postulanteId || null,
            item.vehiculoId || null,
            finalResultado,
            finalMotivo || null,
            item.garita || 'Garita Principal - Control Mina',
            guardiaNombre || item.guardiaNombre || 'Oficial Garita (Offline)',
            guardiaId || item.guardiaId || null,
            item.alcotestResultado || '0.00 g/L (Apto)',
            item.timestamp || item.creadoEn || null,
          ]
        );
        insertados.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return {
        totalSincronizados: insertados.length,
        mensaje: `Sincronización offline atómica exitosa: ${insertados.length} accesos registrados en la bitácora central de mina.`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getHistorial(limit = 50) {
    const res = await query(
      `SELECT 
         a.id,
         a.tipo_acceso,
         a.resultado,
         a.motivo_denegacion,
         a.garita,
         a.guardia_nombre,
         a.alcotest_resultado,
         a.sincronizado_offline,
         a.creado_en,
         p.nombres as postulante_nombres,
         p.apellidos as postulante_apellidos,
         p.numero_documento as postulante_dni,
         p.cargo as postulante_cargo,
         p.tipo_pase as postulante_tipo_pase,
         v.placa_codigo as vehiculo_placa,
         v.tipo_vehiculo,
         v.marca as vehiculo_marca,
         v.modelo as vehiculo_modelo
       FROM accesos_garita a
       LEFT JOIN postulantes p ON a.postulante_id = p.id
       LEFT JOIN vehiculos_maquinaria v ON a.vehiculo_id = v.id
       ORDER BY a.creado_en DESC
       LIMIT $1`,
      [limit]
    );

    return res.rows;
  }
}
