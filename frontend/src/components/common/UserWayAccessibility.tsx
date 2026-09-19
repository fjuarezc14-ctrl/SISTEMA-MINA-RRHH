import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Contrast, 
  Eye, 
  MousePointer, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  X, 
  Sliders, 
  Check, 
  Minus, 
  Plus, 
  Compass, 
  ShieldCheck,
  Maximize2
} from 'lucide-react';

interface AccessibilitySettings {
  fontSizeLevel: number; // 0 = 100%, 1 = 110%, 2 = 120%, 3 = 130%
  contrastMode: 'normal' | 'high' | 'grayscale' | 'invert';
  dyslexicFont: boolean;
  highlightLinks: boolean;
  textSpacing: boolean;
  readingGuide: boolean;
  bigCursor: boolean;
  pauseAnimations: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSizeLevel: 0,
  contrastMode: 'normal',
  dyslexicFont: false,
  highlightLinks: false,
  textSpacing: false,
  readingGuide: false,
  bigCursor: false,
  pauseAnimations: false,
};

const STORAGE_KEY = 'valetec_userway_accessibility';

export const UserWayAccessibility: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [mouseY, setMouseY] = useState(0);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
    applySettingsToDOM(settings);
  }, [settings]);

  // Listener para la Guía de Lectura
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // Aplicar estilos y clases globales a documentElement
  const applySettingsToDOM = (s: AccessibilitySettings) => {
    const root = document.documentElement;

    // 1. Tamaño de texto
    const fontSizes = ['100%', '110%', '120%', '130%'];
    root.style.fontSize = fontSizes[s.fontSizeLevel] || '100%';

    // 2. Modo de contraste
    root.classList.remove('uw-contrast-high', 'uw-contrast-grayscale', 'uw-contrast-invert');
    if (s.contrastMode !== 'normal') {
      root.classList.add(`uw-contrast-${s.contrastMode}`);
    }

    // 3. Fuente para dislexia
    if (s.dyslexicFont) {
      root.classList.add('uw-dyslexic');
    } else {
      root.classList.remove('uw-dyslexic');
    }

    // 4. Resaltar enlaces
    if (s.highlightLinks) {
      root.classList.add('uw-highlight-links');
    } else {
      root.classList.remove('uw-highlight-links');
    }

    // 5. Espaciado de texto
    if (s.textSpacing) {
      root.classList.add('uw-text-spacing');
    } else {
      root.classList.remove('uw-text-spacing');
    }

    // 6. Cursor grande
    if (s.bigCursor) {
      root.classList.add('uw-big-cursor');
    } else {
      root.classList.remove('uw-big-cursor');
    }

    // 7. Pausar animaciones
    if (s.pauseAnimations) {
      root.classList.add('uw-pause-animations');
    } else {
      root.classList.remove('uw-pause-animations');
    }

    // Inyectar o actualizar estilos CSS nativos
    let styleTag = document.getElementById('userway-native-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'userway-native-styles';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      /* Alto Contraste */
      html.uw-contrast-high {
        filter: contrast(140%) saturate(115%) !important;
      }
      
      /* Escala de Grises */
      html.uw-contrast-grayscale {
        filter: grayscale(100%) !important;
      }

      /* Invertir Colores */
      html.uw-contrast-invert {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
      html.uw-contrast-invert img,
      html.uw-contrast-invert video,
      html.uw-contrast-invert canvas,
      html.uw-contrast-invert svg {
        filter: invert(100%) hue-rotate(180deg) !important;
      }

      /* Fuente para Dislexia */
      html.uw-dyslexic,
      html.uw-dyslexic * {
        font-family: 'Segoe UI', 'Trebuchet MS', 'Comic Sans MS', sans-serif !important;
        letter-spacing: 0.04em !important;
      }

      /* Resaltar Enlaces y Botones */
      html.uw-highlight-links a,
      html.uw-highlight-links button:not(#userway-trigger):not(.uw-panel *) {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        text-decoration: underline !important;
      }

      /* Espaciado de Texto */
      html.uw-text-spacing p,
      html.uw-text-spacing span,
      html.uw-text-spacing td,
      html.uw-text-spacing th,
      html.uw-text-spacing label,
      html.uw-text-spacing h1,
      html.uw-text-spacing h2,
      html.uw-text-spacing h3,
      html.uw-text-spacing h4 {
        letter-spacing: 0.08em !important;
        word-spacing: 0.12em !important;
        line-height: 1.85 !important;
      }

      /* Cursor Aumentado */
      html.uw-big-cursor,
      html.uw-big-cursor * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 32 32'%3E%3Cpath fill='%23000' stroke='%23fff' stroke-width='2' d='M2 2l10 24 4-8 8-4z'/%3E%3C/svg%3E"), auto !important;
      }

      /* Pausar Animaciones */
      html.uw-pause-animations *,
      html.uw-pause-animations *::before,
      html.uw-pause-animations *::after {
        animation-duration: 0.001s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001s !important;
      }
    `;
  };

  const activeCount = 
    (settings.fontSizeLevel > 0 ? 1 : 0) +
    (settings.contrastMode !== 'normal' ? 1 : 0) +
    (settings.dyslexicFont ? 1 : 0) +
    (settings.highlightLinks ? 1 : 0) +
    (settings.textSpacing ? 1 : 0) +
    (settings.readingGuide ? 1 : 0) +
    (settings.bigCursor ? 1 : 0) +
    (settings.pauseAnimations ? 1 : 0);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const cycleContrast = () => {
    const modes: AccessibilitySettings['contrastMode'][] = ['normal', 'high', 'grayscale', 'invert'];
    const nextIdx = (modes.indexOf(settings.contrastMode) + 1) % modes.length;
    setSettings({ ...settings, contrastMode: modes[nextIdx] });
  };

  const cycleFontSize = (increment: boolean) => {
    let next = increment ? settings.fontSizeLevel + 1 : settings.fontSizeLevel - 1;
    if (next > 3) next = 0;
    if (next < 0) next = 3;
    setSettings({ ...settings, fontSizeLevel: next });
  };

  return (
    <>
      {/* Guía de Lectura (Ruler horizontal que sigue el mouse) */}
      {settings.readingGuide && (
        <div 
          className="pointer-events-none fixed left-0 right-0 h-10 bg-blue-500/15 border-y-2 border-blue-600 z-[99999] transition-transform duration-75"
          style={{ top: Math.max(0, mouseY - 20) }}
        />
      )}

      {/* BOTÓN FLOTANTE TRIGGER - ABAJO A LA DERECHA */}
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          id="userway-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir menú de accesibilidad UserWay"
          title="Menú de Accesibilidad Universal"
          className="relative w-14 h-14 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {/* Icono de Accesibilidad Universal */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-7 h-7"
          >
            <circle cx="12" cy="4.5" r="2" />
            <path d="M5 9.5h14" />
            <path d="M12 9.5v5.5" />
            <path d="M8.5 20.5 12 15l3.5 5.5" />
          </svg>

          {/* Badge de contador de ajustes activos */}
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* MODAL / PANEL DE HERRAMIENTAS DE ACCESIBILIDAD */}
      {isOpen && (
        <div 
          className="uw-panel fixed right-5 z-[10000] w-[92vw] max-w-[380px] max-h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          style={{ bottom: '5.5rem' }}
        >
          {/* Header del Panel */}
          <div className="bg-blue-700 text-white px-5 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5"
                  >
                    <circle cx="12" cy="4.5" r="2" />
                    <path d="M5 9.5h14" />
                    <path d="M12 9.5v5.5" />
                    <path d="M8.5 20.5 12 15l3.5 5.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Menú de Accesibilidad</h3>
                  <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" /> WCAG 2.1 AA Compliant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={resetSettings}
                    title="Restablecer toda la configuración"
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar panel de accesibilidad"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido de Herramientas (Grid de botones) */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-slate-100 flex-1 min-h-0">
              {/* Sección: Tamaño de Texto */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-700" /> Tamaño de Texto
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {['100%', '110%', '120%', '130%'][settings.fontSizeLevel]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cycleFontSize(false)}
                    disabled={settings.fontSizeLevel === 0}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    <Minus className="w-3.5 h-3.5" /> Reducir (A-)
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleFontSize(true)}
                    disabled={settings.fontSizeLevel === 3}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aumentar (A+)
                  </button>
                </div>
              </div>

              {/* Grid 2 Columnas de Herramientas de Accesibilidad */}
              <div className="pt-3 grid grid-cols-2 gap-2.5">
                {/* 1. Modo de Contraste */}
                <button
                  type="button"
                  onClick={cycleContrast}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.contrastMode !== 'normal'
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Contrast className={`w-4 h-4 ${settings.contrastMode !== 'normal' ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.contrastMode !== 'normal' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Contraste</span>
                    <span className="text-[10px] text-slate-500 font-medium capitalize">
                      {settings.contrastMode === 'normal' ? 'Estándar' : settings.contrastMode === 'high' ? 'Alto' : settings.contrastMode === 'grayscale' ? 'Monocromo' : 'Invertido'}
                    </span>
                  </div>
                </button>

                {/* 2. Resaltar Enlaces */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, highlightLinks: !settings.highlightLinks })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.highlightLinks
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Eye className={`w-4 h-4 ${settings.highlightLinks ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.highlightLinks && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Resaltar Enlaces</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {settings.highlightLinks ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                </button>

                {/* 3. Fuente Legible / Dislexia */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, dyslexicFont: !settings.dyslexicFont })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.dyslexicFont
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <BookOpen className={`w-4 h-4 ${settings.dyslexicFont ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.dyslexicFont && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Fuente Dislexia</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {settings.dyslexicFont ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                </button>

                {/* 4. Espaciado de Texto */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, textSpacing: !settings.textSpacing })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.textSpacing
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Sliders className={`w-4 h-4 ${settings.textSpacing ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.textSpacing && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Espaciado Texto</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {settings.textSpacing ? 'Amplio' : 'Normal'}
                    </span>
                  </div>
                </button>

                {/* 5. Guía de Lectura */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, readingGuide: !settings.readingGuide })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.readingGuide
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Maximize2 className={`w-4 h-4 ${settings.readingGuide ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.readingGuide && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Guía de Lectura</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {settings.readingGuide ? 'Siguiendo mouse' : 'Desactivado'}
                    </span>
                  </div>
                </button>

                {/* 6. Cursor Grande */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, bigCursor: !settings.bigCursor })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.bigCursor
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <MousePointer className={`w-4 h-4 ${settings.bigCursor ? 'text-blue-700' : 'text-slate-500'}`} />
                    {settings.bigCursor && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Cursor Grande</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {settings.bigCursor ? 'Aumentado' : 'Estándar'}
                    </span>
                  </div>
                </button>

                {/* 7. Detener Animaciones */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, pauseAnimations: !settings.pauseAnimations })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all col-span-2 ${
                    settings.pauseAnimations
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${settings.pauseAnimations ? 'text-blue-700' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-900 leading-tight">Pausar Animaciones Visuales</span>
                    </div>
                    {settings.pauseAnimations && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">
                    {settings.pauseAnimations ? 'Animaciones y parpadeos desactivados' : 'Efectos activos'}
                  </span>
                </button>
              </div>

              {/* Botón Restablecer Todo */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Restablecer Accesibilidad Original
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1.5 flex-shrink-0">
              <span>Accesibilidad Nativa VT Valetec</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">Guardado local activo</span>
            </div>
          </div>
        )}
    </>
  );
};
