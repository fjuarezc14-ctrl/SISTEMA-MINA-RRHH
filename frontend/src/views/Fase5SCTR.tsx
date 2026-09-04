import React, { useState } from 'react';
import { Postulante } from '../types';
import { ClipboardCheck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface Fase5Props {
  postulantes: Postulante[];
  onEvaluar: (
    postulanteId: string, 
    decision: 'APROBAR' | 'OBSERVAR', 
    fechaVencimiento?: string, 
    observaciones?: string
  ) => Promise<void>;
}

export const Fase5SCTR: React.FC<Fase5Props> = ({ postulantes, onEvaluar }) => {
  const candidatosFase5 = postulantes.filter((p) => p.fase_actual === 'FASE_5');

  const [fechasVenc, setFechasVenc] = useState<Record<string, string>>({});
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [motivoObs, setMotivoObs] = useState('El SCTR subido está vencido o no cuenta con endoso minero.');
  const [loading, setLoading] = useState(false);

  const handleFechaChange = (id: string, val: string) => {
    setFechasVenc((prev) => ({ ...prev, [id]: val }));
  };

  const handleOpenObservar = (p: Postulante) => {
    setSelectedPostulante(p);
    setObservarModalOpen(true);
  };

  const handleAprobar = async (id: string) => {
    const fecha = fechasVenc[id];
    if (!fecha) {
      alert('Por favor ingrese la fecha de vencimiento de la póliza SCTR.');
      return;
    }

    try {
      setLoading(true);
      await onEvaluar(id, 'APROBAR', fecha);
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
      await onEvaluar(selectedPostulante.id, 'OBSERVAR', undefined, motivoObs);
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
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400">
          <ClipboardCheck className="w-5 h-5" /> Filtro 5: Validación SCTR y Seguros de Alto Riesgo
        </h3>

        {candidatosFase5.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes de validación SCTR en este momento.
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFase5.map((candidato) => {
              const fechaVal = fechasVenc[candidato.id] || '';

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

                    <div className="flex flex-wrap gap-3 items-center pt-1">
                      <span className="text-xs text-slate-400 font-medium">Vencimiento Póliza:</span>
                      <input 
                        type="date" 
                        value={fechaVal}
                        onChange={(e) => handleFechaChange(candidato.id, e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                      />

                      <button 
                        onClick={() => alert(`Visualizando póliza de ${candidato.nombres} ${candidato.apellidos}`)}
                        className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-600 px-3 py-1.5 rounded-lg text-blue-400 flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Ver Póliza.pdf
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full lg:w-auto self-end lg:self-center">
                    <button 
                      onClick={() => handleOpenObservar(candidato)}
                      className="flex-1 lg:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Observar (Póliza Inválida)
                    </button>

                    <button 
                      onClick={() => handleAprobar(candidato.id)}
                      className="flex-1 lg:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar (Enviar a Fotocheck)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar Póliza SCTR - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Especifique el motivo por el cual la póliza SCTR Salud / Pensión no cumple con las condiciones:
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
