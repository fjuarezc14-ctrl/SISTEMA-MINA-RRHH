import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { UploadCloud, FileText, CheckCircle, Check, Clock, AlertTriangle, ShieldCheck, Eye, UserPlus, Calendar, Info, ChevronDown, ChevronUp, Users, FileCheck2, FlaskConical, X } from 'lucide-react';
import { api } from '../services/api';

// El campo coincide con el que espera el backend en POST /postulantes
const DOCUMENTOS_EXPEDIENTE = [
  { campo: 'cv', fase: 'Fase 1', area: 'RRHH', titulo: 'CV y DNI digital', obligatorio: true, prueba: 'fase1-cv-y-dni.pdf' },
  { campo: 'emo', fase: 'Fase 2', area: 'Salud ocupacional', titulo: 'Examen médico ocupacional y toxicológico', obligatorio: false, prueba: 'fase2-emo-toxicologico.pdf' },
  { campo: 'antecedentes', fase: 'Fase 3', area: 'Seguridad patrimonial', titulo: 'Certificado de antecedentes', obligatorio: false, prueba: 'fase3-antecedentes.pdf' },
  { campo: 'induccion', fase: 'Fase 4', area: 'SSOMA', titulo: 'Constancia de inducción de seguridad', obligatorio: false, prueba: 'fase4-induccion-ssoma.pdf' },
  { campo: 'sctr', fase: 'Fase 5', area: 'Contratos y seguros', titulo: 'Póliza SCTR salud y pensión', obligatorio: false, prueba: 'fase5-poliza-sctr.pdf' },
] as const;

type CampoDocumento = (typeof DOCUMENTOS_EXPEDIENTE)[number]['campo'];

const formatearTamano = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

interface PortalContratistaProps {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onSubsanar: (id: string, file: File, notas?: string) => Promise<void>;
}

