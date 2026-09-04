export type RolUsuario = 
  | 'CONTRATISTA'
  | 'STAFF_RRHH'
  | 'MEDICO_OCUPACIONAL'
  | 'SEGURIDAD_PATRIMONIAL'
  | 'INSTRUCTOR_SSOMA'
  | 'ADMIN_CONTRATOS'
  | 'CONTROL_ACCESOS'
  | 'SUPER_ADMIN';

export type FaseOnboarding = 
  | 'FASE_1'
  | 'FASE_2'
  | 'FASE_3'
  | 'FASE_4'
  | 'FASE_5'
  | 'FOTOCHECK'
  | 'FINALIZADO';

export type EstadoGlobal = 
  | 'EN_PROCESO'
  | 'OBSERVADO'
  | 'NO_APTO'
  | 'APROBADO_TOTAL';

export interface Postulante {
  id: string;
  empresa_id: string;
  empresa_nombre?: string;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  telefono?: string;
  email?: string;
  grupo_sanguineo?: string;
  cv_url?: string;
  fase_actual: FaseOnboarding;
  estado_global: EstadoGlobal;
  ultima_observacion?: string;
  ultimo_archivo?: string;
  ultima_evaluacion?: {
    nota?: number;
    fecha_vencimiento?: string;
    archivo_url?: string;
    observaciones?: string;
  };
}

export interface Fotocheck {
  id: string;
  postulante_id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  cargo: string;
  grupo_sanguineo: string;
  empresa_nombre: string;
  codigo_credencial: string;
  codigo_qr: string;
  zona_autorizada: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  impreso: boolean;
}
