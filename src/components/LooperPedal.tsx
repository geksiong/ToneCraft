import React, { useState } from 'react';
import { LooperState, LooperTrackState } from '../types/pedal';
import { MetronomeState, MetronomeSound } from '../audio/metronomeEngine';
import { MetronomeBar } from './MetronomeBar';
import { RotaryKnob } from './RotaryKnob';
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  FastForward,
  Rewind,
  Layers,
  CircleDot,
  ChevronDown,
  ChevronUp,
  VolumeX,
  Radio,
  Sliders,
  Trash2,
  Lock,
  Unlock,
  Timer,
  Edit2,
  Check
} from 'lucide-react';

interface LooperPedalProps {
  looperState: LooperState;
  metronomeState: MetronomeState;
  // Basic & Global
  onToggleRecord: () => void;
  onTogglePlayStop: () => void;
  onClear: () => void;
  onUndo: () => void;
  onToggleReverse: () => void;
  onToggleSpeed: () => void;
  onVolumeChange: (vol: number) => void;
  onModeChange: (mode: 'basic' | 'pro') => void;
  onSyncLockChange?: (locked: boolean) => void;
  // Multi-Track Pro
  onToggleTrackRecord: (trackIdx: number) => void;
  onToggleTrackPlay: (trackIdx: number) => void;
  onToggleTrackMute: (trackIdx: number) => void;
  onToggleTrackSolo: (trackIdx: number) => void;
  onClearTrack: (trackIdx: number) => void;
  onUndoTrack: (trackIdx: number) => void;
  onTrackVolumeChange: (trackIdx: number, vol: number) => void;
  onTrackPanChange: (trackIdx: number, pan: number) => void;
  onTrackNameChange: (trackIdx: number, name: string) => void;
  onPlayAllTracks: () => void;
  onStopAllTracks: () => void;
  onClearAllTracks: () => void;
  // Metronome
  onToggleMetronome: () => void;
  onMetronomeBpmChange: (bpm: number) => void;
  onMetronomeTimeSignatureChange: (ts: 2 | 3 | 4 | 6) => void;
  onMetronomeSoundChange: (sound: MetronomeSound) => void;
  onMetronomeVolumeChange: (vol: number) => void;
  onStartLooperWithCountIn: (bars: number, trackIdx?: number) => void;
  presetBpm?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}

