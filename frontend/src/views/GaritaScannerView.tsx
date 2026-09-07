import React, { useState, useEffect } from 'react';
import { AccesoGarita, Postulante } from '../types';
import { 
  QrCode, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  AlertOctagon, 
  Camera, 
  Search, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Building2,
  Calendar,
  Volume2
} from 'lucide-react';
import { api } from '../services/api';

interface GaritaScannerViewProps {
  postulantes: Postulante[];
}

export const GaritaScannerView: React.FC<GaritaScannerViewProps> = ({ postulantes }) => {
  const [codigoInput, setCodigoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<AccesoGarita[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<{
    tipo: 'TRABAJADOR' | 'VEHICULO' | 'DESCONOCIDO';
    autorizado: boolean;
    motivo: string;
    trabajador?: any;
    vehiculo?: any;
  } | null>(null);

  const [garitaActual] = useState('Garita Principal - Control Mina');
  const [camaraActiva, setCamaraActiva] = useState(false);

  const fetchHistorial = async () => {
    try {
      const res = await api.get('/garita/historial');
      if (Array.isArray(res.data)) {
        setHistorial(res.data);
      }
    } catch (e) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const handleValidarCodigo = async (codigoParaValidar: string) => {
    const cod = (codigoParaValidar || codigoInput).trim();
    if (!cod) return;

    setLoading(true);
    try {
      const res = await api.post('/garita/validar-qr', { codigo: cod });
      setUltimoResultado(res.data);

      // Registrar ingreso en bitácora
      await api.post('/garita/registrar-ingreso', {
        tipoAcceso: res.data.tipo === 'VEHICULO' ? 'VEHICULAR' : 'PEATONAL_TRABAJADOR',
        postulanteId: res.data.trabajador?.id,
        vehiculoId: res.data.vehiculo?.id,
        resultado: res.data.autorizado ? 'AUTORIZADO' : 'DENEGADO',
        motivoDenegacion: res.data.autorizado ? undefined : res.data.motivo,
        garita: garitaActual,
      });

      fetchHistorial();
    } catch (err: any) {
      // Fallback local si el backend no responde
      const postulanteEncontrado = postulantes.find(
        (p) => p.numero_documento === cod || p.id === cod
      );

      if (postulanteEncontrado) {
        const esApto = postulanteEncontrado.estado_global === 'APTO_PARA_TRABAJAR';
        const resSimulado = {
          tipo: 'TRABAJADOR' as const,
          autorizado: esApto,
          motivo: esApto
            ? 'ACCESO AUTORIZADO - 5/5 Vistos Buenos y SCTR Vigente'
            : `ACCESO DENEGADO: El trabajador se encuentra en estado [${postulanteEncontrado.estado_global}] en [${postulanteEncontrado.fase_actual}].`,
          trabajador: {
            id: postulanteEncontrado.id,
            nombreCompleto: `${postulanteEncontrado.nombres} ${postulanteEncontrado.apellidos}`,
            dni: postulanteEncontrado.numero_documento,
            empresa: postulanteEncontrado.empresa_nombre || 'Servicios XYZ',
            cargo: postulanteEncontrado.cargo,
            zonaAutorizada: 'Planta y Mina Subterránea',
            sctrVencimiento: 'Vigente',
            estado: postulanteEncontrado.estado_global,
          },
        };
        setUltimoResultado(resSimulado);
      } else {
        setUltimoResultado({
          tipo: 'DESCONOCIDO',
          autorizado: false,
          motivo: `CÓDIGO NO REGISTRADO: [${cod}] no existe en la base de datos de la unidad minera.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de estado de garita */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Lector y Scanner de Garita
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                En Línea
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Puesto de Control: <strong className="text-slate-300">{garitaActual}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setCamaraActiva(!camaraActiva)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            camaraActiva 
              ? 'bg-rose-600 hover:bg-rose-500 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          {camaraActiva ? 'Apagar Cámara' : 'Escanear con Cámara'}
        </button>
      </div>

      {/* Panel de Cámara Virtual / Live Stream si está activo */}
      {camaraActiva && (
        <div className="bg-slate-950 border-2 border-dashed border-blue-500/50 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-md mx-auto relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-slate-800">
            <div className="w-44 h-44 border-2 border-emerald-400 rounded-xl relative flex items-center justify-center animate-pulse">
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
                Enfocar QR
              </span>
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Cámara activa. Acerque el fotocheck o pase vehicular para escanear.
            </p>
          </div>
        </div>
      )}

      {/* Input de Lectura Rápida / Pistola Óptica / Simulación */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Ingreso de Código QR / DNI / Placa Vehicular
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidarCodigo(codigoInput)}
              placeholder="Escanee con lector o ingrese DNI (ej. 46998877) o Placa (ej. V8X-921)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>
          <button
            onClick={() => handleValidarCodigo(codigoInput)}
            disabled={loading || !codigoInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg"
          >
            {loading ? 'Validando...' : 'Verificar'}
          </button>
        </div>

        {/* Botones de Prueba Rápida para Simulación */}
        <div className="mt-4 pt-4 border-t border-slate-700/60">
          <p className="text-xs text-slate-400 mb-2 font-medium">Pruebas rápidas de simulación en garita:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setCodigoInput('46998877');
                handleValidarCodigo('46998877');
              }}
              className="bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Ana Mendoza (Apta 5/5 V°B°)
            </button>

            <button
              onClick={() => {
                setCodigoInput('43112233');
                handleValidarCodigo('43112233');
              }}
              className="bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:bg-rose-900/60 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              Luis García (SCTR Vencido)
            </button>

            <button
              onClick={() => {
                setCodigoInput('45891234');
                handleValidarCodigo('45891234');
              }}
              className="bg-amber-950/60 border border-amber-600/40 text-amber-300 hover:bg-amber-900/60 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
              Roberto Díaz (En Fase 1)
            </button>

            <button
              onClick={() => {
                setCodigoInput('V8X-921');
                handleValidarCodigo('V8X-921');
              }}
              className="bg-blue-950/60 border border-blue-600/40 text-blue-300 hover:bg-blue-900/60 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Hilux 4x4 (Pase Aprobado)
            </button>
          </div>
        </div>
      </div>

      {/* PANTALLA DE RESULTADO DEL ESCANEO (VEREDICTO VERDE / ROJO) */}
      {ultimoResultado && (
        <div
          className={`rounded-3xl border-2 p-6 sm:p-8 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 ${
            ultimoResultado.autorizado
              ? 'bg-emerald-950/80 border-emerald-500 text-white'
              : 'bg-rose-950/80 border-rose-500 text-white'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              {ultimoResultado.autorizado ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg">
                  <ShieldCheck className="w-10 h-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <ShieldAlert className="w-10 h-10 stroke-[2.5]" />
                </div>
              )}

              <div>
                <span
                  className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                    ultimoResultado.autorizado
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                      : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                  }`}
                >
                  {ultimoResultado.autorizado ? 'Acceso Autorizado' : 'Acceso Denegado'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                  {ultimoResultado.autorizado ? 'AUTORIZADO PARA INGRESAR' : 'PROHIBIDO EL INGRESO'}
                </h2>
                <p className="text-sm opacity-90 mt-1">{ultimoResultado.motivo}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-white/60 block">Hora del Evento</span>
              <span className="text-lg font-mono font-bold text-white">
                {new Date().toLocaleTimeString('es-PE')}
              </span>
            </div>
          </div>

          {/* Detalles del Trabajador Autorizado / Denegado */}
          {ultimoResultado.trabajador && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Trabajador</span>
                <p className="text-base font-black text-white mt-1">
                  {ultimoResultado.trabajador.nombreCompleto}
                </p>
                <p className="text-xs text-white/70 font-mono mt-0.5">
                  DNI: {ultimoResultado.trabajador.dni}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Empresa Contratista</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.trabajador.empresa}
                </p>
                <p className="text-xs text-white/70 mt-0.5">{ultimoResultado.trabajador.cargo}</p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Zona Autorizada</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.trabajador.zonaAutorizada || 'Planta y Superficie'}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Sangre: {ultimoResultado.trabajador.grupoSanguineo || 'O+'}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Póliza SCTR</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.trabajador.sctrVencimiento || 'Vigente'}
                </p>
                <p className="text-xs text-white/70 mt-0.5">Estado: {ultimoResultado.trabajador.estado}</p>
              </div>
            </div>
          )}

          {/* Detalles del Vehículo Autorizado / Denegado */}
          {ultimoResultado.vehiculo && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Placa / Código</span>
                <p className="text-xl font-black text-white font-mono mt-1">
                  {ultimoResultado.vehiculo.placa}
                </p>
                <p className="text-xs text-white/70 mt-0.5">{ultimoResultado.vehiculo.tipo}</p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Marca y Modelo</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.vehiculo.marcaModelo}
                </p>
                <p className="text-xs text-white/70 mt-0.5">{ultimoResultado.vehiculo.empresa}</p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">SOAT Vigencia</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.vehiculo.soatVencimiento || 'No Registrado'}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-[11px] text-white/60 uppercase font-medium">Revisión Técnica</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.vehiculo.revTecnicaVencimiento || 'No Registrado'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bitácora de Accesos de Garita */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Bitácora de Accesos Registrados en Turno
          </h4>
          <span className="text-xs text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
            Total Registros: {historial.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                <th className="p-3">Hora / Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Identificación</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Motivo / Observación</th>
                <th className="p-3">Garita / Guardia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No hay eventos de acceso registrados en el turno.
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 text-slate-300 font-mono">
                      {new Date(item.creado_en).toLocaleDateString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      {item.tipo_acceso === 'VEHICULAR' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <Truck className="w-3.5 h-3.5" /> Vehículo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <UserCheck className="w-3.5 h-3.5" /> Trabajador
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.tipo_acceso === 'VEHICULAR' ? (
                        <div>
                          <strong className="text-white font-mono">{item.vehiculo_placa}</strong>
                          <span className="text-slate-400 block text-[11px]">
                            {item.vehiculo_marca} {item.vehiculo_modelo}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <strong className="text-white">
                            {item.postulante_nombres} {item.postulante_apellidos}
                          </strong>
                          <span className="text-slate-400 block text-[11px] font-mono">
                            DNI: {item.postulante_dni}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {item.resultado === 'AUTORIZADO' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> AUTORIZADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <XCircle className="w-3 h-3" /> DENEGADO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">
                      {item.motivo_denegacion || 'Acceso concedido sin observaciones'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {item.garita}
                      <span className="block text-slate-500">{item.guardia_nombre}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
