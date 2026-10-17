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
 * Crucially calibrated with high dynamic headroom and zero DC offset to match
 * the Neural Amp Modeler (NAM) engine output levels and eliminate harsh digital clipping.
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

  // If gain is clean (<= 2.8) or saturation <= 1.2 (pure solid-state / clean amp),
  // pass linear transfer curve with full, punchy headroom (~0.88)
  // so clean chords and single notes maintain matched perceived loudness with saturated lead channels.
  if (gain <= 2.8 || saturation <= 1.2) {
    const cleanOutputScale = 0.88;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = x * cleanOutputScale;
    }
    return curve;
  }

  // Calibrated drive: provides smooth edge-of-breakup and organic tube compression
  // matching the touch response and headroom of real NAM neural models
  const normGain = Math.max(0.1, gain / 5.0);
  const effSaturation = Math.max(1.0, saturation || 2.5);
  const drive = 0.9 + Math.pow(normGain, 1.2) * (effSaturation * 0.38);
  const b = (bias || 0.06) * 0.2;
  const outputScale = 0.72; // Calibrated for balanced loudness against clean channels

  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    // Asymmetric 12AX7 tube transfer curve with smooth soft-knee compression
    // f(0) = 0 strictly guaranteed
    let rawY = 0;
    if (x >= 0) {
      // Grid conduction soft compression on positive swing
      const v = x * drive + b;
      rawY = Math.tanh(v * 0.85) - Math.tanh(b * 0.85) - 0.06 * Math.tanh(Math.pow(x * drive, 2) * 0.25);
    } else {
      // Plate cutoff smooth compression on negative swing
      const v = x * drive * 0.92 + b;
      rawY = Math.tanh(v * 0.80) - Math.tanh(b * 0.80) + 0.05 * Math.tanh(Math.pow(x * drive, 2) * 0.20);
    }

    curve[i] = rawY * outputScale;
  }
  return curve;
}
