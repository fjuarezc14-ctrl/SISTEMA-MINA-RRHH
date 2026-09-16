-- MIGRACIÓN PARA MEJORAS OPERATIVAS MINERAS (1, 2 y 5)

-- 1. Colegiatura Profesional en Usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS colegiatura VARCHAR(100);

-- Actualizar usuarios del sistema con sus colegiaturas reales
UPDATE usuarios SET colegiatura = 'CIP 215480 - Ing. Minas' WHERE email = 'admin@valetec.com';
UPDATE usuarios SET colegiatura = 'CMP 48921 / RNE 24510 - Salud Ocupacional' WHERE email = 'salud@valetec.com';
UPDATE usuarios SET colegiatura = 'CIP 198452 - Ing. Higiene y Seguridad' WHERE email = 'capacitacion@valetec.com';
UPDATE usuarios SET colegiatura = 'Lic. Reg. 1248-CDR' WHERE email = 'rrhh@valetec.com';
UPDATE usuarios SET colegiatura = 'Reg. SUCAMEC 78412' WHERE email = 'seguridad@valetec.com';
UPDATE usuarios SET colegiatura = 'Reg. SBS 41209' WHERE email = 'seguros@valetec.com';
UPDATE usuarios SET colegiatura = 'Oficial Garita Reg. MIN-882' WHERE email = 'accesos@valetec.com';

-- 2. Colegiatura y Trazabilidad en Auditoría de Vistos Buenos
ALTER TABLE auditoria_vistos_buenos ADD COLUMN IF NOT EXISTS evaluador_colegiatura VARCHAR(100);

-- 3. Tipos de Pase en Postulantes (Permanente, Visita Técnica, Proveedor Logístico)
ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS tipo_pase VARCHAR(30) DEFAULT 'PERMANENTE';
ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS vigencia_inicio DATE;
ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS vigencia_fin DATE;

-- 4. Alcotest y Sincronización Offline en Garita
ALTER TABLE accesos_garita ADD COLUMN IF NOT EXISTS alcotest_resultado VARCHAR(50) DEFAULT '0.00 g/L (Apto)';
ALTER TABLE accesos_garita ADD COLUMN IF NOT EXISTS sincronizado_offline BOOLEAN DEFAULT FALSE;

-- Índices de optimización para garita y auditoría
CREATE INDEX IF NOT EXISTS idx_postulantes_tipo_pase ON postulantes(tipo_pase);
CREATE INDEX IF NOT EXISTS idx_accesos_offline ON accesos_garita(sincronizado_offline);
