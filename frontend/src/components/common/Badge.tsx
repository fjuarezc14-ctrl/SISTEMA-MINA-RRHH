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
      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
        {customText}
      </span>
    );
  }

  if (estado === 'APTO_PARA_TRABAJAR' || estado === 'APROBADO_TOTAL') {
    return (
      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm tracking-wide">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> APTO PARA TRABAJAR
      </span>
    );
  }

  if (estado === 'OBSERVADO') {
    return (
      <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 inline-flex items-center gap-1 shadow-sm">
        <AlertTriangle className="w-3 h-3 text-amber-700" /> OBSERVADO
      </span>
    );
  }

  if (estado === 'NO_APTO') {
    return (
      <span className="bg-rose-50 text-rose-800 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 inline-flex items-center gap-1 shadow-sm">
        <Ban className="w-3 h-3 text-rose-700" /> LISTA NEGRA
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
      <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 inline-flex items-center gap-1 shadow-sm">
        <Clock className="w-3 h-3 text-blue-700" /> {faseLabels[fase] || fase}
      </span>
    );
  }

  return (
    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
      {estado || 'EN EVALUACIÓN'}
    </span>
  );
};
