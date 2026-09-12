import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { UploadCloud, FileText, CheckCircle, Check, Clock, AlertTriangle, ShieldCheck, Eye, UserPlus, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';

interface PortalContratistaProps {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onSubsanar: (id: string, file: File, notas?: string) => Promise<void>;
}

export const PortalContratista: React.FC<PortalContratistaProps> = ({ postulantes, userRole, onSubsanar }) => {
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

    setNuevoLoading(true);
    try {
      await api.post('/postulantes', nuevoForm);
      setNuevoModalOpen(false);
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
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80">
          <div>
            <h3 className="font-bold text-lg text-white">Mis Postulantes (Servicios Mineros XYZ S.A.C.)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Semáforo de cumplimiento: Vistos Buenos requeridos para estar <span className="text-emerald-400 font-bold">APTO PARA TRABAJAR</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 bg-slate-700/60 text-slate-300 rounded-lg">
              {postulantes.length} Registrados
            </span>
            <button
              onClick={() => {
                setNuevoError('');
                setNuevoModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Personal / Pase
            </button>
          </div>
        </div>

        {/* VISTA DESKTOP: TABLA HTML (hidden en mobile y tablet, visible solo en lg:block) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="p-4 font-semibold">Candidato / Cargo</th>
                <th className="p-4 font-semibold text-center">Semáforo de Vistos Buenos (5 Áreas)</th>
                <th className="p-4 font-semibold text-center">Condición Oficial</th>
                <th className="p-4 font-semibold">Observaciones / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {postulantes.map((postulante) => {
                const isObservado = postulante.estado_global === 'OBSERVADO';
                const isAptoTotal = postulante.estado_global === 'APTO_PARA_TRABAJAR' || postulante.fase_actual === 'FOTOCHECK';

                return (
                  <tr key={postulante.id} className="hover:bg-slate-750/50 transition-colors">
                    {/* CANDIDATO */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">
                          {postulante.apellidos}, {postulante.nombres}
                        </span>
                        {postulante.tipo_pase && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            postulante.tipo_pase === 'VISITA_TECNICA'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : postulante.tipo_pase === 'PROVEEDOR_LOGISTICO'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {postulante.tipo_pase.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {postulante.cargo} • Doc: <span className="font-mono text-slate-300">{postulante.numero_documento}</span>
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

                          let bg = 'bg-slate-800 text-slate-500 border-slate-700';
                          let icon = <Clock className="w-3 h-3" />;

                          if (st === 'APROBADO') {
                            bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 font-bold';
                            icon = <Check className="w-3 h-3 text-emerald-400" />;
                          } else if (st === 'OBSERVADO') {
                            bg = 'bg-amber-950/70 text-amber-300 border-amber-500/40 animate-pulse font-bold';
                            icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
                          } else if (st === 'EN_PROCESO') {
                            bg = 'bg-blue-950/70 text-blue-300 border-blue-500/40 font-bold';
                            icon = <Clock className="w-3 h-3 text-blue-400 animate-spin" />;
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
                          className="inline-flex items-center gap-1 text-xs text-blue-300 bg-slate-700/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-600 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" /> Ver Expediente
                        </button>

                        {isObservado && (
                          <button 
                            type="button"
                            onClick={() => handleOpenSubsanar(postulante)}
                            className="inline-flex items-center gap-1 text-xs text-white bg-amber-600 hover:bg-amber-500 font-bold px-3 py-1.5 rounded-lg shadow transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Subsanar v2
                          </button>
                        )}

                        {isAptoTotal && (
                          <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Apto para Mina
                          </span>
                        )}
                      </div>

                      {isObservado && (
                        <p className="text-amber-300 text-[11px] font-medium italic mt-1">
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
        <div className="block lg:hidden divide-y divide-slate-800">
          {postulantes.map((postulante) => {
            const isObservado = postulante.estado_global === 'OBSERVADO';
            const isAptoTotal = postulante.estado_global === 'APTO_PARA_TRABAJAR' || postulante.fase_actual === 'FOTOCHECK';
            const isExpanded = expandedId === postulante.id;

            return (
              <div key={postulante.id} className="p-4 bg-slate-850/40 hover:bg-slate-800/40 transition-colors">
                {/* CABECERA DE LA TARJETA (TAPABLE) */}
                <div 
                  onClick={() => toggleAccordion(postulante.id)}
                  className="flex items-center justify-between cursor-pointer select-none gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {postulante.apellidos}, {postulante.nombres}
                      </span>
                      {postulante.tipo_pase && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {postulante.tipo_pase.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {postulante.cargo} • Doc: <span className="font-mono text-slate-300">{postulante.numero_documento}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      estado={postulante.estado_global} 
                      fase={isAptoTotal ? undefined : postulante.fase_actual}
                    />
                    <div className="p-1.5 text-slate-400 rounded-lg hover:bg-slate-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* CONTENIDO DESPLEGABLE (ACORDEÓN) */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-750/70 space-y-3 animate-fade-in">
                    {/* SEMÁFORO VERTICAL DE LAS 5 FASES */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
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

                          let bg = 'bg-slate-800 text-slate-400 border-slate-700';
                          let icon = <Clock className="w-3 h-3" />;

                          if (st === 'APROBADO') {
                            bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 font-bold';
                            icon = <Check className="w-3 h-3 text-emerald-400" />;
                          } else if (st === 'OBSERVADO') {
                            bg = 'bg-amber-950/70 text-amber-300 border-amber-500/40 font-bold';
                            icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
                          } else if (st === 'EN_PROCESO') {
                            bg = 'bg-blue-950/70 text-blue-300 border-blue-500/40 font-bold';
                            icon = <Clock className="w-3 h-3 text-blue-400" />;
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
                      <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">Observación Emitida:</span>
                        <p className="text-xs text-amber-200 italic mt-0.5">
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
                        className="flex-1 bg-slate-750 hover:bg-slate-700 text-blue-300 border border-blue-500/30 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-blue-400" /> Ver Expediente
                      </button>

                      {isObservado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubsanar(postulante);
                          }}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                        >
                          <UploadCloud className="w-4 h-4" /> Subsanar v2
                        </button>
                      )}

                      {isAptoTotal && (
                        <div className="flex-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Habilitado Mina
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
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
            <p className="text-xs font-semibold text-amber-300">Observación emitida por el área responsable:</p>
            <p className="text-sm text-amber-100 mt-1 italic">
              "{selectedPostulante?.ultima_observacion || 'Corrija el archivo solicitado.'}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Subir nueva versión corregida (PDF, JPG, PNG)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-800/50">
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="file-subsanar"
                required
              />
              <label htmlFor="file-subsanar" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm font-medium text-white">
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el documento v2'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Máximo 15 MB • Formato oficial</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notas de descargo / Sustento para el evaluador:
            </label>
            <textarea 
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Explica qué corrección se aplicó a la póliza o certificado..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
              rows={2}
            />
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-medium">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setSubsanarModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
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
      >
        <form onSubmit={handleCrearSubmit} className="space-y-4">
          {nuevoError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-medium">
              {nuevoError}
            </div>
          )}

          {/* Selector de Tipo de Pase */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Tipo de Pase / Categoría de Acceso Minero:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'PERMANENTE' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  nuevoForm.tipo_pase === 'PERMANENTE'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs">Permanente</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Roster 14x7 / Planta / Mina (5/5 V°B°)</div>
              </button>

              <button
                type="button"
                onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'VISITA_TECNICA' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  nuevoForm.tipo_pase === 'VISITA_TECNICA'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-amber-300">Visita Técnica</div>
                <div className="text-[10px] text-slate-400 mt-0.5">1 a 7 días • Con Acompañante</div>
              </button>

              <button
                type="button"
                onClick={() => setNuevoForm({ ...nuevoForm, tipo_pase: 'PROVEEDOR_LOGISTICO' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  nuevoForm.tipo_pase === 'PROVEEDOR_LOGISTICO'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-purple-300">Proveedor Logístico</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Solo Almacén / Patio Superficie</div>
              </button>
            </div>
          </div>

          {/* Fechas de vigencia para pases temporales */}
          {nuevoForm.tipo_pase !== 'PERMANENTE' && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Fecha de Ingreso / Inicio:</label>
                <input
                  type="date"
                  value={nuevoForm.vigencia_inicio}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, vigencia_inicio: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Fecha de Salida / Término:</label>
                <input
                  type="date"
                  value={nuevoForm.vigencia_fin}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, vigencia_fin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Tipo de Documento:</label>
              <select
                value={nuevoForm.tipo_documento}
                onChange={(e) => setNuevoForm({ ...nuevoForm, tipo_documento: e.target.value, numero_documento: '' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="DNI">DNI (8 dígitos)</option>
                <option value="CARNET_EXTRANJERIA">Carnet de Extranjería (9 car.)</option>
                <option value="PASAPORTE">Pasaporte (6 a 12 car.)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Nombres:</label>
              <input
                type="text"
                required
                value={nuevoForm.nombres}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
                  setNuevoForm({ ...nuevoForm, nombres: val });
                }}
                placeholder="Ej. Carlos Eduardo"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Apellidos:</label>
              <input
                type="text"
                required
                value={nuevoForm.apellidos}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
                  setNuevoForm({ ...nuevoForm, apellidos: val });
                }}
                placeholder="Ej. Quispe Morales"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Cargo / Puesto Minero:</label>
              <input
                type="text"
                required
                value={nuevoForm.cargo}
                onChange={(e) => setNuevoForm({ ...nuevoForm, cargo: e.target.value })}
                placeholder="Ej. Técnico Electricista / Conductor"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Grupo Sanguíneo y Factor RH:</label>
              <select
                value={nuevoForm.grupo_sanguineo}
                onChange={(e) => setNuevoForm({ ...nuevoForm, grupo_sanguineo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
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
              <label className="block text-xs text-slate-300 mb-1">Teléfono Móvil (9 dígitos, inicia en 9):</label>
              <input
                type="text"
                maxLength={9}
                value={nuevoForm.telefono}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setNuevoForm({ ...nuevoForm, telefono: val });
                }}
                placeholder="Ej. 987654321"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Email Corporativo (Opcional):</label>
              <input
                type="email"
                value={nuevoForm.email}
                onChange={(e) => setNuevoForm({ ...nuevoForm, email: e.target.value.trim() })}
                placeholder="trabajador@empresa.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setNuevoModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={nuevoLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg"
            >
              {nuevoLoading ? 'Creando...' : 'Registrar y Crear Expediente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
