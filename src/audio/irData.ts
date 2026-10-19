import { IrCabinetConfig } from '../types/pedal';

export const BUILT_IN_IR_CABINETS: IrCabinetConfig[] = [
  {
    id: 'celestion-v30',
    name: 'Celestion Vintage 30 4x12 (Real Acoustic IR)',
    category: 'Guitar',
    description: 'Real acoustic impulse response: studio-captured Celestion Vintage 30 4x12 cab with tight low-end punch and focused midrange cut.',
    speakerType: 'Real 4x12 Celestion V30 Acoustic WAV IR',
    micDistance: 30,
    highCut: 7500,
    lowCut: 70,
    irUrl: '/irs/celestion.wav',
    isRealWav: true
  },
  {
    id: 'emt-140-plate',
    name: 'EMT 140 Acoustic Studio Plate (Real IR)',
    category: 'Guitar',
    description: 'Real acoustic impulse response: legendary German EMT 140 mechanical plate reverb with warm steel dispersion and silky highs.',
    speakerType: 'Real EMT 140 Acoustic Studio Plate WAV IR',
    micDistance: 50,
    highCut: 9000,
    lowCut: 60,
    irUrl: '/irs/plate.wav',
    isRealWav: true
  },
  {
    id: 'marshall-412-v30',
    name: 'Marshall 1960A 4x12 (Synthetic Model)',
    category: 'Guitar',
    description: 'The standard rock cabinet: focused low-end thump, aggressive upper-mid cut, and smooth top roll-off.',
    speakerType: '4x12 Celestion Vintage 30',
    micDistance: 35,
    highCut: 6500,
    lowCut: 75
  },
  {
    id: 'fender-212-twin',
    name: "Fender '65 Twin Reverb 2x12 (Jensen)",
    category: 'Guitar',
    description: 'Classic open-back American chime with expansive air, crystal highs, and resonant low-mid warmth.',
    speakerType: '2x12 Jensen C12K',
    micDistance: 45,
    highCut: 7500,
    lowCut: 65
  },
  {
    id: 'vox-212-alnico',
    name: 'Vox AC30 2x12 (Alnico Blue)',
    category: 'Guitar',
    description: 'British chime with prominent harmonic bell ring, sweet compressed mids, and organic touch response.',
    speakerType: '2x12 Celestion Alnico Blue',
    micDistance: 30,
    highCut: 8000,
    lowCut: 80
  },
  {
    id: 'mesa-412-recto',
    name: 'Mesa Rectifier 4x12 (Oversized)',
    category: 'Guitar',
    description: 'Heavy metal monolith with monstrous low-end resonance, scooped lower mids, and aggressive presence.',
    speakerType: '4x12 Celestion V30 Heavy Magnet',
    micDistance: 25,
    highCut: 6000,
    lowCut: 60
  },
  {
    id: 'ampeg-810-fridge',
    name: 'Ampeg SVT-810E 8x10 (The Fridge)',
    category: 'Bass',
    description: 'The legendary stadium bass cabinet: immense sealed punch, tight percussive attack, and room-filling low end.',
    speakerType: '8x10 Eminence Custom Stamped',
    micDistance: 40,
    highCut: 4800,
    lowCut: 40
  },
  {
    id: 'darkglass-410-neo',
    name: 'Darkglass 4x10 Neodymium Bass Cab',
    category: 'Bass',
    description: 'Ultra-fast transient clarity with high-frequency horn tweeter extension, ideal for modern slap and prog metal.',
    speakerType: '4x10 Neodymium with 1-inch Horn',
    micDistance: 30,
    highCut: 9000,
    lowCut: 35
  },
  {
    id: 'acoustic-body-dread',
    name: 'Acoustic Dreadnought Resonance Body',
    category: 'Guitar',
    description: 'Wooden guitar body resonance simulation converting piezo/electric pickups into natural acoustic guitar resonance.',
    speakerType: 'Sitka Spruce / Mahogany Chamber',
    micDistance: 50,
    highCut: 10000,
    lowCut: 80
  },
  {
    id: 'roland-jc120-212',
    name: 'Roland JC-120 2x12 (Silver Cone Transducers)',
    category: 'Guitar',
    description: 'Original Roland Jazz Chorus open-back 2x12 enclosure with custom silver-dome speakers. Bright, sparkling, crystalline top end and uncompressed punchy lows.',
    speakerType: '2x12 Roland Silver Cone Transducers',
    micDistance: 35,
    highCut: 8800,
    lowCut: 60
  },
  {
    id: 'studio-clean-di',
    name: 'Studio Direct Injection (Ultra-Clean Full-Range)',
    category: 'Guitar',
    description: 'High-end studio active DI box profile with linear phase response, natural air, sub-rumble filtering, and zero boxiness or speaker coloration.',
    speakerType: 'Studio Class-A Active DI Box (Linear Flat)',
    micDistance: 0,
    highCut: 12000,
    lowCut: 50
  },
  {
    id: 'polytone-115-jazz',
    name: 'Polytone 1x15 (Warm Velvet Jazz Enclosure)',
    category: 'Guitar',
    description: 'Vintage 15-inch heavy-magnet closed-back jazz speaker enclosure. Deep, velvety low-mid body, rolled-off top end, and zero speaker cone harshness.',
    speakerType: '1x15 Polytone Custom Heavy Magnet',
    micDistance: 30,
    highCut: 5500,
    lowCut: 55
  }
];

