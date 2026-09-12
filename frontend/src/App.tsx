import React, { useState, useEffect } from 'react';
import { Sidebar, ViewType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SuperAdminView } from './views/SuperAdminView';
import { PortalContratista } from './views/PortalContratista';
import { Fase1CV } from './views/Fase1CV';
import { Fase2Salud } from './views/Fase2Salud';
import { Fase3Antecedentes } from './views/Fase3Antecedentes';
import { Fase4Capacitacion } from './views/Fase4Capacitacion';
import { Fase5SCTR } from './views/Fase5SCTR';
import { FotocheckView } from './views/FotocheckView';
import { GaritaScannerView } from './views/GaritaScannerView';
import { VehiculosView } from './views/VehiculosView';
import { SlaMetricsView } from './views/SlaMetricsView';
import { LoginView } from './views/LoginView';
import { 
  Postulante, 
  Fotocheck, 
  UsuarioSistema, 
  AuditoriaVistoBueno, 
  StatsDashboard, 
  RolUsuario, 
  VehiculoMaquinaria, 
  Notificacion 
} from './types';
import { api } from './services/api';

// Usuarios semilla del sistema por área
const INITIAL_USUARIOS: UsuarioSistema[] = [
  {
    id: 'u1',
    nombre: 'Ing. Yerson (Super Admin)',
    email: 'admin@valetec.com',
    rol: 'SUPER_ADMIN',
    area_responsable: 'Superintendencia de Operaciones y RRHH Mina',
    activo: true,
  },
  {
    id: 'u2',
    nombre: 'Lic. Valenzuela (RRHH)',
    email: 'rrhh@valetec.com',
    rol: 'STAFF_RRHH',
    area_responsable: 'Recursos Humanos / Reclutamiento Mina',
    activo: true,
  },
  {
    id: 'u3',
    nombre: 'Dr. Arévalo (Médico CMP 45123)',
    email: 'salud@valetec.com',
    rol: 'MEDICO_OCUPACIONAL',
    area_responsable: 'Salud Ocupacional / Policlínico Mina',
    activo: true,
  },
  {
    id: 'u4',
    nombre: 'Cmdte. Rivas (Seguridad Patrimonial)',
    email: 'seguridad@valetec.com',
    rol: 'SEGURIDAD_PATRIMONIAL',
    area_responsable: 'Seguridad Patrimonial y Asesoría Legal',
    activo: true,
  },
  {
    id: 'u5',
    nombre: 'Ing. Torres (Instructor SSOMA)',
    email: 'capacitacion@valetec.com',
    rol: 'INSTRUCTOR_SSOMA',
    area_responsable: 'Seguridad y Salud Ocupacional (SSOMA)',
    activo: true,
  },
  {
    id: 'u6',
    nombre: 'Dra. Silva (Admin Contratos/SCTR)',
    email: 'seguros@valetec.com',
    rol: 'ADMIN_CONTRATOS',
    area_responsable: 'Administración de Contratos y Pólizas SCTR',
    activo: true,
  },
  {
    id: 'u7',
    nombre: 'Oficial Huamán (Garita Principal)',
    email: 'accesos@valetec.com',
    rol: 'CONTROL_ACCESOS',
    area_responsable: 'Control de Accesos y Emisión Fotochecks',
    activo: true,
  },
  {
    id: 'u8',
    nombre: 'Carlos Mendoza (Contratista)',
    email: 'contratista@serviciosxyz.com',
    rol: 'CONTRATISTA',
    area_responsable: 'Servicios Mineros XYZ S.A.C.',
    activo: true,
  },
];

