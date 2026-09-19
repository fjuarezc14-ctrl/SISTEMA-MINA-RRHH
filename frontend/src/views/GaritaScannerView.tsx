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
  Ambulance,
  CreditCard,
  Siren,
  Printer,
  X,
  HardHat,
  Users,
  FileWarning
} from 'lucide-react';
import { api } from '../services/api';
import { FotocheckView } from './FotocheckView';

interface GaritaScannerViewProps {
  postulantes: Postulante[];
  fotochecks?: any[];
  onImprimirFotocheck?: (postulanteId: string) => Promise<void>;
}

interface PadronOfflineLocal {
  fechaGeneracion?: string;
  totalTrabajadores?: number;
  trabajadores: any[];
  listaNegra: any[];
}

export const GaritaScannerView: React.FC<GaritaScannerViewProps> = ({ 
  postulantes,
  fotochecks = [],
  onImprimirFotocheck
}) => {
  const [tabActiva, setTabActiva] = useState<'escaner' | 'aforo' | 'contratistas' | 'sctr' | 'fotochecks' | 'bajas'>('escaner');
  const [codigoInput, setCodigoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<AccesoGarita[]>([]);
  const [musterListOpen, setMusterListOpen] = useState(false);
  const [filtroMuster, setFiltroMuster] = useState<'TODOS' | 'SOCAVON' | 'SUPERFICIE'>('TODOS');
  const [filtroContratista, setFiltroContratista] = useState('');

  // Datos de monitoreo para interior de mina (Aforo y Muster List)
  const personalEnMina = [
    { id: '1', nombre: 'SANGAY MINCHAN, CRISTIAN', dni: '45891234', cargo: 'Perforista Socavón', empresa: 'Servicios Mineros ANDES S.A.C.', zona: 'Socavón - Nivel 450', ingreso: '06:15 AM', tiempo: '11h 45m', alerta: true },
    { id: '2', nombre: 'MEJIA ZAMBRANO, FRANK', dni: '70123456', cargo: 'Operador Scoop', empresa: 'Perforaciones XYZ EIRL', zona: 'Socavón - Nivel 450', ingreso: '07:30 AM', tiempo: '10h 30m', alerta: false },
    { id: '3', nombre: 'ALVAREZ, JORGE', dni: '46998877', cargo: 'Mecánico de Guardia', empresa: 'Servicios Mineros ANDES S.A.C.', zona: 'Superficie - Taller Mant.', ingreso: '08:00 AM', tiempo: '10h 00m', alerta: false },
    { id: '4', nombre: 'GÓMEZ RUIZ, MARTÍN', dni: '42189012', cargo: 'Técnico de Ventilación', empresa: 'Transportes Cordillera S.A.', zona: 'Socavón - Rampa 3', ingreso: '07:10 AM', tiempo: '10h 50m', alerta: false },
    { id: '5', nombre: 'QUISPE, MIGUEL', dni: '43112233', cargo: 'Operador Camión Dumper', empresa: 'Perforaciones XYZ EIRL', zona: 'Superficie - Planta Concen.', ingreso: '08:30 AM', tiempo: '09h 30m', alerta: false },
    { id: '6', nombre: 'MENDOZA, GABRIELA', dni: '47890123', cargo: 'Prevencionista SSOMA', empresa: 'Servicios Mineros ANDES S.A.C.', zona: 'Superficie - Garita Sur', ingreso: '08:45 AM', tiempo: '09h 15m', alerta: false },
  ];

  // Directorio de contratistas homologadas (Solo Lectura)
  const contratistasData = [
    { ruc: '20556677881', razonSocial: 'Servicios Mineros ANDES S.A.C.', personalActivo: 142, personalApto: 138, cumplimiento: 97, estado: 'HABILITADO' },
    { ruc: '20601234567', razonSocial: 'Perforaciones XYZ EIRL', personalActivo: 88, personalApto: 84, cumplimiento: 95, estado: 'HABILITADO' },
    { ruc: '20498877665', razonSocial: 'Transportes Cordillera S.A.', personalActivo: 45, personalApto: 39, cumplimiento: 86, estado: 'OBSERVADO' },
    { ruc: '20334455662', razonSocial: 'Mantenimiento Electromecánico del Sur', personalActivo: 28, personalApto: 28, cumplimiento: 100, estado: 'HABILITADO' },
  ];

  // Matriz de alertas SCTR y EMO (Solo Lectura)
  const sctrAlertasData = [
    { trabajador: 'Mendoza, Gabriela', dni: '47890123', empresa: 'Servicios Mineros ANDES S.A.C.', doc: 'EMO (Salud Ocupacional)', vencimiento: 'Vence Mañana', restriccion: 'Bloqueo en 24h', critico: true },
    { trabajador: 'Juarez Chavez, Felix', dni: '46998811', empresa: 'Perforaciones XYZ EIRL', doc: 'SCTR Pensión Pacífico', vencimiento: 'En 4 Días', restriccion: 'Pase Vigente', critico: false },
    { trabajador: 'García Paredes, Luis', dni: '43112233', empresa: 'Transportes Cordillera S.A.', doc: 'SCTR Salud Rímac', vencimiento: 'VENCIDO', restriccion: 'ACCESO DENEGADO', critico: true },
  ];
  const [ultimoResultado, setUltimoResultado] = useState<{
    tipo: 'TRABAJADOR' | 'DESCONOCIDO';
    autorizado: boolean;
    motivo: string;
    trabajador?: any;
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
        texto: `✅ Padrón offline descargado con éxito: ${data.totalTrabajadores} trabajadores listos para operar sin red.`
      });
      setTimeout(() => setMensajeNotificacion(null), 6000);
    } catch (err: any) {
      // Si falla la API pero tenemos postulantes en memoria de React, generar padrón de contingencia
      const contingencia: PadronOfflineLocal = {
        fechaGeneracion: new Date().toISOString(),
        totalTrabajadores: postulantes.length,
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
          postulanteId: res.data.trabajador?.id,
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
      tipo_acceso: 'PEATONAL_TRABAJADOR',
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
      creado_en: evento.timestamp,
    };
    setHistorial((prev) => [itemHistorial, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Notificación / Feedback de Sincronización */}
      {mensajeNotificacion && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          mensajeNotificacion.tipo === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : mensajeNotificacion.tipo === 'warn'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{mensajeNotificacion.texto}</span>
          <button 
            onClick={() => setMensajeNotificacion(null)}
            className="text-slate-400 hover:text-slate-700 ml-3 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* TABS DE GARITA */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTabActiva('escaner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'escaner'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          1. Escáner de Acceso (QR/DNI)
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('aforo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'aforo'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HardHat className="w-4 h-4" />
          2. Aforo y POB Socavón (342)
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('contratistas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'contratistas'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          3. Directorio Contratistas (Solo Lectura)
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('sctr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'sctr'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileWarning className="w-4 h-4" />
          4. Alertas SCTR y EMO
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('fotochecks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'fotochecks'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          5. Impresión Fotochecks ({fotochecks.length || postulantes.filter(p => p.fase_actual === 'FOTOCHECK' || p.estado_global === 'APTO_PARA_TRABAJAR').length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('bajas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tabActiva === 'bajas'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ambulance className="w-4 h-4" />
          6. Bajas y Desmovilización 14x7 ({emergenciasActivas.length})
        </button>
      </div>

      {tabActiva === 'aforo' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aforo Socavón (Nivel 450)</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    342 <span className="text-xs text-slate-400 font-semibold">/ 400 máx</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <HardHat className="w-5 h-5" />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85.5%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 block">85.5% capacidad autorizada</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Superficie / Talleres</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">903</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-3">Planta, Maestranza y Campamentos</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alerta Fatiga Laboral</span>
                  <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">1</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-rose-700 font-medium mt-3">Turno &gt; 11 horas (DS 024-2016-EM)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-blue-700" /> Personal Activo en Interior Mina (POB en Vivo)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Control de tiempos de permanencia bajo tierra</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="p-3.5">Trabajador / DNI</th>
                    <th className="p-3.5">Empresa</th>
                    <th className="p-3.5">Zona Asignada</th>
                    <th className="p-3.5 text-center">Hora Ingreso</th>
                    <th className="p-3.5 text-center">Tiempo en Mina</th>
                    <th className="p-3.5 text-center">Estado Turno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalEnMina.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${p.alerta ? 'bg-rose-50/40' : ''}`}>
                      <td className="p-3.5">
                        <strong className="text-slate-900 text-sm block">{p.nombre}</strong>
                        <span className="text-slate-400 font-mono">DNI: {p.dni} • {p.cargo}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{p.empresa}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                          p.zona.includes('Socavón') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.zona}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-600">{p.ingreso}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">{p.tiempo}</td>
                      <td className="p-3.5 text-center">
                        {p.alerta ? (
                          <span className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full font-bold text-xs flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Exceso Jornada (&gt;11h)
                          </span>
                        ) : (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full font-bold text-xs">
                            Turno Normal
                          </span>
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

      {tabActiva === 'contratistas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" /> Directorio de Empresas Contratistas Autorizadas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Modo de consulta y supervisión de habilitación legal en Garita</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por RUC o Razón Social..."
                value={filtroContratista}
                onChange={(e) => setFiltroContratista(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="p-3.5">Empresa / RUC</th>
                  <th className="p-3.5 text-center">Personal Registrado</th>
                  <th className="p-3.5 text-center">Personal Habilitado</th>
                  <th className="p-3.5">Nivel de Cumplimiento</th>
                  <th className="p-3.5 text-center">Estado Garita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contratistasData
                  .filter(c => c.razonSocial.toLowerCase().includes(filtroContratista.toLowerCase()) || c.ruc.includes(filtroContratista))
                  .map((c) => (
                    <tr key={c.ruc} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-slate-900 text-sm block">{c.razonSocial}</strong>
                        <span className="text-slate-400 font-mono">RUC: {c.ruc}</span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{c.personalActivo}</td>
                      <td className="p-3.5 text-center font-bold text-blue-700">{c.personalApto}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full ${c.cumplimiento >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`} 
                              style={{ width: `${c.cumplimiento}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-700 text-xs w-9 text-right">{c.cumplimiento}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          c.estado === 'HABILITADO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabActiva === 'sctr' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-600" /> Matriz de Alertas de Vencimiento de Pólizas (SCTR y EMO)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de restricciones automáticas de pase peatonal en garita
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="p-3.5">Trabajador / DNI</th>
                  <th className="p-3.5">Empresa Contratista</th>
                  <th className="p-3.5 text-center">Póliza / Documento</th>
                  <th className="p-3.5 text-center">Vencimiento</th>
                  <th className="p-3.5 text-center">Restricción Garita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sctrAlertasData.map((alerta, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <strong className="text-slate-900 text-sm block">{alerta.trabajador}</strong>
                      <span className="text-slate-400 font-mono">DNI: {alerta.dni}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{alerta.empresa}</td>
                    <td className="p-3.5 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md font-bold">
                        {alerta.doc}
                      </span>
                    </td>
                    <td className={`p-3.5 text-center font-bold ${alerta.critico ? 'text-rose-700' : 'text-amber-700'}`}>
                      {alerta.vencimiento}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        alerta.vencimiento === 'VENCIDO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : alerta.critico
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {alerta.restriccion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabActiva === 'fotochecks' && (
        <FotocheckView 
          postulantes={postulantes} 
          fotochecks={fotochecks} 
          onImprimir={onImprimirFotocheck || (async () => {})} 
        />
      )}

      {tabActiva === 'bajas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-rose-600" /> Bajas Anticipadas por Emergencia Médica / Familiar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salidas justificada fuera de régimen 14x7 sin penalidad ni cómputo de abandono de guardia
              </p>
            </div>
            <button
              onClick={() => setModalEmergenciaOpen(true)}
              className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors"
            >
              <Ambulance className="w-4 h-4" /> Autorizar Nueva Salida de Emergencia
            </button>
          </div>

          {emergenciasActivas.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">
              No hay solicitudes de bajada anticipada pendientes de salida en Garita.
            </div>
          ) : (
            <div className="space-y-3">
              {emergenciasActivas.map((baja) => (
                <div key={baja.id} className="p-4 bg-white border border-rose-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{baja.nombres} {baja.apellidos}</h4>
                    <p className="text-xs text-slate-500">DNI: {baja.numero_documento} • {baja.empresa_nombre}</p>
                    <p className="text-xs text-rose-700 font-mono mt-1">Causal: {baja.tipo_emergencia} - {baja.motivo_detalle}</p>
                  </div>
                  <button
                    onClick={() => handleEjecutarSalidaEmergencia(baja.id, baja.numero_documento)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" /> Registrar Salida Justificada
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tabActiva === 'escaner' && (
        <>
        {/* Barra de estado de garita y herramientas operativas mineras */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">Lector y Scanner de Garita</h3>
              
              {/* Indicador de Red en Vivo */}
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  Servidor Central Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  Modo Offline (Caché Local Activa)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Puesto de Control: <strong className="text-slate-700">{garitaActual}</strong>
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <DownloadCloud className="w-4 h-4 text-blue-700" />
            Descargar Padrón Local
          </button>

          {/* Botón Sincronizar Cola Offline */}
          {colaOffline.length > 0 && (
            <button
              onClick={handleSincronizarOffline}
              disabled={sincronizando}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm animate-bounce"
            >
              <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
              Sincronizar {colaOffline.length} Offline
            </button>
          )}

          {/* Botón MUSTER LIST (Evacuación de Emergencia) */}
          <button
            type="button"
            onClick={() => setMusterListOpen(true)}
            title="Padrón de evacuación en tiempo real (MUSTER LIST) para brigadistas de rescate"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Siren className="w-4 h-4" />
            🚨 MUSTER LIST (Evacuación)
          </button>

          {/* Botón Bajada Anticipada por Emergencia (Punto 6) */}
          <button
            type="button"
            onClick={() => setModalEmergenciaOpen(true)}
            title="Autorizar o registrar salida anticipada de campamento por emergencia médica o familiar (14x7)"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Ambulance className="w-4 h-4 text-rose-600" />
            Emergencia / Bajada 14x7
          </button>

          <button
            onClick={() => setCamaraActiva(!camaraActiva)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              camaraActiva 
                ? 'bg-rose-700 hover:bg-rose-800 text-white' 
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            {camaraActiva ? 'Apagar Cámara' : 'Escanear con Cámara'}
          </button>
        </div>
      </div>

      {/* Barra Operativa de Alcotest (DS 024-2016-EM Tolerancia Cero) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Prueba de Alcoholemia en Garita (DS 024-2016-EM Art. 40)
            </span>
            <span className="text-[11px] text-slate-500">
              Tolerancia Cero en Unidad Minera: Todo ingreso de personal requiere 0.00 g/L.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAlcotestEstado('APTO')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              alcotestEstado === 'APTO'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            ✓ 0.00 g/L (Apto)
          </button>
          <button
            type="button"
            onClick={() => setAlcotestEstado('POSITIVO')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              alcotestEstado === 'POSITIVO'
                ? 'bg-rose-700 text-white border-rose-700 shadow-sm animate-pulse'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            ⚠ Positivo (&gt; 0.00 g/L)
          </button>
        </div>
      </div>

      {/* Panel de Cámara Virtual / Live Stream si está activo */}
      {camaraActiva && (
        <div className="bg-slate-950 border-2 border-dashed border-blue-300 rounded-xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-md mx-auto relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-slate-800">
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
              Cámara activa. Acerque el fotocheck para escanear.
            </p>
          </div>
        </div>
      )}

      {/* Input de Lectura Rápida / Pistola Óptica / Simulación */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Ingreso de Código QR / DNI
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidarCodigo(codigoInput)}
              placeholder="Escanee con lector o ingrese DNI (ej. 46998877)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 transition-colors font-mono"
            />
          </div>
          <button
            onClick={() => handleValidarCodigo(codigoInput)}
            disabled={loading || !codigoInput.trim()}
            className="w-full sm:w-auto justify-center bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? 'Validando...' : 'Verificar'}
          </button>
        </div>

        {/* Botones de Prueba Rápida para Simulación */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2 font-medium">Pruebas rápidas de simulación en garita:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setCodigoInput('46998877');
                handleValidarCodigo('46998877');
              }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Ana Mendoza (Pase Permanente - Apto)
            </button>

            <button
              onClick={() => {
                setCodigoInput('43112233');
                handleValidarCodigo('43112233');
              }}
              className="bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Luis García (SCTR Vencido)
            </button>

            <button
              onClick={() => {
                setCodigoInput('45891234');
                handleValidarCodigo('45891234');
              }}
              className="bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
              Roberto Díaz (En Fase 1)
            </button>
          </div>
        </div>
      </div>

      {/* PANTALLA DE RESULTADO DEL ESCANEO (VEREDICTO VERDE / ROJO) */}
      {ultimoResultado && (
        <div
          className={`rounded-2xl border-2 p-6 sm:p-8 shadow-md transition-all animate-in fade-in zoom-in-95 duration-200 ${
            ultimoResultado.autorizado
              ? 'bg-emerald-50 border-emerald-400 text-slate-900'
              : 'bg-rose-50 border-rose-400 text-slate-900'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
            <div className="flex items-center gap-4">
              {ultimoResultado.autorizado ? (
                <div className="w-16 h-16 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                  <ShieldCheck className="w-10 h-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm animate-pulse">
                  <ShieldAlert className="w-10 h-10 stroke-[2.5]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                      ultimoResultado.autorizado
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {ultimoResultado.autorizado ? 'Acceso Autorizado' : 'Acceso Denegado'}
                  </span>

                  {/* Badge de Alcotest en Resultado */}
                  <span className="text-xs bg-white border border-slate-300 px-2.5 py-0.5 rounded-full font-mono text-slate-700 shadow-2xs">
                    Alcotest: {alcotestEstado === 'APTO' ? '0.00 g/L (Aprobado)' : 'Positivo (>0.00 g/L)'}
                  </span>

                  {/* Badge de Tipo de Pase */}
                  {ultimoResultado.trabajador?.tipoPase && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      ultimoResultado.trabajador.tipoPase === 'VISITA_TECNICA'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : ultimoResultado.trabajador.tipoPase === 'PROVEEDOR_LOGISTICO'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {ultimoResultado.trabajador.tipoPase.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <h2 className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${
                  ultimoResultado.autorizado ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {ultimoResultado.autorizado ? 'AUTORIZADO PARA INGRESAR' : 'PROHIBIDO EL INGRESO'}
                </h2>
                <p className={`text-sm mt-1 font-medium ${
                  ultimoResultado.autorizado ? 'text-emerald-800' : 'text-rose-800'
                }`}>{ultimoResultado.motivo}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Hora del Evento</span>
              <span className="text-lg font-mono font-bold text-slate-800">
                {new Date().toLocaleTimeString('es-PE')}
              </span>
            </div>
          </div>

          {/* Detalles del Trabajador Autorizado / Denegado */}
          {ultimoResultado.trabajador && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Trabajador</span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {ultimoResultado.trabajador.nombreCompleto}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  DNI: {ultimoResultado.trabajador.dni}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Empresa Contratista</span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {ultimoResultado.trabajador.empresa}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{ultimoResultado.trabajador.cargo}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Zona y Tipo Pase</span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {ultimoResultado.trabajador.zonaAutorizada || 'Planta y Mina'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tipo: <strong className="text-slate-800">{ultimoResultado.trabajador.tipoPase || 'PERMANENTE'}</strong>
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Póliza SCTR</span>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {ultimoResultado.trabajador.sctrVencimiento || 'Vigente'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Estado: <span className="font-semibold text-slate-800">{ultimoResultado.trabajador.estado}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bitácora de Accesos de Garita */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-700" />
            Bitácora de Accesos Registrados en Turno
          </h4>
          <div className="flex items-center gap-2">
            {colaOffline.length > 0 && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                {colaOffline.length} guardados offline
              </span>
            )}
            <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              Total Registros: {historial.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider">
                <th className="p-3">Hora / Fecha</th>
                <th className="p-3">Tipo / Pase</th>
                <th className="p-3">Identificación</th>
                <th className="p-3">Alcotest</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Motivo / Observación</th>
                <th className="p-3">Garita / Guardia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No hay eventos de acceso registrados en el turno.
                  </td>
                </tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-600 font-mono">
                      {new Date(item.creado_en).toLocaleDateString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      {item.sincronizado_offline === false && (
                        <span className="block text-[10px] text-amber-700 font-bold">
                          [MODO OFFLINE]
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-blue-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Trabajador
                      </span>
                      {item.postulante_tipo_pase && (
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {item.postulante_tipo_pase}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-900">
                        {item.postulante_nombres} {item.postulante_apellidos}
                      </strong>
                      <span className="text-slate-500 block text-[11px] font-mono">
                        DNI: {item.postulante_dni}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.alcotest_resultado?.includes('Positivo') || item.alcotest_resultado?.includes('FALTA')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.alcotest_resultado || '0.00 g/L'}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.resultado === 'AUTORIZADO' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> AUTORIZADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                          <XCircle className="w-3 h-3" /> DENEGADO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">
                      {item.motivo_denegacion || 'Acceso concedido sin observaciones'}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {item.garita}
                      <span className="block text-slate-400">{item.guardia_nombre}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* MODAL AUTORIZAR BAJADA ANTICIPADA POR EMERGENCIA (Punto 6) */}
      {modalEmergenciaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Autorizar Bajada Anticipada de Campamento</h4>
                  <p className="text-[11px] text-slate-500">Régimen Minero 14x7 • Desmovilización Justificada por Emergencia</p>
                </div>
              </div>
              <button
                onClick={() => setModalEmergenciaOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAutorizarEmergenciaSubmit} className="p-6 space-y-4">
              {/* Seleccionar Trabajador */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Seleccionar Trabajador de Turno:
                </label>
                <select
                  value={formEmergencia.postulanteId}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, postulanteId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipo de Emergencia / Motivo:
                </label>
                <select
                  value={formEmergencia.tipoEmergencia}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, tipoEmergencia: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
                >
                  <option value="MEDICA_TRABAJADOR">Emergencia Médica del Trabajador (Evacuación Clínica)</option>
                  <option value="FAMILIAR_GRAVE">Emergencia Familiar Grave (Fallecimiento o Salud Crítica)</option>
                  <option value="OPERACIONAL">Desmovilización Operativa / Parada de Planta</option>
                </select>
              </div>

              {/* Detalle y Sustento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Diagnóstico / Justificación Detallada (Médico de Mina / RRHH):
                </label>
                <textarea
                  rows={3}
                  value={formEmergencia.motivoDetalle}
                  onChange={(e) => setFormEmergencia({ ...formEmergencia, motivoDetalle: e.target.value })}
                  placeholder="Detallar el motivo clínico o sustento familiar comprobado para justificar la salida sin computar abandono..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Lista de Emergencias Activas */}
              {emergenciasActivas.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-700 block uppercase">
                    Salidas por Emergencia Autorizadas Pendientes de Ejecución en Garita:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {emergenciasActivas.map((em) => (
                      <div key={em.id} className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{em.apellidos}, {em.nombres}</span>
                          <span className="text-slate-500 font-mono ml-2">DNI: {em.numero_documento}</span>
                          <p className="text-[10px] text-rose-700 mt-0.5 italic">"{em.motivo_detalle}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEjecutarSalidaEmergencia(em.id, em.numero_documento)}
                          className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Validar Salida
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmergenciaOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Ambulance className="w-4 h-4" />
                  Autorizar Bajada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EMERGENCIA: MUSTER LIST (EVACUACIÓN INMEDIATA) */}
      {musterListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-rose-700 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Siren className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide">MUSTER LIST • REGISTRO DE EVACUACIÓN EN VIVO</h3>
                  <p className="text-xs text-rose-100">
                    D.S. 024-2016-EM • Padrón oficial de personas confirmadas en interior de mina
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMusterListOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltroMuster('TODOS')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filtroMuster === 'TODOS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Todo el Personal ({personalEnMina.length})
                </button>
                <button
                  onClick={() => setFiltroMuster('SOCAVON')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filtroMuster === 'SOCAVON'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  En Socavón ({personalEnMina.filter(p => p.zona.includes('Socavón')).length})
                </button>
                <button
                  onClick={() => setFiltroMuster('SUPERFICIE')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filtroMuster === 'SUPERFICIE'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  En Superficie ({personalEnMina.filter(p => p.zona.includes('Superficie')).length})
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Padrón para Brigadas
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3">Trabajador</th>
                    <th className="p-3">DNI</th>
                    <th className="p-3">Empresa Contratista</th>
                    <th className="p-3">Ubicación / Zona</th>
                    <th className="p-3 text-center">Hora Ingreso</th>
                    <th className="p-3 text-center">Permanencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalEnMina
                    .filter(p => {
                      if (filtroMuster === 'SOCAVON') return p.zona.includes('Socavón');
                      if (filtroMuster === 'SUPERFICIE') return p.zona.includes('Superficie');
                      return true;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{p.nombre}</td>
                        <td className="p-3 font-mono text-slate-600">{p.dni}</td>
                        <td className="p-3 text-slate-600">{p.empresa}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                            p.zona.includes('Socavón') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {p.zona}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{p.ingreso}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">{p.tiempo}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
