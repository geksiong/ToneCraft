import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Zap,
  Volume2,
  Activity,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Mic,
  Disc3,
  Wand2
} from 'lucide-react';
import {
  InputConditionerConfig,
  InputConditionerTelemetry
} from '../../audio/inputConditioner';
import {
  InputChannelTelemetry,
  InputChannelRoutingMode,
  OutputChannelRoutingMode
} from '../../audio/inputChannelRouter';

export interface InputSettingsTabProps {
  config: InputConditionerConfig;
  telemetry: InputConditionerTelemetry;
  onUpdateConfig: (newConfig: Partial<InputConditionerConfig>) => void;
  onLearnNoiseFloor: () => void;
  isLearningNoiseFloor: boolean;
  onApplyWhineKiller: () => void;
  inputSource: string;
  inputGain?: number;
  onInputGainChange?: (gain: number) => void;
  channelTelemetry?: InputChannelTelemetry;
  inputRoutingMode?: InputChannelRoutingMode;
  onInputRoutingChange?: (mode: InputChannelRoutingMode) => void;
  outputRoutingMode?: OutputChannelRoutingMode;
  onOutputRoutingChange?: (mode: OutputChannelRoutingMode) => void;
  availableInputDevices?: { deviceId: string; label: string; isBluetooth?: boolean }[];
  availableOutputDevices?: { deviceId: string; label: string; isBluetooth: boolean }[];
}

