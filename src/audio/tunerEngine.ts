/**
 * @file tunerEngine.ts
 * @description Real-time Chromatic Pitch Detection Engine for guitar and bass tuning.
 *
 * HOW PITCH DETECTION WORKS:
 * 1. Audio samples are tapped directly from the raw input stage (prior to distortion)
 *    into an AnalyserNode with 2048 FFT window size.
 * 2. Time-domain PCM samples are analyzed using an Autocorrelation / YIN algorithm:
 *    R(tau) = sum(x[t] * x[t + tau]). The first major peak above the noise floor
 *    corresponds to the fundamental pitch period T0.
 * 3. Parabolic 3-point interpolation (fitting a parabola through the peak and its
 *    two neighbors) refines T0 to sub-sample fractional accuracy:
 *    frequency = sampleRate / T0.
 * 4. Frequency is converted to musical notes via logarithmic MIDI conversion:
 *    midi = 69 + 12 * log2(f / 440).
 * 5. Cents offset is calculated from the nearest semitone:
 *    cents = 1200 * log2(f / targetFreq). If |cents| <= 3, the note is marked IN TUNE.
 */

import { TunerData } from '../types/pedal';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class TunerEngine {
  private analyserNode: AnalyserNode | null = null;
  private sampleRate: number = 48000;
  private rafId: number | null = null;
  private onUpdate: ((data: TunerData) => void) | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private normBuffer: Float32Array = new Float32Array(2048);
  private yinBuffer: Float32Array = new Float32Array(1600);
  private silenceFrameCount: number = 0;
  private isSilent: boolean = true;

  /**
   * Connects the tuner engine to an AnalyserNode tap
   */
  public attach(analyser: AnalyserNode, sampleRate: number, callback: (data: TunerData) => void): void {
    this.analyserNode = analyser;
    this.sampleRate = sampleRate;
    this.onUpdate = callback;
    this.start();
  }

  /**
   * Starts the animation frame pitch detection loop
   */
  public start(): void {
    if (this.rafId !== null) return;

    let lastDetectTime = 0;
    const detect = (now: number) => {
      this.rafId = requestAnimationFrame(detect);

      // Throttle pitch analysis to ~20 Hz (every ~50ms) instead of running heavy YIN loop at 60-120 Hz
      if (now - lastDetectTime < 50) {
        return;
      }
      lastDetectTime = now;

      if (this.analyserNode && this.onUpdate) {
        this.analyserNode.getFloatTimeDomainData(this.buffer as any);
        const pitch = this.detectPitch(this.buffer, this.sampleRate);
        if (pitch > 25 && pitch < 1200) {
          this.silenceFrameCount = 0;
          this.isSilent = false;
          const data = this.calculateTunerData(pitch);
          this.onUpdate(data);
        } else {
          this.silenceFrameCount++;
          // If silent or below noise floor for ~8 frames (~400ms at 20Hz), reset tuner to listening state
          if (this.silenceFrameCount > 8 && !this.isSilent) {
            this.isSilent = true;
            this.onUpdate({
              note: '',
              frequency: 0,
              cents: 0,
              targetFrequency: 0,
              inTune: false,
              clarity: 0
            });
          }
        }
      }
    };

    this.rafId = requestAnimationFrame(detect);
  }

  /**
   * Stops the detection loop and resets tuner state
   */
  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.silenceFrameCount = 0;
    this.isSilent = true;
    if (this.onUpdate) {
      this.onUpdate({
        note: '',
        frequency: 0,
        cents: 0,
        targetFrequency: 0,
        inTune: false,
        clarity: 0
      });
    }
  }

  /**
   * High-sensitivity YIN pitch detection algorithm with sub-sample parabolic refinement.
   * Works reliably down to -60 dBFS input levels (low mic gain, passive single-coils, acoustic pickups).
   */
  private detectPitch(buffer: Float32Array, sampleRate: number): number {
    const size = buffer.length;

    // 1. Calculate peak and RMS energy
    let maxVal = 0;
    let sumSq = 0;
    for (let i = 0; i < size; i++) {
      const absVal = Math.abs(buffer[i]);
      if (absVal > maxVal) maxVal = absVal;
      sumSq += absVal * absVal;
    }

    const rms = Math.sqrt(sumSq / size);

    // Ultra-sensitive noise threshold: detects down to -60 dBFS (RMS ~0.001)
    // Prevents ambient room hiss while tracking very quiet or decaying guitar notes with low mic gain
    if (rms < 0.0008 || maxVal < 0.0015) {
      return -1;
    }

    // 2. Normalize buffer by peak amplitude so low-gain signals have identical correlation magnitude
    const normFactor = 1.0 / maxVal;
    let mean = 0;
    for (let i = 0; i < size; i++) {
      const v = buffer[i] * normFactor;
      this.normBuffer[i] = v;
      mean += v;
    }
    mean /= size;

    // Remove DC offset
    for (let i = 0; i < size; i++) {
      this.normBuffer[i] -= mean;
    }

    // 3. YIN Algorithm
    // Search frequency range: 28 Hz (low B on 5-string bass) to 1200 Hz (high guitar registers)
    const minTau = Math.max(2, Math.floor(sampleRate / 1200)); // ~40 samples at 48kHz
    const maxTau = Math.min(1560, Math.floor(sampleRate / 28)); // ~1560 samples for ~30.8 Hz
    const windowSize = Math.max(300, size - maxTau); // At least 488 samples for reliable correlation

    // Step A: Squared Difference Function d(tau)
    this.yinBuffer[0] = 0;
    for (let tau = 1; tau < maxTau; tau++) {
      let diff = 0;
      for (let j = 0; j < windowSize; j++) {
        const delta = this.normBuffer[j] - this.normBuffer[j + tau];
        diff += delta * delta;
      }
      this.yinBuffer[tau] = diff;
    }

    // Step B: Cumulative Mean Normalized Difference Function (CMNDF)
    this.yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < maxTau; tau++) {
      runningSum += this.yinBuffer[tau];
      this.yinBuffer[tau] = runningSum > 0 ? (this.yinBuffer[tau] * tau) / runningSum : 1;
    }

    // Step C: Absolute Thresholding & Valley Search
    const threshold = 0.15;
    let tauFound = -1;

    for (let tau = minTau; tau < maxTau; tau++) {
      if (this.yinBuffer[tau] < threshold) {
        // Find local minimum in this valley
        while (tau + 1 < maxTau && this.yinBuffer[tau + 1] < this.yinBuffer[tau]) {
          tau++;
        }
        tauFound = tau;
        break;
      }
    }

    // If no tau dropped below strict threshold, find the global minimum in the valid range
    if (tauFound === -1) {
      let minVal = 1.0;
      for (let tau = minTau; tau < maxTau; tau++) {
        if (this.yinBuffer[tau] < minVal) {
          minVal = this.yinBuffer[tau];
          tauFound = tau;
        }
      }
      // Only accept if valley dip is reasonably distinct (< 0.35)
      if (minVal > 0.35) {
        return -1;
      }
    }

    if (tauFound <= 0 || tauFound >= maxTau - 1) {
      return -1;
    }

    // Step D: Parabolic 3-point interpolation for sub-sample accuracy
    const s0 = this.yinBuffer[tauFound - 1];
    const s1 = this.yinBuffer[tauFound];
    const s2 = this.yinBuffer[tauFound + 1];

    let betterTau = tauFound;
    const denom = 2 * (s0 - 2 * s1 + s2);
    if (Math.abs(denom) > 1e-6) {
      betterTau = tauFound + (s0 - s2) / denom;
    }

    return sampleRate / betterTau;
  }

  /**
   * Converts frequency into musical note name, octave, and cents offset
   */
  private calculateTunerData(frequency: number): TunerData {
    const midi = 69 + 12 * Math.log2(frequency / 440);
    const nearestMidi = Math.round(midi);
    const noteName = NOTE_NAMES[((nearestMidi % 12) + 12) % 12];
    const octave = Math.floor(nearestMidi / 12) - 1;
    const targetFreq = 440 * Math.pow(2, (nearestMidi - 69) / 12);
    const cents = Math.round(1200 * Math.log2(frequency / targetFreq));

    return {
      note: `${noteName}${octave}`,
      frequency: Math.round(frequency * 10) / 10,
      cents: Math.max(-50, Math.min(50, cents)),
      targetFrequency: Math.round(targetFreq * 10) / 10,
      inTune: Math.abs(cents) <= 3,
      clarity: 0.95
    };
  }
}
