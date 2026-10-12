export interface SampleRiffInfo {
  id: string;
  name: string;
  genre: string;
  category: 'Clean' | 'Edge of Breakup' | 'Rock & Metal' | 'Bass';
  instrument: 'guitar' | 'bass';
  tempo: number;
  description: string;
}

export const SAMPLE_RIFFS: SampleRiffInfo[] = [
  {
    id: 'riff-clean-funk',
    name: 'Clean Funk 16th Chords (Cory Wong / Prince)',
    genre: 'Funk / R&B',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 114,
    description: 'Crisp, punchy 16th-note Stratocaster in-between pickup funk rhythm with E9 and A13 chord stabs.'
  },
  {
    id: 'riff-neo-soul',
    name: 'Neo-Soul Crystalline Chime (Mateus Asato)',
    genre: 'Neo-Soul / R&B',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 84,
    description: 'Velvety, singing clean neck pickup double-stops, sweet melodic hammer-ons, and dynamic chord blooms.'
  },
  {
    id: 'riff-jazz-clean',
    name: 'Warm Jazz Chord Melody (Wes Montgomery)',
    genre: 'Jazz',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 92,
    description: 'Mellow, warm thumb-picked II-V-I chord melody (Dm9 - G13 - Cmaj9) with rich, round low-mid presence.'
  },
  {
    id: 'riff-folk-fingerpick',
    name: 'Acoustic / Electric Folk Fingerpicking',
    genre: 'Folk / Acoustic',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 108,
    description: 'Ringing, bell-like Travis picking pattern with resonant open D and G string arpeggio voicings.'
  },
  {
    id: 'riff-dream-pop',
    name: 'Dream Pop / Indie Shimmer Chime',
    genre: 'Indie / Dream Pop',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 100,
    description: 'Expansive open-voiced chords with ringing high B and E strings, perfect for chorus and ambient reverb.'
  },
  {
    id: 'riff-country-twang',
    name: 'Country Clean Twang & Hybrid Picking',
    genre: 'Country / Americana',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 122,
    description: 'Bright, snappy Telecaster bridge pickup clean twang with double-stop pedal-steel style bends.'
  },
  {
    id: 'riff-blues-clean',
    name: 'Clean Blues Expressive Lead (B.B. King)',
    genre: 'Blues',
    category: 'Clean',
    instrument: 'guitar',
    tempo: 94,
    description: 'Dynamic clean neck-pickup solo with touch-sensitive vibrato, vocal-like bends, and pure unclipped clarity.'
  },
  {
    id: 'riff-edge-breakup',
    name: 'Dynamic Edge-of-Breakup Touch Riff',
    genre: 'Blues Rock',
    category: 'Edge of Breakup',
    instrument: 'guitar',
    tempo: 104,
    description: 'Sensitive touch response: gentle picking remains pristine clean, hard pick attacks bloom into subtle tube grit.'
  },
  {
    id: 'riff-rock',
    name: 'Hard Rock Lead Lick (Key of E)',
    genre: 'Rock',
    category: 'Rock & Metal',
    instrument: 'guitar',
    tempo: 120,
    description: 'Biting blues-rock lead lick with vibrato and pentatonic bends.'
  },
  {
    id: 'riff-metal',
    name: 'Heavy Metal Palm-Mute Chug',
    genre: 'Metal',
    category: 'Rock & Metal',
    instrument: 'guitar',
    tempo: 140,
    description: 'Aggressive tight rhythm chug with heavy low-E palm mutes.'
  },
  {
    id: 'riff-motown-bass',
    name: 'Motown & Soul Clean Fingerstyle Bass',
    genre: 'Soul / Motown',
    category: 'Bass',
    instrument: 'bass',
    tempo: 102,
    description: 'Warm, round, deep P-bass clean foundation with smooth uncompressed walking bass lines.'
  },
  {
    id: 'riff-funk-bass',
    name: 'Funk Slap & Pop Bass Groove',
    genre: 'Funk',
    category: 'Bass',
    instrument: 'bass',
    tempo: 110,
    description: 'Syncopated slap bass groove with punchy percussive pops and slides.'
  },
  {
    id: 'riff-prog-bass',
    name: 'Progressive Metal Driving Bass Line',
    genre: 'Prog Metal',
    category: 'Bass',
    instrument: 'bass',
    tempo: 130,
    description: 'Driving 16th-note bass attack with tight low foundation and articulate bite.'
  }
];

