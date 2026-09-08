import React, { useState } from 'react';
import { Notificacion, RolUsuario } from '../../types';
import { Shield, Crown, Bell, CheckCircle, AlertTriangle, Info, ShieldAlert, X, LogOut, UserCheck, Menu } from 'lucide-react';
import { ViewType } from './Sidebar';

interface HeaderProps {
  currentView: ViewType;
  userName: string;
  userRole: RolUsuario;
  userArea?: string;
  onLogout: () => void;
  notificaciones?: Notificacion[];
  onMarcarLeida?: (id: string) => void;
  onOpenMobileMenu?: () => void;
}

const titles: Record<ViewType, [string, string]> = {
  admin: ['Panel de Mando Super Admin', 'Control global de accesos, evaluadores por flujo y auditoría inmutable'],
  contratista: ['Portal Contratista (ECM)', 'Monitoreo de candidatos, semáforo de vistos buenos y subsanación'],
  fase1: ['1. Área RRHH (CV y Datos)', 'Validación de perfil técnico, experiencia y visto bueno documentario'],
  fase2: ['2. Área Médica (Salud Ocupacional)', 'Dictamen de aptitud médica EMO, pruebas toxicológicas y visto bueno'],
  fase3: ['3. Seguridad Patrimonial', 'Revisión de antecedentes penales, judiciales y visto bueno legal'],
  fase4: ['4. Área SSOMA / Capacitación', 'Calificación de inducción (nota mín 14/20) y visto bueno de seguridad'],
  fase5: ['5. Administración de Contratos', 'Validación de vigencia de pólizas SCTR y visto bueno de aseguramiento'],
  fotocheck: ['Centro de Fotochecks y Garita', 'Emisión de credenciales con código QR para candidatos con 5 V°B°'],
  garita: ['Control de Accesos en Garita', 'Lector y scanner de credenciales QR en tiempo real para ingreso a mina'],
  vehiculos: ['Pases Vehiculares y Maquinaria', 'Acreditación técnica, pólizas TREC/SOAT y checklist de seguridad minera'],
  metricas: ['SLAs y Rendimiento Operativo', 'Tiempos promedio de atención por área y tasa de cumplimiento de contratistas'],
};

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  userName,
  userRole,
  userArea,
  onLogout,
  notificaciones = [],
  onMarcarLeida,
  onOpenMobileMenu,
}) => {
  const [title, subtitle] = titles[currentView] || ['Onboarding Minero', 'Panel de gestión'];
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const noLeidas = notificaciones.filter((n) => !n.leido);

  const getNotifIcon = (tipo: string) => {
    switch (tipo) {
      case 'OBSERVACION':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'VENCIMIENTO_SCTR':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'APROBADO':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:p-6 flex justify-between items-center gap-3 sticky top-0 z-20 backdrop-blur-md bg-slate-900/90">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Abrir Menú de Navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
            {currentView === 'admin' && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />}
            <span className="truncate">{title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Identificación de Usuario y Rol Activo */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs">
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-left hidden sm:block">
            <span className="text-white font-bold block leading-tight truncate max-w-[120px] md:max-w-none">{userName}</span>
            <span className="text-[10px] text-blue-400 block font-mono font-semibold uppercase">{userRole}</span>
          </div>
        </div>

        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="relative w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Centro de Alertas y Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {noLeidas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {noLeidas.length}
              </span>
            )}
          </button>

          {showNotifPopover && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-sm text-white">Alertas de Acreditación</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {noLeidas.length} pendientes
                  </span>
                  <button 
                    onClick={() => setShowNotifPopover(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                {notificaciones.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No hay alertas registradas</p>
                ) : (
                  notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        notif.leido
                          ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {getNotifIcon(notif.tipo)}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-100">{notif.titulo}</p>
                          <p className="text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.mensaje}</p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/50">
                            <span className="text-[10px] text-slate-500">
                              {new Date(notif.creado_en).toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.leido && onMarcarLeida && (
                              <button
                                onClick={() => onMarcarLeida(notif.id)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                              >
                                Marcar leída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar / Status */}
        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
