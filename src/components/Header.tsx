import React, { useMemo } from 'react';
import { Preset } from '../types/pedal';
import { SAMPLE_RIFFS } from '../audio/sampleRiffs';
import { groupPresetsByCategory, getPresetCategory } from '../utils/presetCategories';
import {
  Mic,
  Disc3,
  Globe,
  Play,
  Square,
  Activity,
  AlertTriangle,
  Sliders,
  Cpu,
  Speaker,
  RotateCcw,
  Radio,
  Settings,
  GitBranch,
  BookOpen
} from 'lucide-react';
import {
  InputChannelTelemetry,
  InputChannelRoutingMode
} from '../audio/inputChannelRouter';

interface HeaderProps {
  isRunning: boolean;
  onToggleEngine: () => void;
  onRestartEngine?: () => void;
  // Row 1: Input controls (combined mic & riff sources)
  inputSource: string;
  onSelectCombinedInput: (src: string) => void;
  availableInputDevices: { deviceId: string; label: string; isBluetooth: boolean }[];
  selectedInputDeviceId: string;
  inputGain: number;
  onInputGainChange: (gain: number) => void;
  inputPeak: number;
  gateEnabled: boolean;
  onToggleGate: () => void;
  gateState?: 'open' | 'hold' | 'closed';
  onOpenInputConditioner: () => void;
  channelTelemetry?: InputChannelTelemetry;
  inputRoutingMode?: InputChannelRoutingMode;
  onInputRoutingChange?: (mode: InputChannelRoutingMode) => void;
  isRiffPlaying: boolean;
  onToggleRiffPlaying: () => void;
  // Row 2: DSP controls
  currentPreset: Preset;
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
  onOpenPresetLibrary?: () => void;
  availableOutputDevices: { deviceId: string; label: string; isBluetooth: boolean }[];
  selectedOutputDeviceId: string;
  onSelectOutputDevice: (deviceId: string) => void;
  latencyMs?: number;
  isTurboActive?: boolean;
  isBluetoothDetected?: boolean;
  onOpenEngineSettings?: () => void;
  onMinimiseLatency?: () => Promise<void>;
  onOpenMidiSettings?: () => void;
  onOpenSettings?: (tab?: 'input' | 'engine' | 'midi' | 'presets') => void;
  onOpenAbout?: () => void;
  midiDeviceCount?: number;
  isMidiActivity?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleEngine,
  onRestartEngine,
  inputSource,
  onSelectCombinedInput,
  availableInputDevices,
  selectedInputDeviceId,
  inputGain,
  onInputGainChange,
  inputPeak,
  gateEnabled,
  onToggleGate,
  gateState,
  onOpenInputConditioner,
  channelTelemetry,
  inputRoutingMode,
  onInputRoutingChange,
  isRiffPlaying,
  onToggleRiffPlaying,
  currentPreset,
  presets,
  onSelectPreset,
  onOpenPresetLibrary,
  availableOutputDevices,
  selectedOutputDeviceId,
  onSelectOutputDevice,
  latencyMs,
  isTurboActive,
  isBluetoothDetected,
  onOpenEngineSettings,
  onOpenMidiSettings,
  onOpenSettings,
  onOpenAbout,
  midiDeviceCount = 0,
  isMidiActivity = false
}) => {
  const isMic = inputSource.startsWith('mic');
  const isRiffSource = !isMic;

  // Determine the key value for the single combined input dropdown
  const combinedInputKey = isMic
    ? selectedInputDeviceId
      ? `mic:${selectedInputDeviceId}`
      : 'mic:default'
    : inputSource;

  const getInputGainDbString = (val: number): string => {
    if (val <= 0) return 'MUTE';
    const db = ((val - 50) / 50) * (val >= 50 ? 14 : 26);
    if (Math.abs(db) < 0.05) return '0.0 dB';
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  // Filter out duplicate "default" or "communications" entries from hardware lists to guarantee only ONE default option
  const nonDefaultInputDevices = availableInputDevices.filter(
    (d) =>
      d.deviceId !== 'default' &&
      d.deviceId !== 'communications' &&
      d.deviceId !== '' &&
      !d.label?.toLowerCase().startsWith('default') &&
      !d.label?.toLowerCase().startsWith('communications')
  );

  const nonDefaultOutputDevices = availableOutputDevices.filter(
    (d) =>
      d.deviceId !== 'default' &&
      d.deviceId !== 'communications' &&
      d.deviceId !== '' &&
      !d.label?.toLowerCase().startsWith('default') &&
      !d.label?.toLowerCase().startsWith('communications')
  );

  const groupedPresets = useMemo(() => groupPresetsByCategory(presets), [presets]);
  const currentCategory = useMemo(() => getPresetCategory(currentPreset), [currentPreset]);

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-2xl px-3 sm:px-5 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Brand Logo & 2 Rows of Controls */}
        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
          {/* Brand Identification */}
          <button
            onClick={onOpenAbout}
            className="shrink-0 flex flex-col justify-center pr-3 sm:pr-4 border-r border-neutral-800/80 text-left hover:opacity-85 transition-opacity group cursor-pointer"
            title="About ToneCraft, Tone Guide & Project Info (by Gek Siong)"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent font-sans group-hover:from-amber-100 group-hover:to-amber-400">
                ToneCraft
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase tracking-wider group-hover:border-amber-500/40 group-hover:text-amber-300">
                DSP
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono tracking-tight hidden md:block group-hover:text-neutral-300">
              Neural Modeler · Guide
            </span>
          </button>

          {/* Main 2-Row Control Surface */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* ============================================================== */}
            {/* ROW 1: INPUT CONTROLS                                         */}
            {/* Combined Input Source (Mic sources + Riffs), Gain,            */}
            {/* Gate: ON/OFF, Input Settings                                   */}
            {/* ============================================================== */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Group Label */}
              <div className="flex items-center gap-1.5 text-neutral-400 shrink-0 font-mono font-bold text-[10px] sm:text-[11px] tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90" />
                <span>INPUT:</span>
              </div>

              {/* 1. Combined Input Source Dropdown (Microphones + Riffs in 1 dropdown) */}
              <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2 py-1 shrink-0">
                {isMic ? (
                  <Mic size={13} className="text-red-400 animate-pulse shrink-0" />
                ) : (
                  <Disc3 size={13} className={`text-sky-400 shrink-0 ${isRiffPlaying && isRunning ? 'animate-spin' : ''}`} />
                )}

                <select
                  value={combinedInputKey}
                  onChange={(e) => onSelectCombinedInput(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-48 sm:w-60 truncate shrink-0 cursor-pointer"
                  title="Select Audio Input: Live Microphone or Sample Guitar Riff"
                >
                  <optgroup label="🎤 Microphones & USB Audio Interfaces" className="bg-neutral-900 text-neutral-300 font-semibold">
                    <option value="mic:default" className="bg-neutral-900 text-emerald-300 font-bold">
                      🎤 Default System Microphone
                    </option>
                    {nonDefaultInputDevices.map((d) => (
                      <option key={d.deviceId} value={`mic:${d.deviceId}`} className="bg-neutral-900 text-white">
                        🎤 {d.label || `Audio Interface (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="✨ Clean Tones" className="bg-neutral-900 text-neutral-300 font-semibold">
                    {SAMPLE_RIFFS.filter((r) => r.category === 'Clean').map((riff) => (
                      <option key={riff.id} value={riff.id} className="bg-neutral-900 text-white">
                        ✨ {riff.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="⚡ Edge of Breakup" className="bg-neutral-900 text-neutral-300 font-semibold">
                    {SAMPLE_RIFFS.filter((r) => r.category === 'Edge of Breakup').map((riff) => (
                      <option key={riff.id} value={riff.id} className="bg-neutral-900 text-white">
                        ⚡ {riff.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="🔥 Rock & Metal" className="bg-neutral-900 text-neutral-300 font-semibold">
                    {SAMPLE_RIFFS.filter((r) => r.category === 'Rock & Metal').map((riff) => (
                      <option key={riff.id} value={riff.id} className="bg-neutral-900 text-white">
                        🔥 {riff.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="🎵 Bass Grooves" className="bg-neutral-900 text-neutral-300 font-semibold">
                    {SAMPLE_RIFFS.filter((r) => r.category === 'Bass').map((riff) => (
                      <option key={riff.id} value={riff.id} className="bg-neutral-900 text-white">
                        🎵 {riff.name}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="🎤 Vocal & Voice Tracks" className="bg-neutral-900 text-neutral-300 font-semibold">
                    {SAMPLE_RIFFS.filter((r) => r.category === 'Vocal & Voice').map((riff) => (
                      <option key={riff.id} value={riff.id} className="bg-neutral-900 text-white">
                        🎤 {riff.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 1b. Play / Pause Riff button (only shown when a riff is active) */}
              {isRiffSource && (
                <button
                  onClick={onToggleRiffPlaying}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all shrink-0 ${
                    isRiffPlaying && isRunning
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                  title={isRiffPlaying && isRunning ? 'Pause audio test riff' : 'Play audio test riff'}
                >
                  {isRiffPlaying && isRunning ? (
                    <>
                      <Square size={10} className="fill-emerald-400 shrink-0" />
                      <span>PLAYING</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} className="fill-emerald-400 text-emerald-400 shrink-0" />
                      <span>PLAY RIFF</span>
                    </>
                  )}
                </button>
              )}

              {/* 2. Gain Slider & Meter */}
              <div
                className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2 py-1 shrink-0"
                title={`Input Gain: ${inputGain}% (${getInputGainDbString(inputGain)}) - Double-click slider or click dB to reset to 0.0 dB`}
              >
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold shrink-0">
                  Gain:
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={inputGain}
                  onChange={(e) => onInputGainChange(Number(e.target.value))}
                  onDoubleClick={() => onInputGainChange(50)}
                  className="w-14 sm:w-18 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 shrink-0"
                  title={`Input Gain: ${inputGain}% (${getInputGainDbString(inputGain)}) - Double-click to reset`}
                />
                <button
                  type="button"
                  onClick={() => onInputGainChange(50)}
                  className="text-[10px] font-mono tabular-nums w-11 text-right text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  title="Click to reset to 0.0 dB unity gain"
                >
                  {getInputGainDbString(inputGain)}
                </button>

                {/* Peak Meter & Clip LED */}
                <div className="flex items-center gap-1 pl-1 shrink-0">
                  <div className="w-8 sm:w-10 h-1.5 rounded bg-neutral-950 overflow-hidden border border-neutral-800 flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
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
              </div>

              {/* 3. Gate: on/off Toggle Button with LED */}
              <button
                onClick={onToggleGate}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all shrink-0 ${
                  gateEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
                title={
                  gateEnabled
                    ? `Studio Noise Gate is ON (${gateState === 'open' ? 'Gate Open' : gateState === 'hold' ? 'Gate Holding' : 'Gate Gating'}). Click to turn OFF.`
                    : 'Studio Noise Gate is OFF. Click to turn ON.'
                }
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                    !gateEnabled
                      ? 'bg-neutral-600'
                      : gateState === 'open'
                      ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                      : gateState === 'hold'
                      ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                      : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  }`}
                />
                <span>{gateEnabled ? 'Gate: ON' : 'Gate: OFF'}</span>
              </button>

              {/* 4. Mono Input Identification & Dual-Channel Output Routing Badge */}
              <button
                type="button"
                onClick={() => onOpenSettings && onOpenSettings('input')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all shrink-0 ${
                  channelTelemetry?.isMonoIdentified !== false
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
                }`}
                title={
                  channelTelemetry
                    ? `${channelTelemetry.description} (Click to configure channel routing)`
                    : 'Mono source identified: audio is routed to both output channels (L+R). Click to configure.'
                }
              >
                <GitBranch size={12} className={channelTelemetry?.isMonoIdentified !== false ? 'text-emerald-400' : 'text-sky-400'} />
                <span className="hidden sm:inline">
                  {channelTelemetry?.isMonoIdentified !== false ? 'Mono ➔ Both (L+R)' : 'Stereo Input'}
                </span>
                <span className="sm:hidden">
                  {channelTelemetry?.isMonoIdentified !== false ? 'Mono L+R' : 'Stereo'}
                </span>
              </button>
            </div>

            {/* ============================================================== */}
            {/* ROW 2: DSP CONTROLS                                           */}
            {/* Rig (Preset Selector), Output Source, Latency Display,        */}
            {/* Unified Settings, MIDI Hardware                               */}
            {/* ============================================================== */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Group Label */}
              <div className="flex items-center gap-1.5 text-neutral-400 shrink-0 font-mono font-bold text-[10px] sm:text-[11px] tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90" />
                <span>DSP:</span>
              </div>

              {/* 1. Rig (Categorized Preset Selector) */}
              <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">Rig:</span>
                <select
                  value={currentPreset.id}
                  onChange={(e) => {
                    const found = presets.find((p) => p.id === e.target.value);
                    if (found) onSelectPreset(found);
                  }}
                  className="bg-transparent text-xs font-semibold text-neutral-200 focus:outline-none w-44 sm:w-60 truncate cursor-pointer"
                  title={`Active Rig: "${currentPreset.name}" · ${currentCategory}`}
                >
                  {groupedPresets.map((group) => (
                    <optgroup
                      key={group.category}
                      label={group.category}
                      className="bg-neutral-900 text-amber-400 font-bold tracking-wider uppercase text-[10px] py-1.5"
                    >
                      {group.presets.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          className="bg-neutral-950 text-white font-normal pl-3 py-1 text-xs"
                        >
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 2. Output Source (Strictly ONE single default option + detected hardware devices) */}
              <div
                className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2 py-1 shrink-0"
                title="Select Physical Audio Output Device (Speakers, Headphones, or USB Audio Interface)"
              >
                <Speaker size={12} className="text-neutral-400 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">Output:</span>
                <select
                  value={selectedOutputDeviceId || ''}
                  onChange={(e) => onSelectOutputDevice(e.target.value)}
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none w-36 sm:w-52 truncate cursor-pointer font-medium"
                >
                  <option value="" className="bg-neutral-900 text-emerald-300 font-bold">
                    Default Audio Output / DAC
                  </option>
                  {nonDefaultOutputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-neutral-900 text-white">
                      {d.isBluetooth ? '🎧 ' : '🔊 '}{d.label || `Audio Output (${d.deviceId.slice(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Latency Display (Clickable for Minimise / Inspector) */}
              <button
                onClick={() => (onOpenSettings ? onOpenSettings('engine') : onOpenEngineSettings?.())}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-all shrink-0 ${
                  isTurboActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                    : 'border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300'
                }`}
                title="Audio Latency Display. Click to inspect hardware latency in Settings."
              >
                <Activity
                  size={12}
                  className={`shrink-0 ${
                    latencyMs && latencyMs > 25
                      ? 'text-rose-400 animate-pulse'
                      : latencyMs && latencyMs > 12
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                <span className="font-bold tabular-nums">
                  {latencyMs ? `${latencyMs.toFixed(1)}ms` : '4.8ms'}
                </span>
                {isTurboActive ? (
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    TURBO
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                    LOW
                  </span>
                )}
              </button>

              {/* Bluetooth Alert (if high latency wireless active) */}
              {isBluetoothDetected && (
                <button
                  onClick={() => (onOpenSettings ? onOpenSettings('engine') : onOpenEngineSettings?.())}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-500/50 bg-rose-500/15 text-rose-300 text-xs font-mono font-bold animate-pulse shrink-0"
                  title="Bluetooth wireless audio detected (+150ms delay). Click to switch to wired output in Settings."
                >
                  <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                  <span>BT (+150ms)</span>
                </button>
              )}

              {/* 4. About & Tone Guide Button */}
              <button
                onClick={onOpenAbout}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 hover:text-white transition-colors shrink-0 font-medium"
                title="About ToneCraft, Tone Crafting Tips & Project Info (by Gek Siong)"
              >
                <BookOpen size={12} className="text-amber-400 shrink-0" />
                <span>About &amp; Guide</span>
              </button>

              {/* 5. Unified Settings Button (Input, DSP Engine, MIDI, Cloud Presets) */}
              <button
                onClick={() => (onOpenSettings ? onOpenSettings() : undefined)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 hover:text-white transition-colors shrink-0 font-medium"
                title="ToneCraft Studio Settings: Input Conditioner & Noise Gate, DSP Engine & Latency, MIDI Hardware, and Cloud Preset Hub"
              >
                <Settings size={12} className="text-amber-400 shrink-0" />
                <span>Settings</span>
                {midiDeviceCount > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isMidiActivity ? 'bg-amber-300 animate-ping' : 'bg-emerald-400'}`}
                    title={`MIDI Controller active (${midiDeviceCount} connected)`}
                  />
                )}
              </button>

              {/* Quick Reboot Audio Engine (if running) */}
              {isRunning && onRestartEngine && (
                <button
                  onClick={onRestartEngine}
                  className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors shrink-0"
                  title="Reinitialize hardware audio pipeline without reloading page"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT SIDE: DSP ON/OFF SWITCH WITH LED                         */}
        {/* Physical heavy-duty amplifier/rack style power toggle with LED */}
        {/* ============================================================== */}
        <div className="shrink-0 pl-3 sm:pl-4 border-l border-neutral-800/80 flex items-center">
          <div
            onClick={onToggleEngine}
            className={`relative flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none group shadow-lg ${
              isRunning
                ? 'bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 border-emerald-500/50 shadow-emerald-950/40'
                : 'bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-neutral-800 hover:border-neutral-700'
            }`}
            title={isRunning ? 'DSP is ON (Click to turn OFF)' : 'DSP is OFF (Click to turn ON)'}
            role="switch"
            aria-checked={isRunning}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleEngine();
              }
            }}
          >
            {/* Authentic Pilot Jewel Lamp / LED with Chrome Bezel */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative flex items-center justify-center">
                {/* Outer chrome bezel ring */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-700 p-0.5 shadow-sm">
                  {/* Inner dark bezel cavity */}
                  <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center p-0.5">
                    {/* The Jewel Light */}
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        isRunning
                          ? 'bg-emerald-400 shadow-[0_0_12px_#34d399,0_0_4px_#ffffff] ring-1 ring-emerald-300'
                          : 'bg-neutral-800 shadow-inner'
                      }`}
                    >
                      {/* Subtle inner highlight specular */}
                      {isRunning && (
                        <div className="w-1 h-1 rounded-full bg-white/80 m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Rocker / Toggle Switch Mechanism */}
            <div className="flex flex-col items-start justify-center">
              <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                DSP POWER
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Physical rocker switch visual */}
                <div className="w-8 h-4 rounded-full bg-neutral-950 border border-neutral-700/80 p-0.5 flex items-center shadow-inner relative">
                  <div
                    className={`w-3.5 h-3 rounded-full transition-transform duration-200 shadow-md ${
                      isRunning
                        ? 'translate-x-3.5 bg-gradient-to-t from-emerald-500 to-emerald-300 border border-emerald-200'
                        : 'translate-x-0 bg-gradient-to-b from-neutral-400 to-neutral-600 border border-neutral-500'
                    }`}
                  />
                </div>
                {/* Text ON / OFF state */}
                <span
                  className={`text-xs font-mono font-black tracking-wider transition-colors ${
                    isRunning ? 'text-emerald-400 text-glow-emerald' : 'text-neutral-500'
                  }`}
                >
                  {isRunning ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
