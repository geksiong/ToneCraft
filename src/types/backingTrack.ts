/**
 * @file backingTrack.ts
 * @description Types, interfaces, and chord theory dictionaries for ToneCraft's Backing Track Machine.
 */

export type ChordQuality =
  | 'maj'
  | 'min'
  | '7'
  | 'maj7'
  | 'm7'
  | 'm7b5'
  | 'dim7'
  | 'sus4'
  | 'sus2'
  | '5'
  | 'add9'
  | '9';

export interface ChordStep {
  id: string;
  root: string; // e.g. 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
  quality: ChordQuality;
  durationBars: number; // 0.5, 1, 2, 4
}

export type BackingGenreId =
  | 'rock'
  | 'blues'
  | 'funk'
  | 'jazz'
  | 'pop'
  | 'metal'
  | 'bossa'
  | 'reggae'
  | 'lofi'
  | 'country'
  | 'neosoul';

export type InstrumentId = 'percussion' | 'bass' | 'guitar' | 'synth';

export interface InstrumentConfig {
  volume: number; // 0 - 100
  muted: boolean;
  solo: boolean;
  style: string;
}

export type RhythmFeel = 'straight' | 'light-swing' | 'heavy-shuffle';
export type DrumComplexity = 'minimal' | 'balanced' | 'busy';
export type StrumStyle = 'sustained' | 'quarter-strum' | 'eighth-strum' | 'syncopated' | 'funk-chank';
export type BassGroove = 'root-sustain' | 'driving-eighths' | 'walking' | 'syncopated-funk' | 'root-fifth';

export interface BackingTrackState {
  isPlaying: boolean;
  bpm: number;
  genre: BackingGenreId;
  key: string;
  progression: ChordStep[];
  currentChordIndex: number;
  currentBeat: number; // 1-indexed (1, 2, 3, 4)
  currentBar: number;  // 1-indexed progression bar count
  totalBars: number;
  instruments: Record<InstrumentId, InstrumentConfig>;
  rhythmFeel: RhythmFeel;
  drumComplexity: DrumComplexity;
  strumStyle: StrumStyle;
  bassGroove: BassGroove;
  masterVolume: number; // 0 - 100
}

