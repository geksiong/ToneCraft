import React from 'react';
import { SAMPLE_RIFFS } from '../audio/sampleRiffs';
import {
  X,
  Mic,
  Disc3,
  Play,
  Square,
  ShieldAlert,
  Zap,
  Volume2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders
} from 'lucide-react';
import { InputConditionerConfig, InputConditionerTelemetry } from '../audio/inputConditioner';
import { SignalChainLatencyReport } from '../audio/latencyTracker';

interface QuickAudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;

  // Input Source
  inputSource: string;
  onSelectCombinedInput: (src: string) => void;
  availableInputDevices: { deviceId: string; label: string; isBluetooth: boolean }[];
  selectedInputDeviceId: string;

  // Riff playback
  isRiffPlaying: boolean;
  onToggleRiffPlaying: () => void;

  // Input Gain
  inputGain: number;
  onInputGainChange: (gain: number) => void;
  inputPeak: number;

  // Noise Gate & Conditioning
  conditionerConfig: InputConditionerConfig;
  conditionerTelemetry: InputConditionerTelemetry;
  onUpdateConditionerConfig: (cfg: Partial<InputConditionerConfig>) => void;
  onLearnNoiseFloor: () => void;
  isLearningNoiseFloor: boolean;

  // Output Device
  availableOutputDevices: { deviceId: string; label: string; isBluetooth: boolean }[];
  selectedOutputDeviceId: string;
  onSelectOutputDevice: (deviceId: string) => void;

  // Latency & DSP Diagnostics
  latencyReport: SignalChainLatencyReport;
  onRunLatencyPing: () => void;
  onOpenSettings: (tab?: 'input' | 'engine' | 'midi' | 'presets') => void;
}

export const QuickAudioDrawer: React.FC<QuickAudioDrawerProps> = ({
  isOpen,
  onClose,
  isRunning,
  inputSource,
  onSelectCombinedInput,
  availableInputDevices,
  selectedInputDeviceId,
  isRiffPlaying,
  onToggleRiffPlaying,
  inputGain,
  onInputGainChange,
  inputPeak,
  conditionerConfig,
  conditionerTelemetry,
  onUpdateConditionerConfig,
  onLearnNoiseFloor,
  isLearningNoiseFloor,
  availableOutputDevices,
  selectedOutputDeviceId,
  onSelectOutputDevice,
  latencyReport,
  onRunLatencyPing,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  const isMic = inputSource.startsWith('mic');
  const isRiffSource = !isMic;

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative z-10 w-full max-w-md bg-[#0D0F14] border-l border-[#1E232B] h-full shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#12151D]">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">Audio &amp; I/O Routing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. INPUT SOURCE SELECTION */}
          <div className="space-y-2 bg-[#141720] border border-[#202531] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                {isMic ? <Mic size={13} className="text-emerald-400" /> : <Disc3 size={13} className="text-sky-400" />}
                <span>Input Source</span>
              </label>

              {isRiffSource && (
                <button
                  onClick={onToggleRiffPlaying}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    isRiffPlaying && isRunning
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isRiffPlaying && isRunning ? (
                    <>
                      <Square size={10} className="fill-emerald-400" />
                      <span>PLAYING</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} className="fill-emerald-400 text-emerald-400" />
                      <span>TEST RIFF</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <select
              value={combinedInputKey}
              onChange={(e) => onSelectCombinedInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <optgroup label="🎤 Microphones & USB Audio Interfaces" className="bg-neutral-900 text-neutral-300 font-semibold">
                <option value="mic:default" className="bg-neutral-900 text-emerald-300 font-bold">
                  🎤 Default System Microphone / Audio Interface
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

          {/* 2. INPUT GAIN & PEAK METER */}
          <div className="space-y-2 bg-[#141720] border border-[#202531] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300 uppercase font-mono tracking-wider">Input Level &amp; Gain</span>
              <button
                onClick={() => onInputGainChange(50)}
                className="text-emerald-400 hover:text-emerald-300 font-mono font-bold text-xs"
                title="Click to reset to 0.0 dB unity gain"
              >
                {getInputGainDbString(inputGain)} (Reset)
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={inputGain}
              onChange={(e) => onInputGainChange(Number(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />

            {/* Input Peak level visualizer */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-75 ${
                    inputPeak > 0.9 ? 'bg-red-500' : inputPeak > 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, inputPeak * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>-60 dB</span>
                <span>-18 dB (Nominal)</span>
                <span>0 dB (Clip)</span>
              </div>
            </div>
          </div>

          {/* 3. STUDIO NOISE GATE */}
          <div className="space-y-3 bg-[#141720] border border-[#202531] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className={conditionerConfig.gateEnabled ? 'text-amber-400' : 'text-neutral-500'} />
                <span className="text-xs font-bold text-neutral-300 uppercase font-mono tracking-wider">Studio Noise Gate</span>
              </div>
              <button
                onClick={() => onUpdateConditionerConfig({ gateEnabled: !conditionerConfig.gateEnabled })}
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                  conditionerConfig.gateEnabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {conditionerConfig.gateEnabled ? 'ACTIVE' : 'BYPASS'}
              </button>
            </div>

            {conditionerConfig.gateEnabled && (
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Threshold</span>
                  <span className="text-white font-bold">{conditionerConfig.gateThreshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="-20"
                  step="1"
                  value={conditionerConfig.gateThreshold}
                  onChange={(e) => onUpdateConditionerConfig({ gateThreshold: Number(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={onLearnNoiseFloor}
                    disabled={isLearningNoiseFloor || !isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-xs text-neutral-200 transition-colors disabled:opacity-40"
                    title="Silence guitar for 2 seconds while the gate auto-calibrates"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>{isLearningNoiseFloor ? 'Measuring Floor...' : 'Auto-Learn Noise Floor'}</span>
                  </button>

                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    Status: <strong className="text-white">{conditionerTelemetry.gateState.toUpperCase()}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. HARDWARE OUTPUT DEVICE */}
          <div className="space-y-2 bg-[#141720] border border-[#202531] rounded-xl p-3.5">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Volume2 size={13} className="text-amber-400" />
              <span>Audio Output Device</span>
            </label>
            <select
              value={selectedOutputDeviceId || 'default'}
              onChange={(e) => onSelectOutputDevice(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="default" className="bg-neutral-900 text-emerald-300 font-bold">
                Default Audio Output (Speakers / Headphones)
              </option>
              {nonDefaultOutputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId} className="bg-neutral-900 text-white">
                  {d.label || `Output Device (${d.deviceId.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </div>

          {/* 5. LATENCY & ENGINE DIAGNOSTICS */}
          <div className="space-y-2 bg-[#141720] border border-[#202531] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-emerald-400" />
                <span>Round-Trip Latency</span>
              </span>
              <button
                onClick={onRunLatencyPing}
                className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Ping Latency
              </button>
            </div>

            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400">Total Delay:</span>
              <span className="text-emerald-400 font-bold text-sm">
                {latencyReport.totalCalculatedMs.toFixed(1)} ms ({latencyReport.latencyTier})
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Links */}
        <div className="p-4 border-t border-neutral-800 bg-[#12151D] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenSettings('midi');
            }}
            className="text-xs text-neutral-300 hover:text-amber-400 font-mono transition-colors flex items-center gap-1.5"
          >
            <Radio size={12} />
            <span>MIDI Controller Maps</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSettings('engine');
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold transition-colors flex items-center gap-1"
          >
            <span>Advanced DSP</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
