import { query } from '../../config/db';

export interface ResumenVencimientos {
  total: number;
  vigentes: number;
  porVencer: number;
  criticos: number;
  vencidos: number;
  detalle: Array<{
    id: string;
    nombres: string;
    apellidos: string;
    numero_documento: string;
    empresa_nombre: string;
    cargo: string;
    fase_actual: string;
    estado_global: string;
    sctr_inicio?: string | null;
    sctr_vencimiento: string | null;
    dias_restantes: number | null;
    semaforo: 'VERDE' | 'AMBAR' | 'NARANJA' | 'ROJO' | 'SIN_FECHA';
  }>;
}

export class VencimientosService {
  static async obtenerResumen(): Promise<ResumenVencimientos> {
    const res = await query(
      `SELECT 
         p.id,
         p.nombres,
         p.apellidos,
         p.numero_documento,
         p.cargo,
         p.fase_actual,
         p.estado_global,
         p.sctr_inicio,
         p.sctr_vencimiento,
         e.razon_social as empresa_nombre,
         CASE 
           WHEN p.sctr_vencimiento IS NULL THEN NULL
           ELSE (p.sctr_vencimiento - CURRENT_DATE)
         END as dias_restantes
       FROM postulantes p
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       ORDER BY dias_restantes ASC NULLS LAST`
    );

    let vigentes = 0;
    let porVencer = 0;
    let criticos = 0;
    let vencidos = 0;

    const detalle = res.rows.map((row) => {
      let semaforo: 'VERDE' | 'AMBAR' | 'NARANJA' | 'ROJO' | 'SIN_FECHA' = 'SIN_FECHA';
      const dias = row.dias_restantes !== null ? Number(row.dias_restantes) : null;

      if (dias === null) {
        semaforo = 'SIN_FECHA';
      } else if (dias <= 0) {
        semaforo = 'ROJO';
        vencidos++;
      } else if (dias <= 15) {
        semaforo = 'NARANJA';
        criticos++;
        porVencer++;
      } else if (dias <= 30) {
        semaforo = 'AMBAR';
        porVencer++;
      } else {
        semaforo = 'VERDE';
        vigentes++;
      }

      return {
        id: row.id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        numero_documento: row.numero_documento,
        empresa_nombre: row.empresa_nombre,
        cargo: row.cargo,
        fase_actual: row.fase_actual,
        estado_global: row.estado_global,
        sctr_inicio: row.sctr_inicio ? new Date(row.sctr_inicio).toISOString().split('T')[0] : null,
        sctr_vencimiento: row.sctr_vencimiento ? new Date(row.sctr_vencimiento).toISOString().split('T')[0] : null,
        dias_restantes: dias,
        semaforo,
      };
    });

    return {
      total: res.rows.length,
      vigentes,
      porVencer,
      criticos,
      vencidos,
      detalle,
    };
  }

  // Suspender automáticamente trabajadores cuyo SCTR expiró
  static async ejecutarRevisionVencimientos() {
    const res = await query(
      `UPDATE postulantes 
       SET estado_global = 'SUSPENDIDO_POR_VENCIMIENTO'
       WHERE sctr_vencimiento < CURRENT_DATE 
         AND estado_global = 'APTO_PARA_TRABAJAR'
       RETURNING id, nombres, apellidos, numero_documento`
    );
    return res.rows;
  }
}
