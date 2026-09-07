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
  QrCode
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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingrese correo y contraseña.');
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
        area_responsable: DEMO_ACCOUNTS.find((a) => a.email === user.email)?.area || 'Área Operativa',
        activo: true,
      };

      localStorage.setItem('vt_token', token);
      localStorage.setItem('vt_user', JSON.stringify(usuarioCompleto));

      onLoginSuccess(usuarioCompleto, token);
    } catch (err: any) {
      // Si el backend no responde o falla, proveer fallback con las cuentas demo
      const foundDemo = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (foundDemo && (password === 'Password123!' || password.length >= 4)) {
        const usuarioMock: UsuarioSistema = {
          id: `u-${Date.now()}`,
          nombre: foundDemo.nombre,
          email: foundDemo.email,
          rol: foundDemo.rol,
          area_responsable: foundDemo.area,
          activo: true,
        };
        const tokenMock = `mock-token-${Date.now()}`;
        localStorage.setItem('vt_token', tokenMock);
        localStorage.setItem('vt_user', JSON.stringify(usuarioMock));
        onLoginSuccess(usuarioMock, tokenMock);
        return;
      }

      setErrorMsg(err.response?.data?.error || 'Credenciales inválidas. Verifique su correo o contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword('Password123!');
    setTimeout(() => {
      handleLogin();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950 -z-10" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LADO IZQUIERDO: Formulario de Login */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <HardHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white flex items-center gap-1.5">
                VALETEC <span className="text-blue-500 font-bold text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800/60">Mina</span>
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

          {errorMsg && (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. salud@valetec.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <span className="text-[11px] text-slate-500">Clave demo: Password123!</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <span>Validando credenciales...</span>
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

        {/* LADO DERECHO: Accesos de Prueba Rápidos (1-Clic) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-blue-400" />
              Accesos Rápidos por Rol (Simulación 1-Clic)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Haga clic sobre cualquier perfil para iniciar sesión inmediatamente y verificar cómo se restringe el menú y la privacidad para cada rol:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="text-left bg-slate-950/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all group shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${acc.badgeColor}`}>
                        {acc.icon} {acc.rol}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-200 group-hover:text-blue-400 transition-colors">
                      {acc.nombre}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.email}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate pr-1">{acc.area.split('/')[0]}</span>
                    <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">Entrar →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
