import React, { useState, useEffect } from 'react';
import { TunerData } from '../types/pedal';
import {
  Radio,
  Clock,
  VolumeX,
  Volume2,
  Minus,
  Plus,
  Sliders
} from 'lucide-react';

interface SignalChainControlStackProps {
  tunerData: TunerData;
  onOpenTuner: () => void;
  isMicInput?: boolean;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  outputPeak: number;
  isBypassAll: boolean;
  onToggleBypassAll: () => void;
  pedalsCount?: number;
}

export const SignalChainControlStack: React.FC<SignalChainControlStackProps> = ({
  tunerData,
  onOpenTuner,
  isMicInput = true,
  bpm,
  onBpmChange,
  isMuted,
  onToggleMute,
  masterVolume,
  onMasterVolumeChange,
  outputPeak,
  isBypassAll,
  onToggleBypassAll,
  pedalsCount = 0
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes.filter(t => now - t < 3000), now];
    setTapTimes(newTimes);

    if (newTimes.length >= 2) {
      const intervals: number[] = [];
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

  // Cents needle calculation (-50 to +50 cents mapped to -100% to +100%)
  const cents = tunerData?.cents ?? 0;
  const isCloseTune = Math.abs(cents) <= 5 && Boolean(tunerData?.note);

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 sm:p-3 mb-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Tuner & Tap Tempo */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 min-w-[280px]">
          {/* Chromatic Guitar/Bass Tuner Widget */}
          <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2.5 py-1.5 shrink-0 shadow-inner">
            <button
              onClick={isMicInput ? onOpenTuner : undefined}
              disabled={!isMicInput}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                !isMicInput
                  ? 'bg-neutral-900/50 border-neutral-800/60 text-neutral-500 opacity-60 cursor-not-allowed'
                  : tunerData.note
                  ? isCloseTune
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title={
                !isMicInput
                  ? 'Tuner is disabled: Select a Microphone or Audio Interface input in the top bar to tune'
                  : 'Open full-screen Chromatic Tuner'
              }
            >
              <Radio
                size={13}
                className={
                  !isMicInput
                    ? 'text-neutral-600'
                    : tunerData.note
                    ? 'text-emerald-400 animate-pulse'
                    : 'text-neutral-400'
                }
              />
              <span className="tracking-wider">TUNER</span>
              {!isMicInput && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700 font-mono">
                  MIC ONLY
                </span>
              )}
            </button>

            {/* Note & Pitch Tuning Display */}
            <div
              onClick={isMicInput ? onOpenTuner : undefined}
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded transition-colors ${
                isMicInput ? 'cursor-pointer hover:bg-neutral-900/60' : 'cursor-not-allowed opacity-60'
              }`}
              title={
                !isMicInput
                  ? 'Tuner is disabled while playing sample riffs. Switch input to Microphone to tune.'
                  : 'Detected guitar/bass string pitch'
              }
            >
              <div className="w-9 text-center">
                <span className={`text-base font-black font-mono tracking-tight leading-none ${
                  !isMicInput
                    ? 'text-neutral-600'
                    : tunerData.note
                    ? isCloseTune
                      ? 'text-emerald-400 text-glow-emerald'
                      : 'text-amber-300'
                    : 'text-neutral-500'
                }`}>
                  {!isMicInput ? '--' : tunerData.note || '--'}
                </span>
              </div>

              {/* Pitch Deviation Meter */}
              <div className="flex flex-col gap-0.5 w-16">
                <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden relative border border-neutral-800">
                  {/* Center zero line */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-neutral-600 z-10" />
                  {/* Needle */}
                  {isMicInput && tunerData.note && (
                    <div
                      className={`absolute top-0 bottom-0 w-1.5 rounded-full transition-all duration-75 ${
                        isCloseTune ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'
                      }`}
                      style={{
                        left: `${Math.max(5, Math.min(95, 50 + (cents / 50) * 45))}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-neutral-400 leading-none">
                  <span>b</span>
                  <span className="text-[8px] tabular-nums text-neutral-400">
                    {!isMicInput ? 'DISABLED' : tunerData.note ? `${cents > 0 ? '+' : ''}${cents.toFixed(0)}¢` : '0¢'}
                  </span>
                  <span>#</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tap Tempo & BPM Section */}
          <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2 py-1.5 shrink-0 shadow-inner">
            <button
              onClick={handleTapTempo}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 active:scale-95 active:bg-neutral-800"
              title="Click or tap rhythmically to set master BPM"
            >
              <Clock size={12} className="text-neutral-400" />
              <span>TAP</span>
            </button>

            {/* BPM Display & Steppers */}
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => onBpmChange(Math.max(40, bpm - 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors"
                title="Decrease 1 BPM"
              >
                <Minus size={10} />
              </button>

              <span className="w-14 text-center font-mono font-bold text-xs text-neutral-200 tabular-nums">
                {bpm} <span className="text-[10px] text-neutral-400 font-normal">BPM</span>
              </span>

              <button
                onClick={() => onBpmChange(Math.min(280, bpm + 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors"
                title="Increase 1 BPM"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Bypass All, Master Mute & Volume */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Signal Chain True Bypass All Toggle */}
          <button
            onClick={onToggleBypassAll}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              isBypassAll
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
            title="Bypass all pedals in the signal chain"
          >
            <Sliders size={13} className={isBypassAll ? 'text-rose-400' : 'text-neutral-400'} />
            <span className="w-20 text-center inline-block">
              {isBypassAll ? 'BYPASSED' : 'BYPASS ALL'}
            </span>
          </button>

          {/* Quick Master Mute Button with hotkey hint */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-xs ${
              isMuted
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-500/40'
            }`}
            title={isMuted ? 'Audio is MUTED (Click or press M to unmute)' : 'Mute master audio output (Press M)'}
          >
            <VolumeX size={14} className={isMuted ? 'text-white' : 'text-red-400'} />
            <span className="w-14 text-center inline-block">
              {isMuted ? 'MUTED' : 'MUTE'}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-neutral-400 hidden sm:inline">
              M
            </span>
          </button>

          {/* Master Volume Slider & Peak Meter */}
          <div
            className={`flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2.5 py-1.5 shadow-inner transition-opacity ${
              isMuted ? 'opacity-40' : 'opacity-100'
            }`}
            title={`Master Volume: ${masterVolume}%`}
          >
            {isMuted || masterVolume <= 0 ? (
              <VolumeX size={14} className="text-red-400 shrink-0" />
            ) : (
              <Volume2 size={14} className="text-amber-400 shrink-0" />
            )}
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold shrink-0">
              VOL:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              onDoubleClick={() => onMasterVolumeChange(85)}
              className="w-16 sm:w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 shrink-0"
              title={`Master Volume: ${masterVolume}% (Double-click to reset to 85%)`}
            />
            <span className="text-[10px] font-mono tabular-nums w-8 text-right inline-block text-neutral-300 font-bold">
              {isMuted ? '0%' : `${masterVolume}%`}
            </span>

            {/* Output Stereo/Mono Peak Meter */}
            <div className="w-12 h-2 rounded bg-neutral-900 overflow-hidden border border-neutral-800 flex shrink-0">
              <div
                className={`h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75 ${
                  isMuted ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ width: `${Math.min(100, (isMuted ? 0 : outputPeak) * 100)}%` }}
              />
            </div>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                !isMuted && outputPeak > 0.95 ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-neutral-800'
              }`}
              title="Master Bus Output Clip Indicator"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
