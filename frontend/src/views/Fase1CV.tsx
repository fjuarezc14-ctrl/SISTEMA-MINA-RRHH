import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { FileSearch, CheckCircle2, AlertTriangle, User, Eye, BarChart3, Users, Ban, Filter } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';
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
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('TODOS');
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);
  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const candidatosFase1 = postulantes.filter((p) => p.fase_actual === 'FASE_1');
  
  const candidatosFiltrados = candidatosFase1.filter((p) => {
    const isLN = p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra);
    const isObs = p.estado_global === 'OBSERVADO';
    if (filtroEstado === 'OBSERVADOS') return isObs;
    if (filtroEstado === 'LISTA_NEGRA') return isLN;
    if (filtroEstado === 'PENDIENTES') return !isObs && !isLN;
    return true;
  });

  const conteoObs = candidatosFase1.filter((p) => p.estado_global === 'OBSERVADO').length;
  const conteoLN = candidatosFase1.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra)).length;
  const conteoPendientes = candidatosFase1.length - conteoObs - conteoLN;

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
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-750">
            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
              <FileSearch className="w-5 h-5" /> 1. Filtro Documentario: Datos y CV
            </h3>
            <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
              Área Responsable: Reclutamiento y RRHH Mina
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
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Todos ({candidatosFase1.length})
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
              ? 'No hay postulantes pendientes de revisión de CV en este momento.'
              : `No se encontraron postulantes con estado "${filtroEstado.replace('_', ' ')}".`}
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFiltrados.map((candidato) => {
              const isListaNegra = candidato.estado_global === 'NO_APTO' || Boolean(candidato.en_lista_negra);

              return (
                <div 
                  key={candidato.id}
                  className={`rounded-xl p-4 sm:p-5 border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all ${getDocumentCardBorderClass(candidato)}`}
                >
                  <div className="w-full flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-white text-base">
                            {candidato.apellidos}, {candidato.nombres}
                          </h4>
                          {candidato.tipo_pase && (
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                              {candidato.tipo_pase.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          Cargo: <span className="text-slate-200 font-medium">{candidato.cargo}</span> • DNI: <span className="font-mono text-slate-300">{candidato.numero_documento}</span>
                        </p>
                        <div className="flex gap-2 items-center text-xs text-slate-500">
                          <span>Empresa: <span className="text-slate-300">{candidato.empresa_nombre}</span></span>
                        </div>

                        {/* ESTADO VISUAL DE LA TARJETA (OBSERVADO / LISTA NEGRA / PENDIENTE) */}
                        <DocumentCardStatus postulante={candidato} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end pt-3 xl:pt-0 border-t border-slate-800/80 xl:border-t-0 shrink-0">
                    {/* BOTÓN VISOR SPLIT-SCREEN */}
                    <button
                      type="button"
                      onClick={() => handleOpenSplitViewer(candidato)}
                      className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> Inspeccionar CV
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
                      onClick={() => onEvaluar(candidato.id, 'FASE_1', 'APROBAR', { observaciones: 'CV y datos verificados conforme a perfil.' })}
                      disabled={isListaNegra}
                      title={isListaNegra ? 'Candidato en Lista Negra - Prohibido otorgar Visto Bueno' : undefined}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap ${
                        isListaNegra
                          ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50 shadow-none'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                      }`}
                    >
                      {isListaNegra ? (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-400" /> V°B° Bloqueado
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dar V°B°
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
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