export const LooperPedal: React.FC<LooperPedalProps> = ({
  looperState,
  metronomeState,
  onToggleRecord,
  onTogglePlayStop,
  onClear,
  onUndo,
  onToggleReverse,
  onToggleSpeed,
  onVolumeChange,
  onModeChange,
  onSyncLockChange,
  onToggleTrackRecord,
  onToggleTrackPlay,
  onToggleTrackMute,
  onToggleTrackSolo,
  onClearTrack,
  onUndoTrack,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackNameChange,
  onPlayAllTracks,
  onStopAllTracks,
  onClearAllTracks,
  onToggleMetronome,
  onMetronomeBpmChange,
  onMetronomeTimeSignatureChange,
  onMetronomeSoundChange,
  onMetronomeVolumeChange,
  onStartLooperWithCountIn,
  presetBpm,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
  showCollapseToggle = true
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [editingTrackIdx, setEditingTrackIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [showMetronome, setShowMetronome] = useState<boolean>(true);

  // Responsive mode selection with instant React state feedback
  const [localMode, setLocalMode] = useState<'basic' | 'pro'>(() => looperState?.mode || 'basic');

  React.useEffect(() => {
    if (looperState?.mode) {
      setLocalMode(looperState.mode);
    }
  }, [looperState?.mode]);

  const effectiveMode = localMode;

  const handleModeChangeInternal = (targetMode: 'basic' | 'pro') => {
    setLocalMode(targetMode);
    onModeChange(targetMode);
  };

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
    hasUndo,
    tracks = [],
    activeTrackIndex = 0,
    syncLock = true
  } = looperState;

  // Fallback track lanes so all 4 tracks are always accessible even before AudioContext starts
  const defaultTracks: LooperTrackState[] = [0, 1, 2, 3].map((idx) => ({
    id: `track-${idx + 1}`,
    name: ['Track 1: Rhythm', 'Track 2: Lead / Riff', 'Track 3: Bassline', 'Track 4: Texture'][idx],
    status: 'idle',
    muted: false,
    soloed: false,
    volume: 85,
    pan: 0,
    duration: 0,
    layersCount: 0,
    hasUndo: false,
    hasData: false,
    waveformPreview: []
  }));

  const displayTracks = (tracks && tracks.length > 0) ? tracks : defaultTracks;

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

  const handleStartRename = (idx: number, currentName: string) => {
    setEditingTrackIdx(idx);
    setEditingName(currentName);
  };

  const handleSaveRename = (idx: number) => {
    onTrackNameChange(idx, editingName);
    setEditingTrackIdx(null);
  };

  return (
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-2.5 sm:p-3 my-2 transition-all duration-200">
      {/* ========================================================================= */}
      {/* HEADER BAR: Looper Identity, Basic/Pro Mode Toggle, Transport & Collapse */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* LED Status Glow */}
          <div
            className={`w-3.5 h-3.5 rounded-full border transition-all shrink-0 ${
              status === 'recording' || status === 'overdubbing'
                ? 'bg-red-500 led-glow-red border-red-300'
                : status === 'playing'
                ? 'bg-emerald-400 led-glow-emerald border-emerald-200'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
                <span>ToneCraft Phrase Looper</span>
              </h3>

              {/* Mode Switcher: BASIC vs PRO */}
              <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  onClick={() => handleModeChangeInternal('basic')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                    effectiveMode === 'basic'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Classic single-track phrase looper with tape overdubbing"
                >
                  BASIC
                </button>
                <button
                  onClick={() => handleModeChangeInternal('pro')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                    effectiveMode === 'pro'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="DAW-style Multi-Track Looper with individual mute, solo, clear, and overdub per track"
                >
                  <span>PRO 4-TRACK</span>
                  <span className="text-[9px] px-1 py-0.1 bg-indigo-900/60 rounded text-indigo-200">
                    4-CH
                  </span>
                </button>
              </div>

              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border truncate ${statusInfo.bg}`}>
                {statusInfo.text}
              </span>
            </div>
            {!isCollapsed && (
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {effectiveMode === 'pro'
                  ? 'Multi-track phrase recording with individual track mute, solo, clear, volume faders, and stereo pan.'
                  : 'Tape loop overdubbing with instant undo, half-speed, reverse playback, and synchronized metronome.'}
              </p>
            )}
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Metronome Visibility Toggle */}
          <button
            onClick={() => setShowMetronome(prev => !prev)}
            className={`px-2 py-1 text-xs font-mono rounded-lg border transition-all flex items-center gap-1.5 ${
              metronomeState.isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : showMetronome
                ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle Metronome Toolbar"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                metronomeState.isPlaying ? 'bg-amber-400 animate-ping' : 'bg-neutral-600'
              }`}
            />
            <span className="text-[11px] font-semibold">METRONOME</span>
          </button>

          {/* Half Speed (0.5X) */}
          <button
            onClick={onToggleSpeed}
            className={`px-2 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1 shrink-0 ${
              speed === 0.5
                ? 'bg-purple-950/80 text-purple-300 border-purple-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle half-speed (0.5x)"
          >
            <Rewind size={11} className="shrink-0" />
            <span>0.5X</span>
          </button>

          {/* Reverse Playback */}
          <button
            onClick={onToggleReverse}
            className={`px-2 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1 shrink-0 ${
              reverse
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle reverse playback"
          >
            <FastForward size={11} className={`shrink-0 ${reverse ? 'scale-x-[-1]' : ''}`} />
            <span>REV</span>
          </button>

          {/* Global Undo (Visible if any track has undo) */}
          {hasUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-1 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors flex items-center gap-1 shrink-0"
              title="Undo last recorded layer"
            >
              <RotateCcw size={11} className="shrink-0" />
              <span>UNDO</span>
            </button>
          )}

          {/* Clear All / Clear Loop */}
          <button
            onClick={effectiveMode === 'pro' ? onClearAllTracks : onClear}
            disabled={status === 'idle' && duration === 0 && !displayTracks.some(t => t.hasData)}
            className="px-2 py-1 text-xs font-mono rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-300 text-neutral-400 border border-neutral-700 disabled:opacity-40 transition-colors shrink-0"
            title={effectiveMode === 'pro' ? 'Clear all tracks' : 'Clear loop'}
          >
            <span>{effectiveMode === 'pro' ? 'CLEAR ALL' : 'CLEAR'}</span>
          </button>

          {/* Collapse Toggle */}
          {showCollapseToggle && (
            <button
              onClick={toggleCollapse}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all ${
                isCollapsed
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
              }`}
              title={isCollapsed ? 'Expand Looper to view full workstation' : 'Collapse into control strip'}
            >
              {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SYNCHRONIZED METRONOME BAR (AVAILABLE IN BOTH BASIC & PRO MODES)          */}
      {/* ========================================================================= */}
      {!isCollapsed && showMetronome && (
        <div className="mt-2.5">
          <MetronomeBar
            metronomeState={metronomeState}
            onTogglePlay={onToggleMetronome}
            onBpmChange={onMetronomeBpmChange}
            onTimeSignatureChange={onMetronomeTimeSignatureChange}
            onSoundChange={onMetronomeSoundChange}
            onVolumeChange={onMetronomeVolumeChange}
            presetBpm={presetBpm}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLLAPSED LOOPER VIEW: Compact strip with quick Record & Play buttons     */}
      {/* ========================================================================= */}
      {isCollapsed ? (
        <div className="py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Loop Progress & Position */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
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

            {effectiveMode === 'pro' ? (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono pl-2 border-l border-neutral-800">
                <span className="text-indigo-400 font-bold">Tracks:</span>
                <span className="text-white">
                  {displayTracks.filter(t => t.hasData).length}/{displayTracks.length}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono pl-2 border-l border-neutral-800">
                <Layers size={13} className="text-amber-400 shrink-0" />
                <span>Layers: <strong className="text-white tabular-nums">{layersCount}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Record / Play Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onToggleRecord}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all active:scale-95 shadow-md ${
                status === 'recording' || status === 'overdubbing'
                  ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                  : 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
              }`}
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

            <button
              onClick={effectiveMode === 'pro' ? onPlayAllTracks : onTogglePlayStop}
              disabled={status === 'idle' && duration === 0 && !displayTracks.some(t => t.hasData)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                status === 'playing'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              {status === 'playing' ? <Square size={14} /> : <Play size={14} />}
              <span>{status === 'playing' ? 'STOP' : 'PLAY'}</span>
            </button>

            {/* Quick Volume */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <Volume2 size={13} className="text-emerald-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 shrink-0"
              />
            </div>
          </div>
        </div>
      ) : effectiveMode === 'basic' ? (
        /* ========================================================================= */
        /* BASIC MODE: Circular Progress Ring & Dual 3D Stomp Footswitches           */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-4">
          {/* Visual Loop Position Ring */}
          <div className="md:col-span-4 flex items-center justify-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center">
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
                <span>Layers: <strong className="font-mono text-white tabular-nums">{layersCount}</strong></span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">
                Speed: {speed}x {reverse ? '· Rev' : ''}
              </div>
              {/* Count-in Record Option */}
              <button
                onClick={() => onStartLooperWithCountIn(1, 0)}
                className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-[10px] font-mono transition-colors"
                title="1-bar click count-in before recording starts"
              >
                <Timer size={11} className="text-amber-400" />
                <span>Count-in (1 Bar)</span>
              </button>
            </div>
          </div>

          {/* Big Footswitches */}
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

          {/* Master Output Volume Knob */}
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
      ) : (
        /* ========================================================================= */
        /* PRO MULTI-TRACK MODE: 4 Synchronized Audio Tracks Workstation             */
        /* ========================================================================= */
        <div className="py-3 space-y-3">
          {/* Master Pro Multi-Track Transport Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/80 px-3.5 py-2 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Play All */}
              <button
                onClick={onPlayAllTracks}
                disabled={!displayTracks.some(t => t.hasData)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 disabled:opacity-40 ${
                  status === 'playing'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                }`}
                title="Play all recorded tracks in sync"
              >
                <Play size={13} />
                <span>PLAY ALL</span>
              </button>

              {/* Stop All */}
              <button
                onClick={onStopAllTracks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-all active:scale-95"
                title="Stop playback on all tracks"
              >
                <Square size={13} />
                <span>STOP ALL</span>
              </button>

              {/* Master Track Sync Toggle (Sync tracks 2-4 to Track 1 master loop length) */}
              {onSyncLockChange && (
                <button
                  onClick={() => onSyncLockChange(!syncLock)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    syncLock
                      ? 'bg-indigo-950/70 text-indigo-300 border-indigo-600 shadow-sm'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                  }`}
                  title="Track Sync: Locks Tracks 2-4 to the exact loop length of Track 1. (Note: Metronome BPM sets click tempo)."
                >
                  {syncLock ? <Lock size={12} className="text-indigo-400" /> : <Unlock size={12} />}
                  <span>Track Sync (to Trk 1): {syncLock ? 'LOCKED' : 'FREE'}</span>
                </button>
              )}

              {/* Master Loop Duration Info */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300">
                <span className="text-neutral-400">Master Loop:</span>
                <span className="text-white font-bold tabular-nums">
                  {duration > 0 ? `${duration.toFixed(2)}s` : 'Not Set'}
                </span>
                {duration > 0 && (
                  <span className="text-neutral-500">
                    ({currentTime.toFixed(1)}s elapsed)
                  </span>
                )}
              </div>
            </div>

            {/* Master Volume Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                <Volume2 size={13} className="text-emerald-400" /> Master Vol:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-xs font-mono text-neutral-300 tabular-nums w-8 text-right">
                {volume}%
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 4 INDIVIDUAL MULTI-TRACK LANES                                        */}
          {/* ===================================================================== */}
          <div className="space-y-2">
            {displayTracks.map((track: LooperTrackState, idx: number) => {
              const isArmActive = track.status === 'recording' || track.status === 'overdubbing';
              const isPlaying = track.status === 'playing';
              const isTrackPlaying = track.status === 'playing' || track.status === 'overdubbing';
              const isEditingThis = editingTrackIdx === idx;

              // Track-specific playhead scrubber calculation
              const trackDur = track.duration > 0 ? track.duration : duration;
              const effectiveTrackDur = trackDur > 0 ? trackDur / speed : 1;
              const trackPos = track.currentPosition !== undefined
                ? track.currentPosition
                : (effectiveTrackDur > 0 ? (currentTime % effectiveTrackDur) * speed : 0);
              const trackProgressPercent = trackDur > 0
                ? Math.min(100, Math.max(0, (trackPos / trackDur) * 100))
                : (effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0);

              return (
                <div
                  key={track.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-150 ${
                    isArmActive
                      ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : track.soloed
                      ? 'bg-cyan-950/20 border-cyan-500/50'
                      : track.muted
                      ? 'bg-neutral-950/40 border-neutral-800 opacity-60'
                      : track.hasData
                      ? 'bg-neutral-950/80 border-neutral-800/90'
                      : 'bg-neutral-950/40 border-neutral-800/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Track Info & Name */}
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      {/* Track Number Badge */}
                      <div
                        className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                          isArmActive
                            ? 'bg-red-600 text-white border-red-400 animate-pulse'
                            : isPlaying
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Editable Track Name */}
                      <div className="min-w-0 flex-1">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(idx);
                                if (e.key === 'Escape') setEditingTrackIdx(null);
                              }}
                              autoFocus
                              className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                            />
                            <button
                              onClick={() => handleSaveRename(idx)}
                              className="p-1 hover:text-emerald-400 text-neutral-400"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-neutral-200 truncate">
                              {track.name}
                            </span>
                            <button
                              onClick={() => handleStartRename(idx, track.name)}
                              className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5"
                              title="Rename Track"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                          <span>
                            {track.hasData ? `${track.duration.toFixed(1)}s` : 'Empty'}
                          </span>
                          {track.layersCount > 1 && (
                            <span className="text-amber-400 font-semibold">
                              · {track.layersCount} layers
                            </span>
                          )}
                          {track.muted && (
                            <span className="text-amber-400 font-bold px-1 rounded bg-amber-500/10">
                              MUTED
                            </span>
                          )}
                          {track.soloed && (
                            <span className="text-cyan-400 font-bold px-1 rounded bg-cyan-500/10">
                              SOLO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Waveform Visualization Lane */}
                    <div className="flex-1 min-w-[140px] h-8 bg-neutral-900 rounded-lg border border-neutral-800/80 relative overflow-hidden flex items-center px-1.5">
                      {track.hasData && track.waveformPreview && track.waveformPreview.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-between gap-[2px]">
                          {track.waveformPreview.map((peak, pIdx) => {
                            const isBarActive = isTrackPlaying && trackProgressPercent >= (pIdx / track.waveformPreview!.length) * 100;
                            return (
                              <div
                                key={pIdx}
                                className={`flex-1 rounded-sm transition-colors duration-75 ${
                                  isBarActive
                                    ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                                    : isArmActive
                                    ? 'bg-red-400/70'
                                    : 'bg-neutral-600'
                                }`}
                                style={{
                                  height: `${Math.max(15, peak * 85)}%`
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full text-center text-[10px] font-mono text-neutral-600 italic select-none">
                          {isArmActive ? 'Recording Audio...' : 'No phrase recorded'}
                        </div>
                      )}

                      {/* Moving Playhead Scrubber */}
                      {isTrackPlaying && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white] pointer-events-none transition-all duration-75"
                          style={{ left: `${trackProgressPercent}%` }}
                        />
                      )}
                    </div>

                    {/* Right Controls: Rec/Dub, Play, Mute, Solo, Clear, Faders */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Record / Overdub Action */}
                      <button
                        onClick={() => onToggleTrackRecord(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 ${
                          isArmActive
                            ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
                            : 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25'
                        }`}
                        title={
                          track.status === 'idle' || track.status === 'stopped'
                            ? 'Record track'
                            : track.status === 'recording'
                            ? 'Finish recording and loop'
                            : track.status === 'playing'
                            ? 'Overdub onto this track'
                            : 'Finish overdub'
                        }
                      >
                        <CircleDot size={13} className={isArmActive ? 'animate-ping' : ''} />
                        <span>
                          {track.status === 'idle' || track.status === 'stopped'
                            ? 'REC'
                            : track.status === 'recording'
                            ? 'SET'
                            : track.status === 'playing'
                            ? 'DUB'
                            : 'END'}
                        </span>
                      </button>

                      {/* 1-Bar Count-in Trigger */}
                      <button
                        onClick={() => onStartLooperWithCountIn(1, idx)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-amber-400 border border-neutral-700 transition-colors"
                        title="Record with 1-bar count-in"
                      >
                        <Timer size={13} />
                      </button>

                      {/* Play / Stop per track */}
                      <button
                        onClick={() => onToggleTrackPlay(idx)}
                        disabled={!track.hasData}
                        className={`p-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-30 ${
                          isPlaying
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                        title={isPlaying ? 'Stop Track' : 'Play Track'}
                      >
                        {isPlaying ? <Square size={13} /> : <Play size={13} />}
                      </button>

                      {/* Mute Button */}
                      <button
                        onClick={() => onToggleTrackMute(idx)}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          track.muted
                            ? 'bg-amber-500/30 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                        title={track.muted ? 'Unmute track' : 'Mute track'}
                      >
                        M
                      </button>

                      {/* Solo Button */}
                      <button
                        onClick={() => onToggleTrackSolo(idx)}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          track.soloed
                            ? 'bg-cyan-500 text-neutral-950 border-cyan-300 font-extrabold shadow-sm'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                        title={track.soloed ? 'Disable Solo' : 'Solo track'}
                      >
                        S
                      </button>

                      {/* Undo Track Layer */}
                      {track.hasUndo && (
                        <button
                          onClick={() => onUndoTrack(idx)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors"
                          title="Undo last overdub on this track"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}

                      {/* Clear Track */}
                      <button
                        onClick={() => onClearTrack(idx)}
                        disabled={!track.hasData && track.status === 'idle'}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/70 hover:text-red-300 text-neutral-500 border border-neutral-700 disabled:opacity-30 transition-colors"
                        title="Clear track audio"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Track Volume Fader */}
                      <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800">
                        <Volume2 size={12} className="text-neutral-500 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={track.volume}
                          onChange={(e) => onTrackVolumeChange(idx, Number(e.target.value))}
                          className="w-14 sm:w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          title={`Track ${idx + 1} Volume: ${track.volume}%`}
                        />
                        <span className="text-[10px] font-mono text-neutral-400 tabular-nums w-6 text-right">
                          {track.volume}
                        </span>
                      </div>

                      {/* Track Pan Slider */}
                      <div className="flex items-center gap-1 pl-1 border-l border-neutral-800 text-[10px] font-mono text-neutral-500">
                        <span>Pan:</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={track.pan}
                          onChange={(e) => onTrackPanChange(idx, Number(e.target.value))}
                          className="w-12 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-300"
                          title={`Pan: ${track.pan === 0 ? 'Center' : track.pan < 0 ? `${Math.abs(track.pan)}% L` : `${track.pan}% R`}`}
                        />
                        <span className="w-4 text-center text-neutral-400 font-mono text-[9px]">
                          {track.pan === 0 ? 'C' : track.pan < 0 ? 'L' : 'R'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
