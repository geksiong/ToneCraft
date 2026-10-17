import React, { useRef, useState } from 'react';
import { NamModelConfig, IrCabinetConfig } from '../types/pedal';
import { BUILT_IN_NAM_MODELS, parseNamJson, isNamModelProfile } from '../audio/namModels';
import { BUILT_IN_IR_CABINETS } from '../audio/irData';
import { RotaryKnob } from './RotaryKnob';
import {
  Upload,
  Cpu,
  Radio,
  Sliders,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Speaker
} from 'lucide-react';

interface AmpCabSectionProps {
  namModel: NamModelConfig;
  irCabinet: IrCabinetConfig;
  onUpdateNam: (updated: NamModelConfig) => void;
  onUpdateCab: (updated: IrCabinetConfig) => void;
  onLoadCustomIrWav: (buffer: ArrayBuffer, fileName: string) => void;
  ampEngineMode?: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  onSetAmpEngineMode?: (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => void;
  onOpenLatencyInspector?: () => void;
  currentLatencyMs?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Backward compatibility props
  isAmpCollapsed?: boolean;
  isCabCollapsed?: boolean;
  onToggleAmpCollapse?: () => void;
  onToggleCabCollapse?: () => void;
}

export const AmpCabSection: React.FC<AmpCabSectionProps> = ({
  namModel,
  irCabinet,
  onUpdateNam,
  onUpdateCab,
  onLoadCustomIrWav,
  ampEngineMode = 'wasm-nam',
  onSetAmpEngineMode,
  onOpenLatencyInspector,
  currentLatencyMs,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
  isAmpCollapsed,
  isCabCollapsed,
  onToggleAmpCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed =
    controlledCollapsed !== undefined
      ? controlledCollapsed
      : (isAmpCollapsed !== undefined ? isAmpCollapsed : internalCollapsed);
  const toggleCollapse =
    controlledToggleCollapse ||
    onToggleAmpCollapse ||
    (() => setInternalCollapsed(prev => !prev));

  const namFileInputRef = useRef<HTMLInputElement>(null);
  const irFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectNam = (id: string) => {
    const selected = BUILT_IN_NAM_MODELS.find(m => m.id === id);
    if (selected) {
      const isSelectedNam = isNamModelProfile(selected);
      const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isSelectedNam
        ? 'wasm-nam'
        : (selected.engineMode && selected.engineMode !== 'wasm-nam' ? selected.engineMode : 'hd-triode');

      onUpdateNam({
        ...selected,
        gain: selected.gain,
        bass: selected.bass,
        mid: selected.mid,
        treble: selected.treble,
        presence: selected.presence,
        master: selected.master,
        isRealNam: isSelectedNam,
        engineMode: targetEngine,
        bypassed: namModel.bypassed
      });
      if (onSetAmpEngineMode) {
        onSetAmpEngineMode(targetEngine);
      }
    }
  };

  const handleSelectCab = (id: string) => {
    const selected = BUILT_IN_IR_CABINETS.find(c => c.id === id);
    if (selected) {
      onUpdateCab({
        ...selected,
        micDistance: selected.micDistance ?? irCabinet.micDistance,
        lowCut: selected.lowCut ?? irCabinet.lowCut,
        highCut: selected.highCut ?? irCabinet.highCut,
        bypassed: irCabinet.bypassed
      });
    }
  };

  const handleNamFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseNamJson(text, file.name);

      const customNam: NamModelConfig = {
        id: `custom-nam-${Date.now()}`,
        name: parsed.name,
        category: 'Guitar',
        description: `Custom neural weights model loaded from ${file.name}.`,
        type: parsed.architecture,
        gain: 6.5,
        bass: 5.5,
        mid: 6.0,
        treble: 6.5,
        presence: 6.0,
        master: 7.0,
        saturationCurve: 3.5,
        bias: 0.1,
        customProfileName: file.name,
        weightsCount: parsed.weightsCount,
        rawJson: parsed.rawJson || text,
        isRealNam: true,
        engineMode: 'wasm-nam',
        bypassed: namModel.bypassed
      };

      onUpdateNam(customNam);
      if (onSetAmpEngineMode) {
        onSetAmpEngineMode('wasm-nam');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleIrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        onLoadCustomIrWav(buffer, file.name);

        const customCab: IrCabinetConfig = {
          id: `custom-ir-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Guitar',
          description: `Custom acoustic impulse response decoded from ${file.name}.`,
          speakerType: `Custom Acoustic IR (${file.name})`,
          micDistance: 35,
          highCut: 7500,
          lowCut: 75,
          isCustom: true,
          customFileName: file.name,
          isRealWav: true,
          bypassed: irCabinet.bypassed
        };

        onUpdateCab(customCab);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const isNamProfile = isNamModelProfile(namModel);

  const toggleAmpBypass = () => {
    onUpdateNam({
      ...namModel,
      bypassed: !namModel.bypassed
    });
  };

  const toggleCabBypass = () => {
    onUpdateCab({
      ...irCabinet,
      bypassed: !irCabinet.bypassed
    });
  };

  return (
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-2.5 sm:p-3.5 my-2 transition-all duration-200">
      {/* ========================================================================= */}
      {/* UNIFIED HEADER BAR FOR THE COMBINED AMP & CAB STAGE                       */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-800">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Dual Status LEDs: Amp (Emerald) & Cab (Sky Blue) */}
          <div className="flex items-center gap-1.5 shrink-0 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                namModel.bypassed
                  ? 'bg-neutral-700'
                  : 'bg-emerald-400 led-glow-emerald shadow-[0_0_6px_#34d399]'
              }`}
              title={namModel.bypassed ? 'Amp is Bypassed' : 'Amp is Engaged'}
            />
            <span className="text-[10px] font-mono text-neutral-400 font-semibold">AMP</span>
            <ArrowRight size={10} className="text-neutral-600" />
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                irCabinet.bypassed
                  ? 'bg-neutral-700'
                  : 'bg-sky-400 led-glow-blue shadow-[0_0_6px_#38bdf8]'
              }`}
              title={irCabinet.bypassed ? 'Cabinet is Bypassed' : 'Cabinet is Engaged'}
            />
            <span className="text-[10px] font-mono text-neutral-400 font-semibold">CAB</span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2 flex-wrap">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Cpu size={14} className="text-amber-400" />
                Amp &amp; Cabinet Stage
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 truncate">
                {isNamProfile ? 'WASM NAM + IR Convolver' : 'Modeled Preamp + IR'}
              </span>
            </h3>
          </div>
        </div>

        {/* Header Actions (Bypass Toggles & Single Collapse Button) */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Amp Bypass Toggle */}
          <button
            onClick={toggleAmpBypass}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
              namModel.bypassed
                ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title={namModel.bypassed ? 'Amp is BYPASSED (Click to Engage)' : 'Amp is ENGAGED (Click to Bypass)'}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                namModel.bypassed
                  ? 'bg-neutral-600'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
              }`}
            />
            <span>{namModel.bypassed ? 'AMP BYPASS' : 'AMP ON'}</span>
          </button>

          {/* Cab Bypass Toggle */}
          <button
            onClick={toggleCabBypass}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
              irCabinet.bypassed
                ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30'
            }`}
            title={irCabinet.bypassed ? 'Cabinet is BYPASSED (Click to Engage)' : 'Cabinet is ENGAGED (Click to Bypass)'}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                irCabinet.bypassed
                  ? 'bg-neutral-600'
                  : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]'
              }`}
            />
            <span>{irCabinet.bypassed ? 'CAB BYPASS' : 'CAB ON'}</span>
          </button>

          {/* Single Unified Collapse / Expand Toggle Button for the combined unit */}
          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium rounded-lg border transition-all ${
              isCollapsed
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
            }`}
            title={isCollapsed ? 'Expand Amp & Cabinet to view full tone stack and IR knobs' : 'Collapse Amp & Cabinet into compact 1U rack strip'}
          >
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{isCollapsed ? 'Expand Amp & Cab' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSED VIEW: Combined 1U Rack Strip with Both Amp and Cab Controls    */}
      {/* ========================================================================= */}
      {isCollapsed ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 py-1 items-center">
          {/* Channel A: Amp Strip (NAM Modeler / Preamp) */}
          <div className="lg:col-span-7 flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-all shrink-0 ${
                  namModel.bypassed
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-emerald-500 led-glow-emerald border-emerald-300'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase shrink-0">AMP:</span>
                  <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                    {namModel.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                    {namModel.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <span className={isNamProfile ? 'text-amber-400 font-semibold' : 'text-neutral-400'}>
                    {ampEngineMode === 'wasm-nam'
                      ? 'WASM NAM'
                      : ampEngineMode === 'hd-triode'
                      ? 'HD Triode'
                      : 'Waveshaper'}
                  </span>
                  <span>·</span>
                  <span>Gain: <strong className="text-white">{namModel.gain.toFixed(1)}</strong></span>
                  <span>·</span>
                  <span>Master: <strong className="text-white">{namModel.master.toFixed(1)}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Model Select & Amp Bypass Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={namModel.customProfileName ? 'custom' : namModel.id}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleSelectNam(e.target.value);
                  }
                }}
                className="w-32 sm:w-40 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
              >
                <optgroup label="Real NAM (WASM)">
                  <option value="ac10">⚡ Vox AC10 Custom</option>
                  <option value="deluxe">⚡ Fender '65 Deluxe</option>
                </optgroup>
                <optgroup label="Preamp Models">
                  {BUILT_IN_NAM_MODELS.filter(m => m.id !== 'ac10' && m.id !== 'deluxe').map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                {namModel.customProfileName && (
                  <option value="custom">★ {namModel.customProfileName}</option>
                )}
              </select>

              <button
                onClick={toggleAmpBypass}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
                  namModel.bypassed
                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                }`}
                title={namModel.bypassed ? 'Amp is BYPASSED (Click to Engage)' : 'Amp is ENGAGED (Click to Bypass)'}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                    namModel.bypassed
                      ? 'bg-neutral-600'
                      : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  }`}
                />
                <span>{namModel.bypassed ? 'BYPASS' : 'ON'}</span>
              </button>
            </div>
          </div>

          {/* Channel B: Cabinet Strip (IR Convolver) */}
          <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-all shrink-0 ${
                  irCabinet.bypassed
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-sky-500 led-glow-blue border-sky-300'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase shrink-0">CAB:</span>
                  <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                    {irCabinet.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <span className="text-sky-400">
                    {irCabinet.isRealWav || irCabinet.isCustom ? 'WAV IR' : 'Synth IR'}
                  </span>
                  <span>·</span>
                  <span>Mic: <strong className="text-white">{irCabinet.micDistance}%</strong></span>
                  <span>·</span>
                  <span>Cut: <strong className="text-white">{Math.round(irCabinet.lowCut)}Hz</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Cab Select & Cab Bypass Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={irCabinet.isCustom ? 'custom' : irCabinet.id}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleSelectCab(e.target.value);
                  }
                }}
                className="w-28 sm:w-36 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 truncate"
              >
                <optgroup label="Real Acoustic WAV IRs">
                  <option value="celestion-v30">Celestion V30</option>
                  <option value="emt-140-plate">EMT 140 Plate</option>
                </optgroup>
                <optgroup label="Synthetic Models">
                  {BUILT_IN_IR_CABINETS.filter(c => c.id !== 'celestion-v30' && c.id !== 'emt-140-plate').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                {irCabinet.isCustom && (
                  <option value="custom">★ {irCabinet.customFileName}</option>
                )}
              </select>

              <button
                onClick={toggleCabBypass}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
                  irCabinet.bypassed
                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30'
                }`}
                title={irCabinet.bypassed ? 'Cabinet is BYPASSED (Click to Engage)' : 'Cabinet is ENGAGED (Click to Bypass)'}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                    irCabinet.bypassed
                      ? 'bg-neutral-600'
                      : 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                  }`}
                />
                <span>{irCabinet.bypassed ? 'BYPASS' : 'ON'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* EXPANDED VIEW: Full Amp Head & IR Cabinet Modules Side-by-Side            */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          {/* ===================================================================== */}
          {/* AMP HEAD SECTION                                                      */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 bg-neutral-950/70 rounded-xl border border-neutral-800/80 p-2.5 sm:p-3 flex flex-col justify-between h-full">
            <div>
              {/* Amp Model Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full border transition-all shrink-0 ${
                      namModel.bypassed
                        ? 'bg-neutral-800 border-neutral-700'
                        : 'bg-emerald-500 led-glow-emerald border-emerald-300'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                      <span>{namModel.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {namModel.category}
                      </span>
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                      {namModel.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={namModel.customProfileName ? 'custom' : namModel.id}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        handleSelectNam(e.target.value);
                      }
                    }}
                    className="w-36 sm:w-48 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <optgroup label="Real NAM WaveNet Profiles (WASM)">
                      <option value="ac10">⚡ Vox AC10 Custom</option>
                      <option value="deluxe">⚡ Fender '65 Deluxe</option>
                    </optgroup>
                    <optgroup label="Tube & Preamp Profiles">
                      {BUILT_IN_NAM_MODELS.filter(m => m.id !== 'ac10' && m.id !== 'deluxe').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </optgroup>
                    {namModel.customProfileName && (
                      <option value="custom">★ {namModel.customProfileName}</option>
                    )}
                  </select>

                  <button
                    onClick={() => namFileInputRef.current?.click()}
                    className="w-18 justify-center flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors shrink-0"
                    title="Upload real .nam neural profile JSON file"
                  >
                    <Upload size={12} className="shrink-0" />
                    <span>.nam</span>
                  </button>
                  <input
                    ref={namFileInputRef}
                    type="file"
                    accept=".nam,.json"
                    className="hidden"
                    onChange={handleNamFileUpload}
                  />
                </div>
              </div>

              {/* Preamp Engine Segmented Selector */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 px-0.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Preamp Engine:</span>
                  {isNamProfile ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <Zap size={9} /> NAM Locked
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 border border-neutral-700/60 px-1.5 py-0.2 rounded">
                      Component Modeler
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                  <button
                    disabled={!isNamProfile}
                    onClick={() => {
                      if (isNamProfile && onSetAmpEngineMode) {
                        onSetAmpEngineMode('wasm-nam');
                      }
                    }}
                    className={`w-20 text-center py-0.5 rounded text-[10px] font-mono transition-colors ${
                      !isNamProfile
                        ? 'opacity-25 cursor-not-allowed text-neutral-600'
                        : ampEngineMode === 'wasm-nam'
                        ? 'bg-amber-500 text-black font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    WASM NAM
                  </button>

                  <button
                    disabled={isNamProfile}
                    onClick={() => {
                      if (!isNamProfile && onSetAmpEngineMode) {
                        onSetAmpEngineMode('hd-triode');
                      }
                    }}
                    className={`w-20 text-center py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isNamProfile
                        ? 'opacity-25 cursor-not-allowed text-neutral-600'
                        : ampEngineMode === 'hd-triode'
                        ? 'bg-purple-500 text-white font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    HD Worklet
                  </button>

                  <button
                    disabled={isNamProfile}
                    onClick={() => {
                      if (!isNamProfile && onSetAmpEngineMode) {
                        onSetAmpEngineMode('waveshaper');
                      }
                    }}
                    className={`w-20 text-center py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isNamProfile
                        ? 'opacity-25 cursor-not-allowed text-neutral-600'
                        : ampEngineMode === 'waveshaper'
                        ? 'bg-sky-500 text-black font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Waveshaper
                  </button>
                </div>
              </div>

              {/* NAM Sensitivity Trim Bar */}
              {isNamProfile && (
                <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-950/30 via-neutral-900/40 to-neutral-900/60 border border-amber-500/25 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Sliders size={11} className="text-amber-400" /> Sensitivity:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded">
                      {((namModel.inputTrim ?? -8.0) >= 0 ? '+' : '') + (namModel.inputTrim ?? -8.0).toFixed(1)} dB
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => onUpdateNam({ ...namModel, inputTrim: -12.0 })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        (namModel.inputTrim ?? -8.0) === -12.0
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-neutral-950 border-neutral-700/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      -12dB Quiet
                    </button>
                    <button
                      onClick={() => onUpdateNam({ ...namModel, inputTrim: -8.0 })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        (namModel.inputTrim ?? -8.0) === -8.0
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-neutral-950 border-neutral-700/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      -8dB Norm
                    </button>
                    <button
                      onClick={() => onUpdateNam({ ...namModel, inputTrim: -4.0 })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        (namModel.inputTrim ?? -8.0) === -4.0
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-neutral-950 border-neutral-700/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      -4dB Hot
                    </button>
                  </div>
                </div>
              )}

              {/* Amp Tone Stack Knobs Bar */}
              <div className="py-2 px-1 grid grid-cols-6 gap-1 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-2 border border-neutral-800/80">
                <RotaryKnob
                  label="Gain"
                  value={namModel.gain}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#f59e0b"
                  onChange={(v) => onUpdateNam({ ...namModel, gain: v })}
                />
                <RotaryKnob
                  label="Bass"
                  value={namModel.bass}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateNam({ ...namModel, bass: v })}
                />
                <RotaryKnob
                  label="Mid"
                  value={namModel.mid}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateNam({ ...namModel, mid: v })}
                />
                <RotaryKnob
                  label="Treble"
                  value={namModel.treble}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateNam({ ...namModel, treble: v })}
                />
                <RotaryKnob
                  label="Presence"
                  value={namModel.presence}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateNam({ ...namModel, presence: v })}
                />
                <RotaryKnob
                  label="Master"
                  value={namModel.master}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#10b981"
                  onChange={(v) => onUpdateNam({ ...namModel, master: v })}
                />
              </div>
            </div>

            {/* Amp Footer Info */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-800/60">
              <div className="flex items-center gap-1.5 truncate">
                <Cpu size={11} className="text-amber-400 shrink-0" />
                <span>{namModel.customProfileName || namModel.name}</span>
                <span>·</span>
                <span>{namModel.type.toUpperCase()}</span>
              </div>

              {onOpenLatencyInspector && (
                <button
                  onClick={onOpenLatencyInspector}
                  className="font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
                >
                  <Clock size={10} className="shrink-0" />
                  <span className="tabular-nums">
                    {currentLatencyMs ? `${currentLatencyMs.toFixed(1)}ms` : 'Latency'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* CABINET SECTION                                                       */}
          {/* ===================================================================== */}
          <div className="lg:col-span-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 p-2.5 sm:p-3 flex flex-col justify-between h-full">
            <div>
              {/* Cabinet Model Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full border transition-all shrink-0 ${
                      irCabinet.bypassed
                        ? 'bg-neutral-800 border-neutral-700'
                        : 'bg-sky-500 led-glow-blue border-sky-300'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                      <span>{irCabinet.name}</span>
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                      {irCabinet.speakerType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={irCabinet.isCustom ? 'custom' : irCabinet.id}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        handleSelectCab(e.target.value);
                      }
                    }}
                    className="w-32 sm:w-40 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 truncate"
                  >
                    <optgroup label="Real Acoustic WAV IRs">
                      <option value="celestion-v30">★ Celestion V30</option>
                      <option value="emt-140-plate">★ EMT 140 Plate</option>
                    </optgroup>
                    <optgroup label="Synthetic Models">
                      {BUILT_IN_IR_CABINETS.filter(c => c.id !== 'celestion-v30' && c.id !== 'emt-140-plate').map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    {irCabinet.isCustom && (
                      <option value="custom">★ {irCabinet.customFileName}</option>
                    )}
                  </select>

                  <button
                    onClick={() => irFileInputRef.current?.click()}
                    className="w-18 justify-center flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors shrink-0"
                    title="Upload custom .wav Impulse Response file"
                  >
                    <Upload size={12} className="shrink-0" />
                    <span>.wav</span>
                  </button>
                  <input
                    ref={irFileInputRef}
                    type="file"
                    accept=".wav,audio/wav"
                    className="hidden"
                    onChange={handleIrFileUpload}
                  />
                </div>
              </div>

              {/* Acoustic Convolver Engine Subtitle */}
              <div className="flex items-center justify-between gap-1 mt-1.5 px-1 py-1 text-xs text-neutral-400 font-mono">
                <span className="text-[10px] text-neutral-400 uppercase">Acoustic Convolver:</span>
                <span className="text-[10px] text-sky-400 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.2 rounded">
                  {irCabinet.isRealWav || irCabinet.isCustom ? 'WAV Convolver Engine' : 'Synthetic Convolver'}
                </span>
              </div>

              {/* IR Controls (Mic Distance, Low Cut, High Cut) */}
              <div className="py-2 px-1 grid grid-cols-3 gap-2 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-2 border border-neutral-800/80">
                <RotaryKnob
                  label="Mic Dist"
                  value={irCabinet.micDistance}
                  min={0}
                  max={100}
                  unit="%"
                  color="#38bdf8"
                  onChange={(v) => onUpdateCab({ ...irCabinet, micDistance: v })}
                />
                <RotaryKnob
                  label="Low Cut"
                  value={irCabinet.lowCut}
                  min={20}
                  max={200}
                  unit="Hz"
                  formatValue={(v) => `${Math.round(v)}Hz`}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateCab({ ...irCabinet, lowCut: v })}
                />
                <RotaryKnob
                  label="High Cut"
                  value={irCabinet.highCut}
                  min={2000}
                  max={15000}
                  unit="Hz"
                  formatValue={(v) => `${Math.round(v / 100) / 10}k`}
                  color="#e2e8f0"
                  onChange={(v) => onUpdateCab({ ...irCabinet, highCut: v })}
                />
              </div>
            </div>

            {/* IR Status Footer */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-800/60">
              <div className="flex items-center gap-1">
                <Radio size={11} className="text-sky-400" />
                <span className="truncate">
                  {irCabinet.isRealWav || irCabinet.isCustom
                    ? 'Decoded WAV Acoustic Convolver'
                    : 'Synthetic Cabinet Contour'}
                </span>
              </div>
              <span className="font-mono text-neutral-400 shrink-0">Partitioned FFT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
