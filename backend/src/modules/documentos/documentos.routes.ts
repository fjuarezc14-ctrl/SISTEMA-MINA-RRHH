import { Router } from 'express';
import { DocumentosController } from './documentos.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

// Consultar expediente digital del postulante con control de privacidad
router.get('/postulante/:postulanteId', authenticateJWT, DocumentosController.getExpediente);

// Descarga/streaming seguro comprobando rol y token
router.get('/:id/stream', authenticateJWT, DocumentosController.streamDocumento);

export default router;
