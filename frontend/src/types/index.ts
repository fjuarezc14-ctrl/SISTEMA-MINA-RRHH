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
  vistos_buenos?: {
    rrhh?: boolean;
    medico?: boolean;
    seguridad?: boolean;
    ssoma?: boolean;
    sctr?: boolean;
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
