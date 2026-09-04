import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import postulantesRoutes from './modules/postulantes/postulantes.routes';
import fasesRoutes from './modules/fases/fases.routes';
import listaNegraRoutes from './modules/lista-negra/lista-negra.routes';
import fotocheckRoutes from './modules/fotocheck/fotocheck.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/postulantes', postulantesRoutes);
apiRouter.use('/fases', fasesRoutes);
apiRouter.use('/lista-negra', listaNegraRoutes);
apiRouter.use('/fotocheck', fotocheckRoutes);

export default apiRouter;
