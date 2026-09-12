import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { ClipboardCheck, FileText, AlertTriangle, ShieldCheck, Eye, Lock, CheckCircle, Ban, Filter } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';

interface Fase5Props {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string, 
    fase: string,
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO', 
    detalles?: any
  ) => Promise<void>;
}

export const Fase5SCTR: React.FC<Fase5Props> = ({ postulantes, userRole, onEvaluar }) => {
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('TODOS');
  const candidatosFase5 = postulantes.filter((p) => p.fase_actual === 'FASE_5');
  const candidatosBloqueados = postulantes.filter((p) => ['FASE_1', 'FASE_2', 'FASE_3', 'FASE_4'].includes(p.fase_actual));

  const candidatosFiltrados = candidatosFase5.filter((p) => {
    const isLN = p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra);
    const isObs = p.estado_global === 'OBSERVADO';
    if (filtroEstado === 'OBSERVADOS') return isObs;
    if (filtroEstado === 'LISTA_NEGRA') return isLN;
    if (filtroEstado === 'PENDIENTES') return !isObs && !isLN;
    return true;
  });

  const conteoObs = candidatosFase5.filter((p) => p.estado_global === 'OBSERVADO').length;
  const conteoLN = candidatosFase5.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra)).length;
  const conteoPendientes = candidatosFase5.length - conteoObs - conteoLN;

  const [fechasInicio, setFechasInicio] = useState<Record<string, string>>({});
  const [fechasVenc, setFechasVenc] = useState<Record<string, string>>({});
  const [clinicas, setClinicas] = useState<Record<string, string>>({});
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);
  const [motivoObs, setMotivoObs] = useState('La póliza SCTR subida está vencida o no cuenta con endoso minero.');
  const [loading, setLoading] = useState(false);

  const handleFechaInicioChange = (id: string, val: string) => {
    setFechasInicio((prev) => ({ ...prev, [id]: val }));
  };

  const handleFechaChange = (id: string, val: string) => {
    setFechasVenc((prev) => ({ ...prev, [id]: val }));
  };

  const handleClinicaChange = (id: string, val: string) => {
    setClinicas((prev) => ({ ...prev, [id]: val }));
  };

  const handleOpenObservar = (p: Postulante) => {
    setSelectedPostulante(p);
    setObservarModalOpen(true);
  };

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  const handleAprobar = async (id: string) => {
    const fInicio = fechasInicio[id] || new Date().toISOString().split('T')[0];
    const fVenc = fechasVenc[id];
    const clinica = clinicas[id] || 'Clínica Limatambo Cajamarca';

    if (!fVenc) {
      alert('Acción requerida: Seleccione en el calendario la fecha real de vencimiento consignada en la póliza SCTR.');
      return;
    }

    if (fVenc <= fInicio) {
      alert('Coherencia de fechas: La fecha de vencimiento debe ser posterior a la fecha de inicio de la póliza.');
      return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    if (fVenc < hoyStr) {
      alert('Normativa minera D.S. 024-2016-EM: No se puede otorgar Visto Bueno si la póliza SCTR se encuentra vencida a la fecha de hoy.');
      return;
    }

    try {
      setLoading(true);
      await onEvaluar(id, 'FASE_5', 'APROBAR', {
        fechaInicio: fInicio,
        fechaVencimiento: fVenc,
        clinicaOrigen: clinica,
        observaciones: `Póliza SCTR validada conforme con ${clinica}. Trabajador Apto para Trabajar.`,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al validar SCTR.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmObservar = async () => {
    if (!selectedPostulante) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'FASE_5', 'OBSERVAR', {
        observaciones: motivoObs,
      });
      setObservarModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar SCTR.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 border-t-4 border-t-emerald-500 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-750">
          <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" /> Fase 5: Validación SCTR y Pólizas de Alto Riesgo
          </h3>
          <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
            Área Responsable: Administración de Contratos y Seguros
          </span>
        </div>

        {/* FILTROS DE ESTADO */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            type="button"
            onClick={() => setFiltroEstado('TODOS')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filtroEstado === 'TODOS'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Todos ({candidatosFase5.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('PENDIENTES')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filtroEstado === 'PENDIENTES'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Pendientes ({conteoPendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('OBSERVADOS')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filtroEstado === 'OBSERVADOS'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-900 text-amber-400/80 hover:text-amber-300 border border-slate-700'
            }`}
          >
            Observados ({conteoObs})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('LISTA_NEGRA')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filtroEstado === 'LISTA_NEGRA'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-900 text-rose-400/80 hover:text-rose-300 border border-slate-700'
            }`}
          >
            Lista Negra ({conteoLN})
          </button>
        </div>

        {candidatosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            {filtroEstado === 'TODOS'
              ? 'No hay postulantes pendientes de validación SCTR en este momento.'
              : `No se encontraron postulantes con estado "${filtroEstado.replace('_', ' ')}".`}
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFiltrados.map((candidato) => {
              const fechaVal = fechasVenc[candidato.id] || candidato.sctr_vencimiento || '';
              const isListaNegra = candidato.estado_global === 'NO_APTO' || Boolean(candidato.en_lista_negra);

              return (
                <div 
                  key={candidato.id}
                  className={`rounded-xl p-4 sm:p-5 border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all ${getDocumentCardBorderClass(candidato)}`}
                >
                  <div className="space-y-2 flex-1 min-w-0 w-full">
                    <h4 className="font-bold text-white text-base">
                      {candidato.apellidos}, {candidato.nombres}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cargo: <span className="text-slate-200 font-medium">{candidato.cargo}</span> • Empresa: <span className="text-slate-300">{candidato.empresa_nombre}</span> • DNI: <span className="font-mono text-slate-300">{candidato.numero_documento}</span>
                    </p>

                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-0.5 whitespace-nowrap">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Fases 1, 2, 3 y 4 Confirmadas con Visto Bueno
                    </div>

                    {/* ESTADO VISUAL DE LA TARJETA (OBSERVADO / LISTA NEGRA / PENDIENTE) */}
                    <DocumentCardStatus postulante={candidato} />

                    <div className="flex flex-wrap gap-2.5 items-center pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Clínica:</span>
                        <select
                          disabled={isListaNegra}
                          value={clinicas[candidato.id] || 'Clínica Limatambo Cajamarca'}
                          onChange={(e) => handleClinicaChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="Clínica Limatambo Cajamarca">Clínica Limatambo Cajamarca</option>
                          <option value="Policlínico San Antonio Cajamarca">Policlínico San Antonio Cajamarca</option>
                          <option value="Centro Médico Ocupacional Yanacocha">Centro Médico Ocupacional Yanacocha</option>
                          <option value="Suiza Lab Cajamarca">Suiza Lab Cajamarca</option>
                          <option value="Otra Clínica Autorizada">Otra Clínica Autorizada</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Inicio:</span>
                        <input 
                          type="date" 
                          disabled={isListaNegra}
                          value={fechasInicio[candidato.id] || new Date().toISOString().split('T')[0]}
                          onChange={(e) => handleFechaInicioChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Vencimiento:</span>
                        <input 
                          type="date" 
                          disabled={isListaNegra}
                          value={fechaVal}
                          onChange={(e) => handleFechaChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end pt-3 xl:pt-0 border-t border-slate-800/80 xl:border-t-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenSplitViewer(candidato)}
                      className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> Inspeccionar Póliza
                    </button>

                    {!isListaNegra && (
                      <button 
                        type="button"
                        onClick={() => handleOpenObservar(candidato)}
                        className="flex-1 sm:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Observar
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleAprobar(candidato.id)}
                      disabled={isListaNegra}
                      title={isListaNegra ? 'Candidato en Lista Negra - Prohibido emitir V°B°' : undefined}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap ${
                        isListaNegra
                          ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50 shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      }`}
                    >
                      {isListaNegra ? (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-400" /> V°B° Bloqueado
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Dar V°B° SCTR
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CANDIDATOS BLOQUEADOS POR HARD GATING */}
        {candidatosBloqueados.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-750">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Postulantes Bloqueados (Esperando Fases Anteriores)
            </h5>
            <div className="space-y-2 opacity-60">
              {candidatosBloqueados.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-300">{p.apellidos}, {p.nombres}</span>
                    <span className="text-slate-500 ml-2">({p.cargo})</span>
                  </div>
                  <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Requiere V°B° en {p.fase_actual}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL VISOR SPLIT-SCREEN */}
      {viewerPostulante && (
        <DocumentSplitViewer
          isOpen={splitViewerOpen}
          onClose={() => setSplitViewerOpen(false)}
          postulante={viewerPostulante}
          fase="FASE_5"
          userRole={userRole}
          onEvaluar={onEvaluar}
        />
      )}

      {/* MODAL OBSERVACIÓN */}
      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar Póliza SCTR - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Especifique el motivo por el cual la póliza SCTR Salud / Pensión no cumple con las condiciones requeridas:
          </p>
          <textarea 
            rows={3} 
            value={motivoObs} 
            onChange={(e) => setMotivoObs(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setObservarModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmObservar}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              Confirmar Observación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
