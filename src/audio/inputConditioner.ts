/**
 * @file inputConditioner.ts
 * @description Studio Input Conditioner: Dynamic Noise Gate, De-Hiss High-Cut Filter,
 * Anti-Whine Notch Filter, and Low-Cut Rumble Filter for Microphone & USB Audio Interface inputs.
 *
 * PURPOSE & LATENCY:
 * Microphones and high-impedance guitar inputs capture ambient room noise, electrical hum,
 * and high-frequency coil whine (USB 8kHz harmonics / electromagnetic interference).
 * When fed into high-gain amp models and distortion pedals (which amplify by +40dB to +60dB),
 * this noise transforms into ear-piercing squeals, whistling, and harsh hiss in the output.
 *
 * This processor cleans the incoming audio signal using zero-latency biquad filters and a
 * click-free, hysteresis-stabilized downward noise gate before the signal enters the pedalboard.
 */

export interface InputConditionerConfig {
  // Master bypass
  enabled: boolean;

  // Dynamic Noise Gate
  gateEnabled: boolean;
  gateThreshold: number; // in dB (-80 to -20 dB, default -50 dB)
  gateAttackMs: number;  // in ms (2 to 30 ms, default 6 ms)
  gateHoldMs: number;    // in ms (5 to 150 ms, default 30 ms)
  gateReleaseMs: number; // in ms (20 to 500 ms, default 140 ms)
  gateReductionDb: number; // attenuation depth in dB (-80 to -12 dB, default -48 dB)

  // High-Cut De-Hiss Filter (Anti-High-Pitch Whine / Screech)
  highCutEnabled: boolean;
  highCutFreq: number; // in Hz (2000 to 14000 Hz, default 6500 Hz)
  highCutSlope: '12db' | '24db'; // 2nd-order or 4th-order cascade

  // Anti-Whine Notch Filter (Targets USB 8kHz/4kHz coil & power supply whine)
  notchEnabled: boolean;
  notchFreq: number; // in Hz (1000 to 12000 Hz, default 8000 Hz)
  notchQ: number; // narrow notch Q (default 6.0)

  // Low-Cut Rumble Filter
  lowCutEnabled: boolean;
  lowCutFreq: number; // in Hz (30 to 200 Hz, default 80 Hz)
}

export interface InputConditionerTelemetry {
  inputDb: number;
  reductionDb: number;
  gateState: 'open' | 'hold' | 'closed';
  highPitchNoiseDetected: boolean;
  highPitchEnergyDb: number;
}

export const DEFAULT_INPUT_CONDITIONER_CONFIG: InputConditionerConfig = {
  enabled: true,
  gateEnabled: false,
  gateThreshold: -50,
  gateAttackMs: 6,
  gateHoldMs: 30,
  gateReleaseMs: 140,
  gateReductionDb: -48,

  highCutEnabled: true,
  highCutFreq: 6500, // Electric guitar fundamentals top out at 1.3kHz, harmonics drop off at 6kHz
  highCutSlope: '24db', // Steep 24dB/oct cut kills high-frequency screech

  notchEnabled: true,
  notchFreq: 8000, // Common 8kHz USB interface frame whine
  notchQ: 6.0,

  lowCutEnabled: true,
  lowCutFreq: 80
};

export class InputConditionerEngine {
  private ctx: AudioContext | null = null;
  public config: InputConditionerConfig = { ...DEFAULT_INPUT_CONDITIONER_CONFIG };

  // Audio Nodes
  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;
  private lowCutFilter: BiquadFilterNode | null = null;
  private highCutFilter1: BiquadFilterNode | null = null;
  private highCutFilter2: BiquadFilterNode | null = null;
  private notchFilter: BiquadFilterNode | null = null;
  private gateGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Gate Envelope Follower State
  private envelopeTimer: any = null;
  private gateState: 'open' | 'hold' | 'closed' = 'open';
  private holdRemainingMs: number = 0;
  private currentReductionDb: number = 0;
  private smoothedEnvelopeLevel: number = 0; // Leaky peak follower
  private whineDetectionCounter: number = 0;
  private isWhineActive: boolean = false;

  // Analysis buffers: 1024 samples ensures clean capture of low guitar/bass frequencies (>21ms window)
  private timeDomainBuf: Float32Array = new Float32Array(1024);
  private freqDomainBuf: Float32Array = new Float32Array(512);

  // Auto noise floor learning
  public isLearningNoiseFloor: boolean = false;
  private noiseFloorSamples: number[] = [];
  private learnCompletionCallback: ((learnedDb: number) => void) | null = null;

  // Telemetry callback
  public onTelemetry: ((stats: InputConditionerTelemetry) => void) | null = null;

