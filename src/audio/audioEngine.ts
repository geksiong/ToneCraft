/**
 * @file audioEngine.ts
 * @description Central Coordinator for ToneCraft DSP Audio Engine with Ultra-Low Latency Architecture.
 *
 * Latency Minimization Strategies:
 * 1. Hardware-level lowest buffer hint (latencyHint: 0) requesting smallest driver quantum (64-128 samples).
 * 2. Native hardware clock mode: bypasses browser software resamplers to eliminate 15-20ms of resampler filter delay.
 * 3. Raw unbuffered microphone / USB audio interface stream: explicitly disables all Chrome/Safari WebRTC
 *    voice processing queues and macOS/iOS Voice Isolation that inject 40ms to 80ms of delay.
 * 4. Dedicated audio interface selection: routes directly to high-speed USB interfaces (Focusrite, Behringer, etc.).
 * 5. Zero-latency analog cabinet IIR emulation: bypasses partitioned FFT convolution block latency.
 * 6. Zero-lookahead soft-clipper limiter: eliminates 128-sample compressor lookahead delay.
 * 7. Fast-tracking pitch shifter delay lines (8ms instead of 40ms).
 */

import {
  AnyPedal,
  AmpModelConfig,
  IrCabinetConfig,
  LooperState,
  TunerData
} from '../types/pedal';
import { AmpEngine, AmpEngineStatus } from './ampEngine';
import { isNamModelProfile } from './ampModels';
import { LooperEngine } from './looperEngine';
import { TunerEngine } from './tunerEngine';
import {
  createPedalDspNodes,
  updatePedalParameters,
  PedalNodeWrapper
} from './pedalDsp';
import { synthesizeRiffBuffer } from './sampleRiffs';
import {
  calculateSignalChainLatency,
  runActiveLatencyPing,
  SignalChainLatencyReport,
  isBluetoothDeviceName
} from './latencyTracker';
import { HdWorkletTelemetry } from './hdWorkletEngine';
import {
  InputConditionerEngine,
  InputConditionerConfig,
  InputConditionerTelemetry
} from './inputConditioner';
import {
  InputChannelRouter,
  InputChannelRoutingMode,
  OutputChannelRoutingMode,
  InputChannelTelemetry
} from './inputChannelRouter';

export interface AudioLatencySettings {
  profile: 'ultra-low' | 'balanced' | 'safe';
  sampleRateMode: 'native' | '48k' | '44.1k';
  zeroLatencyCab: boolean;
  zeroLookaheadLimiter: boolean;
  bypassOsVoiceProcessing: boolean;
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
}

export class ToneCraftEngine {
  // Web Audio Context
  public ctx: AudioContext | null = null;
  public isRunning: boolean = false;
  public isRiffPlaying: boolean = false;

  // Latency & Optimization Settings
  public latencySettings: AudioLatencySettings = {
    profile: 'ultra-low',
    sampleRateMode: 'native',
    zeroLatencyCab: false, // Default to FALSE so real acoustic IR Convolver is active and audible!
    zeroLookaheadLimiter: true,
    bypassOsVoiceProcessing: true,
    selectedInputDeviceId: '',
    selectedOutputDeviceId: ''
  };

  private pendingCustomIrArrayBuffer: ArrayBuffer | null = null;

  public currentInputDeviceLabel: string = '';
  public currentOutputDeviceLabel: string = '';

  // Core Engine Mode
  public coreEngineMode: 'hd-worklet' | 'standard' = 'hd-worklet';

  // Master Signal Path Nodes
  private inputGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private masterLimiterBus: GainNode | null = null;
  private masterCompressorNode: DynamicsCompressorNode | null = null;
  private masterSoftClipperNode: WaveShaperNode | null = null;
  private masterCompressorGain: GainNode | null = null;
  private masterClipperGain: GainNode | null = null;

  public analyserNode: AnalyserNode | null = null;
  private tunerAnalyserNode: AnalyserNode | null = null;
  private tunerGainNode: GainNode | null = null;

  // Output Routing Stage (Direct Hardware vs MediaStream Sink Bridge)
  private directDestinationGain: GainNode | null = null;
  private streamDestinationGain: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private outputAudioElement: HTMLAudioElement | null = null;

  // Input Stage State
  public currentInputSource: 'mic' | string = 'riff-clean-funk';
  private micMediaStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private sampleSourceNode: AudioBufferSourceNode | null = null;

  // Series Pedalboard Chain Boundaries
  private chainInputNode: GainNode | null = null;
  private chainOutputNode: GainNode | null = null;
  private pedalNodes: Map<string, PedalNodeWrapper> = new Map();
  private connectedPedalIds: string[] = [];
  public currentPedals: AnyPedal[] = [];
  public currentAmpConfig: AmpModelConfig | null = null;
  public currentCabConfig: IrCabinetConfig | null = null;

  // Sub-Engines
  public inputRouter: InputChannelRouter = new InputChannelRouter();
  public ampEngine: AmpEngine = new AmpEngine();
  private looperEngine: LooperEngine = new LooperEngine();
  private tunerEngine: TunerEngine = new TunerEngine();
  public inputConditioner: InputConditionerEngine = new InputConditionerEngine();

  // Dual-Channel Output Routing Balancer
  public outputRoutingMode: OutputChannelRoutingMode = 'stereo';
  private outputStageInput: GainNode | null = null;
  private outputSplitter: ChannelSplitterNode | null = null;
  private outputMerger: ChannelMergerNode | null = null;
  private outputLeftGain: GainNode | null = null;
  private outputRightGain: GainNode | null = null;
  private outputMonoLeftGain: GainNode | null = null;
  private outputMonoRightGain: GainNode | null = null;
  private outputStageNode: GainNode | null = null;

  // Telemetry & Latency State
  public lastMeasuredPing: number | null = null;
  public lastTelemetry: HdWorkletTelemetry = {
    cpuPercent: 8,
    avgExecTimeUs: 215,
    quantumMs: 2.67,
    sampleRate: 48000,
    bufferSamples: 128,
    cathodeVoltage: 0.12
  };

