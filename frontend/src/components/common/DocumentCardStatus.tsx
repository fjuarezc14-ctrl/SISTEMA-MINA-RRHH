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
  'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wider whitespace-nowrap flex-shrink-0 shadow-sm';

export const DocumentCardStatus: React.FC<{ postulante: Postulante }> = ({ postulante }) => {
  switch (resolverEstado(postulante)) {
    case 'LISTA_NEGRA':
      return (
        <span className={`${PILL_BASE} bg-rose-50 border border-rose-200 text-rose-800`}>
          <Ban className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          LISTA NEGRA / VETADO
        </span>
      );

    case 'OBSERVADO':
      return (
        <span className={`${PILL_BASE} bg-amber-50 border border-amber-200 text-amber-800`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          DOCUMENTO OBSERVADO
        </span>
      );

    case 'SUBSANADO':
      return (
        <span className={`${PILL_BASE} bg-sky-50 border border-sky-200 text-sky-800`}>
          <CheckCheck className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          SUBSANADO · POR REVISAR
        </span>
      );

    default:
      return (
        <span className={`${PILL_BASE} bg-slate-100 border border-slate-200 text-slate-700`}>
          <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
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
      <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 shadow-sm">
        <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <div>
            <span className="font-bold text-rose-900">Causal de Inclusión en Lista Negra: </span>
            <span className="text-rose-800">
              {postulante.motivo_lista_negra ||
                postulante.ultima_observacion ||
                'Bloqueo definitivo por falta médica crítica o antecedentes disciplinarios/legales.'}
            </span>
          </div>
          <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">
            * ACCESO RESTRINGIDO - Prohibido otorgar Visto Bueno o emitir pase
          </p>
        </div>
      </div>
    );
  }

  if (estado === 'OBSERVADO') {
    return (
      <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
        <FileWarning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <div>
            <span className="font-bold text-amber-900">Observación técnica de la fase: </span>
            <span className="text-amber-800">
              "{postulante.ultima_observacion ||
                'Documento con observaciones pendientes de subsanación o descargo por la contratista.'}"
            </span>
          </div>
          <p className="text-[10px] text-amber-700 font-medium">
            * El contratista debe remitir la versión corregida antes de reevaluar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2.5 shadow-sm">
      <CheckCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-sky-800">
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
      return 'border-rose-200 bg-rose-50/30 hover:border-rose-300 shadow-sm';
    case 'OBSERVADO':
      return 'border-amber-200 bg-amber-50/30 hover:border-amber-300 shadow-sm';
    case 'SUBSANADO':
      return 'border-sky-200 bg-sky-50/30 hover:border-sky-300 shadow-sm';
    default:
      return 'border-slate-200 bg-white hover:border-slate-300 shadow-sm';
  }
};
