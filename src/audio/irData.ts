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
export function calibrateIrBuffer(buffer: AudioBuffer): void {
  const sampleRate = buffer.sampleRate || 48000;
  const numChannels = buffer.numberOfChannels;
  const freqs = [150, 250, 400, 650, 1000, 1600, 2500, 3500];

  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    const len = data.length;
    let sumGains = 0;

    for (let f = 0; f < freqs.length; f++) {
      const omega = (2 * Math.PI * freqs[f]) / sampleRate;
      let re = 0;
      let im = 0;
      for (let n = 0; n < len; n++) {
        const angle = omega * n;
        re += data[n] * Math.cos(angle);
        im -= data[n] * Math.sin(angle);
      }
      sumGains += Math.sqrt(re * re + im * im);
    }

    const avgGain = sumGains / freqs.length;
    if (avgGain > 0.0001 && Number.isFinite(avgGain)) {
      const factor = 1.0 / avgGain;
      for (let i = 0; i < len; i++) {
        data[i] *= factor;
      }
    }
  }
}

/**
 * Synthesizes an acoustically authentic Cabinet Impulse Response buffer for ConvolverNode
 * with immediate sample 0 peak and calibrated decay so volume remains punchy and loud.
 */
export function generateSyntheticCabIr(
  audioCtx: AudioContext,
  cabId: string,
  micDistance: number = 30
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const length = Math.floor(sampleRate * 0.05); // 50ms impulse response (standard IR size)
  const buffer = audioCtx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Cabinet-specific acoustic parameters
  let resonanceFreq = 110;
  let midQFreq = 2200;
  let decayRate = 55;
  let coneHarshness = 0.4;

  if (cabId.includes('marshall')) {
    resonanceFreq = 95;
    midQFreq = 2400;
    decayRate = 60;
    coneHarshness = 0.5;
  } else if (cabId.includes('fender')) {
    resonanceFreq = 85;
    midQFreq = 1800;
    decayRate = 45;
    coneHarshness = 0.35;
  } else if (cabId.includes('ampeg')) {
    resonanceFreq = 65;
    midQFreq = 1200;
    decayRate = 40;
    coneHarshness = 0.25;
  } else if (cabId.includes('mesa')) {
    resonanceFreq = 80;
    midQFreq = 2800;
    decayRate = 65;
    coneHarshness = 0.55;
  } else if (cabId.includes('vox')) {
    resonanceFreq = 105;
    midQFreq = 2600;
    decayRate = 50;
    coneHarshness = 0.45;
  } else if (cabId.includes('darkglass')) {
    resonanceFreq = 55;
    midQFreq = 3200;
    decayRate = 48;
    coneHarshness = 0.3;
  } else if (cabId.includes('acoustic')) {
    resonanceFreq = 102;
    midQFreq = 1500;
    decayRate = 35;
    coneHarshness = 0.2;
  } else if (cabId.includes('jc120') || cabId.includes('roland')) {
    resonanceFreq = 90;
    midQFreq = 3400; // Sparkling open silver cone chime
    decayRate = 42;
    coneHarshness = 0.22; // Very low distortion/harshness, smooth linear response
  } else if (cabId.includes('di') || cabId.includes('clean')) {
    resonanceFreq = 70;
    midQFreq = 4000;
    decayRate = 30;
    coneHarshness = 0.1; // Pristine flat response
  } else if (cabId.includes('polytone') || cabId.includes('jazz')) {
    resonanceFreq = 80;
    midQFreq = 1600;
    decayRate = 38;
    coneHarshness = 0.15; // Smooth dark jazz response
  }

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-decayRate * t);

    // Immediate direct speaker cone pulse at sample 0 preserves transient attack and unity gain
    const directImpulse = i === 0 ? 1.0 : i === 1 ? 0.3 : 0.0;

    // Speaker cone & enclosure air cavity resonances
    const mode1 = Math.sin(2 * Math.PI * resonanceFreq * t) * 0.35;
    const mode2 = Math.sin(2 * Math.PI * midQFreq * t) * coneHarshness * 0.25;
    const mode3 = Math.sin(2 * Math.PI * (resonanceFreq * 2.1) * t) * 0.15;

    const sampleL = (directImpulse * 0.85 + (mode1 + mode2 + mode3) * env) * 0.75;
    const sampleR = (directImpulse * 0.85 + (mode1 * 0.95 + mode2 * 1.05 + mode3 * 0.9) * env) * 0.75;

    left[i] = sampleL;
    right[i] = sampleR;
  }

  // Energy/Peak Normalization to ensure unity insertion gain without level boosting
  let maxAbs = 0;
  for (let i = 0; i < length; i++) {
    const aL = Math.abs(left[i]);
    const aR = Math.abs(right[i]);
    if (aL > maxAbs) maxAbs = aL;
    if (aR > maxAbs) maxAbs = aR;
  }
  if (maxAbs > 0.001) {
    const targetPeak = 0.70;
    const scale = targetPeak / maxAbs;
    for (let i = 0; i < length; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }
  }

  // Final guitar-frequency unity gain calibration
  calibrateIrBuffer(buffer);

  return buffer;
}
