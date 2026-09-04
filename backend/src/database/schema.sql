-- SISTEMA DE ONBOARDING MINERO - VALETEC
-- Esquema de Base de Datos Relacional PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPRESAS CONTRATISTAS MINERAS (ECM)
CREATE TABLE IF NOT EXISTS empresas_contratistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    contacto_nombre VARCHAR(150),
    contacto_email VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUARIOS Y CONTROL DE ACCESO (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas_contratistas(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN (
        'CONTRATISTA',
        'STAFF_RRHH',
        'MEDICO_OCUPACIONAL',
        'SEGURIDAD_PATRIMONIAL',
        'INSTRUCTOR_SSOMA',
        'ADMIN_CONTRATOS',
        'CONTROL_ACCESOS',
        'SUPER_ADMIN'
    )),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. LISTA NEGRA TRANSVERSAL (Bloqueo crítico en la unidad minera)
CREATE TABLE IF NOT EXISTS lista_negra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(20) DEFAULT 'DNI',
    numero_documento VARCHAR(30) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    motivo TEXT NOT NULL,
    tipo_falta VARCHAR(50) NOT NULL CHECK (tipo_falta IN ('MEDICA_CRITICA', 'ANTECEDENTES_PENALES', 'FALTA_GRAVE_SSOMA', 'FRAUDE_DOCUMENTARIO')),
    estado_bloqueo VARCHAR(20) DEFAULT 'PERMANENTE' CHECK (estado_bloqueo IN ('PERMANENTE', 'TEMPORAL')),
    reportado_por UUID REFERENCES usuarios(id),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. POSTULANTES / TRABAJADORES A ACREDITAR
CREATE TABLE IF NOT EXISTS postulantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas_contratistas(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(20) DEFAULT 'DNI',
    numero_documento VARCHAR(30) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150),
    grupo_sanguineo VARCHAR(10) DEFAULT 'O+',
    cv_url VARCHAR(500),
    fase_actual VARCHAR(30) DEFAULT 'FASE_1' CHECK (fase_actual IN ('FASE_1', 'FASE_2', 'FASE_3', 'FASE_4', 'FASE_5', 'FOTOCHECK', 'FINALIZADO')),
    estado_global VARCHAR(30) DEFAULT 'EN_PROCESO' CHECK (estado_global IN ('EN_PROCESO', 'OBSERVADO', 'NO_APTO', 'APROBADO_TOTAL')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tipo_documento, numero_documento)
);

-- 5. HISTORIAL DE EVALUACIONES POR FASE
CREATE TABLE IF NOT EXISTS evaluaciones_fase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    fase VARCHAR(30) NOT NULL CHECK (fase IN ('FASE_1', 'FASE_2', 'FASE_3', 'FASE_4', 'FASE_5')),
    evaluador_id UUID REFERENCES usuarios(id),
    estado_resultado VARCHAR(30) NOT NULL CHECK (estado_resultado IN ('APROBADO', 'OBSERVADO', 'NO_APTO')),
    nota NUMERIC(4,2), -- Usado en Fase 4 (Capacitación 0-20)
    fecha_vencimiento DATE, -- Usado en Fase 5 (Vigencia SCTR)
    archivo_adjunto_url VARCHAR(500), -- Examen.pdf, Poliza.pdf, EMO.pdf
    observaciones TEXT,
    subsanado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. FOTOCHECKS Y CREDENCIALES DE ACCESO
CREATE TABLE IF NOT EXISTS fotochecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID UNIQUE NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    codigo_credencial VARCHAR(50) UNIQUE NOT NULL,
    codigo_qr VARCHAR(255) NOT NULL,
    zona_autorizada VARCHAR(100) DEFAULT 'Planta y Subsuelo',
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    impreso BOOLEAN DEFAULT FALSE,
    fecha_impresion TIMESTAMP WITH TIME ZONE,
    impreso_por UUID REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDITORÍA DE CAMBIOS
CREATE TABLE IF NOT EXISTS auditoria_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID REFERENCES postulantes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    detalle JSONB,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_postulantes_empresa ON postulantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_postulantes_fase ON postulantes(fase_actual);
CREATE INDEX IF NOT EXISTS idx_postulantes_doc ON postulantes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_lista_negra_doc ON lista_negra(numero_documento);
