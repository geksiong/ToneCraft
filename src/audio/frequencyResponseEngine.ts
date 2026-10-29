/**
 * @file frequencyResponseEngine.ts
 * @description High-Precision Bode Plot & End-to-End Frequency Response Calculation Engine.
 *
 * Mathematically evaluates the composite complex transfer function H(f) across
 * the full audible guitar audio spectrum (20 Hz - 20 kHz, logarithmic spacing).
 *
 * Integrates all active components in the signal chain:
 * 1. Input Conditioner (Low-Cut Rumble, Anti-Whine Notch, High-Cut De-Hiss)
 * 2. Series FX Pedalboard (Graphic EQ, Overdrive tone & mid-hump, Distortion filter,
 *    Fuzz scoop & tone, Wah bandpass, Klon treble & mid-push, Telephone filter, etc.)
 * 3. Amp Tone Stack (Low-shelf Bass, Peaking Mid, High-shelf Treble, Peaking Presence)
 * 4. Acoustic Cabinet & Microphone (24dB/oct Low-Cut, 24dB/oct High-Cut,
 *    Proximity effect bass boost, Air absorption shelf, and Speaker acoustic profile / IR)
 */

import { AnyPedal, AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import { InputConditionerConfig } from './inputConditioner';
import { audioEngine } from './audioEngine';

export interface FrequencyPoint {
  freq: number;          // in Hz (20 to 20,000 Hz)
  magDb: number;         // Total end-to-end magnitude in dB
  phaseDeg: number;      // Total phase in degrees (-180 to +180)
  inputCondMagDb: number;// Input conditioner stage contribution (dB)
  pedalsMagDb: number;   // Pedals stage contribution (dB)
  ampMagDb: number;      // Amp tone stack contribution (dB)
  cabMagDb: number;      // Cabinet & mic contribution (dB)
}

export interface BodePlotDiagnostics {
  lowCutoffHz: number;   // -3dB low frequency rolloff point
  highCutoffHz: number;  // -3dB high frequency rolloff point
  peakFreqHz: number;    // Peak resonant frequency
  peakGainDb: number;    // Maximum gain in dB
  minGainDb: number;     // Minimum gain in dB
  totalActiveFilters: number;
}

export interface BodePlotData {
  points: FrequencyPoint[];
  diagnostics: BodePlotDiagnostics;
}

// Complex number helpers
interface Complex {
  re: number;
  im: number;
}

function complexMult(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function complexDiv(num: Complex, den: Complex): Complex {
  const denMagSq = den.re * den.re + den.im * den.im;
  if (denMagSq < 1e-12) return { re: 1, im: 0 };
  return {
    re: (num.re * den.re + num.im * den.im) / denMagSq,
    im: (num.im * den.re - num.re * den.im) / denMagSq
  };
}

/**
 * Direct Form Biquad Filter transfer function evaluator:
 * H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
 * evaluated at z = e^(j * 2*pi*f / fs)
 */
export interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
}

export function evalBiquadAt(coeffs: BiquadCoeffs, freq: number, fs: number = 48000): Complex {
  const w = (2 * Math.PI * freq) / fs;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cos2W = Math.cos(2 * w);
  const sin2W = Math.sin(2 * w);

  const num: Complex = {
    re: coeffs.b0 + coeffs.b1 * cosW + coeffs.b2 * cos2W,
    im: -coeffs.b1 * sinW - coeffs.b2 * sin2W
  };

  const den: Complex = {
    re: coeffs.a0 + coeffs.a1 * cosW + coeffs.a2 * cos2W,
    im: -coeffs.a1 * sinW - coeffs.a2 * sin2W
  };

  return complexDiv(num, den);
}

// Standard Audio EQ Cookbook coefficient generators
export function makeLowpassCoeffs(freq: number, Q: number = 0.707, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));

  return {
    b0: (1 - cosW0) / 2,
    b1: 1 - cosW0,
    b2: (1 - cosW0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosW0,
    a2: 1 - alpha
  };
}

