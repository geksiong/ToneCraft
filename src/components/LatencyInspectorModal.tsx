import React, { useState, useEffect } from 'react';
import { SignalChainLatencyReport } from '../audio/latencyTracker';
import { AudioLatencySettings } from '../audio/audioEngine';
import {
  Activity,
  Cpu,
  Zap,
  Gauge,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  PlayCircle,
  Sliders,
  Mic,
  ShieldCheck,
  Flame,
  Volume2
} from 'lucide-react';

interface LatencyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SignalChainLatencyReport;
  coreEngineMode: 'hd-worklet' | 'standard';
  onSetCoreEngineMode: (mode: 'hd-worklet' | 'standard') => void;
  ampEngineMode: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  onSetAmpEngineMode: (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => void;
  isWasmReady: boolean;
  onRunLatencyPing: () => Promise<number>;
  latencySettings: AudioLatencySettings;
  onUpdateLatencySettings: (settings: Partial<AudioLatencySettings>) => Promise<void>;
  availableInputDevices: { deviceId: string; label: string; isBluetooth?: boolean }[];
  availableOutputDevices?: { deviceId: string; label: string; isBluetooth: boolean }[];
}

export const LatencyInspectorModal: React.FC<LatencyInspectorModalProps> = ({
  isOpen,
  onClose,
  report,
  coreEngineMode,
  onSetCoreEngineMode,
  ampEngineMode,
  onSetAmpEngineMode,
  isWasmReady,
  onRunLatencyPing,
  latencySettings,
  onUpdateLatencySettings,
  availableInputDevices,
  availableOutputDevices = []
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<number | null>(report.measuredPingMs);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);

  useEffect(() => {
    setPingResult(report.measuredPingMs);
  }, [report.measuredPingMs]);

  if (!isOpen) return null;

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await onRunLatencyPing();
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  };

  const handleApplyTurbo = async () => {
    setIsApplyingSettings(true);
    try {
      await onUpdateLatencySettings({
        profile: 'ultra-low',
        sampleRateMode: 'native',
        zeroLatencyCab: true,
        zeroLookaheadLimiter: true,
        bypassOsVoiceProcessing: true
      });
    } finally {
      setIsApplyingSettings(false);
    }
  };

  const isTurboActive =
    latencySettings.profile === 'ultra-low' &&
    latencySettings.sampleRateMode === 'native' &&
    latencySettings.zeroLatencyCab &&
    latencySettings.zeroLookaheadLimiter &&
    latencySettings.bypassOsVoiceProcessing;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ultra-low':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'studio':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'ultra-low':
        return 'ULTRA-LOW LATENCY (Stage Ready)';
      case 'studio':
        return 'STUDIO REALTIME (Imperceptible)';
      default:
        return 'AUDIBLE LATENCY (Optimization Recommended)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Signal Chain Latency &amp; Hardware Optimizer</span>
                {isTurboActive && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ⚡ TURBO ACTIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Hardware buffer tuning, native audio clocks, OS filter bypass, and real-time latency diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metric Cards: Total Latency, Measured Ping, CPU Load, Latency Savings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Calculated Latency */}
            <div className="bg-neutral-950/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                <Clock size={13} className="text-amber-400" />
                <span>Round-Trip Latency</span>
              </span>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tabular-nums text-white flex items-baseline gap-1.5">
                  <span>{report.totalCalculatedMs.toFixed(1)}</span>
                  <span className="text-xs text-neutral-400">ms</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  {report.totalSamples.toLocaleString()} samples total
                </div>
              </div>
              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${getTierColor(report.latencyTier)}`}>
                {getTierLabel(report.latencyTier)}
              </div>
            </div>

            {/* 2. Measured Live Ping */}
            <div className="bg-neutral-950/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                <Zap size={13} className="text-sky-400" />
                <span>Live Hardware Ping</span>
              </span>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tabular-nums text-sky-300 flex items-baseline gap-1.5">
                  <span>{pingResult ? pingResult.toFixed(1) : '--'}</span>
                  <span className="text-xs text-neutral-400">ms</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-neutral-400">
                  Jitter: &plusmn;{report.jitterMs.toFixed(1)} ms
                </div>
              </div>
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-mono font-bold rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-colors disabled:opacity-50"
              >
                <PlayCircle size={12} className={`shrink-0 ${isPinging ? 'animate-spin' : ''}`} />
                <span className="w-32 text-center inline-block">{isPinging ? 'TESTING...' : 'TEST LIVE PING'}</span>
              </button>
            </div>

            {/* 3. Latency Optimization Savings */}
            <div className="bg-neutral-950/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                <Flame size={13} className="text-emerald-400" />
                <span>Latency Reduced</span>
              </span>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tabular-nums text-emerald-300 flex items-baseline gap-1.5">
                  <span>-{report.savings.totalSavedMs.toFixed(1)}</span>
                  <span className="text-xs text-emerald-400">ms</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Via hardware buffer &amp; clock tuning
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
                <CheckCircle2 size={11} /> High-Speed Signal Path
              </span>
            </div>

            {/* 4. Audio Engine Specs */}
            <div className="bg-neutral-950/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
                <Gauge size={13} className="text-purple-400" />
                <span>Hardware Clock &amp; Buffer</span>
              </span>
              <div className="my-2 space-y-0.5">
                <div className="text-xs font-mono text-neutral-200">
                  <span className="text-neutral-400">Sample Rate: </span>
                  <span className="text-white font-bold tabular-nums">{(report.sampleRate / 1000).toFixed(1)} kHz</span>
                </div>
                <div className="text-xs font-mono text-neutral-200">
                  <span className="text-neutral-400">Quantum: </span>
                  <span className="text-white font-bold tabular-nums">{report.bufferSize} samples ({((report.bufferSize / report.sampleRate) * 1000).toFixed(2)}ms)</span>
                </div>
                <div className="text-xs font-mono text-neutral-200">
                  <span className="text-neutral-400">CPU Load: </span>
                  <span className="text-white font-bold tabular-nums">{report.cpuLoadPercent}%</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 truncate">
                Clock: {latencySettings.sampleRateMode === 'native' ? 'Native DAC (0ms resampler)' : 'Fixed 48kHz'}
              </span>
            </div>
          </div>

          {/* Latency Minimization Turbo Action Banner */}
          <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-emerald-500/20 border border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
                <Zap size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Activate Ultra-Low Latency Turbo</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Saves ~40-70ms
                  </span>
                </h3>
                <p className="text-xs text-neutral-300 max-w-xl">
                  Automatically sets smallest driver buffer quantum (<code>latencyHint: 0</code>), connects to native soundcard clock (no software resampler delay), bypasses OS voice processing queues, and engages zero-delay cabinet modeling.
                </p>
              </div>
            </div>

            <button
              onClick={handleApplyTurbo}
              disabled={isApplyingSettings}
              className={`w-64 justify-center px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2 shrink-0 ${
                isTurboActive
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25'
              }`}
            >
              <Zap size={13} className={`shrink-0 ${isTurboActive ? 'fill-emerald-400' : ''}`} />
              <span className="w-52 text-center inline-block truncate">{isTurboActive ? 'TURBO PROFILE ACTIVE' : 'ACTIVATE ULTRA-LOW TURBO'}</span>
            </button>
          </div>

          {/* Bluetooth High Latency Alert Banner (if Bluetooth input or output is connected) */}
          {report.isBluetoothActive && (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <span>Wireless Bluetooth Latency Detected (+150ms to +250ms Delay)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    AIRPODS / BLUETOOTH
                  </span>
                </h4>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  Bluetooth audio transmission uses wireless codecs (SBC/AAC/A2DP) that buffer 150-250ms of audio in the operating system regardless of how fast the software DSP engine runs. For instant, lag-free guitar playability, plug in wired headphones or select your dedicated USB Audio Interface (e.g. Focusrite Scarlett, Presonus, Behringer) below.
                </p>
              </div>
            </div>
          )}

          {/* Hardware & Buffer Optimization Tuning Panel */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Sliders size={14} className="text-amber-400" />
                <span>Hardware I/O Latency &amp; Buffer Tuning</span>
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Direct Soundcard Driver &amp; Interface Control
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Profile Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Hardware Buffer Profile
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onUpdateLatencySettings({ profile: 'ultra-low' })}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-mono transition-colors ${
                      latencySettings.profile === 'ultra-low'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>Ultra-Low</div>
                    <div className="text-[9px] text-neutral-400">0 buffer hint</div>
                  </button>
                  <button
                    onClick={() => onUpdateLatencySettings({ profile: 'balanced' })}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-mono transition-colors ${
                      latencySettings.profile === 'balanced'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>Balanced</div>
                    <div className="text-[9px] text-neutral-400">Interactive</div>
                  </button>
                  <button
                    onClick={() => onUpdateLatencySettings({ profile: 'safe' })}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-mono transition-colors ${
                      latencySettings.profile === 'safe'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>Safe</div>
                    <div className="text-[9px] text-neutral-400">Larger ring</div>
                  </button>
                </div>
              </div>

              {/* Sample Rate Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Audio Clock Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onUpdateLatencySettings({ sampleRateMode: 'native' })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-mono transition-colors ${
                      latencySettings.sampleRateMode === 'native'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>Native DAC Clock</div>
                    <div className="text-[9px] text-neutral-400">0ms resampler delay</div>
                  </button>
                  <button
                    onClick={() => onUpdateLatencySettings({ sampleRateMode: '48k' })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-mono transition-colors ${
                      latencySettings.sampleRateMode === '48k'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>Fixed 48.0 kHz</div>
                    <div className="text-[9px] text-neutral-400">Standard rate</div>
                  </button>
                </div>
              </div>

              {/* Audio Input Device Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mic size={12} className="text-amber-400" />
                    <span>Audio Input (ADC)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    USB Interface = ~1ms
                  </span>
                </label>
                <select
                  value={latencySettings.selectedInputDeviceId}
                  onChange={(e) => onUpdateLatencySettings({ selectedInputDeviceId: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 truncate"
                >
                  <option value="">Default System Audio Input</option>
                  {availableInputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.isBluetooth ? '⚠️ [BT] ' : '⚡ '}{d.label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>ADC Base:</span>
                  <span className="text-emerald-400 font-bold tabular-nums w-16 text-right inline-block">
                    {report.hardwareBaseLatencyMs !== null ? `${report.hardwareBaseLatencyMs.toFixed(1)}ms` : `${report.inputLatencyMs.toFixed(1)}ms`}
                  </span>
                </div>
              </div>

              {/* Audio Output Device Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} className="text-sky-400" />
                    <span>Audio Output (DAC)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    Direct setSinkId
                  </span>
                </label>
                <select
                  value={latencySettings.selectedOutputDeviceId || ''}
                  onChange={(e) => onUpdateLatencySettings({ selectedOutputDeviceId: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 truncate"
                >
                  <option value="">Default System Output</option>
                  {availableOutputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.isBluetooth ? '⚠️ [BT] ' : '⚡ '}{d.label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>DAC Queue:</span>
                  <span className="text-sky-400 font-bold tabular-nums w-16 text-right inline-block">
                    {report.hardwareOutputLatencyMs !== null ? `${report.hardwareOutputLatencyMs.toFixed(1)}ms` : `${report.outputLatencyMs.toFixed(1)}ms`}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Latency Reduction Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/80">
              {/* Bypass OS Voice Processing */}
              <button
                onClick={() => onUpdateLatencySettings({ bypassOsVoiceProcessing: !latencySettings.bypassOsVoiceProcessing })}
                className={`p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2.5 ${
                  latencySettings.bypassOsVoiceProcessing
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-neutral-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={latencySettings.bypassOsVoiceProcessing}
                  readOnly
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Bypass OS Voice Filters</span>
                    <span className="text-[9px] font-mono text-emerald-400">+45ms saved</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Disables Chrome WebRTC and macOS voice isolation queues that add heavy delay.
                  </p>
                </div>
              </button>

              {/* Zero-Latency Analog Cabinet */}
              <button
                onClick={() => onUpdateLatencySettings({ zeroLatencyCab: !latencySettings.zeroLatencyCab })}
                className={`p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2.5 ${
                  latencySettings.zeroLatencyCab
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-neutral-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={latencySettings.zeroLatencyCab}
                  readOnly
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Zero-Latency Analog Cab</span>
                    <span className="text-[9px] font-mono text-emerald-400">+2.7ms saved</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Multi-pole IIR analog speaker emulation (0.0 ms delay) instead of partitioned FFT.
                  </p>
                </div>
              </button>

              {/* Zero-Lookahead Limiter */}
              <button
                onClick={() => onUpdateLatencySettings({ zeroLookaheadLimiter: !latencySettings.zeroLookaheadLimiter })}
                className={`p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2.5 ${
                  latencySettings.zeroLookaheadLimiter
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-neutral-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={latencySettings.zeroLookaheadLimiter}
                  readOnly
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Zero-Lookahead Soft Limiter</span>
                    <span className="text-[9px] font-mono text-emerald-400">+2.7ms saved</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Smooth polynomial soft-saturation clipper bypassing 128-sample compressor lookahead.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Engine Selector Section: Core Engine & Amp Engine */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Radio size={14} className="text-amber-400" />
              <span>Select Core Processing &amp; Amp Engines</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core DSP Engine Selector */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Core Pedalboard DSP Engine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    Tradeoff: Accuracy vs CPU
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSetCoreEngineMode('hd-worklet')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      coreEngineMode === 'hd-worklet'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono">HD AudioWorklet</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        Accurate
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Component-level tube dynamics, cathode bias sag, Shockley diodes, cubic Hermite delay lines.
                    </p>
                  </button>

                  <button
                    onClick={() => onSetCoreEngineMode('standard')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      coreEngineMode === 'standard'
                        ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono">Standard Web Audio</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300">
                        Low CPU
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Native polynomial WaveShaper and biquad filters. Minimal CPU footprint (~1-2%).
                    </p>
                  </button>
                </div>
              </div>

              {/* Amp Modeler Engine Selector */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Preamplifier Modeling Engine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    NAM / Triode
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSetAmpEngineMode('wasm-nam')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      ampEngineMode === 'wasm-nam'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono mb-1 text-amber-400">
                      TONE3000 NAM
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-snug">
                      Real neural network (WaveNet/LSTM) via WASM AudioWorklet.
                    </p>
                  </button>

                  <button
                    onClick={() => onSetAmpEngineMode('hd-triode')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      ampEngineMode === 'hd-triode'
                        ? 'bg-purple-500/15 border-purple-500 text-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono mb-1 text-purple-400">
                      HD Triode Worklet
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-snug">
                      12AX7 Norman Koren triode differential solver &amp; tube sag.
                    </p>
                  </button>

                  <button
                    onClick={() => onSetAmpEngineMode('waveshaper')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      ampEngineMode === 'waveshaper'
                        ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono mb-1 text-sky-400">
                      Waveshaper
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-snug">
                      Classic 4x anti-aliased polynomial curve. Lowest latency.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Signal Chain Node-by-Node Latency Flow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <span>Signal Chain Path &amp; Latency Contribution</span>
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Total: <strong className="text-amber-400">{report.totalCalculatedMs.toFixed(1)} ms</strong> across {report.nodes.length} stages
              </span>
            </div>

            <div className="space-y-2">
              {report.nodes.map((node, index) => {
                const isHighlight = node.latencyMs > 10.0;
                return (
                  <div
                    key={node.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      node.enabled
                        ? isHighlight
                          ? 'bg-rose-950/20 border-rose-500/40 text-neutral-200'
                          : 'bg-neutral-950/80 border-neutral-800 text-neutral-200'
                        : 'bg-neutral-950/30 border-neutral-800/40 opacity-50 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-neutral-400 w-5 text-center">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-white">
                            {node.name}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                            node.stage === 'amp' ? 'bg-amber-500/20 text-amber-400' :
                            node.stage === 'cab' ? 'bg-sky-500/20 text-sky-400' :
                            node.stage === 'pedal' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-neutral-800 text-neutral-400'
                          }`}>
                            {node.stage}
                          </span>
                          {!node.enabled && (
                            <span className="text-[9px] font-mono text-neutral-400">(Bypassed)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {node.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="text-right w-24 shrink-0">
                      <div className={`text-sm font-black font-mono tabular-nums w-20 text-right inline-block ${
                        isHighlight ? 'text-rose-400' : node.latencyMs > 2.0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {node.enabled ? `${node.latencyMs.toFixed(1)} ms` : '0.0 ms'}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 tabular-nums w-20 text-right inline-block">
                        {node.enabled ? `${node.latencySamples} samples` : '0 samples'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>ToneCraft Audio Engine Running at {(report.sampleRate / 1000).toFixed(1)} kHz</span>
          </div>

          <button
            onClick={onClose}
            className="w-24 justify-center px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-sm shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
