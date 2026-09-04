import React, { useState } from 'react';
import { Postulante } from '../types';
import { GraduationCap, Upload, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';

interface Fase4Props {
  postulantes: Postulante[];
  onEvaluar: (
    postulanteId: string, 
    decision: 'APROBAR' | 'OBSERVAR', 
    nota?: number, 
    file?: File, 
    observaciones?: string
  ) => Promise<void>;
}

export const Fase4Capacitacion: React.FC<Fase4Props> = ({ postulantes, onEvaluar }) => {
  const candidatosFase4 = postulantes.filter((p) => p.fase_actual === 'FASE_4');

  // Estado por cada postulante para nota y archivo de examen
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [archivos, setArchivos] = useState<Record<string, File>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleNotaChange = (id: string, value: string) => {
    const num = Number(value);
    setNotas((prev) => ({ ...prev, [id]: num }));
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (file) {
      setArchivos((prev) => ({ ...prev, [id]: file }));
    }
  };

  const handleAprobar = async (id: string) => {
    const nota = notas[id] ?? 16;
    if (nota < 14) {
      alert('Para aprobar a Fase 5, la nota mínima de inducción en mina es 14/20.');
      return;
    }

    try {
      setLoadingId(id);
      await onEvaluar(id, 'APROBAR', nota, archivos[id]);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al aprobar fase de capacitación.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleObservarReprobo = async (id: string) => {
    const nota = notas[id] ?? 10;
    try {
      setLoadingId(id);
      await onEvaluar(
        id, 
        'OBSERVAR', 
        nota, 
        archivos[id], 
        `Reprobó evaluación de inducción con nota: ${nota}/20. Requiere rendir examen sustitutorio.`
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar postulante.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400">
          <GraduationCap className="w-5 h-5" /> Filtro 4: Capacitaciones e Inducción SSOMA
        </h3>

        {candidatosFase4.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-750 text-slate-400 text-sm">
            No hay postulantes pendientes de inducción en este momento.
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

                    <div className="flex flex-wrap gap-2 items-center pt-1">
                      <input 
                        type="number" 
                        min="0" 
                        max="20"
                        placeholder="Nota Examen (0-20)"
                        value={currentNota}
                        onChange={(e) => handleNotaChange(candidato.id, e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm w-44 text-white focus:outline-none focus:border-blue-500 font-medium"
                      />

                      <label className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-600 px-3 py-1.5 rounded-lg text-blue-400 cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentFile ? currentFile.name.slice(0, 15) + '...' : 'Subir Examen.pdf'}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.png,.jpg" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(candidato.id, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full lg:w-auto self-end lg:self-center">
                    <button 
                      onClick={() => handleObservarReprobo(candidato.id)}
                      disabled={isLoading}
                      className="flex-1 lg:flex-initial bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Observar (Reprobó - Subsanable)
                    </button>

                    <button 
                      onClick={() => handleAprobar(candidato.id)}
                      disabled={isLoading}
                      className="flex-1 lg:flex-initial bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar a Fase 5
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
