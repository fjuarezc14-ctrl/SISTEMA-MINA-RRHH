export type RolUsuario = 
  | 'SUPER_ADMIN'
  | 'CONTRATISTA'
  | 'STAFF_RRHH'
  | 'MEDICO_OCUPACIONAL'
  | 'SEGURIDAD_PATRIMONIAL'
  | 'INSTRUCTOR_SSOMA'
  | 'ADMIN_CONTRATOS'
  | 'CONTROL_ACCESOS';

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
  | 'APTO_PARA_TRABAJAR'
  | 'APROBADO_TOTAL';

export interface DocumentoDigital {
  id: string;
  fase: FaseOnboarding;
  tipo_documento: 'CV_Y_DNI' | 'FICHA_EMO_TOX' | 'ANTECEDENTES_PENALES' | 'INDUCCION_SSOMA' | 'POLIZA_SCTR';
  titulo: string;
  nombre_archivo: string;
  version: number;
  estado_documento: 'PENDIENTE' | 'VISTO_BUENO_APROBADO' | 'OBSERVADO' | 'RECHAZADO_CRITICO';
  observacion_actual?: string;
  subido_en: string;
  area_evaluadora: string;
  confidencial?: boolean;
  mensajePrivacidad?: string;
  archivo_simulado?: {
    tipo: string;
    institucion: string;
    detalles: Record<string, string>;
    sello: string;
  };
}

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
  documentos?: DocumentoDigital[];
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

export interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  area_responsable: string;
  activo: boolean;
  empresa_nombre?: string;
  creado_en?: string;
}

export interface AuditoriaVistoBueno {
  id: string;
  postulante_id: string;
  postulante_nombres: string;
  postulante_apellidos: string;
  postulante_dni: string;
  postulante_cargo: string;
  empresa_nombre: string;
  fase: string;
  area_evaluadora: string;
  evaluador_nombre: string;
  decision: 'VISTO_BUENO' | 'OBSERVADO' | 'NO_APTO_LISTA_NEGRA';
  observaciones?: string;
  fecha_registro: string;
}

export interface StatsDashboard {
  total: number;
  aptosParaTrabajar: number;
  observados: number;
  enProceso: number;
  bloqueadosListaNegra: number;
}
