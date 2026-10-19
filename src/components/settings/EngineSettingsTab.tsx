import React, { useState, useEffect } from 'react';
import { SignalChainLatencyReport } from '../../audio/latencyTracker';
import { AudioLatencySettings } from '../../audio/audioEngine';
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Sliders,
  Mic,
  ShieldCheck,
  Flame,
  Volume2,
  Gauge
} from 'lucide-react';

export interface EngineSettingsTabProps {
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

export const EngineSettingsTab: React.FC<EngineSettingsTabProps> = ({
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
        zeroLatencyCab: false, // Keep real acoustic IR Convolver enabled!
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
    <div className="space-y-6">
      {/* Top Metric Cards: Total Latency, Measured Ping, CPU Load, Latency Savings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Calculated Latency */}
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
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
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
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
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
            <Flame size={13} className="text-emerald-400" />
            <span>Latency Reduced</span>
          </span>
          <div className="my-2">
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-400 flex items-baseline gap-1.5">
              <span>-{report.savings.totalSavedMs.toFixed(1)}</span>
              <span className="text-xs text-neutral-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Via hardware buffer &amp; clock tuning
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Zero-latency FIR &amp; bypass active
          </div>
        </div>

        {/* 4. Engine Architecture */}
        <div className="bg-neutral-900/80 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-neutral-400 uppercase flex items-center gap-1.5">
            <Cpu size={13} className="text-amber-400" />
            <span>DSP Execution Core</span>
          </span>
          <div className="my-2">
            <div className="text-sm font-bold font-mono text-white truncate">
              {coreEngineMode === 'hd-worklet' ? 'HD AudioWorklet' : 'Native Web Audio'}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 truncate">
              {ampEngineMode === 'wasm-nam' ? 'WASM NAM Neural Modeler' : ampEngineMode === 'hd-triode' ? 'HD Triode Worklet' : 'Waveshaper'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
            {report.bufferSize} samples ({report.sampleRate} Hz)
          </div>
        </div>
      </div>

      {/* Turbo 1-Click Optimization Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-amber-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                1-Click Minimise Latency (Turbo Profile)
              </span>
              {isTurboActive ? (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  RECOMMENDED
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Switches buffer to lowest latencyHint, connects to native DAC clock, enables zero-delay analog cabinet convolver, and bypasses OS audio processing queues.
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyTurbo}
          disabled={isApplyingSettings || isTurboActive}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 shrink-0 ${
            isTurboActive
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25 active:scale-95'
          }`}
        >
          <ShieldCheck size={14} />
          <span>{isTurboActive ? 'MAXIMIZED (TURBO ACTIVE)' : 'APPLY TURBO PROFILE'}</span>
        </button>
      </div>

      {/* Hardware Device Selection & Wireless Latency Alert */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Audio Hardware Device Routing &amp; Clocks
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Select physical interface or low-latency wired output
          </span>
        </div>

        {/* Bluetooth Latency Alert Banner */}
        {report.isBluetoothActive && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-rose-300 flex items-center gap-2">
                <span>Bluetooth Wireless Audio Connection Detected</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-200 border border-rose-500/40">
                  +150ms to 250ms DELAY
                </span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                Bluetooth audio codecs (A2DP, AAC, SBC) introduce substantial packet buffering that makes real-time guitar monitoring feel sluggish. For best response, connect wired headphones or a USB audio interface.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Device */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-neutral-300 flex items-center gap-1.5">
              <Mic size={12} className="text-emerald-400" />
              <span>Input Audio Device (Microphone / Interface):</span>
            </label>
            <select
              value={latencySettings.selectedInputDeviceId || ''}
              onChange={(e) => onUpdateLatencySettings({ selectedInputDeviceId: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Default System Audio Input</option>
              {availableInputDevices
                .filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications' && d.deviceId !== '')
                .map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Audio Interface (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
            </select>
          </div>

          {/* Output Device */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-neutral-300 flex items-center gap-1.5">
              <Volume2 size={12} className="text-sky-400" />
              <span>Output Audio Device (Monitors / Headphones):</span>
            </label>
            <select
              value={latencySettings.selectedOutputDeviceId || ''}
              onChange={(e) => onUpdateLatencySettings({ selectedOutputDeviceId: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Default System Audio Output / DAC</option>
              {availableOutputDevices
                .filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications' && d.deviceId !== '')
                .map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.isBluetooth ? '🎧 [BT +150ms] ' : '🔊 '}
                    {device.label || `Output Device (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Latency Breakdown Stage Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Signal Chain Stage Latency Breakdown
            </span>
          </div>
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

      {/* Advanced Latency & DSP Engine Tuning Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core DSP Worklet Engine */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-amber-400" />
              <span>Core Engine Architecture</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
              AudioWorklet
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Dedicated high-priority audio thread isolates processing from DOM repaints and garbage collection pauses.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSetCoreEngineMode('hd-worklet')}
              className={`p-2 rounded-lg text-xs font-mono border transition-all text-left ${
                coreEngineMode === 'hd-worklet'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold">HD AudioWorklet</div>
              <div className="text-[10px] text-neutral-400 font-normal">Real-time thread (128 samples)</div>
            </button>
            <button
              onClick={() => onSetCoreEngineMode('standard')}
              className={`p-2 rounded-lg text-xs font-mono border transition-all text-left ${
                coreEngineMode === 'standard'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Standard WebAudio</div>
              <div className="text-[10px] text-neutral-400 font-normal">Native nodes fallback</div>
            </button>
          </div>
        </div>

        {/* Neural Amp Modeler Mode */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="text-emerald-400" />
              <span>Neural Amp Modeler Core</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
              NAM / Triode
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Neural Amp Modeler (WASM) reproduces real tube amplifier physics with zero latency overhead.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSetAmpEngineMode('wasm-nam')}
              className={`p-2 rounded-lg text-xs font-mono border transition-all text-left ${
                ampEngineMode === 'wasm-nam'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold">WASM NAM</div>
              <div className="text-[9px] text-neutral-400 font-normal">TONE3000 Neural</div>
            </button>
            <button
              onClick={() => onSetAmpEngineMode('hd-triode')}
              className={`p-2 rounded-lg text-xs font-mono border transition-all text-left ${
                ampEngineMode === 'hd-triode'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold">HD Triode</div>
              <div className="text-[9px] text-neutral-400 font-normal">Koren Tube Model</div>
            </button>
            <button
              onClick={() => onSetAmpEngineMode('waveshaper')}
              className={`p-2 rounded-lg text-xs font-mono border transition-all text-left ${
                ampEngineMode === 'waveshaper'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-bold">Waveshaper</div>
              <div className="text-[9px] text-neutral-400 font-normal">Low-power curve</div>
            </button>
          </div>
        </div>
      </div>

      {/* Latency Profiles & Low-Level Tuning Flags */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-4">
        <span className="text-xs font-bold text-white uppercase tracking-wider block">
          Hardware Buffer Tuning &amp; Zero-Latency Mode Toggles
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Buffer Quantum Profile */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <span className="text-xs font-bold text-neutral-200 block">Buffer Latency Profile</span>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="latencyProfile"
                  checked={latencySettings.profile === 'ultra-low'}
                  onChange={() => onUpdateLatencySettings({ profile: 'ultra-low' })}
                  className="text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Ultra-Low (0 buffer hint)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="latencyProfile"
                  checked={latencySettings.profile === 'balanced'}
                  onChange={() => onUpdateLatencySettings({ profile: 'balanced' })}
                  className="text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Balanced (Interactive)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="latencyProfile"
                  checked={latencySettings.profile === 'safe'}
                  onChange={() => onUpdateLatencySettings({ profile: 'safe' })}
                  className="text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Safe (Larger ring)</span>
              </label>
            </div>
          </div>

          {/* Sample Rate Mode */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <span className="text-xs font-bold text-neutral-200 block">Sample Rate Clock</span>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="sampleRateMode"
                  checked={latencySettings.sampleRateMode === 'native'}
                  onChange={() => onUpdateLatencySettings({ sampleRateMode: 'native' })}
                  className="text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Native DAC Clock (0ms delay)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="radio"
                  name="sampleRateMode"
                  checked={latencySettings.sampleRateMode === '48k'}
                  onChange={() => onUpdateLatencySettings({ sampleRateMode: '48k' })}
                  className="text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Fixed 48.0 kHz</span>
              </label>
            </div>
          </div>

          {/* Zero Latency Cab */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <span className="text-xs font-bold text-neutral-200 block">Cabinet Convolver</span>
            <label className="flex items-start gap-2 text-xs font-mono text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={latencySettings.zeroLatencyCab}
                onChange={(e) => onUpdateLatencySettings({ zeroLatencyCab: e.target.checked })}
                className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-emerald-500/20"
              />
              <div>
                <span className="block font-medium">Zero-Latency Analog Cab</span>
                <span className="text-[10px] text-neutral-400 block font-normal">
                  {latencySettings.zeroLatencyCab
                    ? 'Analog filter active (IR bypassed, 0.0ms delay)'
                    : 'Acoustic IR Convolver active (WAV Impulse Response)'}
                </span>
              </div>
            </label>
          </div>

          {/* OS Processing Bypass */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <span className="text-xs font-bold text-neutral-200 block">OS Audio Processing</span>
            <label className="flex items-start gap-2 text-xs font-mono text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={latencySettings.bypassOsVoiceProcessing}
                onChange={(e) => onUpdateLatencySettings({ bypassOsVoiceProcessing: e.target.checked })}
                className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-emerald-500/20"
              />
              <div>
                <span className="block font-medium">Bypass OS Voice Filters</span>
                <span className="text-[10px] text-neutral-400 block font-normal">Bypasses WebRTC speech AGC and AEC (+45ms saved)</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
