import React, { useState, useEffect } from 'react';
import { Sidebar, ViewType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PortalContratista } from './views/PortalContratista';
import { Fase1CV } from './views/Fase1CV';
import { Fase2Salud } from './views/Fase2Salud';
import { Fase3Antecedentes } from './views/Fase3Antecedentes';
import { Fase4Capacitacion } from './views/Fase4Capacitacion';
import { Fase5SCTR } from './views/Fase5SCTR';
import { FotocheckView } from './views/FotocheckView';
import { Postulante, Fotocheck } from './types';
import { api } from './services/api';

// Datos iniciales fieles a la maqueta onboarding.html
const MOCK_POSTULANTES: Postulante[] = [
  {
    id: 'c1111111-0000-0000-0000-000000000001',
    empresa_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    empresa_nombre: 'Servicios Mineros XYZ S.A.C.',
    tipo_documento: 'DNI',
    numero_documento: '45891234',
    nombres: 'Roberto',
    apellidos: 'Díaz Alvarado',
    cargo: 'Soldador',
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
    cargo: 'Técnico Mecánico',
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
    cargo: 'Electricista Mina',
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
    cargo: 'Chofer Volquete',
    fase_actual: 'FASE_5',
    estado_global: 'OBSERVADO',
    ultima_observacion: 'El SCTR subido está vencido.',
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
    estado_global: 'APROBADO_TOTAL',
  },
];

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('contratista');
  const [selectedRole, setSelectedRole] = useState<string>('CONTRATISTA');
  const [postulantes, setPostulantes] = useState<Postulante[]>(MOCK_POSTULANTES);
  const [fotochecks, setFotochecks] = useState<Fotocheck[]>([]);

  // Intentar cargar postulantes reales desde el backend si está conectado
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const res = await api.get('/postulantes');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPostulantes(res.data);
        }
      } catch (e) {
        // Modo offline / preview con datos mock
      }
    };
    fetchFromBackend();
  }, []);

  // Manejador para subsanar desde el portal contratista
  const handleSubsanar = async (id: string, file: File, notas?: string) => {
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      if (notas) formData.append('notas', notas);
      await api.post(`/postulantes/${id}/subsanar`, formData);
    } catch (e) {
      console.warn('Backend offline, actualizando estado en memoria.');
    }

    setPostulantes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado_global: 'EN_PROCESO', ultima_observacion: undefined }
          : p
      )
    );
  };

  // Manejador general de evaluación de fases
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
      const formData = new FormData();
      formData.append('postulanteId', postulanteId);
      formData.append('decision', decision);
      if (detalles?.observaciones) formData.append('observaciones', detalles.observaciones);
      if (detalles?.nota !== undefined) formData.append('nota', String(detalles.nota));
      if (detalles?.fechaVencimiento) formData.append('fechaVencimiento', detalles.fechaVencimiento);
      if (detalles?.motivo) formData.append('motivoListaNegra', detalles.motivo);
      if (detalles?.file) formData.append('archivo', detalles.file);

      await api.post(`/fases/${fase.toLowerCase()}/evaluar`, formData);
    } catch (e) {
      console.warn('Backend offline, aplicando transición de estado en memoria.');
    }

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

        // Caso APROBAR: avanza a la siguiente fase
        const siguienteMap: Record<string, string> = {
          FASE_1: 'FASE_2',
          FASE_2: 'FASE_3',
          FASE_3: 'FASE_4',
          FASE_4: 'FASE_5',
          FASE_5: 'FOTOCHECK',
        };

        const prox = siguienteMap[fase] || 'FINALIZADO';
        return {
          ...p,
          fase_actual: prox as any,
          estado_global: prox === 'FOTOCHECK' ? 'APROBADO_TOTAL' : 'EN_PROCESO',
        };
      })
    );
  };

  const handleMarcarImpreso = async (postulanteId: string) => {
    try {
      await api.post(`/fotocheck/${postulanteId}/imprimir`);
    } catch (e) {
      // Manejo local
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* BARRA LATERAL (SIDEBAR) */}
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header 
          currentView={currentView} 
          selectedRole={selectedRole} 
          onRoleChange={setSelectedRole} 
        />

        <div className="p-6 max-w-7xl w-full mx-auto pb-16">
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
