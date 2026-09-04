import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

export const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir estáticos para visualización de CVs, exámenes, pólizas subidas
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Sistema Mina RRHH - Onboarding API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api', apiRouter);

// Manejo centralizado de errores
app.use(errorHandler);
