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
  tipo_pase?: 'PERMANENTE' | 'VISITA_TECNICA' | 'PROVEEDOR_LOGISTICO';
  vigencia_inicio?: string;
  vigencia_fin?: string;
  ultima_observacion?: string;
  ultimo_archivo?: string;
  sctr_vencimiento?: string;
  emo_vencimiento?: string;
  dias_restantes_sctr?: number;
  documentos?: DocumentoDigital[];
}

export interface VehiculoMaquinaria {
  id: string;
  empresa_id: string;
  empresa_nombre?: string;
  placa_codigo: string;
  tipo_vehiculo: 'CAMIONETA_4X4' | 'VOLQUETE' | 'CISTERNA_COMBUSTIBLE' | 'SCOOP_MINERO' | 'RETROEXCAVADORA' | 'MINIBUS_PERSONAL';
  marca: string;
  modelo: string;
  anio_fabricacion?: number;
  color?: string;
  soat_vencimiento: string;
  rev_tecnica_vencimiento: string;
  poliza_trec_vencimiento?: string;
  checklist_seguridad?: {
    jaula_antivuelco?: boolean;
    pertiga_led?: boolean;
    circulina?: boolean;
    extintor_pqs?: boolean;
    cinturones_3puntos?: boolean;
    traba_tuercas?: boolean;
  };
  estado_acreditacion: 'EN_REVISION' | 'OBSERVADO' | 'APTO_TRANSITO_MINA' | 'SUSPENDIDO';
  codigo_pase_qr: string;
  observaciones?: string;
  aprobado_por?: string;
  creado_en?: string;
}

export interface AccesoGarita {
  id: string;
  tipo_acceso: 'PEATONAL_TRABAJADOR' | 'VEHICULAR';
  postulante_id?: string;
  postulante_nombres?: string;
  postulante_apellidos?: string;
  postulante_dni?: string;
  postulante_cargo?: string;
  vehiculo_placa?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  tipo_vehiculo?: string;
  resultado: 'AUTORIZADO' | 'DENEGADO';
  motivo_denegacion?: string;
  garita: string;
  guardia_nombre: string;
  alcotest_resultado?: string;
  sincronizado_offline?: boolean;
  postulante_tipo_pase?: string;
  creado_en: string;
}

export interface Notificacion {
  id: string;
  usuario_id?: string;
  empresa_id?: string;
  titulo: string;
  mensaje: string;
  tipo: 'INFO' | 'OBSERVACION' | 'VENCIMIENTO_SCTR' | 'ALERTA_CRITICA' | 'APROBADO';
  leido: boolean;
  creado_en: string;
}

export interface SlaArea {
  fase: string;
  area: string;
  sla_objetivo_horas: number;
  tiempo_promedio_horas: number;
  tasa_aprobacion: number;
}

export interface RankingContratista {
  empresa: string;
  ruc: string;
  total_postulantes: number;
  aptos: number;
  observados: number;
  bloqueados: number;
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
  colegiatura?: string;
  activo: boolean;
  intentos_fallidos?: number;
  bloqueado_hasta?: string | null;
  bloqueado_definitivo?: boolean;
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
  evaluador_colegiatura?: string;
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
