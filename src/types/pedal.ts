export type PedalType =
  | 'overdrive'
  | 'distortion'
  | 'fuzz'
  | 'compressor'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'tremolo'
  | 'delay'
  | 'reverb'
  | 'eq'
  | 'noiseGate'
  | 'autoWah'
  | 'pitchShifter'
  | 'harmonizer'
  | 'vocalTuner'
  | 'vocalDoubler'
  | 'deEsser'
  | 'telephoneVoice'
  | 'vocalFormant'
  | 'vocalHarmony'
  | 'vocalPreamp'
  | 'vocalStutter'
  | 'vocalAlien'
  | 'granularCloud'
  | 'arcadeSynth'
  | 'spectralFreeze'
  | 'tapeGlitch'
  | 'uniVibe'
  | 'harmonicTremolo'
  | 'slowGear'
  | 'klonOverdrive'
  | 'multiOctave'
  | 'talkingWah'
  | 'reverseReverb'
  | 'crystalDelay'
  | 'hardTune'
  | 'lofiVinyl'
  | 'dualNotch';


export interface BasePedalConfig {
  id: string;
  type: PedalType;
  name: string;
  enabled: boolean;
  color: string;
  textColor?: string;
  accentColor?: string;
}

export interface OverdrivePedal extends BasePedalConfig {
  type: 'overdrive';
  drive: number; // 0 - 100
  tone: number; // 0 - 100
  level: number; // 0 - 100
  bassBoost?: boolean;
}

export interface DistortionPedal extends BasePedalConfig {
  type: 'distortion';
  gain: number; // 0 - 100
  filter: number; // 0 - 100
  volume: number; // 0 - 100
  vintageMode?: boolean;
}

export interface FuzzPedal extends BasePedalConfig {
  type: 'fuzz';
  fuzz: number; // 0 - 100
  tone: number; // 0 - 100
  volume: number; // 0 - 100
  scoop: number; // 0 - 100
}

export interface CompressorPedal extends BasePedalConfig {
  type: 'compressor';
  sustain: number; // 0 - 100
  attack: number; // 0 - 100
  level: number; // 0 - 100
  blend: number; // 0 - 100
}

export interface ChorusPedal extends BasePedalConfig {
  type: 'chorus';
  rate: number; // 0 - 100
  depth: number; // 0 - 100
  mix: number; // 0 - 100
  tone: number; // 0 - 100
}

export interface FlangerPedal extends BasePedalConfig {
  type: 'flanger';
  rate: number; // 0 - 100
  depth: number; // 0 - 100
  feedback: number; // 0 - 100
  manual: number; // 0 - 100
}

export interface PhaserPedal extends BasePedalConfig {
  type: 'phaser';
  speed: number; // 0 - 100
  depth: number; // 0 - 100
  feedback: number; // 0 - 100
  stages: 4 | 8;
}

export interface TremoloPedal extends BasePedalConfig {
  type: 'tremolo';
  speed: number; // 0 - 100
  depth: number; // 0 - 100
  waveform: 'sine' | 'square' | 'triangle';
}

export interface DelayPedal extends BasePedalConfig {
  type: 'delay';
  time: number; // 10 - 1000 ms
  feedback: number; // 0 - 100
  mix: number; // 0 - 100
  flutter: number; // 0 - 100
  pingPong: boolean;
}

export interface ReverbPedal extends BasePedalConfig {
  type: 'reverb';
  decay: number; // 0 - 100
  preDelay: number; // 0 - 100 ms
  mix: number; // 0 - 100
  damping: number; // 0 - 100
  shimmer: boolean;
  roomType: 'spring' | 'plate' | 'hall';
}

export interface EqPedal extends BasePedalConfig {
  type: 'eq';
  band100: number; // -15 to +15 dB
  band200: number;
  band400: number;
  band800: number;
  band1600: number;
  band3200: number;
  band6400: number;
  level: number; // -15 to +15 dB
}

export interface NoiseGatePedal extends BasePedalConfig {
  type: 'noiseGate';
  threshold: number; // -80 to 0 dB
  release: number; // 10 to 500 ms
}

export interface AutoWahPedal extends BasePedalConfig {
  type: 'autoWah';
  sensitivity: number; // 0 - 100
  range: number; // 0 - 100
  resonance: number; // 0 - 100
  mode: 'envelope' | 'lfo';
}

export interface PitchShifterPedal extends BasePedalConfig {
  type: 'pitchShifter';
  shift: number; // -24 to +24 semitones
  detune: number; // -50 to +50 cents
  mix: number; // 0 - 100
  octaveBlend: boolean;
  trackingMode?: 'auto' | 'poly' | 'mono';
  tone?: number; // 0 - 100
}

