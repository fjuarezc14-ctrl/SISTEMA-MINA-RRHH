-- ============================================================
-- MIGRACIÓN V4: INTEGRIDAD, INMUTABILIDAD Y BLINDAJE DE AUDITORÍA
-- Sistema de Onboarding y Control de Accesos Mineros - VALETEC
-- Cumplimiento D.S. 024-2016-EM
-- ============================================================

-- 1. FUNCIÓN Y TRIGGERS DE INMUTABILIDAD PARA TABLAS DE AUDITORÍA Y TRAZABILIDAD
CREATE OR REPLACE FUNCTION fn_prevent_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'OPERACIÓN DENEGADA: La tabla "%" es inmutable por políticas de seguridad minera y trazabilidad legal (D.S. 024-2016-EM).', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria_vistos_buenos (inmutable: no update, no delete)
DROP TRIGGER IF EXISTS trg_protect_auditoria ON auditoria_vistos_buenos;
CREATE TRIGGER trg_protect_auditoria
BEFORE UPDATE OR DELETE ON auditoria_vistos_buenos
FOR EACH ROW EXECUTE FUNCTION fn_prevent_tampering();

-- Trigger para historial_seguros (inmutable: no update, no delete)
DROP TRIGGER IF EXISTS trg_protect_historial_seguros ON historial_seguros;
CREATE TRIGGER trg_protect_historial_seguros
BEFORE UPDATE OR DELETE ON historial_seguros
FOR EACH ROW EXECUTE FUNCTION fn_prevent_tampering();

-- Trigger para bajas_emergencia (no delete, para preservar registros de evacuación/salida)
DROP TRIGGER IF EXISTS trg_protect_bajas_delete ON bajas_emergencia;
CREATE TRIGGER trg_protect_bajas_delete
BEFORE DELETE ON bajas_emergencia
FOR EACH ROW EXECUTE FUNCTION fn_prevent_tampering();

-- 2. CAMBIO DE ON DELETE CASCADE A ON DELETE RESTRICT EN TABLAS DE AUDITORÍA
-- Evita que al eliminar un postulante se destruya la evidencia legal y médica
ALTER TABLE auditoria_vistos_buenos 
  DROP CONSTRAINT IF EXISTS auditoria_vistos_buenos_postulante_id_fkey;
ALTER TABLE auditoria_vistos_buenos 
  ADD CONSTRAINT auditoria_vistos_buenos_postulante_id_fkey 
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE RESTRICT;

ALTER TABLE historial_seguros 
  DROP CONSTRAINT IF EXISTS historial_seguros_postulante_id_fkey;
ALTER TABLE historial_seguros 
  ADD CONSTRAINT historial_seguros_postulante_id_fkey 
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE RESTRICT;

ALTER TABLE bajas_emergencia 
  DROP CONSTRAINT IF EXISTS bajas_emergencia_postulante_id_fkey;
ALTER TABLE bajas_emergencia 
  ADD CONSTRAINT bajas_emergencia_postulante_id_fkey 
  FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE RESTRICT;

-- 3. RESTRICCIONES CHECK DE NEGOCIO Y COHERENCIA TEMPORAL
-- Calificación de evaluación (00 a 20)
ALTER TABLE evaluaciones_fase 
  DROP CONSTRAINT IF EXISTS chk_evaluaciones_nota,
  ADD CONSTRAINT chk_evaluaciones_nota 
  CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20));

-- Coherencia de vigencia de pases
ALTER TABLE postulantes 
  DROP CONSTRAINT IF EXISTS chk_vigencia_fechas,
  ADD CONSTRAINT chk_vigencia_fechas 
  CHECK (vigencia_fin IS NULL OR vigencia_inicio IS NULL OR vigencia_fin >= vigencia_inicio);

-- Coherencia de vigencia de fotocheck
ALTER TABLE fotochecks 
  DROP CONSTRAINT IF EXISTS chk_fotocheck_vigencia,
  ADD CONSTRAINT chk_fotocheck_vigencia 
  CHECK (fecha_vencimiento >= fecha_emision);

-- Coherencia de fechas de seguro
ALTER TABLE historial_seguros 
  DROP CONSTRAINT IF EXISTS chk_seguros_fechas,
  ADD CONSTRAINT chk_seguros_fechas 
  CHECK (fecha_vencimiento IS NULL OR fecha_inicio IS NULL OR fecha_vencimiento >= fecha_inicio);

-- Tipos de seguro autorizados
ALTER TABLE historial_seguros 
  DROP CONSTRAINT IF EXISTS chk_tipo_seguro,
  ADD CONSTRAINT chk_tipo_seguro 
  CHECK (tipo_seguro IN ('SCTR_SALUD', 'SCTR_PENSION', 'EMO_ANUAL', 'SCTR_SALUD_PENSION'));

-- Tipos y estados en bajas de emergencia
ALTER TABLE bajas_emergencia 
  DROP CONSTRAINT IF EXISTS chk_tipo_emergencia,
  ADD CONSTRAINT chk_tipo_emergencia 
  CHECK (tipo_emergencia IN ('MEDICA_TRABAJADOR', 'FAMILIAR_GRAVE', 'OPERACIONAL'));

ALTER TABLE bajas_emergencia 
  DROP CONSTRAINT IF EXISTS chk_estado_baja,
  ADD CONSTRAINT chk_estado_baja 
  CHECK (estado IN ('AUTORIZADO', 'EJECUTADO_EN_GARITA'));

-- 4. ÍNDICES CRÍTICOS PARA ESCALABILIDAD Y CONSULTAS DE OPERACIÓN
CREATE INDEX IF NOT EXISTS idx_evaluaciones_postulante ON evaluaciones_fase(postulante_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador ON evaluaciones_fase(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_accesos_postulante ON accesos_garita(postulante_id);
CREATE INDEX IF NOT EXISTS idx_accesos_vehiculo ON accesos_garita(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_fotochecks_qr ON fotochecks(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_postulantes_estado ON postulantes(estado_global);
CREATE INDEX IF NOT EXISTS idx_postulantes_sctr_venc ON postulantes(sctr_vencimiento);
CREATE INDEX IF NOT EXISTS idx_postulantes_emo_venc ON postulantes(emo_vencimiento);
CREATE INDEX IF NOT EXISTS idx_notificaciones_unread ON notificaciones(usuario_id, leido);
