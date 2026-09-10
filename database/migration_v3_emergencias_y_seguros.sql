-- MIGRACIÓN V3: EMERGENCIAS (BAJADA 14x7), SEGUROS CON FECHA INICIO E HISTORIAL DE CLÍNICAS EN CAJAMARCA

-- 1. Agregar columna sctr_inicio a postulantes si no existe
ALTER TABLE postulantes ADD COLUMN IF NOT EXISTS sctr_inicio DATE;

-- 2. Tabla para desmovilización y bajadas de emergencia anticipada (guardias 14x7)
CREATE TABLE IF NOT EXISTS bajas_emergencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postulante_id UUID REFERENCES postulantes(id) ON DELETE CASCADE,
  tipo_emergencia VARCHAR(50) NOT NULL, -- 'MEDICA_TRABAJADOR' | 'FAMILIAR_GRAVE' | 'OPERACIONAL'
  motivo_detalle TEXT NOT NULL,
  autorizado_por VARCHAR(150) NOT NULL,
  fecha_hora_salida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(30) DEFAULT 'AUTORIZADO', -- 'AUTORIZADO' | 'EJECUTADO_EN_GARITA'
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bajas_emergencia_postulante ON bajas_emergencia(postulante_id);
CREATE INDEX IF NOT EXISTS idx_bajas_emergencia_estado ON bajas_emergencia(estado);

-- 3. Tabla para historial de pólizas y exámenes de clínicas autorizadas
CREATE TABLE IF NOT EXISTS historial_seguros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postulante_id UUID REFERENCES postulantes(id) ON DELETE CASCADE,
  tipo_seguro VARCHAR(50) NOT NULL, -- 'SCTR_SALUD' | 'SCTR_PENSION' | 'EMO_ANUAL'
  clinica_origen VARCHAR(150) NOT NULL, -- 'Clínica Limatambo Cajamarca', etc.
  numero_poliza VARCHAR(100),
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  archivo_url VARCHAR(255),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_seguros_postulante ON historial_seguros(postulante_id);
