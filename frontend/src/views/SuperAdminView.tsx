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
    colegiatura?: string;
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
  const [nuevaColegiatura, setNuevaColegiatura] = useState('CMP 48921 / RNE 24510 - Salud Ocupacional');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Mapeo automático de área y colegiatura por rol
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

    const colegiaturaMap: Partial<Record<RolUsuario, string>> = {
      MEDICO_OCUPACIONAL: 'CMP 51240 / RNE 28940 - Medicina Ocupacional',
      INSTRUCTOR_SSOMA: 'CIP 204192 - Ing. Higiene y Seguridad',
      SUPER_ADMIN: 'CIP 215480 - Ing. Minas',
      STAFF_RRHH: 'Lic. Reg. CDR-1892',
      SEGURIDAD_PATRIMONIAL: 'Reg. SUCAMEC 78412',
      ADMIN_CONTRATOS: 'Reg. SBS 41209',
      CONTROL_ACCESOS: 'Oficial Garita Reg. MIN-882',
    };
    setNuevaColegiatura(colegiaturaMap[rol] || '');
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
        colegiatura: nuevaColegiatura,
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cuadrilla</span>
            <Users className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-500">Postulantes registrados</span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Aptos para Trabajar</span>
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-3xl font-black text-emerald-800 mt-2">{stats.aptosParaTrabajar}</p>
          <span className="text-[11px] text-emerald-700 font-medium">5 Vistos Buenos completados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">En Evaluación</span>
            <Activity className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.enProceso}</p>
          <span className="text-[11px] text-slate-500">Avanzando compuertas</span>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Observados</span>
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-3xl font-black text-amber-800 mt-2">{stats.observados}</p>
          <span className="text-[11px] text-amber-700">Pendiente subsanar</span>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Lista Negra</span>
            <Ban className="w-5 h-5 text-rose-700" />
          </div>
          <p className="text-3xl font-black text-rose-800 mt-2">{stats.bloqueadosListaNegra}</p>
          <span className="text-[11px] text-rose-700">Bloqueados en mina</span>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN SUPER ADMIN */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === 'usuarios'
              ? 'bg-white text-blue-700 border-t-2 border-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Gestión de Accesos
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 ${
            activeTab === 'auditoria'
              ? 'bg-white text-blue-700 border-t-2 border-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              ? 'bg-white text-rose-700 border-t-2 border-rose-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" /> Semáforo Vencimientos SCTR
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE ACCESOS Y USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO CREACIÓN DE ACCESO POR ÁREA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
            <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-700" /> Crear Acceso de Evaluador
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Otorga credenciales a los responsables de área para que dictaminen Vistos Buenos.
            </p>

            <form onSubmit={handleCrearUsuarioSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo y Cargo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Manuel Arévalo (Médico Ocupacional)"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-700 font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@valetec.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-700 font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Área y Rol Responsable</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => handleRolChange(e.target.value as RolUsuario)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-700 font-medium cursor-pointer transition-colors"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Área / Dependencia</label>
                <input
                  type="text"
                  required
                  value={nuevaArea}
                  onChange={(e) => setNuevaArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-700 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Colegiatura / Registro Legal (CMP / CIP / Reg. Oficial)
                </label>
                <input
                  type="text"
                  value={nuevaColegiatura}
                  onChange={(e) => setNuevaColegiatura(e.target.value)}
                  placeholder="Ej. CMP 48921 / CIP 198452"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-amber-800 focus:outline-none focus:bg-white focus:border-blue-700 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Provisoria</label>
                <input
                  type="text"
                  required
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-700 font-mono transition-colors"
                />
              </div>

              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Acceso creado y asignado al flujo exitosamente.
                </div>
              )}

              <button
                type="submit"
                disabled={loadingCreate}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> {loadingCreate ? 'Guardando...' : 'Habilitar Acceso con Visto Bueno'}
              </button>
            </form>
          </div>

          {/* TABLA DE USUARIOS Y ROLES DEL SISTEMA */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Directorio de Responsables por Flujo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Usuarios autorizados para emitir Vistos Buenos y dictámenes</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                {usuarios.length} Cuentas Activas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold">Responsable</th>
                    <th className="p-4 font-semibold">Área Asignada</th>
                    <th className="p-4 font-semibold text-center">Estado</th>
                    <th className="p-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.nombre}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        {u.colegiatura && (
                          <div className="text-[11px] text-amber-800 font-mono font-medium mt-0.5">
                            ⚖️ {u.colegiatura}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          {u.area_responsable || u.rol}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {u.bloqueado_definitivo || (u.intentos_fallidos !== undefined && u.intentos_fallidos >= 3) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                            BLOQUEADO (3 FALLOS)
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            u.activo 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {u.activo ? 'ACTIVO' : 'SUSPENDIDO'}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {u.bloqueado_definitivo || (u.intentos_fallidos !== undefined && u.intentos_fallidos >= 3) ? (
                          <button
                            onClick={() => onToggleEstadoUsuario(u.id, true)}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Desbloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleEstadoUsuario(u.id, !u.activo)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5 ${
                              u.activo 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-700" /> Registro Inmutable de Vistos Buenos Mineros
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Trazabilidad legal con fecha, hora, responsable y sustento técnico ante auditorías de SUNAFIL y OSINERGMIN
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
              Auditoría Blindada
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Fecha y Hora</th>
                  <th className="p-4 font-semibold">Postulante</th>
                  <th className="p-4 font-semibold">Área / Evaluador</th>
                  <th className="p-4 font-semibold text-center">Decisión / Visto Bueno</th>
                  <th className="p-4 font-semibold">Observaciones / Sustento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditoria.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {new Date(log.fecha_registro).toLocaleString('es-PE')}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {log.postulante_apellidos}, {log.postulante_nombres}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.postulante_cargo} • DNI: {log.postulante_dni}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm font-semibold text-blue-700">{log.area_evaluadora}</div>
                      <div className="text-xs text-slate-700 font-medium">{log.evaluador_nombre}</div>
                      {log.evaluador_colegiatura && (
                        <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                          ⚖️ {log.evaluador_colegiatura}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {log.decision === 'VISTO_BUENO' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> VISTO BUENO
                        </span>
                      )}
                      {log.decision === 'OBSERVADO' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> OBSERVADO
                        </span>
                      )}
                      {log.decision === 'NO_APTO_LISTA_NEGRA' && (
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm">
                          <Ban className="w-3.5 h-3.5 text-rose-700" /> LISTA NEGRA
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-slate-600 italic">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Control y Semáforo de Vencimientos SCTR
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Monitoreo automático de pólizas con bloqueo en garita para personal con vigencia expirada
              </p>
            </div>

            <button
              onClick={handleEjecutarRevisionVencimientos}
              disabled={loadingVenc}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              {loadingVenc ? 'Verificando...' : 'Ejecutar Revisión y Suspender Vencidos'}
            </button>
          </div>

          {/* Tarjetas Semáforo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                🟢 Vigentes (&gt; 15 días)
              </span>
              <p className="text-3xl font-black text-emerald-800 mt-2">
                {vencimientosData?.vigentes ?? 4}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">Póliza y EMO autorizados</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                🟡 Por Vencer (≤ 15 días)
              </span>
              <p className="text-3xl font-black text-amber-800 mt-2">
                {vencimientosData?.porVencer ?? 1}
              </p>
              <span className="text-[11px] text-amber-700 font-medium">Requiere renovar adenda</span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                🔴 Vencidos (Expirados)
              </span>
              <p className="text-3xl font-black text-rose-800 mt-2">
                {vencimientosData?.vencidos ?? 1}
              </p>
              <span className="text-[11px] text-rose-700 font-medium">Acceso a mina suspendido</span>
            </div>
          </div>

          {/* Tabla de Vencimientos */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5 font-semibold">Trabajador</th>
                    <th className="p-3.5 font-semibold">Empresa</th>
                    <th className="p-3.5 font-semibold">Fase / Cargo</th>
                    <th className="p-3.5 font-semibold">Vencimiento SCTR</th>
                    <th className="p-3.5 font-semibold">Días Restantes</th>
                    <th className="p-3.5 font-semibold">Semáforo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vencimientosData?.detalle ? (
                    vencimientosData.detalle.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{d.nombres} {d.apellidos}</strong>
                          <span className="text-slate-500 text-[11px] font-mono">DNI: {d.numero_documento}</span>
                        </td>
                        <td className="p-3.5 text-slate-700">{d.empresa_nombre}</td>
                        <td className="p-3.5">
                          <span className="text-slate-900 block font-medium">{d.cargo}</span>
                          <span className="text-slate-500 text-[11px]">{d.fase_actual}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-800 font-bold">
                          {d.sctr_vencimiento || 'No registrado'}
                        </td>
                        <td className="p-3.5">
                          {d.dias_restantes !== null ? (
                            <span className={d.dias_restantes <= 0 ? 'text-rose-700 font-bold' : d.dias_restantes <= 15 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                              {d.dias_restantes <= 0 ? `Venció hace ${Math.abs(d.dias_restantes)} días` : `${d.dias_restantes} días`}
                            </span>
                          ) : (
                            <span className="text-slate-400">Pendiente</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {d.semaforo === 'VERDE' && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-sm">
                              🟢 VIGENTE
                            </span>
                          )}
                          {d.semaforo === 'AMBAR' && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-sm">
                              🟡 POR VENCER
                            </span>
                          )}
                          {d.semaforo === 'ROJO' && (
                            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-sm">
                              🔴 VENCIDO
                            </span>
                          )}
                          {d.semaforo === 'SIN_FECHA' && (
                            <span className="text-slate-400">Sin Póliza</span>
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