export interface NoteEvent {
  time: number; // in beats
  duration: number; // in beats
  frequency: number;
  velocity: number;
  pickupStyle?: 'clean-neck' | 'clean-quack' | 'acoustic' | 'twang' | 'rock' | 'bass';
}

// Convert MIDI note number to frequency
export function m2f(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

/**
 * Returns score sequence for each sample riff
 */
export function getScoreForRiff(riffId: string): NoteEvent[] {
  switch (riffId) {
    case 'riff-clean-funk': {
      // E9: E3=52, G#3=56, B3=59, D4=62, F#4=66
      // A13: A3=57, C#4=61, G4=67, B4=71, F#5=78
      const notes: NoteEvent[] = [];
      const addChord = (beat: number, midiNotes: number[], vel: number) => {
        midiNotes.forEach((m, idx) => {
          notes.push({
            time: beat + idx * 0.012, // subtle pick strum rake
            duration: 0.18,
            frequency: m2f(m),
            velocity: vel,
            pickupStyle: 'clean-quack'
          });
        });
      };
      // 16th-note funk syncopation
      addChord(0.0, [52, 56, 59, 62, 66], 0.78);
      addChord(0.5, [52, 56, 59, 62, 66], 0.65);
      addChord(0.75, [52, 56, 59, 62, 66], 0.85);
      addChord(1.25, [52, 56, 59, 62, 66], 0.72);
      addChord(1.75, [57, 61, 67, 71], 0.82);
      addChord(2.0, [57, 61, 67, 71], 0.88);
      addChord(2.5, [57, 61, 67, 71], 0.70);
      addChord(3.0, [52, 56, 59, 62, 66], 0.90);
      addChord(3.5, [52, 56, 59, 62, 66], 0.68);
      return notes;
    }

    case 'riff-neo-soul': {
      // Melodic double-stops and clean arpeggiated triads
      return [
        { time: 0.0, duration: 0.9, frequency: m2f(55), velocity: 0.75, pickupStyle: 'clean-neck' }, // G3
        { time: 0.02, duration: 0.9, frequency: m2f(59), velocity: 0.78, pickupStyle: 'clean-neck' }, // B3
        { time: 0.04, duration: 0.9, frequency: m2f(66), velocity: 0.82, pickupStyle: 'clean-neck' }, // F#4
        { time: 0.75, duration: 0.45, frequency: m2f(67), velocity: 0.85, pickupStyle: 'clean-neck' }, // G4
        { time: 1.25, duration: 0.4, frequency: m2f(69), velocity: 0.80, pickupStyle: 'clean-neck' }, // A4
        { time: 1.75, duration: 0.85, frequency: m2f(52), velocity: 0.74, pickupStyle: 'clean-neck' }, // E3
        { time: 1.77, duration: 0.85, frequency: m2f(64), velocity: 0.78, pickupStyle: 'clean-neck' }, // E4
        { time: 1.79, duration: 0.85, frequency: m2f(71), velocity: 0.82, pickupStyle: 'clean-neck' }, // B4
        { time: 2.5, duration: 0.35, frequency: m2f(74), velocity: 0.84, pickupStyle: 'clean-neck' }, // D5
        { time: 2.85, duration: 0.4, frequency: m2f(71), velocity: 0.78, pickupStyle: 'clean-neck' }, // B4
        { time: 3.25, duration: 0.75, frequency: m2f(67), velocity: 0.86, pickupStyle: 'clean-neck' }  // G4
      ];
    }

    case 'riff-jazz-clean': {
      // II-V-I: Dm9 (D3, F3, A3, C4, E4) -> G13 (G2, F3, B3, E4) -> Cmaj9 (C3, E3, G3, B3, D4)
      return [
        // Dm9 chord stroke
        { time: 0.0, duration: 1.4, frequency: m2f(50), velocity: 0.72, pickupStyle: 'clean-neck' },
        { time: 0.03, duration: 1.4, frequency: m2f(53), velocity: 0.70, pickupStyle: 'clean-neck' },
        { time: 0.06, duration: 1.4, frequency: m2f(57), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 0.09, duration: 1.4, frequency: m2f(60), velocity: 0.76, pickupStyle: 'clean-neck' },
        { time: 0.12, duration: 1.4, frequency: m2f(64), velocity: 0.80, pickupStyle: 'clean-neck' },
        // G13 stroke
        { time: 1.5, duration: 1.3, frequency: m2f(43), velocity: 0.75, pickupStyle: 'clean-neck' },
        { time: 1.53, duration: 1.3, frequency: m2f(53), velocity: 0.72, pickupStyle: 'clean-neck' },
        { time: 1.56, duration: 1.3, frequency: m2f(59), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 1.59, duration: 1.3, frequency: m2f(64), velocity: 0.78, pickupStyle: 'clean-neck' },
        // Cmaj9 stroke
        { time: 2.75, duration: 1.6, frequency: m2f(48), velocity: 0.78, pickupStyle: 'clean-neck' },
        { time: 2.78, duration: 1.6, frequency: m2f(52), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 2.81, duration: 1.6, frequency: m2f(55), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 2.84, duration: 1.6, frequency: m2f(59), velocity: 0.76, pickupStyle: 'clean-neck' },
        { time: 2.87, duration: 1.6, frequency: m2f(62), velocity: 0.82, pickupStyle: 'clean-neck' }
      ];
    }

    case 'riff-folk-fingerpick': {
      // Travis picking in D: D2=38, A2=45, D3=50, F#3=54, A3=57, D4=62
      return [
        { time: 0.0, duration: 0.9, frequency: m2f(38), velocity: 0.82, pickupStyle: 'acoustic' }, // Low D
        { time: 0.25, duration: 0.7, frequency: m2f(54), velocity: 0.74, pickupStyle: 'acoustic' }, // F#3
        { time: 0.5, duration: 0.8, frequency: m2f(45), velocity: 0.76, pickupStyle: 'acoustic' }, // A2
        { time: 0.75, duration: 0.7, frequency: m2f(62), velocity: 0.84, pickupStyle: 'acoustic' }, // High D4
        { time: 1.0, duration: 0.9, frequency: m2f(50), velocity: 0.78, pickupStyle: 'acoustic' }, // D3
        { time: 1.25, duration: 0.7, frequency: m2f(57), velocity: 0.75, pickupStyle: 'acoustic' }, // A3
        { time: 1.5, duration: 0.8, frequency: m2f(45), velocity: 0.74, pickupStyle: 'acoustic' }, // A2
        { time: 1.75, duration: 0.7, frequency: m2f(54), velocity: 0.76, pickupStyle: 'acoustic' },
        { time: 2.0, duration: 0.9, frequency: m2f(38), velocity: 0.82, pickupStyle: 'acoustic' },
        { time: 2.25, duration: 0.7, frequency: m2f(57), velocity: 0.75, pickupStyle: 'acoustic' },
        { time: 2.5, duration: 0.8, frequency: m2f(45), velocity: 0.76, pickupStyle: 'acoustic' },
        { time: 2.75, duration: 0.7, frequency: m2f(62), velocity: 0.86, pickupStyle: 'acoustic' },
        { time: 3.0, duration: 0.9, frequency: m2f(50), velocity: 0.78, pickupStyle: 'acoustic' },
        { time: 3.25, duration: 0.7, frequency: m2f(54), velocity: 0.74, pickupStyle: 'acoustic' },
        { time: 3.5, duration: 0.8, frequency: m2f(45), velocity: 0.76, pickupStyle: 'acoustic' }
      ];
    }

    case 'riff-dream-pop': {
      // Shimmer open string chime: E2=40, B2=47, E3=52, G#3=56, B3=59, E4=64
      return [
        { time: 0.0, duration: 1.8, frequency: m2f(40), velocity: 0.78, pickupStyle: 'clean-neck' },
        { time: 0.2, duration: 1.6, frequency: m2f(47), velocity: 0.72, pickupStyle: 'clean-neck' },
        { time: 0.4, duration: 1.5, frequency: m2f(52), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 0.6, duration: 1.4, frequency: m2f(56), velocity: 0.76, pickupStyle: 'clean-neck' },
        { time: 0.8, duration: 1.3, frequency: m2f(59), velocity: 0.82, pickupStyle: 'clean-neck' },
        { time: 1.0, duration: 1.2, frequency: m2f(64), velocity: 0.88, pickupStyle: 'clean-neck' },
        { time: 1.8, duration: 1.5, frequency: m2f(45), velocity: 0.76, pickupStyle: 'clean-neck' }, // A2
        { time: 2.0, duration: 1.4, frequency: m2f(52), velocity: 0.72, pickupStyle: 'clean-neck' },
        { time: 2.2, duration: 1.3, frequency: m2f(57), velocity: 0.74, pickupStyle: 'clean-neck' },
        { time: 2.4, duration: 1.3, frequency: m2f(61), velocity: 0.78, pickupStyle: 'clean-neck' },
        { time: 2.6, duration: 1.2, frequency: m2f(64), velocity: 0.84, pickupStyle: 'clean-neck' },
        { time: 3.0, duration: 1.4, frequency: m2f(68), velocity: 0.86, pickupStyle: 'clean-neck' }  // G#4
      ];
    }

    case 'riff-country-twang': {
      // Snappy bridge pickup hybrid picking: E2=40, G#2=44, B2=47, E3=52, B3=59, E4=64
      return [
        { time: 0.0, duration: 0.35, frequency: m2f(40), velocity: 0.85, pickupStyle: 'twang' },
        { time: 0.25, duration: 0.3, frequency: m2f(59), velocity: 0.90, pickupStyle: 'twang' },
        { time: 0.27, duration: 0.3, frequency: m2f(64), velocity: 0.92, pickupStyle: 'twang' },
        { time: 0.6, duration: 0.35, frequency: m2f(44), velocity: 0.82, pickupStyle: 'twang' },
        { time: 0.85, duration: 0.3, frequency: m2f(61), velocity: 0.88, pickupStyle: 'twang' },
        { time: 0.87, duration: 0.3, frequency: m2f(66), velocity: 0.92, pickupStyle: 'twang' },
        { time: 1.25, duration: 0.45, frequency: m2f(47), velocity: 0.86, pickupStyle: 'twang' },
        { time: 1.6, duration: 0.4, frequency: m2f(64), velocity: 0.94, pickupStyle: 'twang' },
        { time: 2.0, duration: 0.35, frequency: m2f(40), velocity: 0.85, pickupStyle: 'twang' },
        { time: 2.25, duration: 0.3, frequency: m2f(59), velocity: 0.90, pickupStyle: 'twang' },
        { time: 2.6, duration: 0.6, frequency: m2f(68), velocity: 0.96, pickupStyle: 'twang' },
        { time: 3.2, duration: 0.7, frequency: m2f(64), velocity: 0.92, pickupStyle: 'twang' }
      ];
    }

    case 'riff-blues-clean': {
      // B.B. King / SRV clean neck pickup expression
      return [
        { time: 0.0, duration: 0.7, frequency: m2f(64), velocity: 0.72, pickupStyle: 'clean-neck' }, // E4
        { time: 0.5, duration: 0.45, frequency: m2f(67), velocity: 0.76, pickupStyle: 'clean-neck' }, // G4
        { time: 0.9, duration: 0.9, frequency: m2f(69), velocity: 0.82, pickupStyle: 'clean-neck' }, // A4 bend
        { time: 1.6, duration: 0.4, frequency: m2f(67), velocity: 0.70, pickupStyle: 'clean-neck' },
        { time: 2.0, duration: 0.8, frequency: m2f(64), velocity: 0.80, pickupStyle: 'clean-neck' }, // E4 vibrato
        { time: 2.7, duration: 0.45, frequency: m2f(62), velocity: 0.74, pickupStyle: 'clean-neck' }, // D4
        { time: 3.1, duration: 0.9, frequency: m2f(59), velocity: 0.84, pickupStyle: 'clean-neck' }  // B3
      ];
    }

    case 'riff-edge-breakup': {
      // Touch-sensitive dynamics: softer chords with accented double-stops
      return [
        { time: 0.0, duration: 0.6, frequency: m2f(40), velocity: 0.65, pickupStyle: 'clean-neck' },
        { time: 0.02, duration: 0.6, frequency: m2f(47), velocity: 0.62, pickupStyle: 'clean-neck' },
        { time: 0.04, duration: 0.6, frequency: m2f(52), velocity: 0.65, pickupStyle: 'clean-neck' },
        { time: 0.6, duration: 0.35, frequency: m2f(56), velocity: 0.68, pickupStyle: 'clean-neck' },
        { time: 1.0, duration: 0.5, frequency: m2f(59), velocity: 0.72, pickupStyle: 'clean-neck' },
        { time: 1.5, duration: 0.65, frequency: m2f(64), velocity: 0.88, pickupStyle: 'clean-neck' }, // accented dig-in
        { time: 1.52, duration: 0.65, frequency: m2f(67), velocity: 0.92, pickupStyle: 'clean-neck' },
        { time: 2.2, duration: 0.4, frequency: m2f(62), velocity: 0.70, pickupStyle: 'clean-neck' },
        { time: 2.6, duration: 0.5, frequency: m2f(59), velocity: 0.75, pickupStyle: 'clean-neck' },
        { time: 3.1, duration: 0.8, frequency: m2f(52), velocity: 0.85, pickupStyle: 'clean-neck' }
      ];
    }

    case 'riff-motown-bass': {
      // Warm P-bass fingerstyle: E1=28, G1=31, A1=33, B1=35, D2=38, E2=40
      return [
        { time: 0.0, duration: 0.65, frequency: m2f(28), velocity: 0.82, pickupStyle: 'bass' },
        { time: 0.75, duration: 0.45, frequency: m2f(31), velocity: 0.75, pickupStyle: 'bass' },
        { time: 1.25, duration: 0.5, frequency: m2f(33), velocity: 0.78, pickupStyle: 'bass' },
        { time: 1.75, duration: 0.4, frequency: m2f(35), velocity: 0.80, pickupStyle: 'bass' },
        { time: 2.0, duration: 0.65, frequency: m2f(38), velocity: 0.84, pickupStyle: 'bass' },
        { time: 2.75, duration: 0.45, frequency: m2f(35), velocity: 0.76, pickupStyle: 'bass' },
        { time: 3.25, duration: 0.65, frequency: m2f(33), velocity: 0.80, pickupStyle: 'bass' }
      ];
    }

    case 'riff-metal': {
      const notes: NoteEvent[] = [];
      const pattern = [40, 40, 40, 43, 40, 40, 45, 40, 40, 40, 46, 45, 40, 43, 40, 40];
      for (let i = 0; i < pattern.length; i++) {
        notes.push({
          time: i * 0.25,
          duration: 0.22,
          frequency: m2f(pattern[i]),
          velocity: i % 4 === 0 ? 0.95 : 0.82,
          pickupStyle: 'rock'
        });
      }
      return notes;
    }

    case 'riff-funk-bass': {
      return [
        { time: 0.0, duration: 0.45, frequency: m2f(28), velocity: 0.95, pickupStyle: 'bass' },
        { time: 0.5, duration: 0.22, frequency: m2f(28), velocity: 0.72, pickupStyle: 'bass' },
        { time: 0.75, duration: 0.3, frequency: m2f(40), velocity: 0.96, pickupStyle: 'bass' },
        { time: 1.25, duration: 0.35, frequency: m2f(31), velocity: 0.85, pickupStyle: 'bass' },
        { time: 1.75, duration: 0.22, frequency: m2f(33), velocity: 0.8, pickupStyle: 'bass' },
        { time: 2.0, duration: 0.45, frequency: m2f(38), velocity: 0.92, pickupStyle: 'bass' },
        { time: 2.5, duration: 0.3, frequency: m2f(33), velocity: 0.8, pickupStyle: 'bass' },
        { time: 3.0, duration: 0.35, frequency: m2f(31), velocity: 0.85, pickupStyle: 'bass' },
        { time: 3.5, duration: 0.45, frequency: m2f(30), velocity: 0.82, pickupStyle: 'bass' }
      ];
    }

    case 'riff-prog-bass': {
      const notes: NoteEvent[] = [];
      const pattern = [28, 28, 28, 31, 28, 28, 33, 28, 28, 28, 35, 34, 33, 31, 28, 31];
      for (let i = 0; i < pattern.length; i++) {
        notes.push({
          time: i * 0.25,
          duration: 0.23,
          frequency: m2f(pattern[i]),
          velocity: 0.88,
          pickupStyle: 'bass'
        });
      }
      return notes;
    }

    case 'riff-rock':
    default: {
      return [
        { time: 0.0, duration: 0.45, frequency: m2f(64), velocity: 0.85, pickupStyle: 'rock' },
        { time: 0.5, duration: 0.45, frequency: m2f(67), velocity: 0.9, pickupStyle: 'rock' },
        { time: 1.0, duration: 0.75, frequency: m2f(69), velocity: 0.95, pickupStyle: 'rock' },
        { time: 1.75, duration: 0.4, frequency: m2f(67), velocity: 0.82, pickupStyle: 'rock' },
        { time: 2.25, duration: 0.55, frequency: m2f(69), velocity: 0.88, pickupStyle: 'rock' },
        { time: 2.8, duration: 0.45, frequency: m2f(74), velocity: 0.92, pickupStyle: 'rock' },
        { time: 3.3, duration: 1.0, frequency: m2f(76), velocity: 0.96, pickupStyle: 'rock' }
      ];
    }
  }
}

/**
 * High-fidelity physical modeling + magnetic pickup harmonic synthesis.
 * Uses shaped, lowpass-filtered Hann-windowed pick excitation rather than raw white noise,
 * guaranteeing crystalline clean tones with ZERO digital fuzz or harshness.
 */
export function synthesizeRiffBuffer(
  audioCtx: AudioContext,
  riffId: string
): AudioBuffer {
  const riff = SAMPLE_RIFFS.find(r => r.id === riffId) || SAMPLE_RIFFS[0];
  const sampleRate = audioCtx.sampleRate;
  const bpm = riff.tempo;
  const beatSec = 60 / bpm;

  const notes = getScoreForRiff(riffId);
  const maxBeat = Math.max(...notes.map(n => n.time + n.duration));
  const totalBeats = Math.max(4, Math.ceil(maxBeat * 1.05));
  const totalSeconds = totalBeats * beatSec;
  const totalSamples = Math.floor(totalSeconds * sampleRate);

  const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  const isBass = riff.instrument === 'bass';
  const isCleanRiff = riff.category === 'Clean' || riff.category === 'Edge of Breakup';

  // Synthesize each plucked note into the buffer
  for (const note of notes) {
    const startSample = Math.floor(note.time * beatSec * sampleRate);
    const noteDurationSamples = Math.floor(note.duration * beatSec * sampleRate * 1.6);
    const fundamental = note.frequency;

    // String physical model (Karplus-Strong delay line size)
    const delayPeriod = Math.max(2, Math.floor(sampleRate / fundamental));
    const delayLine = new Float32Array(delayPeriod);

    // Acoustically realistic pick/finger excitation:
    // Smooth Hann window + lowpass smoothed burst (prevents harsh buzzsaw fuzz)
    const style = note.pickupStyle || (isBass ? 'bass' : isCleanRiff ? 'clean-neck' : 'rock');
    let prevRand = 0;
    for (let i = 0; i < delayPeriod; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / delayPeriod));
      // Lowpass smoothing on excitation noise
      const rand = Math.random() * 2 - 1;
      const smoothRand = (rand + prevRand) * 0.5;
      prevRand = rand;

      if (style === 'clean-neck' || style === 'acoustic') {
        // Warm round excitation with minimal high-frequency fizz
        delayLine[i] = (smoothRand * 0.4 + Math.sin((Math.PI * i) / delayPeriod) * 0.6) * window;
      } else if (style === 'clean-quack') {
        // Strat in-between chime: punchy mid transient
        delayLine[i] = (smoothRand * 0.55 + Math.sin((2 * Math.PI * i) / delayPeriod) * 0.45) * window;
      } else if (style === 'twang') {
        // Snappy Tele bridge transient
        delayLine[i] = (smoothRand * 0.7 + Math.sin((Math.PI * i) / delayPeriod) * 0.3) * window;
      } else if (style === 'bass') {
        // Heavy low-fundamental excitation
        delayLine[i] = (smoothRand * 0.25 + Math.sin((Math.PI * i) / delayPeriod) * 0.75) * window;
      } else {
        // Rock / Metal pick transient
        delayLine[i] = (smoothRand * 0.8 + Math.sin((Math.PI * i) / delayPeriod) * 0.2) * window;
      }
    }

    let delayIndex = 0;
    let prevFilterSample = 0;
    // Damping calibration: clean tones ring out longer with pristine decay
    const damping = isBass ? 0.996 : isCleanRiff ? 0.994 : 0.988;
    const decayRate = isBass ? 2.5 : isCleanRiff ? 3.2 : 4.4;

    for (let s = 0; s < noteDurationSamples; s++) {
      const targetSample = startSample + s;
      if (targetSample >= totalSamples) break;

      const delayed = delayLine[delayIndex];
      // Lowpass feedback filter (simulating natural string energy loss)
      const currentFiltered = (delayed + prevFilterSample) * 0.5 * damping;
      prevFilterSample = currentFiltered;

      delayLine[delayIndex] = currentFiltered;
      delayIndex = (delayIndex + 1) % delayPeriod;

      const t = s / sampleRate;
      const env = Math.exp(-t * decayRate);

      // Magnetic guitar pickup coil response
      const f = fundamental;
      let pickupHarmonics = 0;

      if (style === 'clean-neck') {
        // Neck pickup: dominant fundamental, warm 2nd harmonic, rounded 3rd
        pickupHarmonics = (
          Math.sin(2 * Math.PI * f * t) * 0.65 +
          Math.sin(2 * Math.PI * 2 * f * t) * 0.25 +
          Math.sin(2 * Math.PI * 3 * f * t) * 0.08
        ) * env * note.velocity;
      } else if (style === 'clean-quack') {
        // Middle/Strat notch: hollow, sparkling high chime
        pickupHarmonics = (
          Math.sin(2 * Math.PI * f * t) * 0.50 +
          Math.sin(2 * Math.PI * 2 * f * t) * 0.28 +
          Math.sin(2 * Math.PI * 3 * f * t) * 0.15 +
          Math.sin(2 * Math.PI * 4 * f * t) * 0.07
        ) * env * note.velocity;
      } else if (style === 'acoustic') {
        // Acoustic guitar body resonance: warm open woody chime
        pickupHarmonics = (
          Math.sin(2 * Math.PI * f * t) * 0.60 +
          Math.sin(2 * Math.PI * 2 * f * t) * 0.26 +
          Math.sin(2 * Math.PI * 3 * f * t) * 0.10 +
          Math.sin(2 * Math.PI * 4 * f * t) * 0.04
        ) * env * note.velocity;
      } else if (style === 'bass') {
        // Bass pickup: deep fundamental and rich octave
        pickupHarmonics = (
          Math.sin(2 * Math.PI * f * t) * 0.75 +
          Math.sin(2 * Math.PI * 2 * f * t) * 0.20 +
          Math.sin(2 * Math.PI * 3 * f * t) * 0.05
        ) * env * note.velocity;
      } else {
        // Bridge rock pickup: richer harmonics
        pickupHarmonics = (
          Math.sin(2 * Math.PI * f * t) * 0.52 +
          Math.sin(2 * Math.PI * 2 * f * t) * 0.28 +
          Math.sin(2 * Math.PI * 3 * f * t) * 0.14 +
          Math.sin(2 * Math.PI * 4 * f * t) * 0.06
        ) * env * note.velocity;
      }

      // Blend pluck physical model with pickup harmonics
      const stringPluck = currentFiltered * note.velocity * 0.45;
      data[targetSample] += (stringPluck + pickupHarmonics) * 0.7;
    }
  }

  // Realistic Electric Guitar Instrument DI Level Calibration:
  // Clean riffs normalized to peak ~0.38 (-8.4 dBFS), providing 8.4dB of clean dynamic headroom
  // so pluck transients NEVER clip downstream pedals, preamps, or limiters!
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(data[i]);
    if (abs > maxPeak) maxPeak = abs;
  }
  if (maxPeak > 0.001) {
    const targetPeak = isCleanRiff ? 0.38 : riffId === 'riff-metal' ? 0.55 : 0.45;
    const scale = targetPeak / maxPeak;
    for (let i = 0; i < totalSamples; i++) {
      data[i] *= scale;
    }
  }

  return buffer;
}
