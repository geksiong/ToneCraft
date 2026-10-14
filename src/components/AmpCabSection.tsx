import React, { useRef } from 'react';
import { NamModelConfig, IrCabinetConfig } from '../types/pedal';
import { BUILT_IN_NAM_MODELS, parseNamJson, isNamModelProfile } from '../audio/namModels';
import { BUILT_IN_IR_CABINETS } from '../audio/irData';
import { RotaryKnob } from './RotaryKnob';
import {
  Upload,
  Cpu,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Zap
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
  currentLatencyMs
}) => {
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
        engineMode: targetEngine
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
        micDistance: irCabinet.micDistance,
        lowCut: irCabinet.lowCut,
        highCut: irCabinet.highCut
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
        engineMode: 'wasm-nam'
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
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        onLoadCustomIrWav(arrayBuffer, file.name);
        onUpdateCab({
          id: `custom-ir-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Guitar',
          description: `Custom acoustic cabinet impulse response from ${file.name}`,
          speakerType: 'Custom Acoustic WAV IR',
          micDistance: irCabinet.micDistance,
          highCut: irCabinet.highCut,
          lowCut: irCabinet.lowCut,
          isCustom: true,
          customFileName: file.name,
          isRealWav: true
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const isNamProfile = isNamModelProfile(namModel);
  const isRealNamActive = ampEngineMode === 'wasm-nam' && isNamProfile;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
      {/* NAM Neural Amp Modeler Rack Unit */}
      <div className="lg:col-span-7 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-4 flex flex-col justify-between">
        {/* Amp Head Top Plate */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-500 led-glow-amber border border-amber-300" />
              <div>
                <h3 className="text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
                  <span>{namModel.name}</span>
                  {isRealNamActive ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Zap size={10} /> TONE3000 WASM NAM
                    </span>
                  ) : ampEngineMode === 'hd-triode' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                      <Cpu size={10} /> HD TRIODE WORKLET
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      WAVESHAPER
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-neutral-400 max-w-md truncate">
                  {namModel.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newBypassed = !namModel.bypassed;
                  onUpdateNam({
                    ...namModel,
                    bypassed: newBypassed
                  });
                }}
                className={`w-[118px] justify-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors shrink-0 ${
                  namModel.bypassed
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={namModel.bypassed ? 'Amp is BYPASSED (Click to Engage)' : 'Amp is ENGAGED (Click to Bypass)'}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    namModel.bypassed
                      ? 'bg-neutral-600'
                      : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  }`}
                />
                <span className="w-20 text-center inline-block">{namModel.bypassed ? 'AMP BYPASS' : 'AMP ON'}</span>
              </button>

              <select
                value={namModel.customProfileName ? 'custom' : namModel.id}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleSelectNam(e.target.value);
                  }
                }}
                className="w-44 sm:w-52 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
              >
                <optgroup label="Real NAM WaveNet Profiles (WASM)">
                  <option value="ac10">⚡ Vox AC10 Custom (Real NAM)</option>
                  <option value="deluxe">⚡ Fender '65 Deluxe Reverb (Real NAM)</option>
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
                className="w-24 justify-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors shrink-0"
                title="Upload real .nam neural profile JSON file"
              >
                <Upload size={13} className="shrink-0" />
                <span>Load .nam</span>
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

          {/* Engine Selector Segmented Control on Amp Head */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Preamp Engine:</span>
              {isNamProfile ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Zap size={9} /> NAM Profile Locked
                </span>
              ) : (
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 border border-neutral-700/60 px-1.5 py-0.5 rounded">
                  Component Modeled Amp
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
                className={`w-22 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                  !isNamProfile
                    ? 'opacity-25 cursor-not-allowed text-neutral-600'
                    : ampEngineMode === 'wasm-nam'
                    ? 'bg-amber-500 text-black font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={
                  !isNamProfile
                    ? 'Disabled: this amp is not a .nam neural profile (select HD Worklet or Waveshaper)'
                    : 'TONE3000 WebAssembly Neural Amp Modeler Core'
                }
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
                className={`w-22 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                  isNamProfile
                    ? 'opacity-25 cursor-not-allowed text-neutral-600'
                    : ampEngineMode === 'hd-triode'
                    ? 'bg-purple-500 text-white font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={
                  isNamProfile
                    ? 'Disabled: real .nam profile requires the WASM NAM neural engine'
                    : 'HD AudioWorklet Norman Koren 12AX7 Tube Physics'
                }
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
                className={`w-22 text-center py-0.5 rounded text-[11px] font-mono transition-colors ${
                  isNamProfile
                    ? 'opacity-25 cursor-not-allowed text-neutral-600'
                    : ampEngineMode === 'waveshaper'
                    ? 'bg-sky-500 text-black font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={
                  isNamProfile
                    ? 'Disabled: real .nam profile requires the WASM NAM neural engine'
                    : 'Lightweight polynomial wave-shaper fallback'
                }
              >
                Waveshaper
              </button>
            </div>
          </div>

          {/* Amp Tone Stack Knobs Bar */}
          <div className="py-4 px-2 grid grid-cols-6 gap-2 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-3 border border-neutral-800/80">
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
              color="#f59e0b"
              onChange={(v) => onUpdateNam({ ...namModel, master: v })}
            />
          </div>
        </div>

        {/* Amp Specs Footer */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Cpu size={12} className="text-amber-400" />
              <span>Weights: {namModel.weightsCount?.toLocaleString() || '28,440'} params</span>
            </span>
            <span>·</span>
            <span>Architecture: {namModel.type.toUpperCase()}</span>
          </div>

          {onOpenLatencyInspector && (
            <button
              onClick={onOpenLatencyInspector}
              className="w-32 justify-end font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
            >
              <Clock size={11} className="shrink-0" />
              <span className="tabular-nums text-right w-24 inline-block truncate">
                {currentLatencyMs ? `${currentLatencyMs.toFixed(1)}ms` : 'Latency'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* IR Cabinet Impulse Response Module */}
      <div className="lg:col-span-5 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-500 led-glow-blue border border-sky-300 shrink-0" />
              <div>
                <h3 className="text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                  <span>{irCabinet.name}</span>
                </h3>
                <p className="text-[11px] text-neutral-400 truncate max-w-xs">
                  {irCabinet.speakerType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newBypassed = !irCabinet.bypassed;
                  onUpdateCab({
                    ...irCabinet,
                    bypassed: newBypassed
                  });
                }}
                className={`w-[118px] justify-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors shrink-0 ${
                  irCabinet.bypassed
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/40 hover:bg-sky-500/20'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={irCabinet.bypassed ? 'Cabinet is BYPASSED (Click to Engage)' : 'Cabinet is ENGAGED (Click to Bypass)'}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    irCabinet.bypassed
                      ? 'bg-neutral-600'
                      : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  }`}
                />
                <span className="w-20 text-center inline-block">{irCabinet.bypassed ? 'CAB BYPASS' : 'CAB ON'}</span>
              </button>

              <select
                value={irCabinet.isCustom ? 'custom' : irCabinet.id}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    handleSelectCab(e.target.value);
                  }
                }}
                className="w-40 sm:w-48 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 truncate"
              >
                <optgroup label="Real Acoustic WAV IRs">
                  <option value="celestion-v30">★ Celestion V30 4x12 (Real WAV)</option>
                  <option value="emt-140-plate">★ EMT 140 Studio Plate (Real WAV)</option>
                </optgroup>
                <optgroup label="Synthetic Acoustic Models">
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
                className="w-24 justify-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors shrink-0"
                title="Upload custom .wav Impulse Response file"
              >
                <Upload size={13} className="shrink-0" />
                <span>Load .wav IR</span>
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

          {/* IR Controls (Mic Distance, High Cut, Low Cut) */}
          <div className="py-4 px-2 grid grid-cols-3 gap-3 bg-gradient-to-b from-neutral-950/40 to-neutral-900/60 rounded-xl my-3 border border-neutral-800/80">
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
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/60">
          <div className="flex items-center gap-1.5">
            <Radio size={12} className="text-sky-400" />
            <span>
              {irCabinet.isRealWav || irCabinet.isCustom
                ? 'Decoded Acoustic Impulse Response WAV (Real Convolver)'
                : 'Synthetic Cabinet Contour + Convolver'}
            </span>
          </div>
          <span className="font-mono text-neutral-400">Partitioned FFT</span>
        </div>
      </div>
    </div>
  );
};
