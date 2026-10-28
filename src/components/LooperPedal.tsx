import React, { useState } from 'react';
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
  CircleDot,
  ChevronDown,
  ChevronUp
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}

export const LooperPedal: React.FC<LooperPedalProps> = ({
  looperState,
  onToggleRecord,
  onTogglePlayStop,
  onClear,
  onUndo,
  onToggleReverse,
  onToggleSpeed,
  onVolumeChange,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
  showCollapseToggle = true
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = controlledToggleCollapse || (() => setInternalCollapsed(prev => !prev));

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
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-2.5 sm:p-3 my-2 transition-all duration-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-3 h-3 rounded-full border transition-all shrink-0 ${
              status === 'recording' || status === 'overdubbing'
                ? 'bg-red-500 led-glow-red border-red-300'
                : status === 'playing'
                ? 'bg-emerald-400 led-glow-emerald border-emerald-200'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2 flex-wrap">
              <span>Infinity Tape Looper</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border truncate ${statusInfo.bg}`}>
                {statusInfo.text}
              </span>
            </h3>
            {!isCollapsed && (
              <p className="text-[10px] text-neutral-400">
                Multi-layer phrase recording with real-time overdubbing, half-speed, and reverse playback.
              </p>
            )}
          </div>
        </div>

        {/* Header Actions (Speed, Rev, Undo, Clear, and Collapse Toggle) */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            onClick={onToggleSpeed}
            className={`px-2 py-0.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1 shrink-0 ${
              speed === 0.5
                ? 'bg-purple-950/80 text-purple-300 border-purple-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle half-speed (0.5x)"
          >
            <Rewind size={11} className="shrink-0" />
            <span>0.5X</span>
          </button>

          <button
            onClick={onToggleReverse}
            className={`px-2 py-0.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1 shrink-0 ${
              reverse
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle reverse playback"
          >
            <FastForward size={11} className={`shrink-0 ${reverse ? 'scale-x-[-1]' : ''}`} />
            <span>REV</span>
          </button>

          {hasUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-0.5 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors flex items-center gap-1 shrink-0"
              title="Undo last overdub layer"
            >
              <RotateCcw size={11} className="shrink-0" />
              <span className="hidden sm:inline">UNDO</span>
            </button>
          )}

          <button
            onClick={onClear}
            disabled={status === 'idle' && duration === 0}
            className="px-2 py-0.5 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-300 text-neutral-400 border border-neutral-700 disabled:opacity-40 transition-colors shrink-0"
            title="Clear loop"
          >
            <span>CLEAR</span>
          </button>

          {/* Collapse / Expand Toggle Button (Hidden in Tab View) */}
          {showCollapseToggle && (
            <button
              onClick={toggleCollapse}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-lg border transition-all ${
                isCollapsed
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
              }`}
              title={isCollapsed ? 'Expand Looper to view circular meter and foot controls' : 'Collapse Looper into compact control strip'}
            >
              {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              <span>{isCollapsed ? 'Expand Looper' : 'Collapse'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSED LOOPER VIEW: Compact strip with active Record & Play buttons     */}
      {/* ========================================================================= */}
      {isCollapsed ? (
        <div className="py-1 flex flex-wrap items-center justify-between gap-3">
          {/* Loop Progress & Position */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Horizontal Progress Bar */}
            <div className="w-28 sm:w-44 h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 shrink-0">
              <div
                className={`h-full transition-all duration-75 ${
                  status === 'recording' || status === 'overdubbing'
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
              <span className="font-bold tabular-nums text-white">
                {currentTime.toFixed(1)}s
              </span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400 tabular-nums">
                {duration > 0 ? duration.toFixed(1) : '0.0'}s
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono pl-2 border-l border-neutral-800">
              <Layers size={13} className="text-amber-400 shrink-0" />
              <span>Layers: <strong className="text-white tabular-nums">{layersCount}</strong></span>
            </div>
          </div>

          {/* Dedicated RECORD / PLAY Controls for Collapsed View */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* RECORD / OVERDUB BUTTON */}
            <button
              onClick={onToggleRecord}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all active:scale-95 shadow-md ${
                status === 'recording' || status === 'overdubbing'
                  ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                  : 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
              }`}
              title={
                status === 'idle'
                  ? 'Record loop (Click to begin recording)'
                  : status === 'recording'
                  ? 'Set loop endpoint and begin playback'
                  : status === 'playing'
                  ? 'Overdub new layer'
                  : 'Finish overdub'
              }
            >
              <CircleDot
                size={14}
                className={status === 'recording' || status === 'overdubbing' ? 'animate-ping' : ''}
              />
              <span>
                {status === 'idle'
                  ? 'RECORD'
                  : status === 'recording'
                  ? 'SET LOOP'
                  : status === 'playing'
                  ? 'OVERDUB'
                  : 'FINISH DUB'}
              </span>
            </button>

            {/* PLAY / STOP BUTTON */}
            <button
              onClick={onTogglePlayStop}
              disabled={status === 'idle' && duration === 0}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                status === 'playing'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
              title={status === 'playing' ? 'Stop loop playback' : 'Play recorded loop'}
            >
              {status === 'playing' ? <Square size={14} /> : <Play size={14} />}
              <span>{status === 'playing' ? 'STOP' : 'PLAY'}</span>
            </button>

            {/* Compact Volume Control */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <Volume2 size={13} className="text-emerald-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 shrink-0"
                title={`Loop Volume: ${volume}%`}
              />
              <span className="text-[10px] font-mono text-neutral-400 tabular-nums w-7 text-right">
                {volume}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* EXPANDED LOOPER VIEW: Full Circular Position Ring + 3D Footswitches       */
        /* ========================================================================= */
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
      )}
    </div>
  );
};