export function makeHighpassCoeffs(freq: number, Q: number = 0.707, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));

  return {
    b0: (1 + cosW0) / 2,
    b1: -(1 + cosW0),
    b2: (1 + cosW0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosW0,
    a2: 1 - alpha
  };
}

export function makeBandpassCoeffs(freq: number, Q: number = 1.0, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));

  return {
    b0: alpha,
    b1: 0,
    b2: -alpha,
    a0: 1 + alpha,
    a1: -2 * cosW0,
    a2: 1 - alpha
  };
}

export function makeNotchCoeffs(freq: number, Q: number = 6.0, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));

  return {
    b0: 1,
    b1: -2 * cosW0,
    b2: 1,
    a0: 1 + alpha,
    a1: -2 * cosW0,
    a2: 1 - alpha
  };
}

export function makePeakingCoeffs(freq: number, gainDb: number, Q: number = 1.0, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));
  const A = Math.pow(10, gainDb / 40);

  return {
    b0: 1 + alpha * A,
    b1: -2 * cosW0,
    b2: 1 - alpha * A,
    a0: 1 + alpha / A,
    a1: -2 * cosW0,
    a2: 1 - alpha / A
  };
}

export function makeLowshelfCoeffs(freq: number, gainDb: number, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const A = Math.pow(10, gainDb / 40);
  const alpha = (sinW0 / 2) * Math.SQRT2;
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

  return {
    b0: A * ((A + 1) - (A - 1) * cosW0 + twoSqrtAAlpha),
    b1: 2 * A * ((A - 1) - (A + 1) * cosW0),
    b2: A * ((A + 1) - (A - 1) * cosW0 - twoSqrtAAlpha),
    a0: (A + 1) + (A - 1) * cosW0 + twoSqrtAAlpha,
    a1: -2 * ((A - 1) + (A + 1) * cosW0),
    a2: (A + 1) + (A - 1) * cosW0 - twoSqrtAAlpha
  };
}

export function makeHighshelfCoeffs(freq: number, gainDb: number, fs: number = 48000): BiquadCoeffs {
  const safeFreq = Math.max(10, Math.min(fs * 0.48, freq));
  const w0 = (2 * Math.PI * safeFreq) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const A = Math.pow(10, gainDb / 40);
  const alpha = (sinW0 / 2) * Math.SQRT2;
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

  return {
    b0: A * ((A + 1) + (A - 1) * cosW0 + twoSqrtAAlpha),
    b1: -2 * A * ((A - 1) + (A + 1) * cosW0),
    b2: A * ((A + 1) + (A - 1) * cosW0 - twoSqrtAAlpha),
    a0: (A + 1) - (A - 1) * cosW0 + twoSqrtAAlpha,
    a1: 2 * ((A - 1) - (A + 1) * cosW0),
    a2: (A + 1) - (A - 1) * cosW0 - twoSqrtAAlpha
  };
}

/**
 * Generate 200 logarithmically spaced frequencies from 20 Hz to 20,000 Hz.
 */
export function generateLogFrequencies(count: number = 200, minFreq: number = 20, maxFreq: number = 20000): number[] {
  const freqs: number[] = [];
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const step = (logMax - logMin) / (count - 1);

  for (let i = 0; i < count; i++) {
    const f = Math.pow(10, logMin + i * step);
    freqs.push(Math.round(f * 10) / 10);
  }
  return freqs;
}

// Pre-generated log frequency grid
export const LOG_FREQUENCIES: number[] = generateLogFrequencies(200);

/**
 * Calculate the frequency response of an Impulse Response AudioBuffer via DTFT.
 */
function evalIrBufferAt(buffer: AudioBuffer, freq: number, fs: number): Complex {
  const data = buffer.getChannelData(0);
  // Scan first 1024 samples (direct acoustic wave and early speaker enclosure reflections)
  const len = Math.min(data.length, 1024);
  const omega = (2 * Math.PI * freq) / fs;

  let re = 0;
  let im = 0;
  for (let n = 0; n < len; n++) {
    const angle = omega * n;
    re += data[n] * Math.cos(angle);
    im -= data[n] * Math.sin(angle);
  }
  return { re, im };
}

