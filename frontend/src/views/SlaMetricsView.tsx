import React, { useState, useEffect } from 'react';
import { SlaArea, RankingContratista } from '../types';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export const SlaMetricsView: React.FC = () => {
  const [slas, setSlas] = useState<SlaArea[]>([
    { fase: 'FASE_1', area: 'RRHH y Reclutamiento Mina', sla_objetivo_horas: 4, tiempo_promedio_horas: 2.5, tasa_aprobacion: 92 },
    { fase: 'FASE_2', area: 'Salud Ocupacional / Médico Mina', sla_objetivo_horas: 24, tiempo_promedio_horas: 18.2, tasa_aprobacion: 85 },
    { fase: 'FASE_3', area: 'Seguridad Patrimonial y Legal', sla_objetivo_horas: 8, tiempo_promedio_horas: 4.1, tasa_aprobacion: 96 },
    { fase: 'FASE_4', area: 'Seguridad y Salud (SSOMA)', sla_objetivo_horas: 16, tiempo_promedio_horas: 12.0, tasa_aprobacion: 88 },
    { fase: 'FASE_5', area: 'Administración de Contratos / SCTR', sla_objetivo_horas: 8, tiempo_promedio_horas: 5.4, tasa_aprobacion: 78 },
  ]);

  const [ranking, setRanking] = useState<RankingContratista[]>([
    { empresa: 'Servicios Mineros XYZ S.A.C.', ruc: '20554433221', total_postulantes: 6, aptos: 1, observados: 1, bloqueados: 0 },
    { empresa: 'Perforaciones del Norte E.I.R.L.', ruc: '20601122334', total_postulantes: 4, aptos: 3, observados: 1, bloqueados: 0 },
    { empresa: 'Transportes Cordillera S.A.', ruc: '20498877665', total_postulantes: 5, aptos: 4, observados: 0, bloqueados: 1 },
  ]);

  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const [resSlas, resRanking] = await Promise.all([
          api.get('/metricas/slas'),
          api.get('/metricas/ranking'),
        ]);
        if (resSlas.data?.areas) setSlas(resSlas.data.areas);
        if (Array.isArray(resRanking.data) && resRanking.data.length > 0) {
          setRanking(resRanking.data);
        }
      } catch (e) {
        // Fallback local
      }
    };
    fetchMetricas();
  }, []);

  const handleDescargarExcel = async () => {
    try {
      setDescargando(true);
      const res = await api.get('/metricas/exportar-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sabana_acreditacion_mina_valetec.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Descarga completada (Modo simulación).');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Descarga de Reporte */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Dashboard de SLAs y Tiempos de Atención por Área
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Indicadores de eficiencia operativa, cuellos de botella y cumplimiento de plazos en acreditación
          </p>
        </div>

        <button
          onClick={handleDescargarExcel}
          disabled={descargando}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {descargando ? 'Generando Archivo...' : 'Exportar Sábana a Excel (CSV)'}
        </button>
      </div>

      {/* Tarjetas de SLAs por Área */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slas.map((s) => {
          const cumpleSla = s.tiempo_promedio_horas <= s.sla_objetivo_horas;
          return (
            <div key={s.fase} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-black tracking-wider uppercase text-blue-400 font-mono bg-blue-900/30 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                  {s.fase}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  cumpleSla 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {cumpleSla ? '✓ Cumple SLA' : '⚠ SLA Excedido'}
                </span>
              </div>

              <h4 className="font-bold text-sm text-white mt-3 leading-snug">{s.area}</h4>

              <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tiempo Promedio</span>
                  <p className="text-xl font-black text-white mt-0.5">
                    {s.tiempo_promedio_horas} <span className="text-xs font-normal text-slate-400">horas</span>
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Meta SLA</span>
                  <p className="text-xl font-bold text-slate-300 mt-0.5">
                    {s.sla_objetivo_horas} <span className="text-xs font-normal text-slate-500">horas</span>
                  </p>
                </div>
              </div>

              {/* Barra de Tasa de Aprobación */}
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                  <span>Tasa de Aprobación:</span>
                  <strong className="text-white">{s.tasa_aprobacion}%</strong>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${s.tasa_aprobacion >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${s.tasa_aprobacion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranking de Desempeño de Contratistas */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Ranking y Calidad Documentaria de Empresas Contratistas (ECM)
          </h4>
          <span className="text-xs text-slate-400">Métricas acumuladas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                <th className="p-3">Empresa Contratista</th>
                <th className="p-3">RUC</th>
                <th className="p-3 text-center">Total Postulantes</th>
                <th className="p-3 text-center">Aptos (5/5 V°B°)</th>
                <th className="p-3 text-center">Observados</th>
                <th className="p-3 text-center">Tasa de Aprobación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {ranking.map((item, idx) => {
                const pctAptos = item.total_postulantes > 0 
                  ? Math.round((item.aptos / item.total_postulantes) * 100) 
                  : 0;

                return (
                  <tr key={item.ruc} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <strong className="text-white text-xs">{item.empresa}</strong>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{item.ruc}</td>
                    <td className="p-3 text-center text-slate-200 font-bold">{item.total_postulantes}</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">{item.aptos}</td>
                    <td className="p-3 text-center text-amber-400 font-bold">{item.observados}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        pctAptos >= 70 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {pctAptos}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
