import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]:', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Error de validación de datos',
      detalles: err.errors,
    });
  }

  if (err.message && err.message.includes('Solo se permiten archivos')) {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor.',
  });
};
