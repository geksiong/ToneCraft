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

    const detect = () => {
      if (this.analyserNode && this.onUpdate) {
        this.analyserNode.getFloatTimeDomainData(this.buffer as any);
        const pitch = this.detectPitchAutocorrelation(this.buffer, this.sampleRate);
        if (pitch > 25 && pitch < 1200) {
          const data = this.calculateTunerData(pitch);
          this.onUpdate(data);
        }
      }
      this.rafId = requestAnimationFrame(detect);
    };

    this.rafId = requestAnimationFrame(detect);
  }

  /**
   * Stops the detection loop
   */
  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Autocorrelation pitch detection algorithm with parabolic refinement
   */
  private detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const size = buffer.length;

    // Check RMS energy to reject silence and ambient background hiss
    let rms = 0;
    for (let i = 0; i < size; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.015) return -1;

    // Find boundaries above threshold
    let r1 = 0;
    let r2 = size - 1;
    const thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) {
        r2 = size - i;
        break;
      }
    }

    const len = Math.max(0, r2 - r1);
    const trimmed = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      trimmed[i] = buffer[r1 + i];
    }

    // Autocorrelation sequence
    const c = new Float32Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    // Skip the zero-lag trivial peak
    let d = 0;
    while (c[d] > c[d + 1]) d++;

    // Find the primary period peak
    let maxVal = -1;
    let maxPos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxVal) {
        maxVal = c[i];
        maxPos = i;
      }
    }

    let T0 = maxPos;
    if (T0 <= 0) return -1;

    // Parabolic 3-point interpolation for sub-sample accuracy
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }

    return sampleRate / T0;
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
