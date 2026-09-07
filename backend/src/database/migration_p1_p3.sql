ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS sctr_vencimiento DATE;
ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS emo_vencimiento DATE;

CREATE TABLE IF NOT EXISTS vehiculos_maquinaria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas_contratistas(id) ON DELETE CASCADE,
    placa_codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo_vehiculo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio_fabricacion INT,
    color VARCHAR(30),
    soat_vencimiento DATE NOT NULL,
    rev_tecnica_vencimiento DATE NOT NULL,
    poliza_trec_vencimiento DATE,
    checklist_seguridad JSONB,
    estado_acreditacion VARCHAR(30) DEFAULT 'EN_REVISION',
    codigo_pase_qr VARCHAR(100) UNIQUE,
    observaciones TEXT,
    aprobado_por UUID REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accesos_garita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_acceso VARCHAR(20) NOT NULL,
    postulante_id UUID REFERENCES postulantes(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES vehiculos_maquinaria(id) ON DELETE SET NULL,
    resultado VARCHAR(20) NOT NULL,
    motivo_denegacion TEXT,
    garita VARCHAR(100) DEFAULT 'Garita Principal - Control Mina',
    guardia_nombre VARCHAR(150),
    guardia_id UUID REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas_contratistas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(30) DEFAULT 'INFO',
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

UPDATE postulantes SET sctr_vencimiento = CURRENT_DATE + INTERVAL '28 days' WHERE numero_documento = '46998877';
UPDATE postulantes SET sctr_vencimiento = CURRENT_DATE - INTERVAL '5 days' WHERE numero_documento = '43112233';
UPDATE postulantes SET sctr_vencimiento = CURRENT_DATE + INTERVAL '12 days' WHERE numero_documento = '45891234';

INSERT INTO vehiculos_maquinaria (id, empresa_id, placa_codigo, tipo_vehiculo, marca, modelo, anio_fabricacion, color, soat_vencimiento, rev_tecnica_vencimiento, poliza_trec_vencimiento, checklist_seguridad, estado_acreditacion, codigo_pase_qr) VALUES
('e1111111-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'V8X-921', 'CAMIONETA_4X4', 'Toyota', 'Hilux 4x4 SRV', 2024, 'Blanco', CURRENT_DATE + INTERVAL '6 months', CURRENT_DATE + INTERVAL '8 months', CURRENT_DATE + INTERVAL '5 months', '{"jaula_antivuelco": true, "pertiga_led": true, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": true}', 'APTO_TRANSITO_MINA', 'PASE-VEH-V8X921'),
('e2222222-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'W3C-810', 'VOLQUETE', 'Volvo', 'FMX 8x4 480HP', 2023, 'Amarillo Oruga', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '4 months', CURRENT_DATE + INTERVAL '3 months', '{"jaula_antivuelco": true, "pertiga_led": true, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": true}', 'APTO_TRANSITO_MINA', 'PASE-VEH-W3C810'),
('e3333333-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'T9K-442', 'CISTERNA_COMBUSTIBLE', 'Mercedes-Benz', 'Actros 3344', 2022, 'Rojo / Blanco', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 months', '{"jaula_antivuelco": true, "pertiga_led": false, "circulina": true, "extintor_pqs": true, "cinturones_3puntos": true, "traba_tuercas": false}', 'OBSERVADO', 'PASE-VEH-T9K442')
ON CONFLICT (placa_codigo) DO NOTHING;

INSERT INTO notificaciones (usuario_id, empresa_id, titulo, mensaje, tipo) VALUES
('b0000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Vencimiento Próximo de SCTR', 'El postulante Roberto Díaz tiene póliza SCTR con vigencia menor a 15 días.', 'VENCIMIENTO_SCTR'),
('b0000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Postulante Acreditado', 'Ana Mendoza Quispe completó 5/5 Vistos Buenos y cuenta con Fotocheck activo.', 'APROBADO'),
('b1111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Expediente Observado en Fase 5', 'Luis García Paredes fue observado por póliza SCTR vencida. Requiere subsanación.', 'OBSERVACION')
ON CONFLICT DO NOTHING;

INSERT INTO accesos_garita (tipo_acceso, postulante_id, resultado, garita, guardia_nombre) VALUES
('PEATONAL_TRABAJADOR', 'c6666666-0000-0000-0000-000000000006', 'AUTORIZADO', 'Garita Principal - Control Mina', 'Oficial Huamán'),
('PEATONAL_TRABAJADOR', 'c5555555-0000-0000-0000-000000000005', 'DENEGADO', 'Garita Principal - Control Mina', 'Oficial Huamán');
