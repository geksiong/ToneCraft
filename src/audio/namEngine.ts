/**
 * @file namEngine.ts
 * @description Real Neural Amp Modeler (NAM) & Acoustic Cabinet IR Engine.
 *
 * Implements:
 * 1. Real NAM inference using TONE3000's `neural-amp-modeler-wasm` (Atkinson WaveNet/LSTM
 *    compiled to WebAssembly in an AudioWorklet).
 * 2. Alternative HD AudioWorklet physical circuit simulation (Norman Koren triode differential
 *    equations with dynamic cathode sag and blocking distortion).
 * 3. Classic low-CPU polynomial waveshaper fallback.
 * 4. Real acoustic cabinet Impulse Response convolution using decoded WAV IR files
 *    (Celestion Vintage 30 4x12, EMT 140 Studio Plate, plus user custom WAV files).
 * 5. Passive 4-band tone stack (Bass, Mid, Treble, Presence) and Master Volume stage.
 */

import { NamEngine as Tone3000NamEngine, NamNode, NamModelInfo } from 'neural-amp-modeler-wasm/engine';
import { HdWorkletEngine } from './hdWorkletEngine';
import { NamModelConfig, IrCabinetConfig } from '../types/pedal';
import { createNamSaturationCurve } from './curves';
import { generateSyntheticCabIr, calibrateIrBuffer } from './irData';
import { isNamModelProfile } from './namModels';

export interface NamEngineStatus {
  activeEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  modelName: string;
  architecture: string;
  weightsCount: number;
  sampleRate: number;
  isRealNam: boolean;
  isWasmReady: boolean;
  irName: string;
  isRealIr: boolean;
  isAmpBypassed: boolean;
  isCabBypassed: boolean;
}

export class NamEngine {
  public ctx: AudioContext | null = null;

  // I/O Boundary Nodes
  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;

  // Amp Bypass & Stage Routing
  private ampPreampInput: GainNode | null = null;
  private ampBypassGain: GainNode | null = null;
  public isAmpBypassed: boolean = false;

  // Cab Bypass & Stage Routing
  private cabStageInput: GainNode | null = null;
  private cabBypassGain: GainNode | null = null;
  public isCabBypassed: boolean = false;

  // Amp Engine Routing
  public currentEngineMode: 'wasm-nam' | 'hd-triode' | 'waveshaper' = 'wasm-nam';
  private wasmInputGain: GainNode | null = null;
  private wasmOutputGain: GainNode | null = null;
  private workletInputGain: GainNode | null = null;
  private workletOutputGain: GainNode | null = null;
  private waveshaperInputGain: GainNode | null = null;
  private waveshaperOutputGain: GainNode | null = null;

  // 1. TONE3000 WASM NAM Engine
  private tone3000Engine: Tone3000NamEngine | null = null;
  public namWasmNode: NamNode | null = null;
  public isWasmReady: boolean = false;
  private currentLoadedModelUrl: string | null = null;

  // 2. HD AudioWorklet Triode Engine
  public hdWorkletEngine: HdWorkletEngine = new HdWorkletEngine();

  // 3. Classic Waveshaper Preamp (Low CPU Fallback)
  private waveShaper: WaveShaperNode | null = null;

  // 4. Tone Stack & Master Stage
  private toneBass: BiquadFilterNode | null = null;
  private toneMid: BiquadFilterNode | null = null;
  private toneTreble: BiquadFilterNode | null = null;
  private tonePresence: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;

  // 5. Cabinet IR Convolver & Zero-Latency Stage
  private cabConvolver: ConvolverNode | null = null;
  private cabIrGain: GainNode | null = null;
  private cabAnalogGain: GainNode | null = null;
  public cabEngineMode: 'ir-convolver' | 'analog-zero-latency' = 'ir-convolver';
  private cabLowCut: BiquadFilterNode | null = null;
  private cabHighCut: BiquadFilterNode | null = null;
  private customCabBuffer: AudioBuffer | null = null;
  private currentIrUrl: string | null = null;
  private isCurrentIrReal: boolean = false;
  private irLoadSequence: number = 0;

  // Telemetry & Status Callbacks
  public onStatusUpdate: ((status: NamEngineStatus) => void) | null = null;
  private lastModelInfo: NamModelInfo | null = null;
  private lastModelConfig: NamModelConfig | null = null;
  private lastCabConfig: IrCabinetConfig | null = null;
  public enginesReadyPromise: Promise<void> | null = null;

