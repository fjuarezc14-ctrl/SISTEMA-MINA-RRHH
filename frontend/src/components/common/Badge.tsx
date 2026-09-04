import React from 'react';
import { EstadoGlobal, FaseOnboarding } from '../../types';

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

  if (estado === 'OBSERVADO') {
    return (
      <span className="bg-amber-900/50 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
        OBSERVADO
      </span>
    );
  }

  if (estado === 'NO_APTO') {
    return (
      <span className="bg-rose-900/60 text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/40">
        NO APTO (LISTA NEGRA)
      </span>
    );
  }

  if (fase) {
    const faseLabels: Record<FaseOnboarding, string> = {
      FASE_1: 'Fase 1: Datos y CV',
      FASE_2: 'Fase 2: Salud (EMO)',
      FASE_3: 'Fase 3: Antecedentes',
      FASE_4: 'Fase 4: Capacitación',
      FASE_5: 'Fase 5: SCTR y Seguros',
      FOTOCHECK: 'Aprobado: Fotocheck',
      FINALIZADO: 'Acreditado',
    };

    return (
      <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
        {faseLabels[fase] || fase}
      </span>
    );
  }

  return (
    <span className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
      {estado || 'ACTIVO'}
    </span>
  );
};
