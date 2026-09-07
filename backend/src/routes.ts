import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import postulantesRoutes from './modules/postulantes/postulantes.routes';
import fasesRoutes from './modules/fases/fases.routes';
import listaNegraRoutes from './modules/lista-negra/lista-negra.routes';
import fotocheckRoutes from './modules/fotocheck/fotocheck.routes';
import adminRoutes from './modules/admin/admin.routes';
import documentosRoutes from './modules/documentos/documentos.routes';
import vencimientosRoutes from './modules/vencimientos/vencimientos.routes';
import garitaRoutes from './modules/garita/garita.routes';
import vehiculosRoutes from './modules/vehiculos/vehiculos.routes';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes';
import metricasRoutes from './modules/metricas/metricas.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/postulantes', postulantesRoutes);
apiRouter.use('/fases', fasesRoutes);
apiRouter.use('/lista-negra', listaNegraRoutes);
apiRouter.use('/fotocheck', fotocheckRoutes);
apiRouter.use('/documentos', documentosRoutes);
apiRouter.use('/vencimientos', vencimientosRoutes);
apiRouter.use('/garita', garitaRoutes);
apiRouter.use('/vehiculos', vehiculosRoutes);
apiRouter.use('/notificaciones', notificacionesRoutes);
apiRouter.use('/metricas', metricasRoutes);

export default apiRouter;
