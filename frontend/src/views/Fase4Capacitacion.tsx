import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { GraduationCap, Upload, CheckCircle2, AlertTriangle, Eye, Lock, CheckCircle, FileText, X, Ban, Filter } from 'lucide-react';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';

interface Fase4Props {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string, 
    fase: string, 
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO', 
    detalles?: any
  ) => Promise<void>;
}

export const Fase4Capacitacion: React.FC<Fase4Props> = ({ postulantes, userRole, onEvaluar }) => {
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('TODOS');
  const candidatosFase4 = postulantes.filter((p) => p.fase_actual === 'FASE_4');
  const candidatosBloqueados = postulantes.filter((p) => ['FASE_1', 'FASE_2', 'FASE_3'].includes(p.fase_actual));

  const candidatosFiltrados = candidatosFase4.filter((p) => {
    const isLN = p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra);
    const isObs = p.estado_global === 'OBSERVADO';
    if (filtroEstado === 'OBSERVADOS') return isObs;
    if (filtroEstado === 'LISTA_NEGRA') return isLN;
    if (filtroEstado === 'PENDIENTES') return !isObs && !isLN;
    return true;
  });

  const conteoObs = candidatosFase4.filter((p) => p.estado_global === 'OBSERVADO').length;
  const conteoLN = candidatosFase4.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra)).length;
  const conteoPendientes = candidatosFase4.length - conteoObs - conteoLN;

  const [notas, setNotas] = useState<Record<string, string>>({});
  const [archivos, setArchivos] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const handleNotaChange = (id: string, value: string) => {
    const cleanNum = parseInt(value, 10);
    if (isNaN(cleanNum)) {
      setNotas((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    const clamped = Math.min(20, Math.max(0, cleanNum));
    const formatted = String(clamped).padStart(2, '0');
    setNotas((prev) => ({ ...prev, [id]: formatted }));
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (file) {
      setArchivos((prev) => ({ ...prev, [id]: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [id]: url }));
    }
  };

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  const handleAprobar = async (id: string) => {
    const notaStr = notas[id] ?? '16';
    const nota = parseInt(notaStr, 10);
    if (isNaN(nota) || nota < 14 || nota > 20) {
      alert('Normativa SSOMA D.S. 024-2016-EM: Para otorgar el Visto Bueno de inducción, la nota mínima aprobatoria es 14/20 (escala de 00 a 20).');
      return;
    }

    try {
      setLoadingId(id);
      await onEvaluar(id, 'FASE_4', 'APROBAR', {
        nota,
        file: archivos[id],
        observaciones: `Inducción SSOMA aprobada satisfactoriamente con nota ${String(nota).padStart(2, '0')}/20.`,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al otorgar Visto Bueno SSOMA.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleObservarReprobo = async (id: string) => {
    const nota = notas[id] ?? 10;
    try {
      setLoadingId(id);
      await onEvaluar(id, 'FASE_4', 'OBSERVAR', {
        nota,
        file: archivos[id],
        observaciones: `Reprobó evaluación de inducción con nota: ${nota}/20. Requiere rendir examen de recuperación.`,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar postulante.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-750">
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <GraduationCap className="w-5 h-5" /> 4. Capacitaciones e Inducción de Seguridad en Mina
          </h3>
          <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
            Área Responsable: SSOMA / Seguridad y Salud Ocupacional
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
            Todos ({candidatosFase4.length})
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
              ? 'No hay postulantes en proceso de inducción en este momento.'
              : `No se encontraron postulantes con estado "${filtroEstado.replace('_', ' ')}".`}
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFiltrados.map((candidato) => {
              const currentNota = notas[candidato.id] ?? '';
              const currentFile = archivos[candidato.id];
              const isLoading = loadingId === candidato.id;
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
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Fases 1, 2 y 3 Confirmadas con Visto Bueno
                    </div>

                    {/* ESTADO VISUAL DE LA TARJETA (OBSERVADO / LISTA NEGRA / PENDIENTE) */}
                    <DocumentCardStatus postulante={candidato} />

                    <div className="flex flex-wrap gap-2 items-center pt-2">
                      <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1">
                        <span className="text-xs text-slate-400">Calificación:</span>
                        <input 
                          type="number" 
                          min="0" 
                          max="20" 
                          disabled={isListaNegra}
                          placeholder="Nota (0-20)"
                          value={currentNota}
                          onChange={(e) => handleNotaChange(candidato.id, e.target.value)}
                          className="bg-transparent text-sm w-20 text-white font-bold focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      <label className={`text-xs border px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        isListaNegra
                          ? 'bg-slate-800/40 text-slate-500 border-slate-750 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-750 border-slate-600 text-blue-400 cursor-pointer'
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentFile ? currentFile.name.slice(0, 15) + '...' : 'Subir Acta_Examen.pdf'}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.png,.jpg" 
                          disabled={isListaNegra}
                          className="hidden" 
                          onChange={(e) => handleFileChange(candidato.id, e.target.files?.[0] || null)}
                        />
                      </label>

                      {previewUrls[candidato.id] && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(previewUrls[candidato.id])}
                          className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" /> Previsualizar Acta
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end pt-3 xl:pt-0 border-t border-slate-800/80 xl:border-t-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenSplitViewer(candidato)}
                      className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> Inspeccionar
                    </button>

                    {!isListaNegra && (
                      <button 
                        type="button"
                        onClick={() => handleObservarReprobo(candidato.id)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Observar (&lt;14)
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleAprobar(candidato.id)}
                      disabled={isLoading || isListaNegra}
                      title={isListaNegra ? 'Candidato en Lista Negra - Prohibido emitir V°B°' : undefined}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap ${
                        isListaNegra
                          ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50 shadow-none'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 disabled:opacity-50'
                      }`}
                    >
                      {isListaNegra ? (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-400" /> V°B° Bloqueado
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dar V°B° SSOMA
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
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Postulantes Bloqueados (Esperando Confirmación Previa)
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
          fase="FASE_4"
          userRole={userRole}
          onEvaluar={onEvaluar}
        />
      )}

      {/* MODAL PREVISUALIZAR ACTA PDF (Punto 7) */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-sm text-white">Previsualización de Acta de Examen SSOMA</h4>
              </div>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-slate-950 flex-1">
              <iframe 
                src={previewModalUrl} 
                className="w-full h-[70vh] rounded-xl border border-slate-800 bg-white" 
                title="Previsualización Acta PDF"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