export interface GenrePreset {
  id: BackingGenreId;
  name: string;
  description: string;
  defaultBpm: number;
  defaultKey: string;
  rhythmFeel: RhythmFeel;
  drumComplexity: DrumComplexity;
  strumStyle: StrumStyle;
  bassGroove: BassGroove;
  defaultProgression: ChordStep[];
  recommendedInstrumentStyles: Record<InstrumentId, string>;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const CHORD_QUALITY_LABELS: Record<ChordQuality, { label: string; fullName: string; intervals: number[] }> = {
  maj: { label: 'Maj', fullName: 'Major', intervals: [0, 4, 7] },
  min: { label: 'm', fullName: 'Minor', intervals: [0, 3, 7] },
  '7': { label: '7', fullName: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  maj7: { label: 'maj7', fullName: 'Major 7th', intervals: [0, 4, 7, 11] },
  m7: { label: 'm7', fullName: 'Minor 7th', intervals: [0, 3, 7, 10] },
  m7b5: { label: 'm7b5', fullName: 'Half-Diminished', intervals: [0, 3, 6, 10] },
  dim7: { label: 'dim7', fullName: 'Diminished 7th', intervals: [0, 3, 6, 9] },
  sus4: { label: 'sus4', fullName: 'Suspended 4th', intervals: [0, 5, 7] },
  sus2: { label: 'sus2', fullName: 'Suspended 2nd', intervals: [0, 2, 7] },
  '5': { label: '5', fullName: 'Power Chord', intervals: [0, 7, 12] },
  add9: { label: 'add9', fullName: 'Add 9th', intervals: [0, 4, 7, 14] },
  '9': { label: '9', fullName: 'Dominant 9th', intervals: [0, 4, 7, 10, 14] }
};

export const INSTRUMENT_STYLES: Record<InstrumentId, { id: string; name: string }[]> = {
  percussion: [
    { id: 'studio-kit', name: 'Modern Studio Kit' },
    { id: 'vintage-kit', name: 'Vintage Warm Drum Kit' },
    { id: 'electronic-808', name: '808 Beat Machine' },
    { id: 'jazz-brush', name: 'Jazz Brush / Acoustic' },
    { id: 'latin-percussion', name: 'Latin Percussion & Shaker' }
  ],
  bass: [
    { id: 'picked-pbass', name: 'Electric Picked P-Bass' },
    { id: 'finger-funk', name: 'Finger Funk Jazz Bass' },
    { id: 'motown-tube', name: 'Vintage Motown Tube Bass' },
    { id: 'synth-sub', name: 'Analog Synth Sub Bass' },
    { id: 'slap-bass', name: 'Punchy Slap Bass' }
  ],
  guitar: [
    { id: 'clean-strat', name: 'Clean Electric Strat' },
    { id: 'acoustic-strum', name: 'Acoustic Steel Strum' },
    { id: 'funk-chank', name: 'Funk 16th Muted Chank' },
    { id: 'neo-rhodes', name: 'Mellow Rhodes E-Piano' },
    { id: 'rock-crunch', name: 'Overdriven Power Chug' }
  ],
  synth: [
    { id: 'warm-analog', name: 'Lush Analog Warm Pad' },
    { id: 'dream-glass', name: 'Dream Glass Ambient' },
    { id: 'synthwave-brass', name: '80s Synthwave Brass' },
    { id: 'bell-arp', name: 'Sparkling Bell Sequence' },
    { id: 'space-organ', name: 'Vintage Rotary Organ' }
  ]
};

// Standard MIDI base pitches
export const ROOT_MIDI_MAP: Record<string, number> = {
  'C': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11
};

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getChordNotes(root: string, quality: ChordQuality): { name: string; midi: number; freq: number }[] {
  const rootOffset = ROOT_MIDI_MAP[root] ?? 0;
  const intervals = CHORD_QUALITY_LABELS[quality]?.intervals || [0, 4, 7];
  return intervals.map((interval) => {
    const totalSemis = rootOffset + interval;
    const noteIdx = (totalSemis % 12 + 12) % 12;
    const noteName = NOTE_NAMES[noteIdx];
    // Place chord in octave 3/4 (midi ~ 48 - 72)
    const midi = 48 + totalSemis;
    return {
      name: noteName,
      midi,
      freq: midiToFreq(midi)
    };
  });
}

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'rock',
    name: 'Classic Rock',
    description: 'Punchy 4/4 driving rhythm, tight 8th note bass, and full-bodied guitar strums',
    defaultBpm: 120,
    defaultKey: 'A',
    rhythmFeel: 'straight',
    drumComplexity: 'balanced',
    strumStyle: 'eighth-strum',
    bassGroove: 'driving-eighths',
    recommendedInstrumentStyles: {
      percussion: 'studio-kit',
      bass: 'picked-pbass',
      guitar: 'clean-strat',
      synth: 'warm-analog'
    },
    defaultProgression: [
      { id: 'c1', root: 'A', quality: 'maj', durationBars: 1 },
      { id: 'c2', root: 'D', quality: 'maj', durationBars: 1 },
      { id: 'c3', root: 'F#', quality: 'min', durationBars: 1 },
      { id: 'c4', root: 'E', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    id: 'blues',
    name: '12-Bar Blues Shuffle',
    description: 'Swung 12/8 shuffle beat, walking boogie bassline, and crunchy 9th comping chords',
    defaultBpm: 108,
    defaultKey: 'E',
    rhythmFeel: 'heavy-shuffle',
    drumComplexity: 'balanced',
    strumStyle: 'quarter-strum',
    bassGroove: 'walking',
    recommendedInstrumentStyles: {
      percussion: 'vintage-kit',
      bass: 'motown-tube',
      guitar: 'clean-strat',
      synth: 'space-organ'
    },
    defaultProgression: [
      { id: 'b1', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b2', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b3', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b4', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b5', root: 'A', quality: '7', durationBars: 1 },
      { id: 'b6', root: 'A', quality: '7', durationBars: 1 },
      { id: 'b7', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b8', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b9', root: 'B', quality: '7', durationBars: 1 },
      { id: 'b10', root: 'A', quality: '7', durationBars: 1 },
      { id: 'b11', root: 'E', quality: '7', durationBars: 1 },
      { id: 'b12', root: 'B', quality: '7', durationBars: 1 }
    ]
  },
  {
    id: 'funk',
    name: 'Funk & Groove',
    description: 'Syncopated 16th ghost notes, punchy slapped bass, and tight staccato guitar chanks',
    defaultBpm: 102,
    defaultKey: 'E',
    rhythmFeel: 'light-swing',
    drumComplexity: 'busy',
    strumStyle: 'funk-chank',
    bassGroove: 'syncopated-funk',
    recommendedInstrumentStyles: {
      percussion: 'studio-kit',
      bass: 'finger-funk',
      guitar: 'funk-chank',
      synth: 'synthwave-brass'
    },
    defaultProgression: [
      { id: 'f1', root: 'E', quality: 'm7', durationBars: 1 },
      { id: 'f2', root: 'A', quality: '9', durationBars: 1 },
      { id: 'f3', root: 'E', quality: 'm7', durationBars: 1 },
      { id: 'f4', root: 'B', quality: 'm7', durationBars: 1 }
    ]
  },
  {
    id: 'jazz',
    name: 'Jazz Swing (ii - V - I)',
    description: 'Swung ride cymbal, 4-to-the-bar walking bass, and sophisticated Charleston comping',
    defaultBpm: 130,
    defaultKey: 'C',
    rhythmFeel: 'heavy-shuffle',
    drumComplexity: 'balanced',
    strumStyle: 'quarter-strum',
    bassGroove: 'walking',
    recommendedInstrumentStyles: {
      percussion: 'jazz-brush',
      bass: 'motown-tube',
      guitar: 'neo-rhodes',
      synth: 'warm-analog'
    },
    defaultProgression: [
      { id: 'j1', root: 'D', quality: 'm7', durationBars: 1 },
      { id: 'j2', root: 'G', quality: '7', durationBars: 1 },
      { id: 'j3', root: 'C', quality: 'maj7', durationBars: 1 },
      { id: 'j4', root: 'A', quality: '7', durationBars: 1 }
    ]
  },
  {
    id: 'pop',
    name: 'Pop / Anthem (I - V - vi - IV)',
    description: 'Uplifting four-on-the-floor beat, melodic root bass, acoustic strumming, and lush synth pad',
    defaultBpm: 118,
    defaultKey: 'C',
    rhythmFeel: 'straight',
    drumComplexity: 'balanced',
    strumStyle: 'eighth-strum',
    bassGroove: 'root-fifth',
    recommendedInstrumentStyles: {
      percussion: 'studio-kit',
      bass: 'picked-pbass',
      guitar: 'acoustic-strum',
      synth: 'warm-analog'
    },
    defaultProgression: [
      { id: 'p1', root: 'C', quality: 'maj', durationBars: 1 },
      { id: 'p2', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'p3', root: 'A', quality: 'min', durationBars: 1 },
      { id: 'p4', root: 'F', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    id: 'bossa',
    name: 'Bossa Nova',
    description: 'Latin syncopated rimshot & shaker, dotted syncopated bass, and nylon chord voicings',
    defaultBpm: 125,
    defaultKey: 'F',
    rhythmFeel: 'straight',
    drumComplexity: 'busy',
    strumStyle: 'syncopated',
    bassGroove: 'syncopated-funk',
    recommendedInstrumentStyles: {
      percussion: 'latin-percussion',
      bass: 'motown-tube',
      guitar: 'acoustic-strum',
      synth: 'dream-glass'
    },
    defaultProgression: [
      { id: 'bo1', root: 'D', quality: 'm7', durationBars: 1 },
      { id: 'bo2', root: 'G', quality: '7', durationBars: 1 },
      { id: 'bo3', root: 'C', quality: 'maj7', durationBars: 1 },
      { id: 'bo4', root: 'A', quality: '7', durationBars: 1 }
    ]
  },
  {
    id: 'reggae',
    name: 'Reggae & Dub',
    description: 'One-drop kick & snare on beat 3, deep sub-bass, and offbeat guitar skanks on 2 & 4',
    defaultBpm: 76,
    defaultKey: 'A',
    rhythmFeel: 'light-swing',
    drumComplexity: 'minimal',
    strumStyle: 'quarter-strum',
    bassGroove: 'root-sustain',
    recommendedInstrumentStyles: {
      percussion: 'vintage-kit',
      bass: 'synth-sub',
      guitar: 'clean-strat',
      synth: 'space-organ'
    },
    defaultProgression: [
      { id: 'r1', root: 'A', quality: 'min', durationBars: 1 },
      { id: 'r2', root: 'D', quality: 'min', durationBars: 1 },
      { id: 'r3', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'r4', root: 'C', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chillhop',
    description: 'Laid back swung beat, dusty vinyl snare, melodic upright bass, and warm detuned keys',
    defaultBpm: 84,
    defaultKey: 'D',
    rhythmFeel: 'heavy-shuffle',
    drumComplexity: 'balanced',
    strumStyle: 'syncopated',
    bassGroove: 'syncopated-funk',
    recommendedInstrumentStyles: {
      percussion: 'vintage-kit',
      bass: 'motown-tube',
      guitar: 'neo-rhodes',
      synth: 'dream-glass'
    },
    defaultProgression: [
      { id: 'l1', root: 'D', quality: 'maj7', durationBars: 1 },
      { id: 'l2', root: 'C#', quality: 'm7', durationBars: 1 },
      { id: 'l3', root: 'B', quality: 'm7', durationBars: 1 },
      { id: 'l4', root: 'A', quality: 'maj7', durationBars: 1 }
    ]
  },
  {
    id: 'metal',
    name: 'Modern Metal Chug',
    description: 'Double kick energy, tight palm-muted power chord rhythm, and growling sub bass',
    defaultBpm: 135,
    defaultKey: 'D',
    rhythmFeel: 'straight',
    drumComplexity: 'busy',
    strumStyle: 'eighth-strum',
    bassGroove: 'driving-eighths',
    recommendedInstrumentStyles: {
      percussion: 'studio-kit',
      bass: 'picked-pbass',
      guitar: 'rock-crunch',
      synth: 'warm-analog'
    },
    defaultProgression: [
      { id: 'm1', root: 'D', quality: '5', durationBars: 1 },
      { id: 'm2', root: 'Bb', quality: '5', durationBars: 1 },
      { id: 'm3', root: 'C', quality: '5', durationBars: 1 },
      { id: 'm4', root: 'A', quality: '5', durationBars: 1 }
    ]
  },
  {
    id: 'country',
    name: 'Country & Americana',
    description: 'Crisp train beat, alternating root-5th bass, and bright acoustic strumming',
    defaultBpm: 112,
    defaultKey: 'G',
    rhythmFeel: 'straight',
    drumComplexity: 'balanced',
    strumStyle: 'eighth-strum',
    bassGroove: 'root-fifth',
    recommendedInstrumentStyles: {
      percussion: 'vintage-kit',
      bass: 'motown-tube',
      guitar: 'acoustic-strum',
      synth: 'space-organ'
    },
    defaultProgression: [
      { id: 'co1', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'co2', root: 'C', quality: 'maj', durationBars: 1 },
      { id: 'co3', root: 'D', quality: 'maj', durationBars: 1 },
      { id: 'co4', root: 'G', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    id: 'neosoul',
    name: 'Neo-Soul & R&B',
    description: 'Smooth swung groove, deep sub-bass, lush maj7/9th chord comping, and sparkling bells',
    defaultBpm: 88,
    defaultKey: 'F',
    rhythmFeel: 'light-swing',
    drumComplexity: 'busy',
    strumStyle: 'syncopated',
    bassGroove: 'syncopated-funk',
    recommendedInstrumentStyles: {
      percussion: 'electronic-808',
      bass: 'synth-sub',
      guitar: 'neo-rhodes',
      synth: 'dream-glass'
    },
    defaultProgression: [
      { id: 'ns1', root: 'F', quality: 'maj7', durationBars: 1 },
      { id: 'ns2', root: 'E', quality: 'm7', durationBars: 1 },
      { id: 'ns3', root: 'D', quality: 'm7', durationBars: 1 },
      { id: 'ns4', root: 'C', quality: 'maj7', durationBars: 1 }
    ]
  }
];

export const POPULAR_PROGRESSION_PRESETS: { name: string; genre: BackingGenreId; chords: ChordStep[] }[] = [
  {
    name: 'Pop 4-Chords (I - V - vi - IV)',
    genre: 'pop',
    chords: [
      { id: 'pc1', root: 'C', quality: 'maj', durationBars: 1 },
      { id: 'pc2', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'pc3', root: 'A', quality: 'min', durationBars: 1 },
      { id: 'pc4', root: 'F', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    name: 'Classic 12-Bar Blues (Key of E)',
    genre: 'blues',
    chords: [
      { id: 'bb1', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb2', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb3', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb4', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb5', root: 'A', quality: '7', durationBars: 1 },
      { id: 'bb6', root: 'A', quality: '7', durationBars: 1 },
      { id: 'bb7', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb8', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb9', root: 'B', quality: '7', durationBars: 1 },
      { id: 'bb10', root: 'A', quality: '7', durationBars: 1 },
      { id: 'bb11', root: 'E', quality: '7', durationBars: 1 },
      { id: 'bb12', root: 'B', quality: '7', durationBars: 1 }
    ]
  },
  {
    name: 'Rock Anthem (A - D - F#m - E)',
    genre: 'rock',
    chords: [
      { id: 'rc1', root: 'A', quality: 'maj', durationBars: 1 },
      { id: 'rc2', root: 'D', quality: 'maj', durationBars: 1 },
      { id: 'rc3', root: 'F#', quality: 'min', durationBars: 1 },
      { id: 'rc4', root: 'E', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    name: 'Funk Vamp (Em7 - A9)',
    genre: 'funk',
    chords: [
      { id: 'fc1', root: 'E', quality: 'm7', durationBars: 2 },
      { id: 'fc2', root: 'A', quality: '9', durationBars: 2 }
    ]
  },
  {
    name: 'Jazz ii - V - I - VI in C',
    genre: 'jazz',
    chords: [
      { id: 'jc1', root: 'D', quality: 'm7', durationBars: 1 },
      { id: 'jc2', root: 'G', quality: '7', durationBars: 1 },
      { id: 'jc3', root: 'C', quality: 'maj7', durationBars: 1 },
      { id: 'jc4', root: 'A', quality: '7', durationBars: 1 }
    ]
  },
  {
    name: 'Andalusian Flamenco (Am - G - F - E)',
    genre: 'rock',
    chords: [
      { id: 'fl1', root: 'A', quality: 'min', durationBars: 1 },
      { id: 'fl2', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'fl3', root: 'F', quality: 'maj', durationBars: 1 },
      { id: 'fl4', root: 'E', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    name: 'Lo-Fi Chill Sunset',
    genre: 'lofi',
    chords: [
      { id: 'lf1', root: 'D', quality: 'maj7', durationBars: 1 },
      { id: 'lf2', root: 'C#', quality: 'm7', durationBars: 1 },
      { id: 'lf3', root: 'B', quality: 'm7', durationBars: 1 },
      { id: 'lf4', root: 'A', quality: 'maj7', durationBars: 1 }
    ]
  },
  {
    name: 'Neo-Soul Groove (Fmaj7 - Em7 - Dm7 - Cmaj7)',
    genre: 'neosoul',
    chords: [
      { id: 'ns1', root: 'F', quality: 'maj7', durationBars: 1 },
      { id: 'ns2', root: 'E', quality: 'm7', durationBars: 1 },
      { id: 'ns3', root: 'D', quality: 'm7', durationBars: 1 },
      { id: 'ns4', root: 'C', quality: 'maj7', durationBars: 1 }
    ]
  },
  {
    name: 'Reggae Jam (Am - Dm - G - C)',
    genre: 'reggae',
    chords: [
      { id: 'rj1', root: 'A', quality: 'min', durationBars: 1 },
      { id: 'rj2', root: 'D', quality: 'min', durationBars: 1 },
      { id: 'rj3', root: 'G', quality: 'maj', durationBars: 1 },
      { id: 'rj4', root: 'C', quality: 'maj', durationBars: 1 }
    ]
  },
  {
    name: 'Metal Drop Chug (D5 - Bb5 - C5 - A5)',
    genre: 'metal',
    chords: [
      { id: 'mc1', root: 'D', quality: '5', durationBars: 1 },
      { id: 'mc2', root: 'Bb', quality: '5', durationBars: 1 },
      { id: 'mc3', root: 'C', quality: '5', durationBars: 1 },
      { id: 'mc4', root: 'A', quality: '5', durationBars: 1 }
    ]
  }
];
