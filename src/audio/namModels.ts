import { NamModelConfig } from '../types/pedal';

/**
 * Helper to determine if an amp config is a real Neural Amp Modeler (NAM) profile
 * with neural network weights that must run via the WASM NAM engine.
 */
export function isNamModelProfile(model?: NamModelConfig | null): boolean {
  if (!model) return false;
  return Boolean(
    model.isRealNam ||
    model.modelUrl ||
    model.customProfileName ||
    model.rawJson ||
    model.id === 'ac10' ||
    model.id === 'deluxe'
  );
}

export const BUILT_IN_NAM_MODELS: NamModelConfig[] = [
  {
    id: 'ac10',
    name: 'Vox AC10 Custom (Real NAM)',
    category: 'Guitar',
    description: 'Real Neural Amp Modeler WaveNet profile: authentic British tube chime, EL84 power sag, and jangly top-boost bite.',
    type: 'wavenet',
    gain: 5.5,
    bass: 5.8,
    mid: 6.5,
    treble: 6.8,
    presence: 6.2,
    master: 7.5,
    saturationCurve: 2.8,
    bias: 0.08,
    weightsCount: 28440,
    modelUrl: '/models/ac10.nam',
    isRealNam: true,
    engineMode: 'wasm-nam',
    inputTrim: -8.0
  },
  {
    id: 'deluxe',
    name: "Fender '65 Deluxe Reverb (Real NAM)",
    category: 'Guitar',
    description: 'Real Neural Amp Modeler WaveNet profile: legendary blackface crystalline cleans, 6V6 tube bloom, and dynamic touch sensitivity.',
    type: 'wavenet',
    gain: 4.8,
    bass: 6.2,
    mid: 5.2,
    treble: 7.0,
    presence: 5.8,
    master: 8.0,
    saturationCurve: 2.2,
    bias: 0.06,
    weightsCount: 28440,
    modelUrl: '/models/deluxe.nam',
    isRealNam: true,
    engineMode: 'wasm-nam',
    inputTrim: -8.0
  },
  {
    id: 'slo-100',
    name: 'Soldano SLO-100 Lead',
    category: 'Guitar',
    description: 'Legendary boutique high-gain tube amp with articulate harmonic saturation and searing lead sustain.',
    type: 'wavenet',
    gain: 6.8,
    bass: 5.5,
    mid: 6.2,
    treble: 6.8,
    presence: 7.0,
    master: 7.5,
    saturationCurve: 3.8,
    bias: 0.12,
    weightsCount: 28440,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'jcm-800',
    name: 'Marshall JCM800 2203',
    category: 'Guitar',
    description: 'The definitive British rock roar: punchy upper mids, aggressive bite, and tight low-end crunch.',
    type: 'lstm',
    gain: 5.8,
    bass: 6.0,
    mid: 7.5,
    treble: 6.5,
    presence: 6.2,
    master: 7.0,
    saturationCurve: 3.2,
    bias: 0.08,
    weightsCount: 16384,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'tweed-59',
    name: "Fender '59 Tweed Bassman",
    category: 'Guitar',
    description: 'Vintage American warm clean tone with rich harmonic bloom and organic touch-sensitive breakup.',
    type: 'neural',
    gain: 3.8,
    bass: 6.5,
    mid: 5.0,
    treble: 5.8,
    presence: 5.2,
    master: 8.0,
    saturationCurve: 1.8,
    bias: 0.04,
    weightsCount: 12288,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'pv-5150',
    name: 'Peavey 5150 Block Letter',
    category: 'Guitar',
    description: 'Aggressive modern high-gain metal titan with blistering palm-mute chug and saturated harmonics.',
    type: 'wavenet',
    gain: 7.5,
    bass: 6.8,
    mid: 4.5,
    treble: 7.2,
    presence: 7.8,
    master: 6.5,
    saturationCurve: 4.5,
    bias: 0.15,
    weightsCount: 32768,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'ampeg-svt',
    name: 'Ampeg SVT-CL Bass Tube',
    category: 'Bass',
    description: 'The undisputed 300W all-tube bass stadium monolith. Colossal foundation, punchy growl, and fat grit.',
    type: 'lstm',
    gain: 5.0,
    bass: 7.5,
    mid: 6.0,
    treble: 4.8,
    presence: 5.5,
    master: 8.0,
    saturationCurve: 2.6,
    bias: 0.06,
    weightsCount: 18432,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'darkglass-b7k',
    name: 'Darkglass Microtubes B7K',
    category: 'Bass',
    description: 'Modern progressive bass preamp with ultra-clean sub-bass articulation and razor-sharp distortion.',
    type: 'neural',
    gain: 6.2,
    bass: 6.8,
    mid: 7.0,
    treble: 7.4,
    presence: 6.8,
    master: 7.2,
    saturationCurve: 3.4,
    bias: 0.1,
    weightsCount: 14336,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'vox-ac30',
    name: 'Vox AC30 Top Boost',
    category: 'Guitar',
    description: 'Jangly British chime with sparkling highs, bell-like clarity, and smooth class-A EL84 compression.',
    type: 'neural',
    gain: 4.2,
    bass: 5.0,
    mid: 6.5,
    treble: 7.8,
    presence: 6.0,
    master: 7.5,
    saturationCurve: 2.2,
    bias: 0.05,
    weightsCount: 12288,
    isRealNam: false,
    engineMode: 'hd-triode'
  },
  {
    id: 'roland-jc120',
    name: 'Roland Jazz Chorus JC-120 (Solid State Clean)',
    category: 'Guitar',
    description: 'The definitive benchmark for ultra-clean guitar amplification. Pure crystal-clear solid-state headroom with zero breakup, sparkling chime, and legendary stereo chorus voicing.',
    type: 'neural',
    gain: 2.2,
    bass: 5.4,
    mid: 5.0,
    treble: 6.5,
    presence: 6.8,
    master: 8.0,
    saturationCurve: 1.0,
    bias: 0.0,
    weightsCount: 16384,
    isRealNam: false,
    engineMode: 'waveshaper'
  },
  {
    id: 'twin-reverb-ultraclean',
    name: "Fender '65 Twin Reverb (Ultra Clean Headroom)",
    category: 'Guitar',
    description: 'Iconic 100W all-tube American giant with immense clean headroom. High dynamic punch, crystalline open highs, tight low end, and zero unwanted preamp clipping.',
    type: 'neural',
    gain: 2.5,
    bass: 5.8,
    mid: 4.8,
    treble: 6.8,
    presence: 6.0,
    master: 8.2,
    saturationCurve: 1.2,
    bias: 0.02,
    weightsCount: 16384,
    isRealNam: false,
    engineMode: 'waveshaper'
  },
  {
    id: 'hiwatt-dr103',
    name: 'Hiwatt Custom 100 DR103 (Bold British Clean)',
    category: 'Guitar',
    description: 'David Gilmour & Pete Townshend high-headroom benchmark. Massive Partridge transformer clean punch, uncompressed articulate dynamics, and ringing clarity.',
    type: 'neural',
    gain: 2.8,
    bass: 6.0,
    mid: 6.2,
    treble: 6.5,
    presence: 6.4,
    master: 8.0,
    saturationCurve: 1.3,
    bias: 0.03,
    weightsCount: 16384,
    isRealNam: false,
    engineMode: 'waveshaper'
  },
  {
    id: 'studio-acoustic-di',
    name: 'Studio Acoustic Preamp & Active DI (Ultra Clean)',
    category: 'Guitar',
    description: 'Pristine Class-A FET acoustic guitar preamp with 100% linear frequency response, anti-feedback notch, and studio DI clarity for acoustic and clean jazz guitars.',
    type: 'neural',
    gain: 2.0,
    bass: 5.0,
    mid: 5.0,
    treble: 5.5,
    presence: 5.0,
    master: 8.5,
    saturationCurve: 1.0,
    bias: 0.0,
    weightsCount: 8192,
    isRealNam: false,
    engineMode: 'waveshaper'
  },
  {
    id: 'polytone-mini-brute',
    name: 'Polytone Mini-Brute (Velvet Jazz Clean)',
    category: 'Guitar',
    description: 'The definitive jazz guitar amplifier (Joe Pass / George Benson). Warm, dark, velvety solid-state clean tone with zero distortion and rich woody low-mids.',
    type: 'neural',
    gain: 2.2,
    bass: 6.8,
    mid: 4.6,
    treble: 4.2,
    presence: 4.0,
    master: 8.2,
    saturationCurve: 1.0,
    bias: 0.0,
    weightsCount: 12288,
    isRealNam: false,
    engineMode: 'waveshaper'
  }
];