  public async waitForEnginesReady(): Promise<void> {
    if (this.enginesReadyPromise) {
      await this.enginesReadyPromise;
    }
  }

  /**
   * Initializes all audio nodes and attaches both the WASM NAM engine and HD AudioWorklet.
   */
  public init(ctx: AudioContext): { input: GainNode; output: GainNode } {
    this.ctx = ctx;

    // 1. Stage Input & Output
    this.inputNode = ctx.createGain();
    this.inputNode.gain.value = 1.0;

    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 1.0;

    // 2. Amp Preamp Stage & Dry Amp Bypass
    this.ampPreampInput = ctx.createGain();
    this.ampPreampInput.gain.value = 1.0;

    this.ampBypassGain = ctx.createGain();
    this.ampBypassGain.gain.value = this.isAmpBypassed ? 1.0 : 0.0;

    this.inputNode.connect(this.ampPreampInput);
    this.inputNode.connect(this.ampBypassGain);

    // 3. Multi-Engine Routing Gain Buses
    this.wasmInputGain = ctx.createGain();
    this.wasmOutputGain = ctx.createGain();
    this.workletInputGain = ctx.createGain();
    this.workletOutputGain = ctx.createGain();
    this.waveshaperInputGain = ctx.createGain();
    this.waveshaperOutputGain = ctx.createGain();

    // Default to waveshaper active until WASM / HD Worklet are verified ready
    this.waveshaperInputGain.gain.value = 1.0;
    this.waveshaperOutputGain.gain.value = 1.0;
    this.wasmInputGain.gain.value = 0.0;
    this.wasmOutputGain.gain.value = 0.0;
    this.workletInputGain.gain.value = 0.0;
    this.workletOutputGain.gain.value = 0.0;

    this.ampPreampInput.connect(this.wasmInputGain);
    this.ampPreampInput.connect(this.workletInputGain);
    this.ampPreampInput.connect(this.waveshaperInputGain);

    // 4. Classic Waveshaper
    this.waveShaper = ctx.createWaveShaper();
    this.waveShaper.oversample = '4x';
    this.waveshaperInputGain.connect(this.waveShaper);
    this.waveShaper.connect(this.waveshaperOutputGain);

    // 5. Tone Stack Biquad Filters
    this.toneBass = ctx.createBiquadFilter();
    this.toneBass.type = 'lowshelf';
    this.toneBass.frequency.value = 120;

    this.toneMid = ctx.createBiquadFilter();
    this.toneMid.type = 'peaking';
    this.toneMid.frequency.value = 750;
    this.toneMid.Q.value = 1.0;

    this.toneTreble = ctx.createBiquadFilter();
    this.toneTreble.type = 'highshelf';
    this.toneTreble.frequency.value = 3200;

    this.tonePresence = ctx.createBiquadFilter();
    this.tonePresence.type = 'peaking';
    this.tonePresence.frequency.value = 5000;
    this.tonePresence.Q.value = 1.2;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.isAmpBypassed ? 0.0 : 1.0;

    // Connect all 3 engine output buses into the tone stack
    this.wasmOutputGain.connect(this.toneBass);
    this.workletOutputGain.connect(this.toneBass);
    this.waveshaperOutputGain.connect(this.toneBass);

    // Tone Stack Chain -> Master Volume
    this.toneBass.connect(this.toneMid);
    this.toneMid.connect(this.toneTreble);
    this.toneTreble.connect(this.tonePresence);
    this.tonePresence.connect(this.masterGain);

    // 6. Cabinet Stage Input & Dry Cabinet Bypass
    this.cabStageInput = ctx.createGain();
    this.cabStageInput.gain.value = 1.0;

    this.cabBypassGain = ctx.createGain();
    this.cabBypassGain.gain.value = this.isCabBypassed ? 1.0 : 0.0;

    // Feed Cabinet Stage Input from both Tone Stack Master and Dry Amp Bypass
    this.masterGain.connect(this.cabStageInput);
    this.ampBypassGain.connect(this.cabStageInput);

    // 7. Cabinet IR & Zero-Latency Analog Cabinet Stage
    this.cabConvolver = ctx.createConvolver();
    this.cabConvolver.normalize = false;

    this.cabLowCut = ctx.createBiquadFilter();
    this.cabLowCut.type = 'highpass';
    this.cabLowCut.frequency.value = 70;

    this.cabHighCut = ctx.createBiquadFilter();
    this.cabHighCut.type = 'lowpass';
    this.cabHighCut.frequency.value = 7500;

    // Convolver IR Branch
    const cabIrGain = ctx.createGain();
    cabIrGain.gain.value = this.isCabBypassed ? 0.0 : 1.0;
    this.cabIrGain = cabIrGain;

    const cabDirect = ctx.createGain();
    cabDirect.gain.value = 0.0; // Convolver IR handles acoustic cabinet simulation without comb filtering or level boost

    // Zero-Latency Analog Cabinet Emulation Branch (0.0 ms algorithmic delay)
    const cabAnalogGain = ctx.createGain();
    cabAnalogGain.gain.value = 0.0; // Inactive by default until switched
    this.cabAnalogGain = cabAnalogGain;

    const cabAnalogRes = ctx.createBiquadFilter();
    cabAnalogRes.type = 'peaking';
    cabAnalogRes.frequency.value = 110;
    cabAnalogRes.Q.value = 1.2;
    cabAnalogRes.gain.value = 4.5; // Speaker enclosure thud

    const cabAnalogScoop = ctx.createBiquadFilter();
    cabAnalogScoop.type = 'peaking';
    cabAnalogScoop.frequency.value = 850;
    cabAnalogScoop.Q.value = 0.9;
    cabAnalogScoop.gain.value = -3.2;

    const cabAnalogBreakup = ctx.createBiquadFilter();
    cabAnalogBreakup.type = 'peaking';
    cabAnalogBreakup.frequency.value = 2800;
    cabAnalogBreakup.Q.value = 1.6;
    cabAnalogBreakup.gain.value = 5.0; // Celestion V30 cone bite

    const cabAnalogRollOff = ctx.createBiquadFilter();
    cabAnalogRollOff.type = 'lowpass';
    cabAnalogRollOff.frequency.value = 5400; // Acoustic cone roll-off

    // Wire Convolver IR branch from cabStageInput
    this.cabStageInput.connect(cabIrGain);
    cabIrGain.connect(this.cabConvolver);
    cabIrGain.connect(cabDirect);

    this.cabConvolver.connect(this.cabLowCut);
    cabDirect.connect(this.cabLowCut);

    // Wire Zero-Latency Analog branch from cabStageInput
    this.cabStageInput.connect(cabAnalogGain);
    cabAnalogGain.connect(cabAnalogRes);
    cabAnalogRes.connect(cabAnalogScoop);
    cabAnalogScoop.connect(cabAnalogBreakup);
    cabAnalogBreakup.connect(cabAnalogRollOff);
    cabAnalogRollOff.connect(this.cabLowCut);

    // Wire Cabinet Bypass branch from cabStageInput directly to output
    this.cabStageInput.connect(this.cabBypassGain);
    this.cabBypassGain.connect(this.outputNode);

    // Filtered cabinet output connects to output
    this.cabLowCut.connect(this.cabHighCut);
    this.cabHighCut.connect(this.outputNode);

    // Initialize convolver buffer immediately with authentic zero-latency cabinet IR so audio never starts silent
    this.cabConvolver.buffer = generateSyntheticCabIr(ctx, 'celestion-v30', 30);
    this.currentIrUrl = null;
    this.isCurrentIrReal = false;

    // Load initial default acoustic WAV IR in background with sequence protection
    this.loadIrWavFile('/irs/celestion.wav');

    // 6. Asynchronous Background Setup for WASM NAM and HD AudioWorklet
    this.enginesReadyPromise = this.initAsyncEngines(ctx);

    return { input: this.inputNode, output: this.outputNode };
  }

