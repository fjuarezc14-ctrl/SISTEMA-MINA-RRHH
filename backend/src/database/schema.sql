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

-- 2. USUARIOS Y CONTROL DE ACCESO (RBAC / ÁREAS RESPONSABLES)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas_contratistas(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    area_responsable VARCHAR(100),
    rol VARCHAR(50) NOT NULL CHECK (rol IN (
        'SUPER_ADMIN',
        'STAFF_RRHH',
        'MEDICO_OCUPACIONAL',
        'SEGURIDAD_PATRIMONIAL',
        'INSTRUCTOR_SSOMA',
        'ADMIN_CONTRATOS',
        'CONTROL_ACCESOS',
        'CONTRATISTA'
    )),
    activo BOOLEAN DEFAULT TRUE,
    colegiatura VARCHAR(100),
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE,
    bloqueado_definitivo BOOLEAN DEFAULT FALSE,
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
    estado_global VARCHAR(30) DEFAULT 'EN_PROCESO' CHECK (estado_global IN ('EN_PROCESO', 'OBSERVADO', 'NO_APTO', 'APTO_PARA_TRABAJAR', 'APROBADO_TOTAL', 'SUSPENDIDO_POR_VENCIMIENTO')),
    tipo_pase VARCHAR(30) DEFAULT 'PERMANENTE' CHECK (tipo_pase IN ('PERMANENTE', 'VISITA_TECNICA', 'PROVEEDOR_LOGISTICO')),
    vigencia_inicio DATE,
    vigencia_fin DATE,
    sctr_vencimiento DATE,
    emo_vencimiento DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tipo_documento, numero_documento)
);

-- 5. EVALUACIONES POR FASE
CREATE TABLE IF NOT EXISTS evaluaciones_fase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    fase VARCHAR(30) NOT NULL CHECK (fase IN ('FASE_1', 'FASE_2', 'FASE_3', 'FASE_4', 'FASE_5')),
    evaluador_id UUID REFERENCES usuarios(id),
    estado_resultado VARCHAR(30) NOT NULL CHECK (estado_resultado IN ('APROBADO', 'OBSERVADO', 'NO_APTO')),
    nota NUMERIC(4,2),
    fecha_vencimiento DATE,
    archivo_adjunto_url VARCHAR(500),
    observaciones TEXT,
    subsanado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. EXPEDIENTE DIGITAL Y DOCUMENTOS VERSIONADOS
CREATE TABLE IF NOT EXISTS expediente_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    fase VARCHAR(30) NOT NULL CHECK (fase IN ('FASE_1', 'FASE_2', 'FASE_3', 'FASE_4', 'FASE_5')),
    tipo_documento VARCHAR(100) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    archivo_url VARCHAR(500) NOT NULL,
    version INT DEFAULT 1,
    estado_documento VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado_documento IN ('PENDIENTE', 'VISTO_BUENO_APROBADO', 'OBSERVADO', 'RECHAZADO_CRITICO')),
    observacion_actual TEXT,
    subido_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDITORÍA INMUTABLE DE VISTOS BUENOS (Trazabilidad Legal WebControl)
CREATE TABLE IF NOT EXISTS auditoria_vistos_buenos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    fase VARCHAR(30) NOT NULL,
    area_evaluadora VARCHAR(100) NOT NULL,
    evaluador_id UUID REFERENCES usuarios(id),
    evaluador_nombre VARCHAR(150) NOT NULL,
    evaluador_colegiatura VARCHAR(100),
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('VISTO_BUENO', 'OBSERVADO', 'NO_APTO_LISTA_NEGRA')),
    documento_evaluado VARCHAR(100),
    version_documento INT DEFAULT 1,
    observaciones TEXT,
    metadatos JSONB,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. FOTOCHECKS Y CREDENCIALES DE ACCESO
CREATE TABLE IF NOT EXISTS fotochecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postulante_id UUID UNIQUE NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
    codigo_credencial VARCHAR(50) UNIQUE NOT NULL,
    codigo_qr VARCHAR(255) NOT NULL,
    zona_autorizada VARCHAR(100) DEFAULT 'Planta y Mina Subterránea',
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    impreso BOOLEAN DEFAULT FALSE,
    fecha_impresion TIMESTAMP WITH TIME ZONE,
    impreso_por UUID REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. VEHÍCULOS Y MAQUINARIA PESADA DE CONTRATISTAS
CREATE TABLE IF NOT EXISTS vehiculos_maquinaria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas_contratistas(id) ON DELETE CASCADE,
    placa_codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo_vehiculo VARCHAR(50) NOT NULL CHECK (tipo_vehiculo IN ('CAMIONETA_4X4', 'VOLQUETE', 'CISTERNA_COMBUSTIBLE', 'SCOOP_MINERO', 'RETROEXCAVADORA', 'MINIBUS_PERSONAL')),
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio_fabricacion INT,
    color VARCHAR(30),
    soat_vencimiento DATE NOT NULL,
    rev_tecnica_vencimiento DATE NOT NULL,
    poliza_trec_vencimiento DATE,
    checklist_seguridad JSONB,
    estado_acreditacion VARCHAR(30) DEFAULT 'EN_REVISION' CHECK (estado_acreditacion IN ('EN_REVISION', 'OBSERVADO', 'APTO_TRANSITO_MINA', 'SUSPENDIDO')),
    codigo_pase_qr VARCHAR(100) UNIQUE,
    observaciones TEXT,
    aprobado_por UUID REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. BITÁCORA Y CONTROL DE ACCESOS EN GARITA
CREATE TABLE IF NOT EXISTS accesos_garita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_acceso VARCHAR(20) NOT NULL CHECK (tipo_acceso IN ('PEATONAL_TRABAJADOR', 'VEHICULAR')),
    postulante_id UUID REFERENCES postulantes(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES vehiculos_maquinaria(id) ON DELETE SET NULL,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('AUTORIZADO', 'DENEGADO')),
    motivo_denegacion TEXT,
    garita VARCHAR(100) DEFAULT 'Garita Principal - Control Mina',
    guardia_nombre VARCHAR(150),
    guardia_id UUID REFERENCES usuarios(id),
    alcotest_resultado VARCHAR(50) DEFAULT '0.00 g/L (Apto)',
    sincronizado_offline BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. CENTRO DE NOTIFICACIONES Y ALERTAS
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas_contratistas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(30) DEFAULT 'INFO' CHECK (tipo IN ('INFO', 'OBSERVACION', 'VENCIMIENTO_SCTR', 'ALERTA_CRITICA', 'APROBADO')),
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_postulantes_empresa ON postulantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_postulantes_fase ON postulantes(fase_actual);
CREATE INDEX IF NOT EXISTS idx_postulantes_doc ON postulantes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_postulante ON expediente_documentos(postulante_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_postulante ON auditoria_vistos_buenos(postulante_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_empresa ON vehiculos_maquinaria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_accesos_fecha ON accesos_garita(creado_en);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON notificaciones(usuario_id);