export interface HarmonizerPedal extends BasePedalConfig {
  type: 'harmonizer';
  key: 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
  scale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic';
  interval: '3rd' | '5th' | '6th' | 'octave' | 'double_octave';
  harmonyLevel: number; // 0 - 100
  directLevel: number; // 0 - 100
}

export interface VocalTunerPedal extends BasePedalConfig {
  type: 'vocalTuner';
  key: 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
  scale: 'chromatic' | 'major' | 'minor' | 'pentatonic' | 'blues';
  speed: number; // 0 - 100 (0 = natural slow glide, 100 = hard robotic auto-tune snap)
  correction: number; // 0 - 100
  humanize: number; // 0 - 100
  mix: number; // 0 - 100
}

export interface VocalDoublerPedal extends BasePedalConfig {
  type: 'vocalDoubler';
  detune: number; // 0 - 100 (micro-pitch detune cents)
  spread: number; // 0 - 100 (stereo width)
  delay: number; // 10 - 60 ms
  depth: number; // 0 - 100 (human pitch/time drift)
  mix: number; // 0 - 100
}

export interface DeEsserPedal extends BasePedalConfig {
  type: 'deEsser';
  frequency: number; // 3000 - 9000 Hz
  threshold: number; // -60 to 0 dB
  reduction: number; // 0 - 100%
  listen: boolean; // audition sibilance band
  bandwidth: 'narrow' | 'wide';
}

export interface TelephoneVoicePedal extends BasePedalConfig {
  type: 'telephoneVoice';
  mode: 'telephone' | 'megaphone' | 'radio' | 'gramophone';
  drive: number; // 0 - 100
  filter: number; // 0 - 100
  noise: number; // 0 - 100
  mix: number; // 0 - 100
}

export interface VocalFormantPedal extends BasePedalConfig {
  type: 'vocalFormant';
  pitch: number; // -12 to +12 semitones
  formant: number; // -12 to +12 semitones
  robotMode: boolean;
  robotPitch: 'C2' | 'E2' | 'G2' | 'A2' | 'C3' | 'E3' | 'G3';
  brightness: number; // 0 - 100
  mix: number; // 0 - 100
}

export interface VocalHarmonyPedal extends BasePedalConfig {
  type: 'vocalHarmony';
  voice1: '-12' | '-7' | '-5' | '-4' | '-3' | '+3' | '+4' | '+5' | '+7' | '+12';
  voice2: '-12' | '-7' | '-5' | '-4' | '-3' | '+3' | '+4' | '+5' | '+7' | '+12' | 'off';
  key: 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
  scale: 'major' | 'minor' | 'chromatic';
  spread: number; // 0 - 100 (stereo width)
  humanize: number; // 0 - 100 (micro detune & drift)
  mix: number; // 0 - 100
}

export interface VocalPreampPedal extends BasePedalConfig {
  type: 'vocalPreamp';
  warmth: number; // 0 - 100 (analog tube drive & harmonic saturation)
  compression: number; // 0 - 100 (opto-leveler dynamics smoothing)
  air: number; // 0 - 100 (12kHz silky air shelf boost)
  body: number; // 0 - 100 (200Hz chest resonance warmth)
  lowCut: boolean; // 80Hz rumble cut
  outputGain: number; // 0 - 100
}

export interface VocalStutterPedal extends BasePedalConfig {
  type: 'vocalStutter';
  rate: '1/4' | '1/8' | '1/16' | '1/32' | 'triplet';
  bpm: number; // 60 - 200
  depth: number; // 0 - 100 (slice gate depth)
  glitch: number; // 0 - 100 (stutter repeat / pitch randomization)
  tapeSlow: boolean; // tape-stop pitch plunge
  mix: number; // 0 - 100
}

export interface VocalAlienPedal extends BasePedalConfig {
  type: 'vocalAlien';
  frequency: number; // 50 - 2000 Hz (carrier frequency)
  carrierShape: 'sine' | 'triangle' | 'square';
  modDepth: number; // 0 - 100 (ring modulation depth)
  lfoRate: number; // 0.1 - 20 Hz
  tracking: number; // 0 - 100 (speech amplitude dynamic pitch bend)
  mix: number; // 0 - 100
}

export interface GranularCloudPedal extends BasePedalConfig {
  type: 'granularCloud';
  grainSize: number; // 20 - 400 ms
  density: number; // 2 - 40 grains/sec
  pitch: number; // -12 to +12 semitones
  spray: number; // 0 - 100% (random position jitter)
  feedback: number; // 0 - 95%
  shimmer: boolean; // Octave-up shimmer in cloud feedback
  mix: number; // 0 - 100%
}

