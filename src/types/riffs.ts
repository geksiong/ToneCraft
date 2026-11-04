export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6; // 1=high e, 2=B, 3=G, 4=D, 5=A, 6=low E

export type TechniqueType =
  | 'normal'
  | 'hammer-on'
  | 'pull-off'
  | 'bend-full'
  | 'bend-half'
  | 'bend-quarter'
  | 'bend-release'
  | 'pre-bend'
  | 'slide-up'
  | 'slide-down'
  | 'vibrato'
  | 'palm-mute'
  | 'pinch-harmonic'
  | 'dead-note'
  | 'rake';

export interface TabNote {
  string: GuitarString; // 1 to 6
  fret: number; // 0 for open string, -1 for dead/muted string (X)
  technique?: TechniqueType;
  targetFret?: number; // Target for hammer-on, pull-off, slide (e.g. 5 -> 7)
  bendAmount?: number; // In semitones: 2 = full step, 1 = half step, 0.5 = quarter step, 3 = 1.5 steps
  releaseToFret?: number; // In bend & release
  vibrato?: boolean;
  palmMute?: boolean;
  accent?: boolean;
}

export interface TabColumn {
  id: string;
  time: number; // In beats from start of riff (0, 0.5, 0.75, 1.0, etc.)
  duration: number; // In beats (e.g. 0.25 for 16th, 0.5 for 8th, 1.0 for quarter)
  notes: TabNote[];
  annotation?: string; // Text annotation displayed above tab staff (e.g. "Full", "h", "p", "~", "P.M.")
  measure?: number; // Measure / Bar index (1, 2...)
}

export interface SongAppearance {
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  key: string;
  isPrimary: boolean;
  usageNote: string; // Explains where and how the riff was used in this song
}

export interface MovableConfig {
  baseFret: number; // Root position fret (e.g. 5 for Key of A on 6th string)
  baseKey: string; // e.g. "A"
  rootString: GuitarString; // String where root note is located
  fretMinOffset: number; // Min fret relative shift (e.g. -5 to reach E)
  fretMaxOffset: number; // Max fret relative shift (e.g. +7 to reach E octave)
  explanation: string; // Why it's movable (e.g. "Uses no open strings; transpose anywhere on the fretboard")
}

export interface PracticeRiff {
  id: string;
  name: string;
  subtitle: string;
  primaryArtist: string;
  year: number;
  genre: 'Classic Rock' | 'Blues' | 'Metal' | 'Funk & R&B' | 'Neo-Soul' | 'Country' | 'Grunge & Alt' | 'Prog & Shred';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tempo: number; // Original BPM
  timeSignature: [number, number]; // e.g. [4, 4]
  tuning: string; // e.g. "Standard (E A D G B E)"
  key: string; // e.g. "A Minor Pentatonic"
  scaleOrMode: string;
  
  // Movability
  isMovable: boolean;
  movableConfig?: MovableConfig;

  // Song connections
  songs: SongAppearance[];

  // Techniques present in this riff
  techniques: TechniqueType[];

  // Tablature
  totalBeats: number;
  columns: TabColumn[];

  // Educational & Practice Guidance
  description: string;
  practiceTips: string[];
  recommendedPresetId?: string; // Links to ToneCraft preset
  recommendedPresetName?: string;
  pickupStyle?: 'clean-neck' | 'clean-quack' | 'twang' | 'rock' | 'heavy' | 'acoustic';
}

export interface RiffPlaybackState {
  isPlaying: boolean;
  currentBeat: number;
  activeColumnIndex: number;
  fretShift: number; // Transposition offset (+/- frets for movable riffs)
  playbackSpeed: number; // 0.5, 0.75, 1.0, 1.25
  isLooping: boolean;
  metronomeClick: boolean;
  countIn: boolean;
  routeThroughDsp: boolean; // True = routes through active pedalboard & amp; False = direct monitor
}