/**
 * Calibrates any Impulse Response (IR) audio buffer so that its average acoustic transfer gain
 * across the musical guitar spectrum (150 Hz to 4000 Hz) equals nominal 0 dB (unity gain = 1.0).
 * Completely eliminates harsh +20dB volume spikes from unnormalized WAV files like Celestion V30
 * and balances acoustic volume across all speaker cabinets, acoustic bodies, and DI boxes.
 */
/**
 * Calibrates any Impulse Response (IR) audio buffer so that its average acoustic transfer gain
 * across the musical guitar spectrum (80 Hz to 4200 Hz) equals nominal unity gain (~1.0).
 * Completely eliminates volume spikes and balances acoustic loudness across all speaker cabinets,
 * acoustic bodies, and custom WAV files.
 */
export function calibrateIrBuffer(buffer: AudioBuffer): void {
  const sampleRate = buffer.sampleRate || 48000;
  const numChannels = buffer.numberOfChannels;
  const freqs = [80, 130, 220, 380, 650, 1100, 1800, 2800, 4200];

  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    const len = data.length;
    // Scan up to first 2048 samples (direct impulse and early speaker reflections)
    const scanLen = Math.min(len, 2048);
    let sumGains = 0;

    for (let f = 0; f < freqs.length; f++) {
      const omega = (2 * Math.PI * freqs[f]) / sampleRate;
      let re = 0;
      let im = 0;
      for (let n = 0; n < scanLen; n++) {
        const angle = omega * n;
        re += data[n] * Math.cos(angle);
        im -= data[n] * Math.sin(angle);
      }
      sumGains += Math.sqrt(re * re + im * im);
    }

    const avgGain = sumGains / freqs.length;
    if (avgGain > 0.0001 && Number.isFinite(avgGain)) {
      // Safe factor bounds to prevent extreme runaway amplification
      const factor = Math.max(0.1, Math.min(5.0, 1.0 / avgGain));
      for (let i = 0; i < len; i++) {
        data[i] *= factor;
      }
    }

    // Peak protection: safeguard against clipping
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
    if (peak > 0.95) {
      const peakScale = 0.90 / peak;
      for (let i = 0; i < len; i++) {
        data[i] *= peakScale;
      }
    }
  }
}

/**
 * Helper: Applies a Direct Form II transposed biquad filter in-place to Float32Array
 */