export interface ArcadeSynthPedal extends BasePedalConfig {
  type: 'arcadeSynth';
  subOctave: '-2' | '-1' | 'off' | '+1' | '+2';
  crushBits: number; // 2 - 16 bits
  sampleRateDec: number; // 800 - 22050 Hz
  arpeggiator: 'off' | 'major3rd' | 'octave' | 'fifth' | 'cyberpunk';
  arpRate: number; // 1 - 16 Hz
  glide: number; // 0 - 100% portamento slew
  mix: number; // 0 - 100%
}

export interface SpectralFreezePedal extends BasePedalConfig {
  type: 'spectralFreeze';
  mode: 'latch' | 'momentary';
  frozen: boolean; // freeze capture active
  riseTime: number; // 20 - 1500 ms swell
  decayTime: number; // 100 - 4000 ms tail
  shimmer: number; // 0 - 100% shimmer octave layer
  damping: number; // 0 - 100% warm analog damping
  mix: number; // 0 - 100%
}

export interface TapeGlitchPedal extends BasePedalConfig {
  type: 'tapeGlitch';
  direction: 'forward' | 'reverse' | 'alternating';
  sliceLength: number; // 60 - 1200 ms
  pitch: number; // -12 to +12 semitones
  randomGlitch: number; // 0 - 100% jump/repeat probability
  wowFlutter: number; // 0 - 100% tape wobble
  feedback: number; // 0 - 90%
  mix: number; // 0 - 100%
}

export interface UniVibePedal extends BasePedalConfig {
  type: 'uniVibe';
  speed: number; // 0.5 - 10.0 Hz
  intensity: number; // 0 - 100%
  mode: 'chorus' | 'vibrato';
  lampBias: number; // 0 - 100%
  mix: number; // 0 - 100%
}

export interface HarmonicTremoloPedal extends BasePedalConfig {
  type: 'harmonicTremolo';
  rate: number; // 0.5 - 12.0 Hz
  depth: number; // 0 - 100%
  crossover: number; // 300 - 1600 Hz
  waveform: 'sine' | 'triangle' | 'pulse';
  mix: number; // 0 - 100%
}

export interface SlowGearPedal extends BasePedalConfig {
  type: 'slowGear';
  attack: number; // 40 - 1500 ms
  sensitivity: number; // 0 - 100%
  release: number; // 40 - 600 ms
  mix: number; // 0 - 100%
}

export interface KlonOverdrivePedal extends BasePedalConfig {
  type: 'klonOverdrive';
  gain: number; // 0 - 100%
  treble: number; // 0 - 100%
  output: number; // 0 - 100%
  cleanBlend: number; // 0 - 100%
}

export interface MultiOctavePedal extends BasePedalConfig {
  type: 'multiOctave';
  sub2: number; // 0 - 100% (-2 Octaves)
  sub1: number; // 0 - 100% (-1 Octave)
  dry: number; // 0 - 100%
  oct1: number; // 0 - 100% (+1 Octave)
  oct2: number; // 0 - 100% (+2 Octaves)
  tone: number; // 0 - 100%
}

export interface TalkingWahPedal extends BasePedalConfig {
  type: 'talkingWah';
  vowel: 'ow-ow' | 'ya-ya' | 'ee-ah' | 'oo-ee';
  sensitivity: number; // 0 - 100%
  direction: 'up' | 'down';
  resonance: number; // 1 - 15
  drive: number; // 0 - 100%
  mix: number; // 0 - 100%
}

export interface ReverseReverbPedal extends BasePedalConfig {
  type: 'reverseReverb';
  time: number; // 200 - 1600 ms
  preDelay: number; // 0 - 200 ms
  feedback: number; // 0 - 85%
  damping: number; // 0 - 100%
  mix: number; // 0 - 100%
}

export interface CrystalDelayPedal extends BasePedalConfig {
  type: 'crystalDelay';
  time: number; // 60 - 1200 ms
  interval: '+5th' | '+7th' | '+12th' | '+24th' | '-12th';
  feedback: number; // 0 - 90%
  shimmer: number; // 0 - 100%
  reverse: boolean;
  mix: number; // 0 - 100%
}

export interface HardTunePedal extends BasePedalConfig {
  type: 'hardTune';
  key: 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
  scale: 'major' | 'minor' | 'pentatonic' | 'chromatic' | 'arabic';
  retuneSpeed: number; // 0 - 50 ms
  formantWarp: number; // -12 to +12 semitones
  mix: number; // 0 - 100%
}

