import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { Stethoscope, CheckCircle, ShieldAlert, Eye, Lock, Filter, User } from 'lucide-react';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, DocumentCardDetail, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';

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
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('PENDIENTES');
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const isAuthorizedRole = userRole === 'MEDICO_OCUPACIONAL' || userRole === 'SUPER_ADMIN';

  // Candidatos que ya están en Fase 2 o candidatos bloqueados en Fase 1
  const candidatosFase2 = postulantes.filter((p) => p.fase_actual === 'FASE_2');
  const candidatosEsperandoFase1 = postulantes.filter((p) => p.fase_actual === 'FASE_1');

  const candidatosFiltrados = candidatosFase2.filter((p) => {
    const isLN = p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra);
    const isObs = p.estado_global === 'OBSERVADO';
    if (filtroEstado === 'OBSERVADOS') return isObs;
    if (filtroEstado === 'LISTA_NEGRA') return isLN;
    if (filtroEstado === 'PENDIENTES') return !isObs && !isLN;
    return true;
  });

  const conteoObs = candidatosFase2.filter((p) => p.estado_global === 'OBSERVADO').length;
  const conteoLN = candidatosFase2.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra)).length;
  const conteoPendientes = candidatosFase2.length - conteoObs - conteoLN;

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 border-t-4 border-t-rose-600 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
              <Stethoscope className="w-5 h-5 text-rose-600" /> 2. Área Médica: Evaluación EMO y Toxicológica
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protegido bajo secreto médico ocupacional (Ley de Protección de Datos Personales N° 29733)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthorizedRole && (
              <span className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Confidencialidad Activa
              </span>
            )}
            <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg font-medium">
              Médico Ocupacional (CMP)
            </span>
          </div>
        </div>

        {/* FILTROS DE ESTADO */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-600 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            type="button"
            onClick={() => setFiltroEstado('PENDIENTES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroEstado === 'PENDIENTES'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Pendientes ({conteoPendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('OBSERVADOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroEstado === 'OBSERVADOS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            Observados ({conteoObs})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('LISTA_NEGRA')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroEstado === 'LISTA_NEGRA'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            Lista Negra ({conteoLN})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('TODOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroEstado === 'TODOS'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Todos ({candidatosFase2.length})
          </button>
        </div>

        {/* CANDIDATOS HABILITADOS EN FASE 2 */}
        {candidatosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
            {filtroEstado === 'TODOS'
              ? 'No hay postulantes pendientes de evaluación médica en este momento.'
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
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-wrap items-center h-full gap-x-3 gap-y-1">
                          <h4 className="font-bold text-slate-900 text-base whitespace-nowrap">
                            {candidato.apellidos}, {candidato.nombres}
                          </h4>
                          {candidato.tipo_pase && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border whitespace-nowrap ${
                              candidato.tipo_pase === 'VISITA_TECNICA'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : candidato.tipo_pase === 'PROVEEDOR_LOGISTICO'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {candidato.tipo_pase.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-sm text-slate-500 whitespace-nowrap">
                            Cargo: <span className="text-slate-900 font-medium">{candidato.cargo}</span>
                          </span>
                          <span className="text-sm text-slate-500 whitespace-nowrap">
                            DNI: <span className="font-mono text-slate-800">{candidato.numero_documento}</span>
                          </span>
                          <span className="text-sm text-slate-500 whitespace-nowrap">
                            Empresa: <span className="text-slate-800">{candidato.empresa_nombre}</span>
                          </span>
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Fase 1 (CV) Confirmada
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t border-slate-200 lg:border-t-0 shrink-0">
                      <DocumentCardStatus postulante={candidato} />

                      <button
                        type="button"
                        onClick={() => handleOpenSplitViewer(candidato)}
                        className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-600" /> Inspeccionar EMO
                      </button>
                    </div>
                  </div>

                  <DocumentCardDetail postulante={candidato} />
                </div>
              );
            })}
          </div>
        )}

        {/* LISTADO DE CANDIDATOS BLOQUEADOS POR HARD GATING (EN FASE 1) */}
        {candidatosEsperandoFase1.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Postulantes Bloqueados (Esperando Confirmación de Fase 1)
            </h5>
            <div className="space-y-2 opacity-75">
              {candidatosEsperandoFase1.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{p.apellidos}, {p.nombres}</span>
                    <span className="text-slate-500 ml-2">({p.cargo})</span>
                  </div>
                  <span className="text-amber-700 font-mono text-[11px] flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3 text-amber-600" /> Requiere Visto Bueno RRHH (Fase 1)
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
    </div>
  );
};
