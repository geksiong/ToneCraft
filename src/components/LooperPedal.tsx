import React from 'react';
import { LooperState } from '../types/pedal';
import { RotaryKnob } from './RotaryKnob';
import {
  Disc,
  Play,
  Square,
  RotateCcw,
  Volume2,
  FastForward,
  Rewind,
  Layers,
  CircleDot
} from 'lucide-react';

interface LooperPedalProps {
  looperState: LooperState;
  onToggleRecord: () => void;
  onTogglePlayStop: () => void;
  onClear: () => void;
  onUndo: () => void;
  onToggleReverse: () => void;
  onToggleSpeed: () => void;
  onVolumeChange: (vol: number) => void;
}

export const LooperPedal: React.FC<LooperPedalProps> = ({
  looperState,
  onToggleRecord,
  onTogglePlayStop,
  onClear,
  onUndo,
  onToggleReverse,
  onToggleSpeed,
  onVolumeChange
}) => {
  const {
    status,
    speed,
    reverse,
    volume,
    duration,
    currentTime,
    layersCount,
    hasUndo
  } = looperState;

  // Calculate loop progress percentage
  const effectiveDuration = duration > 0 ? duration / speed : 1;
  const progressPercent = duration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'recording':
        return { text: 'RECORDING (LAYER 1)', bg: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' };
      case 'overdubbing':
        return { text: 'OVERDUBBING', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' };
      case 'playing':
        return { text: 'PLAYING LOOP', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      default:
        return { text: 'STOPPED / READY', bg: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-4 my-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3.5 h-3.5 rounded-full border transition-all ${
              status === 'recording' || status === 'overdubbing'
                ? 'bg-red-500 led-glow-red border-red-300'
                : status === 'playing'
                ? 'bg-emerald-400 led-glow-emerald border-emerald-200'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          />
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
              <span>Infinity Tape Looper</span>
              <span className={`text-[10px] font-mono w-44 text-center inline-block px-2 py-0.5 rounded border truncate ${statusInfo.bg}`}>
                {statusInfo.text}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Multi-layer phrase recording with real-time overdubbing, half-speed, and reverse playback.
            </p>
          </div>
        </div>

        {/* Looper Utility Controls with constant widths */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSpeed}
            className={`w-[110px] justify-center px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 shrink-0 ${
              speed === 0.5
                ? 'bg-purple-950/80 text-purple-300 border-purple-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle half-speed (0.5x)"
          >
            <Rewind size={12} className="shrink-0" />
            <span className="w-20 text-center inline-block">0.5X SPEED</span>
          </button>

          <button
            onClick={onToggleReverse}
            className={`w-[96px] justify-center px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 shrink-0 ${
              reverse
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle reverse playback"
          >
            <FastForward size={12} className={`shrink-0 ${reverse ? 'scale-x-[-1]' : ''}`} />
            <span className="w-16 text-center inline-block">REVERSE</span>
          </button>

          {hasUndo && (
            <button
              onClick={onUndo}
              className="w-[116px] justify-center px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors flex items-center gap-1 shrink-0"
              title="Undo last overdub layer"
            >
              <RotateCcw size={12} className="shrink-0" />
              <span className="w-20 text-center inline-block">UNDO LAYER</span>
            </button>
          )}

          <button
            onClick={onClear}
            disabled={status === 'idle' && duration === 0}
            className="w-16 justify-center px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-300 text-neutral-400 border border-neutral-700 disabled:opacity-40 transition-colors shrink-0"
            title="Clear loop"
          >
            <span className="w-12 text-center inline-block">CLEAR</span>
          </button>
        </div>
      </div>

      {/* Main Looper Body: Circular Meter + Footswitches */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-4">
        {/* Visual Loop Position Ring & Meta */}
        <div className="md:col-span-4 flex items-center justify-center gap-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-neutral-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                className={`transition-all duration-75 ${
                  status === 'recording' || status === 'overdubbing'
                    ? 'text-red-500'
                    : 'text-emerald-400'
                }`}
                fill="transparent"
              />
            </svg>

            {/* Inner Ring Display with constant width & tabular-nums */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono font-bold text-neutral-200 tabular-nums w-16 text-center inline-block">
                {currentTime.toFixed(1)}s
              </span>
              <span className="text-[10px] font-mono text-neutral-400 tabular-nums w-16 text-center inline-block">
                / {duration > 0 ? duration.toFixed(1) : '0.0'}s
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Layers size={13} className="text-amber-400 shrink-0" />
              <span>Layers: <strong className="font-mono text-white tabular-nums w-4 inline-block text-center">{layersCount}</strong></span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Speed: {speed}x {reverse ? '· Rev' : ''}
            </div>
          </div>
        </div>

        {/* Big Footswitches with constant width labels */}
        <div className="md:col-span-6 flex items-center justify-center gap-8">
          {/* Footswitch 1: REC / OVERDUB */}
          <div className="flex flex-col items-center">
            <button
              onClick={onToggleRecord}
              className="relative p-1 rounded-full group focus:outline-none transition-transform active:scale-95"
              title={
                status === 'idle'
                  ? 'Record loop'
                  : status === 'recording'
                  ? 'Set loop endpoint and play'
                  : status === 'playing'
                  ? 'Overdub new layer'
                  : 'Finish overdub'
              }
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-600 flex items-center justify-center footswitch-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400 border border-neutral-400 flex items-center justify-center shadow-inner">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      status === 'recording' || status === 'overdubbing'
                        ? 'bg-red-600 text-white border-red-400 shadow-md'
                        : 'bg-neutral-200 text-neutral-800 border-white'
                    }`}
                  >
                    <CircleDot size={18} className={status === 'recording' || status === 'overdubbing' ? 'animate-ping' : ''} />
                  </div>
                </div>
              </div>
            </button>
            <span className="mt-2 text-[10px] font-bold tracking-wider font-mono uppercase text-red-400 w-24 text-center inline-block truncate">
              {status === 'idle' ? 'RECORD' : status === 'recording' ? 'SET LOOP' : status === 'playing' ? 'OVERDUB' : 'FINISH DUB'}
            </span>
          </div>

          {/* Footswitch 2: PLAY / STOP */}
          <div className="flex flex-col items-center">
            <button
              onClick={onTogglePlayStop}
              disabled={status === 'idle' && duration === 0}
              className="relative p-1 rounded-full group focus:outline-none transition-transform active:scale-95 disabled:opacity-40"
              title={status === 'playing' ? 'Stop playback' : 'Play loop'}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-600 flex items-center justify-center footswitch-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400 border border-neutral-400 flex items-center justify-center shadow-inner">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      status === 'playing'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-neutral-200 text-neutral-800 border-white'
                    }`}
                  >
                    {status === 'playing' ? <Square size={16} /> : <Play size={16} />}
                  </div>
                </div>
              </div>
            </button>
            <span className="mt-2 text-[10px] font-bold tracking-wider font-mono uppercase text-emerald-400 w-16 text-center inline-block truncate">
              {status === 'playing' ? 'STOP' : 'PLAY'}
            </span>
          </div>
        </div>

        {/* Looper Output Volume Knob */}
        <div className="md:col-span-2 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-neutral-800 pt-3 md:pt-0">
          <RotaryKnob
            label="Loop Vol"
            value={volume}
            min={0}
            max={100}
            unit="%"
            color="#10b981"
            onChange={onVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};
