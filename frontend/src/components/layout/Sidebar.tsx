import React from 'react';
import { 
  Building2, 
  FileSearch, 
  Stethoscope, 
  ShieldAlert, 
  GraduationCap, 
  ClipboardCheck, 
  CreditCard,
  HardHat,
  ShieldCheck,
  Crown,
  QrCode,
  Truck,
  BarChart3
} from 'lucide-react';

export type ViewType = 
  | 'admin'
  | 'contratista'
  | 'fase1'
  | 'fase2'
  | 'fase3'
  | 'fase4'
  | 'fase5'
  | 'fotocheck'
  | 'garita'
  | 'vehiculos'
  | 'metricas';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const isSelected = (view: ViewType) => currentView === view;

  const getButtonClass = (view: ViewType, isSpecial = false) => {
    if (isSelected(view)) {
      if (isSpecial) {
        return 'w-full text-left flex items-center gap-3 bg-purple-600/20 text-purple-300 border border-purple-500/40 px-4 py-3 rounded-xl font-bold shadow-lg transition-colors';
      }
      return 'w-full text-left flex items-center gap-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-3 rounded-xl font-medium transition-colors';
    }
    
    if (isSpecial) {
      return 'w-full text-left flex items-center gap-3 hover:bg-purple-950/40 text-purple-400/80 border border-purple-900/30 px-4 py-3 rounded-xl font-medium transition-colors';
    }

    return 'w-full text-left flex items-center gap-3 hover:bg-slate-800 text-slate-400 border border-transparent px-4 py-3 rounded-xl font-medium transition-colors';
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
        <p className="text-xs font-bold text-purple-400 mb-2 mt-1 px-4 uppercase tracking-wider flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-purple-400" /> Mando Central
        </p>
        <button 
          onClick={() => onSelectView('admin')} 
          className={getButtonClass('admin', true)}
        >
          <ShieldCheck className="w-5 h-5 text-purple-400" /> Panel Super Admin
        </button>

        <p className="text-xs font-bold text-slate-500 mb-2 mt-6 px-4 uppercase tracking-wider">
          Portal Externo
        </p>
        <button 
          onClick={() => onSelectView('contratista')} 
          className={getButtonClass('contratista')}
        >
          <Building2 className="w-5 h-5" /> Portal Contratista
        </button>

        <p className="text-xs font-bold text-slate-500 mb-2 mt-6 px-4 uppercase tracking-wider">
          Flujo de Vistos Buenos (Mina)
        </p>
        
        <button 
          onClick={() => onSelectView('fase1')} 
          className={getButtonClass('fase1')}
        >
          <FileSearch className="w-5 h-5" /> 1. V°B° RRHH (CV y Datos)
        </button>

        <button 
          onClick={() => onSelectView('fase2')} 
          className={getButtonClass('fase2')}
        >
          <Stethoscope className="w-5 h-5" /> 2. V°B° Médico (Salud/EMO)
        </button>

        <button 
          onClick={() => onSelectView('fase3')} 
          className={getButtonClass('fase3')}
        >
          <ShieldAlert className="w-5 h-5" /> 3. V°B° Seguridad (Legal)
        </button>

        <button 
          onClick={() => onSelectView('fase4')} 
          className={getButtonClass('fase4')}
        >
          <GraduationCap className="w-5 h-5" /> 4. V°B° SSOMA (Inducción)
        </button>

        <button 
          onClick={() => onSelectView('fase5')} 
          className={getButtonClass('fase5')}
        >
          <ClipboardCheck className="w-5 h-5" /> 5. V°B° SCTR (Seguros)
        </button>

        <button 
          onClick={() => onSelectView('fotocheck')} 
          className={getButtonClass('fotocheck')}
        >
          <CreditCard className="w-5 h-5" /> Meta: Emisión Fotocheck
        </button>

        <p className="text-xs font-bold text-emerald-400 mb-2 mt-6 px-4 uppercase tracking-wider flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Operaciones y Campo
        </p>

        <button 
          onClick={() => onSelectView('garita')} 
          className={getButtonClass('garita')}
        >
          <QrCode className="w-5 h-5 text-emerald-400" /> Control Garita (QR)
        </button>

        <button 
          onClick={() => onSelectView('vehiculos')} 
          className={getButtonClass('vehiculos')}
        >
          <Truck className="w-5 h-5 text-amber-400" /> Pases Vehiculares
        </button>

        <button 
          onClick={() => onSelectView('metricas')} 
          className={getButtonClass('metricas')}
        >
          <BarChart3 className="w-5 h-5 text-cyan-400" /> SLAs y Rendimiento
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