export interface LofiVinylPedal extends BasePedalConfig {
  type: 'lofiVinyl';
  wear: number; // 0 - 100%
  dustCrackle: number; // 0 - 100%
  flutter: number; // 0 - 100%
  filter: number; // 0 - 100%
  saturation: number; // 0 - 100%
  mix: number; // 0 - 100%
}

export interface DualNotchPedal extends BasePedalConfig {
  type: 'dualNotch';
  freq1: number;       // 40 - 16000 Hz, default 250
  q1: number;          // 0.5 - 30, default 8.0
  depth1: number;      // 0 - 100%, default 100
  enabled1: boolean;   // default true
  freq2: number;       // 40 - 16000 Hz, default 3200
  q2: number;          // 0.5 - 30, default 8.0
  depth2: number;      // 0 - 100%, default 100
  enabled2: boolean;   // default true
  level: number;       // 0 - 100%, default 100
}

export type AnyPedal =
  | OverdrivePedal
  | DistortionPedal
  | FuzzPedal
  | CompressorPedal
  | ChorusPedal
  | FlangerPedal
  | PhaserPedal
  | TremoloPedal
  | DelayPedal
  | ReverbPedal
  | EqPedal
  | NoiseGatePedal
  | AutoWahPedal
  | PitchShifterPedal
  | HarmonizerPedal
  | VocalTunerPedal
  | VocalDoublerPedal
  | DeEsserPedal
  | TelephoneVoicePedal
  | VocalFormantPedal
  | VocalHarmonyPedal
  | VocalPreampPedal
  | VocalStutterPedal
  | VocalAlienPedal
  | GranularCloudPedal
  | ArcadeSynthPedal
  | SpectralFreezePedal
  | TapeGlitchPedal
  | UniVibePedal
  | HarmonicTremoloPedal
  | SlowGearPedal
  | KlonOverdrivePedal
  | MultiOctavePedal
  | TalkingWahPedal
  | ReverseReverbPedal
  | CrystalDelayPedal
  | HardTunePedal
  | LofiVinylPedal
  | DualNotchPedal;



export type AmpArchitectureType =
  | 'wavenet'
  | 'lstm'
  | 'neural'
  | 'hd-triode'
  | 'triode'
  | 'waveshaper'
  | 'component';

export interface AmpModelConfig {
  id: string;
  name: string;
  category: 'Guitar' | 'Bass';
  description: string;
  type: AmpArchitectureType;
  gain: number; // 0 - 10
  bass: number; // 0 - 10
  mid: number; // 0 - 10
  treble: number; // 0 - 10
  presence: number; // 0 - 10
  master: number; // 0 - 10
  saturationCurve: number; // 1.0 - 5.0
  bias: number;
  customProfileName?: string;
  weightsCount?: number; // Only for real NAM neural models! Physical and waveshaper models have no weights.
  modelUrl?: string;
  rawJson?: any;
  isRealNam?: boolean;
  engineMode?: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  enabled?: boolean;
  bypassed?: boolean;
  inputTrim?: number; // In dB: -24 to +6 dB (calibrated input sensitivity / headroom trim)
}

export interface IrCabinetConfig {
  id: string;
  name: string;
  category: 'Guitar' | 'Bass';
  description: string;
  speakerType: string;
  micDistance: number; // 0 - 100%
  highCut: number; // 4000 - 12000 Hz
  lowCut: number; // 20 - 160 Hz
  isCustom?: boolean;
  customFileName?: string;
  irUrl?: string;
  isRealWav?: boolean;
  enabled?: boolean;
  bypassed?: boolean;
}

export interface LooperState {
  status: 'idle' | 'recording' | 'playing' | 'overdubbing';
  speed: 1.0 | 0.5;
  reverse: boolean;
  volume: number; // 0 - 100
  duration: number; // seconds
  currentTime: number; // seconds
  layersCount: number;
  hasUndo: boolean;
}

export interface Preset {
  id: string;
  name: string;
  author: string;
  category?: string;
  instrument: 'guitar' | 'bass' | 'vocal';
  genre: 'Rock' | 'Metal' | 'Blues' | 'Ambient' | 'Funk' | 'Jazz' | 'Shoegaze' | 'Pop' | 'Vocal' | 'R&B';
  description: string;
  tags: string[];
  pedals: AnyPedal[];
  ampModel: AmpModelConfig;
  irCabinet: IrCabinetConfig;
  bpm: number;
  likes: number;
  isCommunity?: boolean;
}

export interface TunerData {
  note: string;
  frequency: number;
  cents: number;
  targetFrequency: number;
  inTune: boolean;
  clarity: number;
}