  /**
   * Asynchronously loads WASM NAM and HD AudioWorklet processors
   */
  private async initAsyncEngines(ctx: AudioContext): Promise<void> {
    // 1. Initialize HD AudioWorklet Engine FIRST (instantaneous and resilient)
    try {
      const workletNode = await this.hdWorkletEngine.init(ctx);
      if (workletNode && this.workletInputGain && this.workletOutputGain) {
        this.workletInputGain.connect(workletNode);
        workletNode.connect(this.workletOutputGain);
        this.hdWorkletEngine.onError = () => {
          console.warn('[NamEngine] HD Worklet reported error, falling back to waveshaper');
          this.setEngineMode('waveshaper');
        };
      }
    } catch (err) {
      console.warn('HD AudioWorklet init fallback (will use classic WaveShaper):', err);
    }

    // 2. Initialize Tone3000 WASM NAM Engine
    try {
      this.tone3000Engine = await Tone3000NamEngine.attach(ctx, { assetBaseUrl: '/engine/' });
      this.namWasmNode = await this.tone3000Engine.createNode();

      // Auto-recovery if worklet throws an error
      (this.namWasmNode as any).onprocessorerror = (err: any) => {
        console.warn('[NamEngine] NAM WASM processor error, auto-recovering to HD Triode modeling:', err);
        this.isWasmReady = false;
        this.setEngineMode(this.hdWorkletEngine.isReady ? 'hd-triode' : 'waveshaper');
      };

      // Connect WASM node into routing
      if (this.wasmInputGain && this.wasmOutputGain) {
        this.wasmInputGain.connect(this.namWasmNode);
        this.namWasmNode.connect(this.wasmOutputGain);
      }
      this.isWasmReady = true;

      // Preload active model or default model
      const isCurrentNam = isNamModelProfile(this.lastModelConfig);
      if (this.lastModelConfig && isCurrentNam && this.lastModelConfig.modelUrl) {
        await this.loadNamModelFromUrl(this.lastModelConfig.modelUrl);
        this.setEngineMode('wasm-nam');
      } else {
        await this.loadNamModelFromUrl('/models/ac10.nam');
        const target = this.lastModelConfig
          ? (isNamModelProfile(this.lastModelConfig) ? 'wasm-nam' : (this.lastModelConfig.engineMode || 'hd-triode'))
          : this.currentEngineMode;
        this.setEngineMode(target);
      }
    } catch (err) {
      console.warn('WASM NAM engine attach fallback (will use HD Worklet / Waveshaper):', err);
      this.isWasmReady = false;
      const fallbackTarget = this.hdWorkletEngine.isReady ? 'hd-triode' : 'waveshaper';
      this.setEngineMode(fallbackTarget);
    }

    this.notifyStatus();
  }

