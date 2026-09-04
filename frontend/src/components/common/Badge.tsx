import React from 'react';
import { EstadoGlobal, FaseOnboarding } from '../../types';
import { ShieldCheck, AlertTriangle, Ban, Clock } from 'lucide-react';

interface BadgeProps {
  estado?: EstadoGlobal;
  fase?: FaseOnboarding;
  customText?: string;
}

export const Badge: React.FC<BadgeProps> = ({ estado, fase, customText }) => {
  if (customText) {
    return (
      <span className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-bold">
        {customText}
      </span>
    );
  }

  if (estado === 'APTO_PARA_TRABAJAR' || estado === 'APROBADO_TOTAL') {
    return (
      <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 tracking-wide">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> APTO PARA TRABAJAR
      </span>
    );
  }

  if (estado === 'OBSERVADO') {
    return (
      <span className="bg-amber-900/50 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/40 inline-flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-amber-400" /> OBSERVADO
      </span>
    );
  }

  if (estado === 'NO_APTO') {
    return (
      <span className="bg-rose-900/70 text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/40 inline-flex items-center gap-1">
        <Ban className="w-3 h-3 text-rose-400" /> LISTA NEGRA
      </span>
    );
  }

  if (fase) {
    const faseLabels: Record<FaseOnboarding, string> = {
      FASE_1: '1. V°B° RRHH (CV)',
      FASE_2: '2. V°B° Médico (EMO)',
      FASE_3: '3. V°B° Seguridad',
      FASE_4: '4. V°B° SSOMA (Inducción)',
      FASE_5: '5. V°B° SCTR (Seguros)',
      FOTOCHECK: 'Apto: Emisión Fotocheck',
      FINALIZADO: 'Acreditado Total',
    };

    return (
      <span className="bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 inline-flex items-center gap-1">
        <Clock className="w-3 h-3 text-blue-400" /> {faseLabels[fase] || fase}
      </span>
    );
  }

  return (
    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
      {estado || 'EN EVALUACIÓN'}
    </span>
  );
};