/**
 * Collect all active BiquadFilter coefficients for a given pedal
 */
function getPedalFilterCoeffs(pedal: AnyPedal, fs: number): BiquadCoeffs[] {
  if (!pedal.enabled) return [];
  const list: BiquadCoeffs[] = [];

  switch (pedal.type) {
    case 'overdrive': {
      const p = pedal as any;
      // Mid-hump peaking filter (+6dB at 720Hz)
      list.push(makePeakingCoeffs(720, p.bassBoost ? 8 : 6, 1.2, fs));
      // Tone lowpass filter: 1000Hz to 7000Hz
      const toneFreq = 1000 + (Math.max(0, Math.min(100, p.tone || 50)) / 100) * 6000;
      list.push(makeLowpassCoeffs(toneFreq, 0.707, fs));
      break;
    }

    case 'distortion': {
      const p = pedal as any;
      // Tone/Filter lowpass: 800Hz to 7800Hz
      const filterFreq = 800 + (Math.max(0, Math.min(100, p.filter || 50)) / 100) * 7000;
      list.push(makeLowpassCoeffs(filterFreq, 0.707, fs));
      if (p.vintageMode) {
        list.push(makeLowpassCoeffs(5800, 0.707, fs));
      }
      break;
    }

    case 'fuzz': {
      const p = pedal as any;
      // Mid-scoop filter at 1000Hz
      const scoopGain = -15 + (Math.max(0, Math.min(100, p.scoop || 50)) / 100) * 20;
      list.push(makePeakingCoeffs(1000, scoopGain, 1.8, fs));
      // Tone lowpass filter: 800Hz to 7300Hz
      const toneFreq = 800 + (Math.max(0, Math.min(100, p.tone || 50)) / 100) * 6500;
      list.push(makeLowpassCoeffs(toneFreq, 0.707, fs));
      break;
    }

    case 'eq': {
      const p = pedal as any;
      const bands = [
        { f: 100, g: p.band100 ?? 0 },
        { f: 200, g: p.band200 ?? 0 },
        { f: 400, g: p.band400 ?? 0 },
        { f: 800, g: p.band800 ?? 0 },
        { f: 1600, g: p.band1600 ?? 0 },
        { f: 3200, g: p.band3200 ?? 0 },
        { f: 6400, g: p.band6400 ?? 0 }
      ];
      for (const b of bands) {
        if (Math.abs(b.g) > 0.1) {
          list.push(makePeakingCoeffs(b.f, b.g, 1.4, fs));
        }
      }
      break;
    }

    case 'autoWah': {
      const p = pedal as any;
      const center = p.manual ? 400 + (p.manual / 100) * 2200 : 1200;
      list.push(makeBandpassCoeffs(center, 3.2, fs));
      break;
    }

    case 'chorus': {
      const p = pedal as any;
      const tone = 2000 + (Math.max(0, Math.min(100, p.tone || 60)) / 100) * 8000;
      list.push(makeLowpassCoeffs(tone, 0.707, fs));
      break;
    }

    case 'deEsser': {
      const p = pedal as any;
      const freq = p.frequency || 6500;
      const dip = -((p.reduction || 65) / 100) * 8.0;
      list.push(makePeakingCoeffs(freq, dip, 2.5, fs));
      break;
    }

    case 'telephoneVoice': {
      list.push(makeHighpassCoeffs(400, 0.707, fs));
      list.push(makeLowpassCoeffs(3400, 0.707, fs));
      list.push(makePeakingCoeffs(1400, 5.5, 1.6, fs));
      break;
    }

    case 'vocalPreamp': {
      list.push(makeHighpassCoeffs(80, 0.707, fs));
      list.push(makeHighpassCoeffs(80, 0.707, fs));
      list.push(makePeakingCoeffs(220, 2.0, 1.0, fs));
      list.push(makeHighshelfCoeffs(12000, 4.0, fs));
      break;
    }

    case 'klonOverdrive': {
      const p = pedal as any;
      list.push(makePeakingCoeffs(1000, 4.5, 1.4, fs));
      const trebleDb = (((p.treble || 50) - 50) / 50) * 8.5;
      list.push(makeHighshelfCoeffs(4200, trebleDb, fs));
      break;
    }

    case 'lofiVinyl': {
      const p = pedal as any;
      list.push(makeHighpassCoeffs(130, 0.707, fs));
      const filterCutoff = 2200 + ((100 - (p.filter || 50)) / 100) * 6000;
      list.push(makeLowpassCoeffs(filterCutoff, 0.707, fs));
      break;
    }

    case 'delay': {
      const p = pedal as any;
      if (p.flutter && p.flutter > 20) {
        list.push(makeLowpassCoeffs(4200, 0.707, fs));
      }
      break;
    }

    case 'dualNotch': {
      const p = pedal as any;
      const isEn1 = p.enabled1 !== undefined ? p.enabled1 : true;
      const depth1 = Math.max(0, Math.min(100, p.depth1 !== undefined ? p.depth1 : 100));
      if (isEn1 && depth1 > 0) {
        const f1 = Math.max(30, Math.min(18000, p.freq1 || 250));
        const q1 = Math.max(0.5, Math.min(30, p.q1 || 8.0));
        if (depth1 >= 96) {
          list.push(makeNotchCoeffs(f1, q1, fs));
        } else {
          list.push(makePeakingCoeffs(f1, -(depth1 / 100) * 48, q1, fs));
        }
      }

      const isEn2 = p.enabled2 !== undefined ? p.enabled2 : true;
      const depth2 = Math.max(0, Math.min(100, p.depth2 !== undefined ? p.depth2 : 100));
      if (isEn2 && depth2 > 0) {
        const f2 = Math.max(30, Math.min(18000, p.freq2 || 3200));
        const q2 = Math.max(0.5, Math.min(30, p.q2 || 8.0));
        if (depth2 >= 96) {
          list.push(makeNotchCoeffs(f2, q2, fs));
        } else {
          list.push(makePeakingCoeffs(f2, -(depth2 / 100) * 48, q2, fs));
        }
      }
      break;
    }
  }

  return list;
}