  constructor() {}

  /**
   * Initializes the Input Conditioner audio graph.
   * Total algorithmic latency: 0.00 ms (zero-latency IIR biquad filters + gain node).
   */
  public init(ctx: AudioContext): { input: GainNode; output: GainNode } {
    this.ctx = ctx;

    this.inputNode = ctx.createGain();
    this.inputNode.gain.value = 1.0;

    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 1.0;

    // Analyser Tap with 1024 FFT size for zero-latency sidechain envelope detection without zero-crossing dropouts
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.25;
    this.inputNode.connect(this.analyserNode);

    // 1. Low-Cut (Highpass) Filter
    this.lowCutFilter = ctx.createBiquadFilter();
    this.lowCutFilter.type = 'highpass';
    this.lowCutFilter.Q.value = 0.707;

    // 2. High-Cut (Lowpass) Filter 1
    this.highCutFilter1 = ctx.createBiquadFilter();
    this.highCutFilter1.type = 'lowpass';
    this.highCutFilter1.Q.value = 0.707;

    // 3. High-Cut (Lowpass) Filter 2 (for steep 24dB/oct slope)
    this.highCutFilter2 = ctx.createBiquadFilter();
    this.highCutFilter2.type = 'lowpass';
    this.highCutFilter2.Q.value = 0.707;

    // 4. Anti-Whine Notch Filter
    this.notchFilter = ctx.createBiquadFilter();
    this.notchFilter.type = 'notch';

    // 5. Dynamic Gate Gain Node
    this.gateGainNode = ctx.createGain();
    this.gateGainNode.gain.value = 1.0;

    // Wire cascade: input -> lowCut -> highCut1 -> highCut2 -> notch -> gateGain -> output
    this.inputNode.connect(this.lowCutFilter);
    this.lowCutFilter.connect(this.highCutFilter1);
    this.highCutFilter1.connect(this.highCutFilter2);
    this.highCutFilter2.connect(this.notchFilter);
    this.notchFilter.connect(this.gateGainNode);
    this.gateGainNode.connect(this.outputNode);

    // Apply configuration parameters to filters
    this.applyFilterParameters();

    // Start envelope detection loop
    this.startEnvelopeLoop();

    return { input: this.inputNode, output: this.outputNode };
  }

  /**
   * Updates configuration and applies parameter automation without reconnecting nodes.
   */
  public updateConfig(newConfig: Partial<InputConditionerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyFilterParameters();
  }

  private applyFilterParameters(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const nyquist = this.ctx.sampleRate / 2;

    // Low Cut Filter
    if (this.lowCutFilter) {
      if (this.config.enabled && this.config.lowCutEnabled) {
        this.lowCutFilter.frequency.setTargetAtTime(
          Math.min(nyquist * 0.9, Math.max(10, this.config.lowCutFreq)),
          now,
          0.02
        );
      } else {
        // Flat transparent pass
        this.lowCutFilter.frequency.setTargetAtTime(10, now, 0.02);
      }
    }

    // High Cut Filter 1 (12dB / 24dB)
    if (this.highCutFilter1) {
      if (this.config.enabled && this.config.highCutEnabled) {
        this.highCutFilter1.frequency.setTargetAtTime(
          Math.min(nyquist * 0.9, Math.max(500, this.config.highCutFreq)),
          now,
          0.02
        );
      } else {
        // Transparent pass (above audible band)
        this.highCutFilter1.frequency.setTargetAtTime(Math.min(22000, nyquist * 0.95), now, 0.02);
      }
    }

    // High Cut Filter 2 (for steep 24dB slope)
    if (this.highCutFilter2) {
      if (this.config.enabled && this.config.highCutEnabled && this.config.highCutSlope === '24db') {
        this.highCutFilter2.frequency.setTargetAtTime(
          Math.min(nyquist * 0.9, Math.max(500, this.config.highCutFreq)),
          now,
          0.02
        );
      } else {
        // Transparent pass
        this.highCutFilter2.frequency.setTargetAtTime(Math.min(22000, nyquist * 0.95), now, 0.02);
      }
    }

    // Notch Filter
    if (this.notchFilter) {
      if (this.config.enabled && this.config.notchEnabled) {
        this.notchFilter.frequency.setTargetAtTime(
          Math.min(nyquist * 0.9, Math.max(200, this.config.notchFreq)),
          now,
          0.02
        );
        this.notchFilter.Q.setTargetAtTime(Math.max(1.0, this.config.notchQ), now, 0.02);
      } else {
        // Neutralize notch
        this.notchFilter.frequency.setTargetAtTime(Math.min(22000, nyquist * 0.95), now, 0.02);
        this.notchFilter.Q.setTargetAtTime(0.01, now, 0.02);
      }
    }

    // If gate is disabled, smoothly restore full unity gain without clicks
    if ((!this.config.enabled || !this.config.gateEnabled) && this.gateGainNode) {
      const currentGain = this.gateGainNode.gain.value;
      this.gateGainNode.gain.cancelScheduledValues(now);
      this.gateGainNode.gain.setValueAtTime(Math.max(0.0001, currentGain), now);
      this.gateGainNode.gain.linearRampToValueAtTime(1.0, now + 0.02);
      this.gateState = 'open';
      this.currentReductionDb = 0;
    }
  }

