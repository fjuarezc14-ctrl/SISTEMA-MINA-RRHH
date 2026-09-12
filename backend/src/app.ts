import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

export const app = express();

// Cabeceras de seguridad HTTP (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
app.use(helmet());

// Rate limiting global para toda la API (Anti DoS / Scraping)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // máximo 300 peticiones por IP
  message: { error: 'Límite de solicitudes alcanzado. Por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para login (Anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos por IP
  message: { error: 'Demasiados intentos de inicio de sesión. Espere 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS: permite origen configurado, localhost y red local
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5150',
  'http://127.0.0.1:5150',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones del mismo servidor (proxy de nginx) o sin header Origin (mobile/curl/proxy interno)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):5150$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS no permitido para este origen.'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplicar limitadores de tráfico
app.use('/api', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// Los documentos se sirven con control de roles a través de /api/documentos/:id/stream (NO de forma estática)

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
