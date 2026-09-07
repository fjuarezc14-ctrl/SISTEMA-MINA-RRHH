import React, { useState } from 'react';
import { Postulante, RolUsuario } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { UploadCloud, FileText, CheckCircle, Check, Clock, AlertTriangle, ShieldCheck, Eye } from 'lucide-react';

interface PortalContratistaProps {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onSubsanar: (id: string, file: File, notas?: string) => Promise<void>;
}

export const PortalContratista: React.FC<PortalContratistaProps> = ({ postulantes, userRole, onSubsanar }) => {
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [subsanarModalOpen, setSubsanarModalOpen] = useState(false);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenSubsanar = (p: Postulante) => {
    setSelectedPostulante(p);
    setSelectedFile(null);
    setNotas('');
    setSuccessMsg('');
    setSubsanarModalOpen(true);
  };

  const handleOpenSplitViewer = (p: Postulante) => {
    setViewerPostulante(p);
    setSplitViewerOpen(true);
  };

  const handleSubsanarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostulante || !selectedFile) return;

    try {
      setLoading(true);
      await onSubsanar(selectedPostulante.id, selectedFile, notas);
      setSuccessMsg('Documento actualizado (v2) y reenviado a la bandeja del evaluador de área.');
      setTimeout(() => {
        setSubsanarModalOpen(false);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al subsanar documento.');
    } finally {
      setLoading(false);
    }
  };

  const getFaseStatus = (p: Postulante, faseNum: number) => {
    const ordenFases: Record<string, number> = {
      FASE_1: 1,
      FASE_2: 2,
      FASE_3: 3,
      FASE_4: 4,
      FASE_5: 5,
      FOTOCHECK: 6,
      FINALIZADO: 6,
    };

    const actual = ordenFases[p.fase_actual] || 1;

    if (actual > faseNum || p.estado_global === 'APTO_PARA_TRABAJAR') {
      return 'APROBADO';
    }
    if (actual === faseNum) {
      return p.estado_global === 'OBSERVADO' ? 'OBSERVADO' : 'EN_PROCESO';
    }
    return 'PENDIENTE';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80">
          <div>
            <h3 className="font-bold text-lg text-white">Mis Postulantes (Servicios Mineros XYZ S.A.C.)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Semáforo de cumplimiento: 5 Vistos Buenos requeridos para estar <span className="text-emerald-400 font-bold">APTO PARA TRABAJAR</span>
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-700/60 text-slate-300 rounded-lg">
            {postulantes.length} Trabajadores Registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="p-4 font-semibold">Candidato / Cargo</th>
                <th className="p-4 font-semibold text-center">Semáforo de Vistos Buenos (5 Áreas)</th>
                <th className="p-4 font-semibold text-center">Condición Oficial</th>
                <th className="p-4 font-semibold">Observaciones / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {postulantes.map((postulante) => {
                const isObservado = postulante.estado_global === 'OBSERVADO';
                const isAptoTotal = postulante.estado_global === 'APTO_PARA_TRABAJAR' || postulante.fase_actual === 'FOTOCHECK';

                return (
                  <tr key={postulante.id} className="hover:bg-slate-750/50 transition-colors">
                    {/* CANDIDATO */}
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {postulante.apellidos}, {postulante.nombres}
                      </div>
                      <div className="text-xs text-slate-400">
                        {postulante.cargo} • Doc: <span className="font-mono text-slate-300">{postulante.numero_documento}</span>
                      </div>
                    </td>
                    
                    {/* SEMÁFORO DE LOS 5 VISTOS BUENOS */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { num: 1, label: 'RRHH' },
                          { num: 2, label: 'Médico' },
                          { num: 3, label: 'Seguridad' },
                          { num: 4, label: 'SSOMA' },
                          { num: 5, label: 'SCTR' },
                        ].map(({ num, label }) => {
                          const st = getFaseStatus(postulante, num);

                          let bg = 'bg-slate-800 text-slate-500 border-slate-700';
                          let icon = <Clock className="w-3 h-3" />;

                          if (st === 'APROBADO') {
                            bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 font-bold';
                            icon = <Check className="w-3 h-3 text-emerald-400" />;
                          } else if (st === 'OBSERVADO') {
                            bg = 'bg-amber-950/70 text-amber-300 border-amber-500/40 animate-pulse font-bold';
                            icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
                          } else if (st === 'EN_PROCESO') {
                            bg = 'bg-blue-950/70 text-blue-300 border-blue-500/40 font-bold';
                            icon = <Clock className="w-3 h-3 text-blue-400 animate-spin" />;
                          }

                          return (
                            <div 
                              key={num}
                              title={`Paso ${num}: ${label} - Estado: ${st}`}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] ${bg}`}
                            >
                              {icon}
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* CONDICIÓN OFICIAL */}
                    <td className="p-4 text-center">
                      <Badge 
                        estado={postulante.estado_global} 
                        fase={isAptoTotal ? undefined : postulante.fase_actual}
                      />
                    </td>

                    {/* ACCIONES Y SUBSANACIÓN */}
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* VISOR DE EXPEDIENTE */}
                        <button
                          onClick={() => handleOpenSplitViewer(postulante)}
                          className="inline-flex items-center gap-1 text-xs text-blue-300 bg-slate-700/80 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-600 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" /> Ver Expediente
                        </button>

                        {isObservado && (
                          <button 
                            onClick={() => handleOpenSubsanar(postulante)}
                            className="inline-flex items-center gap-1 text-xs text-white bg-amber-600 hover:bg-amber-500 font-bold px-3 py-1.5 rounded-lg shadow transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Subsanar v2
                          </button>
                        )}

                        {isAptoTotal && (
                          <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Apto para Mina
                          </span>
                        )}
                      </div>

                      {isObservado && (
                        <p className="text-amber-300 text-[11px] font-medium italic mt-1">
                          "{postulante.ultima_observacion || 'Documento observado por el evaluador de área.'}"
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VISOR SPLIT-SCREEN */}
      {viewerPostulante && (
        <DocumentSplitViewer
          isOpen={splitViewerOpen}
          onClose={() => setSplitViewerOpen(false)}
          postulante={viewerPostulante}
          fase={viewerPostulante.fase_actual}
          userRole={userRole}
          onEvaluar={async () => {}}
        />
      )}

      {/* MODAL DE SUBSANACIÓN VERSIONADA */}
      <Modal 
        isOpen={subsanarModalOpen} 
        onClose={() => setSubsanarModalOpen(false)}
        title={`Actualizar Documento - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <form onSubmit={handleSubsanarSubmit} className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
            <p className="text-xs font-semibold text-amber-300">Observación emitida por el área responsable:</p>
            <p className="text-sm text-amber-100 mt-1 italic">
              "{selectedPostulante?.ultima_observacion || 'Corrija el archivo solicitado.'}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Subir nueva versión corregida (PDF, JPG, PNG)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-800/50">
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="file-subsanar"
                required
              />
              <label htmlFor="file-subsanar" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm font-medium text-white">
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el documento v2'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Máximo 15 MB • Formato oficial</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notas de descargo / Sustento para el evaluador:
            </label>
            <textarea 
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Explica qué corrección se aplicó a la póliza o certificado..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
              rows={2}
            />
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-medium">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setSubsanarModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              {loading ? 'Subiendo...' : 'Enviar Documento Actualizado'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
