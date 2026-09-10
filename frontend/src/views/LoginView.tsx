import React, { useState } from 'react';
import { RolUsuario, UsuarioSistema } from '../types';
import { 
  HardHat, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Stethoscope, 
  ShieldAlert, 
  GraduationCap, 
  ClipboardCheck, 
  Building2, 
  AlertCircle,
  KeyRound,
  QrCode,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (usuario: UsuarioSistema, token: string) => void;
}

interface DemoAccount {
  email: string;
  nombre: string;
  rol: RolUsuario;
  area: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@valetec.com',
    nombre: 'Ing. Yerson (Super Admin)',
    rol: 'SUPER_ADMIN',
    area: 'Superintendencia de Operaciones y RRHH Mina',
    badgeColor: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
    icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
  },
  {
    email: 'salud@valetec.com',
    nombre: 'Dr. Arévalo (Médico CMP 45123)',
    rol: 'MEDICO_OCUPACIONAL',
    area: 'Salud Ocupacional / Policlínico Mina (Fase 2)',
    badgeColor: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
    icon: <Stethoscope className="w-4 h-4 text-emerald-400" />,
  },
  {
    email: 'seguridad@valetec.com',
    nombre: 'Cmdte. Rivas (Seguridad Patrimonial)',
    rol: 'SEGURIDAD_PATRIMONIAL',
    area: 'Seguridad Patrimonial y Legal (Fase 3)',
    badgeColor: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
  },
  {
    email: 'rrhh@valetec.com',
    nombre: 'Lic. Valenzuela (RRHH)',
    rol: 'STAFF_RRHH',
    area: 'Recursos Humanos / Reclutamiento Mina (Fase 1)',
    badgeColor: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
    icon: <HardHat className="w-4 h-4 text-blue-400" />,
  },
  {
    email: 'capacitacion@valetec.com',
    nombre: 'Ing. Torres (Instructor SSOMA)',
    rol: 'INSTRUCTOR_SSOMA',
    area: 'Seguridad y Salud Ocupacional - SSOMA (Fase 4)',
    badgeColor: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
    icon: <GraduationCap className="w-4 h-4 text-amber-400" />,
  },
  {
    email: 'seguros@valetec.com',
    nombre: 'Dra. Silva (Admin Contratos/SCTR)',
    rol: 'ADMIN_CONTRATOS',
    area: 'Administración de Contratos y Seguros (Fase 5)',
    badgeColor: 'bg-teal-950/60 border-teal-500/40 text-teal-300',
    icon: <ClipboardCheck className="w-4 h-4 text-teal-400" />,
  },
  {
    email: 'accesos@valetec.com',
    nombre: 'Oficial Huamán (Garita Principal)',
    rol: 'CONTROL_ACCESOS',
    area: 'Control de Accesos y Emisión Fotochecks',
    badgeColor: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
    icon: <QrCode className="w-4 h-4 text-cyan-400" />,
  },
  {
    email: 'contratista@serviciosxyz.com',
    nombre: 'Carlos Mendoza (Contratista)',
    rol: 'CONTRATISTA',
    area: 'Servicios Mineros XYZ S.A.C.',
    badgeColor: 'bg-slate-800 border-slate-700 text-slate-300',
    icon: <Building2 className="w-4 h-4 text-amber-400" />,
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState<number>(0);
  const [intentosActuales, setIntentosActuales] = useState<number>(0);
  const [isLockedDefinitive, setIsLockedDefinitive] = useState<boolean>(false);

  // Temporizador regresivo en vivo de 30 segundos
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    if (countdown > 0 || isLockedDefinitive) return;

    const loginEmail = customEmail !== undefined ? customEmail : email;
    const loginPassword = customPassword !== undefined ? customPassword : password;

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Por favor ingrese correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { token, user } = res.data;

      const usuarioCompleto: UsuarioSistema = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol as RolUsuario,
        area_responsable: DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === user.email.toLowerCase())?.area || 'Área Operativa',
        activo: true,
      };

      localStorage.setItem('vt_token', token);
      localStorage.setItem('vt_user', JSON.stringify(usuarioCompleto));

      onLoginSuccess(usuarioCompleto, token);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      // 1. Caso: Bloqueo definitivo (3 intentos agotados)
      if (data?.code === 'CUENTA_BLOQUEADA_DEFINITIVO' || status === 403) {
        setIsLockedDefinitive(true);
        setCountdown(0);
        setIntentosActuales(3);
        setErrorMsg(data?.error || 'Tu cuenta ha sido bloqueada tras 3 intentos fallidos consecutivos.');
        return;
      }

      // 2. Caso: Bloqueo temporal preventivo (30 segundos)
      if (data?.code === 'BLOQUEO_TEMPORAL' || status === 429) {
        const segs = data?.segundosRestantes || 30;
        setCountdown(segs);
        setIntentosActuales(data?.intentos || 1);
        setErrorMsg(data?.error || `Contraseña incorrecta. Intento ${data?.intentos || 1} de 3. Espere ${segs} segundos.`);
        return;
      }

      // Error de conexión o credenciales inválidas
      setErrorMsg(err.response?.data?.error || 'Error de conexión con el servidor. Verifique su red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 py-6 sm:py-10 selection:bg-blue-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950 -z-10" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-auto">
        {/* LADO IZQUIERDO: Formulario de Login */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <HardHat className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-wider text-white flex items-center gap-1.5">
                VALETEC <span className="text-blue-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800/60">Mina</span>
              </h1>
              <p className="text-xs text-slate-400">Sistema de Acreditación y Onboarding</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingrese con su cuenta asignada para acceder exclusivamente al área de su competencia.
            </p>
          </div>

          {/* ALERTA DE BLOQUEO DEFINITIVO TRAS 3 INTENTOS */}
          {isLockedDefinitive && (
            <div className="mb-5 bg-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-4 text-center space-y-3 shadow-xl shadow-rose-950/50 animate-in zoom-in-95">
              <div className="w-11 h-11 rounded-full bg-rose-600/30 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-white">Acceso Bloqueado por Seguridad</h3>
                <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                  Has alcanzado el límite de <strong>3 intentos fallidos</strong>. Por protocolos de seguridad minera, tu cuenta ha sido suspendida de inmediato.
                </p>
              </div>
              <div className="bg-slate-950/90 rounded-xl p-3 text-xs border border-rose-900/50 text-slate-300">
                <p className="font-bold text-rose-300 mb-1">Para reactivar tu cuenta o restablecer contraseña:</p>
                <p className="text-slate-400 text-[11px] mb-1.5">Contacta al Administrador del Sistema:</p>
                <a 
                  href="mailto:admin@valetec.com" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/60 text-rose-200 font-mono text-xs font-bold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  admin@valetec.com
                </a>
              </div>
            </div>
          )}

          {/* TEMPORIZADOR REGRESIVO DE 30 SEGUNDOS */}
          {countdown > 0 && !isLockedDefinitive && (
            <div className="mb-5 bg-amber-950/50 border border-amber-500/50 rounded-2xl p-4 space-y-2.5 shadow-lg shadow-amber-950/30 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Clock className="w-4 h-4 animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
                  <span>Pausa Preventiva de Seguridad</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {countdown}s restantes
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-amber-900/50">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 30) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-amber-200/90 flex justify-between items-center">
                <span>Intento erróneo {intentosActuales} de 3</span>
                <span className="text-slate-400">Reintentos restantes: {Math.max(0, 3 - intentosActuales)}</span>
              </p>
            </div>
          )}

          {errorMsg && !isLockedDefinitive && countdown === 0 && (
            <div className="mb-5 bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  disabled={countdown > 0 || isLockedDefinitive || loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. salud@valetec.com"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  disabled={countdown > 0 || isLockedDefinitive || loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || countdown > 0 || isLockedDefinitive}
              className={`w-full mt-2 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLockedDefinitive
                  ? 'bg-rose-950/80 border border-rose-700/60 text-rose-300 cursor-not-allowed'
                  : countdown > 0
                  ? 'bg-amber-950/80 border border-amber-600/50 text-amber-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : isLockedDefinitive ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Acceso Bloqueado (3 Fallos)</span>
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>Reintentar en {countdown}s...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              Acceso protegido con Tokens Criptográficos JWT y Aislamiento por Roles (RBAC)
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Información Institucional */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Acceso Restringido por Roles (RBAC)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cada usuario tiene acceso exclusivamente a las funciones que le corresponden según su rol asignado por el Administrador del Sistema.
            </p>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <div
                  key={acc.email}
                  className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center gap-3"
                >
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${acc.badgeColor} shrink-0`}>
                    {acc.icon} {acc.rol}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">{acc.area.split('/')[0]}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/50">
              <p className="text-[11px] text-slate-500 text-center">
                Si no tiene una cuenta asignada, comuníquese con el Administrador del Sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
