import React, { useState } from 'react';
import { RolUsuario, UsuarioSistema } from '../types';
import { 
  HardHat, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle,
  KeyRound,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (usuario: UsuarioSistema, token: string) => void;
}

const ROL_AREAS: Record<string, string> = {
  SUPER_ADMIN: 'Superintendencia de Operaciones y RRHH Mina',
  MEDICO_OCUPACIONAL: 'Salud Ocupacional / Policlínico Mina (Fase 2)',
  SEGURIDAD_PATRIMONIAL: 'Seguridad Patrimonial y Legal (Fase 3)',
  STAFF_RRHH: 'Recursos Humanos / Reclutamiento Mina (Fase 1)',
  INSTRUCTOR_SSOMA: 'Seguridad y Salud Ocupacional - SSOMA (Fase 4)',
  ADMIN_CONTRATOS: 'Administración de Contratos y Seguros (Fase 5)',
  CONTROL_ACCESOS: 'Control de Accesos y Garita Principal',
  CONTRATISTA: 'Portal de Empresas Contratistas',
};

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (countdown > 0 || isLockedDefinitive) return;

    if (!email || !password) {
      setErrorMsg('Por favor ingrese correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      const usuarioCompleto: UsuarioSistema = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol as RolUsuario,
        empresa_id: user.empresa_id || null,
        area_responsable: user.area_responsable || ROL_AREAS[user.rol] || 'Área Operativa',
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
      setErrorMsg(err.response?.data?.error || 'Error de conexión con el servidor. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-slate-950/90 to-slate-950 -z-10" />

      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem] -z-10" />

      <div className="w-full max-w-md my-auto">
        {/* Encabezado Institucional */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-4 ring-4 ring-blue-500/10">
            <HardHat className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white flex items-center justify-center gap-2">
            VALETEC <span className="text-blue-500 font-bold text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/60">Mina</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            Sistema Integral de Acreditación, Control de Accesos y RRHH
          </p>
        </div>

        {/* Tarjeta de Autenticación Principal */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingrese con sus credenciales corporativas autorizadas.
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
                  Has alcanzado el límite de <strong>3 intentos fallidos</strong>. Por protocolos de seguridad minera, tu cuenta ha sido suspendida.
                </p>
              </div>
              <div className="bg-slate-950/90 rounded-xl p-3 text-xs border border-rose-900/50 text-slate-300">
                <p className="font-bold text-rose-300 mb-1">Para reactivar su acceso:</p>
                <p className="text-slate-400 text-[11px] mb-1.5">Contacte a la Superintendencia de Sistemas / RRHH:</p>
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
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white shadow-blue-600/20 active:scale-[0.99]'
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

          {/* Badges de Seguridad Institucional */}
          <div className="mt-7 pt-5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                D.S. 024-2016-EM
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Control RBAC
              </span>
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                JWT Seguro
              </span>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Acceso restringido. Las actividades en esta plataforma son registradas y auditadas conforme a ley.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} VALETEC • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};