/**
 * Computes the full end-to-end frequency response (Bode Plot) data across the signal chain.
 */
export function calculateEndToEndFrequencyResponse(
  pedals: AnyPedal[],
  ampModel: AmpModelConfig,
  irCabinet: IrCabinetConfig,
  conditionerConfig?: InputConditionerConfig | null,
  fs: number = 48000
): BodePlotData {
  const points: FrequencyPoint[] = [];

  // 1. Gather Input Conditioner Filters
  const condCoeffs: BiquadCoeffs[] = [];
  if (conditionerConfig && conditionerConfig.enabled) {
    if (conditionerConfig.lowCutEnabled) {
      condCoeffs.push(makeHighpassCoeffs(conditionerConfig.lowCutFreq || 70, 0.707, fs));
    }
    if (conditionerConfig.notchEnabled) {
      condCoeffs.push(makeNotchCoeffs(conditionerConfig.notchFreq || 8000, conditionerConfig.notchQ || 6.0, fs));
    }
    if (conditionerConfig.highCutEnabled) {
      condCoeffs.push(makeLowpassCoeffs(conditionerConfig.highCutFreq || 7500, 0.707, fs));
      if (conditionerConfig.highCutSlope === '24db') {
        condCoeffs.push(makeLowpassCoeffs(conditionerConfig.highCutFreq || 7500, 0.707, fs));
      }
    }
  }

  // 2. Gather All Active Pedals Filters
  const pedalsCoeffs: BiquadCoeffs[] = [];
  for (const pedal of pedals) {
    if (pedal.enabled) {
      const pCoeffs = getPedalFilterCoeffs(pedal, fs);
      pedalsCoeffs.push(...pCoeffs);
    }
  }

  // 3. Gather Amp Tone Stack Filters
  const ampCoeffs: BiquadCoeffs[] = [];
  const isAmpBypassed = Boolean(ampModel.bypassed || (ampModel as any).enabled === false);

  if (!isAmpBypassed) {
    const bass = ampModel.bass !== undefined ? ampModel.bass : 5;
    const mid = ampModel.mid !== undefined ? ampModel.mid : 5;
    const treble = ampModel.treble !== undefined ? ampModel.treble : 5;
    const presence = ampModel.presence !== undefined ? ampModel.presence : 5;

    // Bass low shelf at 120Hz (-7.5dB to +7.5dB)
    ampCoeffs.push(makeLowshelfCoeffs(120, (bass - 5) * 1.5, fs));
    // Mid peaking at 750Hz (-8dB to +8dB, Q=1.0)
    ampCoeffs.push(makePeakingCoeffs(750, (mid - 5) * 1.6, 1.0, fs));
    // Treble high shelf at 3200Hz (-6.5dB to +6.5dB)
    ampCoeffs.push(makeHighshelfCoeffs(3200, (treble - 5) * 1.3, fs));
    // Presence peaking at 5000Hz (-5dB to +5dB, Q=1.2)
    ampCoeffs.push(makePeakingCoeffs(5000, (presence - 5) * 1.0, 1.2, fs));

    // Natural guitar preamp body coloring (slight low-mid warmth + upper saturation curve)
    ampCoeffs.push(makePeakingCoeffs(240, 0.8, 1.2, fs));
  }

  // 4. Gather Cabinet & Mic Filters
  const cabCoeffs: BiquadCoeffs[] = [];
  const isCabBypassed = Boolean(irCabinet.bypassed || (irCabinet as any).enabled === false);

  if (!isCabBypassed) {
    const lowCutFreq = Math.max(20, Math.min(160, irCabinet.lowCut || 70));
    const highCutFreq = Math.max(4000, Math.min(12000, irCabinet.highCut || 7500));
    const dist = Math.max(0, Math.min(100, irCabinet.micDistance !== undefined ? irCabinet.micDistance : 30));
    const distRatio = dist / 100;
    const proxGain = 4.5 - distRatio * 7.0;
    const airGain = 2.5 - distRatio * 6.5;

    // 24dB/oct Low Cut (2 cascaded highpass filters)
    cabCoeffs.push(makeHighpassCoeffs(lowCutFreq, 0.707, fs));
    cabCoeffs.push(makeHighpassCoeffs(lowCutFreq, 0.707, fs));

    // 24dB/oct High Cut (2 cascaded lowpass filters)
    cabCoeffs.push(makeLowpassCoeffs(highCutFreq, 0.707, fs));
    cabCoeffs.push(makeLowpassCoeffs(highCutFreq, 0.707, fs));

    // Proximity effect at 120Hz
    cabCoeffs.push(makePeakingCoeffs(120, proxGain, 1.1, fs));

    // Air absorption at 4800Hz
    cabCoeffs.push(makeHighshelfCoeffs(4800, airGain, fs));

    // Physical guitar loudspeaker enclosure profile (Celestion V30 / Jensen cone resonance and upper breakup)
    cabCoeffs.push(makePeakingCoeffs(110, 3.8, 1.2, fs));      // Cabinet box resonance thud
    cabCoeffs.push(makePeakingCoeffs(850, -2.6, 1.0, fs));     // Mid enclosure dispersion scoop
    cabCoeffs.push(makePeakingCoeffs(2750, 4.2, 1.5, fs));     // Speaker cone cone-breakup bite
    cabCoeffs.push(makeLowpassCoeffs(5600, 0.85, fs));         // Physical speaker voice-coil inductance rolloff
  }

  const totalActiveFilters = condCoeffs.length + pedalsCoeffs.length + ampCoeffs.length + cabCoeffs.length;

  let peakGain = -Infinity;
  let peakFreq = 1000;
  let minGain = Infinity;

  // Evaluate across the 200 logarithmic frequency steps
  for (let i = 0; i < LOG_FREQUENCIES.length; i++) {
    const freq = LOG_FREQUENCIES[i];

    // Stage 1: Input Conditioner
    let condH: Complex = { re: 1, im: 0 };
    for (const c of condCoeffs) {
      condH = complexMult(condH, evalBiquadAt(c, freq, fs));
    }
    const condMag = Math.sqrt(condH.re * condH.re + condH.im * condH.im);
    const condMagDb = 20 * Math.log10(Math.max(1e-5, condMag));

    // Stage 2: FX Pedals
    let pedalsH: Complex = { re: 1, im: 0 };
    for (const c of pedalsCoeffs) {
      pedalsH = complexMult(pedalsH, evalBiquadAt(c, freq, fs));
    }
    const pedalsMag = Math.sqrt(pedalsH.re * pedalsH.re + pedalsH.im * pedalsH.im);
    const pedalsMagDb = 20 * Math.log10(Math.max(1e-5, pedalsMag));

    // Stage 3: Amp Tone Stack
    let ampH: Complex = { re: 1, im: 0 };
    for (const c of ampCoeffs) {
      ampH = complexMult(ampH, evalBiquadAt(c, freq, fs));
    }
    const ampMag = Math.sqrt(ampH.re * ampH.re + ampH.im * ampH.im);
    const ampMagDb = 20 * Math.log10(Math.max(1e-5, ampMag));

    // Stage 4: Cabinet & Mic
    let cabH: Complex = { re: 1, im: 0 };
    for (const c of cabCoeffs) {
      cabH = complexMult(cabH, evalBiquadAt(c, freq, fs));
    }
    const cabMag = Math.sqrt(cabH.re * cabH.re + cabH.im * cabH.im);
    const cabMagDb = 20 * Math.log10(Math.max(1e-5, cabMag));

    // End-to-End Total Complex Product
    const totalH = complexMult(complexMult(condH, pedalsH), complexMult(ampH, cabH));
    const totalMag = Math.sqrt(totalH.re * totalH.re + totalH.im * totalH.im);
    const totalMagDb = 20 * Math.log10(Math.max(1e-5, totalMag));
    const totalPhaseRad = Math.atan2(totalH.im, totalH.re);
    const totalPhaseDeg = (totalPhaseRad * 180) / Math.PI;

    if (totalMagDb > peakGain) {
      peakGain = totalMagDb;
      peakFreq = freq;
    }
    if (totalMagDb < minGain) {
      minGain = totalMagDb;
    }

    points.push({
      freq,
      magDb: Math.round(totalMagDb * 10) / 10,
      phaseDeg: Math.round(totalPhaseDeg * 10) / 10,
      inputCondMagDb: Math.round(condMagDb * 10) / 10,
      pedalsMagDb: Math.round(pedalsMagDb * 10) / 10,
      ampMagDb: Math.round(ampMagDb * 10) / 10,
      cabMagDb: Math.round(cabMagDb * 10) / 10
    });
  }

  // Calculate -3dB cutoff frequencies relative to mid-band reference (1000 Hz)
  const midPoint = points.find(p => p.freq >= 950 && p.freq <= 1050) || points[Math.floor(points.length / 2)];
  const refGain = midPoint ? midPoint.magDb : 0;
  const target3Db = refGain - 3.0;

  let lowCutoffHz = 20;
  for (let i = 0; i < points.length; i++) {
    if (points[i].freq < 1000 && points[i].magDb >= target3Db) {
      lowCutoffHz = points[i].freq;
      break;
    }
  }

  let highCutoffHz = 20000;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].freq > 1000 && points[i].magDb >= target3Db) {
      highCutoffHz = points[i].freq;
      break;
    }
  }

  return {
    points,
    diagnostics: {
      lowCutoffHz: Math.round(lowCutoffHz),
      highCutoffHz: Math.round(highCutoffHz),
      peakFreqHz: Math.round(peakFreq),
      peakGainDb: Math.round(peakGain * 10) / 10,
      minGainDb: Math.round(minGain * 10) / 10,
      totalActiveFilters
    }
  };
}
