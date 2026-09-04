import React from 'react';
import { 
  Building2, 
  FileSearch, 
  Stethoscope, 
  ShieldAlert, 
  GraduationCap, 
  ClipboardCheck, 
  IdCard,
  HardHat
} from 'lucide-react';

export type ViewType = 
  | 'contratista'
  | 'fase1'
  | 'fase2'
  | 'fase3'
  | 'fase4'
  | 'fase5'
  | 'fotocheck';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const isSelected = (view: ViewType) => currentView === view;

  const getButtonClass = (view: ViewType) => {
    return isSelected(view)
      ? 'w-full text-left flex items-center gap-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-3 rounded-xl font-medium transition-colors'
      : 'w-full text-left flex items-center gap-3 hover:bg-slate-800 text-slate-400 border border-transparent px-4 py-3 rounded-xl font-medium transition-colors';
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex h-screen select-none">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-wide">
          <span className="text-blue-500 flex items-center gap-1">
            <HardHat className="w-7 h-7 text-blue-500" /> VT
          </span>
          ONBOARDING
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Gestión de Accesos - Unidad Minera</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-500 mb-2 mt-3 px-4 uppercase tracking-wider">
          Vista Externa
        </p>
        <button 
          onClick={() => onSelectView('contratista')} 
          className={getButtonClass('contratista')}
        >
          <Building2 className="w-5 h-5" /> Portal Contratista
        </button>

        <p className="text-xs font-bold text-slate-500 mb-2 mt-6 px-4 uppercase tracking-wider">
          Flujo Staff de Mina
        </p>
        
        <button 
          onClick={() => onSelectView('fase1')} 
          className={getButtonClass('fase1')}
        >
          <FileSearch className="w-5 h-5" /> Fase 1: Datos y CV
        </button>

        <button 
          onClick={() => onSelectView('fase2')} 
          className={getButtonClass('fase2')}
        >
          <Stethoscope className="w-5 h-5" /> Fase 2: Salud (EMO)
        </button>

        <button 
          onClick={() => onSelectView('fase3')} 
          className={getButtonClass('fase3')}
        >
          <ShieldAlert className="w-5 h-5" /> Fase 3: Antecedentes
        </button>

        <button 
          onClick={() => onSelectView('fase4')} 
          className={getButtonClass('fase4')}
        >
          <GraduationCap className="w-5 h-5" /> Fase 4: Capacitación
        </button>

        <button 
          onClick={() => onSelectView('fase5')} 
          className={getButtonClass('fase5')}
        >
          <ClipboardCheck className="w-5 h-5" /> Fase 5: SCTR
        </button>

        <button 
          onClick={() => onSelectView('fotocheck')} 
          className={getButtonClass('fotocheck')}
        >
          <IdCard className="w-5 h-5" /> Meta: Fotocheck
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-400 font-medium">Unidad Minera: Operativa</span>
        </div>
      </div>
    </aside>
  );
};
