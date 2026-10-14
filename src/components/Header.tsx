import React, { useState } from 'react';
import { Preset, TunerData } from '../types/pedal';
import { SAMPLE_RIFFS } from '../audio/sampleRiffs';
import {
  Mic,
  Disc3,
  Volume2,
  Globe,
  Radio,
  Clock,
  VolumeX,
  Play,
  Square,
  Activity,
  Zap,
  AlertTriangle,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onToggleEngine: () => void;
  onRestartEngine?: () => void;
  inputSource: string;
  onSelectInputSource: (src: string) => void;
  inputGain: number;
  onInputGainChange: (gain: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  currentPreset: Preset;
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
  onOpenPresetLibrary: () => void;
  onOpenTuner: () => void;
  tunerData: TunerData;
  isBypassAll: boolean;
  onToggleBypassAll: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  inputPeak: number;
  outputPeak: number;
  isRiffPlaying: boolean;
  onToggleRiffPlaying: () => void;
  latencyMs?: number;
  coreEngineMode?: 'hd-worklet' | 'standard';
  onOpenLatencyInspector?: () => void;
  onMinimiseLatency?: () => Promise<void>;
  isTurboActive?: boolean;
  isBluetoothDetected?: boolean;
  onOpenInputConditioner?: () => void;
  conditionerEnabled?: boolean;
  gateState?: 'open' | 'hold' | 'closed';
  conditionerHighCut?: boolean;
  highPitchNoiseDetected?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleEngine,
  onRestartEngine,
  inputSource,
  onSelectInputSource,
  inputGain,
  onInputGainChange,
  masterVolume,
  onMasterVolumeChange,
  currentPreset,
  presets,
  onSelectPreset,
  onOpenPresetLibrary,
  onOpenTuner,
  tunerData,
  isBypassAll,
  onToggleBypassAll,
  bpm,
  onBpmChange,
  inputPeak,
  outputPeak,
  isRiffPlaying,
  onToggleRiffPlaying,
  latencyMs,
  coreEngineMode,
  onOpenLatencyInspector,
  onMinimiseLatency,
  isTurboActive,
  isBluetoothDetected,
  onOpenInputConditioner,
  conditionerEnabled,
  gateState,
  conditionerHighCut,
  highPitchNoiseDetected,
  isMuted = false,
  onToggleMute
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes.filter(t => now - t < 3000), now];
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTimes.length; i++) {
        intervals.push(newTimes[i] - newTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 280) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  const isRiffSource = inputSource !== 'mic';

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Main Power Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleEngine}
            className={`w-[124px] justify-center flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border shrink-0 ${
              isRunning
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title={isRunning ? 'Audio Engine is Active' : 'Click to Start Audio Processing'}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                isRunning
                  ? 'bg-amber-400 led-glow-amber animate-pulse'
                  : 'bg-neutral-700'
              }`}
            />
            <span className="font-mono w-[72px] text-center inline-block">{isRunning ? 'DSP ONLINE' : 'START DSP'}</span>
          </button>

          {isRunning && onRestartEngine && (
            <button
              onClick={onRestartEngine}
              className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/40 transition-all shrink-0"
              title="Reboot Audio Engine (reinitializes hardware pipeline without page reload if audio was interrupted)"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              ToneCraft
            </h1>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
              PRO DSP
            </span>
          </div>
        </div>

        {/* Input Selector, Riff Play/Stop Button & Input Meter */}
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300">
            {inputSource === 'mic' ? (
              <Mic size={14} className="text-red-400 animate-pulse" />
            ) : (
              <Disc3 size={14} className={`text-sky-400 ${isRiffPlaying && isRunning ? 'animate-spin' : ''}`} />
            )}
            <span className="text-[11px] font-mono text-neutral-400 uppercase">In:</span>
          </div>

          <select
            value={inputSource}
            onChange={(e) => onSelectInputSource(e.target.value)}
            className="w-44 sm:w-52 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 truncate shrink-0"
          >
            <option value="mic">🎤 Live Mic / USB Interface</option>
            <optgroup label="✨ Clean Tones">
              {SAMPLE_RIFFS.filter(r => r.category === 'Clean').map(riff => (
                <option key={riff.id} value={riff.id}>
                  ✨ {riff.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="⚡ Edge of Breakup">
              {SAMPLE_RIFFS.filter(r => r.category === 'Edge of Breakup').map(riff => (
                <option key={riff.id} value={riff.id}>
                  ⚡ {riff.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🔥 Rock & Metal">
              {SAMPLE_RIFFS.filter(r => r.category === 'Rock & Metal').map(riff => (
                <option key={riff.id} value={riff.id}>
                  🔥 {riff.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🎵 Bass Grooves">
              {SAMPLE_RIFFS.filter(r => r.category === 'Bass').map(riff => (
                <option key={riff.id} value={riff.id}>
                  🎵 {riff.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Test Riff Play / Pause button with constant width */}
          {isRiffSource && (
            <button
              onClick={onToggleRiffPlaying}
              className={`w-[104px] justify-center flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all shrink-0 ${
                isRiffPlaying && isRunning
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-sm'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title={isRiffPlaying && isRunning ? 'Pause audio test riff' : 'Play audio test riff'}
            >
              {isRiffPlaying && isRunning ? (
                <>
                  <Square size={11} className="fill-emerald-400 shrink-0" />
                  <span className="w-16 text-center inline-block">PLAYING</span>
                </>
              ) : (
                <>
                  <Play size={11} className="fill-emerald-400 text-emerald-400 shrink-0" />
                  <span className="w-16 text-center inline-block">PLAY RIFF</span>
                </>
              )}
            </button>
          )}

          {/* Input Peak Meter */}
          <div className="flex items-center gap-1 pl-1 shrink-0">
            <div className="w-12 h-2 rounded bg-neutral-950 overflow-hidden border border-neutral-800 flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                style={{ width: `${Math.min(100, inputPeak * 100)}%` }}
              />
            </div>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                inputPeak > 0.95 ? 'bg-red-500 led-glow-red' : 'bg-neutral-700'
              }`}
              title="Input Clip Indicator"
            />
          </div>

          {/* Mic Noise Gate & De-Hiss Filter Button with constant width */}
          {onOpenInputConditioner && (
            <button
              onClick={onOpenInputConditioner}
              className={`min-w-[96px] sm:min-w-[155px] justify-center flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono font-bold transition-all shrink-0 ${
                conditionerEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
              title="Studio Mic Conditioner: Dynamic Noise Gate, De-Hiss High-Cut Filter, and Anti-Whine Notch"
            >
              <div
                className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                  !conditionerEnabled
                    ? 'bg-neutral-600'
                    : gateState === 'open'
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                    : gateState === 'hold'
                    ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                    : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                }`}
              />
              <span className="hidden sm:inline-block w-24 text-center">GATE &amp; FILTER</span>
              <span className="sm:hidden inline-block w-12 text-center">GATE</span>
              {conditionerHighCut && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden md:inline">
                  DE-HISS
                </span>
              )}
              {highPitchNoiseDetected && (
                <span title="High-pitch mic noise suppressed">
                  <AlertTriangle size={12} className="text-amber-400 animate-pulse shrink-0" />
                </span>
              )}
            </button>
          )}
        </div>

        {/* Preset Selector & Cloud Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">Rig:</span>
            <select
              value={currentPreset.id}
              onChange={(e) => {
                const found = presets.find(p => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="bg-transparent text-xs font-semibold text-neutral-200 focus:outline-none w-36 truncate"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenPresetLibrary}
            className="w-28 justify-center flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-sm shrink-0"
            title="Browse & Share Cloud Presets"
          >
            <Globe size={13} className="shrink-0" />
            <span className="w-18 text-center inline-block">Cloud Hub</span>
          </button>
        </div>

        {/* Utilities: Latency Inspector, Tuner, Panic Bypass, Tap Tempo, Output Volume */}
        <div className="flex items-center gap-2">
          {/* Bluetooth High Latency Alert Badge */}
          {/* Bluetooth High Latency Alert Badge with constant width */}
          {isBluetoothDetected && (
            <button
              onClick={onOpenLatencyInspector}
              className="w-14 md:w-36 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-500/50 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-mono transition-all animate-pulse shrink-0"
              title="Bluetooth audio detected! Wireless Bluetooth adds 120-250ms hardware delay. Click to switch to wired headphones or USB audio interface."
            >
              <AlertTriangle size={13} className="text-rose-400 shrink-0" />
              <span className="hidden md:inline-block w-28 text-center font-bold">BLUETOOTH (+150ms)</span>
              <span className="md:hidden inline-block w-6 text-center font-bold">BT</span>
            </button>
          )}

          {/* Quick Latency Minimizer Turbo Button with constant width */}
          {onMinimiseLatency && !isTurboActive && (
            <button
              onClick={onMinimiseLatency}
              className="w-28 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-mono font-bold transition-all shadow-xs group shrink-0"
              title="Click to instantly activate Turbo Low-Latency profile (bypasses OS speech queues, sets 0 buffer hint, eliminates resamplers)"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="w-18 text-center inline-block">MINIMISE</span>
            </button>
          )}

          {/* Latency Inspector & Core Engine Mode Button with constant width */}
          {onOpenLatencyInspector && (
            <button
              onClick={onOpenLatencyInspector}
              className={`w-[88px] xl:w-[170px] justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors shadow-xs shrink-0 ${
                isTurboActive
                  ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-300'
              }`}
              title="Inspect Signal Chain Latency & Hardware Diagnostics"
            >
              <Activity
                size={13}
                className={`shrink-0 ${latencyMs && latencyMs > 25 ? 'text-rose-400 animate-pulse' : latencyMs && latencyMs > 12 ? 'text-amber-400' : 'text-emerald-400'}`}
              />
              <span className={`w-14 text-center tabular-nums inline-block font-bold ${latencyMs && latencyMs > 25 ? 'text-rose-300' : latencyMs && latencyMs > 12 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {latencyMs ? `${latencyMs.toFixed(1)}ms` : '4.8ms'}
              </span>
              {isTurboActive ? (
                <span className="w-20 text-center inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden xl:inline font-bold">
                  TURBO
                </span>
              ) : (
                <span className="w-20 text-center inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 hidden xl:inline">
                  {coreEngineMode === 'hd-worklet' ? 'HD WORKLET' : 'NATIVE'}
                </span>
              )}
            </button>
          )}

          {/* Chromatic Tuner Quick Button with constant width */}
          <button
            onClick={onOpenTuner}
            className={`w-20 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors shrink-0 ${
              tunerData.note
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Open Chromatic Guitar/Bass Tuner"
          >
            <Radio size={13} className="shrink-0" />
            <span className="w-11 text-center font-mono inline-block font-bold truncate">{tunerData.note || 'TUNER'}</span>
          </button>

          {/* Panic / Bypass All with constant width */}
          <button
            onClick={onToggleBypassAll}
            className={`w-32 justify-center px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1 shrink-0 ${
              isBypassAll
                ? 'bg-red-500/20 border-red-500 text-red-400 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="True-bypass all pedals in chain"
          >
            <VolumeX size={13} className="shrink-0" />
            <span className="w-24 text-center inline-block">{isBypassAll ? 'ALL BYPASSED' : 'BYPASS ALL'}</span>
          </button>

          {/* Tap Tempo with constant width */}
          <button
            onClick={handleTapTempo}
            className="w-24 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 transition-colors shrink-0"
            title="Tap tempo repeatedly to sync delay & modulation BPM"
          >
            <Clock size={13} className="shrink-0" />
            <span className="w-14 text-center font-mono tabular-nums inline-block">{bpm} BPM</span>
          </button>

          {/* Quick Silence / Master Mute Button with constant width */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`w-20 justify-center px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 ${
                isMuted
                  ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'bg-neutral-900 border-neutral-700/80 text-neutral-300 hover:text-red-400 hover:border-red-500/50'
              }`}
              title={isMuted ? 'Audio is MUTED (Click or press Space/M to un-mute)' : 'Quick Silence / Mute audio output (Press M)'}
            >
              <VolumeX size={14} className={`shrink-0 ${isMuted ? 'text-white' : 'text-red-400'}`} />
              <span className="w-12 text-center inline-block">{isMuted ? 'MUTED' : 'MUTE'}</span>
            </button>
          )}

          {/* Output Master Volume & Level Meter with constant width readout */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800 shrink-0">
            <div className={`flex items-center gap-1.5 transition-opacity ${isMuted ? 'opacity-40' : 'opacity-100'}`} title={`Master Volume: ${masterVolume}%`}>
              {isMuted || masterVolume <= 0 ? (
                <VolumeX size={14} className="text-red-400 shrink-0" />
              ) : (
                <Volume2 size={14} className="text-amber-400 shrink-0" />
              )}
              <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">Vol:</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={masterVolume}
                onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 shrink-0"
                title={`Master Volume: ${masterVolume}%`}
              />
              <span className="text-[10px] font-mono tabular-nums w-8 text-right inline-block text-neutral-300">
                {isMuted ? '0%' : `${masterVolume}%`}
              </span>
            </div>

            <div className="w-10 h-2 rounded bg-neutral-950 overflow-hidden border border-neutral-800 flex shrink-0">
              <div
                className={`h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-75 ${isMuted ? 'opacity-0' : 'opacity-100'}`}
                style={{ width: `${Math.min(100, (isMuted ? 0 : outputPeak) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
