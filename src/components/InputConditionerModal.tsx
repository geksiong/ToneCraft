import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
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
  inputSource
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Real-time Telemetry & Noise Floor Bar */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-inner space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Live Input Envelope &amp; Gate State
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  ({inputSource === 'mic' ? 'Live Microphone' : 'Sample Riff'})
                </span>
              </div>

              {/* Live Gate Status Indicator with constant width */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-52 justify-center flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shrink-0 ${
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
                  <span className="w-44 text-center inline-block truncate">
                    {telemetry.gateState === 'open'
                      ? 'GATE OPEN'
                      : telemetry.gateState === 'hold'
                      ? 'HOLD (SUSTAIN)'
                      : `MUTING (${telemetry.reductionDb} dB)`}
                  </span>
                </div>

                <div className="w-32 text-center text-xs font-mono text-neutral-300 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 shrink-0">
                  Input: <span className="text-emerald-400 font-bold tabular-nums w-14 text-right inline-block">{telemetry.inputDb} dB</span>
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
                <span>Signal level must exceed yellow marker to open the gate</span>
                <span className="text-amber-400">Marker: {config.gateThreshold} dB</span>
              </div>
            </div>

            {/* High-Pitch Whine Warning Alert if Detected */}
            {telemetry.highPitchNoiseDetected && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-in fade-in">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold">High-Frequency Mic Whine Detected ({telemetry.highPitchEnergyDb} dB):</span>{' '}
                  The De-Hiss Filter is actively suppressing high-frequency interference to stop harsh squeals.
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Presets */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Instant Presets:
            </span>

            {/* 1-Click Screech & Whine Killer */}
            <button
              onClick={onApplyWhineKiller}
              className="w-56 justify-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm group shrink-0"
              title="Immediately applies 6.5kHz lowpass steep filter and -50dB gate to silence feedback squeals"
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
                  gateThreshold: -46,
                  gateAttackMs: 2,
                  gateHoldMs: 15,
                  gateReleaseMs: 40,
                  gateReductionDb: -70,
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
                  gateThreshold: -58,
                  gateAttackMs: 4,
                  gateHoldMs: 40,
                  gateReleaseMs: 220,
                  gateReductionDb: -50,
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
                {/* Cutoff Frequency Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Cutoff Frequency</span>
                    <span className="font-mono text-amber-400 font-bold">{config.highCutFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="2500"
                    max="12000"
                    step="100"
                    value={config.highCutFreq}
                    onChange={(e) => onUpdateConfig({ highCutFreq: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>2.5 kHz (Warm / Heavy)</span>
                    <span className="text-amber-500 font-bold">6.5 kHz (Guitar Sweet Spot)</span>
                    <span>12 kHz (Bright)</span>
                  </div>
                </div>

                {/* Filter Slope Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-300 font-medium block">
                    Filter Rolloff Steepness
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateConfig({ highCutSlope: '24db' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all text-left ${
                        config.highCutSlope === '24db'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>24 dB/oct Steep</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Best for High-Gain Distortion</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ highCutSlope: '12db' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all text-left ${
                        config.highCutSlope === '12db'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>12 dB/oct Smooth</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Gentle rolloff for acoustic</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Anti-Whine Notch & Low-Cut Sub-Row */}
              <div className="pt-3 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 8kHz USB Whine Notch */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-200">8 kHz Anti-Whine Notch</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.notchEnabled}
                      onChange={(e) => onUpdateConfig({ notchEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Notches out narrow USB audio interface frame rate harmonics &amp; laptop coil squeal
                  </p>
                  <div className={`space-y-1 ${!config.notchEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-neutral-400">Notch Freq:</span>
                      <span className="text-amber-400">{config.notchFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="12000"
                      step="200"
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
                      Dynamic Studio Noise Gate
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Silences background mic noise when not playing; opens instantly in 3ms on note attack
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
                    <span>-75 dB (Gentle / Sensitive)</span>
                    <span className="text-teal-400 font-bold">-52 dB (Standard)</span>
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
                    min="20"
                    max="450"
                    step="10"
                    value={config.gateReleaseMs}
                    onChange={(e) => onUpdateConfig({ gateReleaseMs: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>20 ms (Fast Chug)</span>
                    <span>120 ms (Balanced)</span>
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
                    min="1"
                    max="20"
                    step="1"
                    value={config.gateAttackMs}
                    onChange={(e) => onUpdateConfig({ gateAttackMs: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>1 ms (Instant Pluck)</span>
                    <span>3 ms (Recommended)</span>
                    <span>20 ms (Soft Swell)</span>
                  </div>
                </div>

                {/* Reduction Depth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Attenuation Depth</span>
                    <span className="font-mono text-teal-400 font-bold">{config.gateReductionDb} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="-18"
                    step="2"
                    value={config.gateReductionDb}
                    onChange={(e) => onUpdateConfig({ gateReductionDb: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>-80 dB (Total Silence)</span>
                    <span>-60 dB (Studio Standard)</span>
                    <span>-18 dB (Subtle Expansion)</span>
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
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
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
