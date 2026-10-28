import React, { useMemo, useState } from 'react';
import { Preset, TunerData } from '../types/pedal';
import { SAMPLE_RIFFS } from '../audio/sampleRiffs';
import { groupPresetsByCategory, getPresetCategory } from '../utils/presetCategories';
import {
  Mic,
  Disc3,
  Power,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Radio,
  BookOpen,
  Ban,
  Clock
} from 'lucide-react';

interface UnifiedHeaderProps {
  // Engine
  isRunning: boolean;
  onToggleEngine: () => void;

  // Presets
  currentPreset: Preset;
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
  onOpenPresetLibrary: () => void;

  // Master Volume & Mute
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  outputPeak: number;

  // Quick Tuner
  tunerData: TunerData;
  onOpenTuner: () => void;
  isMicInput: boolean;

  // Tempo / BPM
  bpm: number;
  onBpmChange: (bpm: number) => void;

  // Bypass All
  isBypassAll: boolean;
  onToggleBypassAll: () => void;

  // Audio I/O Drawer Toggle & Status
  inputSource: string;
  inputGain: number;
  isQuickDrawerOpen: boolean;
  onToggleQuickDrawer: () => void;
  gateEnabled: boolean;

  // Modals
  onOpenSettings: (tab?: 'input' | 'engine' | 'midi' | 'presets') => void;
  onOpenAbout: () => void;