  // Metering & Notification Callbacks
  public onTunerUpdate: ((data: TunerData) => void) | null = null;
  public onLooperUpdate: ((state: LooperState) => void) | null = null;
  public onPeakUpdate: ((inputPeak: number, outputPeak: number) => void) | null = null;
  public onAmpStatusUpdate: ((status: AmpEngineStatus) => void) | null = null;
  public onTelemetryUpdate: ((telemetry: HdWorkletTelemetry) => void) | null = null;
  public onLatencyUpdate: ((report: SignalChainLatencyReport) => void) | null = null;
  public onConditionerUpdate: ((telemetry: InputConditionerTelemetry) => void) | null = null;
  public onInputChannelUpdate: ((telemetry: InputChannelTelemetry) => void) | null = null;
  private peakMeterTimer: any = null;

  constructor() {}

  /**
   * Initializes the AudioContext with lowest latency hardware configuration.
   */
  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isRunning = true;
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    // Build latency-optimized audio context parameters
    const ctxOptions: any = {};
    if (this.latencySettings.profile === 'ultra-low') {
      // Numerical 0 explicitly requests smallest OS audio driver buffer quantum (64-128 samples)
      ctxOptions.latencyHint = 0;
    } else if (this.latencySettings.profile === 'balanced') {
      ctxOptions.latencyHint = 'interactive';
    } else {
      ctxOptions.latencyHint = 'playback';
    }

    if (this.latencySettings.sampleRateMode === '48k') {
      ctxOptions.sampleRate = 48000;
    } else if (this.latencySettings.sampleRateMode === '44.1k') {
      ctxOptions.sampleRate = 44100;
    }
    // If 'native', omit sampleRate so browser uses native DAC hardware rate (0ms resampling filter delay!)

