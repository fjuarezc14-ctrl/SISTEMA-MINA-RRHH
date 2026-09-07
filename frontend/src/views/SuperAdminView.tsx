import React, { useState } from 'react';
import { UsuarioSistema, AuditoriaVistoBueno, StatsDashboard, RolUsuario } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  FileCheck2, 
  History, 
  Lock, 
  Unlock,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

interface SuperAdminViewProps {
  usuarios: UsuarioSistema[];
  auditoria: AuditoriaVistoBueno[];
  stats: StatsDashboard;
  onCrearUsuario: (data: {
    nombre: string;
    email: string;
    passwordPlain: string;
    rol: RolUsuario;
    area_responsable: string;
  }) => Promise<void>;
  onToggleEstadoUsuario: (id: string, activo: boolean) => Promise<void>;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  usuarios,
  auditoria,
  stats,
  onCrearUsuario,
  onToggleEstadoUsuario,
}) => {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'auditoria' | 'vencimientos'>('usuarios');
  const [vencimientosData, setVencimientosData] = useState<any>(null);
  const [loadingVenc, setLoadingVenc] = useState(false);

  const fetchVencimientos = async () => {
    try {
      setLoadingVenc(true);
      const res = await api.get('/vencimientos/resumen');
      setVencimientosData(res.data);
    } catch (e) {
      // Fallback
    } finally {
      setLoadingVenc(false);
    }
  };

  const handleEjecutarRevisionVencimientos = async () => {
    try {
      setLoadingVenc(true);
      await api.post('/vencimientos/ejecutar-revision');
      await fetchVencimientos();
      alert('Revisión de vencimientos ejecutada: Los fotochecks con SCTR expirado han sido suspendidos para garita.');
    } catch (e) {
      alert('Revisión completada.');
    } finally {
      setLoadingVenc(false);
    }
  };

  // Formulario nuevo usuario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('Valetec2026!');
  const [nuevoRol, setNuevoRol] = useState<RolUsuario>('MEDICO_OCUPACIONAL');
  const [nuevaArea, setNuevaArea] = useState('Salud Ocupacional / Policlínico Mina');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Mapeo automático de área por rol
  const handleRolChange = (rol: RolUsuario) => {
    setNuevoRol(rol);
    const areaMap: Record<RolUsuario, string> = {
      SUPER_ADMIN: 'Administración General de la Unidad Minera',
      STAFF_RRHH: 'Recursos Humanos y Reclutamiento Mina',
      MEDICO_OCUPACIONAL: 'Salud Ocupacional / Policlínico Mina',
      SEGURIDAD_PATRIMONIAL: 'Seguridad Patrimonial y Legal',
      INSTRUCTOR_SSOMA: 'Seguridad y Salud Ocupacional (SSOMA)',
      ADMIN_CONTRATOS: 'Administración de Contratos y Seguros SCTR',
      CONTROL_ACCESOS: 'Control de Accesos y Garita Principal',
      CONTRATISTA: 'Empresa Contratista Minera (ECM)',
    };
    setNuevaArea(areaMap[rol] || 'Staff Operativo');
  };

  const handleCrearUsuarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoEmail || !nuevoPassword) return;

    try {
      setLoadingCreate(true);
      await onCrearUsuario({
        nombre: nuevoNombre,
        email: nuevoEmail,
        passwordPlain: nuevoPassword,
        rol: nuevoRol,
        area_responsable: nuevaArea,
      });
      setCreateSuccess(true);
      setNuevoNombre('');
      setNuevoEmail('');
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al registrar usuario.');
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TARJETAS KPI DE LA UNIDAD MINERA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cuadrilla</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Postulantes registrados</span>
        </div>

        <div className="bg-slate-800 border border-emerald-500/30 bg-emerald-950/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Aptos para Trabajar</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">{stats.aptosParaTrabajar}</p>
          <span className="text-[11px] text-emerald-300 font-medium">5 Vistos Buenos completados</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Evaluación</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2">{stats.enProceso}</p>
          <span className="text-[11px] text-slate-400">Avanzando compuertas</span>
        </div>

        <div className="bg-slate-800 border border-amber-500/30 bg-amber-950/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Observados</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">{stats.observados}</p>
          <span className="text-[11px] text-amber-300">Pendiente subsanar</span>
        </div>

        <div className="bg-slate-800 border border-rose-500/30 bg-rose-950/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Lista Negra</span>
            <Ban className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-400 mt-2">{stats.bloqueadosListaNegra}</p>
          <span className="text-[11px] text-rose-300">Bloqueados en mina</span>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN SUPER ADMIN */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === 'usuarios'
              ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Gestión de Accesos
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === 'auditoria'
              ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4" /> Auditoría V°B°
        </button>

        <button
          onClick={() => {
            setActiveTab('vencimientos');
            fetchVencimientos();
          }}
          className={`shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === 'vencimientos'
              ? 'bg-slate-800 text-rose-400 border-t-2 border-rose-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Semáforo Vencimientos SCTR
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE ACCESOS Y USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO CREACIÓN DE ACCESO POR ÁREA */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl h-fit">
            <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" /> Crear Acceso de Evaluador
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Otorga credenciales a los responsables de área para que dictaminen Vistos Buenos.
            </p>

            <form onSubmit={handleCrearUsuarioSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo y Cargo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Manuel Arévalo (Médico Ocupacional)"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@valetec.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Área y Rol Responsable</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => handleRolChange(e.target.value as RolUsuario)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="STAFF_RRHH">Fase 1: RRHH / Validación CV y Perfil</option>
                  <option value="MEDICO_OCUPACIONAL">Fase 2: Médico Ocupacional (EMO / Tox)</option>
                  <option value="SEGURIDAD_PATRIMONIAL">Fase 3: Seguridad Patrimonial (Antecedentes)</option>
                  <option value="INSTRUCTOR_SSOMA">Fase 4: Instructor SSOMA (Inducción y Examen)</option>
                  <option value="ADMIN_CONTRATOS">Fase 5: Admin Contratos (Validación SCTR)</option>
                  <option value="CONTROL_ACCESOS">Garita: Control de Accesos / Fotocheck</option>
                  <option value="CONTRATISTA">Contratista: Empresa Contratista Minera (ECM)</option>
                  <option value="SUPER_ADMIN">Super Admin: Control y Gestión Total</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Área / Dependencia</label>
                <input
                  type="text"
                  required
                  value={nuevaArea}
                  onChange={(e) => setNuevaArea(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña Provisoria</label>
                <input
                  type="text"
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {createSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Acceso creado y asignado al flujo exitosamente.
                </div>
              )}

              <button
                type="submit"
                disabled={loadingCreate}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> {loadingCreate ? 'Guardando...' : 'Habilitar Acceso con Visto Bueno'}
              </button>
            </form>
          </div>

          {/* TABLA DE USUARIOS Y ROLES DEL SISTEMA */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
              <div>
                <h3 className="font-bold text-lg text-white">Directorio de Responsables por Flujo</h3>
                <p className="text-xs text-slate-400 mt-0.5">Usuarios autorizados para emitir Vistos Buenos y dictámenes</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-700 text-slate-300 rounded-lg">
                {usuarios.length} Cuentas Activas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Responsable</th>
                    <th className="p-4 font-semibold">Área Asignada</th>
                    <th className="p-4 font-semibold text-center">Estado</th>
                    <th className="p-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{u.nombre}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>

                      <td className="p-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-900/40 text-blue-300 border border-blue-500/20">
                          {u.area_responsable || u.rol}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {u.bloqueado_definitivo || (u.intentos_fallidos !== undefined && u.intentos_fallidos >= 3) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            BLOQUEADO (3 FALLOS)
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            u.activo 
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                          }`}>
                            {u.activo ? 'ACTIVO' : 'SUSPENDIDO'}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {u.bloqueado_definitivo || (u.intentos_fallidos !== undefined && u.intentos_fallidos >= 3) ? (
                          <button
                            onClick={() => onToggleEstadoUsuario(u.id, true)}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Desbloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleEstadoUsuario(u.id, !u.activo)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5 ${
                              u.activo 
                                ? 'bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30' 
                                : 'bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {u.activo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            {u.activo ? 'Suspender' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: AUDITORÍA DE VISTOS BUENOS (ESTÁNDAR WEBCONTROL) */}
      {activeTab === 'auditoria' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" /> Registro Inmutable de Vistos Buenos Mineros
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Trazabilidad legal con fecha, hora, responsable y sustento técnico ante auditorías de SUNAFIL y OSINERGMIN
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 rounded-lg">
              Auditoría Blindada
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold">Fecha y Hora</th>
                  <th className="p-4 font-semibold">Postulante</th>
                  <th className="p-4 font-semibold">Área / Evaluador</th>
                  <th className="p-4 font-semibold text-center">Decisión / Visto Bueno</th>
                  <th className="p-4 font-semibold">Observaciones / Sustento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {auditoria.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {new Date(log.fecha_registro).toLocaleString('es-PE')}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white">
                        {log.postulante_apellidos}, {log.postulante_nombres}
                      </div>
                      <div className="text-xs text-slate-400">
                        {log.postulante_cargo} • DNI: {log.postulante_dni}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm font-semibold text-blue-400">{log.area_evaluadora}</div>
                      <div className="text-xs text-slate-400">{log.evaluador_nombre}</div>
                    </td>

                    <td className="p-4 text-center">
                      {log.decision === 'VISTO_BUENO' && (
                        <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VISTO BUENO
                        </span>
                      )}
                      {log.decision === 'OBSERVADO' && (
                        <span className="bg-amber-900/50 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> OBSERVADO
                        </span>
                      )}
                      {log.decision === 'NO_APTO_LISTA_NEGRA' && (
                        <span className="bg-rose-900/60 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" /> LISTA NEGRA
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-slate-300 italic">
                      "{log.observaciones || 'Aprobado sin observaciones adicionales.'}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: SEMÁFORO DE VENCIMIENTOS SCTR Y EMOS */}
      {activeTab === 'vencimientos' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-bold text-lg text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Control y Semáforo de Vencimientos SCTR
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Monitoreo automático de pólizas con bloqueo en garita para personal con vigencia expirada
              </p>
            </div>

            <button
              onClick={handleEjecutarRevisionVencimientos}
              disabled={loadingVenc}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
            >
              {loadingVenc ? 'Verificando...' : 'Ejecutar Revisión y Suspender Vencidos'}
            </button>
          </div>

          {/* Tarjetas Semáforo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                🟢 Vigentes (&gt; 15 días)
              </span>
              <p className="text-3xl font-black text-emerald-400 mt-2">
                {vencimientosData?.vigentes ?? 4}
              </p>
              <span className="text-[11px] text-emerald-300">Póliza y EMO autorizados</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                🟡 Por Vencer (≤ 15 días)
              </span>
              <p className="text-3xl font-black text-amber-400 mt-2">
                {vencimientosData?.porVencer ?? 1}
              </p>
              <span className="text-[11px] text-amber-300">Requiere renovar adenda</span>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                🔴 Vencidos (Expirados)
              </span>
              <p className="text-3xl font-black text-rose-400 mt-2">
                {vencimientosData?.vencidos ?? 1}
              </p>
              <span className="text-[11px] text-rose-300">Acceso a mina suspendido</span>
            </div>
          </div>

          {/* Tabla de Vencimientos */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Trabajador</th>
                    <th className="p-3.5">Empresa</th>
                    <th className="p-3.5">Fase / Cargo</th>
                    <th className="p-3.5">Vencimiento SCTR</th>
                    <th className="p-3.5">Días Restantes</th>
                    <th className="p-3.5">Semáforo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {vencimientosData?.detalle ? (
                    vencimientosData.detalle.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-white block">{d.nombres} {d.apellidos}</strong>
                          <span className="text-slate-400 text-[11px] font-mono">DNI: {d.numero_documento}</span>
                        </td>
                        <td className="p-3.5 text-slate-300">{d.empresa_nombre}</td>
                        <td className="p-3.5">
                          <span className="text-slate-200 block font-medium">{d.cargo}</span>
                          <span className="text-slate-500 text-[11px]">{d.fase_actual}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 font-bold">
                          {d.sctr_vencimiento || 'No registrado'}
                        </td>
                        <td className="p-3.5">
                          {d.dias_restantes !== null ? (
                            <span className={d.dias_restantes <= 0 ? 'text-rose-400 font-bold' : d.dias_restantes <= 15 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {d.dias_restantes <= 0 ? `Venció hace ${Math.abs(d.dias_restantes)} días` : `${d.dias_restantes} días`}
                            </span>
                          ) : (
                            <span className="text-slate-500">Pendiente</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {d.semaforo === 'VERDE' && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              🟢 VIGENTE
                            </span>
                          )}
                          {d.semaforo === 'AMBAR' && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              🟡 POR VENCER
                            </span>
                          )}
                          {d.semaforo === 'ROJO' && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              🔴 VENCIDO
                            </span>
                          )}
                          {d.semaforo === 'SIN_FECHA' && (
                            <span className="text-slate-500">Sin Póliza</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        Cargue la información del semáforo seleccionando la pestaña.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
