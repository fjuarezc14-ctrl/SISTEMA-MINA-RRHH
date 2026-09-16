import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

export const runMigrations = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre VARCHAR(255) PRIMARY KEY,
        aplicada_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const aplicadas = new Set<string>(
      (await client.query('SELECT nombre FROM schema_migrations')).rows.map((r) => r.nombre)
    );

    const archivos = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pendientes = archivos.filter((f) => !aplicadas.has(f));

    if (pendientes.length === 0) {
      console.log(`[migraciones] base de datos al día (${archivos.length} aplicadas)`);
      return;
    }

    for (const archivo of pendientes) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, archivo), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló la migración ${archivo}: ${(error as Error).message}`);
      }

      console.log(`[migraciones] aplicada: ${archivo}`);
    }
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((error) => {
      console.error('[migraciones] error:', error.message);
      process.exit(1);
    });
}
