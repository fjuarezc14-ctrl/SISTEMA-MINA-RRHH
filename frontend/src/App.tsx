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
import { Postulante, Fotocheck, UsuarioSistema, AuditoriaVistoBueno, StatsDashboard, RolUsuario } from './types';
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
  },
];

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('admin');
  const [selectedRole, setSelectedRole] = useState<string>('SUPER_ADMIN');
  const [postulantes, setPostulantes] = useState<Postulante[]>(MOCK_POSTULANTES);
  const [fotochecks, setFotochecks] = useState<Fotocheck[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(INITIAL_USUARIOS);
  const [auditoria, setAuditoria] = useState<AuditoriaVistoBueno[]>(INITIAL_AUDITORIA);

  // Estadísticas calculadas dinámicamente
  const stats: StatsDashboard = {
    total: postulantes.length,
    aptosParaTrabajar: postulantes.filter((p) => p.estado_global === 'APTO_PARA_TRABAJAR').length,
    observados: postulantes.filter((p) => p.estado_global === 'OBSERVADO').length,
    enProceso: postulantes.filter((p) => p.estado_global === 'EN_PROCESO').length,
    bloqueadosListaNegra: postulantes.filter((p) => p.estado_global === 'NO_APTO').length,
  };

  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const res = await api.get('/postulantes');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPostulantes(res.data);
        }
      } catch (e) {
        // Modo offline / preview
      }
    };
    fetchFromBackend();
  }, []);

  // Crear nuevo acceso / usuario de área (Super Admin)
  const handleCrearUsuario = async (data: {
    nombre: string;
    email: string;
    passwordPlain: string;
    rol: RolUsuario;
    area_responsable: string;
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
        activo: true,
      };
      setUsuarios((prev) => [nuevo, ...prev]);
    }
  };

  // Toggle estado de usuario (Super Admin)
  const handleToggleEstadoUsuario = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/admin/usuarios/${id}/estado`, { activo });
    } catch (e) {
      // Local fallback
    }
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo } : u))
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

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header 
          currentView={currentView} 
          selectedRole={selectedRole} 
          onRoleChange={setSelectedRole} 
        />

        <div className="p-6 max-w-7xl w-full mx-auto pb-16">
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
              onSubsanar={handleSubsanar} 
            />
          )}

          {currentView === 'fase1' && (
            <Fase1CV 
              postulantes={postulantes} 
              onEvaluar={(id, dec, obs) => 
                handleEvaluarFase(id, 'FASE_1', dec, { observaciones: obs })
              } 
            />
          )}

          {currentView === 'fase2' && (
            <Fase2Salud 
              postulantes={postulantes} 
              onEvaluar={(id, dec, mot) => 
                handleEvaluarFase(id, 'FASE_2', dec, { motivo: mot })
              } 
            />
          )}

          {currentView === 'fase3' && (
            <Fase3Antecedentes 
              postulantes={postulantes} 
              onEvaluar={(id, dec, mot) => 
                handleEvaluarFase(id, 'FASE_3', dec, { motivo: mot })
              } 
            />
          )}

          {currentView === 'fase4' && (
            <Fase4Capacitacion 
              postulantes={postulantes} 
              onEvaluar={(id, dec, nota, file, obs) => 
                handleEvaluarFase(id, 'FASE_4', dec, { nota, file, observaciones: obs })
              } 
            />
          )}

          {currentView === 'fase5' && (
            <Fase5SCTR 
              postulantes={postulantes} 
              onEvaluar={(id, dec, fecha, obs) => 
                handleEvaluarFase(id, 'FASE_5', dec, { fechaVencimiento: fecha, observaciones: obs })
              } 
            />
          )}

          {currentView === 'fotocheck' && (
            <FotocheckView 
              postulantes={postulantes} 
              fotochecks={fotochecks} 
              onImprimir={handleMarcarImpreso} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
