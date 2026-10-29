import React, { useState, useEffect } from 'react';
import { SignalChainLatencyReport } from '../../audio/latencyTracker';
import { AudioLatencySettings } from '../../audio/audioEngine';
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  PlayCircle,
  Sliders,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export interface EngineSettingsTabProps {
  report: SignalChainLatencyReport;
  coreEngineMode: 'hd-worklet' | 'standard';
  onSetCoreEngineMode: (mode: 'hd-worklet' | 'standard') => void;
  ampEngineMode: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  onSetAmpEngineMode: (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => void;
  isWasmReady: boolean;
  onRunLatencyPing: () => Promise<number>;
  latencySettings: AudioLatencySettings;
  onUpdateLatencySettings: (settings: Partial<AudioLatencySettings>) => Promise<void>;
  availableInputDevices: { deviceId: string; label: string; isBluetooth?: boolean }[];
  availableOutputDevices?: { deviceId: string; label: string; isBluetooth: boolean }[];
}

export const EngineSettingsTab: React.FC<EngineSettingsTabProps> = ({
  report,
  coreEngineMode,
  onSetCoreEngineMode,
  ampEngineMode,
  onSetAmpEngineMode,
  isWasmReady,
  onRunLatencyPing,
  latencySettings,
  onUpdateLatencySettings,
  availableInputDevices = [],
  availableOutputDevices = []
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<number | null>(report.measuredPingMs);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);
  const [showProControls, setShowProControls] = useState(false);

  useEffect(() => {
    setPingResult(report.measuredPingMs);
  }, [report.measuredPingMs]);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await onRunLatencyPing();
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  };

  // 1-Tap Performance Presets
  const handleApplyPreset = async (profile: 'ultra-low' | 'balanced' | 'hifi') => {
    setIsApplyingSettings(true);
    try {
      if (profile === 'ultra-low') {
        await onUpdateLatencySettings({
          profile: 'ultra-low',
          sampleRateMode: 'native',
          zeroLatencyCab: false,
          zeroLookaheadLimiter: true,
          bypassOsVoiceProcessing: true
        });
        onSetCoreEngineMode('hd-worklet');
      } else if (profile === 'balanced') {
        await onUpdateLatencySettings({
          profile: 'balanced',
          sampleRateMode: 'native',
          zeroLatencyCab: false,
          zeroLookaheadLimiter: false,
          bypassOsVoiceProcessing: false
        });
      } else if (profile === 'hifi') {
        await onUpdateLatencySettings({
          profile: 'safe',
          sampleRateMode: 'native',
          zeroLatencyCab: false,
          zeroLookaheadLimiter: false,
          bypassOsVoiceProcessing: false
        });
        onSetAmpEngineMode('wasm-nam');
      }
    } finally {
      setIsApplyingSettings(false);
    }
  };

  const isTurboActive =
    latencySettings.profile === 'ultra-low' &&
    latencySettings.sampleRateMode === 'native' &&
    latencySettings.zeroLookaheadLimiter &&
    latencySettings.bypassOsVoiceProcessing;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ultra-low':
        return {
          text: 'Stage Ready (< 8ms)',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'studio':
        return {
          text: 'Studio Realtime (< 15ms)',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      default:
        return {
          text: 'Audible Latency (> 20ms)',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
    }
  };

  const tierBadge = getTierBadge(report.latencyTier);

  return (
    <div className="space-y-5">
      {/* 1. SMART PERFORMANCE PRESETS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold uppercase tracking-wider text-neutral-300">
            Audio Engine Performance Tier
          </span>
          <span className="text-[11px] font-mono">
            {report.sampleRate} Hz · {report.bufferSize} samples
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Ultra-Low Latency */}
          <button
            type="button"
            onClick={() => handleApplyPreset('ultra-low')}
            disabled={isApplyingSettings}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isTurboActive
                ? 'bg-emerald-500/15 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-emerald-400" />
                <span>Ultra-Low Latency</span>
              </span>
              {isTurboActive && (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Direct DAC clock, bypasses OS queues for tight live guitar feel.
            </p>
          </button>

          {/* Balanced Studio */}
          <button
            type="button"
            onClick={() => handleApplyPreset('balanced')}
            disabled={isApplyingSettings}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              !isTurboActive && latencySettings.profile === 'balanced'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-400" />
                <span>Balanced Studio</span>
              </span>
              {!isTurboActive && latencySettings.profile === 'balanced' && (
                <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Stable audio buffer with lookahead safety limiter protection.
            </p>
          </button>

          {/* High Fidelity NAM */}
          <button
            type="button"
            onClick={() => handleApplyPreset('hifi')}
            disabled={isApplyingSettings}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              ampEngineMode === 'wasm-nam' && !isTurboActive
                ? 'bg-sky-500/15 border-sky-500/60 shadow-sm ring-1 ring-sky-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-sky-400" />
                <span>High Fidelity Neural</span>
              </span>
              {ampEngineMode === 'wasm-nam' && !isTurboActive && (
                <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Prioritizes Neural NAM neural network precision &amp; high IR accuracy.
            </p>
          </button>
        </div>
      </div>

      {/* 2. LATENCY OVERVIEW & LIVE HARDWARE PING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Latency Metric */}
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              <span>Round-Trip Latency</span>
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${tierBadge.color}`}>
              {tierBadge.text}
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black font-mono tabular-nums text-white flex items-baseline gap-1.5">
              <span>{report.totalCalculatedMs.toFixed(1)}</span>
              <span className="text-sm text-neutral-400 font-normal">ms</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Buffer ({((report.bufferSize / report.sampleRate) * 1000).toFixed(1)} ms) + DSP &amp; Cab IR Convolver
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <Zap size={12} />
            <span>-{report.savings.totalSavedMs.toFixed(1)} ms saved via clock optimization</span>
          </div>
        </div>

        {/* Live Hardware Ping */}
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-sky-400" />
              <span>Hardware Ping Diagnostic</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Jitter: &plusmn;{report.jitterMs.toFixed(1)} ms
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black font-mono tabular-nums text-sky-300 flex items-baseline gap-1.5">
              <span>{pingResult ? pingResult.toFixed(1) : '--'}</span>
              <span className="text-sm text-neutral-400 font-normal">ms</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Live impulse acoustic round-trip benchmark from output to microphone
            </p>
          </div>

          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-colors disabled:opacity-50"
          >
            <PlayCircle size={14} className={isPinging ? 'animate-spin' : ''} />
            <span>{isPinging ? 'MEASURING ROUND-TRIP...' : 'RUN LIVE HARDWARE PING'}</span>
          </button>
        </div>
      </div>

      {/* 3. CORE AMP MODELING SIMULATOR SELECTION */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-amber-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Amp Modeling DSP Engine
            </h4>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {ampEngineMode === 'wasm-nam'
              ? isWasmReady
                ? 'NAM WASM Ready (Active)'
                : 'NAM WASM Initializing'
              : 'HD Triode Worklet'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* WASM NAM */}
          <button
            type="button"
            onClick={() => onSetAmpEngineMode('wasm-nam')}
            className={`p-3 rounded-lg border text-left transition-all ${
              ampEngineMode === 'wasm-nam'
                ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">Neural NAM (WASM)</span>
              {ampEngineMode === 'wasm-nam' && <CheckCircle2 size={13} className="text-amber-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              WaveNet machine learning models of real boutique tube preamps and power sections.
            </p>
          </button>

          {/* HD Triode */}
          <button
            type="button"
            onClick={() => onSetAmpEngineMode('hd-triode')}
            className={`p-3 rounded-lg border text-left transition-all ${
              ampEngineMode === 'hd-triode'
                ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">HD-Triode Worklet</span>
              {ampEngineMode === 'hd-triode' && <CheckCircle2 size={13} className="text-amber-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Direct mathematical tube grid conduction model with authentic sag and compression.
            </p>
          </button>

          {/* Waveshaper */}
          <button
            type="button"
            onClick={() => onSetAmpEngineMode('waveshaper')}
            className={`p-3 rounded-lg border text-left transition-all ${
              ampEngineMode === 'waveshaper'
                ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">Fast Waveshaper</span>
              {ampEngineMode === 'waveshaper' && <CheckCircle2 size={13} className="text-amber-400" />}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Ultra-lightweight polynomial curve clipper. Zero CPU footprint on mobile devices.
            </p>
          </button>
        </div>
      </div>

      {/* 4. EXPANDABLE PRO ENGINE CONTROLS */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60">
        <button
          type="button"
          onClick={() => setShowProControls(!showProControls)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-850 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-amber-400" />
            <span>Pro Engine Controls (Buffer Sizes, Threads &amp; Latency Stacks)</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="text-[11px] font-mono">{showProControls ? 'Collapse' : 'Expand'}</span>
            {showProControls ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {showProControls && (
          <div className="p-4 sm:p-5 border-t border-neutral-800 space-y-5 bg-neutral-950/80 animate-in fade-in duration-150">
            {/* A. Core DSP Worklet Thread Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              <div>
                <span className="text-xs font-bold text-neutral-200 block">
                  Web Audio Architecture
                </span>
                <span className="text-[11px] text-neutral-400">
                  HD AudioWorklet runs on a dedicated high-priority audio rendering thread
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSetCoreEngineMode('hd-worklet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    coreEngineMode === 'hd-worklet'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  HD AudioWorklet
                </button>
                <button
                  type="button"
                  onClick={() => onSetCoreEngineMode('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    coreEngineMode === 'standard'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Native ScriptProcessor
                </button>
              </div>
            </div>

            {/* B. Buffer Size Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">
                Target Audio Context Buffer Size
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[64, 128, 256, 512, 1024].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      onUpdateLatencySettings({
                        profile: size <= 128 ? 'ultra-low' : size <= 256 ? 'balanced' : 'safe'
                      })
                    }
                    className={`p-2 rounded-lg text-center border font-mono transition-all ${
                      report.bufferSize === size
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs block">{size}</span>
                    <span className="text-[9px] text-neutral-400">
                      {((size / report.sampleRate) * 1000).toFixed(1)} ms
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* C. Signal Chain Latency Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">
                Signal Chain Latency Breakdown
              </span>
              <div className="bg-neutral-900/90 rounded-lg border border-neutral-800 p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Hardware Input Buffer:</span>
                  <span className="text-white">
                    {report.inputLatencyMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Amp Emulation:</span>
                  <span className="text-white">
                    {report.ampLatencyMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Active Pedals:</span>
                  <span className="text-white">
                    {report.pedalsLatencyMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Cabinet IR Convolver:</span>
                  <span className="text-white">
                    {report.cabLatencyMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Peak Limiter:</span>
                  <span className="text-white">
                    {report.limiterLatencyMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 text-amber-400">
                  <span>Total Calculated:</span>
                  <span>{report.totalCalculatedMs.toFixed(2)} ms</span>
                </div>
              </div>
            </div>

            {/* D. Advanced Latency Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-neutral-200 block">
                    Zero-Lookahead Limiter
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Bypasses 2.5ms lookahead buffer for direct transients
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={latencySettings.zeroLookaheadLimiter}
                  onChange={(e) =>
                    onUpdateLatencySettings({ zeroLookaheadLimiter: e.target.checked })
                  }
                  className="accent-amber-500 h-4 w-4 cursor-pointer rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-neutral-200 block">
                    Bypass OS Voice Processing
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Disables browser echo cancellation and AGC
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={latencySettings.bypassOsVoiceProcessing}
                  onChange={(e) =>
                    onUpdateLatencySettings({ bypassOsVoiceProcessing: e.target.checked })
                  }
                  className="accent-amber-500 h-4 w-4 cursor-pointer rounded"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