export interface ParsedNamFile {
  name: string;
  architecture: 'neural' | 'lstm' | 'wavenet';
  weightsCount: number;
  sampleRate: number;
  rawJson?: any;
  loudness?: number;
}

/**
 * Parses user-uploaded .nam file JSON format according to NAM specifications
 */
export function parseNamJson(fileContent: string, fileName: string): ParsedNamFile {
  try {
    const data = JSON.parse(fileContent);
    const archName = (data.architecture || data.model?.architecture || 'WaveNet').toLowerCase();
    
    let archType: 'neural' | 'lstm' | 'wavenet' = 'neural';
    if (archName.includes('lstm')) {
      archType = 'lstm';
    } else if (archName.includes('wavenet')) {
      archType = 'wavenet';
    }

    let weightsCount = 10000;
    if (Array.isArray(data.weights)) {
      weightsCount = data.weights.length;
    } else if (data.config && typeof data.config === 'object') {
      weightsCount = JSON.stringify(data.config).length * 4;
    }

    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const loudness = typeof data.metadata?.loudness === 'number' ? data.metadata.loudness : undefined;

    return {
      name: cleanName || data.name || 'Custom NAM Profile',
      architecture: archType,
      weightsCount: Math.max(weightsCount, 8192),
      sampleRate: data.sample_rate || 48000,
      rawJson: data,
      loudness
    };
  } catch {
    // If not strict JSON, support text representation or fallback
    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return {
      name: cleanName || 'Custom Profile',
      architecture: 'wavenet',
      weightsCount: 16384,
      sampleRate: 48000
    };
  }
}
