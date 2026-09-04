import React, { useState } from 'react';
import { Postulante } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

interface PortalContratistaProps {
  postulantes: Postulante[];
  onSubsanar: (id: string, file: File, notas?: string) => Promise<void>;
}

export const PortalContratista: React.FC<PortalContratistaProps> = ({ postulantes, onSubsanar }) => {
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [subsanarModalOpen, setSubsanarModalOpen] = useState(false);
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

  const handleSubsanarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostulante || !selectedFile) return;

    try {
      setLoading(true);
      await onSubsanar(selectedPostulante.id, selectedFile, notas);
      setSuccessMsg('Documento subsanado y reenviado para validación.');
      setTimeout(() => {
        setSubsanarModalOpen(false);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al subsanar documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
          <div>
            <h3 className="font-bold text-lg text-white">Mis Postulantes (Servicios Mineros XYZ S.A.C.)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control de acreditación y subsanación de documentos</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-700/60 text-slate-300 rounded-lg">
            {postulantes.length} Trabajadores Registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="p-4 font-semibold">Candidato</th>
                <th className="p-4 font-semibold text-center">Fase / Estado Actual</th>
                <th className="p-4 font-semibold">Observaciones / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {postulantes.map((postulante) => {
                const isObservado = postulante.estado_global === 'OBSERVADO';
                return (
                  <tr key={postulante.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">
                        {postulante.apellidos}, {postulante.nombres}
                      </div>
                      <div className="text-xs text-slate-400">
                        {postulante.cargo} • Doc: {postulante.numero_documento}
                      </div>
                    </td>
                    
                    <td className="p-4 text-center">
                      <div className="inline-block">
                        <Badge 
                          estado={postulante.estado_global} 
                          fase={isObservado ? undefined : postulante.fase_actual}
                          customText={isObservado ? `OBSERVADO (${postulante.fase_actual})` : undefined}
                        />
                      </div>
                    </td>

                    <td className="p-4">
                      {isObservado ? (
                        <div className="space-y-1.5">
                          <p className="text-amber-400 text-xs font-medium italic">
                            "{postulante.ultima_observacion || 'Documentación observada por el evaluador.'}"
                          </p>
                          <button 
                            onClick={() => handleOpenSubsanar(postulante)}
                            className="inline-flex items-center gap-1.5 text-xs text-white bg-amber-600 hover:bg-amber-500 font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Resubir PDF / Subsanar
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">
                          {postulante.fase_actual === 'FOTOCHECK' || postulante.estado_global === 'APROBADO_TOTAL' 
                            ? 'Acreditación completa. Listo para emisión de credencial.' 
                            : 'En evaluación regular por el staff de mina...'}
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

      {/* MODAL DE SUBSANACIÓN */}
      <Modal 
        isOpen={subsanarModalOpen} 
        onClose={() => setSubsanarModalOpen(false)}
        title={`Subsanar Documento - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <form onSubmit={handleSubsanarSubmit} className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
            <p className="text-xs font-semibold text-amber-300">Observación actual:</p>
            <p className="text-sm text-amber-100 mt-1 italic">
              "{selectedPostulante?.ultima_observacion || 'Corrija el archivo solicitado.'}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Adjuntar nuevo archivo corregido (PDF o Imagen)
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
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar el PDF corregido'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Máximo 15 MB</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notas adicionales para el revisor (Opcional)
            </label>
            <textarea 
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalla qué corrección se aplicó..."
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
              {loading ? 'Subiendo...' : 'Enviar Subsanación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
