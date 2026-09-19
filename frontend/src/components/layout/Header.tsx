import React, { useState } from 'react';
import { Notificacion, RolUsuario } from '../../types';
import { Shield, Crown, Bell, CheckCircle, AlertTriangle, Info, ShieldAlert, X, LogOut, UserCheck, Menu, Trash2 } from 'lucide-react';
import { ViewType } from './Sidebar';

interface HeaderProps {
  currentView: ViewType;
  userName: string;
  userRole: RolUsuario;
  userArea?: string;
  onLogout: () => void;
  notificaciones?: Notificacion[];
  onMarcarLeida?: (id: string) => void;
  onEliminarNotificacion?: (id: string) => void;
  onLimpiarLeidas?: () => void;
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
  onEliminarNotificacion,
  onLimpiarLeidas,
  onOpenMobileMenu,
}) => {
  const [title, subtitle] = titles[currentView] || ['Onboarding Minero', 'Panel de gestión'];
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const noLeidas = notificaciones.filter((n) => !n.leido);
  const leidas = notificaciones.filter((n) => n.leido);

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
    <header className="bg-white/95 border-b border-slate-200 px-4 py-3 sm:p-5 flex justify-between items-center gap-3 sticky top-0 z-20 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors shrink-0"
            title="Abrir Menú de Navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {currentView === 'admin' && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />}
            <span className="truncate">{title}</span>
            {userRole === 'MEDICO_OCUPACIONAL' && (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md hidden lg:inline-flex items-center gap-1 shrink-0">
                🔒 SECRETO MÉDICO
              </span>
            )}
            {userRole === 'INSTRUCTOR_SSOMA' && (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md hidden lg:inline-flex items-center gap-1 shrink-0">
                🦺 D.S. 024-2016-EM
              </span>
            )}
            {userRole === 'CONTROL_ACCESOS' && (
              <span className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md hidden lg:inline-flex items-center gap-1 shrink-0">
                ● EN LÍNEA GARITA
              </span>
            )}
            {userRole === 'SEGURIDAD_PATRIMONIAL' && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md hidden lg:inline-flex items-center gap-1 shrink-0">
                🛡️ CONTROL PATRIMONIAL
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Identificación de Usuario y Rol Activo */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs shadow-sm">
          <Shield className="w-4 h-4 text-blue-700 shrink-0" />
          <div className="text-left hidden sm:block">
            <span className="text-slate-900 font-bold block leading-tight truncate max-w-[120px] md:max-w-none">{userName}</span>
            <span className="text-[10px] text-blue-700 block font-mono font-semibold uppercase">{userRole}</span>
          </div>
        </div>

        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPopover(!showNotifPopover)}
            className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Centro de Alertas y Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {noLeidas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {noLeidas.length}
              </span>
            )}
          </button>

          {showNotifPopover && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-700" />
                  <h4 className="font-bold text-sm text-slate-900">Alertas</h4>
                </div>
                <div className="flex items-center gap-2">
                  {leidas.length > 0 && onLimpiarLeidas && (
                    <button onClick={onLimpiarLeidas} className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors">Limpiar leídas</button>
                  )}
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {noLeidas.length} pendientes
                  </span>
                  <button 
                    onClick={() => setShowNotifPopover(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
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
                          ? 'bg-slate-50/80 border-slate-100 text-slate-500'
                          : 'bg-blue-50/50 border-blue-100 text-slate-800 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {getNotifIcon(notif.tipo)}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-900">{notif.titulo}</p>
                            {onEliminarNotificacion && (
                              <button onClick={() => onEliminarNotificacion(notif.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5"/></button>
                            )}
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.mensaje}</p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.creado_en).toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.leido && onMarcarLeida && (
                              <button
                                onClick={() => onMarcarLeida(notif.id)}
                                className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold"
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
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 shadow-sm">
          <UserCheck className="w-4 h-4" />
        </div>

        {/* Botón Cerrar Sesión en Header */}
        <button
          onClick={onLogout}
          title="Cerrar Sesión"
          className="flex items-center gap-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
