-- ============================================================
-- MIGRACIÓN V5: BLINDAJE NO INVASIVO Y INTEGRIDAD ATÓMICA
-- Sistema de Onboarding y Control de Accesos Mineros - VALETEC
-- Cumplimiento de Seguridad Minera y Resiliencia Operativa
-- ============================================================

-- 1. SECUENCIA Y TRIGGER PARA ASIGNACIÓN ATÓMICA DE CÓDIGOS DE FOTOCHECK
-- Resuelve condiciones de carrera (Race Conditions) y colisiones al generar credenciales simultáneas
CREATE SEQUENCE IF NOT EXISTS seq_fotocheck_codigo START WITH 10001;

-- Sincronizar el valor inicial de la secuencia por encima del máximo existente
SELECT setval('seq_fotocheck_codigo', GREATEST(10000, COALESCE((
    SELECT MAX(NULLIF(regexp_replace(codigo_credencial, '^VT-[0-9]{4}-0*', ''), ''))::bigint 
    FROM fotochecks 
    WHERE codigo_credencial ~ '^VT-[0-9]{4}-[0-9]+$'
), 0) + 1));

-- Función que asigna correlativo automático si el código es nulo o si ya existe (previniendo fallo por restricción UNIQUE)
CREATE OR REPLACE FUNCTION fn_generate_fotocheck_codigo()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_seq BIGINT;
BEGIN
    IF NEW.codigo_credencial IS NULL OR EXISTS (
        SELECT 1 FROM fotochecks 
        WHERE codigo_credencial = NEW.codigo_credencial 
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        v_seq := nextval('seq_fotocheck_codigo');
        NEW.codigo_credencial := 'VT-' || v_year || '-' || LPAD(v_seq::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fotocheck_codigo ON fotochecks;
CREATE TRIGGER trg_fotocheck_codigo
BEFORE INSERT ON fotochecks
FOR EACH ROW
EXECUTE FUNCTION fn_generate_fotocheck_codigo();

-- 2. BLINDAJE INFRANQUEABLE DE LISTA NEGRA (DEFENSA EN PROFUNDIDAD A NIVEL BD)
-- Impide bajo cualquier circunstancia que un DNI sancionado sea activado como APTO_PARA_TRABAJAR o APROBADO_TOTAL
CREATE OR REPLACE FUNCTION fn_protect_blacklisted_postulante()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.estado_global IN ('APTO_PARA_TRABAJAR', 'APROBADO_TOTAL')) THEN
        IF EXISTS (
            SELECT 1 FROM lista_negra 
            WHERE numero_documento = NEW.numero_documento
        ) THEN
            RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD MINERA: El postulante con documento % figura en la LISTA NEGRA de la unidad minera y no puede ser habilitado.', NEW.numero_documento;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_blacklisted_postulante ON postulantes;
CREATE TRIGGER trg_protect_blacklisted_postulante
BEFORE INSERT OR UPDATE OF estado_global, numero_documento ON postulantes
FOR EACH ROW
EXECUTE FUNCTION fn_protect_blacklisted_postulante();

-- 3. RESTRICCIONES CHECK DE INTEGRIDAD MÉDICA Y OPERATIVA EN POSTULANTES
-- Grupo sanguíneo válido según estándares médicos
ALTER TABLE postulantes 
  DROP CONSTRAINT IF EXISTS chk_postulantes_grupo_sanguineo,
  ADD CONSTRAINT chk_postulantes_grupo_sanguineo 
  CHECK (grupo_sanguineo IS NULL OR grupo_sanguineo IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'));

-- Coherencia de fechas SCTR
ALTER TABLE postulantes 
  DROP CONSTRAINT IF EXISTS chk_postulantes_sctr_fechas,
  ADD CONSTRAINT chk_postulantes_sctr_fechas 
  CHECK (sctr_vencimiento IS NULL OR sctr_inicio IS NULL OR sctr_vencimiento >= sctr_inicio);

-- 4. RESTRICCIONES CHECK DE INTEGRIDAD PARA PARQUE AUTOMOTOR
ALTER TABLE vehiculos_maquinaria 
  DROP CONSTRAINT IF EXISTS chk_vehiculos_anio,
  ADD CONSTRAINT chk_vehiculos_anio 
  CHECK (anio_fabricacion IS NULL OR (anio_fabricacion >= 1990 AND anio_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE) + 1));

-- 5. ÍNDICES ESTRATÉGICOS DE RENDIMIENTO PARA AUDITORÍAS Y BÚSQUEDAS EN GARITA
CREATE INDEX IF NOT EXISTS idx_postulantes_sctr_fechas ON postulantes(sctr_inicio, sctr_vencimiento);
CREATE INDEX IF NOT EXISTS idx_postulantes_vigencia ON postulantes(vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_fotochecks_vencimiento ON fotochecks(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_vehiculos_soat_venc ON vehiculos_maquinaria(soat_vencimiento);
CREATE INDEX IF NOT EXISTS idx_vehiculos_rev_tecnica ON vehiculos_maquinaria(rev_tecnica_vencimiento);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON vehiculos_maquinaria(estado_acreditacion);
