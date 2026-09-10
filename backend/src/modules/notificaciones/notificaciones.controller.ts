import { Request, Response, NextFunction } from 'express';
import { NotificacionesService } from './notificaciones.service';

export class NotificacionesController {
  static async getNotificaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || undefined;
      const empresaId = req.user?.empresa_id || undefined;
      const notificaciones = await NotificacionesService.getNotificaciones(usuarioId, empresaId);
      res.json(notificaciones);
    } catch (err) {
      next(err);
    }
  }

  static async marcarLeida(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await NotificacionesService.marcarLeida(id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async borrarNotificacion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await NotificacionesService.borrarNotificacion(id);
      res.json({ message: 'Notificación eliminada', deleted });
    } catch (err) {
      next(err);
    }
  }

  static async limpiarLeidas(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id || undefined;
      const empresaId = req.user?.empresa_id || undefined;
      const result = await NotificacionesService.limpiarLeidas(usuarioId, empresaId);
      res.json({ message: 'Notificaciones leídas eliminadas', result });
    } catch (err) {
      next(err);
    }
  }
}
