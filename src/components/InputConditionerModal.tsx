import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Zap,
  VolumeX,
  Volume2,
  X,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  InputConditionerConfig,
  InputConditionerTelemetry
} from '../audio/inputConditioner';

interface InputConditionerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InputConditionerConfig;
  telemetry: InputConditionerTelemetry;
  onUpdateConfig: (newConfig: Partial<InputConditionerConfig>) => void;
  onLearnNoiseFloor: () => void;
  isLearningNoiseFloor: boolean;
  onApplyWhineKiller: () => void;
  inputSource: string;
  inputGain?: number;
  onInputGainChange?: (gain: number) => void;
}

export const InputConditionerModal: React.FC<InputConditionerModalProps> = ({
  isOpen,
  onClose,
  config,
  telemetry,
  onUpdateConfig,
  onLearnNoiseFloor,
  isLearningNoiseFloor,
  onApplyWhineKiller,
  inputSource,
  inputGain,
  onInputGainChange
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gate' | 'filter'>('all');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate percentage for visual meter (-80dB to 0dB)
  const inputMeterPercent = Math.min(
    100,
    Math.max(0, ((telemetry.inputDb + 80) / 80) * 100)
  );
  const thresholdPercent = Math.min(
    100,
    Math.max(0, ((config.gateThreshold + 80) / 80) * 100)
  );

  const getInputGainDbString = (val: number): string => {
    if (val <= 0) return 'MUTE';
    const db = ((val - 50) / 50) * (val >= 50 ? 14 : 26);
    if (Math.abs(db) < 0.05) return '0.0 dB';
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Fixed-height modal container prevents entire window from shifting up and down */}
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-4xl h-[88vh] max-h-[800px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Mic Input Conditioner &amp; Noise Gate
                </h2>
                <span className={`w-20 text-center inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  config.enabled
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                }`}>
                  {config.enabled ? 'ACTIVE' : 'BYPASSED'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Eliminates high-pitched squeal, coil whine, and mic noise before guitar amp stages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Enable Toggle with constant width */}
            <button
              onClick={() => onUpdateConfig({ enabled: !config.enabled })}
              className={`w-32 justify-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border flex items-center gap-1.5 shrink-0 ${
                config.enabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              {config.enabled ? <Volume2 size={13} className="shrink-0" /> : <VolumeX size={13} className="shrink-0" />}
              <span className="w-20 text-center inline-block">{config.enabled ? 'ENABLED' : 'BYPASS ALL'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body with internal scrolling */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Real-time Telemetry & Noise Floor Bar with stable non-shifting dimensions */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-inner space-y-3">
            {/* Stable header row with fixed-width badges */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity size={15} className="text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200 truncate">
                  Live Input Envelope &amp; Gate State
                </span>
                <span className="text-[11px] font-mono text-neutral-400 shrink-0 hidden sm:inline">
                  ({inputSource === 'mic' ? 'Live Microphone' : 'Sample Riff'})
                </span>
              </div>

              {/* Fixed-width status indicators */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-48 justify-center flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shrink-0 ${
                    telemetry.gateState === 'open'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : telemetry.gateState === 'hold'
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      telemetry.gateState === 'open'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : telemetry.gateState === 'hold'
                        ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                        : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                    }`}
                  />
                  <span className="w-40 text-center inline-block truncate">
                    {telemetry.gateState === 'open'
                      ? 'GATE OPEN'
                      : telemetry.gateState === 'hold'
                      ? 'HOLD (SUSTAIN)'
                      : `MUTING (${telemetry.reductionDb} dB)`}
                  </span>
                </div>

                {/* Constant-width Input dB display with tabular numbers so width never jitters */}
                <div className="w-28 text-center text-xs font-mono text-neutral-300 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 shrink-0 flex items-center justify-center gap-1">
                  <span className="text-neutral-500 text-[10px]">IN:</span>
                  <span className="text-emerald-400 font-bold tabular-nums w-14 text-right inline-block">
                    {Number.isFinite(telemetry.inputDb) ? `${telemetry.inputDb} dB` : '-∞ dB'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Signal Level Meter with Gate Threshold Marker */}
            <div className="space-y-1">
              <div className="relative h-6 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                {/* Background scale markings */}
                <div className="absolute inset-0 flex justify-between px-2 text-[9px] font-mono text-neutral-600 select-none pointer-events-none items-center">
                  <span>-80dB</span>
                  <span>-60dB</span>
                  <span>-40dB</span>
                  <span>-20dB</span>
                  <span>0dB</span>
                </div>

                {/* Live Input Signal Level Bar */}
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 transition-all duration-75 opacity-70"
                  style={{ width: `${inputMeterPercent}%` }}
                />

                {/* Gate Threshold Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_6px_#fbbf24] z-10"
                  style={{ left: `${thresholdPercent}%` }}
                  title={`Gate Threshold: ${config.gateThreshold} dB`}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 px-1">
                <span>Signal level must exceed yellow marker to open the gate (with 2.5dB hysteresis)</span>
                <span className="text-amber-400">Marker: {config.gateThreshold} dB</span>
              </div>
            </div>

            {/* Reserved fixed-height slot for noise/whine status to avoid layout shifting */}
            <div className="h-8 flex items-center">
              {telemetry.highPitchNoiseDetected ? (
                <div className="w-full flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                  <span className="font-bold shrink-0">High-Frequency Mic Whine Detected ({telemetry.highPitchEnergyDb} dB):</span>
                  <span className="truncate text-amber-200/90 text-[11px]">De-Hiss Filter is suppressing interference to stop harsh squeals.</span>
                </div>
              ) : (
                <div className="w-full flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-950/40 border border-neutral-800/60 text-neutral-400 text-xs">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="text-neutral-300 text-[11px]">
                    {config.gateEnabled ? 'Input frequencies clean · Dynamic noise gate active.' : 'Dynamic noise gate is OFF (bypassed) · Transparent signal pass.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input Level Trim Card */}
          {inputGain !== undefined && onInputGainChange && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Input Level Trim &amp; Preamp Calibration
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    0.0 dB = Unity
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onInputGainChange(50)}
                    className="text-xs font-mono text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 border border-neutral-700 transition-colors"
                  >
                    Reset to 0 dB
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 tabular-nums">
                    {getInputGainDbString(inputGain)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={inputGain}
                  onChange={(e) => onInputGainChange(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                  <span>-26 dB (Cut hot interface / high-output pickups)</span>
                  <span className="text-emerald-400 font-bold">50% (0.0 dB Unity)</span>
                  <span>+14 dB (Boost quiet mics / vintage single-coils)</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 shrink-0">
              Instant Presets:
            </span>

            {/* 1-Click Screech & Whine Killer */}
            <button
              onClick={onApplyWhineKiller}
              className="w-56 justify-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm group shrink-0"
              title="Immediately applies 6.5kHz lowpass steep filter and smooth gate to silence feedback squeals"
            >
              <Zap size={13} className="text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="w-44 text-center inline-block truncate">⚡ Whine &amp; Screech Killer</span>
            </button>

            {/* Learn Noise Floor Auto-Calibrate with constant width */}
            <button
              onClick={onLearnNoiseFloor}
              disabled={isLearningNoiseFloor}
              className={`w-56 justify-center px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                isLearningNoiseFloor
                  ? 'bg-sky-500/30 border-sky-400 text-sky-200 animate-pulse'
                  : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white'
              }`}
              title="Calibrate threshold to your room's ambient background noise level"
            >
              <Sparkles size={13} className="text-sky-400 shrink-0" />
              <span className="w-44 text-center inline-block truncate">{isLearningNoiseFloor ? 'Measuring Room Noise...' : 'Auto-Learn Noise Floor'}</span>
            </button>

            <button
              onClick={() => {
                onUpdateConfig({
                  enabled: true,
                  gateEnabled: true,
                  gateThreshold: -44,
                  gateAttackMs: 5,
                  gateHoldMs: 25,
                  gateReleaseMs: 110,
                  gateReductionDb: -54,
                  highCutEnabled: true,
                  highCutFreq: 7500,
                  highCutSlope: '12db',
                  notchEnabled: false,
                  lowCutEnabled: true,
                  lowCutFreq: 75
                });
              }}
              className="w-36 justify-center text-center px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-mono shrink-0"
              title="Calibrated specifically for NAM neural models and high-gain amps: silences idle room noise and pickup hum between notes"
            >
              NAM Low-Noise
            </button>

            <button
              onClick={() => {
                onUpdateConfig({
                  enabled: true,
                  gateEnabled: true,
                  gateThreshold: -46,
                  gateAttackMs: 4,
                  gateHoldMs: 20,
                  gateReleaseMs: 60,
                  gateReductionDb: -54,
                  highCutEnabled: true,
                  highCutFreq: 6000,
                  highCutSlope: '24db',
                  notchEnabled: true,
                  lowCutEnabled: true,
                  lowCutFreq: 100
                });
              }}
              className="w-32 justify-center text-center px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono shrink-0"
            >
              Tight Metal Chug
            </button>

            <button
              onClick={() => {
                onUpdateConfig({
                  enabled: true,
                  gateEnabled: true,
                  gateThreshold: -54,
                  gateAttackMs: 6,
                  gateHoldMs: 40,
                  gateReleaseMs: 200,
                  gateReductionDb: -42,
                  highCutEnabled: true,
                  highCutFreq: 8000,
                  highCutSlope: '12db',
                  notchEnabled: false,
                  lowCutEnabled: true,
                  lowCutFreq: 70
                });
              }}
              className="w-32 justify-center text-center px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono shrink-0"
            >
              Natural Clean
            </button>

            <button
              onClick={() => {
                onUpdateConfig({
                  enabled: true,
                  gateEnabled: false,
                  highCutEnabled: false,
                  notchEnabled: false,
                  lowCutEnabled: false
                });
              }}
              className="w-32 justify-center text-center px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 text-xs font-mono shrink-0"
            >
              Flat Direct
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex border-b border-neutral-800 gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              All Processors
            </button>
            <button
              onClick={() => setActiveTab('filter')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'filter'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Anti-Whine &amp; De-Hiss Filters
            </button>
            <button
              onClick={() => setActiveTab('gate')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'gate'
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Dynamic Noise Gate
            </button>
          </div>

          {/* 1. FILTER SECTION: High-Cut De-Hiss & Anti-Whine */}
          {(activeTab === 'all' || activeTab === 'filter') && (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    HF
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      De-Hiss High-Cut Filter (Anti-Screech)
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Specifically removes high-pitched microphone whine, coil noise, and squeals above guitar frequencies
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-mono text-neutral-400">
                    {config.highCutEnabled ? 'ACTIVE' : 'BYPASSED'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.highCutEnabled}
                    onChange={(e) => onUpdateConfig({ highCutEnabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!config.highCutEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Cutoff Frequency</span>
                    <span className="font-mono text-amber-400 font-bold">{config.highCutFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="12000"
                    step="250"
                    value={config.highCutFreq}
                    onChange={(e) => onUpdateConfig({ highCutFreq: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>3 kHz (Warm Vintage)</span>
                    <span className="text-amber-400 font-bold">6.5 kHz (Studio Cab)</span>
                    <span>12 kHz (Ultra Open)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-neutral-300 font-medium block">Filter Slope</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateConfig({ highCutSlope: '12db' })}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        config.highCutSlope === '12db'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      12 dB/Oct (Gentle)
                    </button>
                    <button
                      onClick={() => onUpdateConfig({ highCutSlope: '24db' })}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        config.highCutSlope === '24db'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      24 dB/Oct (Steep)
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    24 dB/Oct cuts severe whistle feedback twice as aggressively
                  </p>
                </div>
              </div>

              {/* Sub-Filters: Anti-Whine Notch & Low-Cut Rumble */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/80">
                {/* Anti-Whine Notch Filter */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200">Anti-Whine Notch (USB 8kHz)</span>
                    <input
                      type="checkbox"
                      checked={config.notchEnabled}
                      onChange={(e) => onUpdateConfig({ notchEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Targets sharp computer power supply whine without altering guitar tones
                  </p>
                  <div className={`space-y-1 ${!config.notchEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-400">Notch Center:</span>
                      <span className="text-amber-400">{config.notchFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="12000"
                      step="250"
                      value={config.notchFreq}
                      onChange={(e) => onUpdateConfig({ notchFreq: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Low-Cut Rumble Filter */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200">Low-Cut Rumble Filter</span>
                    <input
                      type="checkbox"
                      checked={config.lowCutEnabled}
                      onChange={(e) => onUpdateConfig({ lowCutEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Removes handling rumble, floor vibrations, and sub-audible AC hum
                  </p>
                  <div className={`space-y-1 ${!config.lowCutEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-400">Highpass Cutoff:</span>
                      <span className="text-amber-400">{config.lowCutFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      step="5"
                      value={config.lowCutFreq}
                      onChange={(e) => onUpdateConfig({ lowCutFreq: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. NOISE GATE SECTION */}
          {(activeTab === 'all' || activeTab === 'gate') && (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                    NG
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Click-Free Dynamic Noise Gate
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Silences background mic noise when not playing; opens smoothly with 4.5dB hysteresis and zero click artifacts
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-mono text-neutral-400">
                    {config.gateEnabled ? 'ACTIVE' : 'BYPASSED'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.gateEnabled}
                    onChange={(e) => onUpdateConfig({ gateEnabled: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!config.gateEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* Threshold Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Gate Threshold</span>
                    <span className="font-mono text-teal-400 font-bold">{config.gateThreshold} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-75"
                    max="-25"
                    step="1"
                    value={config.gateThreshold}
                    onChange={(e) => onUpdateConfig({ gateThreshold: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>-75 dB (Sensitive)</span>
                    <span className="text-teal-400 font-bold">-50 dB (Standard)</span>
                    <span>-25 dB (Heavy Metal)</span>
                  </div>
                </div>

                {/* Release Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Release Time (Note Fade)</span>
                    <span className="font-mono text-teal-400 font-bold">{config.gateReleaseMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="450"
                    step="10"
                    value={config.gateReleaseMs}
                    onChange={(e) => onUpdateConfig({ gateReleaseMs: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>30 ms (Fast Chug)</span>
                    <span>140 ms (Balanced)</span>
                    <span>450 ms (Long Sustain)</span>
                  </div>
                </div>

                {/* Attack Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Attack Time (Gate Opening)</span>
                    <span className="font-mono text-teal-400 font-bold">{config.gateAttackMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={config.gateAttackMs}
                    onChange={(e) => onUpdateConfig({ gateAttackMs: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>2 ms (Ultra Fast)</span>
                    <span>6 ms (Smooth &amp; Click-Free)</span>
                    <span>20 ms (Slow Fade)</span>
                  </div>
                </div>

                {/* Gate Reduction Depth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Attenuation Depth</span>
                    <span className="font-mono text-teal-400 font-bold">{config.gateReductionDb} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-75"
                    max="-18"
                    step="2"
                    value={config.gateReductionDb}
                    onChange={(e) => onUpdateConfig({ gateReductionDb: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>-75 dB (Silence)</span>
                    <span>-48 dB (Studio Standard)</span>
                    <span>-18 dB (Subtle Expand)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Info & Audio Tips */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                <HelpCircle size={14} className="text-amber-400" />
                <span>Why Microphone Noise Creates High-Pitched Sounds in Guitar Rigs</span>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {showExplanation ? 'Hide Guide' : 'Read Guide'}
              </span>
            </button>

            {showExplanation && (
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400 space-y-2 leading-relaxed animate-in fade-in">
                <p>
                  <strong className="text-neutral-200">The High-Gain Magnification Effect:</strong> Guitar distortion pedals
                  and high-gain amplifier models amplify weak input signals by up to <span className="text-amber-400">+60 dB (1,000x gain)</span>.
                  At this gain level, harmless background room air and thermal noise in computer soundcards get amplified into deafening hiss.
                </p>
                <p>
                  <strong className="text-neutral-200">High-Pitched USB Coil Whine:</strong> USB power supplies and digital converter clocks
                  radiate high-frequency electrical harmonics (often at 8 kHz and 16 kHz). When fed into non-linear tube modeling,
                  these carrier tones intermodulate into screaming whistles.
                </p>
                <p>
                  <strong className="text-emerald-400">Why De-Hiss Works:</strong> Electric guitar fundamentals stop at ~1,318 Hz (high E at 24th fret),
                  and real guitar speaker cabinets (like a Celestion Vintage 30) naturally drop off steeply above 5,000 Hz. Cutting everything above 6.5 kHz
                  eliminates 100% of the harsh squeal while retaining 100% of your authentic guitar tone and pick attack!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>0.00 ms Added Algorithmic Latency (Direct IIR Cascade)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
