import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { ShieldCheck, Eye, Lock, CheckCircle, Filter, User } from 'lucide-react';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, DocumentCardDetail, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';

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
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('PENDIENTES');
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

  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
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
              return (
                <div
                  key={candidato.id}
                  className={`rounded-xl p-4 sm:p-5 border transition-all ${getDocumentCardBorderClass(candidato)}`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="w-full flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-wrap items-center h-full gap-x-3 gap-y-1">
                          <h4 className="font-bold text-white text-base whitespace-nowrap">
                            {candidato.apellidos}, {candidato.nombres}
                          </h4>
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            Cargo: <span className="text-slate-200 font-medium">{candidato.cargo}</span>
                          </span>
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            DNI: <span className="font-mono text-slate-300">{candidato.numero_documento}</span>
                          </span>
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            Empresa: <span className="text-slate-300">{candidato.empresa_nombre}</span>
                          </span>
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5" /> Fases 1, 2, 3 y 4 Confirmadas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t border-slate-800/80 lg:border-t-0 shrink-0">
                      <DocumentCardStatus postulante={candidato} />

                      <button
                        type="button"
                        onClick={() => handleOpenSplitViewer(candidato)}
                        className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" /> Inspeccionar Póliza
                      </button>
                    </div>
                  </div>

                  <DocumentCardDetail postulante={candidato} />
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
    </div>
  );
};
