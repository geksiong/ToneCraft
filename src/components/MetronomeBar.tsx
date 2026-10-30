import React, { useState, useRef } from 'react';
import { MetronomeState, MetronomeSound } from '../audio/metronomeEngine';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus
} from 'lucide-react';

interface MetronomeBarProps {
  metronomeState: MetronomeState;
  onTogglePlay: () => void;
  onBpmChange: (bpm: number) => void;
  onTimeSignatureChange: (ts: 2 | 3 | 4 | 6) => void;
  onSoundChange: (sound: MetronomeSound) => void;
  onVolumeChange: (vol: number) => void;
  presetBpm?: number;
}

export const MetronomeBar: React.FC<MetronomeBarProps> = ({
  metronomeState,
  onTogglePlay,
  onBpmChange,
  onTimeSignatureChange,
  onSoundChange,
  onVolumeChange,
  presetBpm
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const tapTimesRef = useRef<number[]>([]);

  const {
    isPlaying,
    bpm,
    timeSignature,
    sound,
    volume,
    currentBeat,
    isAccent,
    countInActive,
    countInRemaining
  } = metronomeState;

  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = performance.now();
    const recent = [...tapTimesRef.current.filter(t => now - t < 2500), now];
    tapTimesRef.current = recent;

    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i] - recent[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgMs > 0) {
        const calculatedBpm = Math.max(30, Math.min(280, Math.round(60000 / avgMs)));
        onBpmChange(calculatedBpm);
      }
    }
  };

  const nudgeBpm = (delta: number) => {
    onBpmChange(Math.max(30, Math.min(280, bpm + delta)));
  };

  return (
    <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-2.5 transition-all duration-200">
      {/* Primary Metronome Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Play/Stop + Visual Beat Lights */}
        <div className="flex items-center gap-3">
          {/* Main Play/Stop Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 shadow-sm ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
            }`}
            title={isPlaying ? 'Stop Metronome' : 'Start Metronome'}
          >
            {isPlaying ? <Square size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
            <span>{isPlaying ? 'STOP' : 'CLICK'}</span>
          </button>

          {/* Beat Indicator Dots */}
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-800">
            {Array.from({ length: timeSignature }).map((_, i) => {
              const beatNum = i + 1;
              const isActive = isPlaying && currentBeat === beatNum;
              const isFirstBeat = i === 0;

              return (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border transition-all duration-75 flex items-center justify-center text-[8px] font-mono font-bold ${
                    isActive
                      ? isFirstBeat
                        ? 'bg-amber-400 border-amber-200 text-neutral-950 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                        : 'bg-emerald-400 border-emerald-200 text-neutral-950 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : isFirstBeat
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-500'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}
                >
                  {beatNum}
                </div>
              );
            })}
          </div>

          {/* Count-In Alert if active */}
          {countInActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse text-xs font-mono font-bold">
              <span>COUNT-IN:</span>
              <span className="text-white text-sm">{countInRemaining}</span>
            </div>
          )}
        </div>

        {/* Center: BPM Display, Sliders & Quick Nudge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nudge -1 */}
          <button
            onClick={() => nudgeBpm(-1)}
            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center text-xs transition-colors"
            title="Decrease 1 BPM"
          >
            <Minus size={11} />
          </button>

          {/* Large BPM read-out with manual input */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
            <Clock size={12} className="text-amber-400 shrink-0" />
            <input
              type="number"
              min="30"
              max="280"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-12 bg-transparent text-center font-mono font-bold text-sm text-neutral-100 focus:outline-none focus:text-amber-400"
            />
            <span className="text-[10px] font-mono text-neutral-400">BPM</span>
          </div>

          {/* Nudge +1 */}
          <button
            onClick={() => nudgeBpm(1)}
            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center text-xs transition-colors"
            title="Increase 1 BPM"
          >
            <Plus size={11} />
          </button>

          {/* Tap Tempo Button */}
          <button
            onClick={handleTapTempo}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-300 text-neutral-300 border border-neutral-700 text-xs font-mono font-semibold transition-all active:scale-95"
            title="Click repeatedly to tap tempo"
          >
            TAP
          </button>

          {/* Horizontal BPM Slider */}
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-20 sm:w-28 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 shrink-0"
            title={`Tempo: ${bpm} BPM`}
          />
        </div>

        {/* Right: Sound, Volume & Expand Options */}
        <div className="flex items-center gap-2">
          {/* Time Signature Quick Pills */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            {([2, 3, 4, 6] as const).map((ts) => (
              <button
                key={ts}
                onClick={() => onTimeSignatureChange(ts)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                  timeSignature === ts
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={`Set time signature to ${ts}/4`}
              >
                {ts}/4
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800">
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 80)}
              className="text-neutral-400 hover:text-amber-400 transition-colors"
              title={volume === 0 ? 'Unmute Metronome' : 'Mute Metronome'}
            >
              {volume === 0 ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-14 sm:w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title={`Metronome Volume: ${volume}%`}
            />
            <span className="text-[10px] font-mono text-neutral-400 tabular-nums w-6 text-right">
              {volume}%
            </span>
          </div>

          {/* Toggle More Options (Sound voice selection) */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
            title={isExpanded ? 'Hide Metronome Sound Settings' : 'Metronome Sounds & Options'}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Options Bar: Sound Profile & Info */}
      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[11px] font-mono flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> Click Voice:
            </span>
            <div className="flex items-center gap-1">
              {(['woodblock', 'beep', 'rimshot', 'cowbell'] as MetronomeSound[]).map((snd) => (
                <button
                  key={snd}
                  onClick={() => onSoundChange(snd)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all border ${
                    sound === snd
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {snd}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 font-mono">
            Tempo: <strong className="text-amber-400">{bpm} BPM</strong> (click & delay rate) · Pro Track Sync locks tracks 2-4 loop length to Track 1
          </p>
        </div>
      )}
    </div>
  );
};
