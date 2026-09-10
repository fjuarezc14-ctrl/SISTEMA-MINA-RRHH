-- DATOS SEMILLA (SEED DATA)
-- Basado en los casos y roles de la maqueta onboarding.html

-- Empresa Contratista
INSERT INTO empresas_contratistas (id, ruc, razon_social, contacto_nombre, contacto_email, telefono)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '20554433221', 'Servicios Mineros XYZ S.A.C.', 'Carlos Mendoza', 'cmendoza@serviciosxyz.com', '+51 987654321')
ON CONFLICT (ruc) DO NOTHING;

-- Usuarios por Rol (Clave por defecto hasheada: Password123!)
INSERT INTO usuarios (id, empresa_id, nombre, email, password_hash, rol, colegiatura) VALUES
('b0000000-0000-0000-0000-000000000000', NULL, 'Ing. Yerson (Super Admin)', 'admin@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'SUPER_ADMIN', 'CIP 215480 - Ing. Minas'),
('b1111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Contratista XYZ', 'contratista@serviciosxyz.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'CONTRATISTA', 'RUC 20554433221 - Rep. Legal'),
('b2222222-2222-2222-2222-222222222222', NULL, 'Lic. Valenzuela (RRHH)', 'rrhh@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'STAFF_RRHH', 'Lic. Reg. 1248-CDR'),
('b3333333-3333-3333-3333-333333333333', NULL, 'Dr. Arévalo (Médico Ocupacional)', 'salud@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'MEDICO_OCUPACIONAL', 'CMP 48921 / RNE 24510'),
('b4444444-4444-4444-4444-444444444444', NULL, 'Cmdte. Rivas (Seguridad Patrimonial)', 'seguridad@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'SEGURIDAD_PATRIMONIAL', 'Reg. SUCAMEC 78412'),
('b5555555-5555-5555-5555-555555555555', NULL, 'Ing. Torres (SSOMA Inducción)', 'capacitacion@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'INSTRUCTOR_SSOMA', 'CIP 198452 - Higiene y Seg.'),
('b6666666-6666-6666-6666-666666666666', NULL, 'Dra. Silva (SCTR / Contratos)', 'seguros@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'ADMIN_CONTRATOS', 'Reg. SBS 41209'),
('b7777777-7777-7777-7777-777777777777', NULL, 'Oficial Huamán (Garita / Fotocheck)', 'accesos@valetec.com', '$2a$10$MO.NB3/EqblCQPIRLrUAteLzZFc6z7soByeD0Fw3sWqQfExVYB0zu', 'CONTROL_ACCESOS', 'Oficial Garita Reg. MIN-882')
ON CONFLICT (email) DO UPDATE SET colegiatura = EXCLUDED.colegiatura;

-- Candidatos de la maqueta
-- 1. Díaz, Roberto (Fase 1: Datos y CV - Soldador)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global)
VALUES ('c1111111-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '45891234', 'Roberto', 'Díaz Alvarado', 'Soldador 3G/4G', 'FASE_1', 'EN_PROCESO')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

-- 2. Gómez, Martín (Fase 2: Salud EMO / Toxicología)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global)
VALUES ('c2222222-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '70123456', 'Martín', 'Gómez Ruiz', 'Operador de Scoop', 'FASE_2', 'EN_PROCESO')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

-- 3. Pérez, Juan (Fase 4: Capacitación e Inducción)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global)
VALUES ('c3333333-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '42189012', 'Juan', 'Pérez Sánchez', 'Técnico Mecánico', 'FASE_4', 'EN_PROCESO')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

-- 4. Salas, Miguel (Fase 4: Capacitación e Inducción)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global)
VALUES ('c4444444-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '47890123', 'Miguel', 'Salas Flores', 'Electricista Mina', 'FASE_4', 'EN_PROCESO')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

-- 5. García, Luis (Fase 5: OBSERVADO por SCTR vencido)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global, sctr_vencimiento)
VALUES ('c5555555-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '43112233', 'Luis', 'García Paredes', 'Chofer Volquete', 'FASE_5', 'OBSERVADO', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

INSERT INTO evaluaciones_fase (postulante_id, fase, evaluador_id, estado_resultado, observaciones)
VALUES ('c5555555-0000-0000-0000-000000000005', 'FASE_5', 'b6666666-6666-6666-6666-666666666666', 'OBSERVADO', 'El SCTR subido está vencido. Fecha de expiración fue el mes pasado.');

-- 6. Mendoza, Ana (Fase 5 / Aprobada para Fotocheck)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, grupo_sanguineo, fase_actual, estado_global, sctr_vencimiento)
VALUES ('c6666666-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '46998877', 'Ana', 'Mendoza Quispe', 'Ingeniera Geomecánica', 'O+', 'FOTOCHECK', 'APTO_PARA_TRABAJAR', CURRENT_DATE + INTERVAL '28 days')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

INSERT INTO fotochecks (postulante_id, codigo_credencial, codigo_qr, zona_autorizada, fecha_emision, fecha_vencimiento, impreso)
VALUES ('c6666666-0000-0000-0000-000000000006', 'VT-2026-0892', 'QR-VT-46998877-20260892', 'Superficie y Rajo Abierto', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', FALSE)
ON CONFLICT (postulante_id) DO NOTHING;

-- Vehículos y Maquinaria Semilla
INSERT INTO vehiculos_maquinaria (id, empresa_id, placa_codigo, tipo_vehiculo, marca, modelo, anio_fabricacion, color, soat_vencimiento, rev_tecnica_vencimiento, poliza_trec_vencimiento, checklist_seguridad, estado_acreditacion, codigo_pase_qr) VALUES
('e1111111-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'V8X-921', 'CAMIONETA_4X4', 'Toyota', 'Hilux 4x4 SRV', 2024, 'Blanco', CURRENT_DATE + INTERVAL '6 months', CURRENT_DATE + INTERVAL '8 months', CURRENT_DATE + INTERVAL '5 months', '{"jaula_antivuelco": true, "pertiga_led": true, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": true}', 'APTO_TRANSITO_MINA', 'PASE-VEH-V8X921'),
('e2222222-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'W3C-810', 'VOLQUETE', 'Volvo', 'FMX 8x4 480HP', 2023, 'Amarillo Oruga', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '4 months', CURRENT_DATE + INTERVAL '3 months', '{"jaula_antivuelco": true, "pertiga_led": true, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": true}', 'APTO_TRANSITO_MINA', 'PASE-VEH-W3C810'),
('e3333333-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'T9K-442', 'CISTERNA_COMBUSTIBLE', 'Mercedes-Benz', 'Actros 3344', 2022, 'Rojo / Blanco', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 months', '{"jaula_antivuelco": true, "pertiga_led": false, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": false}', 'OBSERVADO', 'PASE-VEH-T9K442')
ON CONFLICT (placa_codigo) DO NOTHING;

-- Notificaciones Semilla
INSERT INTO notificaciones (usuario_id, empresa_id, titulo, mensaje, tipo) VALUES
('b0000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Vencimiento Próximo de SCTR', 'El postulante Roberto Díaz tiene póliza SCTR con vigencia menor a 15 días.', 'VENCIMIENTO_SCTR'),
('b0000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Postulante Acreditado', 'Ana Mendoza Quispe completó 5/5 Vistos Buenos y cuenta con Fotocheck activo.', 'APROBADO'),
('b1111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Expediente Observado en Fase 5', 'Luis García Paredes fue observado por póliza SCTR vencida. Requiere subsanación.', 'OBSERVACION');

-- Bitácora de Accesos de Garita Semilla
INSERT INTO accesos_garita (tipo_acceso, postulante_id, resultado, garita, guardia_nombre) VALUES
('PEATONAL_TRABAJADOR', 'c6666666-0000-0000-0000-000000000006', 'AUTORIZADO', 'Garita Principal - Control Mina', 'Oficial Huamán'),
('PEATONAL_TRABAJADOR', 'c5555555-0000-0000-0000-000000000005', 'DENEGADO', 'Garita Principal - Control Mina', 'Oficial Huamán');

