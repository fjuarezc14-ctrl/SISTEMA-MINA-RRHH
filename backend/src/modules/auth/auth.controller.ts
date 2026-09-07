import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const data = await AuthService.login(email, password);
      res.json(data);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code || 'AUTH_ERROR',
          segundosRestantes: err.segundosRestantes,
          intentos: err.intentos,
          intentosRestantes: err.intentosRestantes,
        });
      }
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }
      const profile = await AuthService.getProfile(req.user.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
}