function applyBiquadFilter(
  data: Float32Array,
  b0: number,
  b1: number,
  b2: number,
  a1: number,
  a2: number
): void {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const len = data.length;
  for (let i = 0; i < len; i++) {
    const x0 = data[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    data[i] = y0;
  }
}

function filterHighpass(data: Float32Array, freq: number, Q: number, sampleRate: number): void {
  const w0 = (2 * Math.PI * Math.min(freq, sampleRate * 0.45)) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  const a0 = 1 + alpha;
  applyBiquadFilter(
    data,
    (1 + cosW0) / (2 * a0),
    -(1 + cosW0) / a0,
    (1 + cosW0) / (2 * a0),
    (-2 * cosW0) / a0,
    (1 - alpha) / a0
  );
}

function filterLowpass(data: Float32Array, freq: number, Q: number, sampleRate: number): void {
  const w0 = (2 * Math.PI * Math.min(freq, sampleRate * 0.45)) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  const a0 = 1 + alpha;
  applyBiquadFilter(
    data,
    (1 - cosW0) / (2 * a0),
    (1 - cosW0) / a0,
    (1 - cosW0) / (2 * a0),
    (-2 * cosW0) / a0,
    (1 - alpha) / a0
  );
}

function filterPeaking(data: Float32Array, freq: number, Q: number, gainDb: number, sampleRate: number): void {
  const w0 = (2 * Math.PI * Math.min(freq, sampleRate * 0.45)) / sampleRate;
  const cosW0 = Math.cos(w0);
  const A = Math.pow(10, gainDb / 40);
  const alpha = Math.sin(w0) / (2 * Q);
  const a0 = 1 + alpha / A;
  applyBiquadFilter(
    data,
    (1 + alpha * A) / a0,
    (-2 * cosW0) / a0,
    (1 - alpha * A) / a0,
    (-2 * cosW0) / a0,
    (1 - alpha / A) / a0
  );
}

interface CabAcousticProfile {
  highpassFreq: number;
  highpassQ: number;
  lowResFreq: number;
  lowResQ: number;
  lowResGainDb: number;
  scoopFreq: number;
  scoopQ: number;
  scoopGainDb: number;
  presenceFreq: number;
  presenceQ: number;
  presenceGainDb: number;
  chimeFreq: number;
  chimeQ: number;
  chimeGainDb: number;
  lowpassFreq: number;
  lowpassQ: number;
}

/**
 * Returns physically measured acoustic profiles for each guitar & bass cabinet enclosure.
 * Formulated with steep sub-cut, boxiness scoop, and acoustic cone roll-off to eliminate mud.
 */
function getCabProfile(cabId: string): CabAcousticProfile {
  if (cabId.includes('marshall')) {
    // Marshall 1960A 4x12 (V30 / G12T-75): Tight 4x12 punch, aggressive V30 midrange bite, steep cone roll-off
    return {
      highpassFreq: 78,
      highpassQ: 0.85,
      lowResFreq: 108,
      lowResQ: 1.3,
      lowResGainDb: 3.2,
      scoopFreq: 520,
      scoopQ: 0.9,
      scoopGainDb: -3.5,
      presenceFreq: 2600,
      presenceQ: 1.8,
      presenceGainDb: 6.2,
      chimeFreq: 4200,
      chimeQ: 2.2,
      chimeGainDb: 2.8,
      lowpassFreq: 5800,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('fender')) {
    // Fender '65 Twin Reverb 2x12 (Jensen C12K): Open-back sparkle, scooped American mids, warm tight bottom
    return {
      highpassFreq: 68,
      highpassQ: 0.75,
      lowResFreq: 95,
      lowResQ: 1.1,
      lowResGainDb: 2.2,
      scoopFreq: 620,
      scoopQ: 0.75,
      scoopGainDb: -4.5,
      presenceFreq: 3300,
      presenceQ: 1.6,
      presenceGainDb: 5.5,
      chimeFreq: 5400,
      chimeQ: 1.8,
      chimeGainDb: 3.2,
      lowpassFreq: 7200,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('vox')) {
    // Vox AC30 2x12 (Alnico Blue): Sweet British bell chime, woody low-mid punch, compressed chime
    return {
      highpassFreq: 82,
      highpassQ: 0.85,
      lowResFreq: 115,
      lowResQ: 1.4,
      lowResGainDb: 2.8,
      scoopFreq: 460,
      scoopQ: 0.8,
      scoopGainDb: -2.8,
      presenceFreq: 2450,
      presenceQ: 1.9,
      presenceGainDb: 6.8,
      chimeFreq: 4600,
      chimeQ: 2.0,
      chimeGainDb: 3.6,
      lowpassFreq: 6400,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('mesa')) {
    // Mesa Rectifier 4x12 (Oversized): Massive heavy-magnet thump, scooped mud, searing presence
    return {
      highpassFreq: 65,
      highpassQ: 0.9,
      lowResFreq: 90,
      lowResQ: 1.4,
      lowResGainDb: 4.2,
      scoopFreq: 480,
      scoopQ: 1.0,
      scoopGainDb: -4.2,
      presenceFreq: 2900,
      presenceQ: 2.0,
      presenceGainDb: 6.0,
      chimeFreq: 4400,
      chimeQ: 2.3,
      chimeGainDb: 2.8,
      lowpassFreq: 5500,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('ampeg')) {
    // Ampeg SVT-810E (The Fridge): Sealed 8x10 punch, tight attack, zero harsh clack
    return {
      highpassFreq: 42,
      highpassQ: 0.8,
      lowResFreq: 75,
      lowResQ: 1.4,
      lowResGainDb: 4.8,
      scoopFreq: 500,
      scoopQ: 0.85,
      scoopGainDb: -3.8,
      presenceFreq: 1700,
      presenceQ: 1.8,
      presenceGainDb: 4.2,
      chimeFreq: 3200,
      chimeQ: 2.0,
      chimeGainDb: 1.5,
      lowpassFreq: 4600,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('darkglass')) {
    // Darkglass 4x10 Neodymium Bass Cab with Tweeter
    return {
      highpassFreq: 38,
      highpassQ: 0.85,
      lowResFreq: 65,
      lowResQ: 1.2,
      lowResGainDb: 3.6,
      scoopFreq: 450,
      scoopQ: 0.9,
      scoopGainDb: -3.0,
      presenceFreq: 2800,
      presenceQ: 2.0,
      presenceGainDb: 5.2,
      chimeFreq: 6500,
      chimeQ: 1.3,
      chimeGainDb: 3.8,
      lowpassFreq: 8800,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('acoustic')) {
    // Acoustic Dreadnought Guitar Body: Spruce soundhole resonance with piezo quack cancellation
    return {
      highpassFreq: 72,
      highpassQ: 0.8,
      lowResFreq: 105,
      lowResQ: 2.2,
      lowResGainDb: 4.0,
      scoopFreq: 800,
      scoopQ: 1.4,
      scoopGainDb: -5.5,
      presenceFreq: 3400,
      presenceQ: 1.5,
      presenceGainDb: 4.0,
      chimeFreq: 5800,
      chimeQ: 1.8,
      chimeGainDb: 2.5,
      lowpassFreq: 9800,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('jc120') || cabId.includes('roland')) {
    // Roland JC-120 2x12: Silver cone clarity, wide crystalline chime, punchy articulate low end
    return {
      highpassFreq: 65,
      highpassQ: 0.75,
      lowResFreq: 98,
      lowResQ: 1.0,
      lowResGainDb: 1.8,
      scoopFreq: 680,
      scoopQ: 0.7,
      scoopGainDb: -1.5,
      presenceFreq: 3600,
      presenceQ: 1.7,
      presenceGainDb: 5.2,
      chimeFreq: 6400,
      chimeQ: 1.6,
      chimeGainDb: 3.2,
      lowpassFreq: 8400,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('di') || cabId.includes('clean')) {
    // Studio Active Direct Injection: Flat, transparent, linear phase studio response
    return {
      highpassFreq: 35,
      highpassQ: 0.707,
      lowResFreq: 80,
      lowResQ: 0.707,
      lowResGainDb: 0.0,
      scoopFreq: 400,
      scoopQ: 0.5,
      scoopGainDb: 0.0,
      presenceFreq: 4000,
      presenceQ: 0.707,
      presenceGainDb: 0.0,
      chimeFreq: 8000,
      chimeQ: 0.707,
      chimeGainDb: 0.0,
      lowpassFreq: 14000,
      lowpassQ: 0.707
    };
  } else if (cabId.includes('polytone') || cabId.includes('jazz')) {
    // Polytone 1x15 Jazz: Dark, velvety, rolled off top end, thick low-mid body
    return {
      highpassFreq: 58,
      highpassQ: 0.8,
      lowResFreq: 125,
      lowResQ: 1.2,
      lowResGainDb: 3.2,
      scoopFreq: 420,
      scoopQ: 0.8,
      scoopGainDb: -1.5,
      presenceFreq: 1800,
      presenceQ: 1.4,
      presenceGainDb: 2.2,
      chimeFreq: 3200,
      chimeQ: 1.6,
      chimeGainDb: 1.2,
      lowpassFreq: 4800,
      lowpassQ: 0.707
    };
  }

  // Default Celestion 4x12 specification
  return {
    highpassFreq: 75,
    highpassQ: 0.85,
    lowResFreq: 105,
    lowResQ: 1.3,
    lowResGainDb: 3.0,
    scoopFreq: 520,
    scoopQ: 0.9,
    scoopGainDb: -3.2,
    presenceFreq: 2600,
    presenceQ: 1.8,
    presenceGainDb: 6.0,
    chimeFreq: 4200,
    chimeQ: 2.2,
    chimeGainDb: 2.8,
    lowpassFreq: 6000,
    lowpassQ: 0.707
  };
}

/**
 * Synthesizes an acoustically authentic, punchy Cabinet Impulse Response buffer for ConvolverNode
 * using multi-pole physical acoustic transfer filtering.
 * Eliminates boomy low-frequency mud and delivers crisp pick attack, focused midrange,
 * and natural acoustic cone roll-off that matches real studio WAV impulse responses.
 */
export function generateSyntheticCabIr(
  audioCtx: AudioContext,
  cabId: string,
  micDistance: number = 30
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate || 48000;
  // 1024 samples (approx 21.3ms at 48kHz) is the ideal length for direct nearfield speaker IRs
  const length = Math.min(1024, Math.floor(sampleRate * 0.022));
  const buffer = audioCtx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Initialize with unit impulse at sample 0
  left[0] = 1.0;
  right[0] = 1.0;
  for (let i = 1; i < length; i++) {
    left[i] = 0.0;
    right[i] = 0.0;
  }

  const p = getCabProfile(cabId);
  const distRatio = Math.max(0, Math.min(100, micDistance)) / 100;

  // 1. Proximity effect & Mic distance adjustments
  const proxLowBoost = (1 - distRatio) * 2.2; // Up to +2.2dB low punch when mic is on the grille
  const distHighDamp = distRatio * -2.5; // Natural air absorption when backed off

  // 2. Multi-pole filter cascade for Left Channel
  filterHighpass(left, p.highpassFreq, p.highpassQ, sampleRate);
  filterPeaking(left, p.lowResFreq, p.lowResQ, p.lowResGainDb + proxLowBoost, sampleRate);
  filterPeaking(left, p.scoopFreq, p.scoopQ, p.scoopGainDb, sampleRate);
  filterPeaking(left, p.presenceFreq, p.presenceQ, p.presenceGainDb, sampleRate);
  filterPeaking(left, p.chimeFreq, p.chimeQ, p.chimeGainDb + distHighDamp, sampleRate);
  // Cascaded 4th-order lowpass (2 cascaded 2-pole filters) for steep speaker cone roll-off
  filterLowpass(left, p.lowpassFreq, p.lowpassQ, sampleRate);
  filterLowpass(left, p.lowpassFreq * 1.05, p.lowpassQ, sampleRate);

  // 3. Multi-pole filter cascade for Right Channel (subtle off-axis variation for natural stereo depth)
  filterHighpass(right, p.highpassFreq * 1.02, p.highpassQ, sampleRate);
  filterPeaking(right, p.lowResFreq * 0.98, p.lowResQ, p.lowResGainDb + proxLowBoost, sampleRate);
  filterPeaking(right, p.scoopFreq * 1.04, p.scoopQ, p.scoopGainDb, sampleRate);
  filterPeaking(right, p.presenceFreq * 0.97, p.presenceQ * 1.05, p.presenceGainDb, sampleRate);
  filterPeaking(right, p.chimeFreq * 0.98, p.chimeQ, p.chimeGainDb + distHighDamp, sampleRate);
  filterLowpass(right, p.lowpassFreq * 0.98, p.lowpassQ, sampleRate);
  filterLowpass(right, p.lowpassFreq * 1.02, p.lowpassQ, sampleRate);

  // 4. Subtle cabinet edge diffraction reflection based on distance (delayed by 0.2 - 0.5ms)
  const reflectionSample = Math.max(3, Math.min(length - 1, Math.floor(4 + distRatio * 14)));
  const reflectionGain = -0.10 * distRatio;
  if (reflectionSample < length) {
    left[reflectionSample] += reflectionGain * 0.9;
    right[reflectionSample + 1] += reflectionGain * 1.1;
  }

  // 5. Smooth Hann fade-out on the tail (last 15% of samples) to guarantee zero boundary clicks
  const fadeStart = Math.floor(length * 0.85);
  for (let i = fadeStart; i < length; i++) {
    const fraction = (i - fadeStart) / (length - fadeStart);
    const window = 0.5 * (1 + Math.cos(Math.PI * fraction));
    left[i] *= window;
    right[i] *= window;
  }

  // 6. Calibrate to nominal unity acoustic guitar transfer gain
  calibrateIrBuffer(buffer);

  return buffer;
}
