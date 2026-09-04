import { app } from './app';
import { env } from './config/env';
import { pool } from './config/db';

const startServer = async () => {
  try {
    // Probar conexión a base de datos
    const dbTest = await pool.query('SELECT NOW()');
    console.log(' Conectado a PostgreSQL exitosamente:', dbTest.rows[0].now);

    app.listen(env.PORT, () => {
      console.log(` Servidor Backend de Onboarding Minero corriendo en http://localhost:${env.PORT}`);
      console.log(` Endpoint API base: http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error(' Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
