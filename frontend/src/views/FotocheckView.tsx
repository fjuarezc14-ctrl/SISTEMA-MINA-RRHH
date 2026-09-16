import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Postulante, Fotocheck } from '../types';
import { BadgeCheck, Printer, Shield, HardHat, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FotocheckProps {
  postulantes: Postulante[];
  fotochecks: Fotocheck[];
  onImprimir: (postulanteId: string) => Promise<void>;
}

export const FotocheckView: React.FC<FotocheckProps> = ({ postulantes, fotochecks, onImprimir }) => {
  // Solo personal con credencial ya generada por backend (fotocheck real, pendiente de impresión)
  // y con condición vigente de APTO PARA TRABAJAR puede imprimir su fotocheck.
  const candidatosAptos = postulantes.filter((p) => {
    const esApto = p.estado_global === 'APTO_PARA_TRABAJAR' || p.estado_global === 'APROBADO_TOTAL';
    const tieneFotocheckGenerado = fotochecks.some((f) => f.postulante_id === p.id);
    return esApto && tieneFotocheckGenerado;
  });

  const [selectedId, setSelectedId] = useState<string | null>(candidatosAptos[0]?.id ?? null);

  useEffect(() => {
    if (!candidatosAptos.some((c) => c.id === selectedId)) {
      setSelectedId(candidatosAptos[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postulantes, fotochecks]);

  const selectedCandidate = candidatosAptos.find((c) => c.id === selectedId) || null;
  const selectedFotocheck = selectedCandidate
    ? fotochecks.find((f) => f.postulante_id === selectedCandidate.id) || null
    : null;

  const [impresoSuccess, setImpresoSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!selectedCandidate || !selectedFotocheck) return;
    try {
      setLoading(true);
      await onImprimir(selectedCandidate.id);
      setImpresoSuccess(true);
      setTimeout(() => setImpresoSuccess(false), 3000);
      window.print();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al imprimir credencial. La credencial no fue emitida.');
    } finally {
      setLoading(false);
    }
  };

  if (candidatosAptos.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col items-center justify-center text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-3 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No hay credenciales pendientes de impresión</h3>
        <p className="text-slate-400 text-sm max-w-md mt-1">
          Aquí solo aparecen trabajadores con los <span className="text-emerald-400 font-semibold">5 Vistos Buenos de Área</span> confirmados
          y con un fotocheck ya generado por el sistema. Ningún registro pendiente en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col items-center justify-center text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 text-emerald-400">
          <BadgeCheck className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight">Emisión de Fotocheck y Habilitación de Garita</h3>
        <p className="text-slate-400 text-sm max-w-md mt-1 mb-6">
          Trabajadores que han obtenido los <span className="text-emerald-400 font-bold">5 Vistos Buenos de Área</span> y cuentan con la condición oficial de <span className="text-emerald-400 font-bold">APTO PARA TRABAJAR</span>.
        </p>

        {/* SELECTOR DE CANDIDATO APTO */}
        <div className="mb-6 w-full max-w-xs text-left">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Seleccionar Trabajador Acreditado:
          </label>
          <select
            value={selectedCandidate?.id ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
          >
            {candidatosAptos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.apellidos}, {c.nombres} ({c.cargo})
              </option>
            ))}
          </select>
        </div>

        {selectedCandidate && selectedFotocheck && (
          <>
            {/* PREVIEW DEL FOTOCHECK FÍSICO */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-700 rounded-2xl p-6 w-84 shadow-2xl text-left relative overflow-hidden mb-6">
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-500" />

              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">UNIDAD MINERA</span>
                  <h4 className="text-sm font-black text-white">VT ONBOARDING</h4>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  APTO PARA TRABAJAR
                </div>
              </div>

              <div className="py-4 flex gap-4 items-center">
                <div className="w-20 h-24 bg-slate-800 border border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 flex-shrink-0">
                  <HardHat className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-[9px] font-semibold">FOTO MINA</span>
                </div>

                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-white leading-tight">
                    {selectedCandidate.apellidos}
                  </h5>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedCandidate.nombres}
                  </p>
                  <p className="text-[11px] text-blue-400 font-semibold pt-1">
                    {selectedCandidate.cargo}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Doc: {selectedCandidate.numero_documento}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[10px] space-y-1 text-slate-400 mb-3">
                <div className="flex justify-between">
                  <span>Empresa ECM:</span>
                  <span className="text-white font-medium">{selectedCandidate.empresa_nombre || selectedFotocheck.empresa_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grupo Sanguíneo:</span>
                  <span className="text-rose-400 font-bold">{selectedCandidate.grupo_sanguineo || selectedFotocheck.grupo_sanguineo || 'O+'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zona Autorizada:</span>
                  <span className="text-emerald-400 font-semibold">{selectedFotocheck.zona_autorizada}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credencial:</span>
                  <span className="text-white font-mono">{selectedFotocheck.codigo_credencial}</span>
                </div>
              </div>

              {/* 5 VISTOS BUENOS VERIFICADOS */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 text-[9px] text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 5 V°B° Acreditados
                </span>
                <span className="font-mono text-emerald-400">RRHH • EMO • POL • SSOMA • SCTR</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                    <QRCodeSVG value={selectedFotocheck.codigo_qr} size={48} level="H" />
                  </div>
                  <div className="text-[8px] text-slate-500">
                    <span>HABILITADO EN GARITA</span>
                    <br />
                    <span className="font-mono">{selectedFotocheck.codigo_qr}</span>
                  </div>
                </div>
                <Shield className="w-6 h-6 text-emerald-500/50" />
              </div>
            </div>

            {impresoSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Fotocheck enviado a impresora credencial y garita activada.
              </div>
            )}

            <button
              onClick={handlePrint}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 text-base transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              {loading ? 'Procesando...' : `Imprimir Fotocheck Oficial de ${selectedCandidate.apellidos}, ${selectedCandidate.nombres}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