  /**
   * Switches the active preamp modeling engine between:
   * - 'wasm-nam': Real TONE3000 Neural Amp Modeler WASM core
   * - 'hd-triode': High-Definition AudioWorklet Norman Koren tube physics & sag
   * - 'waveshaper': Standard Web Audio polynomial saturation
   *
   * FAILSOUND-PROOF: Never mutes or routes audio into an uninitialized or disconnected engine!
   */
  public setEngineMode(mode: 'wasm-nam' | 'hd-triode' | 'waveshaper'): void {
    if (!this.ctx || !this.wasmInputGain || !this.workletInputGain || !this.waveshaperInputGain ||
        !this.wasmOutputGain || !this.workletOutputGain || !this.waveshaperOutputGain) {
      this.currentEngineMode = mode;
      return;
    }

    this.currentEngineMode = mode;
    const now = this.ctx.currentTime;
    const fadeTime = 0.03; // 30ms smooth crossfade without clicks

    // If amp is currently bypassed, keep all engine gain nodes muted and let bypass path handle audio
    if (this.isAmpBypassed) {
      this.wasmInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      if (this.ampBypassGain) this.ampBypassGain.gain.setTargetAtTime(2.10, now, fadeTime);
      if (this.masterGain) this.masterGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.notifyStatus();
      return;
    }

    const canUseWasm = Boolean(this.isWasmReady && this.namWasmNode);
    const canUseWorklet = Boolean(this.hdWorkletEngine.isReady && this.hdWorkletEngine.workletNode);

    // Strict profile-engine constraint:
    // If amp is a real NAM profile, it MUST use wasm-nam (cannot select hd-triode or waveshaper).
    // If amp is NOT a real NAM profile, it CANNOT use wasm-nam (must use hd-triode or waveshaper).
    const isRealNam = isNamModelProfile(this.lastModelConfig);
    let target: 'wasm-nam' | 'hd-triode' | 'waveshaper' = mode;
    if (isRealNam) {
      target = 'wasm-nam';
    } else if (target === 'wasm-nam') {
      target = (this.lastModelConfig?.engineMode && this.lastModelConfig.engineMode !== 'wasm-nam')
        ? this.lastModelConfig.engineMode
        : 'hd-triode';
    }

    if (this.lastModelConfig) {
      if ((target === 'wasm-nam' && canUseWasm) || (target === 'hd-triode' && canUseWorklet) || target === 'waveshaper') {
        this.lastModelConfig.engineMode = target;
      }
    }

    if (target === 'wasm-nam' && !canUseWasm) {
      target = canUseWorklet ? 'hd-triode' : 'waveshaper';
    }
    if (target === 'hd-triode' && !canUseWorklet) {
      target = 'waveshaper';
    }

    if (target === 'wasm-nam') {
      this.applyNamSensitivityAndGains();
      this.workletInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
    } else if (target === 'hd-triode') {
      this.wasmInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletInputGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.waveshaperInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
    } else {
      // Robust standard WaveShaper fallback (always available and active)
      this.wasmInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperInputGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(1.0, now, fadeTime);
    }

    // Refresh model configuration for active engine to maintain headroom calibration
    if (this.lastModelConfig) {
      if (this.waveShaper) {
        this.waveShaper.curve = createNamSaturationCurve(
          this.lastModelConfig.gain,
          this.lastModelConfig.saturationCurve,
          this.lastModelConfig.bias
        ) as any;
      }
      const isCleanSolidState =
        this.lastModelConfig.saturationCurve <= 1.2 ||
        this.lastModelConfig.id === 'roland-jc120' ||
        this.lastModelConfig.id.includes('clean') ||
        this.lastModelConfig.id.includes('acoustic') ||
        this.lastModelConfig.id.includes('jc120');

      this.hdWorkletEngine.setParameters({
        gain: this.lastModelConfig.gain,
        bias: this.lastModelConfig.bias || 0.08,
        mode: isCleanSolidState ? 'clean-solid-state' : 'tube-amp',
        enabled: !this.isAmpBypassed
      });
    }

    this.notifyStatus();
  }

