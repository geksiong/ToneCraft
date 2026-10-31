/**
 * @file BackingTrackMachine.tsx
 * @description Comprehensive Backing Track Machine with customisable chord progressions,
 * authentic rhythm patterns across genres, 4-track instrument mixer (Percussion, Bass, Guitar, Synth),
 * independent volume/mute/solo controls, and real-time beat & chord visualizer.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Sliders,
  Sparkles,
  Music,
  Disc3,
  Check,
  RotateCcw,
  Gauge,
  X,
  Headphones,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  BackingGenreId,
  BackingTrackState,
  ChordQuality,
  ChordStep,
  CHORD_QUALITY_LABELS,
  DrumComplexity,
  GENRE_PRESETS,
  getChordNotes,
  INSTRUMENT_STYLES,
  InstrumentId,
  NOTE_NAMES,
  POPULAR_PROGRESSION_PRESETS,
  RhythmFeel,
  StrumStyle,
  BassGroove
} from '../types/backingTrack';
import { backingTrackEngine } from '../audio/backingTrackEngine';

interface BackingTrackMachineProps {
  onBpmChange?: (bpm: number) => void;
  presetBpm?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
  onEnsureAudioReady?: () => Promise<void>;
}

export const BackingTrackMachine: React.FC<BackingTrackMachineProps> = ({
  onBpmChange,
  presetBpm,
  isCollapsed: isCollapsedProp = false,
  onToggleCollapse,
  showCollapseToggle = true,
  onEnsureAudioReady
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = onToggleCollapse !== undefined ? isCollapsedProp : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [engineState, setEngineState] = useState<BackingTrackState>(() => backingTrackEngine.getState());
  const [editingChordIndex, setEditingChordIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'mixer' | 'chords' | 'groove'>('chords');
  const [activeTriggers, setActiveTriggers] = useState<Record<InstrumentId, boolean>>({
    percussion: false,
    bass: false,
    guitar: false,
    synth: false
  });

  const tapTimesRef = useRef<number[]>([]);
  const triggerTimeoutsRef = useRef<Record<InstrumentId, any>>({
    percussion: null,
    bass: null,
    guitar: null,
    synth: null
  });

  // Subscribe to engine state updates via multi-subscriber listener
  useEffect(() => {
    const unsubState = backingTrackEngine.addStateListener((state) => {
      setEngineState(state);
    });

    const unsubTriggers = backingTrackEngine.addInstrumentTriggerListener((instId) => {
      setActiveTriggers((prev) => ({ ...prev, [instId]: true }));
      if (triggerTimeoutsRef.current[instId]) {
        clearTimeout(triggerTimeoutsRef.current[instId]);
      }
      triggerTimeoutsRef.current[instId] = setTimeout(() => {
        setActiveTriggers((prev) => ({ ...prev, [instId]: false }));
      }, 140);
    });

    return () => {
      unsubState();
      unsubTriggers();
      Object.values(triggerTimeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  // Sync external preset BPM if available
  useEffect(() => {
    if (presetBpm && presetBpm !== engineState.bpm && !engineState.isPlaying) {
      backingTrackEngine.setBpm(presetBpm);
      setEngineState(backingTrackEngine.getState());
    }
  }, [presetBpm]);

  const {
    isPlaying,
    bpm,
    genre,
    key,
    progression,
    currentChordIndex,
    currentBeat,
    currentBar,
    instruments,
    rhythmFeel,
    drumComplexity,
    strumStyle,
    bassGroove,
    masterVolume
  } = engineState;

  const currentChord = progression[currentChordIndex] || progression[0];
  const currentChordNotes = currentChord ? getChordNotes(currentChord.root, currentChord.quality) : [];

  // Triad calculation for collapsed preview: Previous (dimmed) -> Current (playing) -> Next (dimmed)
  const totalChords = progression.length;
  const safeCurrentIdx = totalChords > 0 ? ((currentChordIndex % totalChords) + totalChords) % totalChords : 0;
  const prevChordIdx = totalChords > 0 ? (safeCurrentIdx - 1 + totalChords) % totalChords : 0;
  const nextChordIdx = totalChords > 0 ? (safeCurrentIdx + 1) % totalChords : 0;

  const prevChord = totalChords > 0 ? progression[prevChordIdx] : null;
  const currChord = totalChords > 0 ? progression[safeCurrentIdx] : null;
  const nextChord = totalChords > 0 ? progression[nextChordIdx] : null;

  // Toggle Play / Stop with audio context readiness
  const handleTogglePlay = async () => {
    if (onEnsureAudioReady) {
      await onEnsureAudioReady();
    }
    await backingTrackEngine.toggle();
    setEngineState(backingTrackEngine.getState());
  };

  const handleStop = () => {
    backingTrackEngine.stop();
    setEngineState(backingTrackEngine.getState());
  };

  const handleBpmChange = (newBpm: number) => {
    backingTrackEngine.setBpm(newBpm);
    setEngineState(backingTrackEngine.getState());
    if (onBpmChange) onBpmChange(newBpm);
  };

  const nudgeBpm = (delta: number) => {
    handleBpmChange(bpm + delta);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const recent = [...tapTimesRef.current.filter((t) => now - t < 2500), now];
    tapTimesRef.current = recent;

    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i] - recent[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgMs > 0) {
        const calculatedBpm = Math.max(40, Math.min(260, Math.round(60000 / avgMs)));
        handleBpmChange(calculatedBpm);
      }
    }
  };

  const handleSelectGenre = (genreId: BackingGenreId) => {
    backingTrackEngine.applyGenrePreset(genreId, isPlaying);
    setEngineState(backingTrackEngine.getState());
  };

  const handleSelectProgressionPreset = (idx: number) => {
    backingTrackEngine.applyProgressionPreset(idx);
    setEngineState(backingTrackEngine.getState());
  };

  const handleAddChord = () => {
    const lastChord = progression[progression.length - 1] || { root: 'C', quality: 'maj', durationBars: 1 };
    const newChord: ChordStep = {
      id: `chord-${Math.random().toString(36).slice(2, 7)}`,
      root: lastChord.root,
      quality: lastChord.quality,
      durationBars: 1
    };
    backingTrackEngine.addChordStep(newChord);
    setEditingChordIndex(progression.length);
    setEngineState(backingTrackEngine.getState());
  };

  const handleDeleteChord = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    backingTrackEngine.removeChordStep(idx);
    if (editingChordIndex === idx) setEditingChordIndex(null);
    setEngineState(backingTrackEngine.getState());
  };

  const handleMoveChord = (idx: number, dir: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    backingTrackEngine.moveChordStep(idx, dir);
    setEngineState(backingTrackEngine.getState());
  };

  const handleTranspose = (semis: number) => {
    backingTrackEngine.transposeProgression(semis);
    setEngineState(backingTrackEngine.getState());
  };

  const handleKeyChange = (newKey: string) => {
    backingTrackEngine.setKey(newKey);
    setEngineState(backingTrackEngine.getState());
  };

  const handleUpdateChordStep = (idx: number, updated: Partial<ChordStep>) => {
    backingTrackEngine.updateChordStep(idx, updated);
    setEngineState(backingTrackEngine.getState());
  };

  const handleInstrumentVolumeChange = (inst: InstrumentId, vol: number) => {
    backingTrackEngine.setInstrumentVolume(inst, vol);
    setEngineState(backingTrackEngine.getState());
  };

  const handleInstrumentStyleChange = (inst: InstrumentId, style: string) => {
    backingTrackEngine.setInstrumentStyle(inst, style);
    setEngineState(backingTrackEngine.getState());
  };

  const handleToggleMute = (inst: InstrumentId) => {
    backingTrackEngine.toggleInstrumentMute(inst);
    setEngineState(backingTrackEngine.getState());
  };

  const handleToggleSolo = (inst: InstrumentId) => {
    backingTrackEngine.toggleInstrumentSolo(inst);
    setEngineState(backingTrackEngine.getState());
  };

  const handleRhythmFeelChange = (feel: RhythmFeel) => {
    backingTrackEngine.setRhythmFeel(feel);
    setEngineState(backingTrackEngine.getState());
  };

  const handleDrumComplexityChange = (comp: DrumComplexity) => {
    backingTrackEngine.setDrumComplexity(comp);
    setEngineState(backingTrackEngine.getState());
  };

  const handleStrumStyleChange = (style: StrumStyle) => {
    backingTrackEngine.setStrumStyle(style);
    setEngineState(backingTrackEngine.getState());
  };

  const handleBassGrooveChange = (groove: BassGroove) => {
    backingTrackEngine.setBassGroove(groove);
    setEngineState(backingTrackEngine.getState());
  };

  const handleMasterVolumeChange = (vol: number) => {
    backingTrackEngine.setMasterVolume(vol);
    setEngineState(backingTrackEngine.getState());
  };

  return (
    <div
      className={`bg-[#0C0F14] border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isPlaying ? 'border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.12)]' : 'border-[#1E232B]'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="bg-gradient-to-r from-neutral-900/90 via-[#13171F] to-neutral-900/90 border-b border-[#1E232B] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  isPlaying
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400'
                }`}
              >
                <Music size={20} className={isPlaying ? 'animate-bounce' : ''} />
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0C0F14] animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Backing Track Machine</h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {isPlaying ? 'ACTIVE JAM' : 'STOPPED'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                4-Track Web Audio band with custom chords, genres, and interactive rhythm mixer
              </p>
            </div>
          </div>

          {/* Center: When Collapsed, show strictly the 3 chords (prev dimmed -> current active -> next dimmed) */}
          {isCollapsed && currChord && (
            <div className="flex items-center gap-2 py-1 px-3 bg-neutral-950/80 border border-neutral-800 rounded-xl shadow-inner">
              {/* PREVIOUS CHORD - DIMMED */}
              {prevChord && (
                <div
                  className="px-2.5 py-1 rounded-lg bg-neutral-900/40 opacity-35"
                  title={`Previous Chord: ${prevChord.root} ${CHORD_QUALITY_LABELS[prevChord.quality]?.fullName || ''}`}
                >
                  <span className="font-mono text-sm font-semibold text-neutral-50">
                    {prevChord.root}
                    <span className="text-[10px] text-neutral-100 ml-0.5">
                      {CHORD_QUALITY_LABELS[prevChord.quality]?.label}
                    </span>
                  </span>
                </div>
              )}

              {/* Arrow */}
              <span className="text-neutral-600 text-xs font-mono select-none">&rarr;</span>

              {/* CURRENT PLAYING CHORD - ACTIVE */}
              <div
                className={`px-3 py-1 rounded-lg font-mono transition-all ${
                  isPlaying
                    ? 'text-amber-300 scale-105'
                    : 'text-white'
                }`}
                title={`Current Chord: ${currChord.root} ${CHORD_QUALITY_LABELS[currChord.quality]?.fullName || ''}`}
              >
                <span className="text-md font-black text-amber-200">
                  {currChord.root}
                  <span className="text-sm text-amber-300 ml-0.5">
                    {CHORD_QUALITY_LABELS[currChord.quality]?.label}
                  </span>
                </span>
              </div>

              {/* Arrow */}
              <span className="text-neutral-600 text-xs font-mono select-none">&rarr;</span>

              {/* NEXT CHORD - DIMMED */}
              {nextChord && (
                <div
                  className="px-2.5 py-1 rounded-lg bg-neutral-900/40 opacity-35"
                  title={`Next Chord: ${nextChord.root} ${CHORD_QUALITY_LABELS[nextChord.quality]?.fullName || ''}`}
                >
                  <span className="font-mono text-sm font-semibold text-neutral-50">
                    {nextChord.root}
                    <span className="text-[10px] text-neutral-100 ml-0.5">
                      {CHORD_QUALITY_LABELS[nextChord.quality]?.label}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Right Main Transport Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_16px_rgba(245,158,11,0.5)] border border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] border border-emerald-400/50'
              }`}
              title={isPlaying ? 'Pause Jam Playback' : 'Start Jam Playback'}
            >
              {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            {/* Dedicated STOP Button (ALWAYS visible) */}
            <button
              onClick={handleStop}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                isPlaying
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                  : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
              title="Stop playback and rewind to Bar 1"
            >
              <Square size={13} className={isPlaying ? 'fill-red-400 text-red-400' : 'fill-neutral-400 text-neutral-400'} />
              <span>STOP</span>
            </button>

            {/* Collapse / Expand Toggle */}
            {(showCollapseToggle || onToggleCollapse) && (
              <button
                onClick={handleToggleCollapse}
                className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors ml-1 cursor-pointer"
                title={isCollapsed ? 'Expand Backing Track Machine' : 'Collapse Backing Track Machine'}
              >
                {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Live Chord & Beat Stage Banner */}
        {!isCollapsed && (
          <div className="mt-3 pt-3 border-t border-neutral-800/70 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Active Chord Focus Display */}
            <div className="bg-neutral-950/80 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black font-mono text-amber-400 tracking-tight flex items-baseline gap-1">
                  <span>{currentChord ? currentChord.root : 'C'}</span>
                  <span className="text-base text-amber-200">
                    {currentChord ? CHORD_QUALITY_LABELS[currentChord.quality]?.label : 'Maj'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  <div className="text-white font-semibold">
                    {currentChord ? CHORD_QUALITY_LABELS[currentChord.quality]?.fullName : 'Major'}
                  </div>
                  <div className="text-neutral-400 tracking-wider">
                    {currentChordNotes.map((n) => n.name).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  CHORD {currentChordIndex + 1}/{progression.length}
                </span>
              </div>
            </div>

            {/* Bar & Beat Metronomic LED Tracker */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-neutral-300">BEAT</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((beatNum) => {
                    const isCurrent = isPlaying && currentBeat === beatNum;
                    return (
                      <div
                        key={beatNum}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-75 border ${
                          isCurrent
                            ? beatNum === 1
                              ? 'bg-amber-400 border-amber-200 text-neutral-950 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                              : 'bg-emerald-400 border-emerald-200 text-neutral-950 scale-105 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {beatNum}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-neutral-400">BAR </span>
                <span className="text-white font-bold">{currentBar}</span>
              </div>
            </div>

            {/* Tempo BPM & Master Volume */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
              {/* BPM controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => nudgeBpm(-1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center text-xs transition-colors"
                >
                  -
                </button>
                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
                  <Gauge size={12} className="text-amber-400" />
                  <input
                    type="number"
                    min={40}
                    max={260}
                    value={bpm}
                    onChange={(e) => handleBpmChange(Number(e.target.value))}
                    className="w-10 bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
                  />
                  <span className="text-[9px] font-mono text-neutral-400">BPM</span>
                </div>
                <button
                  onClick={() => nudgeBpm(1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center text-xs transition-colors"
                >
                  +
                </button>
                <button
                  onClick={handleTapTempo}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono font-bold text-amber-300 border border-neutral-700 active:scale-95 transition-all"
                  title="Click repeatedly to tap tempo"
                >
                  TAP
                </button>
              </div>

              {/* Master volume */}
              <div className="flex items-center gap-2">
                <Volume2 size={13} className="text-neutral-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                  className="w-16 accent-amber-500 cursor-pointer"
                  title={`Track Master: ${masterVolume}%`}
                />
                <span className="font-mono text-[10px] text-neutral-400 w-6 text-right">{masterVolume}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-3 sm:p-4 space-y-4">
          {/* 2. Genre Presets & Progression Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#10141B] border border-[#1E232B] rounded-xl p-2.5">
            {/* Genre Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 flex items-center gap-1">
                <Radio size={12} className="text-sky-400" /> Genre:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {GENRE_PRESETS.map((g) => {
                  const isSelected = genre === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGenre(g.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                          : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                      }`}
                    >
                      {g.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key & Transpose Controls */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Key selector */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono">
                <span className="text-[10px] text-neutral-400 uppercase">Key:</span>
                <select
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  {NOTE_NAMES.map((n) => (
                    <option key={n} value={n} className="bg-neutral-900 text-white">
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transpose +/- buttons */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold text-neutral-300 hover:bg-neutral-800 transition-colors"
                  title="Transpose Down 1 Semitone"
                >
                  -1
                </button>
                <span className="text-[9px] font-mono text-neutral-400">PITCH</span>
                <button
                  onClick={() => handleTranspose(1)}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold text-neutral-300 hover:bg-neutral-800 transition-colors"
                  title="Transpose Up 1 Semitone"
                >
                  +1
                </button>
              </div>

              {/* Progression Presets Dropdown */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs">
                <select
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!isNaN(idx)) handleSelectProgressionPreset(idx);
                  }}
                  defaultValue=""
                  className="bg-transparent text-neutral-300 font-medium text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="" disabled className="bg-neutral-900 text-neutral-400">
                    Progression Presets...
                  </option>
                  {POPULAR_PROGRESSION_PRESETS.map((p, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Navigation Tabs: Chords vs Mixer vs Groove */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('chords')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'chords'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Music size={13} />
                <span>Chord Progression ({progression.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('mixer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'mixer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Sliders size={13} />
                <span>4-Track Mixer & Instruments</span>
              </button>

              <button
                onClick={() => setActiveTab('groove')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'groove'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Sparkles size={13} />
                <span>Rhythm &amp; Groove Feel</span>
              </button>
            </div>

            {activeTab === 'chords' && (
              <button
                onClick={handleAddChord}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Chord</span>
              </button>
            )}
          </div>

          {/* TAB 1: CHORD PROGRESSION SEQUENCER */}
          {activeTab === 'chords' && (
            <div className="space-y-3">
              {/* Chord Steps Grid / Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {progression.map((chord, idx) => {
                  const isCurrent = isPlaying && currentChordIndex === idx;
                  const isEditing = editingChordIndex === idx;
                  const notes = getChordNotes(chord.root, chord.quality);

                  return (
                    <div
                      key={chord.id || idx}
                      onClick={() => setEditingChordIndex(isEditing ? null : idx)}
                      className={`relative group rounded-xl p-3 border transition-all cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-gradient-to-br from-amber-950/60 to-neutral-900 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)] scale-[1.02]'
                          : isEditing
                          ? 'bg-neutral-800/90 border-sky-400 shadow-md ring-1 ring-sky-400'
                          : 'bg-neutral-900/80 hover:bg-neutral-800/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {/* Top Bar inside card: Step number & Duration */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1.5">
                        <span className="font-bold text-neutral-400">#{idx + 1}</span>
                        <span className="px-1.5 py-0.2 rounded bg-neutral-950/60 border border-neutral-800 text-[9px] text-amber-300/90">
                          {chord.durationBars} {chord.durationBars === 1 ? 'bar' : 'bars'}
                        </span>
                      </div>

                      {/* Chord Name */}
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-xl font-black font-mono text-white tracking-tight">{chord.root}</span>
                        <span className="text-sm font-bold font-mono text-amber-400">
                          {CHORD_QUALITY_LABELS[chord.quality]?.label}
                        </span>
                      </div>

                      {/* Notes Preview */}
                      <div className="text-[10px] font-mono text-neutral-400 truncate tracking-wide">
                        {notes.map((n) => n.name).join(' ')}
                      </div>

                      {/* Hover action bar: Move & Delete */}
                      <div className="mt-2.5 pt-1.5 border-t border-neutral-800/60 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={(e) => handleMoveChord(idx, 'left', e)}
                            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                            title="Move Chord Left"
                          >
                            <ChevronLeft size={11} />
                          </button>
                          <button
                            disabled={idx === progression.length - 1}
                            onClick={(e) => handleMoveChord(idx, 'right', e)}
                            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                            title="Move Chord Right"
                          >
                            <ChevronRight size={11} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChordIndex(idx);
                            }}
                            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 transition-colors"
                            title="Edit Chord"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            disabled={progression.length <= 1}
                            onClick={(e) => handleDeleteChord(idx, e)}
                            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 disabled:opacity-20 transition-colors"
                            title="Delete Chord"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Playing Indicator Badge */}
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Chord Big Card */}
                <button
                  onClick={handleAddChord}
                  className="rounded-xl border border-dashed border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/50 p-4 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-amber-300 transition-all cursor-pointer min-h-[110px]"
                >
                  <Plus size={20} />
                  <span className="text-xs font-mono font-semibold">+ Add Step</span>
                </button>
              </div>

              {/* Inline Chord Editor Drawer (when a chord card is clicked) */}
              {editingChordIndex !== null && progression[editingChordIndex] && (
                <div className="bg-[#121620] border border-sky-500/40 rounded-xl p-3.5 space-y-3 shadow-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} className="text-sky-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase">
                        Editing Chord #{editingChordIndex + 1}:
                      </span>
                      <span className="text-sm font-black font-mono text-amber-400">
                        {progression[editingChordIndex].root}{' '}
                        {CHORD_QUALITY_LABELS[progression[editingChordIndex].quality]?.label}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingChordIndex(null)}
                      className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Root Note Picker */}
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block mb-1.5">
                        Root Note
                      </label>
                      <div className="grid grid-cols-6 gap-1">
                        {NOTE_NAMES.map((note) => {
                          const isSel = progression[editingChordIndex].root === note;
                          return (
                            <button
                              key={note}
                              onClick={() => handleUpdateChordStep(editingChordIndex, { root: note })}
                              className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                                isSel
                                  ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                              }`}
                            >
                              {note}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chord Quality / Flavor */}
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block mb-1.5">
                        Chord Quality &amp; Extension
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {(Object.keys(CHORD_QUALITY_LABELS) as ChordQuality[]).map((qual) => {
                          const isSel = progression[editingChordIndex].quality === qual;
                          return (
                            <button
                              key={qual}
                              onClick={() => handleUpdateChordStep(editingChordIndex, { quality: qual })}
                              className={`py-1 px-1.5 rounded text-[11px] font-mono transition-all truncate text-center ${
                                isSel
                                  ? 'bg-sky-500 text-neutral-950 font-black shadow-sm'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                              }`}
                              title={CHORD_QUALITY_LABELS[qual].fullName}
                            >
                              {CHORD_QUALITY_LABELS[qual].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration / Length */}
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block mb-1.5">
                        Duration (Bars)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[0.5, 1, 2].map((bars) => {
                          const isSel = progression[editingChordIndex].durationBars === bars;
                          return (
                            <button
                              key={bars}
                              onClick={() => handleUpdateChordStep(editingChordIndex, { durationBars: bars })}
                              className={`py-2 rounded text-xs font-mono font-bold transition-all ${
                                isSel
                                  ? 'bg-emerald-500 text-neutral-950 font-black shadow-sm'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                              }`}
                            >
                              {bars === 0.5 ? '1/2 Bar (2 beats)' : `${bars} ${bars === 1 ? 'Bar' : 'Bars'}`}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setEditingChordIndex(null)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 4-TRACK MIXER & INSTRUMENT COMBINATIONS */}
          {activeTab === 'mixer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  { id: 'percussion', title: 'Percussion & Drums', icon: Disc3, color: 'text-amber-400' },
                  { id: 'bass', title: 'Electric / Synth Bass', icon: Headphones, color: 'text-emerald-400' },
                  { id: 'guitar', title: 'Rhythm Guitar & Keys', icon: Music, color: 'text-sky-400' },
                  { id: 'synth', title: 'Synth & Ambient Pad', icon: Sparkles, color: 'text-purple-400' }
                ] as const
              ).map((inst) => {
                const config = instruments[inst.id];
                const isTriggered = activeTriggers[inst.id];
                const styles = INSTRUMENT_STYLES[inst.id];

                return (
                  <div
                    key={inst.id}
                    className={`rounded-xl p-3.5 border transition-all ${
                      config.muted
                        ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                        : config.solo
                        ? 'bg-neutral-900/90 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#10141B] border-[#1E232B]'
                    }`}
                  >
                    {/* Channel Header & Trigger Pulse LED */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <inst.icon size={15} className={inst.color} />
                        <span className="text-xs font-mono font-bold text-white">{inst.title}</span>
                      </div>
                      <div
                        className={`w-2.5 h-2.5 rounded-full border transition-all duration-75 ${
                          isTriggered
                            ? 'bg-amber-400 border-amber-200 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                            : 'bg-neutral-800 border-neutral-700'
                        }`}
                        title="Real-time voice trigger LED"
                      />
                    </div>

                    {/* Sound Preset Selector */}
                    <div className="mb-3">
                      <label className="text-[9px] font-mono text-neutral-400 uppercase block mb-1">Sound Style</label>
                      <select
                        value={config.style}
                        onChange={(e) => handleInstrumentStyleChange(inst.id, e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-medium focus:outline-none focus:border-amber-500 cursor-pointer truncate"
                      >
                        {styles.map((s) => (
                          <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Volume Fader Slider */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400">Level</span>
                        <span className="text-white font-bold">{config.volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.volume}
                        onChange={(e) => handleInstrumentVolumeChange(inst.id, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                      />
                    </div>

                    {/* Mute and Solo Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Mute */}
                      <button
                        onClick={() => handleToggleMute(inst.id)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          config.muted
                            ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {config.muted ? 'MUTED' : 'MUTE'}
                      </button>

                      {/* Solo */}
                      <button
                        onClick={() => handleToggleSolo(inst.id)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          config.solo
                            ? 'bg-amber-500 text-neutral-950 font-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        SOLO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: RHYTHM & GROOVE CUSTOMIZER */}
          {activeTab === 'groove' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#10141B] border border-[#1E232B] rounded-xl p-4">
              {/* Rhythm Feel / Swing */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                  Rhythm Feel / Swing
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: 'straight', label: 'Straight 16ths' },
                      { id: 'light-swing', label: 'Light Swing (Groove)' },
                      { id: 'heavy-shuffle', label: 'Heavy Shuffle / 12-8' }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleRhythmFeelChange(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left font-mono font-medium border transition-all ${
                        rhythmFeel === f.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drum Complexity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                  Percussion Density
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: 'minimal', label: 'Minimal (Anchor Beat)' },
                      { id: 'balanced', label: 'Balanced (Standard Kit)' },
                      { id: 'busy', label: 'Busy (Ghost Notes & Fills)' }
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleDrumComplexityChange(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left font-mono font-medium border transition-all ${
                        drumComplexity === c.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guitar Strum Pattern */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                  Guitar Strum Pattern
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: 'sustained', label: 'Whole Sustained' },
                      { id: 'quarter-strum', label: 'Quarter Strums (1,2,3,4)' },
                      { id: 'eighth-strum', label: '8th Note Driving' },
                      { id: 'funk-chank', label: '16th Funk Chanks' },
                      { id: 'syncopated', label: 'Syncopated Upbeats' }
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStrumStyleChange(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left font-mono font-medium border transition-all ${
                        strumStyle === s.id
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bass Groove Style */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                  Bass Groove Style
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { id: 'root-sustain', label: 'Root Sustain' },
                      { id: 'driving-eighths', label: 'Driving 8ths (Rock)' },
                      { id: 'root-fifth', label: 'Root - 5th Alternating' },
                      { id: 'walking', label: 'Walking 4-to-the-bar' },
                      { id: 'syncopated-funk', label: 'Syncopated Funk Slap' }
                    ] as const
                  ).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleBassGrooveChange(b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left font-mono font-medium border transition-all ${
                        bassGroove === b.id
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
