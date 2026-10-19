import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Zap,
  VolumeX,
  Volume2,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Split,
  GitBranch,
  ArrowRight,
  Headphones,
  Check
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
}

export const InputSettingsTab: React.FC<InputSettingsTabProps> = ({
  config,
  telemetry,
  onUpdateConfig,
  onLearnNoiseFloor,
  isLearningNoiseFloor,
  onApplyWhineKiller,
  inputSource,
  inputGain,
  onInputGainChange,
  channelTelemetry,
  inputRoutingMode = 'auto',
  onInputRoutingChange,
  outputRoutingMode = 'stereo',
  onOutputRoutingChange
}) => {
  const [filterSubTab, setFilterSubTab] = useState<'all' | 'routing' | 'gate' | 'filter'>('all');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

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

  const ch1LevelPercent = channelTelemetry
    ? Math.min(100, Math.max(0, ((channelTelemetry.ch1LevelDb + 80) / 80) * 100))
    : 0;
  const ch2LevelPercent = channelTelemetry
    ? Math.min(100, Math.max(0, ((channelTelemetry.ch2LevelDb + 80) / 80) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* 0. MONO INPUT SOURCE IDENTIFICATION & DUAL-CHANNEL OUTPUT ROUTING */}
      {(filterSubTab === 'all' || filterSubTab === 'routing') && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 shadow-inner space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <GitBranch size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Mono Input Detection &amp; Dual-Channel Routing
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      channelTelemetry?.isMonoIdentified !== false
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                    }`}
                  >
                    {channelTelemetry?.isMonoIdentified !== false ? 'Mono ➔ Both Channels (L+R)' : 'Stereo Input'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Identifies mono guitar inputs on USB audio interfaces and routes output to both channels so you hear sound in both ears
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400">Output Routing:</span>
              <span className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400" />
                <span>Stereo L+R Active</span>
              </span>
            </div>
          </div>

          {/* Dual Channel Live Activity Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-850">
            {/* Input 1 / Left */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-neutral-300">Input 1 (Left / Jack 1)</span>
                  {channelTelemetry && channelTelemetry.ch1LevelDb > -58 ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE GUITAR
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-900 text-neutral-500 border border-neutral-800">
                      IDLE
                    </span>
                  )}
                </div>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {channelTelemetry && channelTelemetry.ch1LevelDb > -90 ? `${channelTelemetry.ch1LevelDb} dB` : '-∞ dB'}
                </span>
              </div>
              <div className="h-3 bg-neutral-900 rounded overflow-hidden border border-neutral-800 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 transition-all duration-75"
                  style={{ width: `${ch1LevelPercent}%` }}
                />
              </div>
            </div>

            {/* Input 2 / Right */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-neutral-300">Input 2 (Right / Jack 2)</span>
                  {channelTelemetry && channelTelemetry.ch2LevelDb > -58 ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE GUITAR
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-900 text-neutral-500 border border-neutral-800">
                      FLOATING / QUIET
                    </span>
                  )}
                </div>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {channelTelemetry && channelTelemetry.ch2LevelDb > -90 ? `${channelTelemetry.ch2LevelDb} dB` : '-∞ dB'}
                </span>
              </div>
              <div className="h-3 bg-neutral-900 rounded overflow-hidden border border-neutral-800 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 transition-all duration-75"
                  style={{ width: `${ch2LevelPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Routing Explanation Banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            <Radio size={14} className="text-emerald-400 shrink-0 animate-pulse" />
            <span className="font-bold shrink-0">Current Routing:</span>
            <span className="font-mono text-[11px] truncate text-emerald-200">
              {channelTelemetry?.description || 'Mono Source (Input 1 / Left) ➔ Duplicated to Both Channels (L+R)'}
            </span>
          </div>

          {/* Routing Mode Selection Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 block">
              Channel Routing Configuration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onInputRoutingChange && onInputRoutingChange('auto')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  inputRoutingMode === 'auto'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Zap size={13} />
                    Auto-Detect Mono
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Automatically identifies mono input (single-channel or active interface jack) and routes to both channels (L+R).
                </p>
              </button>

              <button
                type="button"
                onClick={() => onInputRoutingChange && onInputRoutingChange('mono-ch1')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  inputRoutingMode === 'mono-ch1'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    Mono: Input 1 (Left) ➔ L+R
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Always duplicates Input 1 to both Left &amp; Right channels. Standard for Focusrite, Behringer, and MOTU.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onInputRoutingChange && onInputRoutingChange('mono-ch2')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  inputRoutingMode === 'mono-ch2'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    Mono: Input 2 (Right) ➔ L+R
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Always duplicates Input 2 to both Left &amp; Right channels. Use when your guitar is in the 2nd jack.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onInputRoutingChange && onInputRoutingChange('mono-sum')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  inputRoutingMode === 'mono-sum'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    Mono Sum: (1 + 2) ➔ L+R
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Blends Input 1 and Input 2 equally to both channels. Useful for dual-pickup or stereo mic sum.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onInputRoutingChange && onInputRoutingChange('stereo')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  inputRoutingMode === 'stereo'
                    ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-sm ring-1 ring-sky-500/40'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    Stereo Pass-Through
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Discrete stereo routing (Input 1 ➔ Left, Input 2 ➔ Right) without mono duplication.
                </p>
              </button>
            </div>
          </div>

          {/* Master Output Distribution Mode */}
          <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Headphones size={15} className="text-neutral-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-neutral-200 block">
                  Master Output Channel Mode
                </span>
                <span className="text-[10px] text-neutral-400">
                  Select whether output preserves wide stereo effects or locks to strictly identical dual-mono
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOutputRoutingChange && onOutputRoutingChange('stereo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  outputRoutingMode === 'stereo'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Stereo (L/R)
              </button>
              <button
                type="button"
                onClick={() => onOutputRoutingChange && onOutputRoutingChange('dual-mono')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  outputRoutingMode === 'dual-mono'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Dual-Mono (Both Ears)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section Summary & Gate Master Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Microphone Input Conditioner &amp; Noise Gate
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  config.gateEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {config.gateEnabled ? 'Gate Active' : 'Gate Bypassed'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Eliminates high-pitched coil whine, feedback squeals, and background hiss before guitar amp stages
            </p>
          </div>
        </div>

        {/* Master Gate Button */}
        <button
          onClick={() => onUpdateConfig({ gateEnabled: !config.gateEnabled, enabled: true })}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border flex items-center gap-2 shrink-0 ${
            config.gateEnabled
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 shadow-sm'
              : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              config.gateEnabled
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-neutral-600'
            }`}
          />
          <span>{config.gateEnabled ? 'GATE: ENABLED' : 'GATE: BYPASSED'}</span>
        </button>
      </div>

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
              ({inputSource.startsWith('mic') ? 'Live Microphone' : 'Sample Riff'})
            </span>
          </div>

          {/* Fixed-width status indicators */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-48 justify-center flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shrink-0 ${
                !config.gateEnabled
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  : telemetry.gateState === 'open'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : telemetry.gateState === 'hold'
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  !config.gateEnabled
                    ? 'bg-neutral-600'
                    : telemetry.gateState === 'open'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : telemetry.gateState === 'hold'
                    ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                    : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                }`}
              />
              <span className="w-40 text-center inline-block truncate">
                {!config.gateEnabled
                  ? 'GATE: OFF (BYPASS)'
                  : telemetry.gateState === 'open'
                  ? 'GATE OPEN'
                  : telemetry.gateState === 'hold'
                  ? 'HOLD (SUSTAIN)'
                  : `MUTING (${telemetry.reductionDb} dB)`}
              </span>
            </div>

            {/* Constant-width Input dB display with tabular numbers */}
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

        {/* Learn Noise Floor Auto-Calibrate */}
        <button
          onClick={onLearnNoiseFloor}
          disabled={isLearningNoiseFloor}
          className={`w-56 justify-center px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            isLearningNoiseFloor
              ? 'bg-sky-500/30 border-sky-400 text-sky-200 animate-pulse'
              : 'bg-neutral-900 border-neutral-750 hover:border-neutral-500 text-neutral-300 hover:text-white'
          }`}
          title="Calibrate threshold to your room's ambient background noise level"
        >
          <Sparkles size={13} className="text-sky-400 shrink-0" />
          <span className="w-44 text-center inline-block truncate">
            {isLearningNoiseFloor ? 'Measuring Room Noise...' : 'Auto-Learn Noise Floor'}
          </span>
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

      {/* Filter / Gate / Routing Subtabs */}
      <div className="flex border-b border-neutral-800 gap-4 overflow-x-auto">
        <button
          onClick={() => setFilterSubTab('all')}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            filterSubTab === 'all'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          All Processors
        </button>
        <button
          onClick={() => setFilterSubTab('routing')}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            filterSubTab === 'routing'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Mono Detection &amp; Routing
        </button>
        <button
          onClick={() => setFilterSubTab('filter')}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            filterSubTab === 'filter'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Anti-Whine &amp; De-Hiss Filters
        </button>
        <button
          onClick={() => setFilterSubTab('gate')}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            filterSubTab === 'gate'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Dynamic Noise Gate
        </button>
      </div>

      {/* 1. FILTER SECTION: High-Cut De-Hiss & Anti-Whine */}
      {(filterSubTab === 'all' || filterSubTab === 'filter') && (
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
                {config.highCutEnabled ? 'Active' : 'Bypassed'}
              </span>
              <input
                type="checkbox"
                checked={config.highCutEnabled}
                onChange={(e) => onUpdateConfig({ highCutEnabled: e.target.checked, enabled: true })}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-emerald-500 focus:ring-emerald-500/20"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cutoff Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">High-Cut Freq</span>
                <span className="font-mono font-bold text-amber-400">
                  {config.highCutFreq >= 1000 ? `${(config.highCutFreq / 1000).toFixed(1)} kHz` : `${config.highCutFreq} Hz`}
                </span>
              </div>
              <input
                type="range"
                min="4000"
                max="12000"
                step="250"
                value={config.highCutFreq}
                disabled={!config.highCutEnabled}
                onChange={(e) => onUpdateConfig({ highCutFreq: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>4.0 kHz (Aggressive)</span>
                <span>7.5 kHz (Balanced)</span>
                <span>12.0 kHz (Bright)</span>
              </div>
            </div>

            {/* Filter Slope */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-neutral-300 block">Filter Attenuation Slope</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!config.highCutEnabled}
                  onClick={() => onUpdateConfig({ highCutSlope: '12db' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono border transition-all ${
                    config.highCutSlope === '12db'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  } disabled:opacity-40`}
                >
                  12 dB/Oct (Musical)
                </button>
                <button
                  type="button"
                  disabled={!config.highCutEnabled}
                  onClick={() => onUpdateConfig({ highCutSlope: '24db' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono border transition-all ${
                    config.highCutSlope === '24db'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  } disabled:opacity-40`}
                >
                  24 dB/Oct (Steep Brickwall)
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">
                24dB/oct strongly suppresses USB whine frequencies without muting guitar note brightness.
              </p>
            </div>
          </div>

          {/* Whine Notch Killer */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-sky-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-neutral-200 block">
                  Precision Whistle Notch Filter (Targeted Anti-Whine)
                </span>
                <span className="text-[10px] text-neutral-400">
                  Cuts ultra-sharp USB clock whine or grounding hum (freq: {config.notchFreq} Hz, Q: {config.notchQ})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-mono text-neutral-400">
                  {config.notchEnabled ? 'Enabled' : 'Bypassed'}
                </span>
                <input
                  type="checkbox"
                  checked={config.notchEnabled}
                  onChange={(e) => onUpdateConfig({ notchEnabled: e.target.checked, enabled: true })}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-sky-500/20"
                />
              </label>

              {config.notchEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2000"
                    max="8000"
                    step="50"
                    value={config.notchFreq}
                    onChange={(e) => onUpdateConfig({ notchFreq: Number(e.target.value) })}
                    className="w-24 sm:w-32 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <span className="text-xs font-mono text-sky-400 w-16 text-right">
                    {config.notchFreq} Hz
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Low-Cut Filter (Sub-bass Rumble) */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <VolumeX size={14} className="text-neutral-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-neutral-200 block">
                  Sub-Bass Rumble Low-Cut Filter
                </span>
                <span className="text-[10px] text-neutral-400">
                  Cuts mic desk thumps, AC hum, and sub-audible low rumble below {config.lowCutFreq} Hz
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-mono text-neutral-400">
                  {config.lowCutEnabled ? 'Active' : 'Off'}
                </span>
                <input
                  type="checkbox"
                  checked={config.lowCutEnabled}
                  onChange={(e) => onUpdateConfig({ lowCutEnabled: e.target.checked, enabled: true })}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-neutral-500 focus:ring-neutral-500/20"
                />
              </label>

              {config.lowCutEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="5"
                    value={config.lowCutFreq}
                    onChange={(e) => onUpdateConfig({ lowCutFreq: Number(e.target.value) })}
                    className="w-24 sm:w-32 h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                  />
                  <span className="text-xs font-mono text-neutral-300 w-14 text-right">
                    {config.lowCutFreq} Hz
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. NOISE GATE SECTION */}
      {(filterSubTab === 'all' || filterSubTab === 'gate') && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                NG
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Studio Dynamic Noise Gate
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Silences input when not playing; opens instantly with hysteresis so sustain tails never chatter
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-mono text-neutral-400">
                {config.gateEnabled ? 'Gate ON' : 'Gate Bypassed'}
              </span>
              <input
                type="checkbox"
                checked={config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateEnabled: e.target.checked, enabled: true })}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-teal-500 focus:ring-teal-500/20"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">Gate Open Threshold</span>
                <span className="font-mono font-bold text-amber-400">
                  {config.gateThreshold} dB
                </span>
              </div>
              <input
                type="range"
                min="-80"
                max="-20"
                step="1"
                value={config.gateThreshold}
                disabled={!config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateThreshold: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>-80 dB (Sensitive)</span>
                <span>-50 dB (Typical)</span>
                <span>-20 dB (Aggressive)</span>
              </div>
            </div>

            {/* Gate Reduction (Muting Depth) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">Attenuation (Mute Depth)</span>
                <span className="font-mono font-bold text-teal-400">
                  {config.gateReductionDb} dB
                </span>
              </div>
              <input
                type="range"
                min="-72"
                max="-18"
                step="3"
                value={config.gateReductionDb}
                disabled={!config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateReductionDb: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>-72 dB (Total Silence)</span>
                <span>-48 dB (Studio Norm)</span>
                <span>-18 dB (Soft Pad)</span>
              </div>
            </div>

            {/* Attack Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">Attack Time</span>
                <span className="font-mono font-bold text-emerald-400">
                  {config.gateAttackMs} ms
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={config.gateAttackMs}
                disabled={!config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateAttackMs: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-emerald-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>1 ms (Instant pick attack)</span>
                <span>15 ms</span>
                <span>30 ms (Slow swell)</span>
              </div>
            </div>

            {/* Hold Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">Hold Time (Sustain Buffer)</span>
                <span className="font-mono font-bold text-sky-400">
                  {config.gateHoldMs} ms
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={config.gateHoldMs}
                disabled={!config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateHoldMs: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>5 ms (Staccato)</span>
                <span>30 ms (Natural)</span>
                <span>150 ms (Long sustain)</span>
              </div>
            </div>

            {/* Release Time */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-300">Release Decay Time</span>
                <span className="font-mono font-bold text-indigo-400">
                  {config.gateReleaseMs} ms
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="400"
                step="10"
                value={config.gateReleaseMs}
                disabled={!config.gateEnabled}
                onChange={(e) => onUpdateConfig({ gateReleaseMs: Number(e.target.value) })}
                className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-indigo-400 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>20 ms (Rapid gating)</span>
                <span>100 ms (Tight rhythm)</span>
                <span>400 ms (Silky smooth fade)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Explanation Box */}
      <div className="border border-neutral-800 bg-neutral-950/60 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-neutral-900/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <HelpCircle size={14} className="text-amber-400" />
            <span>How does this eliminate microphone screech, coil whine, and room noise?</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {showExplanation ? 'Hide Guide ▲' : 'Show Guide ▼'}
          </span>
        </button>

        {showExplanation && (
          <div className="p-4 border-t border-neutral-800 text-xs text-neutral-400 space-y-2 bg-neutral-900/30">
            <p>
              High-gain guitar amps and neural models (NAM) amplify quiet input signals by up to <strong>+60 dB</strong>.
              Without pre-conditioning, ambient room noise, electromagnetic coil whine, and high-frequency USB clock jitter
              can cause deafening feedback loops or squeals.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-neutral-300">
              <li>
                <strong className="text-emerald-400">Pre-Amp Positioning:</strong> Conditioners run <em>before</em> your overdrive pedals and amp modeler, ensuring noise is stopped before it gets amplified.
              </li>
              <li>
                <strong className="text-amber-400">Hysteresis:</strong> The gate opens at the yellow marker but closes 2.5 dB lower, avoiding rapid clicking or stutter on sustained notes.
              </li>
              <li>
                <strong className="text-sky-400">De-Hiss Filter:</strong> Guitars produce little musical content above 6.5 kHz–7.5 kHz, so steep filtering cuts squeals while preserving note bite and articulation.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
