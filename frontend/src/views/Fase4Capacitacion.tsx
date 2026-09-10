import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { GraduationCap, Upload, CheckCircle2, AlertTriangle, Eye, Lock, CheckCircle, FileText, X } from 'lucide-react';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';

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
  const candidatosFase4 = postulantes.filter((p) => p.fase_actual === 'FASE_4');
  const candidatosBloqueados = postulantes.filter((p) => ['FASE_1', 'FASE_2', 'FASE_3'].includes(p.fase_actual));

  const [notas, setNotas] = useState<Record<string, string>>({});
  const [archivos, setArchivos] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const handleNotaChange = (id: string, value: string) => {
    // Restringir rango de 00 a 20 con dos dígitos
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
      // Generar URL temporal en memoria para previsualización (Punto 7)
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
    const nota = parseInt(notaStr, 10) || 16;
    if (nota < 14) {
      alert('Para otorgar el Visto Bueno SSOMA, la nota mínima aprobatoria según D.S. 024-2016-EM es 14/20.');
      return;
    }
    if (nota < 14) {
      alert('Para otorgar el Visto Bueno SSOMA, la nota mínima aprobatoria según D.S. 024-2016-EM es 14/20.');
      return;
    }

    try {
      setLoadingId(id);
      await onEvaluar(id, 'FASE_4', 'APROBAR', {
        nota,
        file: archivos[id],
        observaciones: `Inducción SSOMA aprobada satisfactoriamente con nota ${nota}/20.`,
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
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <GraduationCap className="w-5 h-5" /> 4. Capacitaciones e Inducción de Seguridad en Mina
          </h3>
          <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg font-medium">
            Área Responsable: SSOMA / Seguridad y Salud Ocupacional
          </span>
        </div>

        {candidatosFase4.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes en proceso de inducción en este momento.
          </div>
        ) : (
          <div className="space-y-4">
            {candidatosFase4.map((candidato) => {
              const currentNota = notas[candidato.id] ?? '';
              const currentFile = archivos[candidato.id];
              const isLoading = loadingId === candidato.id;

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
                      <CheckCircle className="w-3.5 h-3.5" /> Fases 1, 2 y 3 Confirmadas con Visto Bueno
                    </div>

                    <div className="flex flex-wrap gap-2 items-center pt-1">
                      <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1">
                        <span className="text-xs text-slate-400">Calificación:</span>
                        <input 
                          type="number" 
                          min="0" 
                          max="20"
                          placeholder="Nota (0-20)"
                          value={currentNota}
                          onChange={(e) => handleNotaChange(candidato.id, e.target.value)}
                          className="bg-transparent text-sm w-20 text-white font-bold focus:outline-none"
                        />
                      </div>

                      <label className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-600 px-3 py-1.5 rounded-lg text-blue-400 cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentFile ? currentFile.name.slice(0, 15) + '...' : 'Subir Acta_Examen.pdf'}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.png,.jpg" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(candidato.id, e.target.files?.[0] || null)}
                        />
                      </label>

                      {previewUrls[candidato.id] && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(previewUrls[candidato.id])}
                          className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Previsualizar Acta
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full lg:w-auto self-end lg:self-center">
                    <button
                      onClick={() => handleOpenSplitViewer(candidato)}
                      className="flex-1 lg:flex-initial bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                    >
                      <Eye className="w-4 h-4 text-blue-400" /> Inspeccionar en Split-Screen
                    </button>

                    <button 
                      onClick={() => handleObservarReprobo(candidato.id)}
                      disabled={isLoading}
                      className="flex-1 lg:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Observar (&lt;14)
                    </button>

                    <button 
                      onClick={() => handleAprobar(candidato.id)}
                      disabled={isLoading}
                      className="flex-1 lg:flex-initial bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Dar V°B° SSOMA
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
