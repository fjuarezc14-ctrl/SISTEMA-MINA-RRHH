import React from 'react';
import { Postulante } from '../../types';
import { AlertTriangle, Ban, Clock, ShieldAlert, FileWarning } from 'lucide-react';

interface DocumentCardStatusProps {
  postulante: Postulante;
  showDetails?: boolean;
}

export const DocumentCardStatus: React.FC<DocumentCardStatusProps> = ({ 
  postulante, 
  showDetails = true 
}) => {
  const isListaNegra = postulante.estado_global === 'NO_APTO' || Boolean(postulante.en_lista_negra);
  const isObservado = postulante.estado_global === 'OBSERVADO';

  if (isListaNegra) {
    return (
      <div className="space-y-2 mt-2 w-full">
        <div className="inline-flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[11px] px-2.5 py-1 rounded-full font-black tracking-wider shadow-sm shadow-rose-900/40 whitespace-nowrap">
          <Ban className="w-3.5 h-3.5 text-rose-400 animate-pulse flex-shrink-0" />
          LISTA NEGRA / VETADO EN UNIDAD
        </div>

        {showDetails && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 shadow-md shadow-rose-950/30">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0 flex-1">
              <div>
                <span className="font-bold text-rose-300">Causal de Inclusión en Lista Negra: </span>
                <span className="text-rose-100">
                  {postulante.motivo_lista_negra || postulante.ultima_observacion || 'Bloqueo definitivo por falta médica crítica o antecedentes disciplinarios/legales.'}
                </span>
              </div>
              <p className="text-[10px] text-rose-300/80 font-bold uppercase tracking-wider">
                * ACCESO RESTRINGIDO - Prohibido otorgar Visto Bueno o emitir pase
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isObservado) {
    return (
      <div className="space-y-2 mt-2 w-full">
        <div className="inline-flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[11px] px-2.5 py-1 rounded-full font-black tracking-wider shadow-sm shadow-amber-900/40 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          DOCUMENTO OBSERVADO EN FASE
        </div>

        {showDetails && (
          <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 shadow-md shadow-amber-950/30">
            <FileWarning className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0 flex-1">
              <div>
                <span className="font-bold text-amber-300">Observación técnica de la fase: </span>
                <span className="text-amber-100">
                  "{postulante.ultima_observacion || 'Documento con observaciones pendientes de subsanación o descargo por la contratista.'}"
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 font-medium">
                * El contratista debe remitir la versión subsanada (v2) antes de reevaluar.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1">
      <span className="inline-flex items-center gap-1.5 bg-blue-950/50 border border-blue-500/30 text-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
        <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
        PENDIENTE DE REVISIÓN
      </span>
    </div>
  );
};

export const getDocumentCardBorderClass = (postulante: Postulante): string => {
  const isListaNegra = postulante.estado_global === 'NO_APTO' || Boolean(postulante.en_lista_negra);
  const isObservado = postulante.estado_global === 'OBSERVADO';

  if (isListaNegra) {
    return 'border-rose-500/60 bg-gradient-to-br from-slate-900 via-rose-950/25 to-slate-900 hover:border-rose-400 shadow-lg shadow-rose-950/20';
  }
  if (isObservado) {
    return 'border-amber-500/50 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 hover:border-amber-400 shadow-lg shadow-amber-950/20';
  }
  return 'border-slate-700 bg-slate-900 hover:border-slate-600';
};
