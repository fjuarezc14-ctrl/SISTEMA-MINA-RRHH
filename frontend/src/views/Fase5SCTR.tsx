import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { ClipboardCheck, FileText, AlertTriangle, ShieldCheck, Eye, Lock, CheckCircle } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';

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
  const candidatosFase5 = postulantes.filter((p) => p.fase_actual === 'FASE_5');
  const candidatosBloqueados = postulantes.filter((p) => ['FASE_1', 'FASE_2', 'FASE_3', 'FASE_4'].includes(p.fase_actual));

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
    const fVenc = fechasVenc[id] || '2026-10-30';
    const clinica = clinicas[id] || 'Clínica Limatambo Cajamarca';

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
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <ClipboardCheck className="w-5 h-5" /> 5. Validación SCTR y Seguros de Alto Riesgo
          </h3>
          <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
            Área Responsable: Administración de Contratos y Seguros
          </span>
        </div>

        {candidatosFase5.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes de validación SCTR en este momento.
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFase5.map((candidato) => {
              const fechaVal = fechasVenc[candidato.id] || '2026-10-30';

              return (
                <div 
                  key={candidato.id}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-base">
                      {candidato.apellidos}, {candidato.nombres}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cargo: {candidato.cargo} • Empresa: {candidato.empresa_nombre}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Fases 1, 2, 3 y 4 Confirmadas con Visto Bueno
                    </div>

                    <div className="flex flex-wrap gap-3 items-center pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Clínica:</span>
                        <select
                          value={clinicas[candidato.id] || 'Clínica Limatambo Cajamarca'}
                          onChange={(e) => handleClinicaChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
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
                          value={fechasInicio[candidato.id] || new Date().toISOString().split('T')[0]}
                          onChange={(e) => handleFechaInicioChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Vencimiento:</span>
                        <input 
                          type="date" 
                          value={fechaVal}
                          onChange={(e) => handleFechaChange(candidato.id, e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full lg:w-auto self-end lg:self-center">
                    <button
                      onClick={() => handleOpenSplitViewer(candidato)}
                      className="flex-1 lg:flex-initial bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                    >
                      <Eye className="w-4 h-4 text-blue-400" /> Inspeccionar Póliza en Split-Screen
                    </button>

                    <button 
                      onClick={() => handleOpenObservar(candidato)}
                      className="flex-1 lg:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" /> Observar Póliza
                    </button>

                    <button 
                      onClick={() => handleAprobar(candidato.id)}
                      className="flex-1 lg:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                    >
                      <ShieldCheck className="w-4 h-4" /> Dar V°B° SCTR (Declarar Apto)
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
