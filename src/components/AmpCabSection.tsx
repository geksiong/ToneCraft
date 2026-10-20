import React, { useRef, useState } from 'react';
import { AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import { BUILT_IN_AMP_MODELS, parseNamJson, isNamModelProfile, getDefaultTrimForModel } from '../audio/ampModels';
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
  ampModel: AmpModelConfig;
  irCabinet: IrCabinetConfig;
  onUpdateAmp: (updated: AmpModelConfig) => void;
  onUpdateCab: (updated: IrCabinetConfig) => void;
  onLoadCustomIrWav: (buffer: ArrayBuffer, fileName: string) => void;
  ampEngineMode?: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  onSetAmpEngineMode?: (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => void;
  onOpenLatencyInspector?: () => void;
  currentLatencyMs?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AmpCabSection: React.FC<AmpCabSectionProps> = ({
  ampModel,
  irCabinet,
  onUpdateAmp,
  onUpdateCab,
  onLoadCustomIrWav,
  ampEngineMode = 'wasm-nam',
  onSetAmpEngineMode,
  onOpenLatencyInspector,
  currentLatencyMs,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed =
    controlledCollapsed !== undefined
      ? controlledCollapsed
      : internalCollapsed;
  const toggleCollapse =
    controlledToggleCollapse ||
    (() => setInternalCollapsed(prev => !prev));

  const namFileInputRef = useRef<HTMLInputElement>(null);
  const irFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAmp = (id: string) => {
    const selected = BUILT_IN_AMP_MODELS.find(m => m.id === id);
    if (selected) {
      const isSelectedNam = isNamModelProfile(selected);
      const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isSelectedNam
        ? 'wasm-nam'
        : (selected.engineMode && selected.engineMode !== 'wasm-nam' ? selected.engineMode : 'hd-triode');

      onUpdateAmp({
        ...selected,
        gain: selected.gain,
        bass: selected.bass,
        mid: selected.mid,
        treble: selected.treble,
        presence: selected.presence,
        master: selected.master,
        inputTrim: selected.inputTrim !== undefined ? selected.inputTrim : getDefaultTrimForModel(selected),
        isRealNam: isSelectedNam,
        engineMode: targetEngine,
        bypassed: ampModel.bypassed
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
        bypassed: false
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

      const customAmp: AmpModelConfig = {
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
        inputTrim: -6.0,
        bypassed: ampModel.bypassed
      };

      onUpdateAmp(customAmp);
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
          bypassed: false
        };

        onUpdateCab(customCab);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const isNamProfile = isNamModelProfile(ampModel);
  const defaultTrim = getDefaultTrimForModel(ampModel);
  const currentTrim = ampModel.inputTrim !== undefined ? ampModel.inputTrim : defaultTrim;

  // Modifying any amp parameter immediately engages the amp so adjustments take audible effect
  const updateAmpParam = (partial: Partial<AmpModelConfig>) => {
    onUpdateAmp({
      ...ampModel,
      ...partial,
      bypassed: false
    });
  };

  const toggleAmpBypass = () => {
    onUpdateAmp({
      ...ampModel,
      bypassed: !ampModel.bypassed
    });
  };

  // Modifying any cabinet parameter or knob immediately engages the cabinet so adjustments take audible effect
  const updateCabParam = (partial: Partial<IrCabinetConfig>) => {
    onUpdateCab({
      ...irCabinet,
      ...partial,
      bypassed: false
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
                ampModel.bypassed
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-400 led-glow-emerald shadow-[0_0_6px_#34d399]'
              }`}
              title={ampModel.bypassed ? 'Amp is Bypassed (Click to Engage)' : 'Amp is Engaged'}
            />
            <span className={`text-[10px] font-mono font-semibold ${ampModel.bypassed ? 'text-amber-400' : 'text-neutral-400'}`}>AMP</span>
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
              ampModel.bypassed
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/60 hover:bg-amber-900/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title={ampModel.bypassed ? 'Amp is BYPASSED (Click to Engage)' : 'Amp is ENGAGED (Click to Bypass)'}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                ampModel.bypassed
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
              }`}
            />
            <span>{ampModel.bypassed ? 'AMP BYPASSED (CLICK TO ON)' : 'AMP ENGAGED'}</span>
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
                  ampModel.bypassed
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-emerald-500 led-glow-emerald border-emerald-300'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase shrink-0">AMP:</span>
                  <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                    {ampModel.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                    {ampModel.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 flex-wrap">
                  <span className={isNamProfile ? 'text-amber-400 font-semibold' : 'text-neutral-400'}>
                    {ampEngineMode === 'wasm-nam'
                      ? 'WASM NAM'
                      : ampEngineMode === 'hd-triode'
                      ? 'HD Triode'
                      : 'Waveshaper'}
                  </span>
                  <span>·</span>
                  <span>Gain: <strong className="text-white">{ampModel.gain.toFixed(1)}</strong></span>
                  <span>·</span>
                  <span>Master: <strong className="text-white">{ampModel.master.toFixed(1)}</strong></span>
                  <span>·</span>
                  <span>Trim: <strong className={currentTrim > 0 ? 'text-emerald-400' : currentTrim < 0 ? 'text-amber-400' : 'text-white'}>{currentTrim >= 0 ? '+' : ''}{currentTrim.toFixed(1)}dB</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Model Select & Amp Bypass Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={ampModel.customProfileName ? 'custom' : ampModel.id}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleSelectAmp(e.target.value);
                  }
                }}
                className="w-32 sm:w-40 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
              >
                <optgroup label="Real NAM (WASM)">
                  <option value="ac10">⚡ Vox AC10 Custom</option>
                  <option value="deluxe">⚡ Fender '65 Deluxe</option>
                </optgroup>
                <optgroup label="Preamp Models">
                  {BUILT_IN_AMP_MODELS.filter(m => m.id !== 'ac10' && m.id !== 'deluxe').map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                {ampModel.customProfileName && (
                  <option value="custom">★ {ampModel.customProfileName}</option>
                )}
              </select>

              <button
                onClick={toggleAmpBypass}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
                  ampModel.bypassed
                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/60 hover:bg-amber-900/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                }`}
                title={ampModel.bypassed ? 'Amp is BYPASSED (Click to Engage)' : 'Amp is ENGAGED (Click to Bypass)'}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                    ampModel.bypassed
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  }`}
                />
                <span>{ampModel.bypassed ? 'BYPASSED' : 'ON'}</span>
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
                      ampModel.bypassed
                        ? 'bg-neutral-800 border-neutral-700'
                        : 'bg-emerald-500 led-glow-emerald border-emerald-300'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                      <span>{ampModel.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {ampModel.category}
                      </span>
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">
                      {ampModel.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={ampModel.customProfileName ? 'custom' : ampModel.id}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        handleSelectAmp(e.target.value);
                      }
                    }}
                    className="w-36 sm:w-48 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <optgroup label="Real NAM WaveNet Profiles (WASM)">
                      <option value="ac10">⚡ Vox AC10 Custom</option>
                      <option value="deluxe">⚡ Fender '65 Deluxe</option>
                    </optgroup>
                    <optgroup label="Tube & Preamp Profiles">
                      {BUILT_IN_AMP_MODELS.filter(m => m.id !== 'ac10' && m.id !== 'deluxe').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </optgroup>
                    {ampModel.customProfileName && (
                      <option value="custom">★ {ampModel.customProfileName}</option>
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

              {/* Universal Amp Loudness Balance & Input Sensitivity Trim Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-2.5 py-1.5 bg-gradient-to-r from-neutral-900/90 via-neutral-950/80 to-neutral-900/90 border border-neutral-800 rounded-xl text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sliders size={12} className={currentTrim > 0 ? 'text-emerald-400' : currentTrim < 0 ? 'text-amber-400' : 'text-neutral-400'} />
                    <span className="text-[10px] font-mono text-neutral-300 font-bold uppercase tracking-wider">
                      Loudness Trim:
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded border transition-colors ${
                      currentTrim > 0
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                        : currentTrim < 0
                        ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                    }`}
                    title="Calibrated input sensitivity and perceptual loudness balance for this amp"
                  >
                    {(currentTrim >= 0 ? '+' : '') + currentTrim.toFixed(1)} dB
                  </span>
                  {currentTrim >= 3.0 && (
                    <span className="hidden sm:inline text-[9px] font-mono text-emerald-400/90 bg-emerald-950/50 px-1 py-0.2 rounded border border-emerald-500/20">
                      Clean Boost
                    </span>
                  )}
                  {currentTrim <= -4.0 && (
                    <span className="hidden sm:inline text-[9px] font-mono text-amber-400/90 bg-amber-950/50 px-1 py-0.2 rounded border border-amber-500/20">
                      High-Gain Pad
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Fine Nudge Controls */}
                  <div className="flex items-center gap-1 bg-neutral-950 px-1 py-0.5 rounded-lg border border-neutral-800">
                    <button
                      onClick={() => updateAmpParam({ inputTrim: Math.max(-18, Math.round((currentTrim - 1.0) * 2) / 2) })}
                      className="w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Nudge trim -1 dB"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="-18"
                      max="12"
                      step="0.5"
                      value={currentTrim}
                      onChange={(e) => updateAmpParam({ inputTrim: parseFloat(e.target.value) })}
                      className="w-16 sm:w-24 h-1 accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                      title={`Loudness Trim: ${(currentTrim >= 0 ? '+' : '') + currentTrim.toFixed(1)} dB`}
                    />
                    <button
                      onClick={() => updateAmpParam({ inputTrim: Math.min(12, Math.round((currentTrim + 1.0) * 2) / 2) })}
                      className="w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Nudge trim +1 dB"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => updateAmpParam({ inputTrim: defaultTrim })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        Math.abs(currentTrim - defaultTrim) < 0.1
                          ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-xs'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                      }`}
                      title={`Reset to factory calibrated trim for ${ampModel.name} (${(defaultTrim >= 0 ? '+' : '') + defaultTrim.toFixed(1)} dB)`}
                    >
                      Def ({(defaultTrim >= 0 ? '+' : '') + defaultTrim.toFixed(1)}dB)
                    </button>
                    <button
                      onClick={() => updateAmpParam({ inputTrim: 0.0 })}
                      className={`px-1.5 py-0.5 rounded border transition-colors ${
                        Math.abs(currentTrim - 0.0) < 0.1
                          ? 'bg-neutral-200 text-black font-bold border-white shadow-xs'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Set trim to 0.0 dB (Unity input)"
                    >
                      0dB
                    </button>
                    <button
                      onClick={() => updateAmpParam({ inputTrim: Math.min(12, currentTrim + 3.0) })}
                      className="px-1.5 py-0.5 rounded border bg-neutral-950 border-neutral-800 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-colors"
                      title="Add +3 dB loudness boost"
                    >
                      +3dB
                    </button>
                  </div>
                </div>
              </div>

              {/* Amp Bypassed Notice Bar */}
              {ampModel.bypassed && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 my-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs font-mono shadow-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span className="truncate">Amp is <strong>BYPASSED</strong> (Dry pass-through). Turn any knob or click to engage.</span>
                  </div>
                  <button
                    onClick={() => onUpdateAmp({ ...ampModel, bypassed: false })}
                    className="px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase transition-colors shrink-0 shadow-xs"
                  >
                    Engage Amp
                  </button>
                </div>
              )}

              {/* Amp Tone Stack Knobs Bar */}
              <div className="py-2 px-1 grid grid-cols-6 gap-1 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-2 border border-neutral-800/80">
                <RotaryKnob
                  label="Gain"
                  value={ampModel.gain}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#f59e0b"
                  onChange={(v) => updateAmpParam({ gain: v })}
                />
                <RotaryKnob
                  label="Bass"
                  value={ampModel.bass}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => updateAmpParam({ bass: v })}
                />
                <RotaryKnob
                  label="Mid"
                  value={ampModel.mid}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => updateAmpParam({ mid: v })}
                />
                <RotaryKnob
                  label="Treble"
                  value={ampModel.treble}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => updateAmpParam({ treble: v })}
                />
                <RotaryKnob
                  label="Presence"
                  value={ampModel.presence}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#e2e8f0"
                  onChange={(v) => updateAmpParam({ presence: v })}
                />
                <RotaryKnob
                  label="Master"
                  value={ampModel.master}
                  min={0}
                  max={10}
                  step={0.1}
                  color="#10b981"
                  onChange={(v) => updateAmpParam({ master: v })}
                />
              </div>
            </div>

            {/* Amp Footer Info */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-800/60">
              <div className="flex items-center gap-1.5 truncate">
                <Cpu size={11} className="text-amber-400 shrink-0" />
                <span>{ampModel.customProfileName || ampModel.name}</span>
                <span>·</span>
                <span className="font-mono text-neutral-300">
                  {isNamProfile
                    ? (ampModel.type?.toUpperCase() || 'WAVENET')
                    : ampModel.engineMode === 'waveshaper'
                    ? 'ANALYTIC WAVESHAPER'
                    : 'HD TRIODE TUBE DSP'}
                </span>
                {isNamProfile && ampModel.weightsCount && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-mono">{ampModel.weightsCount.toLocaleString()} weights</span>
                  </>
                )}
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
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                  irCabinet.isCustom
                    ? 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40 shadow-xs'
                    : irCabinet.isRealWav
                    ? 'text-sky-300 bg-sky-950/80 border-sky-500/40'
                    : 'text-neutral-300 bg-neutral-900 border-neutral-700'
                }`}>
                  {irCabinet.isCustom ? (
                    <span>★ Custom IR: {irCabinet.customFileName || irCabinet.name} (Active)</span>
                  ) : irCabinet.isRealWav ? (
                    <span>Real WAV Acoustic IR (Active)</span>
                  ) : (
                    <span>Synthetic Convolver IR</span>
                  )}
                </span>
              </div>

              {/* Cabinet Bypassed Notice Bar */}
              {irCabinet.bypassed && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 my-2 rounded-xl bg-sky-950/40 border border-sky-500/50 text-sky-200 text-xs font-mono shadow-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
                    <span className="truncate">Cabinet is <strong>BYPASSED</strong> (Flat direct line-out). Turn knob or click to engage.</span>
                  </div>
                  <button
                    onClick={() => updateCabParam({ bypassed: false })}
                    className="px-2.5 py-0.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-[10px] uppercase transition-colors shrink-0 shadow-xs"
                  >
                    Engage Cab
                  </button>
                </div>
              )}

              {/* IR Controls (Mic Distance, Low Cut, High Cut) */}
              <div className="py-2 px-1 grid grid-cols-3 gap-2 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-2 border border-neutral-800/80">
                <RotaryKnob
                  label="Mic Dist"
                  value={irCabinet.micDistance}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  color="#38bdf8"
                  formatValue={(v) => `${Math.round(v)}%`}
                  onChange={(v) => updateCabParam({ micDistance: v })}
                />
                <RotaryKnob
                  label="Low Cut"
                  value={irCabinet.lowCut}
                  min={20}
                  max={160}
                  step={1}
                  unit="Hz"
                  formatValue={(v) => `${Math.round(v)}Hz`}
                  color="#e2e8f0"
                  onChange={(v) => updateCabParam({ lowCut: v })}
                />
                <RotaryKnob
                  label="High Cut"
                  value={irCabinet.highCut}
                  min={4000}
                  max={12000}
                  step={50}
                  unit="Hz"
                  formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
                  color="#e2e8f0"
                  onChange={(v) => updateCabParam({ highCut: v })}
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
