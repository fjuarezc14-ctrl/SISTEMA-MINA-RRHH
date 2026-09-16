-- ============================================================
-- MIGRACIÓN V6: ESTADO EXPLÍCITO DE SUBSANACIÓN PENDIENTE
-- Sistema de Onboarding y Control de Accesos Mineros - VALETEC
-- Distingue "postulante nunca evaluado" de "contratista ya corrigió
-- la observación y está a la espera de nueva revisión del evaluador".
-- ============================================================

ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS subsanacion_pendiente BOOLEAN DEFAULT FALSE;
