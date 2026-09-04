import React, { useState } from 'react';
import { Postulante } from '../types';
import { Stethoscope, Ban, CheckCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface Fase2Props {
  postulantes: Postulante[];
  onEvaluar: (postulanteId: string, decision: 'APROBAR' | 'NO_APTO', motivo?: string) => Promise<void>;
}

export const Fase2Salud: React.FC<Fase2Props> = ({ postulantes, onEvaluar }) => {
  const [bloquearModalOpen, setBloquearModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loading, setLoading] = useState(false);

  const candidatosFase2 = postulantes.filter((p) => p.fase_actual === 'FASE_2');

  const handleOpenBloqueo = (p: Postulante) => {
    setSelectedPostulante(p);
    setMotivoRechazo('');
    setBloquearModalOpen(true);
  };

  const handleConfirmBloqueo = async () => {
    if (!selectedPostulante || !motivoRechazo.trim()) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'NO_APTO', motivoRechazo);
      setBloquearModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al dictaminar no apto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 border-t-4 border-t-rose-500 shadow-xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-rose-400">
          <Stethoscope className="w-5 h-5" /> Filtro 2: Área Médica (Salud Ocupacional)
        </h3>

        {candidatosFase2.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes de evaluación médica en este momento.
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFase2.map((candidato) => (
              <div 
                key={candidato.id}
                className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-600 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-white text-base">
                    {candidato.apellidos}, {candidato.nombres}
                  </h4>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Evaluación toxicológica y EMO (Examen Médico Ocupacional).
                  </p>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span>DNI: {candidato.numero_documento}</span>
                    <span>•</span>
                    <span>Cargo: {candidato.cargo}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleOpenBloqueo(candidato)}
                    className="flex-1 md:flex-initial bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-600/20"
                  >
                    <Ban className="w-4 h-4" /> NO APTO (Lista Negra)
                  </button>

                  <button 
                    onClick={() => onEvaluar(candidato.id, 'APROBAR')}
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Apto Médico
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL LISTA NEGRA */}
      <Modal 
        isOpen={bloquearModalOpen} 
        onClose={() => setBloquearModalOpen(false)} 
        title="Dictamen Médico: NO APTO / Inclusión en Lista Negra"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-200">
              Esta acción bloqueará de forma inmediata y transversal al postulante para cualquier acceso a la unidad minera.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo médico de no aptitud / Hallazgo crítico:
            </label>
            <textarea 
              rows={3} 
              value={motivoRechazo} 
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej: Prueba toxicológica positiva para sustancias controladas / Restricción cardiovascular severa para altura 4500 msnm..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setBloquearModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmBloqueo}
              disabled={loading || !motivoRechazo.trim()}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              {loading ? 'Procesando...' : 'Confirmar Bloqueo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
