import React from 'react';
import { Postulante } from '../../types';
import { AlertTriangle, Ban, Clock, ShieldAlert, FileWarning, CheckCheck } from 'lucide-react';

type EstadoTarjeta = 'LISTA_NEGRA' | 'OBSERVADO' | 'SUBSANADO' | 'PENDIENTE';

const resolverEstado = (postulante: Postulante): EstadoTarjeta => {
  if (postulante.estado_global === 'NO_APTO' || postulante.en_lista_negra) return 'LISTA_NEGRA';
  if (postulante.estado_global === 'OBSERVADO') return 'OBSERVADO';
  if (postulante.subsanacion_pendiente) return 'SUBSANADO';
  return 'PENDIENTE';
};

const PILL_BASE =
  'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-black tracking-wider whitespace-nowrap flex-shrink-0 shadow-sm';

export const DocumentCardStatus: React.FC<{ postulante: Postulante }> = ({ postulante }) => {
  switch (resolverEstado(postulante)) {
    case 'LISTA_NEGRA':
      return (
        <span className={`${PILL_BASE} bg-rose-950/80 border border-rose-500/50 text-rose-300 shadow-rose-900/40`}>
          <Ban className="w-3.5 h-3.5 text-rose-400 animate-pulse flex-shrink-0" />
          LISTA NEGRA / VETADO
        </span>
      );

    case 'OBSERVADO':
      return (
        <span className={`${PILL_BASE} bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow-amber-900/40`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          DOCUMENTO OBSERVADO
        </span>
      );

    case 'SUBSANADO':
      return (
        <span className={`${PILL_BASE} bg-sky-950/80 border border-sky-500/50 text-sky-300 shadow-sky-900/40`}>
          <CheckCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          SUBSANADO · POR REVISAR
        </span>
      );

    default:
      return (
        <span className={`${PILL_BASE} bg-blue-950/50 border border-blue-500/30 text-blue-300 font-bold`}>
          <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
          PENDIENTE DE REVISIÓN
        </span>
      );
  }
};

/** Panel explicativo a ancho completo. Va debajo de la fila principal de la tarjeta. */
export const DocumentCardDetail: React.FC<{ postulante: Postulante }> = ({ postulante }) => {
  const estado = resolverEstado(postulante);

  if (estado === 'PENDIENTE') return null;

  if (estado === 'LISTA_NEGRA') {
    return (
      <div className="mt-4 p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 shadow-md shadow-rose-950/30">
        <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <div>
            <span className="font-bold text-rose-300">Causal de Inclusión en Lista Negra: </span>
            <span className="text-rose-100">
              {postulante.motivo_lista_negra ||
                postulante.ultima_observacion ||
                'Bloqueo definitivo por falta médica crítica o antecedentes disciplinarios/legales.'}
            </span>
          </div>
          <p className="text-[10px] text-rose-300/80 font-bold uppercase tracking-wider">
            * ACCESO RESTRINGIDO - Prohibido otorgar Visto Bueno o emitir pase
          </p>
        </div>
      </div>
    );
  }

  if (estado === 'OBSERVADO') {
    return (
      <div className="mt-4 p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 shadow-md shadow-amber-950/30">
        <FileWarning className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <div>
            <span className="font-bold text-amber-300">Observación técnica de la fase: </span>
            <span className="text-amber-100">
              "{postulante.ultima_observacion ||
                'Documento con observaciones pendientes de subsanación o descargo por la contratista.'}"
            </span>
          </div>
          <p className="text-[10px] text-amber-300/80 font-medium">
            * El contratista debe remitir la versión corregida antes de reevaluar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-sky-950/50 border border-sky-500/40 rounded-xl text-xs text-sky-200 flex items-start gap-2.5 shadow-md shadow-sky-950/30">
      <CheckCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-sky-100">
          La contratista ya remitió la versión corregida del documento. Está a la espera de una nueva revisión del
          evaluador de área.
        </p>
      </div>
    </div>
  );
};

export const getDocumentCardBorderClass = (postulante: Postulante): string => {
  switch (resolverEstado(postulante)) {
    case 'LISTA_NEGRA':
      return 'border-rose-500/60 bg-gradient-to-br from-slate-900 via-rose-950/25 to-slate-900 hover:border-rose-400 shadow-lg shadow-rose-950/20';
    case 'OBSERVADO':
      return 'border-amber-500/50 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 hover:border-amber-400 shadow-lg shadow-amber-950/20';
    case 'SUBSANADO':
      return 'border-sky-500/50 bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 hover:border-sky-400 shadow-lg shadow-sky-950/20';
    default:
      return 'border-slate-700 bg-slate-900 hover:border-slate-600';
  }
};
