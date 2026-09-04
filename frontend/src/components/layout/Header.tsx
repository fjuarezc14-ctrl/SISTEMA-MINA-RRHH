import React from 'react';
import { ViewType } from './Sidebar';
import { UserCheck, Shield } from 'lucide-react';

interface HeaderProps {
  currentView: ViewType;
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

const titles: Record<ViewType, [string, string]> = {
  contratista: ['Portal Contratista', 'Panel de seguimiento y subsanación de postulantes'],
  fase1: ['Filtro 1: Datos y CV', 'Validación documentaria inicial y perfil técnico'],
  fase2: ['Filtro 2: Salud Ocupacional', 'Carga y validación de exámenes EMO y toxicológicos'],
  fase3: ['Filtro 3: Antecedentes', 'Revisión legal de antecedentes policiales y penales'],
  fase4: ['Filtro 4: Capacitaciones', 'Registro de notas de inducción y actas de seguridad'],
  fase5: ['Filtro 5: SCTR y Seguros', 'Validación de vigencia de pólizas de alto riesgo'],
  fotocheck: ['Emisión de Fotocheck', 'Candidatos aptos y generación de credenciales con QR'],
};

export const Header: React.FC<HeaderProps> = ({ currentView, selectedRole, onRoleChange }) => {
  const [title, subtitle] = titles[currentView] || ['Onboarding Minero', 'Panel de gestión'];

  return (
    <header className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 backdrop-blur-md bg-slate-900/90">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Rol Activo:</span>
          <select 
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent text-blue-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="CONTRATISTA" className="bg-slate-900 text-white">Contratista (ECM)</option>
            <option value="STAFF_RRHH" className="bg-slate-900 text-white">Staff RRHH (Fase 1)</option>
            <option value="MEDICO_OCUPACIONAL" className="bg-slate-900 text-white">Médico Ocupacional (Fase 2)</option>
            <option value="SEGURIDAD_PATRIMONIAL" className="bg-slate-900 text-white">Seguridad Patrimonial (Fase 3)</option>
            <option value="INSTRUCTOR_SSOMA" className="bg-slate-900 text-white">Instructor SSOMA (Fase 4)</option>
            <option value="ADMIN_CONTRATOS" className="bg-slate-900 text-white">Admin Contratos/SCTR (Fase 5)</option>
            <option value="CONTROL_ACCESOS" className="bg-slate-900 text-white">Control Accesos (Fotocheck)</option>
          </select>
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