// Bitácora inicial de Vistos Buenos
const INITIAL_AUDITORIA: AuditoriaVistoBueno[] = [
  {
    id: 'a1',
    postulante_id: 'c6',
    postulante_nombres: 'Ana',
    postulante_apellidos: 'Mendoza Quispe',
    postulante_dni: '46998877',
    postulante_cargo: 'Ingeniera Geomecánica',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    fase: 'FASE_5',
    area_evaluadora: 'Administración de Contratos y Seguros',
    evaluador_nombre: 'Dra. Silva (Admin Contratos/SCTR)',
    decision: 'VISTO_BUENO',
    observaciones: 'Póliza SCTR Salud y Pensión validada al 100%. Pasa a APTO PARA TRABAJAR.',
    fecha_registro: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'a2',
    postulante_id: 'c6',
    postulante_nombres: 'Ana',
    postulante_apellidos: 'Mendoza Quispe',
    postulante_dni: '46998877',
    postulante_cargo: 'Ingeniera Geomecánica',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    fase: 'FASE_4',
    area_evaluadora: 'Seguridad y Salud Ocupacional (SSOMA)',
    evaluador_nombre: 'Ing. Torres (Instructor SSOMA)',
    decision: 'VISTO_BUENO',
    observaciones: 'Aprobó inducción minera con nota destacada 19/20.',
    fecha_registro: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'a3',
    postulante_id: 'c5',
    postulante_nombres: 'Luis',
    postulante_apellidos: 'García Paredes',
    postulante_dni: '43112233',
    postulante_cargo: 'Chofer Volquete',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    fase: 'FASE_5',
    area_evaluadora: 'Administración de Contratos y Seguros',
    evaluador_nombre: 'Dra. Silva (Admin Contratos/SCTR)',
    decision: 'OBSERVADO',
    observaciones: 'El SCTR subido está vencido. Requiere adjuntar constancia vigente.',
    fecha_registro: new Date(Date.now() - 10800000).toISOString(),
  },
];

// Postulantes con el estado "APTO_PARA_TRABAJAR" implementado
const MOCK_POSTULANTES: Postulante[] = [
  {
    id: 'c1111111-0000-0000-0000-000000000001',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '45891234',
    nombres: 'Roberto',
    apellidos: 'Díaz Alvarado',
    cargo: 'Soldador 3G/4G',
    fase_actual: 'FASE_1',
    estado_global: 'EN_PROCESO',
  },
  {
    id: 'c2222222-0000-0000-0000-000000000002',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '70123456',
    nombres: 'Martín',
    apellidos: 'Gómez Ruiz',
    cargo: 'Operador de Scoop',
    fase_actual: 'FASE_2',
    estado_global: 'EN_PROCESO',
  },
  {
    id: 'c3333333-0000-0000-0000-000000000003',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '42189012',
    nombres: 'Juan',
    apellidos: 'Pérez Sánchez',
    cargo: 'Técnico Mecánico Mina',
    fase_actual: 'FASE_4',
    estado_global: 'EN_PROCESO',
  },
  {
    id: 'c4444444-0000-0000-0000-000000000004',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '47890123',
    nombres: 'Miguel',
    apellidos: 'Salas Flores',
    cargo: 'Electricista de Mina',
    fase_actual: 'FASE_4',
    estado_global: 'EN_PROCESO',
  },
  {
    id: 'c5555555-0000-0000-0000-000000000005',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '43112233',
    nombres: 'Luis',
    apellidos: 'García Paredes',
    cargo: 'Chofer de Volquete',
    fase_actual: 'FASE_5',
    estado_global: 'OBSERVADO',
    ultima_observacion: 'El SCTR subido está vencido. Requiere adjuntar póliza vigente.',
  },
  {
    id: 'c6666666-0000-0000-0000-000000000006',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '46998877',
    nombres: 'Ana',
    apellidos: 'Mendoza Quispe',
    cargo: 'Ingeniera Geomecánica',
    grupo_sanguineo: 'O+',
    fase_actual: 'FOTOCHECK',
    estado_global: 'APTO_PARA_TRABAJAR',
    sctr_vencimiento: '2026-10-05',
  },
];

