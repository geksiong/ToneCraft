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
  | 'vstPlugin';

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

export interface VstPluginPedal extends BasePedalConfig {
  type: 'vstPlugin';
  pluginId: string;
  pluginTitle: string;
  param1: number; // 0 - 100
  param1Label: string;
  param2: number; // 0 - 100
  param2Label: string;
  param3: number; // 0 - 100
  param3Label: string;
  param4: number; // 0 - 100
  param4Label: string;
  dryWet: number; // 0 - 100
  dspCode: string;
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
  | VstPluginPedal;

export interface NamModelConfig {
  id: string;
  name: string;
  category: 'Guitar' | 'Bass';
  description: string;
  type: 'neural' | 'lstm' | 'wavenet';
  gain: number; // 0 - 10
  bass: number; // 0 - 10
  mid: number; // 0 - 10
  treble: number; // 0 - 10
  presence: number; // 0 - 10
  master: number; // 0 - 10
  saturationCurve: number; // 1.0 - 5.0
  bias: number;
  customProfileName?: string;
  weightsCount?: number;
  modelUrl?: string;
  rawJson?: any;
  isRealNam?: boolean;
  engineMode?: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  enabled?: boolean;
  bypassed?: boolean;
  inputTrim?: number; // In dB: -24 to +6 dB (calibrated NAM input sensitivity / headroom trim)
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
  instrument: 'guitar' | 'bass';
  genre: 'Rock' | 'Metal' | 'Blues' | 'Ambient' | 'Funk' | 'Jazz' | 'Shoegaze' | 'Pop';
  description: string;
  tags: string[];
  pedals: AnyPedal[];
  namModel: NamModelConfig;
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