  // MIDI activity
  isMidiActivity?: boolean;
  midiDeviceCount?: number;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  isRunning,
  onToggleEngine,
  currentPreset,
  presets,
  onSelectPreset,
  onOpenPresetLibrary,
  masterVolume,
  onMasterVolumeChange,
  isMuted,
  onToggleMute,
  outputPeak,
  tunerData,
  onOpenTuner,
  isMicInput,
  bpm,
  onBpmChange,
  isBypassAll,
  onToggleBypassAll,
  inputSource,
  inputGain,
  isQuickDrawerOpen,
  onToggleQuickDrawer,
  gateEnabled,
  onOpenSettings,
  onOpenAbout,
  isMidiActivity = false,
  midiDeviceCount = 0
}) => {
  const isMic = inputSource.startsWith('mic');
  const groupedPresets = useMemo(() => groupPresetsByCategory(presets), [presets]);

  // Preset Navigation
  const currentPresetIndex = presets.findIndex((p) => p.id === currentPreset.id);

  const handlePrevPreset = () => {
    if (presets.length === 0) return;
    const prevIdx = (currentPresetIndex - 1 + presets.length) % presets.length;
    onSelectPreset(presets[prevIdx]);
  };

  const handleNextPreset = () => {
    if (presets.length === 0) return;
    const nextIdx = (currentPresetIndex + 1) % presets.length;
    onSelectPreset(presets[nextIdx]);
  };

  // Tap Tempo calculation
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const handleTapTempo = () => {
    const now = performance.now();
    const newTimes = [...tapTimes.filter((t) => now - t < 3000), now];
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

  // Tuner stats
  const cents = tunerData?.cents ?? 0;
  const isCloseTune = Math.abs(cents) <= 5 && Boolean(tunerData?.note);

  // Input gain text
  const getInputGainDbString = (val: number): string => {
    if (val <= 0) return 'MUTE';
    const db = ((val - 50) / 50) * (val >= 50 ? 14 : 26);
    if (Math.abs(db) < 0.05) return '0.0 dB';
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-md border-b border-[#1E232B] shadow-2xl px-3 sm:px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* ============================================================== */}
        {/* ZONE 1: BRAND & PRESET NAVIGATOR                               */}
        {/* ============================================================== */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Brand Wordmark */}
          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
            title="ToneCraft Neural DSP · Tone Guide & Credits"
          >
            <span className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent group-hover:from-white group-hover:to-amber-300 transition-all font-sans">
              ToneCraft
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-300 group-hover:border-amber-500/40">
              DSP
            </span>
          </button>

          <span className="w-px h-5 bg-neutral-800 hidden sm:block" />

          {/* Preset Selector with Prev/Next buttons */}
          <div className="flex items-center gap-1 bg-[#12151B] border border-[#222731] rounded-lg p-0.5 shadow-inner">
            <button
              onClick={handlePrevPreset}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded transition-colors"
              title="Previous Preset"
            >
              <ChevronLeft size={14} />
            </button>

            <select
              value={currentPreset.id}
              onChange={(e) => {
                const found = presets.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="bg-transparent text-xs text-white font-medium focus:outline-none w-32 sm:w-44 md:w-52 truncate cursor-pointer px-1 py-0.5"
              title="Select Rig Preset"
            >
              {groupedPresets.map((group) => (
                <optgroup key={group.category} label={group.category} className="bg-neutral-900 text-neutral-300 font-semibold">
                  {group.presets.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-neutral-900 text-white">
                      {preset.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button
              onClick={handleNextPreset}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded transition-colors"
              title="Next Preset"
            >
              <ChevronRight size={14} />
            </button>

            <button
              onClick={onOpenPresetLibrary}
              className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800/80 rounded transition-colors border-l border-neutral-800/80"
              title="Open Preset Library & Cloud Hub"
            >
              <FolderOpen size={13} />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ZONE 2: PERFORMANCE TOOLS (TUNER, TEMPO, BYPASS)               */}
        {/* ============================================================== */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {/* Chromatic Tuner Pill */}
          <button
            onClick={isMicInput ? onOpenTuner : onToggleQuickDrawer}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
              !isMicInput
                ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                : tunerData.note
                ? isCloseTune
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
            }`}
            title={
              !isMicInput
                ? 'Tuner requires Microphone input · Click to open Audio I/O'
                : 'Open Chromatic Tuner'
            }
          >
            <Radio
              size={12}
              className={
                !isMicInput
                  ? 'text-neutral-500'
                  : tunerData.note
                  ? isCloseTune
                    ? 'text-emerald-400 animate-pulse'
                    : 'text-amber-400'
                  : 'text-neutral-400'
              }
            />
            <span>
              {isMicInput ? (
                tunerData.note ? (
                  <>
                    <strong className="text-white font-bold">{tunerData.note}</strong>
                    <span className="text-[10px] ml-1 tabular-nums">
                      {isCloseTune ? '✓ OK' : `${cents > 0 ? '+' : ''}${cents.toFixed(0)}¢`}
                    </span>
                  </>
                ) : (
                  'TUNER'
                )
              ) : (
                'TUNER (MIC)'
              )}
            </span>
          </button>

          {/* Tap Tempo & BPM */}
          <div className="flex items-center bg-[#12151B] border border-[#222731] rounded-lg px-2 py-0.5 font-mono text-xs text-neutral-300">
            <button
              onClick={handleTapTempo}
              className="hover:text-amber-400 font-bold tracking-wider text-[10px] uppercase mr-1.5 transition-colors cursor-pointer"
              title="Tap Tempo (click multiple times in rhythm)"
            >
              TAP
            </button>
            <button
              onClick={() => onBpmChange(Math.max(40, bpm - 1))}
              className="text-neutral-400 hover:text-white px-0.5"
              title="Decrease BPM"
            >
              -
            </button>
            <span className="text-white font-bold tabular-nums w-8 text-center text-[11px]">{bpm}</span>
            <button
              onClick={() => onBpmChange(Math.min(280, bpm + 1))}
              className="text-neutral-400 hover:text-white px-0.5"
              title="Increase BPM"
            >
              +
            </button>
            <span className="text-[9px] text-neutral-400 ml-1">BPM</span>
          </div>

          {/* FX Bypass All Toggle */}
          <button
            onClick={onToggleBypassAll}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
              isBypassAll
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-sm'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Bypass all stompbox effects in the signal chain"
          >
            <Ban size={11} className={isBypassAll ? 'text-amber-400' : 'text-neutral-500'} />
            <span>{isBypassAll ? 'FX BYPASSED' : 'FX ON'}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* ZONE 3: MASTER CONTROLS, AUDIO DRAWER & POWER                  */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Master Volume & Mute */}
          <div className="flex items-center gap-1.5 bg-[#12151B] border border-[#222731] rounded-lg px-2 py-1">
            <button
              onClick={onToggleMute}
              className={`p-0.5 rounded transition-colors ${
                isMuted ? 'text-red-400 hover:text-red-300' : 'text-neutral-400 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Master Output' : 'Mute Master Output'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              disabled={isMuted}
              className="w-14 sm:w-18 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
              title={`Master Volume: ${masterVolume}%`}
            />

            {/* Live Peak LED meter dots */}
            <div className="flex gap-0.5 items-center pl-0.5">
              <span
                className={`w-1.5 h-3 rounded-xs transition-colors duration-75 ${
                  outputPeak > 0.05 ? 'bg-emerald-400' : 'bg-neutral-800'
                }`}
              />
              <span
                className={`w-1.5 h-3 rounded-xs transition-colors duration-75 ${
                  outputPeak > 0.4 ? 'bg-amber-400' : 'bg-neutral-800'
                }`}
              />
              <span
                className={`w-1.5 h-3 rounded-xs transition-colors duration-75 ${
                  outputPeak > 0.85 ? 'bg-red-500 animate-pulse' : 'bg-neutral-800'
                }`}
              />
            </div>
          </div>

          {/* Quick Audio & I/O Drawer Button */}
          <button
            onClick={onToggleQuickDrawer}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
              isQuickDrawerOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
            }`}
            title="Open Audio I/O, Input Gain & Noise Gate Panel"
          >
            {isMic ? (
              <Mic size={13} className="text-emerald-400" />
            ) : (
              <Disc3 size={13} className="text-sky-400" />
            )}
            <span className="hidden sm:inline">Audio I/O</span>
            <span className="text-[10px] text-neutral-400 font-mono hidden md:inline">
              {getInputGainDbString(inputGain)}
            </span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => onOpenSettings()}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Open Full Settings (MIDI, Engine, Audio Devices)"
          >
            <Settings size={14} />
          </button>

          {/* Master Engine Power ON/OFF Toggle */}
          <button
            onClick={onToggleEngine}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
              isRunning
                ? 'bg-emerald-500 text-black shadow-emerald-500/25 hover:bg-emerald-400 ring-1 ring-emerald-400/50'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
            }`}
            title={isRunning ? 'Turn DSP Engine OFF (Standby)' : 'Turn DSP Engine ON'}
          >
            <Power
              size={13}
              className={`shrink-0 ${isRunning ? 'fill-black stroke-black' : 'text-neutral-400'}`}
            />
            <span className="whitespace-nowrap">{isRunning ? 'DSP ON' : 'STANDBY'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
