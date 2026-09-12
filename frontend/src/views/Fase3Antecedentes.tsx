import React, { useState } from 'react';
import { Postulante, RolUsuario, VehiculoMaquinaria } from '../types';
import { ShieldAlert, Ban, ShieldCheck, Eye, Lock, CheckCircle, AlertCircle, Truck, UserX, FileText, Filter } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DocumentSplitViewer } from '../components/common/DocumentSplitViewer';
import { DocumentCardStatus, getDocumentCardBorderClass } from '../components/common/DocumentCardStatus';
import { VehiculosView } from './VehiculosView';

interface Fase3Props {
  postulantes: Postulante[];
  userRole: RolUsuario;
  onEvaluar: (
    postulanteId: string, 
    fase: string, 
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO', 
    detalles?: any
  ) => Promise<void>;
  vehiculos?: VehiculoMaquinaria[];
  onRegistrarVehiculo?: (data: any) => Promise<void>;
  onEvaluarVehiculo?: (id: string, decision: 'APROBAR' | 'OBSERVAR', observaciones?: string) => Promise<void>;
}

export const Fase3Antecedentes: React.FC<Fase3Props> = ({ 
  postulantes, 
  userRole, 
  onEvaluar,
  vehiculos = [],
  onRegistrarVehiculo,
  onEvaluarVehiculo
}) => {
  const [tabActiva, setTabActiva] = useState<'antecedentes' | 'vehiculos' | 'lista_negra'>('antecedentes');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTES' | 'OBSERVADOS' | 'LISTA_NEGRA'>('TODOS');
  const [bloquearModalOpen, setBloquearModalOpen] = useState(false);
  const [observarModalOpen, setObservarModalOpen] = useState(false);
  const [selectedPostulante, setSelectedPostulante] = useState<Postulante | null>(null);
  const [splitViewerOpen, setSplitViewerOpen] = useState(false);
  const [viewerPostulante, setViewerPostulante] = useState<Postulante | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthorizedRole = userRole === 'SEGURIDAD_PATRIMONIAL' || userRole === 'SUPER_ADMIN';

  const candidatosFase3 = postulantes.filter((p) => p.fase_actual === 'FASE_3');
  const candidatosEsperandoFase2 = postulantes.filter((p) => p.fase_actual === 'FASE_1' || p.fase_actual === 'FASE_2');
  const candidatosListaNegra = postulantes.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra));

  const candidatosFiltrados = candidatosFase3.filter((p) => {
    const isLN = p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra);
    const isObs = p.estado_global === 'OBSERVADO';
    if (filtroEstado === 'OBSERVADOS') return isObs;
    if (filtroEstado === 'LISTA_NEGRA') return isLN;
    if (filtroEstado === 'PENDIENTES') return !isObs && !isLN;
    return true;
  });

  const conteoObs = candidatosFase3.filter((p) => p.estado_global === 'OBSERVADO').length;
  const conteoLN = candidatosFase3.filter((p) => p.estado_global === 'NO_APTO' || Boolean(p.en_lista_negra)).length;
  const conteoPendientes = candidatosFase3.length - conteoObs - conteoLN;

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
      await onEvaluar(selectedPostulante.id, 'FASE_3', 'OBSERVAR', { observaciones: motivoObs });
      setObservarModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al observar certificado.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBloqueo = async () => {
    if (!selectedPostulante || !motivoRechazo.trim()) return;
    try {
      setLoading(true);
      await onEvaluar(selectedPostulante.id, 'FASE_3', 'NO_APTO', { motivo: motivoRechazo });
      setBloquearModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al procesar antecedente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TABS DE SEGURIDAD PATRIMONIAL */}
      <div className="flex flex-wrap gap-2 border-b border-slate-750 pb-3">
        <button
          onClick={() => setTabActiva('antecedentes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'antecedentes'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          1. Antecedentes CUL ({candidatosFase3.length})
        </button>

        <button
          onClick={() => setTabActiva('vehiculos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'vehiculos'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          2. Inspección Vehicular ({vehiculos.length})
        </button>

        <button
          onClick={() => setTabActiva('lista_negra')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tabActiva === 'lista_negra'
              ? 'bg-red-700 text-white shadow-lg shadow-red-700/30'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Ban className="w-4 h-4" />
          3. Lista Negra ({candidatosListaNegra.length})
        </button>
      </div>

      {tabActiva === 'vehiculos' && (
        <VehiculosView 
          vehiculos={vehiculos}
          userRole={userRole}
          onRegistrarVehiculo={onRegistrarVehiculo || (async () => {})}
          onEvaluarVehiculo={onEvaluarVehiculo || (async () => {})}
        />
      )}

      {tabActiva === 'lista_negra' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
            <div>
              <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" /> Registro Central de Lista Negra (Personal Vetado)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personal inhabilitado permanentemente de ingresar a las operaciones de la unidad minera
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl">
              {candidatosListaNegra.length} Vetados
            </span>
          </div>

          {candidatosListaNegra.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-900/50 rounded-xl">
              No hay personal registrado en Lista Negra actualmente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="p-3">DNI / Documento</th>
                    <th className="p-3">Apellidos y Nombres</th>
                    <th className="p-3">Empresa Contratista</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Observaciones / Causal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {candidatosListaNegra.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{p.numero_documento}</td>
                      <td className="p-3 font-bold text-slate-200">{p.apellidos}, {p.nombres}</td>
                      <td className="p-3 text-slate-400">{p.empresa_nombre}</td>
                      <td className="p-3 text-slate-400">{p.cargo}</td>
                      <td className="p-3">
                        <span className="bg-rose-950 border border-rose-600/50 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Ban className="w-3 h-3" /> VETADO
                        </span>
                      </td>
                      <td className="p-3 text-rose-300/80 font-mono text-[11px]">
                        {p.ultima_observacion || 'Antecedente legal o falta grave registrada en control minero.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tabActiva === 'antecedentes' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 border-t-4 border-t-rose-500 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" /> 3. Seguridad Patrimonial: Antecedentes Legales
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Revisión de antecedentes penales, judiciales y policiales (CUL)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isAuthorizedRole && (
                <span className="text-[11px] bg-rose-950/80 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Reserva Legal Activa
                </span>
              )}
              <span className="text-xs bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg font-medium">
                Seguridad Patrimonial / Legal
              </span>
            </div>
          </div>

          {/* FILTROS DE ESTADO */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs mb-3">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            <button
              type="button"
              onClick={() => setFiltroEstado('TODOS')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filtroEstado === 'TODOS'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Todos ({candidatosFase3.length})
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
                ? 'No hay postulantes pendientes de revisión de antecedentes en este momento.'
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
                    <div className="flex-1 min-w-0 w-full">
                      <h4 className="font-bold text-white text-base">
                        {candidato.apellidos}, {candidato.nombres}
                      </h4>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Validación de Certificado Único Laboral (Antecedentes Policiales, Penales y Judiciales).
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 items-center">
                        <span>DNI: <span className="font-mono text-slate-300">{candidato.numero_documento}</span></span>
                        <span>•</span>
                        <span>Empresa: <span className="text-slate-300">{candidato.empresa_nombre}</span></span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle className="w-3.5 h-3.5" /> Fase 2 (Médico) Confirmada
                        </span>
                      </div>

                      {/* ESTADO VISUAL DE LA TARJETA (OBSERVADO / LISTA NEGRA / PENDIENTE) */}
                      <DocumentCardStatus postulante={candidato} />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end pt-3 xl:pt-0 border-t border-slate-800/80 xl:border-t-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSplitViewer(candidato)}
                        className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" /> Inspeccionar CUL
                      </button>

                      {!isListaNegra && (
                        <button
                          type="button"
                          onClick={() => handleOpenObservar(candidato)}
                          className="flex-1 sm:flex-initial bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Observar
                        </button>
                      )}

                      {!isListaNegra && (
                        <button
                          type="button"
                          onClick={() => handleOpenBloqueo(candidato)}
                          className="flex-1 sm:flex-initial bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-400" /> Vetar
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={loading || !isAuthorizedRole || isListaNegra}
                        onClick={() => onEvaluar(candidato.id, 'FASE_3', 'APROBAR')}
                        title={isListaNegra ? 'Candidato vetado en Lista Negra - Prohibido emitir V°B°' : undefined}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow whitespace-nowrap ${
                          isListaNegra
                            ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50 shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 disabled:opacity-50'
                        }`}
                      >
                        {isListaNegra ? (
                          <>
                            <Ban className="w-3.5 h-3.5 text-rose-400" /> V°B° Bloqueado
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" /> Dar V°B° Seguridad
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
          {candidatosEsperandoFase2.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-750">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Postulantes Bloqueados (Esperando Confirmación Médica/RRHH)
              </h5>
              <div className="space-y-2 opacity-60">
                {candidatosEsperandoFase2.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-300">{p.apellidos}, {p.nombres}</span>
                      <span className="text-slate-500 ml-2">({p.cargo})</span>
                    </div>
                    <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Requiere Visto Bueno en {p.fase_actual}
                    </span>
                  </div>
                ))}
              </div>
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
          fase="FASE_3"
          userRole={userRole}
          onEvaluar={onEvaluar}
        />
      )}

      {/* MODAL LISTA NEGRA */}
      <Modal 
        isOpen={bloquearModalOpen} 
        onClose={() => setBloquearModalOpen(false)} 
        title="Seguridad Patrimonial: Registrar en Lista Negra"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-200">
              Postulante con antecedentes vigentes no subsanables. Se registrará la causal y se denegará el pase de acceso.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Registro del antecedente / Causal de rechazo:
            </label>
            <textarea 
              rows={3} 
              value={motivoRechazo} 
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej: Registro de antecedente penal por hurto agravado / orden de requisitoria pendiente..."
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
              {loading ? 'Procesando...' : 'Confirmar Bloqueo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL OBSERVACIÓN LEGAL / PATRIMONIAL PARA SUBSANACIÓN */}
      <Modal 
        isOpen={observarModalOpen} 
        onClose={() => setObservarModalOpen(false)} 
        title={`Observar Certificado de Antecedentes - ${selectedPostulante?.nombres} ${selectedPostulante?.apellidos}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Detalla la causal de observación (ej. documento CUL desactualizado mayor a 90 días, requiere certificado judicial ampliatorio o carta de homonimia):
          </p>
          <textarea 
            rows={3} 
            value={motivoObs} 
            onChange={(e) => setMotivoObs(e.target.value)}
            placeholder="Ej: El Certificado Único Laboral tiene más de 3 meses de antigüedad. Adjuntar certificado policial reciente..."
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
