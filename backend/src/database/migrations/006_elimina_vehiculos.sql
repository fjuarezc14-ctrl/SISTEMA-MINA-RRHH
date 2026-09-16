-- ============================================================
-- MIGRACIÓN 006: ELIMINA EL MÓDULO DE VEHÍCULOS Y MAQUINARIA
-- El sistema se centra solo en la acreditación de personal.
-- Garita conserva únicamente el control de acceso peatonal.
-- ============================================================

-- Al quitar la columna también se eliminan su llave foránea e índice.
ALTER TABLE accesos_garita DROP COLUMN IF EXISTS vehiculo_id;

DROP TABLE IF EXISTS vehiculos_maquinaria;

ALTER TABLE accesos_garita
  DROP CONSTRAINT IF EXISTS accesos_garita_tipo_acceso_check,
  ADD CONSTRAINT accesos_garita_tipo_acceso_check
  CHECK (tipo_acceso = 'PEATONAL_TRABAJADOR');