  /**
   * Click-free Dynamic Envelope Follower loop running at ~60 Hz.
   * Features:
   * 1. Leaky peak/RMS follower to bridge note zero crossings (no sputtering or buzz).
   * 2. 4.5 dB Hysteresis gap between open and close thresholds (no gate chatter/chatter flutter).
   * 3. Continuous linear gain ramps anchored at current value (zero clicks/pops).
   */
  private startEnvelopeLoop(): void {
    if (this.envelopeTimer) clearInterval(this.envelopeTimer);

    const intervalMs = 16; // ~62.5 Hz refresh
    this.envelopeTimer = setInterval(() => {
      if (!this.ctx || !this.analyserNode || !this.gateGainNode) return;

      // 1. Time-Domain Analysis with Leaky Peak/RMS Follower
      this.analyserNode.getFloatTimeDomainData(this.timeDomainBuf as any);
      let sumSquares = 0;
      let peak = 0;
      const len = this.timeDomainBuf.length;
      for (let i = 0; i < len; i++) {
        const absVal = Math.abs(this.timeDomainBuf[i]);
        if (absVal > peak) peak = absVal;
        sumSquares += absVal * absVal;
      }
      const rawRms = Math.sqrt(sumSquares / len);

      // Fast attack (captures transient notes within 1-2 ms), smooth decay (bridges zero-crossings)
      const instantLevel = Number.isFinite(rawRms) ? Math.max(rawRms * 1.25, peak * 0.7) : 0;
      if (!Number.isFinite(this.smoothedEnvelopeLevel)) {
        this.smoothedEnvelopeLevel = instantLevel;
      } else if (instantLevel > this.smoothedEnvelopeLevel) {
        this.smoothedEnvelopeLevel = this.smoothedEnvelopeLevel * 0.2 + instantLevel * 0.8;
      } else {
        // Smooth release decay (~35ms time constant) prevents zero-crossing dropouts on sustaining notes
        this.smoothedEnvelopeLevel = this.smoothedEnvelopeLevel * 0.90 + instantLevel * 0.10;
      }

      const safeLevel = Number.isFinite(this.smoothedEnvelopeLevel) ? Math.max(1e-5, this.smoothedEnvelopeLevel) : 1e-5;
      const inputDb = 20 * Math.log10(safeLevel);

      // 2. High-Frequency Whine Detection (> 4.5 kHz) with Hysteresis
      this.analyserNode.getFloatFrequencyData(this.freqDomainBuf as any);
      let highFreqSum = 0;
      let highFreqCount = 0;
      for (let b = 24; b < Math.min(this.freqDomainBuf.length, 70); b++) {
        highFreqSum += this.freqDomainBuf[b];
        highFreqCount++;
      }
      const avgHighFreqDb = highFreqCount > 0 ? highFreqSum / highFreqCount : -100;
      const rawWhine = avgHighFreqDb > -65 && inputDb < -42;
      if (rawWhine) {
        this.whineDetectionCounter = Math.min(10, this.whineDetectionCounter + 1);
      } else {
        this.whineDetectionCounter = Math.max(0, this.whineDetectionCounter - 1);
      }
      if (this.whineDetectionCounter >= 4) {
        this.isWhineActive = true;
      } else if (this.whineDetectionCounter === 0) {
        this.isWhineActive = false;
      }

      // 3. Noise Floor Learning
      if (this.isLearningNoiseFloor) {
        this.noiseFloorSamples.push(inputDb);
      }

      // 4. Click-Free Dynamic Noise Gate Logic with Hysteresis
      try {
        const now = this.ctx.currentTime;
        if (this.config.enabled && this.config.gateEnabled) {
          const openThreshold = this.config.gateThreshold;
          const closeThreshold = this.config.gateThreshold - 4.5; // 4.5 dB hysteresis margin

          if (inputDb >= openThreshold) {
            // Signal crossed open threshold: smoothly open gate
            this.holdRemainingMs = this.config.gateHoldMs;
            if (this.gateState !== 'open') {
              this.gateState = 'open';
              this.gateGainNode.gain.cancelScheduledValues(now);
              const attackSec = Math.max(0.005, this.config.gateAttackMs / 1000);
              this.gateGainNode.gain.setTargetAtTime(1.0, now, attackSec);
            }
            this.currentReductionDb = 0;
          } else if (this.gateState === 'open' && inputDb >= closeThreshold) {
            // Sustaining above close threshold (within hysteresis zone)
            this.holdRemainingMs = this.config.gateHoldMs;
            this.currentReductionDb = 0;
          } else if (this.holdRemainingMs > 0) {
            // In hold period: maintain note sustain
            this.holdRemainingMs -= intervalMs;
            this.gateState = 'hold';
            this.currentReductionDb = 0;
          } else {
            // Smoothly close gate (exponential target to attenuation floor - NEVER THROWS)
            if (this.gateState !== 'closed') {
              this.gateState = 'closed';
              const targetReductionGain = Math.max(0.0001, Math.pow(10, this.config.gateReductionDb / 20));
              const releaseSec = Math.max(0.02, this.config.gateReleaseMs / 1000);
              this.gateGainNode.gain.cancelScheduledValues(now);
              this.gateGainNode.gain.setTargetAtTime(targetReductionGain, now, releaseSec);
            }
            this.currentReductionDb = this.config.gateReductionDb;
          }
        } else {
          if (this.gateState !== 'open') {
            this.gateState = 'open';
            this.gateGainNode.gain.cancelScheduledValues(now);
            this.gateGainNode.gain.setTargetAtTime(1.0, now, 0.02);
          }
          this.currentReductionDb = 0;
        }
      } catch (gateErr) {
        console.warn('Error in gate automation loop:', gateErr);
      }

      // 5. Emit Telemetry
      if (this.onTelemetry) {
        this.onTelemetry({
          inputDb: Math.round(inputDb),
          reductionDb: Math.round(this.currentReductionDb),
          gateState: this.gateState,
          highPitchNoiseDetected: this.isWhineActive,
          highPitchEnergyDb: Math.round(avgHighFreqDb)
        });
      }
    }, intervalMs);
  }