  /**
   * Switches cabinet mode between:
   * - 'ir-convolver': Partitioned FFT convolution with real/synthetic acoustic IR (high detail, ~2.7ms block)
   * - 'analog-zero-latency': Multi-pole minimum-phase IIR speaker simulation (0.0 ms algorithmic delay)
   */
  public setCabEngineMode(mode: 'ir-convolver' | 'analog-zero-latency'): void {
    this.cabEngineMode = mode;
    if (!this.ctx || !this.cabIrGain || !this.cabAnalogGain) return;

    const now = this.ctx.currentTime;
    const fadeTime = 0.02;

    if (mode === 'analog-zero-latency') {
      this.cabIrGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(1.0, now, fadeTime);
    } else {
      this.cabIrGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(0.0, now, fadeTime);
    }

    this.notifyStatus();
  }

  /**
   * Applies calibrated input trim and output makeup gain for real NAM WaveNet models.
   * Real NAM models have high intrinsic gain and sensitivity to low-level noise floor.
   * Applying calibrated input trim (-8.0 dB default) brings the input into the exact
   * nominal training zone (linear sweet spot), preventing ambient mic noise and USB hiss
   * from being amplified by neural network saturation, while output makeup restores
   * full perceived volume.
   */
  public applyNamSensitivityAndGains(): void {
    if (!this.ctx || !this.wasmInputGain || !this.wasmOutputGain) return;
    if (this.currentEngineMode !== 'wasm-nam') return;

    const now = this.ctx.currentTime;
    const fadeTime = 0.015;
    const isRealNam = isNamModelProfile(this.lastModelConfig);
    const inputTrimDb = this.lastModelConfig?.inputTrim !== undefined
      ? this.lastModelConfig.inputTrim
      : (isRealNam ? -8.0 : 0.0);
    const namInputGainVal = Math.pow(10, inputTrimDb / 20);

    let outputMakeupDb = Math.abs(Math.min(0, inputTrimDb)) * 0.92;
    if (isRealNam && this.lastModelInfo?.hasLoudness && typeof this.lastModelInfo.loudness === 'number') {
      // If model has trained loudness metadata (e.g. deluxe: -8.73 dB), calibrate relative to -16 dBFS
      const loudnessDiff = -16.0 - this.lastModelInfo.loudness;
      outputMakeupDb += Math.max(-6, Math.min(6, loudnessDiff));
    }
    const namOutputGainVal = Math.pow(10, outputMakeupDb / 20);

    this.wasmInputGain.gain.setTargetAtTime(namInputGainVal, now, fadeTime);
    this.wasmOutputGain.gain.setTargetAtTime(namOutputGainVal, now, fadeTime);
  }

