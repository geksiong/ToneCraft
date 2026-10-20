/**
 * @file ampEngine.ts
 * @description Comprehensive Multi-Engine Guitar & Bass Amplifier & Cabinet IR System.
 *
 * Implements:
 * 1. Real Neural Amp Modeler (NAM) inference using TONE3000's `neural-amp-modeler-wasm`
 *    (Atkinson WaveNet/LSTM neural networks compiled to WebAssembly in an AudioWorklet).
 * 2. High-Definition AudioWorklet physical circuit simulation (Norman Koren triode differential
 *    equations with dynamic cathode sag and blocking distortion). NOT neural; no weights.
 * 3. Classic low-CPU polynomial waveshaper (analytic transfer functions). NOT neural; no weights.
 * 4. Real acoustic cabinet Impulse Response convolution using decoded WAV IR files
 *    (Celestion Vintage 30 4x12, EMT 140 Studio Plate, plus user custom WAV files).
 * 5. Passive 4-band tone stack (Bass, Mid, Treble, Presence) and Master Volume stage.
 */

import { NamEngine as Tone3000NamEngine, NamNode, NamModelInfo } from 'neural-amp-modeler-wasm/engine';
import { HdWorkletEngine } from './hdWorkletEngine';
import { AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import { createNamSaturationCurve } from './curves';
import { generateSyntheticCabIr, calibrateIrBuffer } from './irData';
import { isNamModelProfile, getDefaultTrimForModel } from './ampModels';
import { getAssetUrl } from '../utils/assetUrl';

export interface AmpEngineStatus {
  activeEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  modelName: string;
  architecture: string;
  weightsCount?: number; // Only for real NAM neural models! Physical and waveshaper models have no weights.
  sampleRate: number;
  isRealNam: boolean;
  isWasmReady: boolean;
  irName: string;
  isRealIr: boolean;
  isAmpBypassed: boolean;
  isCabBypassed: boolean;
}

export class AmpEngine {
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

  // 1. TONE3000 WASM NAM Engine (Only active for real NAM neural models)
  private tone3000Engine: Tone3000NamEngine | null = null;
  public namWasmNode: NamNode | null = null;
  public isWasmReady: boolean = false;
  private currentLoadedModelUrl: string | null = null;

  // 2. HD AudioWorklet Triode Engine (Physical circuit modeling, non-neural)
  public hdWorkletEngine: HdWorkletEngine = new HdWorkletEngine();

  // 3. Classic Waveshaper Preamp (Analytic transfer curves, non-neural)
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
  private cabLowCut2: BiquadFilterNode | null = null;
  private cabHighCut: BiquadFilterNode | null = null;
  private cabHighCut2: BiquadFilterNode | null = null;
  private cabProximity: BiquadFilterNode | null = null;
  private cabAir: BiquadFilterNode | null = null;
  private customCabBuffer: AudioBuffer | null = null;
  private currentIrUrl: string | null = null;
  private currentCabId: string | null = null;
  private isCurrentIrReal: boolean = false;
  private irLoadSequence: number = 0;

  // Telemetry & Status Callbacks
  public onStatusUpdate: ((status: AmpEngineStatus) => void) | null = null;
  private lastModelInfo: NamModelInfo | null = null;
  private lastModelConfig: AmpModelConfig | null = null;
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

    // 7. Cabinet IR & Multi-Stage Acoustic Modeling Stage
    this.cabConvolver = ctx.createConvolver();
    this.cabConvolver.normalize = false;

    // 24 dB/octave studio highpass filter (Low Cut)
    this.cabLowCut = ctx.createBiquadFilter();
    this.cabLowCut.type = 'highpass';
    this.cabLowCut.frequency.value = 70;
    this.cabLowCut.Q.value = 0.707;

    this.cabLowCut2 = ctx.createBiquadFilter();
    this.cabLowCut2.type = 'highpass';
    this.cabLowCut2.frequency.value = 70;
    this.cabLowCut2.Q.value = 0.707;

    // 24 dB/octave studio lowpass filter (High Cut)
    this.cabHighCut = ctx.createBiquadFilter();
    this.cabHighCut.type = 'lowpass';
    this.cabHighCut.frequency.value = 7500;
    this.cabHighCut.Q.value = 0.707;

    this.cabHighCut2 = ctx.createBiquadFilter();
    this.cabHighCut2.type = 'lowpass';
    this.cabHighCut2.frequency.value = 7500;
    this.cabHighCut2.Q.value = 0.707;

    // Proximity effect filter: dynamically scales bass thud & punch based on Mic Dist knob
    this.cabProximity = ctx.createBiquadFilter();
    this.cabProximity.type = 'peaking';
    this.cabProximity.frequency.value = 120;
    this.cabProximity.Q.value = 1.1;
    this.cabProximity.gain.value = 2.0;

    // Distance air absorption & presence filter: dynamically scales upper sparkle based on Mic Dist knob
    this.cabAir = ctx.createBiquadFilter();
    this.cabAir.type = 'highshelf';
    this.cabAir.frequency.value = 4800;
    this.cabAir.gain.value = 0.5;

    // Convolver IR Branch
    const cabIrGain = ctx.createGain();
    cabIrGain.gain.value = this.isCabBypassed ? 0.0 : 1.0;
    this.cabIrGain = cabIrGain;

    const cabDirect = ctx.createGain();
    cabDirect.gain.value = 0.0;

    // Zero-Latency Analog Cabinet Emulation Branch (0.0 ms algorithmic delay)
    const cabAnalogGain = ctx.createGain();
    cabAnalogGain.gain.value = 0.0;
    this.cabAnalogGain = cabAnalogGain;

    const cabAnalogRes = ctx.createBiquadFilter();
    cabAnalogRes.type = 'peaking';
    cabAnalogRes.frequency.value = 110;
    cabAnalogRes.Q.value = 1.2;
    cabAnalogRes.gain.value = 4.5;

    const cabAnalogScoop = ctx.createBiquadFilter();
    cabAnalogScoop.type = 'peaking';
    cabAnalogScoop.frequency.value = 850;
    cabAnalogScoop.Q.value = 0.9;
    cabAnalogScoop.gain.value = -3.2;

    const cabAnalogBreakup = ctx.createBiquadFilter();
    cabAnalogBreakup.type = 'peaking';
    cabAnalogBreakup.frequency.value = 2800;
    cabAnalogBreakup.Q.value = 1.6;
    cabAnalogBreakup.gain.value = 5.0;

    const cabAnalogRollOff = ctx.createBiquadFilter();
    cabAnalogRollOff.type = 'lowpass';
    cabAnalogRollOff.frequency.value = 5400;

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

    // Cascaded cabinet filter chain: LowCut (24dB) -> HighCut (24dB) -> Proximity -> Air -> Output
    this.cabLowCut.connect(this.cabLowCut2);
    this.cabLowCut2.connect(this.cabHighCut);
    this.cabHighCut.connect(this.cabHighCut2);
    this.cabHighCut2.connect(this.cabProximity);
    this.cabProximity.connect(this.cabAir);
    this.cabAir.connect(this.outputNode);

    // Initialize convolver buffer immediately: use customCabBuffer if present, or synthetic/real celestion
    if (this.customCabBuffer) {
      this.cabConvolver.buffer = this.customCabBuffer;
      this.isCurrentIrReal = true;
    } else {
      this.cabConvolver.buffer = generateSyntheticCabIr(ctx, 'celestion-v30', 30);
      this.currentIrUrl = null;
      this.isCurrentIrReal = false;
      this.loadIrWavFile('/irs/celestion.wav');
    }

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
          console.warn('[AmpEngine] HD Worklet reported error, falling back to waveshaper');
          this.setEngineMode('waveshaper');
        };
      }
    } catch (err) {
      console.warn('HD AudioWorklet init fallback (will use classic WaveShaper):', err);
    }

    // 2. Initialize Tone3000 WASM NAM Engine (only for real NAM neural networks)
    try {
      this.tone3000Engine = await Tone3000NamEngine.attach(ctx, { assetBaseUrl: '/engine/' });
      this.namWasmNode = await this.tone3000Engine.createNode();

      // Auto-recovery if worklet throws an error
      (this.namWasmNode as any).onprocessorerror = (err: any) => {
        console.warn('[AmpEngine] NAM WASM processor error, auto-recovering to HD Triode modeling:', err);
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
   * - 'wasm-nam': Real TONE3000 Neural Amp Modeler WASM core (for real NAM models only)
   * - 'hd-triode': High-Definition AudioWorklet Norman Koren tube physics & sag (non-neural physical modeling)
   * - 'waveshaper': Standard Web Audio polynomial saturation (non-neural analytic waveshaper)
   */
  public setEngineMode(mode: 'wasm-nam' | 'hd-triode' | 'waveshaper'): void {
    if (!this.ctx || !this.wasmInputGain || !this.workletInputGain || !this.waveshaperInputGain ||
        !this.wasmOutputGain || !this.workletOutputGain || !this.waveshaperOutputGain) {
      this.currentEngineMode = mode;
      return;
    }

    this.currentEngineMode = mode;
    const now = this.ctx.currentTime;
    const fadeTime = 0.03;

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

    // Real NAM profiles MUST use wasm-nam (cannot select hd-triode or waveshaper)
    // Non-NAM profiles (hd-triode, waveshaper) CANNOT use wasm-nam
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
      this.applyLoudnessAndEngineGains();
      this.workletInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
    } else if (target === 'hd-triode') {
      this.wasmInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.applyLoudnessAndEngineGains();
      this.waveshaperInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
    } else {
      this.wasmInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletInputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.applyLoudnessAndEngineGains();
    }

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
        enabled: !this.isAmpBypassed,
        saturationCurve: this.lastModelConfig.saturationCurve
      });
    }

    this.notifyStatus();
  }

  /**
   * Switches cabinet mode between:
   * - 'ir-convolver': Partitioned FFT convolution with real/synthetic acoustic IR (high detail)
   * - 'analog-zero-latency': Multi-pole minimum-phase IIR speaker simulation (0.0 ms algorithmic delay)
   */
  public setCabEngineMode(mode: 'ir-convolver' | 'analog-zero-latency'): void {
    this.cabEngineMode = mode;
    if (!this.ctx || !this.cabIrGain || !this.cabAnalogGain) return;

    const now = this.ctx.currentTime;
    const fadeTime = 0.02;

    if (this.isCabBypassed) {
      this.cabIrGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabBypassGain?.gain.setTargetAtTime(1.0, now, fadeTime);
    } else if (mode === 'analog-zero-latency') {
      this.cabIrGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.cabBypassGain?.gain.setTargetAtTime(0.0, now, fadeTime);
    } else {
      this.cabIrGain.gain.setTargetAtTime(1.0, now, fadeTime);
      this.cabAnalogGain.gain.setTargetAtTime(0.0, now, fadeTime);
      this.cabBypassGain?.gain.setTargetAtTime(0.0, now, fadeTime);
    }

    this.notifyStatus();
  }

  /**
   * Applies calibrated input trim and perceptual loudness balance across ALL engines.
   */
  public applyLoudnessAndEngineGains(): void {
    if (!this.ctx || !this.wasmInputGain || !this.wasmOutputGain ||
        !this.workletInputGain || !this.workletOutputGain ||
        !this.waveshaperInputGain || !this.waveshaperOutputGain) {
      return;
    }

    const now = this.ctx.currentTime;
    const fadeTime = 0.015;
    const isRealNam = isNamModelProfile(this.lastModelConfig);
    const defaultTrim = getDefaultTrimForModel(this.lastModelConfig);
    const inputTrimDb = this.lastModelConfig?.inputTrim !== undefined
      ? this.lastModelConfig.inputTrim
      : defaultTrim;
    const inputGainVal = Math.pow(10, inputTrimDb / 20);

    if (this.currentEngineMode === 'wasm-nam') {
      const currentGain = this.lastModelConfig?.gain !== undefined ? this.lastModelConfig.gain : 5.0;
      const wasmDriveOffsetDb = (currentGain - 5.0) * (this.lastModelConfig?.id === 'deluxe' ? 1.5 : 1.8);
      const effectiveWasmTrimDb = inputTrimDb + wasmDriveOffsetDb;
      const wasmInputGainVal = Math.pow(10, effectiveWasmTrimDb / 20);

      let outputMakeupDb = Math.abs(Math.min(0, inputTrimDb)) * 0.90;
      if (inputTrimDb > 0) {
        outputMakeupDb += inputTrimDb * 0.25;
      }
      outputMakeupDb -= wasmDriveOffsetDb * 0.40;

      if (isRealNam && this.lastModelInfo?.hasLoudness && typeof this.lastModelInfo.loudness === 'number') {
        const loudnessDiff = -16.0 - this.lastModelInfo.loudness;
        outputMakeupDb += Math.max(-6, Math.min(6, loudnessDiff));
      }
      if (this.lastModelConfig?.id === 'deluxe' || (this.lastModelConfig?.saturationCurve && this.lastModelConfig.saturationCurve <= 2.2)) {
        outputMakeupDb += 2.2;
      }
      const wasmOutputGainVal = Math.pow(10, outputMakeupDb / 20);

      this.wasmInputGain.gain.setTargetAtTime(wasmInputGainVal, now, fadeTime);
      this.wasmOutputGain.gain.setTargetAtTime(wasmOutputGainVal, now, fadeTime);
    } else if (this.currentEngineMode === 'hd-triode') {
      const isClean =
        (this.lastModelConfig?.saturationCurve !== undefined && this.lastModelConfig.saturationCurve <= 2.0) ||
        (this.lastModelConfig?.gain !== undefined && this.lastModelConfig.gain <= 3.8);
      let workletOutputDb = isClean ? 2.5 : 0.0;
      if (inputTrimDb < 0) {
        workletOutputDb += Math.abs(inputTrimDb) * 0.40;
      }
      const workletOutputGainVal = Math.pow(10, workletOutputDb / 20);

      this.workletInputGain.gain.setTargetAtTime(inputGainVal, now, fadeTime);
      this.workletOutputGain.gain.setTargetAtTime(workletOutputGainVal, now, fadeTime);
    } else {
      const isClean =
        (this.lastModelConfig?.saturationCurve !== undefined && this.lastModelConfig.saturationCurve <= 1.5) ||
        (this.lastModelConfig?.gain !== undefined && this.lastModelConfig.gain <= 3.2);
      let waveshaperOutputDb = isClean ? 3.0 : 0.0;
      if (inputTrimDb < 0) {
        waveshaperOutputDb += Math.abs(inputTrimDb) * 0.40;
      }
      const waveshaperOutputGainVal = Math.pow(10, waveshaperOutputDb / 20);

      this.waveshaperInputGain.gain.setTargetAtTime(inputGainVal, now, fadeTime);
      this.waveshaperOutputGain.gain.setTargetAtTime(waveshaperOutputGainVal, now, fadeTime);
    }
  }

  // Alias for backward compatibility
  public applyNamSensitivityAndGains(): void {
    this.applyLoudnessAndEngineGains();
  }

  /**
   * Loads a real .nam model file from URL into the WASM inference engine.
   */
  public async loadNamModelFromUrl(url: string): Promise<boolean> {
    if (!this.namWasmNode) return false;
    try {
      const targetUrl = getAssetUrl(url);
      const resp = await fetch(targetUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching NAM model from ${targetUrl}`);
      }
      const jsonText = await resp.text();
      this.lastModelInfo = await this.namWasmNode.loadModel(jsonText);
      this.currentLoadedModelUrl = url;
      this.applyLoudnessAndEngineGains();
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
      this.applyLoudnessAndEngineGains();
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to load NAM model JSON string:', err);
      return false;
    }
  }

  /**
   * Bypasses or engages the amp modeler and tone stack.
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
   * Computes master volume with calibrated linear-to-perceptual scaling.
   */
  public calculateMasterGain(config?: AmpModelConfig | null): number {
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
   * Updates amplifier parameters and loads model if specified.
   */
  public updateAmpModel(config: AmpModelConfig): void {
    this.lastModelConfig = config;
    if (!this.ctx || !this.ampPreampInput || !this.toneBass || !this.toneMid || !this.toneTreble || !this.tonePresence || !this.masterGain) {
      return;
    }

    const shouldBypass = config.bypassed !== undefined
      ? Boolean(config.bypassed)
      : (config.enabled !== undefined ? !config.enabled : false);
    this.setAmpBypass(shouldBypass);

    // Real NAM profiles MUST use wasm-nam; non-NAM profiles CANNOT use wasm-nam
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

    if (config.modelUrl && config.modelUrl !== this.currentLoadedModelUrl && this.isWasmReady) {
      this.loadNamModelFromUrl(config.modelUrl);
    } else if (config.rawJson && this.isWasmReady) {
      const jsonStr = typeof config.rawJson === 'string' ? config.rawJson : JSON.stringify(config.rawJson);
      this.loadNamModelFromJson(jsonStr);
    }

    const gainKnob = Math.max(0, Math.min(10, config.gain));
    const S = config.saturationCurve || 2.5;
    let preGain: number;
    if (gainKnob <= 0) {
      preGain = 0;
    } else if (S <= 1.3) {
      preGain = 0.5 + (gainKnob / 10) * 0.7;
    } else if (S >= 3.0) {
      if (gainKnob <= 1.2) {
        preGain = 0.55 + (gainKnob / 1.2) * 0.22;
      } else {
        preGain = 0.77 + Math.pow((gainKnob - 1.2) / 2.3, 1.2) * 1.55;
      }
    } else {
      if (gainKnob <= 5.0) {
        preGain = 0.55 + (gainKnob / 5.0) * 0.33;
      } else {
        preGain = 0.88 + Math.pow((gainKnob - 5.0) / 5.0, 1.35) * 1.75;
      }
    }
    this.ampPreampInput.gain.setTargetAtTime(preGain, this.ctx.currentTime, 0.015);

    this.applyLoudnessAndEngineGains();

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
      enabled: !this.isAmpBypassed,
      saturationCurve: config.saturationCurve
    });

    if (this.waveShaper) {
      this.waveShaper.curve = createNamSaturationCurve(config.gain, config.saturationCurve, config.bias) as any;
    }

    this.toneBass.gain.setTargetAtTime((config.bass - 5) * 1.5, this.ctx.currentTime, 0.02);
    this.toneMid.gain.setTargetAtTime((config.mid - 5) * 1.6, this.ctx.currentTime, 0.02);
    this.toneTreble.gain.setTargetAtTime((config.treble - 5) * 1.3, this.ctx.currentTime, 0.02);
    this.tonePresence.gain.setTargetAtTime((config.presence - 5) * 1.0, this.ctx.currentTime, 0.02);

    const masterVal = this.calculateMasterGain(config);
    this.masterGain.gain.setTargetAtTime(masterVal, this.ctx.currentTime, 0.015);

    this.notifyStatus();
  }

  /**
   * Safely swaps or updates the ConvolverNode impulse response buffer.
   */
  public setConvolverBuffer(buffer: AudioBuffer): void {
    if (!this.ctx || !this.cabIrGain || !this.cabLowCut) return;
    try {
      if (this.cabConvolver) {
        try {
          this.cabIrGain.disconnect(this.cabConvolver);
          this.cabConvolver.disconnect();
        } catch {}
      }
      this.cabConvolver = this.ctx.createConvolver();
      this.cabConvolver.normalize = false;
      this.cabConvolver.buffer = buffer;
      this.cabIrGain.connect(this.cabConvolver);
      this.cabConvolver.connect(this.cabLowCut);
    } catch (err) {
      console.warn('[AmpEngine] Error updating convolver buffer:', err);
    }
  }

  /**
   * Fetches and decodes a real acoustic .wav Impulse Response file into the ConvolverNode.
   */
  public async loadIrWavFile(url: string): Promise<boolean> {
    if (!this.ctx) return false;
    const reqSeq = ++this.irLoadSequence;
    try {
      const targetUrl = getAssetUrl(url);
      const resp = await fetch(targetUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching IR WAV from ${targetUrl}`);
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);

      if (reqSeq !== this.irLoadSequence || this.lastCabConfig?.irUrl !== url) {
        return false;
      }

      calibrateIrBuffer(decoded);
      this.setConvolverBuffer(decoded);
      this.currentIrUrl = url;
      this.isCurrentIrReal = true;
      this.setCabEngineMode('ir-convolver');
      this.notifyStatus();
      return true;
    } catch (err) {
      if (reqSeq !== this.irLoadSequence) return false;
      console.warn(`Failed to fetch/decode IR WAV ${url}, using synthetic fallback:`, err);
      this.isCurrentIrReal = false;
      this.currentIrUrl = null;
      this.setConvolverBuffer(generateSyntheticCabIr(this.ctx, this.lastCabConfig?.id || 'marshall-412-v30'));
      this.setCabEngineMode('ir-convolver');
      return false;
    }
  }

  /**
   * Updates cabinet parameters (Low-cut, High-cut, mic distance, and impulse response buffer)
   */
  public updateIrCabinet(config: IrCabinetConfig): void {
    this.lastCabConfig = config;
    if (!this.ctx || !this.cabLowCut || !this.cabHighCut) return;

    if (config.bypassed !== undefined) {
      this.setCabBypass(config.bypassed);
    } else if (config.enabled !== undefined) {
      this.setCabBypass(!config.enabled);
    }

    const now = this.ctx.currentTime;
    const fadeTime = 0.015;

    const lowCutFreq = Math.max(20, Math.min(160, config.lowCut || 70));
    this.cabLowCut.frequency.setTargetAtTime(lowCutFreq, now, fadeTime);
    if (this.cabLowCut2) {
      this.cabLowCut2.frequency.setTargetAtTime(lowCutFreq, now, fadeTime);
    }

    const highCutFreq = Math.max(4000, Math.min(12000, config.highCut || 7500));
    this.cabHighCut.frequency.setTargetAtTime(highCutFreq, now, fadeTime);
    if (this.cabHighCut2) {
      this.cabHighCut2.frequency.setTargetAtTime(highCutFreq, now, fadeTime);
    }

    const dist = Math.max(0, Math.min(100, config.micDistance !== undefined ? config.micDistance : 30));
    const distRatio = dist / 100;
    const proxGain = 4.5 - distRatio * 7.0;
    const airGain = 2.5 - distRatio * 6.5;

    if (this.cabProximity) {
      this.cabProximity.gain.setTargetAtTime(proxGain, now, fadeTime);
    }
    if (this.cabAir) {
      this.cabAir.gain.setTargetAtTime(airGain, now, fadeTime);
    }

    const isModelSwitch = config.id !== this.currentCabId;
    if (isModelSwitch) {
      this.currentCabId = config.id;
      if (config.isCustom && this.customCabBuffer) {
        this.irLoadSequence++;
        this.currentIrUrl = null;
        this.setConvolverBuffer(this.customCabBuffer);
        this.isCurrentIrReal = true;
        if (this.cabEngineMode !== 'ir-convolver') {
          this.setCabEngineMode('ir-convolver');
        }
      } else if (config.irUrl) {
        if (this.cabEngineMode !== 'ir-convolver') {
          this.setCabEngineMode('ir-convolver');
        }
        if (config.irUrl !== this.currentIrUrl) {
          this.loadIrWavFile(config.irUrl);
        }
      } else {
        this.irLoadSequence++;
        this.currentIrUrl = null;
        this.setConvolverBuffer(generateSyntheticCabIr(this.ctx, config.id, 30));
        this.isCurrentIrReal = false;
        if (this.cabEngineMode !== 'ir-convolver') {
          this.setCabEngineMode('ir-convolver');
        }
      }
    }

    this.notifyStatus();
  }

  /**
   * Decodes and loads a user-uploaded custom .wav Impulse Response file.
   */
  public async loadCustomIrWav(arrayBuffer: ArrayBuffer): Promise<boolean> {
    if (!this.ctx) return false;
    this.irLoadSequence++;
    const reqSeq = this.irLoadSequence;
    try {
      const bufferCopy = arrayBuffer.slice(0);
      const decoded = await this.ctx.decodeAudioData(bufferCopy);
      if (reqSeq !== this.irLoadSequence) return false;

      calibrateIrBuffer(decoded);
      this.customCabBuffer = decoded;
      this.currentCabId = null;
      this.currentIrUrl = null;
      this.isCurrentIrReal = true;

      this.setCabEngineMode('ir-convolver');
      this.setConvolverBuffer(decoded);

      if (this.isCabBypassed) {
        this.setCabBypass(false);
      } else {
        const now = this.ctx.currentTime;
        this.cabIrGain?.gain.setTargetAtTime(1.0, now, 0.015);
        this.cabAnalogGain?.gain.setTargetAtTime(0.0, now, 0.015);
        this.cabBypassGain?.gain.setTargetAtTime(0.0, now, 0.015);
      }

      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to decode custom IR WAV:', err);
      return false;
    }
  }

  private notifyStatus(): void {
    if (!this.onStatusUpdate) return;
    const model = this.lastModelConfig;
    const cab = this.lastCabConfig;
    const isNam = this.currentEngineMode === 'wasm-nam' && isNamModelProfile(model);

    // Only real NAM models have neural network architectures (e.g. WAVENET/LSTM) and weights
    let architecture: string;
    if (isNam) {
      architecture = (model?.type || (this.lastModelInfo ? 'WAVENET' : 'WAVENET')).toUpperCase();
    } else if (this.currentEngineMode === 'hd-triode') {
      architecture = 'HD TRIODE TUBE DSP';
    } else {
      architecture = 'POLYNOMIAL WAVESHAPER';
    }

    this.onStatusUpdate({
      activeEngine: this.currentEngineMode,
      modelName: model?.name || 'Vox AC10 Custom (Real NAM)',
      architecture,
      // Non-neural physical and waveshaper models do NOT have weights!
      weightsCount: isNam ? (model?.weightsCount || (this.lastModelInfo ? 28440 : 28440)) : undefined,
      sampleRate: this.ctx?.sampleRate || 48000,
      isRealNam: isNam,
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
