import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { Stethoscope, Ban, CheckCircle, ShieldAlert, Eye, Lock, AlertCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';

interface Fase2Props {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string, 
    fase: string, 
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO', 
    detalles?: any
  ) => Promise<void>;
}

export const Fase2Salud: React.FC<Fase2Props> = ({ postulantes, userRole, onEvaluar }) => {
  const [bloquearModalOpen, setBloquearModalOpen] = useState(false);
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthorizedRole = userRole === 'MEDICO_OCUPACIONAL' || userRole === 'SUPER_ADMIN';

  // Candidatos que ya están en Fase 2 o candidatos bloqueados en Fase 1
  const candidatosFase2 = postulantes.filter((p) => p.fase_actual === 'FASE_2');
  const candidatosEsperandoFase1 = postulantes.filter((p) => p.fase_actual === 'FASE_1');

  const handleOpenBloqueo = (p: Postulante) => {
    setSelectedPostulante(p);
    setMotivoRechazo('');
    setBloquearModalOpen(true);
  };

  const handleOpenObservar = (p: Postulante) => {
    setSelectedPostulante(p);
    setMotivoObs('');
    setObservarModalOpen(true);
  };

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  const handleConfirmObservar = async () => {
    if (!selectedPostulante || !motivoObs.trim()) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'FASE_2', 'OBSERVAR', { observaciones: motivoObs });
      setObservarModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar examen médico.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBloqueo = async () => {
    if (!selectedPostulante || !motivoRechazo.trim()) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'FASE_2', 'NO_APTO', { motivo: motivoRechazo });
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-rose-400">
              <Stethoscope className="w-5 h-5" /> 2. Área Médica: Evaluación EMO y Toxicológica
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Protegido bajo secreto médico ocupacional (Ley de Protección de Datos Personales N° 29733)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthorizedRole && (
              <span className="text-[11px] bg-rose-950/80 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Confidencialidad Activa
              </span>
            )}
            <span className="text-xs bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg font-medium">
              Médico Ocupacional (CMP)
            </span>
          </div>
        </div>

        {/* CANDIDATOS HABILITADOS EN FASE 2 */}
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-white text-base">
                      {candidato.apellidos}, {candidato.nombres}
                    </h4>
                    {candidato.tipo_pase && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        candidato.tipo_pase === 'VISITA_TECNICA'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : candidato.tipo_pase === 'PROVEEDOR_LOGISTICO'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {candidato.tipo_pase.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Evaluación toxicológica y EMO (Ficha 7D para gran altitud &gt; 4,000 msnm).
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1 items-center">
                    <span>DNI: {candidato.numero_documento}</span>
                    <span>•</span>
                    <span>Cargo: {candidato.cargo}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Fase 1 (CV) Confirmada
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleOpenSplitViewer(candidato)}
                    className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Eye className="w-4 h-4 text-rose-400" /> Inspeccionar EMO (Split-Screen)
                  </button>

                  <button
                    onClick={() => handleOpenObservar(candidato)}
                    className="flex-1 md:flex-initial bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Observar
                  </button>

                  <button 
                    onClick={() => handleOpenBloqueo(candidato)}
                    className="flex-1 md:flex-initial bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
                  >
                    <Ban className="w-3.5 h-3.5" /> NO APTO (Lista Negra)
                  </button>

                  <button 
                    onClick={() => onEvaluar(candidato.id, 'FASE_2', 'APROBAR', { observaciones: 'Apto médico y toxicológico verificado.' })}
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Dar V°B° Médico
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTADO DE CANDIDATOS BLOQUEADOS POR HARD GATING (EN FASE 1) */}
        {candidatosEsperandoFase1.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-750">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Postulantes Bloqueados (Esperando Confirmación de Fase 1)
            </h5>
            <div className="space-y-2 opacity-60">
              {candidatosEsperandoFase1.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-300">{p.apellidos}, {p.nombres}</span>
                    <span className="text-slate-500 ml-2">({p.cargo})</span>
                  </div>
                  <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Requiere Visto Bueno RRHH (Fase 1)
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
          fase="FASE_2"
          userRole={userRole}
          onEvaluar={onEvaluar}
        />
      )}

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
              placeholder="Ej: Prueba toxicológica positiva para sustancias controladas / Restricción cardiovascular severa..."
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
              {loading ? 'Procesando...' : 'Confirmar Bloqueo en Lista Negra'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL OBSERVACIÓN MÉDICA PARA SUBSANACIÓN */}
      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar Examen Médico - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Detalla la observación médica (ej. ficha borrosa, examen complementario requerido) para que la contrata subsane el documento sin vetar al trabajador en Lista Negra:
          </p>
          <textarea 
            rows={3} 
            value={motivoObs} 
            onChange={(e) => setMotivoObs(e.target.value)}
            placeholder="Ej: Ficha 7D ilegible en sección cardiovascular / Requiere repetir examen de audiometría..."
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
              {loading ? 'Procesando...' : 'Confirmar Observación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
