import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PRACTICE_RIFFS } from '../../data/riffsLibraryData';
import { PracticeRiff } from '../../types/riffs';
import { TablatureView } from './TablatureView';
import { RiffPickerModal } from './RiffPickerModal';
import { RiffInfoModal } from './RiffInfoModal';
import { riffPlaybackEngine, RiffEngineStatus } from '../../audio/riffPlaybackEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Sparkles,
  Info,
  Clock,
  Flame,
  Headphones,
  Layers,
  ChevronDown,
  Gauge,
  ListMusic,
  Disc,
  Music
} from 'lucide-react';

interface RiffsPracticeLibraryProps {
  onApplyPreset?: (presetId: string) => void;
  isEngineRunning: boolean;
  onEnsureEngineRunning: () => Promise<void>;
}

export const RiffsPracticeLibrary: React.FC<RiffsPracticeLibraryProps> = ({
  onApplyPreset,
  isEngineRunning,
  onEnsureEngineRunning
}) => {
  // Selected Riff State
  const [selectedRiffId, setSelectedRiffId] = useState<string>(PRACTICE_RIFFS[0].id);
  const currentRiff = useMemo(
    () => PRACTICE_RIFFS.find((r) => r.id === selectedRiffId) || PRACTICE_RIFFS[0],
    [selectedRiffId]
  );

  // Modals
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // Playback & Transposition State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(-1);
  const [isCountIn, setIsCountIn] = useState<boolean>(false);
  const [countInBeat, setCountInBeat] = useState<number>(0);

  const [fretShift, setFretShift] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [metronomeClick, setMetronomeClick] = useState<boolean>(true);
  const [countIn, setCountIn] = useState<boolean>(true);
  const [routeThroughDsp, setRouteThroughDsp] = useState<boolean>(true);

  // Reset transposition whenever user switches to a different riff
  useEffect(() => {
    setFretShift(0);
    riffPlaybackEngine.setFretShift(0);
    if (isPlaying) {
      riffPlaybackEngine.stop();
      setIsPlaying(false);
    }
  }, [selectedRiffId]);

  // Hook into engine status updates
  useEffect(() => {
    riffPlaybackEngine.onStatusChange = (status: RiffEngineStatus) => {
      setIsPlaying(status.isPlaying);
      setCurrentBeat(status.currentBeat);
      setActiveColumnIndex(status.activeColumnIndex);
      setIsCountIn(status.isCountIn);
      setCountInBeat(status.countInBeat);
    };

    return () => {
      riffPlaybackEngine.onStatusChange = null;
      riffPlaybackEngine.stop();
    };
  }, []);

  // Handle Play / Pause Toggle
  const handleTogglePlay = async () => {
    if (isPlaying) {
      riffPlaybackEngine.stop();
      setIsPlaying(false);
    } else {
      await onEnsureEngineRunning();
      riffPlaybackEngine.setFretShift(fretShift);
      riffPlaybackEngine.setSpeed(speed);
      riffPlaybackEngine.setLooping(isLooping);
      riffPlaybackEngine.setMetronomeClick(metronomeClick);
      riffPlaybackEngine.setCountIn(countIn);
      riffPlaybackEngine.setRouteThroughDsp(routeThroughDsp);
      await riffPlaybackEngine.start(currentRiff, 0);
    }
  };

  // Seek to specific beat
  const handleSeekToBeat = async (beat: number) => {
    await onEnsureEngineRunning();
    riffPlaybackEngine.setFretShift(fretShift);
    riffPlaybackEngine.setSpeed(speed);
    riffPlaybackEngine.setLooping(isLooping);
    riffPlaybackEngine.setMetronomeClick(metronomeClick);
    riffPlaybackEngine.setCountIn(false);
    riffPlaybackEngine.setRouteThroughDsp(routeThroughDsp);
    await riffPlaybackEngine.start(currentRiff, beat);
  };

  const handleStop = () => {
    riffPlaybackEngine.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
    setActiveColumnIndex(-1);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    riffPlaybackEngine.setSpeed(newSpeed);
  };

  const handleFretShiftChange = (shift: number) => {
    setFretShift(shift);
    riffPlaybackEngine.setFretShift(shift);
  };

  const handleToggleLooping = () => {
    const next = !isLooping;
    setIsLooping(next);
    riffPlaybackEngine.setLooping(next);
  };

  const handleToggleClick = () => {
    const next = !metronomeClick;
    setMetronomeClick(next);
    riffPlaybackEngine.setMetronomeClick(next);
  };

  const handleToggleCountIn = () => {
    const next = !countIn;
    setCountIn(next);
    riffPlaybackEngine.setCountIn(next);
  };

  const handleToggleRoute = () => {
    const next = !routeThroughDsp;
    setRouteThroughDsp(next);
    riffPlaybackEngine.setRouteThroughDsp(next);
  };

  // Keyboard shortcut listener: Spacebar toggles playback when in this view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentRiff, fretShift, speed, isLooping, metronomeClick, countIn, routeThroughDsp]);

  // Transposed Key Calculation for Display
  const transposedKeyDisplay = useMemo(() => {
    if (!currentRiff.isMovable || fretShift === 0) return currentRiff.key;
    const baseKey = currentRiff.movableConfig?.baseKey || 'A';
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const idx = notes.indexOf(baseKey.toUpperCase());
    if (idx === -1) return `${currentRiff.key} (${fretShift > 0 ? `+${fretShift}` : fretShift})`;
    const shiftedIdx = (idx + fretShift + 24) % 12;
    const newRoot = notes[shiftedIdx];
    return currentRiff.key.replace(new RegExp(`^${baseKey}`, 'i'), newRoot);
  }, [currentRiff, fretShift]);

  const primarySong = currentRiff.songs.find((s) => s.isPrimary) || currentRiff.songs[0];

  return (
    <div className="w-full space-y-4">
      {/* Sleek Practice Workspace Header with Riff Picker Button & Info Button */}
      <div className="bg-[#0E1117] border border-[#1E232B] rounded-xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Selected Riff Hero & Picker Launcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 hover:border-amber-500/60 transition-all text-left shadow-sm group cursor-pointer"
            title="Click to Open Vertical Riffs Picker Modal"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <ListMusic size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                  Browse Riffs ({PRACTICE_RIFFS.length})
                </span>
                <ChevronDown size={12} className="text-neutral-400 group-hover:text-amber-300 transition-colors" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-200 transition-colors truncate max-w-[280px] sm:max-w-[340px]">
                {currentRiff.name}
              </div>
            </div>
          </button>

          {/* Riff Quick Details Badge */}
          <div className="hidden md:flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-neutral-300">{currentRiff.primaryArtist}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-amber-300 font-bold">{transposedKeyDisplay}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">{currentRiff.tempo} BPM</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
              <span>{currentRiff.genre}</span>
              <span>·</span>
              <span className="text-neutral-500">{currentRiff.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Right: Info Modal Trigger, Preset Loader, Movability Pill */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Movability Badge */}
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
              currentRiff.isMovable
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            {currentRiff.isMovable ? '🔄 Movable Shape' : '🔒 Fixed Position'}
          </span>

          {/* Open Info & Songs Modal Button */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/35 text-sky-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Open Song Lineage, Usage Information & Practice Advice Modal"
          >
            <Info size={13} className="text-sky-400" />
            <span>Song Info ({currentRiff.songs.length})</span>
          </button>

          {/* Load Matching ToneCraft Rig Preset */}
          {currentRiff.recommendedPresetId && onApplyPreset && (
            <button
              onClick={() => onApplyPreset(currentRiff.recommendedPresetId!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title={`Load Preset: ${currentRiff.recommendedPresetName || currentRiff.recommendedPresetId}`}
            >
              <Sparkles size={12} className="fill-black" />
              <span className="hidden sm:inline">Load Matching Rig</span>
            </button>
          )}
        </div>
      </div>

      {/* MOVABILITY EXPLANATION & TRANSPOSITION CONTROLLER */}
      {currentRiff.isMovable ? (
        <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/5 border border-amber-500/30 space-y-2.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                🔄
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Movable Shape Transposition
                </span>
                <span className="text-[11px] text-neutral-400 ml-2 hidden sm:inline">
                  (Uses no open strings; slide shape anywhere on the fretboard)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-neutral-400">Current Key:</span>
              <span className="font-bold text-amber-300 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                {transposedKeyDisplay}
              </span>
              {fretShift !== 0 && (
                <button
                  onClick={() => handleFretShiftChange(0)}
                  className="text-[10px] text-neutral-400 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  (Reset)
                </button>
              )}
            </div>
          </div>

          {/* Fret Shift Slider & Transposition Quick Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="text-[11px] font-mono text-neutral-400 shrink-0">Fret Shift:</span>
              <input
                type="range"
                min={currentRiff.movableConfig?.fretMinOffset ?? -4}
                max={currentRiff.movableConfig?.fretMaxOffset ?? 7}
                step={1}
                value={fretShift}
                onChange={(e) => handleFretShiftChange(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />
              <span className="font-mono text-xs font-bold text-amber-400 w-10 text-right">
                {fretShift > 0 ? `+${fretShift}` : fretShift} fr
              </span>
            </div>

            {/* Quick Transposition Step Buttons */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {[-3, -2, -1, 0, 1, 2, 3, 5, 7].map((offset) => (
                <button
                  key={offset}
                  onClick={() => handleFretShiftChange(offset)}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    fretShift === offset
                      ? 'bg-amber-500 text-black font-bold shadow-xs'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {offset === 0 ? 'Orig' : offset > 0 ? `+${offset}` : offset}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 px-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs shrink-0">
              🔒
            </span>
            <span>
              <strong className="text-white">Fixed Open-String Position:</strong> This riff depends on open-string resonance (e.g. open low E or open A ringing pedal notes). Transposing requires a capo.
            </span>
          </div>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="text-[11px] font-mono text-sky-400 hover:underline shrink-0"
          >
            Learn more →
          </button>
        </div>
      )}

      {/* Main Tablature Staff Display */}
      <TablatureView
        riff={currentRiff}
        activeColumnIndex={activeColumnIndex}
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        fretShift={fretShift}
        onSeekToBeat={handleSeekToBeat}
      />

      {/* PLAYBACK & PRACTICE TRANSPORT BAR */}
      <div className="bg-[#0E1117] border border-[#1E232B] rounded-xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left: Play / Stop / Progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
            }`}
            title={isPlaying ? 'Pause Playback (Spacebar)' : 'Play Riff (Spacebar)'}
          >
            {isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black ml-0.5" />}
          </button>

          <button
            onClick={handleStop}
            className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            title="Stop & Rewind to Start"
          >
            <RotateCcw size={16} />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={handleToggleLooping}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isLooping
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-neutral-300'
            }`}
            title="Loop Riff Continuously for Practice"
          >
            <Repeat size={14} />
            <span>LOOP</span>
          </button>

          {/* Count In Badge */}
          {isCountIn && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-mono text-xs font-bold animate-pulse">
              <span>Count-in:</span>
              <span className="text-sm font-extrabold">{countInBeat}</span>
            </div>
          )}
        </div>

        {/* Middle: Practice Speed Multiplier */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <span className="text-[10px] font-mono uppercase text-neutral-500 px-2 flex items-center gap-1">
            <Gauge size={12} />
            <span>Speed:</span>
          </span>
          {[
            { val: 0.5, label: '50% (Slow)' },
            { val: 0.75, label: '75%' },
            { val: 1.0, label: '100% (Real)' },
            { val: 1.25, label: '125% (Fast)' }
          ].map((sp) => (
            <button
              key={sp.val}
              onClick={() => handleSpeedChange(sp.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                speed === sp.val
                  ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Right: Audio Route, Metronome, Count-In, and Info Modal trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metronome Click Toggle */}
          <button
            onClick={handleToggleClick}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              metronomeClick
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}
            title="Toggle Metronome Click on playback"
          >
            <Clock size={12} />
            <span>Click</span>
          </button>

          {/* Count In Toggle */}
          <button
            onClick={handleToggleCountIn}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              countIn
                ? 'bg-neutral-800 text-sky-400 border border-neutral-700'
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}
            title="Toggle 1-bar count-in before playback begins"
          >
            <span>1-Bar Count</span>
          </button>

          {/* Audio Destination Routing: Through Pedalboard vs Clean Monitor */}
          <button
            onClick={handleToggleRoute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
              routeThroughDsp
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title={
              routeThroughDsp
                ? 'Playing through active pedals & amp sim'
                : 'Playing direct clean monitor (so you can play guitar over it)'
            }
          >
            {routeThroughDsp ? (
              <>
                <Layers size={13} className="text-amber-400" />
                <span>Through Amp Rig</span>
              </>
            ) : (
              <>
                <Headphones size={13} className="text-neutral-400" />
                <span>Direct Monitor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIFF PICKER MODAL */}
      <RiffPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        riffs={PRACTICE_RIFFS}
        selectedRiffId={selectedRiffId}
        onSelectRiff={(riff) => {
          setSelectedRiffId(riff.id);
        }}
      />

      {/* RIFF INFO & SONG HISTORY MODAL */}
      <RiffInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        riff={currentRiff}
        onApplyPreset={onApplyPreset}
      />
    </div>
  );
};