    try {
      this.ctx = new AudioContextClass(ctxOptions);
    } catch {
      // Fallback for older Safari
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Automatically recover if browser/OS suspends context midway
    this.ctx.onstatechange = () => {
      console.log(`[ToneCraftEngine] AudioContext state: ${this.ctx?.state}`);
      if (this.ctx?.state === 'suspended' && this.isRunning) {
        this.ctx.resume().catch(() => {});
      }
    };

    // Global user-gesture audio recovery: any click, touch, or keypress resumes suspended AudioContext
    if (typeof window !== 'undefined' && !(window as any).__toneCraftGestureAttached) {
      (window as any).__toneCraftGestureAttached = true;
      const gestureResume = () => {
        if (this.isRunning && this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', gestureResume, { passive: true });
      window.addEventListener('keydown', gestureResume, { passive: true });
      window.addEventListener('touchstart', gestureResume, { passive: true });
    }

    if (typeof window !== 'undefined') {
      (window as any).__toneCraftEngine = this;
    }

    // 1. Input Channel Router (Identifies Mono Input Sources & Routes to Both Channels L+R)
    const routerStage = this.inputRouter.init(this.ctx);

    // 2. Input Stage & Level Trim
    this.inputGainNode = this.ctx.createGain();
    this.inputGainNode.gain.value = 1.0;
    routerStage.output.connect(this.inputGainNode);

    // 3. Tuner Tap: Dedicated tap from router output (always receives audio on both channels)
    this.tunerGainNode = this.ctx.createGain();
    this.tunerGainNode.gain.value = 1.0;
    this.tunerAnalyserNode = this.ctx.createAnalyser();
    this.tunerAnalyserNode.fftSize = 2048;
    this.tunerGainNode.connect(this.tunerAnalyserNode);
    routerStage.output.connect(this.tunerGainNode);

    // 4. Studio Input Conditioner (Dynamic Noise Gate, De-Hiss Filter, Anti-Whine Notch, Low-Cut)
    const conditionerStage = this.inputConditioner.init(this.ctx);
    this.inputGainNode.connect(conditionerStage.input);

    // 5. Pedalboard Chain Boundary Nodes
    this.chainInputNode = this.ctx.createGain();
    this.chainOutputNode = this.ctx.createGain();
    conditionerStage.output.connect(this.chainInputNode);

    // 4. Initialize Sub-Engines
    const ampStage = this.ampEngine.init(this.ctx);
    this.ampEngine.setCabEngineMode(this.latencySettings.zeroLatencyCab ? 'analog-zero-latency' : 'ir-convolver');

    if (this.pendingCustomIrArrayBuffer) {
      await this.ampEngine.loadCustomIrWav(this.pendingCustomIrArrayBuffer.slice(0));
    }

    // Await async neural WASM engine and HD AudioWorklet ready before connecting downstream
    try {
      await this.ampEngine.waitForEnginesReady();
    } catch (err) {
      console.warn('[ToneCraftEngine] Async engine readiness fallback:', err);
    }

    const looperOutput = this.looperEngine.init(this.ctx, (state: LooperState) => {
      if (this.onLooperUpdate) this.onLooperUpdate(state);
    });

    // 5. Master Output Section & Switchable Safety Limiter
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.value = 0.85;

    this.masterLimiterBus = this.ctx.createGain();
    this.masterCompressorGain = this.ctx.createGain();
    this.masterClipperGain = this.ctx.createGain();

    // Standard Compressor Limiter (adds 128 samples lookahead)
    this.masterCompressorNode = this.ctx.createDynamicsCompressor();
    this.masterCompressorNode.threshold.value = -0.5;
    this.masterCompressorNode.knee.value = 0.0;
    this.masterCompressorNode.ratio.value = 20.0;
    this.masterCompressorNode.attack.value = 0.001;
    this.masterCompressorNode.release.value = 0.05;

    // High-Headroom Transparent Zero-Lookahead Safety Limiter
    // 100% strictly linear f(x) = x for all clean audio up to 0.88 (-1.1 dBFS, 0.000% THD).
    // Zero distortion on clean presets, pedals, and bypass! Smooth soft-knee saturation only for extreme high-gain spikes.
    this.masterSoftClipperNode = this.ctx.createWaveShaper();
    this.masterSoftClipperNode.oversample = '2x';
    const clipperPoints = 2048;
    const clipperCurve = new Float32Array(clipperPoints);
    const linearLimit = 0.88;
    for (let i = 0; i < clipperPoints; i++) {
      const x = (i / (clipperPoints - 1)) * 2 - 1;
      const absX = Math.abs(x);
      if (absX <= linearLimit) {
        clipperCurve[i] = x;
      } else {
        const sign = Math.sign(x);
        const excess = absX - linearLimit;
        clipperCurve[i] = sign * (linearLimit + (0.98 - linearLimit) * Math.tanh(excess * 4.5));
      }
    }
    this.masterSoftClipperNode.curve = clipperCurve;

    this.masterGainNode.connect(this.masterCompressorGain);
    this.masterGainNode.connect(this.masterClipperGain);

    this.masterCompressorGain.connect(this.masterCompressorNode);
    this.masterClipperGain.connect(this.masterSoftClipperNode);

    this.masterCompressorNode.connect(this.masterLimiterBus);
    this.masterSoftClipperNode.connect(this.masterLimiterBus);

    this.updateLimiterMode();

    // Visual Spectrum & Oscilloscope Analyser
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // 6. Assemble Full Signal Path:
    // ChainOutput -> Amp & Cab Stage -> Master Bus
    this.chainOutputNode.connect(ampStage.input);

    // Post-Cab signal feeds both master bus and looper
    ampStage.output.connect(this.masterGainNode);
    ampStage.output.connect(this.looperEngine.getRecordTapNode());

    // Looper layer playback mixes into master bus
    looperOutput.connect(this.masterGainNode);

    // Master Bus -> Limiter Bus -> Analyser -> Output Dual-Channel Stage -> Output Routing Stage
    this.masterLimiterBus.connect(this.analyserNode);

    // Output Dual-Channel Stage:
    // Ensures audio is routed to both Left and Right output channels (Stereo or Dual-Mono)
    this.outputStageInput = this.ctx.createGain();
    this.analyserNode.connect(this.outputStageInput);

    this.outputSplitter = this.ctx.createChannelSplitter(2);
    this.outputMerger = this.ctx.createChannelMerger(2);

    this.outputLeftGain = this.ctx.createGain();
    this.outputRightGain = this.ctx.createGain();
    this.outputMonoLeftGain = this.ctx.createGain();
    this.outputMonoRightGain = this.ctx.createGain();

    this.outputStageInput.connect(this.outputSplitter);

    // Direct Stereo routing:
    this.outputSplitter.connect(this.outputLeftGain, 0);
    this.outputSplitter.connect(this.outputRightGain, 1);
    this.outputLeftGain.connect(this.outputMerger, 0, 0);
    this.outputRightGain.connect(this.outputMerger, 0, 1);

    // Dual-Mono sum routing:
    this.outputSplitter.connect(this.outputMonoLeftGain, 0);
    this.outputSplitter.connect(this.outputMonoRightGain, 1);
    this.outputMonoLeftGain.connect(this.outputMerger, 0, 0);
    this.outputMonoLeftGain.connect(this.outputMerger, 0, 1);
    this.outputMonoRightGain.connect(this.outputMerger, 0, 0);
    this.outputMonoRightGain.connect(this.outputMerger, 0, 1);

    this.outputStageNode = this.ctx.createGain();
    this.outputMerger.connect(this.outputStageNode);

    this.updateOutputRoutingMode();

    // Dual-route output stage:
    // 1. Direct hardware destination (default output / DAC)
    this.directDestinationGain = this.ctx.createGain();
    this.directDestinationGain.gain.value = 1.0;
    this.outputStageNode.connect(this.directDestinationGain);
    this.directDestinationGain.connect(this.ctx.destination);

    // 2. MediaStreamDestination for explicit sinkId routing
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    this.streamDestinationGain = this.ctx.createGain();
    this.streamDestinationGain.gain.value = 0.0;
    this.outputStageNode.connect(this.streamDestinationGain);
    this.streamDestinationGain.connect(this.mediaStreamDest);

    if (typeof Audio !== 'undefined') {
      if (!this.outputAudioElement) {
        this.outputAudioElement = new Audio();
        this.outputAudioElement.autoplay = true;
      }
      this.outputAudioElement.srcObject = this.mediaStreamDest.stream;
    }

    if (this.latencySettings.selectedOutputDeviceId) {
      try {
        await this.setOutputDevice(this.latencySettings.selectedOutputDeviceId);
      } catch (err) {
        console.warn('[ToneCraftEngine] Failed to apply selected output device on init:', err);
      }
    }

    this.isRunning = true;

    // 7. Background Services
    this.tunerEngine.attach(
      this.tunerAnalyserNode,
      this.ctx.sampleRate,
      (data: TunerData) => {
        if (this.onTunerUpdate) this.onTunerUpdate(data);
      }
    );
    // Tuner is disabled unless input source is a mic source
    if (!this.isMicSource()) {
      this.tunerEngine.stop();
    }

    this.ampEngine.onStatusUpdate = (status) => {
      if (this.onAmpStatusUpdate) this.onAmpStatusUpdate(status);
      this.dispatchLatencyUpdate();
    };

    this.ampEngine.hdWorkletEngine.onTelemetry = (stats) => {
      this.lastTelemetry = stats;
      if (this.onTelemetryUpdate) this.onTelemetryUpdate(stats);
    };

    this.inputConditioner.onTelemetry = (telemetry) => {
      if (this.onConditionerUpdate) this.onConditionerUpdate(telemetry);
    };

    this.inputRouter.onTelemetry = (telemetry) => {
      if (this.onInputChannelUpdate) this.onInputChannelUpdate(telemetry);
    };

    this.startPeakMeterLoop();
    this.dispatchLatencyUpdate();
  }

  public setOutputRoutingMode(mode: OutputChannelRoutingMode): void {
    this.outputRoutingMode = mode;
    this.inputRouter.setOutputMode(mode);
    this.updateOutputRoutingMode();
  }

  private updateOutputRoutingMode(): void {
    if (!this.ctx || !this.outputLeftGain || !this.outputRightGain || !this.outputMonoLeftGain || !this.outputMonoRightGain) return;
    const now = this.ctx.currentTime;
    if (this.outputRoutingMode === 'dual-mono') {
      this.outputLeftGain.gain.setTargetAtTime(0.0, now, 0.02);
      this.outputRightGain.gain.setTargetAtTime(0.0, now, 0.02);
      this.outputMonoLeftGain.gain.setTargetAtTime(0.5, now, 0.02);
      this.outputMonoRightGain.gain.setTargetAtTime(0.5, now, 0.02);
    } else {
      this.outputLeftGain.gain.setTargetAtTime(1.0, now, 0.02);
      this.outputRightGain.gain.setTargetAtTime(1.0, now, 0.02);
      this.outputMonoLeftGain.gain.setTargetAtTime(0.0, now, 0.02);
      this.outputMonoRightGain.gain.setTargetAtTime(0.0, now, 0.02);
    }
  }

  public setInputRoutingMode(mode: InputChannelRoutingMode): void {
    this.inputRouter.setRoutingMode(mode);
  }

  public getInputRoutingMode(): InputChannelRoutingMode {
    return this.inputRouter.routingMode;
  }

  private updateLimiterMode(): void {
    if (!this.masterCompressorGain || !this.masterClipperGain) return;
    if (this.latencySettings.zeroLookaheadLimiter) {
      this.masterCompressorGain.gain.value = 0.0;
      this.masterClipperGain.gain.value = 1.0;
    } else {
      this.masterCompressorGain.gain.value = 1.0;
      this.masterClipperGain.gain.value = 0.0;
    }
  }

  // ==========================================================================
  // LATENCY OPTIMIZATION & HARDWARE CONFIGURATION
  // ==========================================================================

  public async getAudioInputDevices(): Promise<{ deviceId: string; label: string; isBluetooth: boolean }[]> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || (d.deviceId === 'default' ? 'Default System Microphone' : `Audio Interface / Input (${d.deviceId.slice(0, 6)})`),
          isBluetooth: isBluetoothDeviceName(d.label)
        }));
    } catch {
      return [];
    }
  }

  public async getAudioOutputDevices(): Promise<{ deviceId: string; label: string; isBluetooth: boolean }[]> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || (d.deviceId === 'default' ? 'Default Audio Output / DAC' : `Audio Output (${d.deviceId.slice(0, 6)})`),
          isBluetooth: isBluetoothDeviceName(d.label)
        }));
    } catch {
      return [];
    }
  }

  public async setOutputDevice(deviceId: string): Promise<boolean> {
    this.latencySettings.selectedOutputDeviceId = deviceId;
    const isDefault = !deviceId || deviceId === 'default';

    if (isDefault) {
      // Route back to default output / headphones
      if (this.directDestinationGain) {
        this.directDestinationGain.gain.value = 1.0;
      }
      if (this.streamDestinationGain) {
        this.streamDestinationGain.gain.value = 0.0;
      }
      if (this.outputAudioElement) {
        try {
          this.outputAudioElement.pause();
          if (typeof (this.outputAudioElement as any).setSinkId === 'function') {
            await (this.outputAudioElement as any).setSinkId('');
          }
        } catch {}
      }
      if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
        try {
          await (this.ctx as any).setSinkId('');
        } catch {}
      }
      this.currentOutputDeviceLabel = 'Default Audio Output / DAC';
      this.dispatchLatencyUpdate();
      return true;
    }

    // Specific Output Device Requested
    let routed = false;

    // Strategy 1: Direct AudioContext.setSinkId (modern Chromium)
    if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
      try {
        await (this.ctx as any).setSinkId(deviceId);
        if (this.directDestinationGain) this.directDestinationGain.gain.value = 1.0;
        if (this.streamDestinationGain) this.streamDestinationGain.gain.value = 0.0;
        if (this.outputAudioElement) {
          try { this.outputAudioElement.pause(); } catch {}
        }
        routed = true;
      } catch (ctxErr: any) {
        console.warn('[ToneCraftEngine] AudioContext.setSinkId failed, falling back to MediaStream sink bridge:', ctxErr?.message || ctxErr);
      }
    }

    // Strategy 2: HTMLAudioElement sink bridge (widely supported across Chromium releases)
    if (!routed && this.ctx && this.mediaStreamDest) {
      try {
        if (!this.outputAudioElement && typeof Audio !== 'undefined') {
          this.outputAudioElement = new Audio();
          this.outputAudioElement.autoplay = true;
          this.outputAudioElement.srcObject = this.mediaStreamDest.stream;
        }

        if (this.outputAudioElement && typeof (this.outputAudioElement as any).setSinkId === 'function') {
          await (this.outputAudioElement as any).setSinkId(deviceId);
          await this.outputAudioElement.play();

          // MUTE direct destination so user does NOT keep hearing output through headphones!
          if (this.directDestinationGain) {
            this.directDestinationGain.gain.value = 0.0;
          }
          if (this.streamDestinationGain) {
            this.streamDestinationGain.gain.value = 1.0;
          }
          routed = true;
        }
      } catch (elErr: any) {
        console.warn('[ToneCraftEngine] HTMLAudioElement.setSinkId failed:', elErr?.message || elErr);
      }
    }

    // Strategy 3: Permission Request if both were rejected (e.g. NotAllowedError in Chrome)
    if (!routed) {
      if (typeof (navigator.mediaDevices as any)?.selectAudioOutput === 'function') {
        try {
          const dev = await (navigator.mediaDevices as any).selectAudioOutput({ deviceId });
          const targetId = dev?.deviceId || deviceId;

          if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
            try {
              await (this.ctx as any).setSinkId(targetId);
              if (this.directDestinationGain) this.directDestinationGain.gain.value = 1.0;
              if (this.streamDestinationGain) this.streamDestinationGain.gain.value = 0.0;
              routed = true;
            } catch {}
          }

          if (!routed && this.outputAudioElement && typeof (this.outputAudioElement as any).setSinkId === 'function') {
            try {
              await (this.outputAudioElement as any).setSinkId(targetId);
              await this.outputAudioElement.play();
              if (this.directDestinationGain) this.directDestinationGain.gain.value = 0.0;
              if (this.streamDestinationGain) this.streamDestinationGain.gain.value = 1.0;
              routed = true;
            } catch {}
          }
        } catch (permErr) {
          console.warn('[ToneCraftEngine] selectAudioOutput grant dismissed or failed:', permErr);
        }
      }
    }

    // Strategy 4: Fallback device permission unlock via temporary getUserMedia
    if (!routed) {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());

        if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
          try {
            await (this.ctx as any).setSinkId(deviceId);
            if (this.directDestinationGain) this.directDestinationGain.gain.value = 1.0;
            if (this.streamDestinationGain) this.streamDestinationGain.gain.value = 0.0;
            routed = true;
          } catch {}
        }

        if (!routed && this.outputAudioElement && typeof (this.outputAudioElement as any).setSinkId === 'function') {
          try {
            await (this.outputAudioElement as any).setSinkId(deviceId);
            await this.outputAudioElement.play();
            if (this.directDestinationGain) this.directDestinationGain.gain.value = 0.0;
            if (this.streamDestinationGain) this.streamDestinationGain.gain.value = 1.0;
            routed = true;
          } catch {}
        }
      } catch (micErr) {
        console.warn('[ToneCraftEngine] Fallback device unlock failed:', micErr);
      }
    }

    try {
      const outputs = await this.getAudioOutputDevices();
      const found = outputs.find((o) => o.deviceId === deviceId);
      if (found) {
        this.currentOutputDeviceLabel = found.label;
      } else {
        this.currentOutputDeviceLabel = `Audio Output (${deviceId.slice(0, 6)})`;
      }
    } catch {
      this.currentOutputDeviceLabel = `Audio Output (${deviceId.slice(0, 6)})`;
    }

    this.dispatchLatencyUpdate();
    return routed;
  }

  public async updateLatencySettings(newSettings: Partial<AudioLatencySettings>): Promise<void> {
    const prev = { ...this.latencySettings };
    this.latencySettings = { ...this.latencySettings, ...newSettings };

    const needsRestart =
      (newSettings.profile !== undefined && newSettings.profile !== prev.profile) ||
      (newSettings.sampleRateMode !== undefined && newSettings.sampleRateMode !== prev.sampleRateMode);

    if (newSettings.selectedOutputDeviceId !== undefined && newSettings.selectedOutputDeviceId !== prev.selectedOutputDeviceId) {
      await this.setOutputDevice(newSettings.selectedOutputDeviceId);
    }

    if (needsRestart) {
      await this.restartAudioContext();
    } else {
      if (newSettings.zeroLatencyCab !== undefined) {
        this.ampEngine.setCabEngineMode(this.latencySettings.zeroLatencyCab ? 'analog-zero-latency' : 'ir-convolver');
      }
      if (newSettings.zeroLookaheadLimiter !== undefined) {
        this.updateLimiterMode();
      }
      if ((newSettings.selectedInputDeviceId !== undefined || newSettings.bypassOsVoiceProcessing !== undefined) &&
          this.currentInputSource === 'mic') {
        await this.setInputSource('mic');
      }
      this.dispatchLatencyUpdate();
    }
  }

  public async restartAudioContext(): Promise<void> {
    const wasRunning = this.isRunning;
    const wasRiffPlaying = this.isRiffPlaying;
    const prevPedals = [...this.currentPedals];
    const prevAmp = this.currentAmpConfig;
    const prevCab = this.currentCabConfig;
    const prevSource = this.currentInputSource;

    this.disposeContextOnly();
    await this.init();

    if (prevPedals.length > 0) this.updatePedalboardChain(prevPedals);
    if (prevAmp) this.updateAmpModel(prevAmp);
    if (prevCab) this.updateIrCabinet(prevCab);
    await this.setInputSource(prevSource, wasRiffPlaying);

    if (wasRunning && this.ctx?.state === 'suspended') {
      await this.ctx.resume();
      this.isRunning = true;
    }
    this.dispatchLatencyUpdate();
  }

  public setCoreEngineMode(mode: 'hd-worklet' | 'standard'): void {
    this.coreEngineMode = mode;
    this.dispatchLatencyUpdate();
  }

  public setAmpEngineMode(mode: 'wasm-nam' | 'hd-triode' | 'waveshaper'): void {
    const isNam = isNamModelProfile(this.currentAmpConfig);
    let target = mode;
    if (isNam) {
      target = 'wasm-nam';
    } else if (target === 'wasm-nam') {
      target = (this.currentAmpConfig?.engineMode && this.currentAmpConfig.engineMode !== 'wasm-nam')
        ? this.currentAmpConfig.engineMode
        : 'hd-triode';
    }

    this.ampEngine.setEngineMode(target);
    if (this.currentAmpConfig) {
      this.currentAmpConfig.engineMode = target;
      this.currentAmpConfig.isRealNam = isNam;
    }
    this.dispatchLatencyUpdate();
  }

  public getLatencyReport(): SignalChainLatencyReport {
    return calculateSignalChainLatency(this.ctx, this.currentPedals, {
      coreEngineMode: this.coreEngineMode,
      ampEngineMode: this.ampEngine.currentEngineMode,
      cabEngineMode: this.ampEngine.cabEngineMode,
      latencyProfile: this.latencySettings.profile,
      sampleRateMode: this.latencySettings.sampleRateMode,
      zeroLookaheadLimiter: this.latencySettings.zeroLookaheadLimiter,
      bypassOsVoiceProcessing: this.latencySettings.bypassOsVoiceProcessing,
      cpuPercent: this.lastTelemetry.cpuPercent,
      measuredPing: this.lastMeasuredPing,
      selectedInputDeviceName: this.currentInputDeviceLabel,
      selectedOutputDeviceName: this.currentOutputDeviceLabel
    });
  }

  public async runLatencyPing(): Promise<number> {
    if (!this.ctx) return 4.8;
    const ping = await runActiveLatencyPing(this.ctx);
    this.lastMeasuredPing = ping;
    this.dispatchLatencyUpdate();
    return ping;
  }

  public dispatchLatencyUpdate(): void {
    if (this.onLatencyUpdate) {
      this.onLatencyUpdate(this.getLatencyReport());
    }
  }

  public isMicSource(): boolean {
    return this.currentInputSource === 'mic' || this.currentInputSource.startsWith('mic:');
  }

  // ==========================================================================
  // INPUT SOURCE MANAGEMENT (Mic / USB Audio Interface vs. Physical Riffs)
  // ==========================================================================

  public async setInputSource(source: 'mic' | string, autoPlayRiff: boolean = false): Promise<void> {
    if (!this.ctx || !this.inputGainNode) return;
    this.currentInputSource = source;

    this.stopSampleRiff();

    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch {}
      this.micSourceNode = null;
    }
    if (this.micMediaStream) {
      this.micMediaStream.getTracks().forEach(track => track.stop());
      this.micMediaStream = null;
    }

    const isMicSource = this.isMicSource();
    if (isMicSource) {
      if (source.startsWith('mic:')) {
        const devId = source.slice(4);
        this.latencySettings.selectedInputDeviceId = devId === 'default' ? '' : devId;
      }
      try {
        const audioConstraints: any = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0,
          channelCount: { ideal: 1 },
          sampleRate: this.ctx ? { ideal: this.ctx.sampleRate } : undefined
        };

        if (this.latencySettings.bypassOsVoiceProcessing) {
          // Disable Chrome & Safari WebRTC speech pre-processing buffers (+40ms to +80ms delay)
          audioConstraints.googEchoCancellation = false;
          audioConstraints.googAutoGainControl = false;
          audioConstraints.googNoiseSuppression = false;
          audioConstraints.googHighpassFilter = false;
          audioConstraints.googAudioMirroring = false;
          audioConstraints.googTypingNoiseDetection = false;
          audioConstraints.voiceIsolation = false; // Bypass macOS / iOS voice isolation filter
        }

        if (this.latencySettings.selectedInputDeviceId) {
          audioConstraints.deviceId = { exact: this.latencySettings.selectedInputDeviceId };
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints
          });
        } catch (err) {
          console.warn('Strict low-latency constraints rejected, attempting standard low-latency fallback:', err);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              latency: 0
            } as any
          });
        }

        this.micMediaStream = stream;
        const track = stream.getAudioTracks()[0];
        let chCount = 1;
        if (track) {
          this.currentInputDeviceLabel = track.label || '';
          const settings = (track as any).getSettings ? (track as any).getSettings() : null;
          if (settings && settings.channelCount) {
            chCount = settings.channelCount;
          }
        }
        this.micSourceNode = this.ctx.createMediaStreamSource(stream);
        if (this.micSourceNode.channelCount) {
          chCount = Math.max(chCount, this.micSourceNode.channelCount);
        }
        this.inputRouter.setSourceChannelCount(chCount);

        // Connect mic stream to inputRouter (identifies mono sources & routes to both channels)
        if (this.inputRouter.inputNode) {
          this.micSourceNode.connect(this.inputRouter.inputNode);
        }
        // Activate tuner loop when on mic input
        if (this.isRunning) {
          this.tunerEngine.start();
        }
        this.dispatchLatencyUpdate();
      } catch (err) {
        console.error('Failed to access microphone/audio interface with low-latency settings:', err);
        this.tunerEngine.stop();
      }
    } else {
      this.currentInputDeviceLabel = '';
      // Explicitly disable the tuner when not using mic sources
      this.tunerEngine.stop();
      if (this.onTunerUpdate) {
        this.onTunerUpdate({
          note: '',
          frequency: 0,
          cents: 0,
          targetFrequency: 0,
          inTune: false,
          clarity: 0
        });
      }
      if (autoPlayRiff) {
        this.playSampleRiff(source);
      }
      this.dispatchLatencyUpdate();
    }
  }

  public playSampleRiff(riffId: string): void {
    if (!this.ctx || !this.inputGainNode) return;
    if (riffId.startsWith('mic')) return;

    if (this.sampleSourceNode) {
      try {
        this.sampleSourceNode.stop();
        this.sampleSourceNode.disconnect();
      } catch {}
      this.sampleSourceNode = null;
    }

    const buffer = synthesizeRiffBuffer(this.ctx, riffId);
    const sourceNode = this.ctx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    this.inputRouter.setSourceChannelCount(buffer.numberOfChannels || 1);
    if (this.inputRouter.inputNode) {
      sourceNode.connect(this.inputRouter.inputNode);
    }
    sourceNode.start(0);
    this.sampleSourceNode = sourceNode;
    this.isRiffPlaying = true;
  }

  public stopSampleRiff(): void {
    if (this.sampleSourceNode) {
      try {
        this.sampleSourceNode.stop();
        this.sampleSourceNode.disconnect();
      } catch {}
      this.sampleSourceNode = null;
    }
    this.isRiffPlaying = false;
  }

  public toggleSampleRiff(): boolean {
    if (this.isRiffPlaying) {
      this.stopSampleRiff();
      return false;
    } else {
      this.playSampleRiff(this.currentInputSource === 'mic' ? 'riff-clean-funk' : this.currentInputSource);
      return true;
    }
  }

  // ==========================================================================
  // MASTER GAIN & ATTENUATION CONTROLS
  // ==========================================================================

  public setInputGain(value: number): void {
    if (this.inputGainNode && this.ctx) {
      if (value <= 0) {
        this.inputGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
        return;
      }
      // Value 50 = exact 0.0 dB (Unity gain 1.0)
      // 0..50 maps to -26 dB .. 0 dB cut
      // 50..100 maps to 0 dB .. +14 dB boost
      const db = ((value - 50) / 50) * (value >= 50 ? 14 : 26);
      const gain = Math.pow(10, db / 20);
      this.inputGainNode.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.015);
    }
  }

  public isMuted: boolean = false;
  private currentMasterVolume: number = 85;

  public setMasterGain(value: number): void {
    this.currentMasterVolume = value;
    if (this.masterGainNode && this.ctx) {
      if (this.isMuted) {
        this.masterGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.005);
      } else {
        const vol = value <= 0 ? 0 : Math.pow(value / 100, 1.4);
        this.masterGainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.015);
      }
    }
  }

  /**
   * Instantly silences or un-silences all audio output with click-free parameter smoothing.
   */
  public setMasterMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGainNode && this.ctx) {
      if (muted) {
        this.masterGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.005);
      } else {
        const vol = this.currentMasterVolume <= 0 ? 0 : Math.pow(this.currentMasterVolume / 100, 1.4);
        this.masterGainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.015);
      }
    }
  }

  public toggleMasterMute(): boolean {
    this.setMasterMute(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Bypasses the NAM amplifier stage
   */
  public setAmpBypass(bypassed: boolean): void {
    this.ampEngine.setAmpBypass(bypassed);
    if (this.currentAmpConfig) {
      this.currentAmpConfig = { ...this.currentAmpConfig, bypassed };
    }
    this.dispatchLatencyUpdate();
  }

  /**
   * Bypasses the IR / speaker cabinet stage
   */
  public setCabBypass(bypassed: boolean): void {
    this.ampEngine.setCabBypass(bypassed);
    if (this.currentCabConfig) {
      this.currentCabConfig = { ...this.currentCabConfig, bypassed };
    }
    this.dispatchLatencyUpdate();
  }

  // ==========================================================================
  // INPUT CONDITIONER & MIC NOISE GATE CONTROLS
  // ==========================================================================

  public updateInputConditioner(config: Partial<InputConditionerConfig>): void {
    this.inputConditioner.updateConfig(config);
  }

  public getInputConditionerConfig(): InputConditionerConfig {
    return this.inputConditioner.config;
  }

  public startLearnNoiseFloor(callback: (learnedDb: number) => void): void {
    this.inputConditioner.startLearnNoiseFloor(callback);
  }

  public applyWhineKillerPreset(): void {
    this.inputConditioner.applyWhineKillerPreset();
  }

  // ==========================================================================
  // DYNAMIC PEDALBOARD ROUTING
  // ==========================================================================

  private disposePedalWrapper(nodeWrap: PedalNodeWrapper): void {
    try { nodeWrap.output.disconnect(); } catch {}
    try { nodeWrap.input.disconnect(); } catch {}
    try { nodeWrap.bypassGain.disconnect(); } catch {}
    try { nodeWrap.wetGain.disconnect(); } catch {}
    if (nodeWrap.dspNodes) {
      if (typeof nodeWrap.dspNodes.dispose === 'function') {
        try { nodeWrap.dspNodes.dispose(); } catch {}
      }
      if (nodeWrap.dspNodes.lfo) {
        try { nodeWrap.dspNodes.lfo.stop(); } catch {}
        try { nodeWrap.dspNodes.lfo.disconnect(); } catch {}
      }
      if (nodeWrap.dspNodes.state?.timer) {
        clearInterval(nodeWrap.dspNodes.state.timer);
      }
      if (nodeWrap.dspNodes.shifter?.dispose) {
        try { nodeWrap.dspNodes.shifter.dispose(); } catch {}
      }
      if (nodeWrap.dspNodes.analyser) {
        try { nodeWrap.dspNodes.analyser.disconnect(); } catch {}
      }
    }
  }

  public updatePedalboardChain(pedals: AnyPedal[]): void {
    if (!this.ctx || !this.chainInputNode || !this.chainOutputNode) return;

    // Fast-path: only if the pedal chain order is already connected in the exact same serial order with valid matching wrappers
    const isChainAlreadyWired =
      this.connectedPedalIds.length === pedals.length &&
      pedals.every((p, idx) => {
        if (p.id !== this.connectedPedalIds[idx]) return false;
        const wrap = this.pedalNodes.get(p.id);
        return wrap && (!wrap.pedalType || wrap.pedalType === p.type);
      });

    if (isChainAlreadyWired) {
      pedals.forEach((pedal) => {
        const wrapper = this.pedalNodes.get(pedal.id);
        if (wrapper) {
          updatePedalParameters(this.ctx!, pedal, wrapper);
        }
      });
      this.currentPedals = pedals;
      this.dispatchLatencyUpdate();
      return;
    }

    // Slow-path: Topology or preset changed. Disconnect and re-wire audio graph
    try { this.chainInputNode.disconnect(); } catch {}

    this.pedalNodes.forEach(nodeWrap => {
      try { nodeWrap.output.disconnect(); } catch {}
    });

    const newPedalMap = new Map(pedals.map(p => [p.id, p]));
    this.pedalNodes.forEach((nodeWrap, id) => {
      const newPedal = newPedalMap.get(id);
      if (!newPedal || (nodeWrap.pedalType && nodeWrap.pedalType !== newPedal.type)) {
        this.disposePedalWrapper(nodeWrap);
        this.pedalNodes.delete(id);
      }
    });

    if (pedals.length === 0) {
      this.chainInputNode.connect(this.chainOutputNode);
      this.connectedPedalIds = [];
      this.currentPedals = pedals;
      this.dispatchLatencyUpdate();
      return;
    }

    let previousNode: AudioNode = this.chainInputNode;

    pedals.forEach((pedal) => {
      let wrapper = this.pedalNodes.get(pedal.id);
      if (!wrapper || (wrapper.pedalType && wrapper.pedalType !== pedal.type)) {
        if (wrapper) this.disposePedalWrapper(wrapper);
        wrapper = createPedalDspNodes(this.ctx!, pedal);
        wrapper.pedalType = pedal.type;
        this.pedalNodes.set(pedal.id, wrapper);
      }
      updatePedalParameters(this.ctx!, pedal, wrapper);

      previousNode.connect(wrapper.input);
      previousNode = wrapper.output;
    });

    this.connectedPedalIds = pedals.map(p => p.id);
    this.currentPedals = pedals;
    previousNode.connect(this.chainOutputNode);
    this.dispatchLatencyUpdate();
  }

  public updatePedalParameters(pedal: AnyPedal): void {
    if (!this.ctx) return;
    this.currentPedals = this.currentPedals.map(p => p.id === pedal.id ? pedal : p);
    const wrapper = this.pedalNodes.get(pedal.id);
    if (!wrapper || (wrapper.pedalType && wrapper.pedalType !== pedal.type)) {
      this.updatePedalboardChain(this.currentPedals);
      return;
    }
    updatePedalParameters(this.ctx, pedal, wrapper);
    this.dispatchLatencyUpdate();
  }

  // ==========================================================================
  // AMPLIFIER & IR CABINET DELEGATION
  // ==========================================================================

  public updateAmpModel(config: AmpModelConfig): void {
    this.currentAmpConfig = config;
    this.ampEngine.updateAmpModel(config);
    this.dispatchLatencyUpdate();
  }

  public updateIrCabinet(config: IrCabinetConfig): void {
    this.currentCabConfig = config;
    this.ampEngine.updateIrCabinet(config);
    this.dispatchLatencyUpdate();
  }

  public async loadCustomIrWav(arrayBuffer: ArrayBuffer): Promise<void> {
    this.pendingCustomIrArrayBuffer = arrayBuffer.slice(0);
    this.latencySettings.zeroLatencyCab = false;
    if (this.ctx) {
      await this.ampEngine.loadCustomIrWav(arrayBuffer.slice(0));
    }
    this.dispatchLatencyUpdate();
  }

  // ==========================================================================
  // LOOPER DELEGATION
  // ==========================================================================

  public toggleLooperRecord(): void {
    this.looperEngine.toggleRecord();
  }

  public toggleLooperPlayStop(): void {
    this.looperEngine.togglePlayStop();
  }

  public clearLooper(): void {
    this.looperEngine.clear();
  }

  public undoLooper(): void {
    this.looperEngine.undo();
  }

  public toggleLooperReverse(): void {
    this.looperEngine.toggleReverse();
  }

  public toggleLooperSpeed(): void {
    this.looperEngine.toggleSpeed();
  }

  public setLooperVolume(vol: number): void {
    this.looperEngine.setVolume(vol);
  }

  // ==========================================================================
  // BACKGROUND PEAK METERING
  // ==========================================================================

  private startPeakMeterLoop(): void {
    const inputBuf = new Float32Array(256);
    const outputBuf = new Float32Array(256);

    const updatePeak = () => {
      if (this.isRunning && this.onPeakUpdate && this.tunerAnalyserNode && this.analyserNode) {
        this.tunerAnalyserNode.getFloatTimeDomainData(inputBuf);
        this.analyserNode.getFloatTimeDomainData(outputBuf);

        let inPeak = 0;
        let outPeak = 0;
        for (let i = 0; i < 256; i++) {
          const ai = Math.abs(inputBuf[i]);
          if (ai > inPeak) inPeak = ai;
          const ao = Math.abs(outputBuf[i]);
          if (ao > outPeak) outPeak = ao;
        }

        this.onPeakUpdate(Math.min(1, inPeak), Math.min(1, outPeak));
      }
      this.peakMeterTimer = setTimeout(updatePeak, 80);
    };

    updatePeak();
  }

  // ==========================================================================
  // CLEANUP & LIFECYCLE
  // ==========================================================================

  public disposeContextOnly(): void {
    this.isRunning = false;
    this.tunerEngine.stop();
    this.looperEngine.dispose();
    this.ampEngine.dispose();
    this.inputConditioner.dispose();
    this.inputRouter.dispose();
    if (this.tunerGainNode) {
      try { this.tunerGainNode.disconnect(); } catch {}
      this.tunerGainNode = null;
    }
    this.outputStageInput = null;
    this.outputSplitter = null;
    this.outputMerger = null;
    this.outputLeftGain = null;
    this.outputRightGain = null;
    this.outputMonoLeftGain = null;
    this.outputMonoRightGain = null;
    this.outputStageNode = null;
    if (this.outputAudioElement) {
      try {
        this.outputAudioElement.pause();
        this.outputAudioElement.srcObject = null;
      } catch {}
      this.outputAudioElement = null;
    }
    this.directDestinationGain = null;
    this.streamDestinationGain = null;
    this.mediaStreamDest = null;
    if (this.sampleSourceNode) {
      try { this.sampleSourceNode.stop(); } catch {}
      this.sampleSourceNode = null;
    }
    if (this.micMediaStream) {
      this.micMediaStream.getTracks().forEach(t => t.stop());
      this.micMediaStream = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
    this.pedalNodes.forEach(nodeWrap => {
      this.disposePedalWrapper(nodeWrap);
    });
    this.pedalNodes.clear();
    this.connectedPedalIds = [];
  }

  /**
   * Completely suspends DSP audio processing, stops audio generators, and silences meters.
   * Explicitly sets isRunning = false so that gesture listeners and onstatechange callbacks
   * do NOT auto-resume.
   */
  public async suspend(): Promise<void> {
    console.log('[ToneCraftEngine] Switching DSP engine OFF...');
    this.isRunning = false;
    this.tunerEngine.stop();
    this.stopSampleRiff();
    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch {}
    }
    if (this.outputAudioElement) {
      try { this.outputAudioElement.pause(); } catch {}
    }
    if (this.ctx && this.ctx.state === 'running') {
      try {
        await this.ctx.suspend();
      } catch (err) {
        console.warn('[ToneCraftEngine] Error suspending AudioContext:', err);
      }
    }
    if (this.onPeakUpdate) {
      this.onPeakUpdate(0, 0);
    }
  }

  /**
   * Resumes DSP audio processing and reactivates audio sources.
   */
  public async resume(): Promise<void> {
    console.log('[ToneCraftEngine] Switching DSP engine ON...');
    if (!this.ctx || this.ctx.state === 'closed') {
      await this.init();
      return;
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[ToneCraftEngine] Error resuming AudioContext:', err);
      }
    }
    this.isRunning = true;
    if (this.latencySettings.selectedOutputDeviceId) {
      try {
        await this.setOutputDevice(this.latencySettings.selectedOutputDeviceId);
      } catch (err) {
        console.warn('[ToneCraftEngine] Error reapplying output device on resume:', err);
      }
    }
    if (this.isMicSource()) {
      await this.setInputSource(this.currentInputSource);
      this.tunerEngine.start();
    } else {
      this.tunerEngine.stop();
      this.playSampleRiff(this.currentInputSource || 'riff-clean-funk');
    }
  }

  /**
   * Complete recovery restart: disposes stale context/nodes and reinitializes cleanly.
   * Restores full audio without requiring a browser page reload!
   */
  public async restart(): Promise<void> {
    console.log('[ToneCraftEngine] Restarting audio engine from scratch for clean recovery...');
    const savedPedals = [...this.currentPedals];
    const savedAmpConfig = this.currentAmpConfig;
    const savedCabConfig = this.currentCabConfig;
    const savedVolume = this.currentMasterVolume;
    const savedSource = this.currentInputSource;

    this.disposeContextOnly();
    await this.init();

    if (savedPedals.length > 0) {
      this.updatePedalboardChain(savedPedals);
    }
    if (savedAmpConfig) {
      this.updateAmpModel(savedAmpConfig);
    }
    if (savedCabConfig) {
      this.updateIrCabinet(savedCabConfig);
    }
    this.setMasterGain(savedVolume);

    if (savedSource.startsWith('mic')) {
      await this.setInputSource(savedSource);
      this.tunerEngine.start();
    } else {
      this.tunerEngine.stop();
      this.playSampleRiff(savedSource || 'riff-clean-funk');
    }
    this.isRunning = true;
    console.log('[ToneCraftEngine] Audio engine recovery restart completed successfully.');
  }

  public dispose(): void {
    if (this.peakMeterTimer) clearTimeout(this.peakMeterTimer);
    this.disposeContextOnly();
  }
}

// Global audio engine singleton
export const audioEngine = new ToneCraftEngine();
