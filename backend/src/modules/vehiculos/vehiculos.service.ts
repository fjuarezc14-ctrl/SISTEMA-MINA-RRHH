import { query } from '../../config/db';

export interface VehiculoInput {
  empresaId: string;
  placaCodigo: string;
  tipoVehiculo: string;
  marca: string;
  modelo: string;
  anioFabricacion?: number;
  color?: string;
  soatVencimiento: string;
  revTecnicaVencimiento: string;
  polizaTrecVencimiento?: string;
  checklistSeguridad?: {
    jaulaAntivuelco?: boolean;
    pertigaLed?: boolean;
    circulina?: boolean;
    extintorPqs?: boolean;
    cinturones3puntos?: boolean;
    trabaTuercas?: boolean;
  };
  observaciones?: string;
}

export class VehiculosService {
  static async getVehiculos() {
    const res = await query(
      `SELECT 
         v.*,
         e.razon_social as empresa_nombre
       FROM vehiculos_maquinaria v
       JOIN empresas_contratistas e ON v.empresa_id = e.id
       ORDER BY v.creado_en DESC`
    );
    return res.rows;
  }

  static async registrarVehiculo(data: VehiculoInput) {
    const placaClean = data.placaCodigo.trim().toUpperCase();
    const paseQr = `PASE-VEH-${placaClean.replace(/[^A-Z0-9]/g, '')}`;

    const res = await query(
      `INSERT INTO vehiculos_maquinaria (
         empresa_id,
         placa_codigo,
         tipo_vehiculo,
         marca,
         modelo,
         anio_fabricacion,
         color,
         soat_vencimiento,
         rev_tecnica_vencimiento,
         poliza_trec_vencimiento,
         checklist_seguridad,
         estado_acreditacion,
         codigo_pase_qr,
         observaciones
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'EN_REVISION', $12, $13)
       RETURNING *`,
      [
        data.empresaId,
        placaClean,
        data.tipoVehiculo,
        data.marca,
        data.modelo,
        data.anioFabricacion || null,
        data.color || null,
        data.soatVencimiento,
        data.revTecnicaVencimiento,
        data.polizaTrecVencimiento || null,
        JSON.stringify(data.checklistSeguridad || {}),
        paseQr,
        data.observaciones || null,
      ]
    );

    return res.rows[0];
  }

  static async evaluarVehiculo(
    id: string,
    decision: 'APROBAR' | 'OBSERVAR',
    observaciones?: string,
    aprobadoPor?: string
  ) {
    const nuevoEstado = decision === 'APROBAR' ? 'APTO_TRANSITO_MINA' : 'OBSERVADO';

    const res = await query(
      `UPDATE vehiculos_maquinaria
       SET estado_acreditacion = $1,
           observaciones = COALESCE($2, observaciones),
           aprobado_por = $3
       WHERE id = $4
       RETURNING *`,
      [nuevoEstado, observaciones || null, aprobadoPor || null, id]
    );

    if (res.rows.length === 0) {
      throw new Error('Vehículo no encontrado');
    }

    return res.rows[0];
  }
}