export const InputSettingsTab: React.FC<InputSettingsTabProps> = ({
  config,
  telemetry,
  onUpdateConfig,
  onLearnNoiseFloor,
  isLearningNoiseFloor,
  onApplyWhineKiller,
  inputSource,
  inputGain = 50,
  onInputGainChange,
  channelTelemetry,
  inputRoutingMode = 'auto',
  onInputRoutingChange,
  outputRoutingMode = 'stereo',
  onOutputRoutingChange
}) => {
  const [showProControls, setShowProControls] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<'guitar' | 'vocal' | 'line'>('guitar');

  // Calculate dB string for input gain slider
  const getInputGainDbString = (val: number): string => {
    if (val <= 0) return 'MUTE';
    const db = ((val - 50) / 50) * (val >= 50 ? 14 : 26);
    if (Math.abs(db) < 0.05) return '0.0 dB';
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  // Convert dB to meter percentages (-70 dB to 0 dB range)
  const inputMeterPercent = Math.min(
    100,
    Math.max(0, ((telemetry.inputDb + 70) / 70) * 100)
  );

  const thresholdPercent = Math.min(
    100,
    Math.max(0, ((config.gateThreshold + 70) / 70) * 100)
  );

  const ch1LevelPercent = channelTelemetry
    ? Math.min(100, Math.max(0, ((channelTelemetry.ch1LevelDb + 70) / 70) * 100))
    : 0;
  const ch2LevelPercent = channelTelemetry
    ? Math.min(100, Math.max(0, ((channelTelemetry.ch2LevelDb + 70) / 70) * 100))
    : 0;

  // 1-Tap Smart Instrument Presets
  const applyInstrumentProfile = (profile: 'guitar' | 'vocal' | 'line') => {
    setActiveProfile(profile);
    if (profile === 'guitar') {
      onUpdateConfig({
        gateEnabled: true,
        gateThreshold: -54,
        gateReleaseMs: 60,
        gateHoldMs: 40,
        lowCutEnabled: true,
        lowCutFreq: 40
      });
      if (onInputRoutingChange) onInputRoutingChange('auto');
    } else if (profile === 'vocal') {
      onUpdateConfig({
        gateEnabled: true,
        gateThreshold: -48,
        gateReleaseMs: 120,
        gateHoldMs: 80,
        lowCutEnabled: true,
        lowCutFreq: 85
      });
      if (onInputRoutingChange) onInputRoutingChange('auto');
    } else if (profile === 'line') {
      onUpdateConfig({
        gateEnabled: false,
        gateThreshold: -65,
        lowCutEnabled: false
      });
      if (onInputRoutingChange) onInputRoutingChange('stereo');
    }
  };

  // Determine current noise gate level
  const currentGateMode = !config.gateEnabled
    ? 'off'
    : config.gateThreshold <= -58
    ? 'gentle'
    : config.gateThreshold <= -48
    ? 'smart'
    : 'aggressive';

  const setGateMode = (mode: 'off' | 'gentle' | 'smart' | 'aggressive') => {
    if (mode === 'off') {
      onUpdateConfig({ gateEnabled: false });
    } else if (mode === 'gentle') {
      onUpdateConfig({
        gateEnabled: true,
        gateThreshold: -62,
        gateReleaseMs: 80,
        gateReductionDb: -45
      });
    } else if (mode === 'smart') {
      onUpdateConfig({
        gateEnabled: true,
        gateThreshold: -52,
        gateReleaseMs: 60,
        gateReductionDb: -55
      });
    } else if (mode === 'aggressive') {
      onUpdateConfig({
        gateEnabled: true,
        gateThreshold: -42,
        gateReleaseMs: 40,
        gateReductionDb: -70
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. SMART ONE-TAP INSTRUMENT PROFILES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold uppercase tracking-wider text-neutral-300">
            Instrument &amp; Input Profile
          </span>
          <span className="text-[11px] font-mono">
            Source: {inputSource.startsWith('mic') ? 'Live Physical Input' : 'Sample Riff'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Electric Guitar */}
          <button
            type="button"
            onClick={() => applyInstrumentProfile('guitar')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeProfile === 'guitar'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-base">🎸</span>
                <span>Electric Guitar</span>
              </span>
              {activeProfile === 'guitar' && (
                <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              High-Z mono auto-route, hum suppression &amp; low-cut anti-rumble.
            </p>
          </button>

          {/* Vocal / Mic */}
          <button
            type="button"
            onClick={() => applyInstrumentProfile('vocal')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeProfile === 'vocal'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Mic size={15} className="text-sky-400" />
                <span>Vocal / Acoustic Mic</span>
              </span>
              {activeProfile === 'vocal' && (
                <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              85Hz low-cut rumble filter with vocal envelope sustain.
            </p>
          </button>

          {/* Line In / Sample */}
          <button
            type="button"
            onClick={() => applyInstrumentProfile('line')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeProfile === 'line'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Disc3 size={15} className="text-emerald-400" />
                <span>Line In / Clean Audition</span>
              </span>
              {activeProfile === 'line' && (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Transparent stereo routing with zero gate coloration.
            </p>
          </button>
        </div>
      </div>

      {/* 2. LIVE SIGNAL METER & INPUT GAIN TRIM */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Input Level &amp; Gain Calibration
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-neutral-400">Peak:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {Number.isFinite(telemetry.inputDb) && telemetry.inputDb > -80
                ? `${telemetry.inputDb.toFixed(1)} dB`
                : '-∞ dB'}
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">Trim:</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {getInputGainDbString(inputGain)}
            </span>
          </div>
        </div>

        {/* Live Peak Envelope Bar */}
        <div className="space-y-1.5">
          <div className="relative h-4 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800/90 flex items-center">
            {/* Visual signal meter */}
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 via-amber-500 to-rose-600 transition-all duration-75"
              style={{ width: `${inputMeterPercent}%` }}
            />
            {/* Gate threshold marker */}
            {config.gateEnabled && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_#fbbf24]"
                style={{ left: `${thresholdPercent}%` }}
                title={`Gate Threshold: ${config.gateThreshold} dB`}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>-70 dB</span>
            <span>-40 dB</span>
            <span className="text-amber-400/90 font-semibold">
              {config.gateEnabled ? `Gate: ${config.gateThreshold} dB` : 'Gate Off'}
            </span>
            <span>-12 dB</span>
            <span className="text-rose-400 font-bold">0 dB</span>
          </div>
        </div>

        {/* Gain Trim Slider */}
        {onInputGainChange && (
          <div className="pt-2 border-t border-neutral-800/70 flex items-center gap-3">
            <Volume2 size={16} className="text-neutral-400 shrink-0" />
            <span className="text-xs font-medium text-neutral-300 shrink-0 w-20">
              Input Trim:
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={inputGain}
              onChange={(e) => onInputGainChange(Number(e.target.value))}
              className="flex-1 accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onInputGainChange(50)}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-mono text-neutral-300 hover:text-white border border-neutral-700 transition-colors flex items-center gap-1 shrink-0"
              title="Reset gain to unity (0.0 dB)"
            >
              <RotateCcw size={11} />
              <span>0.0 dB</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SMART NOISE SUPPRESSION & AUTO-LEARN */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                Smart Noise Gate &amp; Denoise
              </h4>
              <p className="text-xs text-neutral-400">
                Eliminates single-coil buzz, stage hum, and high-gain amp feedback
              </p>
            </div>
          </div>

          {/* Gate status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !config.gateEnabled
                  ? 'bg-neutral-600'
                  : telemetry.gateState === 'open'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : telemetry.gateState === 'hold'
                  ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
            <span className="text-xs font-mono font-semibold text-neutral-300">
              {!config.gateEnabled
                ? 'Bypassed'
                : telemetry.gateState === 'open'
                ? 'Signal Open'
                : telemetry.gateState === 'hold'
                ? 'Sustaining'
                : 'Muting Noise'}
            </span>
          </div>
        </div>

        {/* 1-Tap Noise Gate Mode Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setGateMode('off')}
            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
              currentGateMode === 'off'
                ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Bypass (Off)
          </button>
          <button
            type="button"
            onClick={() => setGateMode('gentle')}
            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
              currentGateMode === 'gentle'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Gentle (-62 dB)
          </button>
          <button
            type="button"
            onClick={() => setGateMode('smart')}
            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
              currentGateMode === 'smart'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Smart Gate (-52 dB)
          </button>
          <button
            type="button"
            onClick={() => setGateMode('aggressive')}
            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
              currentGateMode === 'aggressive'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            High-Gain (-42 dB)
          </button>
        </div>

        {/* Auto-Learn Noise Floor Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-850">
          <div className="flex items-center gap-2.5">
            <Wand2 size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-neutral-200 block">
                Automatic Room Noise Learning
              </span>
              <span className="text-[11px] text-neutral-400">
                Mute your strings for 2 seconds to calculate ideal threshold
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLearnNoiseFloor}
            disabled={isLearningNoiseFloor}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 ${
              isLearningNoiseFloor
                ? 'bg-amber-500 text-black animate-pulse'
                : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Sparkles size={13} className={isLearningNoiseFloor ? 'animate-spin' : ''} />
            <span>{isLearningNoiseFloor ? 'LISTENING (KEEP QUIET)...' : 'CALIBRATE NOISE FLOOR'}</span>
          </button>
        </div>
      </div>

      {/* 4. EXPANDABLE PRO AUDIO CONTROLS */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60">
        <button
          type="button"
          onClick={() => setShowProControls(!showProControls)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-850 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-amber-400" />
            <span>Pro Audio Controls (Channel Routing &amp; Hardware Filters)</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="text-[11px] font-mono">{showProControls ? 'Collapse' : 'Expand'}</span>
            {showProControls ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {showProControls && (
          <div className="p-4 sm:p-5 border-t border-neutral-800 space-y-5 bg-neutral-950/80 animate-in fade-in duration-150">
            {/* A. Channel Routing Matrix */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-200 uppercase tracking-wider">
                  Mono Interface Input Routing
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Active: {channelTelemetry?.description || 'Auto-Detect'}
                </span>
              </div>

              {/* Dual Channel Live Mini-Meters */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-900/90 rounded-lg border border-neutral-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Input 1 (Left / Jack 1)</span>
                    <span className="text-emerald-400 font-bold">
                      {channelTelemetry && channelTelemetry.ch1LevelDb > -80
                        ? `${channelTelemetry.ch1LevelDb} dB`
                        : '-∞ dB'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${ch1LevelPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Input 2 (Right / Jack 2)</span>
                    <span className="text-emerald-400 font-bold">
                      {channelTelemetry && channelTelemetry.ch2LevelDb > -80
                        ? `${channelTelemetry.ch2LevelDb} dB`
                        : '-∞ dB'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${ch2LevelPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Routing Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    { id: 'auto', label: 'Auto Detect', desc: 'Auto mono duplication' },
                    { id: 'mono-ch1', label: 'Input 1 (L)', desc: 'Jack 1 ➔ Both Ears' },
                    { id: 'mono-ch2', label: 'Input 2 (R)', desc: 'Jack 2 ➔ Both Ears' },
                    { id: 'mono-sum', label: 'Sum (1+2)', desc: 'Blends both jacks' },
                    { id: 'stereo', label: 'Discrete Stereo', desc: 'L to L, R to R' }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onInputRoutingChange && onInputRoutingChange(mode.id)}
                    className={`p-2 rounded-lg text-left border transition-all ${
                      inputRoutingMode === mode.id
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{mode.label}</span>
                    <span className="text-[10px] text-neutral-400 leading-tight block">
                      {mode.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* B. Master Output Routing */}
            {onOutputRoutingChange && (
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">
                    Monitor Output Mode
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Switch between stereo studio monitors and dual-mono headphones
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOutputRoutingChange('stereo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      outputRoutingMode === 'stereo'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Stereo L/R
                  </button>
                  <button
                    type="button"
                    onClick={() => onOutputRoutingChange('dual-mono')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      outputRoutingMode === 'dual-mono'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dual-Mono
                  </button>
                </div>
              </div>
            )}

            {/* C. Low-Cut Rumble Filter & Anti-Whine Notch Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-800">
              {/* Low-Cut Filter */}
              <div className="p-3.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    Low-Cut Filter (Anti-Rumble)
                  </span>
                  <input
                    type="checkbox"
                    checked={config.lowCutEnabled}
                    onChange={(e) => onUpdateConfig({ lowCutEnabled: e.target.checked })}
                    className="accent-amber-500 h-4 w-4 cursor-pointer rounded"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={30}
                    max={200}
                    step={5}
                    disabled={!config.lowCutEnabled}
                    value={config.lowCutFreq}
                    onChange={(e) => onUpdateConfig({ lowCutFreq: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 h-1.5 bg-neutral-950 rounded cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-xs font-mono text-amber-400 w-14 text-right">
                    {config.lowCutFreq} Hz
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Cuts sub-bass stage rumble, handling noise, and AC line offset.
                </p>
              </div>

              {/* Anti-Whine Notch Filter */}
              <div className="p-3.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    USB Coil Whine Killer
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notchEnabled}
                    onChange={(e) => onUpdateConfig({ notchEnabled: e.target.checked })}
                    className="accent-amber-500 h-4 w-4 cursor-pointer rounded"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-neutral-400">
                    Target: {config.notchFreq} Hz (Q: {config.notchQ})
                  </span>
                  <button
                    type="button"
                    onClick={onApplyWhineKiller}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold transition-colors"
                  >
                    Auto Notch
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Precision notch filter targeting high-pitch 8kHz USB power supply whine.
                </p>
              </div>
            </div>

            {/* D. Granular Gate Envelope */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">
                Manual Gate Envelope Timings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Attack</span>
                    <span className="text-neutral-200">{config.gateAttackMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={config.gateAttackMs}
                    onChange={(e) => onUpdateConfig({ gateAttackMs: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-900 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Hold</span>
                    <span className="text-neutral-200">{config.gateHoldMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={5}
                    value={config.gateHoldMs}
                    onChange={(e) => onUpdateConfig({ gateHoldMs: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-900 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Release</span>
                    <span className="text-neutral-200">{config.gateReleaseMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={500}
                    step={10}
                    value={config.gateReleaseMs}
                    onChange={(e) => onUpdateConfig({ gateReleaseMs: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-900 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
