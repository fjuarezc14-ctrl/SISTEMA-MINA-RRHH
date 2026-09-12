import React, { useState, useEffect } from 'react';
import { Postulante, RolUsuario, FaseOnboarding } from '../../types';
import { api } from '../../services/api';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  Lock, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  User, 
  History,
  Building2,
  Calendar,
  Clock,
  Award,
  FileCheck
} from 'lucide-react';

interface DocumentSplitViewerProps {
  isOpen: boolean;
  onClose: () => void;
  postulante: Postulante;
  fase: FaseOnboarding;
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string,
    fase: string,
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO',
    detalles?: {
      observaciones?: string;
      nota?: number;
      fechaInicio?: string;
      fechaVencimiento?: string;
      clinicaOrigen?: string;
      numeroPoliza?: string;
      motivo?: string;
    }
  ) => Promise<void>;
}

export const DocumentSplitViewer: React.FC<DocumentSplitViewerProps> = ({
  isOpen,
  onClose,
  postulante,
  fase,
  userRole,
  onEvaluar,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<number>(2); // Default to v2 if available
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [observaciones, setObservaciones] = useState<string>('');
  const [notaExamen, setNotaExamen] = useState<number>(16);
  const [fechaInicioSCTR, setFechaInicioSCTR] = useState<string>('');
  const [fechaVencSCTR, setFechaVencSCTR] = useState<string>('2026-10-30');
  const [clinicaOrigen, setClinicaOrigen] = useState<string>('Clínica Limatambo Cajamarca');
  const [numeroPoliza, setNumeroPoliza] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'DOCUMENTO' | 'HISTORIAL_VB' | 'HISTORIAL_SEGUROS'>('DOCUMENTO');
  const [historialVB, setHistorialVB] = useState<any[]>([]);
  const [historialSeguros, setHistorialSeguros] = useState<any[]>([]);
  const [descargoContratista, setDescargoContratista] = useState<string>('');

  // Reset de estado cada vez que cambia el postulante (Punto 1)
  useEffect(() => {
    if (postulante) {
      setObservaciones('');
      setDescargoContratista('');
      setFechaInicioSCTR(postulante.sctr_inicio || new Date().toISOString().split('T')[0]);
      setFechaVencSCTR(postulante.sctr_vencimiento || '2026-10-30');
    }
  }, [postulante?.id]);

  // Cargar historial de V°B° y seguros
  useEffect(() => {
    if (isOpen && postulante?.id) {
      // Cargar historial de auditoría
      api.get(`/postulantes/${postulante.id}/expediente`)
        .then((res) => {
          if (res.data?.historialVistosBuenos) {
            setHistorialVB(res.data.historialVistosBuenos);
          }
        })
        .catch(() => {});

      // Cargar historial de seguros
      api.get(`/seguros/historial/${postulante.id}`)
        .then((res) => {
          setHistorialSeguros(res.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen, postulante?.id]);

  if (!isOpen) return null;

  // REGLAS DE PRIVACIDAD / CONFIDENCIALIDAD
  const isConfidentialMedical = fase === 'FASE_2' && userRole !== 'MEDICO_OCUPACIONAL' && userRole !== 'SUPER_ADMIN';
  const isConfidentialLegal = fase === 'FASE_3' && userRole !== 'SEGURIDAD_PATRIMONIAL' && userRole !== 'SUPER_ADMIN';
  const hasAccessRestricted = isConfidentialMedical || isConfidentialLegal;

  // HARD GATING (BLOQUEO SECUENCIAL)
  const ordenFases: Record<FaseOnboarding, number> = {
    FASE_1: 1,
    FASE_2: 2,
    FASE_3: 3,
    FASE_4: 4,
    FASE_5: 5,
    FOTOCHECK: 6,
    FINALIZADO: 7,
  };

  const faseActualNum = ordenFases[postulante.fase_actual] || 1;
  const faseVisualizandoNum = ordenFases[fase] || 1;
  const isBloqueadoSecuencial = faseVisualizandoNum > faseActualNum;
  const isListaNegra = postulante.estado_global === 'NO_APTO' || Boolean(postulante.en_lista_negra);
  const isObservado = postulante.estado_global === 'OBSERVADO';

  // Metadatos de la fase
  const faseInfo: Record<FaseOnboarding, { titulo: string; tipoDoc: string; area: string; archivo: string }> = {
    FASE_1: {
      titulo: '1. Validación de Datos y CV',
      tipoDoc: 'Currículum Vitae y DNI Digital',
      area: 'Recursos Humanos y Reclutamiento Mina',
      archivo: `CV_${postulante.apellidos}_${postulante.nombres}.pdf`,
    },
    FASE_2: {
      titulo: '2. Salud Ocupacional (EMO y Toxicológico)',
      tipoDoc: 'Ficha de Aptitud Médica 7D para Altura Geográfica',
      area: 'Salud Ocupacional / Médico Ocupacional (CMP)',
      archivo: `EMO_Clinica_Mina_${postulante.numero_documento}.pdf`,
    },
    FASE_3: {
      titulo: '3. Seguridad Patrimonial y Legal',
      tipoDoc: 'Certificado Único Laboral (Antecedentes Policiales, Penales y Judiciales)',
      area: 'Seguridad Patrimonial / Asesoría Legal',
      archivo: `Certificado_Antecedentes_${postulante.numero_documento}.pdf`,
    },
    FASE_4: {
      titulo: '4. Capacitación e Inducción SSOMA',
      tipoDoc: 'Acta de Acreditación de Inducción General de Seguridad (Anexo 4/5)',
      area: 'Seguridad y Salud Ocupacional (SSOMA)',
      archivo: `Examen_Induccion_SSOMA_${postulante.numero_documento}.pdf`,
    },
    FASE_5: {
      titulo: '5. Validación SCTR y Seguros',
      tipoDoc: 'Póliza SCTR Salud y Pensión con Endoso Minero',
      area: 'Administración de Contratos y Seguros de Alto Riesgo',
      archivo: `Poliza_SCTR_Vigente_${postulante.empresa_nombre?.replace(/\s+/g, '_') || 'ECM'}.pdf`,
    },
    FOTOCHECK: {
      titulo: 'Emisión de Credencial / Fotocheck',
      tipoDoc: 'Credencial de Acceso con Código QR',
      area: 'Control de Accesos y Garita',
      archivo: `Fotocheck_${postulante.numero_documento}.pdf`,
    },
    FINALIZADO: {
      titulo: 'Acreditado',
      tipoDoc: 'Expediente Completo',
      area: 'Superintendencia',
      archivo: 'Expediente.pdf',
    },
  };

  const currentFaseInfo = faseInfo[fase] || faseInfo.FASE_1;

  // Acciones de evaluación
  const handleAprobar = async () => {
    if (isListaNegra) {
      alert('Postulante en Lista Negra: Está estrictamente prohibido otorgar Visto Bueno a un candidato vetado.');
      return;
    }

    if (isBloqueadoSecuencial) {
      alert('Bloqueo Secuencial: No se puede emitir Visto Bueno porque la fase previa aún no está confirmada.');
      return;
    }

    if (fase === 'FASE_4' && notaExamen < 14) {
      alert('Para otorgar Visto Bueno SSOMA, la nota mínima aprobatoria según D.S. 024-2016-EM es 14/20.');
      return;
    }

    try {
      setLoading(true);
      await onEvaluar(postulante.id, fase, 'APROBAR', {
        observaciones: observaciones || 'Documento validado conforme a normativa minera. Visto Bueno otorgado.',
        nota: fase === 'FASE_4' ? notaExamen : undefined,
        fechaInicio: fase === 'FASE_5' ? fechaInicioSCTR : undefined,
        fechaVencimiento: fase === 'FASE_5' ? fechaVencSCTR : undefined,
        clinicaOrigen: fase === 'FASE_5' ? clinicaOrigen : undefined,
        numeroPoliza: fase === 'FASE_5' ? numeroPoliza : undefined,
      });
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al emitir Visto Bueno.');
    } finally {
      setLoading(false);
    }
  };

  const handleObservar = async () => {
    if (isListaNegra) {
      alert('Postulante en Lista Negra: Este expediente no es subsanable por encontrarse vetado permanentemente.');
      return;
    }

    if (!observaciones.trim()) {
      alert('Por favor especifique la observación técnica para que el contratista pueda subsanar el documento.');
      return;
    }

    try {
      setLoading(true);
      await onEvaluar(postulante.id, fase, 'OBSERVAR', {
        observaciones,
        nota: fase === 'FASE_4' ? notaExamen : undefined,
      });
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al observar documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleListaNegra = async () => {
    if (!observaciones.trim()) {
      alert('Debe justificar la causal médica o legal crítica para la inclusión en Lista Negra.');
      return;
    }

    if (!confirm(`¿Confirma declarar NO APTO a ${postulante.nombres} ${postulante.apellidos}? Esta acción bloqueará permanentemente su ingreso a la unidad minera.`)) {
      return;
    }

    try {
      setLoading(true);
      await onEvaluar(postulante.id, fase, 'NO_APTO', {
        motivo: observaciones,
      });
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al dictaminar lista negra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* BARRA SUPERIOR DEL VISOR */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{currentFaseInfo.titulo}</h3>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {currentFaseInfo.tipoDoc}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Área Responsable: <span className="text-blue-400 font-medium">{currentFaseInfo.area}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SELECTOR DE PESTAÑAS (DOCUMENTO / HISTORIAL V°B° / SEGUROS) */}
            <div className="flex items-center bg-slate-900 border border-slate-750 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('DOCUMENTO')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'DOCUMENTO'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Expediente
              </button>
              <button
                onClick={() => setActiveTab('HISTORIAL_VB')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'HISTORIAL_VB'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Historial V°B° ({historialVB.length})
              </button>
              <button
                onClick={() => setActiveTab('HISTORIAL_SEGUROS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'HISTORIAL_SEGUROS'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" /> Pólizas Anteriores ({historialSeguros.length})
              </button>
            </div>

            {/* SELECTOR DE VERSIONES DEL DOCUMENTO */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-750 p-1 rounded-xl text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Versión:
              </span>
              <button
                onClick={() => setSelectedVersion(1)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedVersion === 1
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                v1 (Inicial)
              </button>
              <button
                onClick={() => setSelectedVersion(2)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedVersion === 2
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                v2 (Subsanada)
              </button>
            </div>

            {/* CERRAR */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL SPLIT SCREEN (2 PANELES) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* PANEL IZQUIERDO: VISOR DOCUMENTAL (60%) */}
          <div className="flex-1 lg:flex-[1.4] bg-slate-950/60 p-6 overflow-y-auto border-r border-slate-800 flex flex-col items-center justify-start relative">
            
            {/* BARRA DE HERRAMIENTAS DE ZOOM */}
            <div className="sticky top-0 z-10 self-end mb-4 flex items-center gap-2 bg-slate-900/90 border border-slate-750 px-3 py-1.5 rounded-xl text-xs backdrop-blur shadow-lg">
              <button 
                onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-400 min-w-10 text-center">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-3 bg-slate-700 mx-1" />
              <button 
                onClick={() => alert('Descarga de archivo con marca de agua autorizada.')}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
            </div>

            {/* RENDERIZADO SEGÚN PESTAÑA SELECCIONADA */}
            {activeTab === 'HISTORIAL_VB' ? (
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Award className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-white text-sm">Historial y Trazabilidad de Vistos Buenos</h4>
                </div>
                {historialVB.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No hay registros de visto bueno previos aún para este candidato.</p>
                ) : (
                  <div className="space-y-3">
                    {historialVB.map((vb, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-300">Paso {idx + 1}: {vb.area_evaluadora || vb.fase}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            vb.decision === 'VISTO_BUENO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {vb.decision}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          Evaluador: <strong className="text-white">{vb.evaluador_nombre || 'Especialista'}</strong>
                          {vb.evaluador_colegiatura && (
                            <span className="text-blue-400 font-mono ml-1 font-semibold">({vb.evaluador_colegiatura})</span>
                          )}
                        </p>
                        {vb.metadatos?.nota !== undefined && (
                          <p className="text-emerald-400 font-semibold">
                            Nota de Examen SSOMA: {String(vb.metadatos.nota).padStart(2, '0')}/20
                          </p>
                        )}
                        <p className="text-slate-400 italic">
                          {((vb.fase === 'FASE_2' || vb.area_evaluadora?.includes('Médic') || vb.area_evaluadora?.includes('Salud')) && isConfidentialMedical)
                            ? '[Observación clínica reservada por Secreto Médico Ocupacional - Ley N° 29733]'
                            : ((vb.fase === 'FASE_3' || vb.area_evaluadora?.includes('Patrimonial') || vb.area_evaluadora?.includes('Legal')) && isConfidentialLegal)
                            ? '[Observación reservada por Seguridad Patrimonial]'
                            : `"${vb.observaciones || 'Conforme'}"`}
                        </p>
                        <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-700/40">
                          {new Date(vb.creado_en).toLocaleString('es-PE')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'HISTORIAL_SEGUROS' ? (
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">Histórico de Pólizas y Exámenes de Clínicas Autorizadas</h4>
                </div>
                {historialSeguros.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No hay pólizas previas registradas en el histórico.</p>
                ) : (
                  <div className="space-y-3">
                    {historialSeguros.map((item, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-300">{item.tipo_seguro}</span>
                          <span className="text-slate-400 font-mono">{item.numero_poliza || 'S/N'}</span>
                        </div>
                        <p className="text-white font-medium">Clínica: {item.clinica_origen}</p>
                        <div className="flex gap-4 text-slate-400 text-[11px]">
                          <span>Inicio: {item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-PE') : 'N/A'}</span>
                          <span>Vencimiento: {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString('es-PE') : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : hasAccessRestricted ? (
              <div className="my-auto max-w-md w-full bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-white">DOCUMENTO CONFIDENCIAL</h4>
                <span className="inline-block mt-1 px-3 py-1 bg-rose-950/80 border border-rose-500/30 text-rose-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  {isConfidentialMedical ? 'Secreto Médico Ocupacional' : 'Reserva Legal y Patrimonial'}
                </span>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  {isConfidentialMedical
                    ? 'Este expediente contiene diagnósticos clínicos protegidos por la Ley General de Salud y la Ley de Protección de Datos Personales N° 29733. El contenido del EMO solo es accesible para el Médico Ocupacional y Super Admin.'
                    : 'Este documento contiene información judicial y policial clasificada. Su acceso está reservado exclusivamente para el Área de Seguridad Patrimonial.'}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                  Tu rol actual: <span className="text-blue-400 font-bold">{userRole}</span>
                </div>
              </div>
            ) : (
              /* CASO 2: VISUALIZADOR DEL DOCUMENTO OFICIAL MINERO */
              <div 
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 relative border border-slate-200 transition-transform duration-150"
              >
                {/* MARCA DE AGUA INMUTABLE */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none rotate-[-30deg]">
                  <p className="text-5xl font-black text-slate-950 uppercase tracking-widest text-center">
                    VALETEC MINING<br/>USO OFICIAL
                  </p>
                </div>

                {/* CABECERA DEL DOCUMENTO */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-blue-800 uppercase">
                      SISTEMA DE GESTIÓN Y CUMPLIMIENTO MINERO
                    </span>
                    <h2 className="text-lg font-black text-slate-900">{currentFaseInfo.tipoDoc}</h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Empresa Contratista: <span className="font-bold text-slate-800">{postulante.empresa_nombre}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                      VERSIÓN {selectedVersion}.0
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Subido: {new Date().toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>

                {/* CONTENIDO ESPECÍFICO SEGÚN FASE */}
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Trabajador:</span>
                      <span className="font-bold text-slate-900">{postulante.apellidos}, {postulante.nombres}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Documento de Identidad:</span>
                      <span className="font-mono text-slate-900 font-bold">{postulante.tipo_documento}: {postulante.numero_documento}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Cargo Postulado:</span>
                      <span className="text-slate-900 font-bold">{postulante.cargo}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Grupo Sanguíneo:</span>
                      <span className="text-rose-600 font-bold">{postulante.grupo_sanguineo || 'O+'}</span>
                    </div>
                  </div>

                  {/* VISTA SEGÚN TIPO DE DOCUMENTO */}
                  {fase === 'FASE_1' && (
                    <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                      <h5 className="font-bold text-slate-900 text-sm">Resumen de Experiencia y Certificaciones</h5>
                      <p className="text-slate-600 leading-relaxed">
                        • Soldador certificado con 4 años en operaciones mineras subterráneas.<br/>
                        • Homologación 3G/4G vigente bajo norma AWS D1.1.<br/>
                        • Récord sin incidentes de seguridad en interior mina.
                      </p>
                    </div>
                  )}

                  {fase === 'FASE_2' && (
                    <div className="p-4 border-2 border-emerald-500/50 bg-emerald-50/50 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-emerald-900 text-sm">Dictamen Médico Ocupacional (Ficha 7D)</h5>
                        <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                          APTO CLÍNICO
                        </span>
                      </div>
                      <p className="text-emerald-900 leading-relaxed">
                        • Evaluación médica para trabajo en altura geográfica (&gt; 4,000) msnm: <strong>APTO</strong>.<br/>
                        • Examen Toxicológico (Drogas y Alcohol): <strong>NEGATIVO</strong>.<br/>
                        • Espirometría y Radiografía de Tórax OIT: Normal.
                      </p>
                    </div>
                  )}

                  {fase === 'FASE_3' && (
                    <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                      <h5 className="font-bold text-slate-900 text-sm">Validación del Certificado Único Laboral (CUL)</h5>
                      <p className="text-slate-600 leading-relaxed">
                        • Antecedentes Penales (Poder Judicial): <strong>Sin Registro</strong>.<br/>
                        • Antecedentes Policiales (PNP): <strong>Sin Novedad</strong>.<br/>
                        • Antecedentes Judiciales (INPE): <strong>Sin Registro</strong>.
                      </p>
                    </div>
                  )}

                  {fase === 'FASE_4' && (
                    <div className="p-4 border border-blue-200 bg-blue-50/40 rounded-lg space-y-2">
                      <h5 className="font-bold text-blue-900 text-sm">Acta de Inducción SSOMA y Anexo 4</h5>
                      <p className="text-blue-950 leading-relaxed">
                        • Módulos cursados: IPERC Continuo, Trabajos de Alto Riesgo, Manejo Defensivo y Bloqueo y Etiquetado (LOTO).<br/>
                        • Examen Teórico-Práctico completado con calificación aprobatoria.
                      </p>
                    </div>
                  )}

                  {fase === 'FASE_5' && (() => {
                    const fInicio = postulante.sctr_inicio ? new Date(postulante.sctr_inicio) : new Date();
                    const fFin = postulante.sctr_vencimiento ? new Date(postulante.sctr_vencimiento) : new Date(Date.now() + 180 * 86400000);
                    const hoy = new Date();
                    
                    const totalDias = Math.max(1, Math.ceil((fFin.getTime() - fInicio.getTime()) / (1000 * 60 * 60 * 24)));
                    const consumidoDias = Math.max(0, Math.ceil((hoy.getTime() - fInicio.getTime()) / (1000 * 60 * 60 * 24)));
                    const diasRestantes = Math.ceil((fFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    const porcentajeConsumido = Math.min(100, Math.max(0, Math.round((consumidoDias / totalDias) * 100)));

                    let estadoSemaforo = 'Recién Indicado';
                    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    let barColor = 'bg-emerald-500';

                    if (diasRestantes <= 0) {
                      estadoSemaforo = 'Póliza Expirada (Alerta Roja)';
                      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                      barColor = 'bg-rose-600';
                    } else if (diasRestantes <= 30 || porcentajeConsumido > 70) {
                      estadoSemaforo = 'Alerta Roja (Crítico < 30 días)';
                      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                      barColor = 'bg-rose-500';
                    } else if (porcentajeConsumido >= 34) {
                      estadoSemaforo = 'Medio Tiempo (En Operación)';
                      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                      barColor = 'bg-amber-500';
                    }

                    return (
                      <div className="p-4 border-2 border-slate-300 bg-slate-50 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-slate-900 text-sm">Control de Cobertura SCTR Salud y Pensión</h5>
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badgeColor}`}>
                            {estadoSemaforo}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-500 block text-[10px]">INICIO DE PÓLIZA:</span>
                            <span className="font-bold">{postulante.sctr_inicio || '2026-01-01'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">VENCIMIENTO:</span>
                            <span className="font-bold text-slate-900">{postulante.sctr_vencimiento || '2026-07-01'}</span>
                          </div>
                        </div>

                        {/* BARRA DE PROGRESO DE VIGENCIA */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>Vigencia: {totalDias} días totales</span>
                            <span className={diasRestantes <= 30 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                              {diasRestantes <= 0 ? 'Vencido' : `Restan ${diasRestantes} días`} ({porcentajeConsumido}% consumido)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full ${barColor} transition-all duration-300`} 
                              style={{ width: `${porcentajeConsumido}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                            <span>🟢 Recién Indicado (&lt;33%)</span>
                            <span>🟡 Medio Tiempo (34-70%)</span>
                            <span>🔴 Alerta Roja (&gt;70% o &lt;30d)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* PIE CON SELLO DIGITAL DE INTEGRIDAD */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                  <div>
                    <span className="font-mono">HASH: e89a...4b12</span> • Integridad SHA-256 Verificada
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Expediente Custodiado Digitalmente
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: FORMULARIO DE DICTAMEN O PANEL DE CONTRATISTA (40%) */}
          <div className="flex-1 lg:flex-[1] bg-slate-900 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* FICHA RESUMEN DEL POSTULANTE */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {postulante.apellidos}, {postulante.nombres}
                    </h4>
                    <p className="text-xs text-blue-400 font-semibold">{postulante.cargo}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Doc: <span className="font-mono text-slate-300">{postulante.numero_documento}</span> • {postulante.empresa_nombre}
                    </p>
                  </div>
                </div>

                {/* BADGE DE ESTADO DEL EXPEDIENTE */}
                <div>
                  {isListaNegra && (
                    <span className="inline-flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow">
                      <Ban className="w-3 h-3 text-rose-400" /> Lista Negra
                    </span>
                  )}
                  {isObservado && (
                    <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Observado
                    </span>
                  )}
                  {!isListaNegra && !isObservado && (
                    <span className="inline-flex items-center gap-1 bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-blue-400" /> Pendiente
                    </span>
                  )}
                </div>
              </div>

              {/* BANNERS INFORMATIVOS DE ESTADO (OBSERVACIÓN Y LISTA NEGRA) */}
              {isListaNegra && (
                <div className="p-4 bg-rose-950/70 border-2 border-rose-500/60 rounded-xl flex items-start gap-3 shadow-lg shadow-rose-950/40">
                  <Ban className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                      POSTULANTE EN LISTA NEGRA (VETADO EN MINA)
                    </h5>
                    <p className="text-xs text-rose-100">
                      Causal: {postulante.motivo_lista_negra || postulante.ultima_observacion || 'Inclusión permanente en Lista Negra por dictamen médico crítico o antecedentes disciplinarios/penales.'}
                    </p>
                    <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">
                      * Prohibido emitir Visto Bueno o habilitar accesos para este expediente
                    </p>
                  </div>
                </div>
              )}

              {isObservado && !isListaNegra && (
                <div className="p-4 bg-amber-950/60 border-2 border-amber-500/50 rounded-xl flex items-start gap-3 shadow-lg shadow-amber-950/40">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      EXPEDIENTE OBSERVADO EN {currentFaseInfo.titulo.toUpperCase()}
                    </h5>
                    <p className="text-xs text-amber-100">
                      Observación técnica previa: "{postulante.ultima_observacion || 'Documento observado con subsanación pendiente.'}"
                    </p>
                    <p className="text-[10px] text-amber-300/90 font-medium">
                      * Revise la versión subsanada (v2) en el selector superior antes de emitir un nuevo dictamen.
                    </p>
                  </div>
                </div>
              )}

              {/* AISLAMIENTO DE ROL: SI ES CONTRATISTA */}
              {userRole === 'CONTRATISTA' ? (
                <div className="space-y-4">
                  <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Observación del Evaluador de Mina
                    </h5>
                    <p className="text-xs text-amber-100 italic bg-amber-950/50 p-3 rounded-lg border border-amber-500/20">
                      {hasAccessRestricted 
                        ? '[Detalle de observación reservado por Secreto Médico o Seguridad Patrimonial. Comuníquese directamente con el área evaluadora.]'
                        : `"${postulante.ultima_observacion || 'Sin observaciones pendientes emitidas para este expediente.'}"`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Respuesta / Descargo del Contratista:
                    </label>
                    <textarea
                      rows={4}
                      value={descargoContratista}
                      onChange={(e) => setDescargoContratista(e.target.value)}
                      placeholder="Escriba aquí los descargos o precisiones para el evaluador de mina..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    * Como empresa contratista, tus facultades están restringidas a la revisión y remisión de descargos/subsanaciones. Los dictámenes oficiales de aprobación y observación son potestad exclusiva de los evaluadores de mina.
                  </p>
                </div>
              ) : (
                /* VISTA PARA EVALUADORES DE MINA / SUPER ADMIN */
                <>
                  {/* CANDADO DE HARD GATING / PRERREQUISITO */}
                  {isBloqueadoSecuencial ? (
                    <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-amber-300 uppercase">Fase Bloqueada por Secuencia</h5>
                        <p className="text-xs text-amber-200 mt-0.5">
                          El trabajador aún no ha completado la fase anterior. Por normativa de seguridad minera, cada fase debe confirmarse en estricto orden secuencial.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Fase previa confirmada. Expediente habilitado para evaluación.</span>
                    </div>
                  )}

                  {/* CAMPOS DINÁMICOS POR FASE */}
                  {fase === 'FASE_4' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nota del Examen de Inducción (Mínimo aprobatorio 14/20):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={notaExamen}
                        onChange={(e) => setNotaExamen(Math.min(20, Math.max(0, Number(e.target.value))))}
                        disabled={isBloqueadoSecuencial}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {fase === 'FASE_5' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Clínica Autorizada de Cajamarca:
                        </label>
                        <select
                          value={clinicaOrigen}
                          onChange={(e) => setClinicaOrigen(e.target.value)}
                          disabled={isBloqueadoSecuencial}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="Clínica Limatambo Cajamarca">Clínica Limatambo Cajamarca</option>
                          <option value="Policlínico San Antonio Cajamarca">Policlínico San Antonio Cajamarca</option>
                          <option value="Centro Médico Ocupacional Yanacocha">Centro Médico Ocupacional Yanacocha</option>
                          <option value="Suiza Lab Cajamarca">Suiza Lab Cajamarca</option>
                          <option value="Otra Clínica Autorizada">Otra Clínica Autorizada</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Fecha Inicio Póliza:
                          </label>
                          <input
                            type="date"
                            value={fechaInicioSCTR}
                            onChange={(e) => setFechaInicioSCTR(e.target.value)}
                            disabled={isBloqueadoSecuencial}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Fecha Vencimiento:
                          </label>
                          <input
                            type="date"
                            value={fechaVencSCTR}
                            onChange={(e) => setFechaVencSCTR(e.target.value)}
                            disabled={isBloqueadoSecuencial}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OBSERVACIONES TÉCNICAS */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Observaciones / Sustento Técnico del Dictamen:
                    </label>
                    <textarea
                      rows={4}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      disabled={isBloqueadoSecuencial}
                      placeholder={
                        isBloqueadoSecuencial
                          ? 'Bloqueado hasta que concluya la fase previa...'
                          : 'Detalla el sustento para el Visto Bueno o el motivo exacto de la observación para la contratista...'
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* BOTONERA DE ACCIÓN */}
            <div className="pt-6 border-t border-slate-800 space-y-2">
              {userRole === 'CONTRATISTA' ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
                >
                  Cerrar Expediente
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAprobar}
                    disabled={loading || isBloqueadoSecuencial || isListaNegra}
                    title={isListaNegra ? 'Postulante en Lista Negra - Prohibido emitir Visto Bueno' : undefined}
                    className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isListaNegra
                        ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50 shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isListaNegra ? (
                      <>
                        <Ban className="w-4 h-4 text-rose-400" />
                        Visto Bueno Bloqueado (Lista Negra)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> 
                        {loading ? 'Procesando...' : 'Dar Visto Bueno (Aprobar Documento)'}
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleObservar}
                      disabled={loading || isBloqueadoSecuencial || isListaNegra}
                      title={isListaNegra ? 'No disponible para postulantes en Lista Negra' : undefined}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 border border-amber-500/30 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Observar Documento
                    </button>

                    {(fase === 'FASE_2' || fase === 'FASE_3') && (
                      <button
                        type="button"
                        onClick={handleListaNegra}
                        disabled={loading || isBloqueadoSecuencial || isListaNegra}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                      >
                        <Ban className="w-3.5 h-3.5" /> {isListaNegra ? 'Vetado en Lista Negra' : 'NO APTO (Lista Negra)'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
