/**
 * @file curves.ts
 * @description Non-linear wave-shaping transfer curves for distortion, overdrive, fuzz,
 * and neural tube amplifier saturation in Web Audio.
 *
 * HOW WAVESHAPING WORKS:
 * A WaveShaperNode maps every input sample x in [-1, +1] to an output y = f(x) via a
 * lookup table Float32Array. By shaping the transfer function f(x), we can model:
 * 1. Soft clipping (even harmonics, tube warmth)
 * 2. Hard clipping (odd harmonics, aggressive diode bite)
 * 3. Asymmetric clipping (rich octave and even-order harmonic coloration)
 *
 * Anti-aliasing is maintained by enabling 4x oversampling on the host WaveShaperNode.
 */

/**
 * Generates an Ibanez Tube Screamer style soft-clipping diode saturation curve.
 * Uses a hyperbolic curve f(x) = (3 + k)x / (π + k|x|) + subtle tube asymmetry.
 * 
 * @param drive Overdrive amount (0 - 100)
 * @returns Float32Array transfer curve of 4096 points
 */
export function createOverdriveCurve(drive: number): Float32Array {
  const k = Math.max(1, (drive / 100) * 50);
  const n = 4096;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;

  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    // Hyperbolic saturation with slight second-harmonic tube asymmetry
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x)) + 0.04 * Math.sin(x * Math.PI);
  }
  return curve;
}

/**
 * Generates a ProCo Rat / Boss DS-1 style hard-clipping silicon diode curve.
 * Below the diode forward voltage threshold, signals pass linearly.
 * Above threshold, the waveform is strictly clamped with slight transition curvature.
 *
 * @param gain Distortion gain amount (0 - 100)
 * @returns Float32Array transfer curve of 4096 points
 */
export function createDistortionCurve(gain: number): Float32Array {
  const k = 2 + (gain / 100) * 150;
  const n = 4096;
  const curve = new Float32Array(n);

  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    // Hard diode breakdown threshold
    if (x < -0.7) {
      curve[i] = -0.75;
    } else if (x > 0.6) {
      curve[i] = 0.68;
    } else {
      curve[i] = Math.tanh(x * k * 0.1);
    }
  }
  return curve;
}

/**
 * Generates a Big Muff / Fuzz Face germanium transistor saturation curve.
 * Produces crushing square-wave like saturation with asymmetric clipping.
 *
 * @param fuzz Fuzz saturation amount (0 - 100)
 * @returns Float32Array transfer curve of 4096 points
 */
export function createFuzzCurve(fuzz: number): Float32Array {
  const k = 10 + (fuzz / 100) * 300;
  const n = 4096;
  const curve = new Float32Array(n);

  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    // Asymmetric germanium saturation
    curve[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x * k * 0.2))) + 0.08 * Math.sin(x * 3);
  }
  return curve;
}

/**
 * Models 12AX7 tube grid conduction and plate saturation with dynamic bias.
 * Crucially compensated with zero DC offset: f(0) is strictly 0.0 so that silent
 * inputs remain completely silent and do not bias downstream filters or convolvers.
 *
 * @param gain Preamp gain (0 - 10)
 * @param saturation Tube saturation curve factor (1.0 - 5.0)
 * @param bias Grid bias offset
 * @returns Float32Array transfer curve of 4096 points
 */
export function createNamSaturationCurve(
  gain: number,
  saturation: number,
  bias: number
): Float32Array {
  const n = 4096;
  const curve = new Float32Array(n);

  // If gain is clean (<= 3.0) or saturation <= 1.2 (pure solid-state/clean amp), pass strictly linear with zero distortion
  if (gain <= 3.0 || saturation <= 1.2) {
    for (let i = 0; i < n; i++) {
      curve[i] = (i * 2) / n - 1;
    }
    return curve;
  }

  const drive = 1.0 + (gain / 10) * saturation * 2.5;
  const b = bias * 0.3;
  const zeroOffset = Math.tanh(b);

  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    // Asymmetric tube grid saturation centered at 0 DC offset
    curve[i] = (Math.tanh(x * drive + b) - zeroOffset) * 0.95;
  }
  return curve;
}
