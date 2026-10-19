import React, { useState } from 'react';
import { TunerData } from '../types/pedal';
import {
  Radio,
  Clock,
  VolumeX,
  Volume2,
  Minus,
  Plus,
  Sliders,
  Minimize2,
  Maximize2
} from 'lucide-react';

export interface CollapsedSectionsState {
  pedalboard: boolean;
  ampCab: boolean;
  looper: boolean;
}

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
  collapsedSections?: CollapsedSectionsState;
  onToggleSectionCollapse?: (section: keyof CollapsedSectionsState) => void;
  onToggleAllCollapse?: (collapseAll: boolean) => void;
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
  pedalsCount = 0,
  collapsedSections,
  onToggleSectionCollapse,
  onToggleAllCollapse
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

  const areAllCollapsed = Boolean(
    collapsedSections &&
    collapsedSections.pedalboard &&
    collapsedSections.ampCab &&
    collapsedSections.looper
  );

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 sm:p-2.5 mb-2 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
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
              <span className="w-12 text-center inline-block">TUNER</span>
            </button>

            {/* Note & Cents Meter display */}
            <div className="flex items-center gap-2 px-1">
              <span
                className={`font-mono text-base font-extrabold w-8 text-center tabular-nums ${
                  !isMicInput
                    ? 'text-neutral-600'
                    : tunerData.note
                    ? isCloseTune
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : 'text-neutral-500'
                }`}
              >
                {isMicInput ? tunerData.note || '—' : 'OFF'}
              </span>

              {/* Dynamic Cent Deviation Visualizer */}
              <div
                className="w-16 h-2 rounded bg-neutral-900 relative overflow-hidden border border-neutral-800"
                title={`Pitch Deviation: ${cents > 0 ? `+${cents}` : cents} cents`}
              >
                {/* Center In-tune target marker */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-neutral-600 z-10" />

                {isMicInput && tunerData.note && (
                  <div
                    className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75 -translate-x-1/2 ${
                      isCloseTune ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'
                    }`}
                    style={{
                      left: `${Math.max(10, Math.min(90, 50 + (cents / 50) * 40))}%`
                    }}
                  />
                )}
              </div>

              {/* Cents numerical readout */}
              <span className="text-[10px] font-mono tabular-nums w-8 text-neutral-400">
                {isMicInput && tunerData.note ? (cents > 0 ? `+${cents}` : `${cents}¢`) : ''}
              </span>
            </div>
          </div>

          {/* Master BPM Metronome & Tap Tempo */}
          <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2.5 py-1.5 shrink-0 shadow-inner">
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

        {/* Center Section: Rig View Layout Controls (Compact / Expanded Rig) */}
        {collapsedSections && onToggleSectionCollapse && (
          <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2.5 py-1.5 shadow-inner shrink-0">
            {onToggleAllCollapse && (
              <button
                onClick={() => onToggleAllCollapse(!areAllCollapsed)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                  areAllCollapsed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                }`}
                title={areAllCollapsed ? 'Expand all sections in rig' : 'Collapse all sections into compact view'}
              >
                {areAllCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                <span>{areAllCollapsed ? 'Expand All' : 'Compact All'}</span>
              </button>
            )}

            <div className="h-4 w-px bg-neutral-800 mx-1 hidden sm:block" />

            {/* Individual unit view toggles */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
              <button
                onClick={() => onToggleSectionCollapse('pedalboard')}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  collapsedSections.pedalboard
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={`Pedalboard: ${collapsedSections.pedalboard ? 'Collapsed (Click to Expand)' : 'Expanded (Click to Collapse)'}`}
              >
                Pedals {collapsedSections.pedalboard ? '▼' : '▲'}
              </button>
              <button
                onClick={() => onToggleSectionCollapse('ampCab')}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  collapsedSections.ampCab
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={`Amp & Cabinet: ${collapsedSections.ampCab ? 'Collapsed (Click to Expand)' : 'Expanded (Click to Collapse)'}`}
              >
                Amp &amp; Cab {collapsedSections.ampCab ? '▼' : '▲'}
              </button>
              <button
                onClick={() => onToggleSectionCollapse('looper')}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  collapsedSections.looper
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={`Looper: ${collapsedSections.looper ? 'Collapsed (Click to Expand)' : 'Expanded (Click to Collapse)'}`}
              >
                Looper {collapsedSections.looper ? '▼' : '▲'}
              </button>
            </div>
          </div>
        )}

        {/* Right Section: Bypass All, Master Mute & Volume */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Signal Chain True Bypass All Pedals Toggle */}
          <button
            onClick={onToggleBypassAll}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              isBypassAll
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
            title="Bypass all effects pedals (Amp & Cabinet remain active for clean tone testing)"
          >
            <Sliders size={13} className={isBypassAll ? 'text-rose-400' : 'text-neutral-400'} />
            <span className="w-28 text-center inline-block">
              {isBypassAll ? 'PEDALS BYPASSED' : 'BYPASS PEDALS'}
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
