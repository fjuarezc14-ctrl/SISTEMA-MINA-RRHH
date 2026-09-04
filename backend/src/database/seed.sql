-- DATOS SEMILLA (SEED DATA)
-- Basado en los casos y roles de la maqueta onboarding.html

-- Empresa Contratista
INSERT INTO empresas_contratistas (id, ruc, razon_social, contacto_nombre, contacto_email, telefono)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '20554433221', 'Servicios Mineros XYZ S.A.C.', 'Carlos Mendoza', 'cmendoza@serviciosxyz.com', '+51 987654321')
ON CONFLICT (ruc) DO NOTHING;

-- Usuarios por Rol (Clave por defecto hasheada: Password123!)
INSERT INTO usuarios (id, empresa_id, nombre, email, password_hash, rol) VALUES
('b0000000-0000-0000-0000-000000000000', NULL, 'Ing. Yerson (Super Admin)', 'admin@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'SUPER_ADMIN'),
('b1111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Contratista XYZ', 'contratista@serviciosxyz.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'CONTRATISTA'),
('b2222222-2222-2222-2222-222222222222', NULL, 'Lic. Valenzuela (RRHH)', 'rrhh@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'STAFF_RRHH'),
('b3333333-3333-3333-3333-333333333333', NULL, 'Dr. Arévalo (Médico Ocupacional)', 'salud@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'MEDICO_OCUPACIONAL'),
('b4444444-4444-4444-4444-444444444444', NULL, 'Cmdte. Rivas (Seguridad Patrimonial)', 'seguridad@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'SEGURIDAD_PATRIMONIAL'),
('b5555555-5555-5555-5555-555555555555', NULL, 'Ing. Torres (SSOMA Inducción)', 'capacitacion@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'INSTRUCTOR_SSOMA'),
('b6666666-6666-6666-6666-666666666666', NULL, 'Dra. Silva (SCTR / Contratos)', 'seguros@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'ADMIN_CONTRATOS'),
('b7777777-7777-7777-7777-777777777777', NULL, 'Oficial Huamán (Garita / Fotocheck)', 'accesos@valetec.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiM58K6W2h8YnO2c09FmE79lU9o1V5.', 'CONTROL_ACCESOS')
ON CONFLICT (email) DO NOTHING;

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
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, fase_actual, estado_global)
VALUES ('c5555555-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '43112233', 'Luis', 'García Paredes', 'Chofer Volquete', 'FASE_5', 'OBSERVADO')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

INSERT INTO evaluaciones_fase (postulante_id, fase, evaluador_id, estado_resultado, observaciones)
VALUES ('c5555555-0000-0000-0000-000000000005', 'FASE_5', 'b6666666-6666-6666-6666-666666666666', 'OBSERVADO', 'El SCTR subido está vencido. Fecha de expiración fue el mes pasado.');

-- 6. Mendoza, Ana (Fase 5 / Aprobada para Fotocheck)
INSERT INTO postulantes (id, empresa_id, tipo_documento, numero_documento, nombres, apellidos, cargo, grupo_sanguineo, fase_actual, estado_global)
VALUES ('c6666666-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DNI', '46998877', 'Ana', 'Mendoza Quispe', 'Ingeniera Geomecánica', 'O+', 'FOTOCHECK', 'APROBADO_TOTAL')
ON CONFLICT (tipo_documento, numero_documento) DO NOTHING;

INSERT INTO fotochecks (postulante_id, codigo_credencial, codigo_qr, zona_autorizada, fecha_emision, fecha_vencimiento, impreso)
VALUES ('c6666666-0000-0000-0000-000000000006', 'VT-2026-0892', 'QR-VT-46998877-20260892', 'Superficie y Rajo Abierto', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', FALSE)
ON CONFLICT (postulante_id) DO NOTHING;