  /**
   * Loads a real .nam model file from URL into the WASM inference engine.
   */
  public async loadNamModelFromUrl(url: string): Promise<boolean> {
    if (!this.namWasmNode) return false;
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching NAM model from ${url}`);
      }
      const jsonText = await resp.text();
      this.lastModelInfo = await this.namWasmNode.loadModel(jsonText);
      this.currentLoadedModelUrl = url;
      this.applyNamSensitivityAndGains();
      this.notifyStatus();
      return true;
    } catch (err) {
      console.warn(`Failed to load NAM model from ${url}:`, err);
      return false;
    }
  }

  /**
   * Loads a user-uploaded .nam file JSON string directly into the WASM engine.
   */
  public async loadNamModelFromJson(jsonString: string): Promise<boolean> {
    if (!this.namWasmNode) return false;
    try {
      this.lastModelInfo = await this.namWasmNode.loadModel(jsonString);
      this.currentLoadedModelUrl = null;
      this.applyNamSensitivityAndGains();
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to load NAM model JSON string:', err);
      return false;
    }
  }

  /**
   * Bypasses or engages the NAM amp modeler and tone stack.
   * When bypassed, the input signal cleanly skips the preamp and tone stack directly to the cabinet stage.
   */
  public setAmpBypass(bypassed: boolean): void {
    this.isAmpBypassed = bypassed;
    if (!this.ctx || !this.ampBypassGain || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const fadeTime = 0.015;

    if (bypassed) {
      this.ampBypassGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.masterGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmInputGain?.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletInputGain?.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperInputGain?.gain.setTargetAtTime(0.0, now, fadeTime);
    } else {
      this.ampBypassGain.gain.setTargetAtTime(0.0, now, fadeTime);
      const masterVal = this.calculateMasterGain(this.lastModelConfig);
      this.masterGain.gain.setTargetAtTime(masterVal, now, fadeTime);
      this.setEngineMode(this.currentEngineMode);
    }
    this.notifyStatus();
  }

  /**
   * Computes master volume with calibrated linear-to-perceptual scaling
   * without an artificial clamping floor, giving players full attenuation down to whisper quiet.
   */
  public calculateMasterGain(config?: NamModelConfig | null): number {
    if (!config || this.isAmpBypassed) return 0.0;
    const masterKnob = config.master !== undefined ? config.master : 7.5;
    if (masterKnob <= 0) return 0.0;

    const masterRatio = masterKnob / 7.5;
    return Math.pow(masterRatio, 1.35);
  }

  public toggleAmpBypass(): boolean {
    this.setAmpBypass(!this.isAmpBypassed);
    return this.isAmpBypassed;
  }

  /**
   * Bypasses or engages the IR Cabinet / Speaker emulator.
   * When bypassed, output signal is uncolored flat line-out.
   */
  public setCabBypass(bypassed: boolean): void {
    this.isCabBypassed = bypassed;
    if (!this.ctx || !this.cabBypassGain || !this.cabIrGain || !this.cabAnalogGain) return;
    const now = this.ctx.currentTime;
    const fadeTime = 0.015;

    if (bypassed) {
      this.cabBypassGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.cabIrGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(0.0, now, fadeTime);
    } else {
      this.cabBypassGain.gain.setTargetAtTime(0.0, now, fadeTime);
      if (this.cabEngineMode === 'analog-zero-latency') {
        this.cabAnalogGain.gain.setTargetAtTime(1.0, now, fadeTime);
        this.cabIrGain.gain.setTargetAtTime(0.0, now, fadeTime);
      } else {
        this.cabIrGain.gain.setTargetAtTime(1.0, now, fadeTime);
        this.cabAnalogGain.gain.setTargetAtTime(0.0, now, fadeTime);
      }
    }
    this.notifyStatus();
  }

  public toggleCabBypass(): boolean {
    this.setCabBypass(!this.isCabBypassed);
    return this.isCabBypassed;
  }

  /**
   * Updates NAM amp parameters and loads real neural model if specified.
   */
  public updateNamModel(config: NamModelConfig): void {
    this.lastModelConfig = config;
    if (!this.ctx || !this.ampPreampInput || !this.toneBass || !this.toneMid || !this.toneTreble || !this.tonePresence || !this.masterGain) {
      return;
    }

    // Explicit bypass state: defaults to false unless explicitly marked bypassed
    const shouldBypass = config.bypassed !== undefined
      ? Boolean(config.bypassed)
      : (config.enabled !== undefined ? !config.enabled : false);
    this.setAmpBypass(shouldBypass);

    // Strictly determine engine mode: real NAM profiles MUST use wasm-nam; non-NAM profiles CANNOT use wasm-nam
    const isRealNam = isNamModelProfile(config);
    config.isRealNam = isRealNam;

    let targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper';
    if (isRealNam) {
      targetEngine = 'wasm-nam';
    } else {
      targetEngine = (config.engineMode && config.engineMode !== 'wasm-nam')
        ? config.engineMode
        : 'hd-triode';
    }
    config.engineMode = targetEngine;
    this.setEngineMode(targetEngine);

    // If real model URL is specified and not yet loaded, load it
    if (config.modelUrl && config.modelUrl !== this.currentLoadedModelUrl && this.isWasmReady) {
      this.loadNamModelFromUrl(config.modelUrl);
    } else if (config.rawJson && this.isWasmReady) {
      const jsonStr = typeof config.rawJson === 'string' ? config.rawJson : JSON.stringify(config.rawJson);
      this.loadNamModelFromJson(jsonStr);
    }

    // Wide-Range Dynamic Preamp Drive (0 to 10):
    // Allows players to actually dial back the gain to whisper-clean / zero when desired,
    // eliminating the former +1.05 hard floor that caused excessive gain and noise!
    // gain = 0 -> 0.0 (muted)
    // gain = 2.5 -> 0.42 (-7.5 dB attenuation: crystal clean, low noise floor)
    // gain = 5.0 -> 1.00 (0.0 dB reference sweet spot)
    // gain = 7.5 -> 1.65 (+4.3 dB harmonic punch)
    // gain = 10.0 -> 2.35 (+7.4 dB rich tube compression)
    const gainKnob = Math.max(0, Math.min(10, config.gain));
    const preGain = gainKnob <= 0 ? 0 : Math.pow(gainKnob / 5.0, 1.25);
    this.ampPreampInput.gain.setTargetAtTime(preGain, this.ctx.currentTime, 0.015);

    // Apply calibrated NAM input trim and output makeup if wasm-nam active
    if (targetEngine === 'wasm-nam') {
      this.applyNamSensitivityAndGains();
    }

    // Update HD AudioWorklet tube parameters
    const isCleanSolidState =
      config.saturationCurve <= 1.2 ||
      config.id === 'roland-jc120' ||
      config.id.includes('clean') ||
      config.id.includes('acoustic') ||
      config.id.includes('jc120');
    this.hdWorkletEngine.setParameters({
      gain: config.gain,
      bias: config.bias || 0.08,
      mode: isCleanSolidState ? 'clean-solid-state' : 'tube-amp',
      enabled: !this.isAmpBypassed
    });

    // Update classic WaveShaper curve fallback
    if (this.waveShaper) {
      this.waveShaper.curve = createNamSaturationCurve(config.gain, config.saturationCurve, config.bias) as any;
    }

    // Musical Tone Stack mapping (smooth passive-style curve, avoids piercing +14dB high-frequency fizz)
    this.toneBass.gain.setTargetAtTime((config.bass - 5) * 1.5, this.ctx.currentTime, 0.02);
    this.toneMid.gain.setTargetAtTime((config.mid - 5) * 1.6, this.ctx.currentTime, 0.02);
    this.toneTreble.gain.setTargetAtTime((config.treble - 5) * 1.3, this.ctx.currentTime, 0.02);
    this.tonePresence.gain.setTargetAtTime((config.presence - 5) * 1.0, this.ctx.currentTime, 0.02);

    // Master Volume with Calibrated Loudness Equalization (muted if amp is bypassed)
    const masterVal = this.calculateMasterGain(config);
    this.masterGain.gain.setTargetAtTime(masterVal, this.ctx.currentTime, 0.015);

    this.notifyStatus();
  }

  /**
   * Fetches and decodes a real acoustic .wav Impulse Response file into the ConvolverNode.
   */
  public async loadIrWavFile(url: string): Promise<boolean> {
    if (!this.ctx || !this.cabConvolver) return false;
    const reqSeq = ++this.irLoadSequence;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching IR WAV from ${url}`);
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);

      // Sequence guard: discard if superseded by another preset or IR switch while downloading
      if (reqSeq !== this.irLoadSequence || this.lastCabConfig?.irUrl !== url) {
        return false;
      }

      // Calibrate acoustic transfer gain across guitar spectrum to nominal 0dB (unity gain)
      calibrateIrBuffer(decoded);
      this.cabConvolver.buffer = decoded;
      this.currentIrUrl = url;
      this.isCurrentIrReal = true;
      this.notifyStatus();
      return true;
    } catch (err) {
      if (reqSeq !== this.irLoadSequence) return false;
      console.warn(`Failed to fetch/decode IR WAV ${url}, using synthetic fallback:`, err);
      this.isCurrentIrReal = false;
      this.currentIrUrl = null;
      this.cabConvolver.buffer = generateSyntheticCabIr(this.ctx, this.lastCabConfig?.id || 'marshall-412-v30');
      return false;
    }
  }

  /**
   * Updates cabinet parameters (Low-cut, High-cut, and impulse response buffer)
   */
  public updateIrCabinet(config: IrCabinetConfig): void {
    this.lastCabConfig = config;
    if (!this.ctx || !this.cabConvolver || !this.cabLowCut || !this.cabHighCut) return;

    if (config.bypassed !== undefined) {
      this.setCabBypass(config.bypassed);
    } else if (config.enabled !== undefined) {
      this.setCabBypass(!config.enabled);
    }

    this.cabLowCut.frequency.setTargetAtTime(config.lowCut, this.ctx.currentTime, 0.02);
    this.cabHighCut.frequency.setTargetAtTime(config.highCut, this.ctx.currentTime, 0.02);

    if (config.isCustom && this.customCabBuffer) {
      this.irLoadSequence++;
      this.currentIrUrl = null;
      this.cabConvolver.buffer = this.customCabBuffer;
      this.isCurrentIrReal = true;
    } else if (config.irUrl) {
      if (config.irUrl !== this.currentIrUrl) {
        this.loadIrWavFile(config.irUrl);
      }
    } else {
      this.irLoadSequence++; // Invalidate and cancel any in-flight WAV loads immediately!
      this.currentIrUrl = null;
      this.cabConvolver.buffer = generateSyntheticCabIr(this.ctx, config.id, config.micDistance);
      this.isCurrentIrReal = false;
    }

    this.notifyStatus();
  }

  /**
   * Decodes and loads a user-uploaded custom .wav Impulse Response file.
   */
  public async loadCustomIrWav(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.ctx || !this.cabConvolver) return;
    this.irLoadSequence++;
    try {
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      calibrateIrBuffer(decoded);
      this.customCabBuffer = decoded;
      this.currentIrUrl = null;
      this.cabConvolver.buffer = decoded;
      this.isCurrentIrReal = true;
      this.notifyStatus();
    } catch (err) {
      console.error('Failed to decode custom IR WAV:', err);
    }
  }

  private notifyStatus(): void {
    if (!this.onStatusUpdate) return;
    const model = this.lastModelConfig;
    const cab = this.lastCabConfig;

    this.onStatusUpdate({
      activeEngine: this.currentEngineMode,
      modelName: model?.name || 'Vox AC10 Custom (Real NAM)',
      architecture: model?.type?.toUpperCase() || (this.lastModelInfo ? 'WAVENET' : 'TUBE PHYSICAL'),
      weightsCount: model?.weightsCount || (this.currentEngineMode === 'wasm-nam' ? 28440 : 18432),
      sampleRate: this.ctx?.sampleRate || 48000,
      isRealNam: this.currentEngineMode === 'wasm-nam' && isNamModelProfile(model),
      isWasmReady: this.isWasmReady,
      irName: cab?.name || 'Celestion Vintage 30 4x12',
      isRealIr: this.isCurrentIrReal,
      isAmpBypassed: this.isAmpBypassed,
      isCabBypassed: this.isCabBypassed
    });
  }

  public dispose(): void {
    this.hdWorkletEngine.dispose();
    if (this.namWasmNode) {
      try { this.namWasmNode.dispose(); } catch {}
      this.namWasmNode = null;
    }
  }
}
