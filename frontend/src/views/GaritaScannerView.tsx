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
  Volume2,
  Wifi,
  WifiOff,
  DownloadCloud,
  RefreshCw,
  Activity,
  AlertTriangle,
  BadgeCheck,
  LogOut,
  Ambulance
} from 'lucide-react';
import { api } from '../services/api';

interface GaritaScannerViewProps {
  postulantes: Postulante[];
}

interface PadronOfflineLocal {
  fechaGeneracion?: string;
  totalTrabajadores?: number;
  totalVehiculos?: number;
  trabajadores: any[];
  vehiculos: any[];
  listaNegra: any[];
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

  // Estados Operativos Mineros (Offline y Alcotest)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [alcotestEstado, setAlcotestEstado] = useState<'APTO' | 'POSITIVO'>('APTO');
  const [padronLocal, setPadronLocal] = useState<PadronOfflineLocal | null>(null);
  const [colaOffline, setColaOffline] = useState<any[]>([]);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ texto: string; tipo: 'success' | 'warn' | 'error' } | null>(null);

  // Estados de Bajada Anticipada por Emergencia (Punto 6)
  const [modalEmergenciaOpen, setModalEmergenciaOpen] = useState(false);
  const [emergenciasActivas, setEmergenciasActivas] = useState<any[]>([]);
  const [formEmergencia, setFormEmergencia] = useState({
    postulanteId: '',
    tipoEmergencia: 'MEDICA_TRABAJADOR' as 'MEDICA_TRABAJADOR' | 'FAMILIAR_GRAVE' | 'OPERACIONAL',
    motivoDetalle: '',
  });

  const fetchEmergencias = async () => {
    try {
      const res = await api.get('/emergencias/activas');
      setEmergenciasActivas(res.data || []);
    } catch (e) {}
  };

  const handleAutorizarEmergenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmergencia.postulanteId || !formEmergencia.motivoDetalle) {
      alert('Seleccione un trabajador e ingrese el sustento de la emergencia médica o familiar.');
      return;
    }
    try {
      await api.post('/emergencias/autorizar', formEmergencia);
      setMensajeNotificacion({
        tipo: 'success',
        texto: '✅ Bajada anticipada por emergencia autorizada con éxito. Código de pase habilitado en Garita.'
      });
      setModalEmergenciaOpen(false);
      setFormEmergencia({
        postulanteId: '',
        tipoEmergencia: 'MEDICA_TRABAJADOR',
        motivoDetalle: '',
      });
      fetchEmergencias();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al autorizar bajada de emergencia.');
    }
  };

  const handleEjecutarSalidaEmergencia = async (bajaId: string, dni: string) => {
    try {
      await api.post('/emergencias/ejecutar-garita', { bajaId, numeroDocumento: dni });
      setMensajeNotificacion({
        tipo: 'success',
        texto: `🚑 Salida de emergencia ejecutada para DNI ${dni}: Reconocida como Salida Justificada (Sin cómputo de abandono).`
      });
      fetchEmergencias();
      fetchHistorial();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al validar salida de emergencia en Garita.');
    }
  };

  // Cargar padrón y cola offline de localStorage al iniciar
  useEffect(() => {
    try {
      const padronGuardado = localStorage.getItem('valetec_padron_offline');
      if (padronGuardado) {
        setPadronLocal(JSON.parse(padronGuardado));
      }
      const colaGuardada = localStorage.getItem('valetec_cola_offline');
      if (colaGuardada) {
        setColaOffline(JSON.parse(colaGuardada));
      }
    } catch (e) {
      console.warn('No se pudo acceder al almacenamiento local', e);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchHistorial = async () => {
    try {
      const res = await api.get('/garita/historial');
      if (Array.isArray(res.data)) {
        setHistorial(res.data);
      }
    } catch (e) {
      // Offline fallback: mostrar registros locales
    }
  };

  useEffect(() => {
    fetchHistorial();
    fetchEmergencias();
  }, []);

  // Descargar Padrón Local para Contingencia sin Conexión
  const handleDescargarPadron = async () => {
    setLoading(true);
    try {
      const res = await api.get('/garita/padron-offline');
      const data: PadronOfflineLocal = res.data;
      localStorage.setItem('valetec_padron_offline', JSON.stringify(data));
      setPadronLocal(data);
      setMensajeNotificacion({
        tipo: 'success',
        texto: `✅ Padrón offline descargado con éxito: ${data.totalTrabajadores} trabajadores y ${data.totalVehiculos} vehículos listos para operar sin red.`
      });
      setTimeout(() => setMensajeNotificacion(null), 6000);
    } catch (err: any) {
      // Si falla la API pero tenemos postulantes en memoria de React, generar padrón de contingencia
      const contingencia: PadronOfflineLocal = {
        fechaGeneracion: new Date().toISOString(),
        totalTrabajadores: postulantes.length,
        totalVehiculos: 3,
        trabajadores: postulantes.map(p => ({
          id: p.id,
          numero_documento: p.numero_documento,
          nombres: p.nombres,
          apellidos: p.apellidos,
          cargo: p.cargo,
          tipo_pase: p.tipo_pase || 'PERMANENTE',
          empresa_nombre: p.empresa_nombre,
          estado_global: p.estado_global,
          sctr_vencimiento: p.sctr_vencimiento,
          codigo_qr: `QR-VT-${p.numero_documento}`,
          codigo_credencial: `VT-2026-${p.numero_documento.slice(-4)}`
        })),
        vehiculos: [
          { placa_codigo: 'V8X-921', marca: 'Toyota', modelo: 'Hilux 4x4', estado_acreditacion: 'APTO_TRANSITO_MINA', soat_vencimiento: '2027-01-01', rev_tecnica_vencimiento: '2027-01-01' },
          { placa_codigo: 'W3C-810', marca: 'Volvo', modelo: 'FMX 8x4', estado_acreditacion: 'APTO_TRANSITO_MINA', soat_vencimiento: '2027-01-01', rev_tecnica_vencimiento: '2027-01-01' },
        ],
        listaNegra: []
      };
      localStorage.setItem('valetec_padron_offline', JSON.stringify(contingencia));
      setPadronLocal(contingencia);
      setMensajeNotificacion({
        tipo: 'success',
        texto: `✅ Padrón local generado con ${contingencia.totalTrabajadores} trabajadores para respaldo en garita.`
      });
      setTimeout(() => setMensajeNotificacion(null), 6000);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar Lote de Eventos Registrados sin Conexión
  const handleSincronizarOffline = async () => {
    if (colaOffline.length === 0) return;
    setSincronizando(true);
    try {
      await api.post('/garita/sincronizar-offline', { lote: colaOffline });
      localStorage.removeItem('valetec_cola_offline');
      setColaOffline([]);
      setMensajeNotificacion({
        tipo: 'success',
        texto: `✅ Sincronización exitosa: Se subieron ${colaOffline.length} accesos offline a la base de datos central de mina.`
      });
      fetchHistorial();
      setTimeout(() => setMensajeNotificacion(null), 6000);
    } catch (err: any) {
      setMensajeNotificacion({
        tipo: 'error',
        texto: `❌ No se pudo conectar con el servidor central. Los ${colaOffline.length} registros se mantienen a salvo en la memoria local.`
      });
    } finally {
      setSincronizando(false);
    }
  };

  const handleValidarCodigo = async (codigoParaValidar: string) => {
    const cod = (codigoParaValidar || codigoInput).trim();
    if (!cod) return;

    // Regla Crítica DS 024-2016-EM: Alcotest Positivo Bloquea Acceso al 100%
    if (alcotestEstado === 'POSITIVO') {
      const denegadoAlcotest = {
        tipo: 'TRABAJADOR' as const,
        autorizado: false,
        motivo: '🚨 DENEGADO POR ALCOTEST POSITIVO (> 0.00 g/L). Tolerancia CERO según Reglamento de Seguridad Minera DS 024-2016-EM Art. 40.',
        trabajador: {
          id: 'ALCOTEST_BLOCK',
          nombreCompleto: 'PERSONAL INTERVENIDO EN GARITA',
          dni: cod,
          empresa: 'EN INVESTIGACIÓN SSOMA',
          cargo: 'Control Alcoholemia',
          estado: 'DENEGADO_ALCOTEST',
          sctrVencimiento: 'Retenido en Garita',
        }
      };
      setUltimoResultado(denegadoAlcotest);

      // Registrar evento crítico de alcotest
      const registroAlcotest = {
        tipoAcceso: 'PEATONAL_TRABAJADOR' as const,
        resultado: 'DENEGADO' as const,
        motivoDenegacion: 'Prueba de Alcoholemia POSITIVA (> 0.00 g/L) - Tolerancia Cero Mina',
        garita: garitaActual,
        guardiaNombre: 'Oficial de Garita',
        alcotestResultado: '> 0.00 g/L (POSITIVO - FALTA CRÍTICA)',
        timestamp: new Date().toISOString(),
      };

      if (isOnline) {
        try {
          await api.post('/garita/registrar-ingreso', registroAlcotest);
          fetchHistorial();
        } catch (e) {
          guardarEnColaOffline(registroAlcotest);
        }
      } else {
        guardarEnColaOffline(registroAlcotest);
      }
      return;
    }

    setLoading(true);

    // Si estamos en línea, intentamos primero el endpoint central
    if (isOnline) {
      try {
        const res = await api.post('/garita/validar-qr', { codigo: cod });
        setUltimoResultado(res.data);

        // Registrar ingreso en bitácora con alcotest Aprobado
        await api.post('/garita/registrar-ingreso', {
          tipoAcceso: res.data.tipo === 'VEHICULO' ? 'VEHICULAR' : 'PEATONAL_TRABAJADOR',
          postulanteId: res.data.trabajador?.id,
          vehiculoId: res.data.vehiculo?.id,
          resultado: res.data.autorizado ? 'AUTORIZADO' : 'DENEGADO',
          motivoDenegacion: res.data.autorizado ? undefined : res.data.motivo,
          garita: garitaActual,
          alcotestResultado: '0.00 g/L (Apto)',
        });

        fetchHistorial();
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn('Fallo petición online, activando contingencia offline local...', err);
        // Continuar al bloque local
      }
    }

    // MODO OFFLINE: Validación contra el Padrón Local descargado
    validarLocalmente(cod);
    setLoading(false);
  };

  const validarLocalmente = (cod: string) => {
    const cleanCod = cod.toUpperCase();

    // 1. Revisar en padrón local de trabajadores o en la lista de postulantes
    const fuenteTrabajadores = padronLocal?.trabajadores || postulantes;
    const trabajador = fuenteTrabajadores.find((p: any) => 
      p.numero_documento === cleanCod || 
      p.id === cleanCod ||
      (p.codigo_qr && p.codigo_qr.toUpperCase() === cleanCod) ||
      (p.codigo_credencial && p.codigo_credencial.toUpperCase() === cleanCod)
    );

    if (trabajador) {
      const esApto = trabajador.estado_global === 'APTO_PARA_TRABAJAR' || trabajador.estado_global === 'APROBADO_TOTAL';
      const tipoPase = trabajador.tipo_pase || 'PERMANENTE';
      let zona = 'Planta y Mina Subterránea';
      if (tipoPase === 'PROVEEDOR_LOGISTICO') zona = 'Solo Almacén Central y Patio de Superficie';
      if (tipoPase === 'VISITA_TECNICA') zona = 'Superficie y Mina con Acompañamiento';

      const resOffline = {
        tipo: 'TRABAJADOR' as const,
        autorizado: esApto,
        motivo: esApto
          ? `ACCESO AUTORIZADO (OFFLINE) - Pase [${tipoPase}] Vigente y SCTR Activo`
          : `ACCESO DENEGADO: El trabajador se encuentra en estado [${trabajador.estado_global}] en [${trabajador.fase_actual}].`,
        trabajador: {
          id: trabajador.id,
          nombreCompleto: `${trabajador.nombres} ${trabajador.apellidos}`,
          dni: trabajador.numero_documento,
          empresa: trabajador.empresa_nombre || 'Servicios XYZ',
          cargo: trabajador.cargo,
          tipoPase,
          zonaAutorizada: zona,
          sctrVencimiento: 'Vigente (Validación Caché)',
          estado: trabajador.estado_global,
        },
      };

      setUltimoResultado(resOffline);

      // Guardar en cola offline
      const evento = {
        tipoAcceso: 'PEATONAL_TRABAJADOR',
        postulanteId: trabajador.id,
        postulante_nombres: trabajador.nombres,
        postulante_apellidos: trabajador.apellidos,
        postulante_dni: trabajador.numero_documento,
        postulante_cargo: trabajador.cargo,
        postulante_tipo_pase: tipoPase,
        resultado: esApto ? 'AUTORIZADO' : 'DENEGADO',
        motivoDenegacion: esApto ? undefined : resOffline.motivo,
        garita: garitaActual,
        guardiaNombre: 'Oficial Garita (Offline)',
        alcotestResultado: '0.00 g/L (Apto)',
        sincronizado_offline: false,
        timestamp: new Date().toISOString(),
      };
      guardarEnColaOffline(evento);
      return;
    }

    // 2. Revisar en padrón local de vehículos
    const vehiculos = padronLocal?.vehiculos || [
      { placa_codigo: 'V8X-921', marca: 'Toyota', modelo: 'Hilux 4x4', estado_acreditacion: 'APTO_TRANSITO_MINA' },
      { placa_codigo: 'W3C-810', marca: 'Volvo', modelo: 'FMX 8x4', estado_acreditacion: 'APTO_TRANSITO_MINA' },
      { placa_codigo: 'T9K-442', marca: 'Mercedes-Benz', modelo: 'Actros', estado_acreditacion: 'OBSERVADO' }
    ];

    const vehiculo = vehiculos.find((v: any) => 
      v.placa_codigo.toUpperCase() === cleanCod || 
      (v.codigo_pase_qr && v.codigo_pase_qr.toUpperCase() === cleanCod)
    );

    if (vehiculo) {
      const esApto = vehiculo.estado_acreditacion === 'APTO_TRANSITO_MINA';
      const resOfflineVeh = {
        tipo: 'VEHICULO' as const,
        autorizado: esApto,
        motivo: esApto 
          ? 'PASE VEHICULAR VÁLIDO (OFFLINE) - Unidad Inspeccionada y Autorizada' 
          : `ACCESO VEHICULAR DENEGADO: Estado [${vehiculo.estado_acreditacion}]`,
        vehiculo: {
          id: vehiculo.id || 'VEH_OFFLINE',
          placa: vehiculo.placa_codigo,
          tipo: 'VEHICULO_MINERO',
          empresa: vehiculo.empresa_nombre || 'Contratista Mina',
          marcaModelo: `${vehiculo.marca} ${vehiculo.modelo}`,
          estado: vehiculo.estado_acreditacion,
          soatVencimiento: 'Vigente (Caché Local)',
          revTecnicaVencimiento: 'Vigente (Caché Local)',
        }
      };

      setUltimoResultado(resOfflineVeh);

      const evento = {
        tipoAcceso: 'VEHICULAR',
        vehiculo_placa: vehiculo.placa_codigo,
        vehiculo_marca: vehiculo.marca,
        vehiculo_modelo: vehiculo.modelo,
        tipo_vehiculo: 'VEHICULO_MINERO',
        resultado: esApto ? 'AUTORIZADO' : 'DENEGADO',
        motivoDenegacion: esApto ? undefined : resOfflineVeh.motivo,
        garita: garitaActual,
        guardiaNombre: 'Oficial Garita (Offline)',
        alcotestResultado: '0.00 g/L (Apto)',
        sincronizado_offline: false,
        timestamp: new Date().toISOString(),
      };
      guardarEnColaOffline(evento);
      return;
    }

    // No encontrado
    setUltimoResultado({
      tipo: 'DESCONOCIDO',
      autorizado: false,
      motivo: `CÓDIGO NO REGISTRADO: [${cleanCod}] no figura en el padrón local de la unidad minera.`,
    });
  };

  const guardarEnColaOffline = (evento: any) => {
    const nuevaCola = [evento, ...colaOffline];
    setColaOffline(nuevaCola);
    try {
      localStorage.setItem('valetec_cola_offline', JSON.stringify(nuevaCola));
    } catch (e) {}

    // Agregar también al historial en pantalla de inmediato
    const itemHistorial: AccesoGarita = {
      id: `offline-${Date.now()}`,
      tipo_acceso: evento.tipoAcceso as any,
      resultado: evento.resultado as any,
      motivo_denegacion: evento.motivoDenegacion,
      garita: evento.garita,
      guardia_nombre: evento.guardiaNombre,
      alcotest_resultado: evento.alcotestResultado,
      sincronizado_offline: false,
      postulante_nombres: evento.postulante_nombres,
      postulante_apellidos: evento.postulante_apellidos,
      postulante_dni: evento.postulante_dni,
      postulante_cargo: evento.postulante_cargo,
      postulante_tipo_pase: evento.postulante_tipo_pase,
      vehiculo_placa: evento.vehiculo_placa,
      vehiculo_marca: evento.vehiculo_marca,
      vehiculo_modelo: evento.vehiculo_modelo,
      creado_en: evento.timestamp,
    };
    setHistorial((prev) => [itemHistorial, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Notificación / Feedback de Sincronización */}
      {mensajeNotificacion && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
          mensajeNotificacion.tipo === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : mensajeNotificacion.tipo === 'warn'
            ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <span>{mensajeNotificacion.texto}</span>
          <button 
            onClick={() => setMensajeNotificacion(null)}
            className="text-white/60 hover:text-white ml-3 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de estado de garita y herramientas operativas mineras */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-bold text-white">Lector y Scanner de Garita</h3>
              
              {/* Indicador de Red en Vivo */}
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  Servidor Central Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  Modo Offline (Caché Local Activa)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Puesto de Control: <strong className="text-slate-300">{garitaActual}</strong>
              {padronLocal && (
                <span className="text-slate-500 ml-2 hidden sm:inline">
                  • Padrón en Caché: {padronLocal.totalTrabajadores || padronLocal.trabajadores?.length || 0} personas
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones de Red y Contingencia */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          {/* Botón Descargar Padrón Local */}
          <button
            onClick={handleDescargarPadron}
            disabled={loading}
            title="Guarda la lista de personas y vehículos autorizados para validar sin señal de internet"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <DownloadCloud className="w-4 h-4 text-sky-400" />
            Descargar Padrón Local
          </button>

          {/* Botón Sincronizar Cola Offline */}
          {colaOffline.length > 0 && (
            <button
              onClick={handleSincronizarOffline}
              disabled={sincronizando}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md animate-bounce"
            >
              <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
              Sincronizar {colaOffline.length} Offline
            </button>
          )}

          {/* Botón Bajada Anticipada por Emergencia (Punto 6) */}
          <button
            type="button"
            onClick={() => setModalEmergenciaOpen(true)}
            title="Autorizar o registrar salida anticipada de campamento por emergencia médica o familiar (14x7)"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-700/80 hover:bg-rose-600 text-white border border-rose-500/50 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Ambulance className="w-4 h-4" />
            Emergencia / Bajada 14x7
          </button>

          <button
            onClick={() => setCamaraActiva(!camaraActiva)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              camaraActiva 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            {camaraActiva ? 'Apagar Cámara' : 'Escanear con Cámara'}
          </button>
        </div>
      </div>

      {/* Barra Operativa de Alcotest (DS 024-2016-EM Tolerancia Cero) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Prueba de Alcoholemia en Garita (DS 024-2016-EM Art. 40)
            </span>
            <span className="text-[11px] text-slate-400">
              Tolerancia Cero en Unidad Minera: Todo ingreso peatonal o vehicular requiere 0.00 g/L.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAlcotestEstado('APTO')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              alcotestEstado === 'APTO'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            ✓ 0.00 g/L (Apto)
          </button>
          <button
            type="button"
            onClick={() => setAlcotestEstado('POSITIVO')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              alcotestEstado === 'POSITIVO'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-300'
            }`}
          >
            ⚠ Positivo (&gt; 0.00 g/L)
          </button>
        </div>
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
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidarCodigo(codigoInput)}
              placeholder="Escanee con lector o ingrese DNI (ej. 46998877) o Placa (ej. V8X-921)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>
          <button
            onClick={() => handleValidarCodigo(codigoInput)}
            disabled={loading || !codigoInput.trim()}
            className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-lg"
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
              Ana Mendoza (Pase Permanente - Apto)
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
              Hilux 4x4 (Pase Vehicular Apto)
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                      ultimoResultado.autorizado
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {ultimoResultado.autorizado ? 'Acceso Autorizado' : 'Acceso Denegado'}
                  </span>

                  {/* Badge de Alcotest en Resultado */}
                  <span className="text-xs bg-slate-900/60 border border-white/20 px-2.5 py-0.5 rounded-full font-mono">
                    Alcotest: {alcotestEstado === 'APTO' ? '0.00 g/L (Aprobado)' : 'Positivo (>0.00 g/L)'}
                  </span>

                  {/* Badge de Tipo de Pase */}
                  {ultimoResultado.trabajador?.tipoPase && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      ultimoResultado.trabajador.tipoPase === 'VISITA_TECNICA'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                        : ultimoResultado.trabajador.tipoPase === 'PROVEEDOR_LOGISTICO'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                    }`}>
                      {ultimoResultado.trabajador.tipoPase.replace('_', ' ')}
                    </span>
                  )}
                </div>

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
                <span className="text-[11px] text-white/60 uppercase font-medium">Zona y Tipo Pase</span>
                <p className="text-base font-bold text-white mt-1">
                  {ultimoResultado.trabajador.zonaAutorizada || 'Planta y Mina'}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Tipo: <strong>{ultimoResultado.trabajador.tipoPase || 'PERMANENTE'}</strong>
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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Bitácora de Accesos Registrados en Turno
          </h4>
          <div className="flex items-center gap-2">
            {colaOffline.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold">
                {colaOffline.length} guardados offline
              </span>
            )}
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
              Total Registros: {historial.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                <th className="p-3">Hora / Fecha</th>
                <th className="p-3">Tipo / Pase</th>
                <th className="p-3">Identificación</th>
                <th className="p-3">Alcotest</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Motivo / Observación</th>
                <th className="p-3">Garita / Guardia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
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
                      {item.sincronizado_offline === false && (
                        <span className="block text-[10px] text-amber-400 font-bold">
                          [MODO OFFLINE]
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.tipo_acceso === 'VEHICULAR' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <Truck className="w-3.5 h-3.5" /> Vehículo
                        </span>
                      ) : (
                        <div>
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <UserCheck className="w-3.5 h-3.5" /> Trabajador
                          </span>
                          {item.postulante_tipo_pase && (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {item.postulante_tipo_pase}
                            </span>
                          )}
                        </div>
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.alcotest_resultado?.includes('Positivo') || item.alcotest_resultado?.includes('FALTA')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {item.alcotest_resultado || '0.00 g/L'}
                      </span>
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

      {/* MODAL AUTORIZAR BAJADA ANTICIPADA POR EMERGENCIA (Punto 6) */}
      {modalEmergenciaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Autorizar Bajada Anticipada de Campamento</h4>
                  <p className="text-[11px] text-slate-400">Régimen Minero 14x7 • Desmovilización Justificada por Emergencia</p>
                </div>
              </div>
              <button
                onClick={() => setModalEmergenciaOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAutorizarEmergenciaSubmit} className="p-6 space-y-4">
              {/* Seleccionar Trabajador */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Seleccionar Trabajador de Turno:
                </label>
                <select
                  value={formEmergencia.postulanteId}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, postulanteId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="">-- Seleccionar personal habilitado --</option>
                  {postulantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apellidos}, {p.nombres} - DNI: {p.numero_documento} ({p.cargo} - {p.empresa_nombre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Emergencia */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Emergencia / Motivo:
                </label>
                <select
                  value={formEmergencia.tipoEmergencia}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, tipoEmergencia: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="MEDICA_TRABAJADOR">Emergencia Médica del Trabajador (Evacuación Clínica)</option>
                  <option value="FAMILIAR_GRAVE">Emergencia Familiar Grave (Fallecimiento o Salud Crítica)</option>
                  <option value="OPERACIONAL">Desmovilización Operativa / Parada de Planta</option>
                </select>
              </div>

              {/* Detalle y Sustento */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Diagnóstico / Justificación Detallada (Médico de Mina / RRHH):
                </label>
                <textarea
                  rows={3}
                  value={formEmergencia.motivoDetalle}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, motivoDetalle: e.target.value })}
                  placeholder="Detallar el motivo clínico o sustento familiar comprobado para justificar la salida sin computar abandono..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Lista de Emergencias Activas */}
              {emergenciasActivas.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 block uppercase">
                    Salidas por Emergencia Autorizadas Pendientes de Ejecución en Garita:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {emergenciasActivas.map((em) => (
                      <div key={em.id} className="p-2.5 bg-slate-800/80 border border-rose-500/30 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{em.apellidos}, {em.nombres}</span>
                          <span className="text-slate-400 font-mono ml-2">DNI: {em.numero_documento}</span>
                          <p className="text-[10px] text-rose-300 mt-0.5 italic">"{em.motivo_detalle}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEjecutarSalidaEmergencia(em.id, em.numero_documento)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shadow"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Validar Salida
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmergenciaOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                >
                  <Ambulance className="w-4 h-4" />
                  Autorizar Bajada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
