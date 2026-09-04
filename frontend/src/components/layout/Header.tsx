import React from 'react';
import { ViewType } from './Sidebar';
import { UserCheck, Shield, Crown } from 'lucide-react';

interface HeaderProps {
  currentView: ViewType;
  selectedRole: string;
  onRoleChange: (role: string) => void;
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
};

export const Header: React.FC<HeaderProps> = ({ currentView, selectedRole, onRoleChange }) => {
  const [title, subtitle] = titles[currentView] || ['Onboarding Minero', 'Panel de gestión'];

  return (
    <header className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 backdrop-blur-md bg-slate-900/90">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {currentView === 'admin' && <Crown className="w-5 h-5 text-purple-400" />}
          {title}
        </h2>
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
            <option value="SUPER_ADMIN" className="bg-slate-900 text-purple-400 font-bold">Super Admin (Mina)</option>
            <option value="STAFF_RRHH" className="bg-slate-900 text-white">Staff RRHH (Fase 1)</option>
            <option value="MEDICO_OCUPACIONAL" className="bg-slate-900 text-white">Médico Ocupacional (Fase 2)</option>
            <option value="SEGURIDAD_PATRIMONIAL" className="bg-slate-900 text-white">Seguridad Patrimonial (Fase 3)</option>
            <option value="INSTRUCTOR_SSOMA" className="bg-slate-900 text-white">Instructor SSOMA (Fase 4)</option>
            <option value="ADMIN_CONTRATOS" className="bg-slate-900 text-white">Admin Contratos/SCTR (Fase 5)</option>
            <option value="CONTROL_ACCESOS" className="bg-slate-900 text-white">Control Accesos (Fotocheck)</option>
            <option value="CONTRATISTA" className="bg-slate-900 text-white">Contratista (ECM)</option>
          </select>
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