const INITIAL_VEHICULOS: VehiculoMaquinaria[] = [
  {
    id: 'e1111111-0000-0000-0000-000000000001',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    placa_codigo: 'V8X-921',
    tipo_vehiculo: 'CAMIONETA_4X4',
    marca: 'Toyota',
    modelo: 'Hilux 4x4 SRV',
    anio_fabricacion: 2024,
    color: 'Blanco',
    soat_vencimiento: '2026-12-31',
    rev_tecnica_vencimiento: '2026-12-31',
    poliza_trec_vencimiento: '2026-11-30',
    estado_acreditacion: 'APTO_TRANSITO_MINA',
    codigo_pase_qr: 'PASE-VEH-V8X921',
  },
  {
    id: 'e2222222-0000-0000-0000-000000000002',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    placa_codigo: 'W3C-810',
    tipo_vehiculo: 'VOLQUETE',
    marca: 'Volvo',
    modelo: 'FMX 8x4 480HP',
    anio_fabricacion: 2023,
    color: 'Amarillo Oruga',
    soat_vencimiento: '2026-10-15',
    rev_tecnica_vencimiento: '2026-11-20',
    poliza_trec_vencimiento: '2026-10-30',
    estado_acreditacion: 'APTO_TRANSITO_MINA',
    codigo_pase_qr: 'PASE-VEH-W3C810',
  },
  {
    id: 'e3333333-0000-0000-0000-000000000003',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    placa_codigo: 'T9K-442',
    tipo_vehiculo: 'CISTERNA_COMBUSTIBLE',
    marca: 'Mercedes-Benz',
    modelo: 'Actros 3344',
    anio_fabricacion: 2022,
    color: 'Rojo / Blanco',
    soat_vencimiento: '2026-09-01',
    rev_tecnica_vencimiento: '2026-08-15',
    estado_acreditacion: 'OBSERVADO',
    codigo_pase_qr: 'PASE-VEH-T9K442',
    observaciones: 'Revisión técnica vencida. Requiere certificado vigente.',
  },
];

const INITIAL_NOTIFICACIONES: Notificacion[] = [
  {
    id: 'n1',
    titulo: 'Vencimiento Próximo de SCTR',
    mensaje: 'El postulante Roberto Díaz tiene póliza SCTR con vigencia menor a 15 días.',
    tipo: 'VENCIMIENTO_SCTR',
    leido: false,
    creado_en: new Date().toISOString(),
  },
  {
    id: 'n2',
    titulo: 'Postulante Acreditado',
    mensaje: 'Ana Mendoza Quispe completó 5/5 Vistos Buenos y cuenta con Fotocheck activo.',
    tipo: 'APROBADO',
    leido: false,
    creado_en: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n3',
    titulo: 'Expediente Observado en Fase 5',
    mensaje: 'Luis García Paredes fue observado por póliza SCTR vencida. Requiere subsanación.',
    tipo: 'OBSERVACION',
    leido: true,
    creado_en: new Date(Date.now() - 7200000).toISOString(),
  },
];

