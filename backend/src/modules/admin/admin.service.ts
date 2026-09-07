import { query } from '../../config/db';
import bcrypt from 'bcryptjs';

export class AdminService {
  static async getUsuarios() {
    const res = await query(
      `SELECT 
         u.id, 
         u.nombre, 
         u.email, 
         u.rol, 
         u.area_responsable, 
         u.activo, 
         u.intentos_fallidos,
         u.bloqueado_hasta,
         u.bloqueado_definitivo,
         u.creado_en,
         e.razon_social as empresa_nombre
       FROM usuarios u
       LEFT JOIN empresas_contratistas e ON u.empresa_id = e.id
       ORDER BY u.creado_en DESC`
    );
    return res.rows;
  }

  static async crearUsuario(data: {
    nombre: string;
    email: string;
    passwordPlain: string;
    rol: string;
    area_responsable: string;
    empresa_id?: string;
  }) {
    const checkEmail = await query('SELECT id FROM usuarios WHERE email = $1', [data.email]);
    if (checkEmail.rows.length > 0) {
      throw new Error(`El correo ${data.email} ya se encuentra registrado.`);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.passwordPlain, salt);

    const res = await query(
      `INSERT INTO usuarios 
       (nombre, email, password_hash, rol, area_responsable, empresa_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, email, rol, area_responsable, activo, creado_en`,
      [
        data.nombre,
        data.email,
        password_hash,
        data.rol,
        data.area_responsable,
        data.empresa_id || null,
      ]
    );

    return res.rows[0];
  }

  static async toggleEstadoUsuario(id: string, activo: boolean) {
    const res = await query(
      `UPDATE usuarios 
       SET activo = $2,
           intentos_fallidos = CASE WHEN $2 = true THEN 0 ELSE intentos_fallidos END,
           bloqueado_definitivo = CASE WHEN $2 = true THEN false ELSE bloqueado_definitivo END,
           bloqueado_hasta = CASE WHEN $2 = true THEN NULL ELSE bloqueado_hasta END
       WHERE id = $1 
       RETURNING id, nombre, email, activo, intentos_fallidos, bloqueado_definitivo`,
      [id, activo]
    );

    if (res.rows.length === 0) {
      throw new Error('Usuario no encontrado.');
    }

    return res.rows[0];
  }

  static async desbloquearUsuario(id: string) {
    const res = await query(
      `UPDATE usuarios 
       SET activo = TRUE, 
           intentos_fallidos = 0, 
           bloqueado_hasta = NULL, 
           bloqueado_definitivo = FALSE 
       WHERE id = $1 
       RETURNING id, nombre, email, activo, intentos_fallidos, bloqueado_definitivo`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new Error('Usuario no encontrado.');
    }

    return res.rows[0];
  }

  static async getAuditoriaVistosBuenos() {
    const res = await query(
      `SELECT 
         avb.*,
         p.nombres as postulante_nombres,
         p.apellidos as postulante_apellidos,
         p.numero_documento as postulante_dni,
         p.cargo as postulante_cargo,
         e.razon_social as empresa_nombre
       FROM auditoria_vistos_buenos avb
       JOIN postulantes p ON avb.postulante_id = p.id
       JOIN empresas_contratistas e ON p.empresa_id = e.id
       ORDER BY avb.fecha_registro DESC
       LIMIT 100`
    );
    return res.rows;
  }

  static async getDashboardStats() {
    const totalPostulantes = await query(`SELECT COUNT(*) FROM postulantes`);
    const aptos = await query(`SELECT COUNT(*) FROM postulantes WHERE estado_global = 'APTO_PARA_TRABAJAR'`);
    const observados = await query(`SELECT COUNT(*) FROM postulantes WHERE estado_global = 'OBSERVADO'`);
    const enProceso = await query(`SELECT COUNT(*) FROM postulantes WHERE estado_global = 'EN_PROCESO'`);
    const listaNegra = await query(`SELECT COUNT(*) FROM lista_negra`);

    return {
      total: parseInt(totalPostulantes.rows[0].count, 10),
      aptosParaTrabajar: parseInt(aptos.rows[0].count, 10),
      observados: parseInt(observados.rows[0].count, 10),
      enProceso: parseInt(enProceso.rows[0].count, 10),
      bloqueadosListaNegra: parseInt(listaNegra.rows[0].count, 10),
    };
  }
}
