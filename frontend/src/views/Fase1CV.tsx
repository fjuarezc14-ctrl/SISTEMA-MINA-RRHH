import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { FileSearch, CheckCircle2, AlertTriangle, User, Eye, BarChart3, Users } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { SlaMetricsView } from './SlaMetricsView';

interface Fase1Props {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string, 
    fase: string, 
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO', 
    detalles?: any
  ) => Promise<void>;
}

export const Fase1CV: React.FC<Fase1Props> = ({ postulantes, userRole, onEvaluar }) => {
  const [tabActiva, setTabActiva] = useState<'cvs' | 'metricas'>('cvs');
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);
  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const candidatosFase1 = postulantes.filter((p) => p.fase_actual === 'FASE_1');

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
      await onEvaluar(selectedPostulante.id, 'FASE_1', 'OBSERVAR', { observaciones: motivoObs });
      setObservarModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar postulante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TABS DE STAFF RRHH */}
      <div className="flex flex-wrap gap-2 border-b border-slate-750 pb-3">
        <button
          type="button"
          onClick={() => setTabActiva('cvs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'cvs'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Revisión de Datos y CVs ({candidatosFase1.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('metricas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'metricas'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          2. Monitor de Rendimiento y SLAs de Área
        </button>
      </div>

      {tabActiva === 'metricas' && (
        <SlaMetricsView />
      )}

      {tabActiva === 'cvs' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
              <FileSearch className="w-5 h-5" /> 1. Filtro Documentario: Datos y CV
            </h3>
            <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
              Área Responsable: Reclutamiento y RRHH Mina
            </span>
          </div>

        {candidatosFase1.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes de revisión de CV en este momento.
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
                    <div className="flex gap-2 items-center text-xs text-slate-500 mt-1">
                      <span>Empresa: {candidato.empresa_nombre}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  {/* BOTÓN VISOR SPLIT-SCREEN */}
                  <button
                    onClick={() => handleOpenSplitViewer(candidato)}
                    className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Eye className="w-4 h-4 text-blue-400" /> Inspeccionar en Split-Screen
                  </button>

                  <button 
                    onClick={() => handleOpenObservar(candidato)}
                    className="flex-1 md:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" /> Observar
                  </button>

                  <button 
                    onClick={() => onEvaluar(candidato.id, 'FASE_1', 'APROBAR', { observaciones: 'CV y datos verificados conforme a perfil.' })}
                    className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Dar V°B°
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* MODAL VISOR SPLIT-SCREEN */}
      {viewerPostulante && (
        <DocumentSplitViewer
          isOpen={splitViewerOpen}
          onClose={() => setSplitViewerOpen(false)}
          postulante={viewerPostulante}
          fase="FASE_1"
          userRole={userRole}
          onEvaluar={onEvaluar}
        />
      )}

      {/* MODAL OBSERVACIÓN RÁPIDA */}
      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar CV - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Detalla la causal de observación para que el contratista suba la versión corregida:
          </p>
          <textarea 
            rows={3} 
            value={motivoObs} 
            onChange={(e) => setMotivoObs(e.target.value)}
            placeholder="Ej: Falta certificado de homologación 3G/4G vigente para soldador..."
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