const getDefaultViewForRole = (rol: RolUsuario): ViewType => {
  switch (rol) {
    case 'SUPER_ADMIN':
      return 'admin';
    case 'CONTRATISTA':
      return 'contratista';
    case 'STAFF_RRHH':
      return 'fase1';
    case 'MEDICO_OCUPACIONAL':
      return 'fase2';
    case 'SEGURIDAD_PATRIMONIAL':
      return 'fase3';
    case 'INSTRUCTOR_SSOMA':
      return 'fase4';
    case 'ADMIN_CONTRATOS':
      return 'fase5';
    case 'CONTROL_ACCESOS':
      return 'garita';
    default:
      return 'admin';
  }
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(() => {
    try {
      const savedUser = localStorage.getItem('vt_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const savedUser = localStorage.getItem('vt_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return getDefaultViewForRole(u.rol);
      } catch {}
    }
    return 'admin';
  });

  const [postulantes, setPostulantes] = useState<Postulante[]>(MOCK_POSTULANTES);
  const [fotochecks] = useState<Fotocheck[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(INITIAL_USUARIOS);
  const [auditoria, setAuditoria] = useState<AuditoriaVistoBueno[]>(INITIAL_AUDITORIA);
  const [vehiculos, setVehiculos] = useState<VehiculoMaquinaria[]>(INITIAL_VEHICULOS);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(INITIAL_NOTIFICACIONES);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLoginSuccess = (usuario: UsuarioSistema, _token: string) => {
    setCurrentUser(usuario);
    setCurrentView(getDefaultViewForRole(usuario.rol));
  };

  const handleLogout = () => {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    const onSessionExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('vt_session_expired', onSessionExpired);
    return () => window.removeEventListener('vt_session_expired', onSessionExpired);
  }, []);

  // Estadísticas calculadas dinámicamente
  const stats: StatsDashboard = {
    total: postulantes.length,
    aptosParaTrabajar: postulantes.filter((p) => p.estado_global === 'APTO_PARA_TRABAJAR').length,
    observados: postulantes.filter((p) => p.estado_global === 'OBSERVADO').length,
    enProceso: postulantes.filter((p) => p.estado_global === 'EN_PROCESO').length,
    bloqueadosListaNegra: postulantes.filter((p) => p.estado_global === 'NO_APTO').length,
  };

  useEffect(() => {
    const token = localStorage.getItem('vt_token');
    if (!currentUser || !token) return;

    const fetchFromBackend = async () => {
      try {
        const postulantesUrl = currentUser.rol === 'CONTRATISTA' && currentUser.empresa_id 
          ? `/postulantes?empresa_id=${currentUser.empresa_id}` 
          : '/postulantes';
        const vehiculosUrl = currentUser.rol === 'CONTRATISTA' && currentUser.empresa_id 
          ? `/vehiculos?empresa_id=${currentUser.empresa_id}` 
          : '/vehiculos';

        const promises: Promise<any>[] = [
          api.get(postulantesUrl),
          api.get(vehiculosUrl),
          api.get('/notificaciones'),
        ];
        if (currentUser.rol === 'SUPER_ADMIN') {
          promises.push(api.get('/admin/usuarios'));
        }

        const [postRes, vehRes, notifRes, usersRes] = await Promise.allSettled(promises);

        if (postRes?.status === 'fulfilled' && Array.isArray(postRes.value.data) && postRes.value.data.length > 0) {
          setPostulantes(postRes.value.data);
        }
        if (vehRes?.status === 'fulfilled' && Array.isArray(vehRes.value.data) && vehRes.value.data.length > 0) {
          setVehiculos(vehRes.value.data);
        }
        if (notifRes?.status === 'fulfilled' && Array.isArray(notifRes.value.data) && notifRes.value.data.length > 0) {
          setNotificaciones(notifRes.value.data);
        }
        if (usersRes?.status === 'fulfilled' && Array.isArray(usersRes.value.data) && usersRes.value.data.length > 0) {
          setUsuarios(usersRes.value.data);
        }
      } catch (e) {
        // Modo offline / preview
      }
    };
    fetchFromBackend();
  }, [currentUser]);

  // Crear nuevo acceso / usuario de área (Super Admin)
  const handleCrearUsuario = async (data: {
    nombre: string;
    email: string;
    passwordPlain: string;
    rol: RolUsuario;
    area_responsable: string;
    colegiatura?: string;
  }) => {
    try {
      const res = await api.post('/admin/usuarios', data);
      setUsuarios((prev) => [res.data, ...prev]);
    } catch (e) {
      // Fallback local
      const nuevo: UsuarioSistema = {
        id: `u-${Date.now()}`,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        area_responsable: data.area_responsable,
        colegiatura: data.colegiatura,
        activo: true,
      };
      setUsuarios((prev) => [nuevo, ...prev]);
    }
  };

  // Toggle estado y desbloqueo de usuario (Super Admin)
  const handleToggleEstadoUsuario = async (id: string, activo: boolean) => {
    try {
      if (activo) {
        await api.patch(`/admin/usuarios/${id}/desbloquear`);
      } else {
        await api.patch(`/admin/usuarios/${id}/estado`, { activo: false });
      }
    } catch (e) {
      // Local fallback
    }
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              activo,
              bloqueado_definitivo: activo ? false : u.bloqueado_definitivo,
              intentos_fallidos: activo ? 0 : u.intentos_fallidos,
            }
          : u
      )
    );
  };

  // Subsanar documento por el contratista
  const handleSubsanar = async (id: string, file: File, notas?: string) => {
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      if (notas) formData.append('notas', notas);
      await api.post(`/postulantes/${id}/subsanar`, formData);
    } catch (e) {
      // Fallback local
    }

    setPostulantes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado_global: 'EN_PROCESO', ultima_observacion: undefined }
          : p
      )
    );
  };

  // Evaluación y emisión de Visto Bueno por área
  const handleEvaluarFase = async (
    postulanteId: string,
    fase: string,
    decision: 'APROBAR' | 'OBSERVAR' | 'NO_APTO',
    detalles?: {
      observaciones?: string;
      nota?: number;
      fechaVencimiento?: string;
      file?: File;
      motivo?: string;
    }
  ) => {
    try {
      if (detalles?.file) {
        const formData = new FormData();
        formData.append('postulanteId', postulanteId);
        formData.append('decision', decision);
        if (detalles.observaciones) formData.append('observaciones', detalles.observaciones);
        if (detalles.nota !== undefined) formData.append('nota', detalles.nota.toString());
        if (detalles.fechaVencimiento) formData.append('fechaVencimiento', detalles.fechaVencimiento);
        if (detalles.motivo) formData.append('motivoListaNegra', detalles.motivo);
        formData.append('archivo', detalles.file);
        await api.post(`/fases/${fase}/evaluar`, formData);
      } else {
        await api.post(`/fases/${fase}/evaluar`, {
          postulanteId,
          decision,
          observaciones: detalles?.observaciones,
          nota: detalles?.nota,
          fechaVencimiento: detalles?.fechaVencimiento,
          motivoListaNegra: detalles?.motivo,
        });
      }
    } catch (err) {
      console.warn('Backend sync failed, continuing with local state update:', err);
    }

    const postulante = postulantes.find((p) => p.id === postulanteId);
    if (!postulante) return;

    const areaMap: Record<string, string> = {
      FASE_1: 'Recursos Humanos y Reclutamiento Mina',
      FASE_2: 'Salud Ocupacional / Médico de Mina',
      FASE_3: 'Seguridad Patrimonial y Legal',
      FASE_4: 'Seguridad y Salud Ocupacional (SSOMA)',
      FASE_5: 'Administración de Contratos y Seguros',
    };

    const evaluadorMap: Record<string, string> = {
      FASE_1: 'Lic. Valenzuela (RRHH)',
      FASE_2: 'Dr. Arévalo (Médico CMP 45123)',
      FASE_3: 'Cmdte. Rivas (Seguridad Patrimonial)',
      FASE_4: 'Ing. Torres (Instructor SSOMA)',
      FASE_5: 'Dra. Silva (Admin Contratos/SCTR)',
    };

    // Registrar en auditoría inmutable
    const nuevoLog: AuditoriaVistoBueno = {
      id: `aud-${Date.now()}`,
      postulante_id: postulanteId,
      postulante_nombres: postulante.nombres,
      postulante_apellidos: postulante.apellidos,
      postulante_dni: postulante.numero_documento,
      postulante_cargo: postulante.cargo,
      empresa_nombre: postulante.empresa_nombre || 'Servicios XYZ',
      fase,
      area_evaluadora: areaMap[fase] || 'Staff Mina',
      evaluador_nombre: evaluadorMap[fase] || 'Evaluador de Área',
      decision: decision === 'APROBAR' ? 'VISTO_BUENO' : decision === 'OBSERVAR' ? 'OBSERVADO' : 'NO_APTO_LISTA_NEGRA',
      observaciones: detalles?.motivo || detalles?.observaciones || (decision === 'APROBAR' ? 'Visto Bueno Otorgado.' : 'Observado.'),
      fecha_registro: new Date().toISOString(),
    };

    setAuditoria((prev) => [nuevoLog, ...prev]);

    setPostulantes((prev) =>
      prev.map((p) => {
        if (p.id !== postulanteId) return p;

        if (decision === 'NO_APTO') {
          return {
            ...p,
            estado_global: 'NO_APTO',
            ultima_observacion: detalles?.motivo || 'Dictaminado NO APTO (Lista Negra)',
          };
        }

        if (decision === 'OBSERVAR') {
          return {
            ...p,
            estado_global: 'OBSERVADO',
            ultima_observacion: detalles?.observaciones || 'Observado en ' + fase,
          };
        }

        // Caso APROBAR / VISTO BUENO
        const siguienteMap: Record<string, string> = {
          FASE_1: 'FASE_2',
          FASE_2: 'FASE_3',
          FASE_3: 'FASE_4',
          FASE_4: 'FASE_5',
          FASE_5: 'FOTOCHECK',
        };

        const prox = siguienteMap[fase] || 'FINALIZADO';
        const esAptoFinal = prox === 'FOTOCHECK';

        return {
          ...p,
          fase_actual: prox as any,
          estado_global: esAptoFinal ? 'APTO_PARA_TRABAJAR' : 'EN_PROCESO',
        };
      })
    );
  };

  const handleMarcarImpreso = async (postulanteId: string) => {
    try {
      await api.post(`/fotocheck/${postulanteId}/imprimir`);
    } catch (e) {
      // Local
    }
  };

  const handleRegistrarVehiculo = async (data: any) => {
    try {
      const res = await api.post('/vehiculos', data);
      setVehiculos((prev) => [res.data, ...prev]);
    } catch (e) {
      const nuevo: VehiculoMaquinaria = {
        id: `veh-${Date.now()}`,
        empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
        placa_codigo: data.placaCodigo,
        tipo_vehiculo: data.tipoVehiculo,
        marca: data.marca,
        modelo: data.modelo,
        anio_fabricacion: data.anioFabricacion,
        color: data.color,
        soat_vencimiento: data.soatVencimiento,
        rev_tecnica_vencimiento: data.revTecnicaVencimiento,
        poliza_trec_vencimiento: data.polizaTrecVencimiento,
        checklist_seguridad: data.checklistSeguridad,
        estado_acreditacion: 'EN_REVISION',
        codigo_pase_qr: `PASE-VEH-${data.placaCodigo.replace(/[^A-Z0-9]/g, '')}`,
        observaciones: data.observaciones,
      };
      setVehiculos((prev) => [nuevo, ...prev]);
    }
  };

  const handleEvaluarVehiculo = async (id: string, decision: 'APROBAR' | 'OBSERVAR', obs?: string) => {
    try {
      await api.patch(`/vehiculos/${id}/evaluar`, { decision, observaciones: obs });
    } catch (e) {
      // Local
    }
    setVehiculos((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              estado_acreditacion: decision === 'APROBAR' ? 'APTO_TRANSITO_MINA' : 'OBSERVADO',
              observaciones: obs || v.observaciones,
            }
          : v
      )
    );
  };

  const [toastVencimiento, setToastVencimiento] = useState<string | null>(null);

  // Alerta flotante al login: consultar vencimientos en próximos 15/30 días (solo roles autorizados)
  useEffect(() => {
    if (currentUser && ['SUPER_ADMIN', 'STAFF_RRHH', 'ADMIN_CONTRATOS'].includes(currentUser.rol)) {
      api.get('/vencimientos')
        .then((res) => {
          const { porVencer = 0, criticos = 0, vencidos = 0 } = res.data || {};
          const totalAlertas = porVencer + vencidos;
          if (totalAlertas > 0) {
            setToastVencimiento(
              `⚠️ Atención: Hay ${totalAlertas} trabajador(es) con SCTR ${
                vencidos > 0 ? 'vencido o ' : ''
              }próximo a vencer en los próximos 15/30 días (${criticos} críticos).`
            );
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleEliminarNotificacion = async (id: string) => {
    try {
      await api.delete(`/notificaciones/${id}`);
    } catch (e) {
      // Local
    }
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLimpiarLeidas = async () => {
    try {
      await api.delete('/notificaciones/limpiar');
    } catch (e) {
      // Local
    }
    setNotificaciones((prev) => prev.filter((n) => !n.leido));
  };

  const handleMarcarNotificacionLeida = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leido`);
    } catch (e) {
      // Local
    }
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
    );
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar SOLO visible para SUPER_ADMIN (con modo Rail colapsable) */}
      {currentUser.rol === 'SUPER_ADMIN' && (
        <Sidebar 
          currentView={currentView} 
          onSelectView={setCurrentView} 
          userRole={currentUser.rol}
          userName={currentUser.nombre}
          userArea={currentUser.area_responsable}
          onLogout={handleLogout}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full min-w-0">
        <Header 
          currentView={currentView} 
          userName={currentUser.nombre}
          userRole={currentUser.rol}
          userArea={currentUser.area_responsable}
          onLogout={handleLogout}
          notificaciones={notificaciones}
          onMarcarLeida={handleMarcarNotificacionLeida}
          onEliminarNotificacion={handleEliminarNotificacion}
          onLimpiarLeidas={handleLimpiarLeidas}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* TOAST FLOTANTE AL LOGIN: VENCIMIENTO PREVENTIVO 15/30 DÍAS */}
        {toastVencimiento && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-amber-950/95 border-2 border-amber-500/80 text-amber-100 p-4 rounded-2xl shadow-2xl backdrop-blur flex items-start justify-between gap-3 animate-slide-up">
            <div className="text-xs font-medium leading-relaxed">
              {toastVencimiento}
            </div>
            <button
              onClick={() => setToastVencimiento(null)}
              className="text-amber-400 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`p-3.5 sm:p-6 w-full mx-auto pb-20 ${currentUser.rol === 'SUPER_ADMIN' ? 'max-w-[1600px]' : ''}`}>
          {currentView === 'admin' && (
            <SuperAdminView 
              usuarios={usuarios}
              auditoria={auditoria}
              stats={stats}
              onCrearUsuario={handleCrearUsuario}
              onToggleEstadoUsuario={handleToggleEstadoUsuario}
            />
          )}

          {currentView === 'contratista' && (
            <PortalContratista 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onSubsanar={handleSubsanar} 
              vehiculos={vehiculos}
              onRegistrarVehiculo={handleRegistrarVehiculo}
              onEvaluarVehiculo={handleEvaluarVehiculo}
            />
          )}

          {currentView === 'fase1' && (
            <Fase1CV 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onEvaluar={handleEvaluarFase} 
            />
          )}

          {currentView === 'fase2' && (
            <Fase2Salud 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onEvaluar={handleEvaluarFase} 
            />
          )}

          {currentView === 'fase3' && (
            <Fase3Antecedentes 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onEvaluar={handleEvaluarFase} 
              vehiculos={vehiculos}
              onRegistrarVehiculo={handleRegistrarVehiculo}
              onEvaluarVehiculo={handleEvaluarVehiculo}
            />
          )}

          {currentView === 'fase4' && (
            <Fase4Capacitacion 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onEvaluar={handleEvaluarFase} 
            />
          )}

          {currentView === 'fase5' && (
            <Fase5SCTR 
              postulantes={postulantes} 
              userRole={currentUser.rol}
              onEvaluar={handleEvaluarFase} 
            />
          )}

          {currentView === 'fotocheck' && (
            <FotocheckView 
              postulantes={postulantes} 
              fotochecks={fotochecks} 
              onImprimir={handleMarcarImpreso} 
            />
          )}

          {currentView === 'garita' && (
            <GaritaScannerView 
              postulantes={postulantes} 
              fotochecks={fotochecks}
              onImprimirFotocheck={handleMarcarImpreso}
            />
          )}

          {currentView === 'vehiculos' && (
            <VehiculosView 
              vehiculos={vehiculos}
              userRole={currentUser.rol}
              onRegistrarVehiculo={handleRegistrarVehiculo}
              onEvaluarVehiculo={handleEvaluarVehiculo}
            />
          )}

          {currentView === 'metricas' && (
            <SlaMetricsView />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