export const PortalContratista: React.FC<PortalContratistaProps> = ({
  postulantes,
  userRole,
  onSubsanar,
}) => {
  const [tabActiva, setTabActiva] = useState<'personal' | 'sctr'>('personal');
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [subsanarModalOpen, setSubsanarModalOpen] = useState(false);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [nuevoModalOpen, setNuevoModalOpen] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    telefono: '',
    email: '',
    grupo_sanguineo: 'O+',
    tipo_pase: 'PERMANENTE' as 'PERMANENTE' | 'VISITA_TECNICA' | 'PROVEEDOR_LOGISTICO',
    vigencia_inicio: '',
    vigencia_fin: '',
  });
  const [nuevoError, setNuevoError] = useState('');
  const [nuevoLoading, setNuevoLoading] = useState(false);
  const [nuevosDocumentos, setNuevosDocumentos] = useState<Partial<Record<CampoDocumento, File>>>({});
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  const [campoArrastre, setCampoArrastre] = useState<CampoDocumento | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleOpenSubsanar = (p: Postulante) => {
    setSelectedPostulante(p);
    setSelectedFile(null);
    setNotas('');
    setSuccessMsg('');
    setSubsanarModalOpen(true);
  };

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  const asignarDocumento = (campo: CampoDocumento, archivo?: File) => {
    if (!archivo) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(archivo.name)) {
      setNuevoError('Solo se permiten documentos PDF, JPG o PNG.');
      return;
    }
    setNuevoError('');
    setNuevosDocumentos((prev) => ({ ...prev, [campo]: archivo }));
  };

  const quitarDocumento = (campo: CampoDocumento) =>
    setNuevosDocumentos((prev) => {
      const { [campo]: _quitado, ...resto } = prev;
      return resto;
    });

  const handleUsarDocumentosPrueba = async () => {
    setCargandoPrueba(true);
    setNuevoError('');
    try {
      const archivos = await Promise.all(
        DOCUMENTOS_EXPEDIENTE.map(async ({ campo, prueba }) => {
          const res = await fetch(`/documentos-prueba/${prueba}`);
          if (!res.ok) throw new Error(prueba);
          const blob = await res.blob();
          return [campo, new File([blob], prueba, { type: 'application/pdf' })] as const;
        })
      );
      setNuevosDocumentos(Object.fromEntries(archivos));
    } catch {
      setNuevoError('No se pudieron cargar los documentos de prueba.');
    } finally {
      setCargandoPrueba(false);
    }
  };

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNuevoError('');

    // 1. Validación de Nombres y Apellidos
    const regexTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,50}$/;
    if (!regexTexto.test(nuevoForm.nombres.trim())) {
      setNuevoError('Los nombres solo deben contener letras (de 2 a 50 caracteres).');
      return;
    }
    if (!regexTexto.test(nuevoForm.apellidos.trim())) {
      setNuevoError('Los apellidos solo deben contener letras (de 2 a 50 caracteres).');
      return;
    }

    // 2. Validación estricta de Documento
    if (nuevoForm.tipo_documento === 'DNI' && !/^\d{8}$/.test(nuevoForm.numero_documento.trim())) {
      setNuevoError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }
    if (nuevoForm.tipo_documento === 'CE' && !/^[A-Z0-9]{9}$/i.test(nuevoForm.numero_documento.trim())) {
      setNuevoError('El Carné de Extranjería (CE) debe tener 9 caracteres alfanuméricos.');
      return;
    }
    if (nuevoForm.tipo_documento === 'PASAPORTE' && !/^[A-Z0-9]{6,12}$/i.test(nuevoForm.numero_documento.trim())) {
      setNuevoError('El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.');
      return;
    }

    // 3. Validación de Teléfono Móvil si se ingresa
    if (nuevoForm.telefono.trim() && !/^9\d{8}$/.test(nuevoForm.telefono.trim())) {
      setNuevoError('El teléfono celular debe tener 9 dígitos numéricos y comenzar con 9.');
      return;
    }

    // 4. Validación de Vigencias para Pases Temporales
    if (nuevoForm.tipo_pase !== 'PERMANENTE') {
      if (!nuevoForm.vigencia_inicio || !nuevoForm.vigencia_fin) {
        setNuevoError('Debe especificar fecha de inicio y término para pases temporales.');
        return;
      }
      if (nuevoForm.vigencia_fin < nuevoForm.vigencia_inicio) {
        setNuevoError('La fecha de salida/término debe ser posterior a la fecha de inicio.');
        return;
      }
    }

    if (!nuevosDocumentos.cv) {
      setNuevoError('Debe adjuntar el CV y DNI digital: es la versión 1 del expediente que revisará el evaluador.');
      return;
    }

    setNuevoLoading(true);
    try {
      const formData = new FormData();
      Object.entries(nuevoForm).forEach(([campo, valor]) => formData.append(campo, valor));
      DOCUMENTOS_EXPEDIENTE.forEach(({ campo }) => {
        const archivo = nuevosDocumentos[campo];
        if (archivo) formData.append(campo, archivo);
      });

      // Varios documentos pueden tardar más que el timeout global del cliente
      await api.post('/postulantes', formData, { timeout: 120000 });
      setNuevoModalOpen(false);
      setNuevosDocumentos({});
      // Evitar reload completo: limpiar formulario
      setNuevoForm({
        tipo_documento: 'DNI',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        cargo: '',
        telefono: '',
        email: '',
        grupo_sanguineo: 'O+',
        tipo_pase: 'PERMANENTE',
        vigencia_inicio: '',
        vigencia_fin: '',
      });
      alert('Personal / Pase registrado con éxito. Se actualizará en la lista.');
    } catch (err: any) {
      setNuevoError(err.response?.data?.error || 'Error al registrar pase o postulante.');
    } finally {
      setNuevoLoading(false);
    }
  };

  const handleSubsanarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostulante || !selectedFile) return;

    try {
      setLoading(true);
      await onSubsanar(selectedPostulante.id, selectedFile, notas);
      setSuccessMsg('Documento actualizado (v2) y reenviado a la bandeja del evaluador de área.');
      setTimeout(() => {
        setSubsanarModalOpen(false);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al subsanar documento.');
    } finally {
      setLoading(false);
    }
  };

  const getFaseStatus = (p: Postulante, faseNum: number) => {
    const ordenFases: Record<string, number> = {
      FASE_1: 1,
      FASE_2: 2,
      FASE_3: 3,
      FASE_4: 4,
      FASE_5: 5,
      FOTOCHECK: 6,
      FINALIZADO: 6,
    };

    const actual = ordenFases[p.fase_actual] || 1;

    if (actual > faseNum || p.estado_global === 'APTO_PARA_TRABAJAR') {
      return 'APROBADO';
    }
    if (actual === faseNum) {
      return p.estado_global === 'OBSERVADO' ? 'OBSERVADO' : 'EN_PROCESO';
    }
    return 'PENDIENTE';
  };

  return (
    <div className="space-y-6">
      {/* TABS DE PORTAL CONTRATISTA */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTabActiva('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'personal'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Padrón de Personal ({postulantes.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('sctr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'sctr'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          2. Renovación Mensual SCTR
        </button>
      </div>

      {tabActiva === 'sctr' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" /> Monitoreo y Renovación de SCTR Colectivo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pólizas SCTR Salud y Pensión para habilitación legal en operaciones mineras
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                {postulantes.filter(p => p.fase_actual === 'FOTOCHECK' || p.estado_global === 'APTO_PARA_TRABAJAR').length} Asegurados Activos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Trabajador</th>
                  <th className="p-3">DNI</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Pase</th>
                  <th className="p-3">Estado SCTR</th>
                  <th className="p-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postulantes.map((p) => {
                  const tieneSctr = p.fase_actual === 'FOTOCHECK' || p.estado_global === 'APTO_PARA_TRABAJAR';
                  const sctrObs = p.fase_actual === 'FASE_5' && p.estado_global === 'OBSERVADO';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.apellidos}, {p.nombres}</td>
                      <td className="p-3 font-mono text-slate-800">{p.numero_documento}</td>
                      <td className="p-3 text-slate-600">{p.cargo}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
                          {p.tipo_pase || 'PERMANENTE'}
                        </span>
                      </td>
                      <td className="p-3">
                        {tieneSctr ? (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> VIGENTE
                          </span>
                        ) : sctrObs ? (
                          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> OBSERVADO
                          </span>
                        ) : (
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-slate-500" /> PENDIENTE FASE 5
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {sctrObs ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSubsanar(p)}
                            className="text-amber-700 hover:text-amber-800 font-bold underline"
                          >
                            Subsanar SCTR
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSplitViewer(p)}
                            className="text-blue-700 hover:text-blue-800 font-medium"
                          >
                            Ver Póliza
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabActiva === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Mis Postulantes (Servicios Mineros XYZ S.A.C.)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Semáforo de cumplimiento: Vistos Buenos requeridos para estar <span className="text-emerald-700 font-bold">APTO PARA TRABAJAR</span>
              </p>
            </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm">
              {postulantes.length} Registrados
            </span>
            <button
              onClick={() => {
                setNuevoError('');
                setNuevoModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Personal / Pase
            </button>
          </div>
        </div>

        {/* VISTA DESKTOP: TABLA HTML (hidden en mobile y tablet, visible solo en lg:block) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold">Candidato / Cargo</th>
                <th className="p-4 font-semibold text-center">Semáforo de Vistos Buenos (5 Áreas)</th>
                <th className="p-4 font-semibold text-center">Condición Oficial</th>
                <th className="p-4 font-semibold">Observaciones / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {postulantes.map((postulante) => {
                const isObservado = postulante.estado_global === 'OBSERVADO';
                const isAptoTotal = postulante.estado_global === 'APTO_PARA_TRABAJAR' || postulante.fase_actual === 'FOTOCHECK';

                return (
                  <tr key={postulante.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* CANDIDATO */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">
                          {postulante.apellidos}, {postulante.nombres}
                        </span>
                        {postulante.tipo_pase && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            postulante.tipo_pase === 'VISITA_TECNICA'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : postulante.tipo_pase === 'PROVEEDOR_LOGISTICO'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {postulante.tipo_pase.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {postulante.cargo} • Doc: <span className="font-mono text-slate-700">{postulante.numero_documento}</span>
                      </div>
                    </td>
                    
                    {/* SEMÁFORO DE LOS 5 VISTOS BUENOS */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { num: 1, label: 'RRHH' },
                          { num: 2, label: 'Médico' },
                          { num: 3, label: 'Seguridad' },
                          { num: 4, label: 'SSOMA' },
                          { num: 5, label: 'SCTR' },
                        ].map(({ num, label }) => {
                          const st = getFaseStatus(postulante, num);

                          let bg = 'bg-slate-100 text-slate-500 border-slate-200';
                          let icon = <Clock className="w-3 h-3" />;

                          if (st === 'APROBADO') {
                            bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                            icon = <Check className="w-3 h-3 text-emerald-600" />;
                          } else if (st === 'OBSERVADO') {
                            bg = 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse font-bold';
                            icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
                          } else if (st === 'EN_PROCESO') {
                            bg = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                            icon = <Clock className="w-3 h-3 text-blue-600 animate-spin" />;
                          }

                          return (
                            <div 
                              key={num}
                              title={`Paso ${num}: ${label} - Estado: ${st}`}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] ${bg}`}
                            >
                              {icon}
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* CONDICIÓN OFICIAL */}
                    <td className="p-4 text-center">
                      <Badge 
                        estado={postulante.estado_global} 
                        fase={isAptoTotal ? undefined : postulante.fase_actual}
                      />
                    </td>

                    {/* ACCIONES Y SUBSANACIÓN */}
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSplitViewer(postulante)}
                          className="inline-flex items-center gap-1 text-xs text-slate-700 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-700" /> Ver Expediente
                        </button>

                        {isObservado && (
                          <button 
                            type="button"
                            onClick={() => handleOpenSubsanar(postulante)}
                            className="inline-flex items-center gap-1 text-xs text-white bg-amber-600 hover:bg-amber-700 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Subsanar v2
                          </button>
                        )}

                        {isAptoTotal && (
                          <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Apto para Mina
                          </span>
                        )}
                      </div>

                      {isObservado && (
                        <p className="text-amber-800 text-[11px] font-medium italic mt-1">
                          "{postulante.ultima_observacion || 'Documento observado por el evaluador de área.'}"
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL Y TABLET: TARJETAS ACORDEÓN (lg:hidden) - CERO SCROLL HORIZONTAL */}
        <div className="block lg:hidden divide-y divide-slate-200">
          {postulantes.map((postulante) => {
            const isObservado = postulante.estado_global === 'OBSERVADO';
            const isAptoTotal = postulante.estado_global === 'APTO_PARA_TRABAJAR' || postulante.fase_actual === 'FOTOCHECK';
            const isExpanded = expandedId === postulante.id;

            return (
              <div key={postulante.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                {/* CABECERA DE LA TARJETA (TAPABLE) */}
                <div 
                  onClick={() => toggleAccordion(postulante.id)}
                  className="flex items-center justify-between cursor-pointer select-none gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {postulante.apellidos}, {postulante.nombres}
                      </span>
                      {postulante.tipo_pase && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                          {postulante.tipo_pase.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {postulante.cargo} • Doc: <span className="font-mono text-slate-700">{postulante.numero_documento}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      estado={postulante.estado_global} 
                      fase={isAptoTotal ? undefined : postulante.fase_actual}
                    />
                    <div className="p-1.5 text-slate-400 rounded-lg hover:bg-slate-100">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* CONTENIDO DESPLEGABLE (ACORDEÓN) */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 animate-fade-in">
                    {/* SEMÁFORO VERTICAL DE LAS 5 FASES */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        Estado de Fases y Vistos Buenos:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { num: 1, label: '1. RRHH' },
                          { num: 2, label: '2. Médico' },
                          { num: 3, label: '3. Seguridad' },
                          { num: 4, label: '4. SSOMA' },
                          { num: 5, label: '5. SCTR' },
                        ].map(({ num, label }) => {
                          const st = getFaseStatus(postulante, num);

                          let bg = 'bg-slate-100 text-slate-500 border-slate-200';
                          let icon = <Clock className="w-3 h-3" />;

                          if (st === 'APROBADO') {
                            bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                            icon = <Check className="w-3 h-3 text-emerald-600" />;
                          } else if (st === 'OBSERVADO') {
                            bg = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
                            icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
                          } else if (st === 'EN_PROCESO') {
                            bg = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                            icon = <Clock className="w-3 h-3 text-blue-600" />;
                          }

                          return (
                            <div key={num} className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs ${bg}`}>
                              {icon}
                              <span className="truncate">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* OBSERVACIÓN SI EXISTE */}
                    {isObservado && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">Observación Emitida:</span>
                        <p className="text-xs text-amber-900 italic mt-0.5">
                          "{postulante.ultima_observacion || 'Documento observado por el evaluador de área.'}"
                        </p>
                      </div>
                    )}

                    {/* BOTONES DIRECTOS (SIN SCROLL HORIZONTAL) */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSplitViewer(postulante);
                        }}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4 text-blue-700" /> Ver Expediente
                      </button>

                      {isObservado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubsanar(postulante);
                          }}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <UploadCloud className="w-4 h-4" /> Subsanar v2
                        </button>
                      )}

                      {isAptoTotal && (
                        <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-800 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Habilitado Mina
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* MODAL VISOR SPLIT-SCREEN */}
      {viewerPostulante && (
        <DocumentSplitViewer
          isOpen={splitViewerOpen}
          onClose={() => setSplitViewerOpen(false)}
          postulante={viewerPostulante}
          fase={viewerPostulante.fase_actual}
          userRole={userRole}
          onEvaluar={async (id, f, dec, det) => {
            // Si el evaluador o contratista ejecuta alguna acción desde el visor
            if (det?.observaciones && selectedFile) {
              await onSubsanar(id, selectedFile, det.observaciones);
            }
            setSplitViewerOpen(false);
          }}
        />
      )}

      {/* MODAL DE SUBSANACIÓN VERSIONADA */}
      <Modal 
        isOpen={subsanarModalOpen} 
        onClose={() => setSubsanarModalOpen(false)}
        title={`Actualizar Documento - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <form onSubmit={handleSubsanarSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <p className="text-xs font-semibold text-amber-800">Observación emitida por el área responsable:</p>
            <p className="text-sm text-amber-900 mt-1 italic">
              "{selectedPostulante?.ultima_observacion || 'Corrija el archivo solicitado.'}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Subir nueva versión corregida (PDF, JPG, PNG)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50">
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="file-subsanar"
                required
              />
              <label htmlFor="file-subsanar" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-blue-700 mb-2" />
                <span className="text-sm font-medium text-slate-900">
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el documento v2'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Máximo 15 MB • Formato oficial</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notas de descargo / Sustento para el evaluador:
            </label>
            <textarea 
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Explica qué corrección se aplicó a la póliza o certificado..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              rows={2}
            />
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setSubsanarModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading || !selectedFile}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              {loading ? 'Subiendo...' : 'Enviar Documento Actualizado'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Registrar Nuevo Personal o Pase */}
      <Modal 
        isOpen={nuevoModalOpen} 
        onClose={() => setNuevoModalOpen(false)}
        title="Registrar Nuevo Personal / Solicitud de Pase Minero"
        size="xl"
      >
        <form onSubmit={handleCrearSubmit} className="space-y-5">
          {nuevoError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {nuevoError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="space-y-4 min-w-0">
              {/* Selector de Tipo de Pase */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tipo de Pase / Categoría de Acceso Minero:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'PERMANENTE' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoForm.tipo_pase === 'PERMANENTE'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs">Permanente</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Roster 14x7 / Planta / Mina (5/5 V°B°)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'VISITA_TECNICA' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoForm.tipo_pase === 'VISITA_TECNICA'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-800">Visita Técnica</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1 a 7 días • Con Acompañante</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'PROVEEDOR_LOGISTICO' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nuevoForm.tipo_pase === 'PROVEEDOR_LOGISTICO'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-purple-800">Proveedor Logístico</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Solo Almacén / Patio Superficie</div>
                  </button>
                </div>
              </div>

              {/* Fechas de vigencia para pases temporales */}
              {nuevoForm.tipo_pase !== 'PERMANENTE' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Fecha de Ingreso / Inicio:</label>
                    <input
                      type="date"
                      value={nuevoForm.vigencia_inicio}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, vigencia_inicio: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Fecha de Salida / Término:</label>
                    <input
                      type="date"
                      value={nuevoForm.vigencia_fin}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, vigencia_fin: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Tipo de Documento:</label>
                  <select
                    value={nuevoForm.tipo_documento}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, tipo_documento: e.target.value, numero_documento: '' })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  >
                    <option value="DNI">DNI (8 dígitos)</option>
                    <option value="CARNET_EXTRANJERIA">Carnet de Extranjería (9 car.)</option>
                    <option value="PASAPORTE">Pasaporte (6 a 12 car.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Número de {nuevoForm.tipo_documento === 'DNI' ? 'DNI' : nuevoForm.tipo_documento === 'CARNET_EXTRANJERIA' ? 'C.E.' : 'Pasaporte'}:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={nuevoForm.tipo_documento === 'DNI' ? 8 : nuevoForm.tipo_documento === 'CARNET_EXTRANJERIA' ? 9 : 12}
                    value={nuevoForm.numero_documento}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase().trim();
                      if (nuevoForm.tipo_documento === 'DNI') {
                        val = val.replace(/\D/g, '').slice(0, 8);
                      }
                      setNuevoForm({ ...nuevoForm, numero_documento: val });
                    }}
                    placeholder={nuevoForm.tipo_documento === 'DNI' ? 'Ej. 45891234' : 'Ej. 001234567'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Nombres:</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.nombres}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
                      setNuevoForm({ ...nuevoForm, nombres: val });
                    }}
                    placeholder="Ej. Carlos Eduardo"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Apellidos:</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.apellidos}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
                      setNuevoForm({ ...nuevoForm, apellidos: val });
                    }}
                    placeholder="Ej. Quispe Morales"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Cargo / Puesto Minero:</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.cargo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, cargo: e.target.value })}
                    placeholder="Ej. Técnico Electricista / Conductor"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Grupo Sanguíneo y Factor RH:</label>
                  <select
                    value={nuevoForm.grupo_sanguineo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, grupo_sanguineo: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                  >
                    <option value="O+">O+ (O Positivo)</option>
                    <option value="O-">O- (O Negativo)</option>
                    <option value="A+">A+ (A Positivo)</option>
                    <option value="A-">A- (A Negativo)</option>
                    <option value="B+">B+ (B Positivo)</option>
                    <option value="B-">B- (B Negativo)</option>
                    <option value="AB+">AB+ (AB Positivo)</option>
                    <option value="AB-">AB- (AB Negativo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Teléfono Móvil (9 dígitos, inicia en 9):</label>
                  <input
                    type="text"
                    maxLength={9}
                    value={nuevoForm.telefono}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNuevoForm({ ...nuevoForm, telefono: val });
                    }}
                    placeholder="Ej. 987654321"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Email Corporativo (Opcional):</label>
                  <input
                    type="email"
                    value={nuevoForm.email}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, email: e.target.value.trim() })}
                    placeholder="trabajador@empresa.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

            </div>

            {/* EXPEDIENTE DOCUMENTAL: un documento por fase */}
            <aside
              // Evita que el navegador abra el archivo si se suelta fuera de una fila
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className="min-w-0 lg:self-start lg:border-l lg:border-slate-200 lg:pl-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900">Documentos</h4>
                <span className="text-xs text-slate-500 tabular-nums font-medium">
                  {Object.keys(nuevosDocumentos).length} de {DOCUMENTOS_EXPEDIENTE.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Haz clic o arrastra un archivo · PDF, JPG o PNG</p>

              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${(Object.keys(nuevosDocumentos).length / DOCUMENTOS_EXPEDIENTE.length) * 100}%` }}
                />
              </div>

              <ul className="mt-2 divide-y divide-slate-100">
                {DOCUMENTOS_EXPEDIENTE.map(({ campo, area, titulo, obligatorio }, indice) => {
                  const archivo = nuevosDocumentos[campo];

                  if (archivo) {
                    return (
                      <li key={campo} className="flex items-center gap-3 py-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-slate-900 font-medium truncate">{titulo}</span>
                          <span className="block text-xs text-slate-500 truncate">
                            {archivo.name} · {formatearTamano(archivo.size)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => quitarDocumento(campo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                          title="Quitar documento"
                          aria-label={`Quitar ${titulo}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={campo}>
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setCampoArrastre(campo);
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setCampoArrastre(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCampoArrastre(null);
                          asignarDocumento(campo, e.dataTransfer.files[0]);
                        }}
                        className={`group flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg cursor-pointer transition-colors ${
                          campoArrastre === campo ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-full border border-slate-300 text-xs text-slate-600 flex items-center justify-center shrink-0 group-hover:border-blue-600 group-hover:text-blue-700 transition-colors">
                          {indice + 1}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-slate-800 font-medium truncate">
                            {titulo}
                            {obligatorio && <span className="text-rose-600"> *</span>}
                          </span>
                          <span className="block text-xs text-slate-500">{area}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-blue-700 transition-colors shrink-0 font-medium">
                          <UploadCloud className="w-4 h-4" /> Subir
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            asignarDocumento(campo, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={handleUsarDocumentosPrueba}
                disabled={cargandoPrueba}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50/50 disabled:opacity-50 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {cargandoPrueba ? 'Cargando documentos…' : 'Usar documentos de prueba'}
              </button>
            </aside>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setNuevoModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={nuevoLoading}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              {nuevoLoading ? 'Creando...' : 'Registrar y Crear Expediente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
