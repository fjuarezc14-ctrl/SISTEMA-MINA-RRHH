import React, { useState } from 'react';
import { Postulante } from '../types';
import { FileSearch, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface Fase1Props {
  postulantes: Postulante[];
  onEvaluar: (postulanteId: string, decision: 'APROBAR' | 'OBSERVAR', observaciones?: string) => Promise<void>;
}

export const Fase1CV: React.FC<Fase1Props> = ({ postulantes, onEvaluar }) => {
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const candidatosFase1 = postulantes.filter((p) => p.fase_actual === 'FASE_1');

  const handleOpenObservar = (p: Postulante) => {
    setSelectedPostulante(p);
    setMotivoObs('');
    setObservarModalOpen(true);
  };

  const handleConfirmObservar = async () => {
    if (!selectedPostulante || !motivoObs.trim()) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'OBSERVAR', motivoObs);
      setObservarModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar postulante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400">
          <FileSearch className="w-5 h-5" /> Filtro 1: Datos y CV
        </h3>

        {candidatosFase1.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes en Fase 1 por el momento.
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFase1.map((candidato) => (
              <div 
                key={candidato.id}
                className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {candidato.apellidos}, {candidato.nombres}
                    </h4>
                    <p className="text-sm text-slate-400">
                      Cargo: <span className="text-slate-200 font-medium">{candidato.cargo}</span> • DNI: {candidato.numero_documento}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Empresa: {candidato.empresa_nombre}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleOpenObservar(candidato)}
                    className="flex-1 md:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Observar (Subsanable)
                  </button>

                  <button 
                    onClick={() => onEvaluar(candidato.id, 'APROBAR')}
                    className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Aprobar a Fase 2
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar Postulante - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Indique la razón u omisión en los documentos para que la contratista realice la subsanación correspondiente:
          </p>
          <textarea 
            rows={3} 
            value={motivoObs} 
            onChange={(e) => setMotivoObs(e.target.value)}
            placeholder="Ej: El CV no acredita los 2 años mínimos requeridos para mina subterránea..."
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
              disabled={loading || !motivoObs.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              {loading ? 'Guardando...' : 'Registrar Observación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
