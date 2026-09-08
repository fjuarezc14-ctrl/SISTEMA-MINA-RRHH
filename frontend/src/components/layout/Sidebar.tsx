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

import { RolUsuario } from '../../types';
import { LogOut, User, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  userRole: RolUsuario;
  userName: string;
  userArea?: string;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onSelectView,
  userRole,
  userName,
  userArea,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const isSelected = (view: ViewType) => currentView === view;

  const handleSelectView = (view: ViewType) => {
    onSelectView(view);
    if (onCloseMobile) onCloseMobile();
  };

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

  // Reglas de Visibilidad Estricta por Rol (RBAC)
  const canSee = (view: ViewType) => {
    if (userRole === 'SUPER_ADMIN') return true;
    switch (view) {
      case 'admin':
        return false; // Solo SUPER_ADMIN (retorna true arriba)
      case 'contratista':
        return userRole === 'CONTRATISTA';
      case 'fase1':
        return userRole === 'STAFF_RRHH';
      case 'fase2':
        return userRole === 'MEDICO_OCUPACIONAL';
      case 'fase3':
        return userRole === 'SEGURIDAD_PATRIMONIAL';
      case 'fase4':
        return userRole === 'INSTRUCTOR_SSOMA';
      case 'fase5':
        return userRole === 'ADMIN_CONTRATOS';
      case 'fotocheck':
        return userRole === 'CONTROL_ACCESOS';
      case 'garita':
        return userRole === 'CONTROL_ACCESOS';
      case 'vehiculos':
        return userRole === 'CONTRATISTA' || userRole === 'SEGURIDAD_PATRIMONIAL' || userRole === 'CONTROL_ACCESOS';
      case 'metricas':
        return userRole === 'STAFF_RRHH';
      default:
        return false;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-wide">
            <span className="text-blue-500 flex items-center gap-1">
              <HardHat className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" /> VT
            </span>
            ONBOARDING
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">Gestión de Accesos - Unidad Minera</p>
        </div>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {/* Mando Central */}
        {canSee('admin') && (
          <>
            <p className="text-xs font-bold text-purple-400 mb-2 mt-1 px-4 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-purple-400" /> Mando Central
            </p>
            <button 
              onClick={() => handleSelectView('admin')} 
              className={getButtonClass('admin', true)}
            >
              <ShieldCheck className="w-5 h-5 text-purple-400" /> Panel Super Admin
            </button>
          </>
        )}

        {/* Portal Externo */}
        {canSee('contratista') && (
          <>
            <p className="text-xs font-bold text-slate-500 mb-2 mt-4 px-4 uppercase tracking-wider">
              Portal Externo
            </p>
            <button 
              onClick={() => handleSelectView('contratista')} 
              className={getButtonClass('contratista')}
            >
              <Building2 className="w-5 h-5" /> Portal Contratista
            </button>
          </>
        )}

        {/* Embudo de Acreditación (Vistos Buenos Secuenciales) */}
        {(canSee('fase1') || canSee('fase2') || canSee('fase3') || canSee('fase4') || canSee('fase5') || canSee('fotocheck')) && (
          <div className="pt-3">
            <p className="text-xs font-bold text-slate-500 mb-2 px-4 uppercase tracking-wider">
              Embudo de 5 V°B°
            </p>
            
            {canSee('fase1') && (
              <button 
                onClick={() => handleSelectView('fase1')} 
                className={getButtonClass('fase1')}
              >
                <FileSearch className="w-5 h-5" /> 1. V°B° RRHH (CV y Datos)
              </button>
            )}

            {canSee('fase2') && (
              <button 
                onClick={() => handleSelectView('fase2')} 
                className={getButtonClass('fase2')}
              >
                <Stethoscope className="w-5 h-5" /> 2. V°B° Médico (Salud/EMO)
              </button>
            )}

            {canSee('fase3') && (
              <button 
                onClick={() => handleSelectView('fase3')} 
                className={getButtonClass('fase3')}
              >
                <ShieldAlert className="w-5 h-5" /> 3. V°B° Seguridad (Legal)
              </button>
            )}

            {canSee('fase4') && (
              <button 
                onClick={() => handleSelectView('fase4')} 
                className={getButtonClass('fase4')}
              >
                <GraduationCap className="w-5 h-5" /> 4. V°B° SSOMA (Inducción)
              </button>
            )}

            {canSee('fase5') && (
              <button 
                onClick={() => handleSelectView('fase5')} 
                className={getButtonClass('fase5')}
              >
                <ClipboardCheck className="w-5 h-5" /> 5. V°B° SCTR (Seguros)
              </button>
            )}

            {canSee('fotocheck') && (
              <button 
                onClick={() => handleSelectView('fotocheck')} 
                className={getButtonClass('fotocheck')}
              >
                <CreditCard className="w-5 h-5" /> Meta: Emisión Fotocheck
              </button>
            )}
          </div>
        )}

        {/* Operaciones de Garita y Campo */}
        {(canSee('garita') || canSee('vehiculos') || canSee('metricas')) && (
          <div className="pt-3">
            <p className="text-xs font-bold text-slate-500 mb-2 px-4 uppercase tracking-wider">
              Operaciones de Mina
            </p>

            {canSee('garita') && (
              <button 
                onClick={() => handleSelectView('garita')} 
                className={getButtonClass('garita')}
              >
                <QrCode className="w-5 h-5 text-emerald-400" /> Control Garita (QR)
              </button>
            )}

            {canSee('vehiculos') && (
              <button 
                onClick={() => handleSelectView('vehiculos')} 
                className={getButtonClass('vehiculos')}
              >
                <Truck className="w-5 h-5 text-amber-400" /> Pases Vehiculares
              </button>
            )}

            {canSee('metricas') && (
              <button 
                onClick={() => handleSelectView('metricas')} 
                className={getButtonClass('metricas')}
              >
                <BarChart3 className="w-5 h-5 text-cyan-400" /> SLAs y Rendimiento
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Tarjeta de Perfil y Botón Cerrar Sesión */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <span className="text-[10px] text-blue-400 block font-mono uppercase truncate">
              {userRole}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-600/40 text-slate-400 hover:text-rose-300 py-2 rounded-xl text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Drawer Móvil con Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Sidebar Persistente de Escritorio */}
      <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex h-screen select-none shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
};
