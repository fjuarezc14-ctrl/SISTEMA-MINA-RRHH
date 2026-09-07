import React, { useState } from 'react';
import { VehiculoMaquinaria, RolUsuario } from '../types';
import { 
  Truck, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Eye, 
  Filter, 
  Calendar,
  X,
  FileCheck2,
  Printer
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface VehiculosViewProps {
  vehiculos: VehiculoMaquinaria[];
  userRole: RolUsuario;
  onRegistrarVehiculo: (data: any) => Promise<void>;
  onEvaluarVehiculo: (id: string, decision: 'APROBAR' | 'OBSERVAR', obs?: string) => Promise<void>;
}

export const VehiculosView: React.FC<VehiculosViewProps> = ({
  vehiculos,
  userRole,
  onRegistrarVehiculo,
  onEvaluarVehiculo,
}) => {
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [modalEvaluarOpen, setModalEvaluarOpen] = useState(false);
  const [modalPaseOpen, setModalPaseOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoMaquinaria | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Formulario de Registro
  const [formRegistro, setFormRegistro] = useState({
    placaCodigo: '',
    tipoVehiculo: 'CAMIONETA_4X4',
    marca: '',
    modelo: '',
    anioFabricacion: 2024,
    color: '',
    soatVencimiento: '',
    revTecnicaVencimiento: '',
    polizaTrecVencimiento: '',
    observaciones: '',
    checklist: {
      jaula_antivuelco: true,
      pertiga_led: true,
      circulina: true,
      extintor_pqs: true,
      cinturones_3puntos: true,
      traba_tuercas: true,
    },
  });

  const [motivoObs, setMotivoObs] = useState('');
  const [loading, setLoading] = useState(false);

  const isInspector = userRole === 'SUPER_ADMIN' || userRole === 'SEGURIDAD_PATRIMONIAL' || userRole === 'CONTROL_ACCESOS';

  const vehiculosFiltrados = vehiculos.filter((v) => {
    if (filtroTipo !== 'TODOS' && v.tipo_vehiculo !== filtroTipo) return false;
    if (filtroEstado !== 'TODOS' && v.estado_acreditacion !== filtroEstado) return false;
    return true;
  });

  const handleOpenEvaluar = (v: VehiculoMaquinaria) => {
    setSelectedVehiculo(v);
    setMotivoObs('');
    setModalEvaluarOpen(true);
  };

  const handleOpenPase = (v: VehiculoMaquinaria) => {
    setSelectedVehiculo(v);
    setModalPaseOpen(true);
  };

  const handleSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRegistro.placaCodigo || !formRegistro.marca || !formRegistro.modelo) {
      alert('Por favor complete todos los campos obligatorios del vehículo.');
      return;
    }

    try {
      setLoading(true);
      await onRegistrarVehiculo({
        ...formRegistro,
        checklistSeguridad: formRegistro.checklist,
      });
      setModalRegistroOpen(false);
      setFormRegistro({
        placaCodigo: '',
        tipoVehiculo: 'CAMIONETA_4X4',
        marca: '',
        modelo: '',
        anioFabricacion: 2024,
        color: '',
        soatVencimiento: '',
        revTecnicaVencimiento: '',
        polizaTrecVencimiento: '',
        observaciones: '',
        checklist: {
          jaula_antivuelco: true,
          pertiga_led: true,
          circulina: true,
          extintor_pqs: true,
          cinturones_3puntos: true,
          traba_tuercas: true,
        },
      });
    } catch (err: any) {
      alert('Error al registrar vehículo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEvaluar = async (decision: 'APROBAR' | 'OBSERVAR') => {
    if (!selectedVehiculo) return;
    try {
      setLoading(true);
      await onEvaluarVehiculo(selectedVehiculo.id, decision, motivoObs);
      setModalEvaluarOpen(false);
    } catch (err) {
      alert('Error al evaluar vehículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Acciones */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            Flota de Vehículos y Maquinaria Pesada
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Acreditación técnica mina: SOAT, Póliza TREC, Revisión Técnica y Checklist de Seguridad (D.S. 024-2016-EM)
          </p>
        </div>

        <button
          onClick={() => setModalRegistroOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Registrar Unidad
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-400 font-medium">Filtrar por:</span>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="TODOS">Todos los Tipos</option>
          <option value="CAMIONETA_4X4">Camionetas 4x4</option>
          <option value="VOLQUETE">Volquetes</option>
          <option value="CISTERNA_COMBUSTIBLE">Cisternas</option>
          <option value="SCOOP_MINERO">Scoops / Línea Amarilla</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="APTO_TRANSITO_MINA">Aprobados (Pase Activo)</option>
          <option value="EN_REVISION">En Revisión</option>
          <option value="OBSERVADO">Observados</option>
        </select>

        <span className="text-xs text-slate-500 ml-auto">
          Mostrando {vehiculosFiltrados.length} de {vehiculos.length} unidades
        </span>
      </div>

      {/* Lista de Vehículos: Cards en Móvil y Tabla en Escritorio */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        {/* Vista Móvil (Cards) */}
        <div className="block md:hidden divide-y divide-slate-700/60">
          {vehiculosFiltrados.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No se encontraron vehículos registrados con los filtros seleccionados.
            </div>
          ) : (
            vehiculosFiltrados.map((v) => (
              <div key={v.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-sm text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md inline-block">
                      {v.placa_codigo}
                    </span>
                    <h4 className="font-bold text-xs text-slate-200 mt-1.5">{v.tipo_vehiculo}</h4>
                    <p className="text-[11px] text-slate-400">{v.marca} {v.modelo} {v.anio_fabricacion ? `(${v.anio_fabricacion})` : ''}</p>
                  </div>
                  <div>
                    {v.estado_acreditacion === 'APTO_TRANSITO_MINA' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> APTO
                      </span>
                    )}
                    {v.estado_acreditacion === 'EN_REVISION' && (
                      <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <Clock className="w-3 h-3 text-blue-400" /> EN REVISIÓN
                      </span>
                    )}
                    {v.estado_acreditacion === 'OBSERVADO' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> OBSERVADO
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-750">
                  <div>
                    <span className="text-slate-500 block">Empresa:</span>
                    <strong className="text-slate-300 truncate block">{v.empresa_nombre || 'Servicios XYZ'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SOAT Vence:</span>
                    <strong className="text-slate-300">{new Date(v.soat_vencimiento).toLocaleDateString('es-PE')}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {v.estado_acreditacion === 'APTO_TRANSITO_MINA' && (
                    <button
                      onClick={() => handleOpenPase(v)}
                      className="flex-1 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" /> Ver Pase QR
                    </button>
                  )}
                  {isInspector && (
                    <button
                      onClick={() => handleOpenEvaluar(v)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCheck2 className="w-4 h-4 text-blue-400" /> Evaluar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Escritorio (Tabla Completa) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                <th className="p-4">Placa / Unidad</th>
                <th className="p-4">Tipo y Marca</th>
                <th className="p-4">Empresa</th>
                <th className="p-4">SOAT / Rev. Técnica</th>
                <th className="p-4">Estado Pase</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {vehiculosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No se encontraron vehículos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                vehiculosFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-black text-sm text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md">
                        {v.placa_codigo}
                      </span>
                      <span className="text-slate-500 text-[11px] block mt-1">
                        Año: {v.anio_fabricacion || 'N/D'} | Color: {v.color || 'N/D'}
                      </span>
                    </td>
                    <td className="p-4">
                      <strong className="text-slate-200 block text-xs">{v.tipo_vehiculo}</strong>
                      <span className="text-slate-400 text-[11px]">{v.marca} {v.modelo}</span>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      {v.empresa_nombre || 'Servicios Mineros XYZ'}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="block text-slate-300">
                          SOAT: <strong>{new Date(v.soat_vencimiento).toLocaleDateString('es-PE')}</strong>
                        </span>
                        <span className="block text-slate-400">
                          Rev. Téc: <strong>{new Date(v.rev_tecnica_vencimiento).toLocaleDateString('es-PE')}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {v.estado_acreditacion === 'APTO_TRANSITO_MINA' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> APTO TRÁNSITO MINA
                        </span>
                      )}
                      {v.estado_acreditacion === 'EN_REVISION' && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <Clock className="w-3 h-3 text-blue-400" /> EN REVISIÓN
                        </span>
                      )}
                      {v.estado_acreditacion === 'OBSERVADO' && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> OBSERVADO
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {v.estado_acreditacion === 'APTO_TRANSITO_MINA' && (
                          <button
                            onClick={() => handleOpenPase(v)}
                            className="bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Ver e Imprimir Pase Vehicular"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Pase QR
                          </button>
                        )}

                        {isInspector && (
                          <button
                            onClick={() => handleOpenEvaluar(v)}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-400" /> Evaluar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO DE VEHÍCULO */}
      <Modal
        isOpen={modalRegistroOpen}
        onClose={() => setModalRegistroOpen(false)}
        title="Registrar Vehículo o Maquinaria para Tránsito en Mina"
      >
        <form onSubmit={handleSubmitRegistro} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Placa o Código Interno *</label>
              <input
                type="text"
                required
                value={formRegistro.placaCodigo}
                onChange={(e) => setFormRegistro({ ...formRegistro, placaCodigo: e.target.value.toUpperCase() })}
                placeholder="Ej. V8X-921"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Tipo de Unidad *</label>
              <select
                value={formRegistro.tipoVehiculo}
                onChange={(e) => setFormRegistro({ ...formRegistro, tipoVehiculo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="CAMIONETA_4X4">Camioneta 4x4</option>
                <option value="VOLQUETE">Volquete de Acarreo</option>
                <option value="CISTERNA_COMBUSTIBLE">Cisterna de Combustible</option>
                <option value="SCOOP_MINERO">Scoop / Cargador Bajo Perfil</option>
                <option value="RETROEXCAVADORA">Retroexcavadora</option>
                <option value="MINIBUS_PERSONAL">Minibus Transporte Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Marca *</label>
              <input
                type="text"
                required
                value={formRegistro.marca}
                onChange={(e) => setFormRegistro({ ...formRegistro, marca: e.target.value })}
                placeholder="Ej. Toyota, Volvo, CAT"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={formRegistro.modelo}
                onChange={(e) => setFormRegistro({ ...formRegistro, modelo: e.target.value })}
                placeholder="Ej. Hilux 4x4 SRV"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Vigencia SOAT *</label>
              <input
                type="date"
                required
                value={formRegistro.soatVencimiento}
                onChange={(e) => setFormRegistro({ ...formRegistro, soatVencimiento: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Vigencia Revisión Técnica *</label>
              <input
                type="date"
                required
                value={formRegistro.revTecnicaVencimiento}
                onChange={(e) => setFormRegistro({ ...formRegistro, revTecnicaVencimiento: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          {/* Checklist de Seguridad Mina D.S. 024-2016-EM */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-2">
            <h5 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Checklist de Seguridad Minera Exigido:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.jaula_antivuelco}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, jaula_antivuelco: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Jaula Antivuelco Interna
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.pertiga_led}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, pertiga_led: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Pértiga de Seguridad (LED 4.2m)
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.circulina}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, circulina: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Circulina Ámbar Estroboscópica
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.extintor_pqs}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, extintor_pqs: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Extintor PQS 6kg o 9kg
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.cinturones_3puntos}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, cinturones_3puntos: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Cinturones de 3 Puntos
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formRegistro.checklist.traba_tuercas}
                  onChange={(e) => setFormRegistro({
                    ...formRegistro,
                    checklist: { ...formRegistro.checklist, traba_tuercas: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-blue-500"
                />
                Traba-Tuercas en Ruedas
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setModalRegistroOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors shadow-md"
            >
              {loading ? 'Registrando...' : 'Registrar y Enviar a Revisión'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL EVALUAR PASE VEHICULAR */}
      {selectedVehiculo && (
        <Modal
          isOpen={modalEvaluarOpen}
          onClose={() => setModalEvaluarOpen(false)}
          title={`Dictamen de Pase Vehicular: ${selectedVehiculo.placa_codigo}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-300">
                Unidad: <strong className="text-white">{selectedVehiculo.marca} {selectedVehiculo.modelo}</strong>
              </p>
              <p className="text-slate-400 mt-0.5">Empresa: {selectedVehiculo.empresa_nombre}</p>
              <p className="text-slate-400 mt-0.5">
                Vencimiento SOAT: <strong>{new Date(selectedVehiculo.soat_vencimiento).toLocaleDateString('es-PE')}</strong>
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Observaciones o Condiciones del Pase:
              </label>
              <textarea
                value={motivoObs}
                onChange={(e) => setMotivoObs(e.target.value)}
                placeholder="Indique si hay observaciones electromecánicas o condiciones de velocidad/tránsito..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => handleConfirmEvaluar('OBSERVAR')}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> Observar Unidad
              </button>

              <button
                onClick={() => handleConfirmEvaluar('APROBAR')}
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" /> Aprobar Pase de Tránsito
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL PASE VEHICULAR PARA IMPRESIÓN (PARABRISAS CON QR) */}
      {selectedVehiculo && (
        <Modal
          isOpen={modalPaseOpen}
          onClose={() => setModalPaseOpen(false)}
          title="Pase Vehicular de Tránsito Interno Mina"
        >
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-emerald-500/60 text-center space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] tracking-widest font-black uppercase text-emerald-400 block">
                UNIDAD MINERA - CONTROL DE ACCESOS
              </span>
              <h4 className="text-xl font-black text-white mt-1">PASE VEHICULAR AUTORIZADO</h4>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 inline-block mx-auto">
              <div className="w-36 h-36 bg-white rounded-lg p-2 mx-auto flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-950" />
              </div>
              <p className="font-mono text-xs font-bold text-emerald-400 mt-2">
                {selectedVehiculo.codigo_pase_qr}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">PLACA</span>
                <strong className="text-white font-mono text-base">{selectedVehiculo.placa_codigo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TIPO</span>
                <strong className="text-white">{selectedVehiculo.tipo_vehiculo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VEHÍCULO</span>
                <strong className="text-white">{selectedVehiculo.marca} {selectedVehiculo.modelo}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">EMPRESA</span>
                <strong className="text-white">{selectedVehiculo.empresa_nombre}</strong>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Imprimir Pase para Parabrisas
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
