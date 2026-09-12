import { query } from '../../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const res = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      // Mitigación Timing Attack: ejecutar hash dummy para que el tiempo de respuesta sea indistinguible
      await bcrypt.compare(passwordPlain, '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu');
      const err: any = new Error('Credenciales incorrectas.');
      err.statusCode = 401;
      throw err;
    }

    const user = res.rows[0];

    // 1. Verificar si la cuenta está bloqueada de forma definitiva o inactiva
    if (user.bloqueado_definitivo || !user.activo) {
      const err: any = new Error(
        'Tu cuenta ha sido bloqueada tras 3 intentos fallidos consecutivos por políticas de seguridad minera. Comunícate con el Administrador (admin@valetec.com) para reactivar tu acceso o restablecer tu contraseña.'
      );
      err.code = 'CUENTA_BLOQUEADA_DEFINITIVO';
      err.statusCode = 403;
      err.intentos = 3;
      throw err;
    }

    // 2. Verificar si está en periodo de bloqueo temporal (30 segundos)
    if (user.bloqueado_hasta) {
      const ahora = new Date();
      const bloqueoHasta = new Date(user.bloqueado_hasta);
      if (bloqueoHasta > ahora) {
        const segundosRestantes = Math.ceil((bloqueoHasta.getTime() - ahora.getTime()) / 1000);
        const err: any = new Error(
          `Acceso pausado por seguridad. Por favor espere ${segundosRestantes} segundos antes de volver a intentar.`
        );
        err.code = 'BLOQUEO_TEMPORAL';
        err.statusCode = 429;
        err.segundosRestantes = segundosRestantes;
        err.intentos = user.intentos_fallidos || 1;
        err.intentosRestantes = Math.max(0, 3 - (user.intentos_fallidos || 1));
        throw err;
      }
    }

    // 3. Evaluar coincidencia de contraseña (bcrypt only — sin backdoors)
    const esPasswordValida = await bcrypt.compare(passwordPlain, user.password_hash);

    if (!esPasswordValida) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      if (nuevosIntentos >= 3) {
        // Bloqueo definitivo
        await query(
          `UPDATE usuarios 
           SET intentos_fallidos = 3, bloqueado_definitivo = TRUE, activo = FALSE, bloqueado_hasta = NULL 
           WHERE id = $1`,
          [user.id]
        );
        const err: any = new Error(
          'Has alcanzado el límite de 3 intentos fallidos. Tu cuenta ha sido bloqueada permanentemente por políticas de seguridad. Comunícate con el Administrador (admin@valetec.com) para reactivar tu acceso.'
        );
        err.code = 'CUENTA_BLOQUEADA_DEFINITIVO';
        err.statusCode = 403;
        err.intentos = 3;
        err.intentosRestantes = 0;
        throw err;
      } else {
        // Bloqueo temporal de 30 segundos
        await query(
          `UPDATE usuarios 
           SET intentos_fallidos = $1, bloqueado_hasta = NOW() + INTERVAL '30 seconds' 
           WHERE id = $2`,
          [nuevosIntentos, user.id]
        );
        const intentosRestantes = 3 - nuevosIntentos;
        const err: any = new Error(
          `Contraseña incorrecta. Intento ${nuevosIntentos} de 3. Por seguridad, debes esperar 30 segundos para volver a intentar.`
        );
        err.code = 'BLOQUEO_TEMPORAL';
        err.statusCode = 429;
        err.segundosRestantes = 30;
        err.intentos = nuevosIntentos;
        err.intentosRestantes = intentosRestantes;
        throw err;
      }
    }

    // 4. Si la contraseña es correcta, reiniciar contador de intentos fallidos
    if ((user.intentos_fallidos && user.intentos_fallidos > 0) || user.bloqueado_hasta) {
      await query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
        [user.id]
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        empresa_id: user.empresa_id,
        colegiatura: user.colegiatura,
        area_responsable: user.area_responsable,
      },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id,
        colegiatura: user.colegiatura,
        area_responsable: user.area_responsable,
      },
    };
  }

  static async getProfile(userId: string) {
    const res = await query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.empresa_id, u.colegiatura, u.area_responsable, e.razon_social as empresa_nombre
       FROM usuarios u
       LEFT JOIN empresas_contratistas e ON u.empresa_id = e.id
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new Error('Usuario no encontrado.');
    }

    return res.rows[0];
  }
}