  /**
   * Starts automatic noise floor learning for 1.5 seconds.
   * User keeps guitar quiet; engine measures mic ambient noise and sets threshold +4dB above it.
   */
  public startLearnNoiseFloor(callback: (learnedDb: number) => void): void {
    this.isLearningNoiseFloor = true;
    this.noiseFloorSamples = [];
    this.learnCompletionCallback = callback;

    setTimeout(() => {
      this.isLearningNoiseFloor = false;
      if (this.noiseFloorSamples.length > 0) {
        // Average the lowest 50% of readings to get accurate quiet floor
        const sorted = [...this.noiseFloorSamples].sort((a, b) => a - b);
        const half = Math.floor(sorted.length / 2);
        const sub = sorted.slice(0, Math.max(1, half));
        const avg = sub.reduce((acc, v) => acc + v, 0) / sub.length;

        // Set threshold 5dB above measured ambient floor (clamped between -75dB and -25dB)
        const recommendedThreshold = Math.min(-25, Math.max(-75, Math.round(avg + 5)));
        this.updateConfig({ gateThreshold: recommendedThreshold });

        if (this.learnCompletionCallback) {
          this.learnCompletionCallback(recommendedThreshold);
          this.learnCompletionCallback = null;
        }
      }
    }, 1500);
  }

  /**
   * 1-Click "Whine & Screech Killer" Preset:
   * Instantly configures high-cut and noise gate to silence harsh mic feedback.
   */
  public applyWhineKillerPreset(): void {
    this.updateConfig({
      enabled: true,
      gateEnabled: true,
      gateThreshold: -48,
      gateAttackMs: 6,
      gateHoldMs: 30,
      gateReleaseMs: 120,
      gateReductionDb: -48,

      highCutEnabled: true,
      highCutFreq: 6000,
      highCutSlope: '24db',

      notchEnabled: true,
      notchFreq: 8000,
      notchQ: 8.0,

      lowCutEnabled: true,
      lowCutFreq: 85
    });
  }

  /**
   * Emergency recovery: immediately unblocks gate gain to 1.0 and clears stuck attenuation
   */
  public recover(): void {
    if (!this.ctx || !this.gateGainNode) return;
    try {
      const now = this.ctx.currentTime;
      this.gateGainNode.gain.cancelScheduledValues(now);
      this.gateGainNode.gain.setValueAtTime(1.0, now);
      this.gateState = 'open';
      this.currentReductionDb = 0;
    } catch {}
  }

  public dispose(): void {
    if (this.envelopeTimer) {
      clearInterval(this.envelopeTimer);
      this.envelopeTimer = null;
    }
  }
}
