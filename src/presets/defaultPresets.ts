import { Preset } from '../types/pedal';
import { BUILT_IN_NAM_MODELS, isNamModelProfile } from '../audio/namModels';
import { BUILT_IN_IR_CABINETS } from '../audio/irData';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'vox-ac10-real-nam',
    name: 'Vox AC10 Real NAM Studio',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Authentic Atkinson WaveNet neural inference running through TONE3000 WebAssembly engine paired with real Celestion V30 acoustic WAV impulse.',
    tags: ['Real NAM', 'Neural WASM', 'British Chime', 'Boutique', 'HD AudioWorklet'],
    bpm: 120,
    likes: 894,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'ac10')!,
      gain: 5.5,
      bass: 5.8,
      mid: 6.5,
      treble: 6.8,
      presence: 6.2,
      master: 7.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'celestion-v30')!,
      micDistance: 30
    },
    pedals: [
      {
        id: 'pedal-od-real-1',
        type: 'overdrive',
        name: 'Tube Screamer TS9',
        enabled: true,
        color: '#15803d',
        accentColor: '#4ade80',
        drive: 45,
        tone: 60,
        level: 70
      },
      {
        id: 'pedal-delay-real-1',
        type: 'delay',
        name: 'BBD Analog Echo',
        enabled: true,
        color: '#0369a1',
        accentColor: '#38bdf8',
        time: 320,
        feedback: 38,
        mix: 30,
        flutter: 20,
        pingPong: false
      },
      {
        id: 'pedal-reverb-real-1',
        type: 'reverb',
        name: 'Studio Spring Tank',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 45,
        preDelay: 15,
        mix: 28,
        damping: 40,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'hendrix-psychedelic',
    name: 'Psychedelic Fuzz & Vibe',
    author: 'Jimi Vibe',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Iconic 1969 Woodstock lead tone: roaring silicon fuzz into dynamic wah sweep, tube compression, and tape delay.',
    tags: ['Vintage', 'Fuzz', 'Wah', 'Psychedelic', '60s Rock'],
    bpm: 110,
    likes: 428,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'jcm-800')!,
      gain: 6.2,
      bass: 6.0,
      mid: 7.2,
      treble: 7.5,
      presence: 8.0,
      master: 7.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'marshall-412-v30')!,
      micDistance: 30
    },
    pedals: [
      {
        id: 'pedal-wah-1',
        type: 'autoWah',
        name: 'CryAuto Wah',
        enabled: true,
        color: '#262626',
        accentColor: '#f59e0b',
        sensitivity: 65,
        range: 75,
        resonance: 68,
        mode: 'envelope'
      },
      {
        id: 'pedal-fuzz-1',
        type: 'fuzz',
        name: 'Smiley Fuzz Face',
        enabled: true,
        color: '#dc2626',
        accentColor: '#ffffff',
        fuzz: 82,
        tone: 58,
        volume: 70,
        scoop: 35
      },
      {
        id: 'pedal-delay-1',
        type: 'delay',
        name: 'Space Tape Echo',
        enabled: true,
        color: '#047857',
        accentColor: '#34d399',
        time: 340,
        feedback: 42,
        mix: 30,
        flutter: 55,
        pingPong: false
      }
    ]
  },
  {
    id: 'gilmour-lead',
    name: 'Comfortably Soaring Lead',
    author: 'David Echoes',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Immense singing sustain, plush liquid chorus, and spacious rhythmic delay with shimmering ambient trails.',
    tags: ['Floyd', 'Big Muff', 'Chorus', 'Singing Sustain', 'Solo'],
    bpm: 125,
    likes: 612,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 4.5,
      bass: 7.0,
      mid: 6.5,
      treble: 6.2,
      presence: 6.0,
      master: 8.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 40
    },
    pedals: [
      {
        id: 'pedal-comp-1',
        type: 'compressor',
        name: 'DynaSqueeze',
        enabled: true,
        color: '#ea580c',
        accentColor: '#ffffff',
        sustain: 78,
        attack: 25,
        level: 65,
        blend: 80
      },
      {
        id: 'pedal-fuzz-gilmour',
        type: 'fuzz',
        name: 'Muff Sustainer',
        enabled: true,
        color: '#475569',
        accentColor: '#ef4444',
        fuzz: 70,
        tone: 45,
        volume: 68,
        scoop: 60
      },
      {
        id: 'pedal-chorus-1',
        type: 'chorus',
        name: 'Analog CE-2 Vibe',
        enabled: true,
        color: '#2563eb',
        accentColor: '#93c5fd',
        rate: 30,
        depth: 62,
        mix: 45,
        tone: 60
      },
      {
        id: 'pedal-delay-gilmour',
        type: 'delay',
        name: 'Memory Delay 440ms',
        enabled: true,
        color: '#065f46',
        accentColor: '#6ee7b7',
        time: 440,
        feedback: 48,
        mix: 38,
        flutter: 25,
        pingPong: true
      },
      {
        id: 'pedal-reverb-1',
        type: 'reverb',
        name: 'Plate Room Space',
        enabled: true,
        color: '#4338ca',
        accentColor: '#a5b4fc',
        decay: 55,
        preDelay: 20,
        mix: 35,
        damping: 40,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  },
  {
    id: 'srv-texas-blues',
    name: 'Texas Flood Blues Crunch',
    author: 'Stevie Ray Fan',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Iconic mid-hump TS808 tube overdrive pushing warm tweed tubes into dynamic touch-sensitive blues roar.',
    tags: ['SRV', 'Blues', 'TS808', 'Tweed', 'Dynamic'],
    bpm: 115,
    likes: 389,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 5.2,
      bass: 6.8,
      mid: 6.0,
      treble: 6.5,
      presence: 7.0,
      master: 7.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 35
    },
    pedals: [
      {
        id: 'pedal-ts808',
        type: 'overdrive',
        name: 'Tube Screamer 808',
        enabled: true,
        color: '#15803d',
        accentColor: '#86efac',
        drive: 45,
        tone: 65,
        level: 80,
        bassBoost: true
      },
      {
        id: 'pedal-reverb-spring',
        type: 'reverb',
        name: "'63 Spring Tank",
        enabled: true,
        color: '#0e7490',
        accentColor: '#67e8f9',
        decay: 40,
        preDelay: 10,
        mix: 28,
        damping: 30,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'metallica-thrash',
    name: 'Master of Chug Metal',
    author: 'Hetfield Rhythms',
    instrument: 'guitar',
    genre: 'Metal',
    description: 'Tight scooped modern thrash metal rhythm: high-gain 5150 punch, noise gate silence, and graphic 7-band EQ V-curve.',
    tags: ['Thrash', '5150', 'Noise Gate', 'Scooped EQ', 'Heavy'],
    bpm: 190,
    likes: 512,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'pv-5150')!,
      gain: 8.2,
      bass: 7.5,
      mid: 3.5,
      treble: 7.8,
      presence: 8.0,
      master: 6.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'mesa-412-recto')!,
      micDistance: 20
    },
    pedals: [
      {
        id: 'pedal-noise-gate-1',
        type: 'noiseGate',
        name: 'Decimator Gate',
        enabled: true,
        color: '#1e293b',
        accentColor: '#e2e8f0',
        threshold: -50,
        release: 30
      },
      {
        id: 'pedal-ts-boost',
        type: 'overdrive',
        name: 'Clean Overdrive Boost',
        enabled: true,
        color: '#166534',
        accentColor: '#bbf7d0',
        drive: 10,
        tone: 75,
        level: 90,
        bassBoost: false
      },
      {
        id: 'pedal-eq-scoop',
        type: 'eq',
        name: 'Graphic 7-Band Scoop',
        enabled: true,
        color: '#334155',
        accentColor: '#38bdf8',
        band100: 4,
        band200: 2,
        band400: -3,
        band800: -6,
        band1600: -2,
        band3200: 3,
        band6400: 4,
        level: 1
      }
    ]
  },
  {
    id: 'flea-slap-bass',
    name: 'Red Hot Slap & Pop Bass',
    author: 'Flea Grooves',
    instrument: 'bass',
    genre: 'Funk',
    description: 'Punchy percussive slap bass foundation with high transient snap, envelope filter funk, and 8x10 Ampeg tube grunt.',
    tags: ['Bass', 'Slap', 'Funk', 'Ampeg SVT', 'Envelope'],
    bpm: 110,
    likes: 470,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'ampeg-svt')!,
      gain: 4.8,
      bass: 7.8,
      mid: 6.2,
      treble: 5.8,
      presence: 6.5,
      master: 8.2
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'ampeg-810-fridge')!,
      micDistance: 35
    },
    pedals: [
      {
        id: 'pedal-bass-comp',
        type: 'compressor',
        name: 'Punch Bass Comp',
        enabled: true,
        color: '#b45309',
        accentColor: '#fde68a',
        sustain: 65,
        attack: 15,
        level: 70,
        blend: 85
      },
      {
        id: 'pedal-bass-autowah',
        type: 'autoWah',
        name: 'Mu-Tron Funk Filter',
        enabled: true,
        color: '#7c3aed',
        accentColor: '#c084fc',
        sensitivity: 58,
        range: 65,
        resonance: 60,
        mode: 'envelope'
      }
    ]
  },
  {
    id: 'tool-justin-bass',
    name: 'Tool Progressive Bass Monster',
    author: 'Chancellor Tone',
    instrument: 'bass',
    genre: 'Metal',
    description: 'Aggressive bi-amp style modern bass: Darkglass B7K upper-mid growl, lush flanger sweep, and sub-octave foundation.',
    tags: ['Prog Rock', 'Darkglass', 'Flanger', 'Heavy Bass', 'Modern'],
    bpm: 130,
    likes: 584,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'darkglass-b7k')!,
      gain: 6.5,
      bass: 7.0,
      mid: 7.4,
      treble: 7.8,
      presence: 7.2,
      master: 7.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'darkglass-410-neo')!,
      micDistance: 30
    },
    pedals: [
      {
        id: 'pedal-bass-flanger',
        type: 'flanger',
        name: 'Electric Flanger Jet',
        enabled: true,
        color: '#581c87',
        accentColor: '#e9d5ff',
        rate: 22,
        depth: 68,
        feedback: 62,
        manual: 40
      },
      {
        id: 'pedal-pitch-whammy',
        type: 'pitchShifter',
        name: 'Whammy Octave Drop',
        enabled: false,
        color: '#b91c1c',
        accentColor: '#fca5a5',
        shift: -12,
        detune: 0,
        mix: 50,
        octaveBlend: true
      },
      {
        id: 'pedal-delay-bass',
        type: 'delay',
        name: 'Pulsing Bass Delay',
        enabled: true,
        color: '#134e4a',
        accentColor: '#5eead4',
        time: 320,
        feedback: 35,
        mix: 25,
        flutter: 10,
        pingPong: false
      }
    ]
  },
  {
    id: 'polyphia-neo-sparkle',
    name: 'Neo-Soul Sparkle & Tap',
    author: 'Tim Poly',
    instrument: 'guitar',
    genre: 'Pop',
    description: 'Hyper-articulate percussive math-rock/neo-soul tone: fast studio compressor, intelligent 5th harmonizer, chorus shimmer.',
    tags: ['Neo-Soul', 'Polyphia', 'Harmonizer', 'Sparkle Clean', 'Modern'],
    bpm: 135,
    likes: 642,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'vox-ac30')!,
      gain: 3.8,
      bass: 5.5,
      mid: 6.8,
      treble: 8.2,
      presence: 7.5,
      master: 8.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'vox-212-alnico')!,
      micDistance: 30
    },
    pedals: [
      {
        id: 'pedal-comp-fast',
        type: 'compressor',
        name: 'Studio Optical Comp',
        enabled: true,
        color: '#0369a1',
        accentColor: '#7dd3fc',
        sustain: 72,
        attack: 12,
        level: 70,
        blend: 85
      },
      {
        id: 'pedal-harmonizer-5th',
        type: 'harmonizer',
        name: 'Smart 5th Harmonizer',
        enabled: true,
        color: '#6d28d9',
        accentColor: '#d8b4fe',
        key: 'E',
        scale: 'minor',
        interval: '5th',
        harmonyLevel: 55,
        directLevel: 90
      },
      {
        id: 'pedal-chorus-clean',
        type: 'chorus',
        name: 'Dimensional Chorus',
        enabled: true,
        color: '#1d4ed8',
        accentColor: '#bfdbfe',
        rate: 28,
        depth: 50,
        mix: 38,
        tone: 75
      },
      {
        id: 'pedal-reverb-shimmer',
        type: 'reverb',
        name: 'Celestial Shimmer',
        enabled: true,
        color: '#581c87',
        accentColor: '#f0abfc',
        decay: 65,
        preDelay: 25,
        mix: 38,
        damping: 30,
        shimmer: true,
        roomType: 'hall'
      }
    ]
  },
  {
    id: 'ambient-dreamscape',
    name: 'Ambient Ethereal Dreamscape',
    author: 'Shoegaze Cloud',
    instrument: 'guitar',
    genre: 'Ambient',
    description: 'Infinite sonic cathedral: slow phaser wash, modulated ping-pong stereo echoes, and blooming hall reverb.',
    tags: ['Ambient', 'Post-Rock', 'Phaser', 'Ping-Pong', 'Ethereal'],
    bpm: 85,
    likes: 495,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 3.2,
      bass: 6.0,
      mid: 5.5,
      treble: 6.0,
      presence: 5.8,
      master: 8.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 50
    },
    pedals: [
      {
        id: 'pedal-phaser-ambient',
        type: 'phaser',
        name: 'Slow Phase 90',
        enabled: true,
        color: '#ea580c',
        accentColor: '#fed7aa',
        speed: 15,
        depth: 75,
        feedback: 45,
        stages: 4
      },
      {
        id: 'pedal-delay-ambient',
        type: 'delay',
        name: 'Stereo Cloud Delay',
        enabled: true,
        color: '#0891b2',
        accentColor: '#a5f3fc',
        time: 580,
        feedback: 65,
        mix: 50,
        flutter: 40,
        pingPong: true
      },
      {
        id: 'pedal-reverb-ambient',
        type: 'reverb',
        name: 'Cathedral Hall Reverb',
        enabled: true,
        color: '#4f46e5',
        accentColor: '#c7d2fe',
        decay: 88,
        preDelay: 45,
        mix: 55,
        damping: 25,
        shimmer: true,
        roomType: 'hall'
      }
    ]
  },
  {
    id: 'fender-blackface-glassy-clean',
    name: "Glassy Blackface '65 Clean",
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Pristine, 3D crystalline cleans using the Fender \'65 Deluxe Reverb NAM profile with optical compressor, analog chorus, and lush spring tank reverb.',
    tags: ['Crystalline Clean', 'Real NAM', '6V6 Bloom', 'Studio Clean', 'Dynamic'],
    bpm: 105,
    likes: 642,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'deluxe')!,
      gain: 3.2,
      bass: 5.6,
      mid: 5.8,
      treble: 6.8,
      presence: 6.0,
      master: 8.2
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 38,
      lowCut: 70,
      highCut: 8500
    },
    pedals: [
      {
        id: 'pedal-comp-clean-1',
        type: 'compressor',
        name: 'Studio Optical Comp',
        enabled: true,
        color: '#b45309',
        accentColor: '#fde68a',
        sustain: 48,
        attack: 28,
        level: 65,
        blend: 60
      },
      {
        id: 'pedal-chorus-clean-1',
        type: 'chorus',
        name: 'CE-2 Analog Chorus',
        enabled: false,
        color: '#0284c7',
        accentColor: '#7dd3fc',
        rate: 22,
        depth: 45,
        mix: 35,
        tone: 50
      },
      {
        id: 'pedal-reverb-clean-1',
        type: 'reverb',
        name: 'Blackface Spring Tank',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 42,
        preDelay: 18,
        mix: 32,
        damping: 30,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'tweed-59-edge-of-breakup',
    name: "Tweed '59 Edge-of-Breakup",
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Dynamic touch-sensitive threshold where soft pick attack stays warm and glassy, but digging in digs out glorious organic tube grit and harmonic bloom.',
    tags: ['Edge of Breakup', 'Tweed 59', 'Touch Sensitive', 'Roots Rock', 'Organic'],
    bpm: 112,
    likes: 819,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 4.8,
      bass: 6.2,
      mid: 6.6,
      treble: 5.6,
      presence: 5.4,
      master: 8.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 32,
      lowCut: 75,
      highCut: 7200
    },
    pedals: [
      {
        id: 'pedal-boost-edge-1',
        type: 'overdrive',
        name: 'Transparent Clean Boost',
        enabled: true,
        color: '#eab308',
        accentColor: '#fef08a',
        drive: 18,
        tone: 54,
        level: 78
      },
      {
        id: 'pedal-tremolo-edge-1',
        type: 'tremolo',
        name: 'Bias Tube Tremolo',
        enabled: false,
        color: '#7c3aed',
        accentColor: '#c4b5fd',
        speed: 35,
        depth: 50,
        waveform: 'sine'
      },
      {
        id: 'pedal-reverb-edge-1',
        type: 'reverb',
        name: 'Vintage Room Reverb',
        enabled: true,
        color: '#475569',
        accentColor: '#cbd5e1',
        decay: 35,
        preDelay: 15,
        mix: 25,
        damping: 35,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'vox-ac30-chime-breakup',
    name: 'Vox AC30 Top Boost Chime & Grit',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Quintessential British jangly indie & British Invasion tone: sparkling highs, natural EL84 power sag on pick attack, paired with Alnico Blue speakers.',
    tags: ['Edge of Breakup', 'Vox AC30', 'British Chime', 'Alnico Blue', 'Jangle'],
    bpm: 124,
    likes: 756,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'vox-ac30')!,
      gain: 5.0,
      bass: 5.2,
      mid: 6.8,
      treble: 7.2,
      presence: 6.2,
      master: 7.6
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'vox-212-alnico')!,
      micDistance: 28,
      lowCut: 80,
      highCut: 8000
    },
    pedals: [
      {
        id: 'pedal-delay-vox-1',
        type: 'delay',
        name: 'Tape Slapback Echo',
        enabled: true,
        color: '#d97706',
        accentColor: '#fed7aa',
        time: 140,
        feedback: 22,
        mix: 28,
        flutter: 15,
        pingPong: false
      },
      {
        id: 'pedal-reverb-vox-1',
        type: 'reverb',
        name: 'Alnico Room Ambiance',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 30,
        preDelay: 10,
        mix: 22,
        damping: 40,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  },
  {
    id: 'country-nashville-clean',
    name: 'Nashville Tele Compressor Clean',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Pop',
    description: 'Ultra-tight, percussive Nashville chicken-picking clean. Fast optical compressor squashes attack with singing sustain and crystalline sparkle.',
    tags: ['Nashville Clean', 'Ultra Clean', 'Fingerpicking', 'Country', 'Snappy'],
    bpm: 130,
    likes: 512,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'deluxe')!,
      gain: 2.8,
      bass: 5.0,
      mid: 6.2,
      treble: 7.5,
      presence: 6.5,
      master: 8.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 25,
      lowCut: 85,
      highCut: 9000
    },
    pedals: [
      {
        id: 'pedal-comp-nashville',
        type: 'compressor',
        name: 'DynaSqueeze Chicken Picker',
        enabled: true,
        color: '#dc2626',
        accentColor: '#fca5a5',
        sustain: 68,
        attack: 15,
        level: 70,
        blend: 85
      },
      {
        id: 'pedal-delay-slap-nashville',
        type: 'delay',
        name: 'Rockabilly Slapback',
        enabled: true,
        color: '#0284c7',
        accentColor: '#7dd3fc',
        time: 110,
        feedback: 18,
        mix: 32,
        flutter: 10,
        pingPong: false
      }
    ]
  },
  {
    id: 'klon-transparent-breakup',
    name: 'Centaur Transparent K-Style Breakup',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Gold Klon-style transparent mid push driving a deluxe tube stage right at the edge of breakup. Retains full low end with punchy vocal midrange.',
    tags: ['Edge of Breakup', 'K-Style', 'Transparent OD', 'Touch Dynamics', 'Solo Clean'],
    bpm: 118,
    likes: 923,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'deluxe')!,
      gain: 4.2,
      bass: 5.8,
      mid: 5.5,
      treble: 6.2,
      presence: 5.8,
      master: 7.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'celestion-v30')!,
      micDistance: 32,
      lowCut: 75,
      highCut: 7500
    },
    pedals: [
      {
        id: 'pedal-od-klon',
        type: 'overdrive',
        name: 'Centaur Mythical OD',
        enabled: true,
        color: '#ca8a04',
        accentColor: '#fef08a',
        drive: 32,
        tone: 58,
        level: 72
      },
      {
        id: 'pedal-delay-klon',
        type: 'delay',
        name: 'Warm Analog Delay',
        enabled: true,
        color: '#0284c7',
        accentColor: '#38bdf8',
        time: 340,
        feedback: 32,
        mix: 25,
        flutter: 20,
        pingPong: false
      },
      {
        id: 'pedal-reverb-klon',
        type: 'reverb',
        name: 'Studio Plate Reverb',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 40,
        preDelay: 15,
        mix: 28,
        damping: 30,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  },
  {
    id: 'roland-jc120-pristine-clean',
    name: 'Roland JC-120 Pristine Clean',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Pop',
    description: 'The golden standard of 100% distortion-free solid-state cleans. Infinite headroom, lush dimension chorus, studio optical compression, and sparkling silver cone transducers.',
    tags: ['Ultra Clean', 'Roland JC-120', 'Zero Breakup', 'Solid State', 'Lush Chorus'],
    bpm: 110,
    likes: 980,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'roland-jc120')!,
      gain: 2.2,
      bass: 5.4,
      mid: 5.0,
      treble: 6.5,
      presence: 6.8,
      master: 8.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'roland-jc120-212')!,
      micDistance: 35,
      lowCut: 60,
      highCut: 8800
    },
    pedals: [
      {
        id: 'pedal-comp-jc120',
        type: 'compressor',
        name: 'Studio Optical Comp',
        enabled: true,
        color: '#b45309',
        accentColor: '#fde68a',
        sustain: 40,
        attack: 25,
        level: 60,
        blend: 50
      },
      {
        id: 'pedal-chorus-jc120',
        type: 'chorus',
        name: 'JC Dimension Chorus',
        enabled: true,
        color: '#0284c7',
        accentColor: '#7dd3fc',
        rate: 28,
        depth: 55,
        mix: 45,
        tone: 60
      },
      {
        id: 'pedal-reverb-jc120',
        type: 'reverb',
        name: 'Stereo Plate Ambience',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 35,
        preDelay: 12,
        mix: 25,
        damping: 30,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  },
  {
    id: 'studio-di-pure-clean',
    name: 'Studio Active DI Line Clean',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Direct console line-in fidelity with flat frequency response and pristine transparency. Clean compressor and lush hall reverb for acoustic or electric direct recording.',
    tags: ['Direct Injection', 'Console Clean', 'Flat Response', 'Acoustic/Electric', 'Zero Distortion'],
    bpm: 100,
    likes: 720,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'roland-jc120')!,
      name: 'Studio Class-A Clean Preamp',
      gain: 2.0,
      bass: 5.0,
      mid: 5.0,
      treble: 5.0,
      presence: 5.0,
      master: 8.0,
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'studio-clean-di')!,
      micDistance: 0,
      lowCut: 50,
      highCut: 12000
    },
    pedals: [
      {
        id: 'pedal-comp-di',
        type: 'compressor',
        name: 'Transparent Studio Leveler',
        enabled: true,
        color: '#3b82f6',
        accentColor: '#bfdbfe',
        sustain: 35,
        attack: 30,
        level: 55,
        blend: 40
      },
      {
        id: 'pedal-reverb-di',
        type: 'reverb',
        name: 'Acoustic Studio Hall',
        enabled: true,
        color: '#4f46e5',
        accentColor: '#c7d2fe',
        decay: 45,
        preDelay: 20,
        mix: 30,
        damping: 30,
        shimmer: false,
        roomType: 'hall'
      }
    ]
  },
  {
    id: 'fender-twin-reverb-ultraclean',
    name: "Fender '65 Twin Reverb Studio Clean",
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Iconic 100W all-tube American giant with immense clean headroom. High dynamic punch, crystalline open highs, tight low end, and zero unwanted preamp clipping.',
    tags: ['Ultra Clean', 'Twin Reverb', '100W Headroom', 'Jensen 2x12', 'Pristine'],
    bpm: 115,
    likes: 840,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'twin-reverb-ultraclean')!,
      gain: 2.2,
      bass: 5.8,
      mid: 4.8,
      treble: 6.8,
      presence: 6.0,
      master: 8.2
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'fender-212-twin')!,
      micDistance: 35,
      lowCut: 65,
      highCut: 7500
    },
    pedals: [
      {
        id: 'pedal-eq-twin',
        type: 'eq',
        name: 'Studio Graphic EQ',
        enabled: true,
        color: '#0284c7',
        accentColor: '#38bdf8',
        band100: 1.0,
        band200: 0.5,
        band400: 0.0,
        band800: 1.2,
        band1600: 2.0,
        band3200: 1.5,
        band6400: 0.5,
        level: 0.0
      },
      {
        id: 'pedal-reverb-twin',
        type: 'reverb',
        name: 'Twin Spring Tank Reverb',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 40,
        preDelay: 15,
        mix: 26,
        damping: 35,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'warm-velvet-jazz-clean',
    name: 'Warm Velvet Jazz Clean (Joe Pass / Wes)',
    author: 'ToneCraft Studio',
    instrument: 'guitar',
    genre: 'Jazz',
    description: 'Warm, dark, velvety solid-state clean tone with zero distortion and rich woody low-mids through vintage 1x15 jazz enclosure.',
    tags: ['Jazz Clean', 'Polytone', 'Warm', 'Zero Distortion', 'Velvet Tone'],
    bpm: 96,
    likes: 670,
    isCommunity: false,
    namModel: {
      ...BUILT_IN_NAM_MODELS.find(m => m.id === 'polytone-mini-brute')!,
      gain: 2.2,
      bass: 6.8,
      mid: 4.6,
      treble: 4.2,
      presence: 4.0,
      master: 8.2
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS.find(c => c.id === 'polytone-115-jazz')!,
      micDistance: 30,
      lowCut: 55,
      highCut: 5500
    },
    pedals: [
      {
        id: 'pedal-reverb-jazz',
        type: 'reverb',
        name: 'Velvet Room Ambiance',
        enabled: true,
        color: '#475569',
        accentColor: '#94a3b8',
        decay: 30,
        preDelay: 10,
        mix: 20,
        damping: 40,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  }
];

// Local storage key for persistent community and user presets
const STORAGE_KEY = 'tonecraft_user_presets';

export function getStoredPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PRESETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_PRESETS;
    
    // Merge any missing default presets while retaining user-created and modified presets
    const existingIds = new Set(parsed.map((p: Preset) => p.id));
    const merged = [...parsed];
    for (const initPreset of INITIAL_PRESETS) {
      if (!existingIds.has(initPreset.id)) {
        merged.push(initPreset);
      }
    }

    // Sanitize engineMode and isRealNam on all loaded presets
    return merged.map((p: Preset) => {
      if (!p.namModel) return p;
      const isNam = isNamModelProfile(p.namModel);
      const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isNam
        ? 'wasm-nam'
        : (p.namModel.engineMode && p.namModel.engineMode !== 'wasm-nam' ? p.namModel.engineMode : 'hd-triode');
      return {
        ...p,
        namModel: {
          ...p.namModel,
          isRealNam: isNam,
          engineMode: targetEngine
        }
      };
    });
  } catch {
    return INITIAL_PRESETS;
  }
}

export function savePresetsToStorage(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to save presets to localStorage:', err);
  }
}

/**
 * Encodes preset into a compact base64 URL parameter for instant sharing
 */
export function encodePresetToShareUrl(preset: Preset): string {
  try {
    const minimalData = {
      name: preset.name,
      inst: preset.instrument,
      genre: preset.genre,
      bpm: preset.bpm,
      nam: {
        id: preset.namModel.id,
        g: preset.namModel.gain,
        b: preset.namModel.bass,
        m: preset.namModel.mid,
        t: preset.namModel.treble,
        p: preset.namModel.presence,
        vol: preset.namModel.master
      },
      cab: {
        id: preset.irCabinet.id,
        dist: preset.irCabinet.micDistance
      },
      pedals: preset.pedals
    };
    const jsonStr = JSON.stringify(minimalData);
    const b64 = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.href);
    url.searchParams.set('preset', b64);
    return url.toString();
  } catch (e) {
    console.error('Failed to encode preset to URL:', e);
    return window.location.href;
  }
}

/**
 * Decodes preset from base64 URL parameter
 */
export function decodePresetFromShareUrl(): Preset | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get('preset');
    if (!b64) return null;

    const jsonStr = decodeURIComponent(atob(b64));
    const data = JSON.parse(jsonStr);

    const baseNam = BUILT_IN_NAM_MODELS.find(m => m.id === data.nam.id) || BUILT_IN_NAM_MODELS[0];
    const baseCab = BUILT_IN_IR_CABINETS.find(c => c.id === data.cab.id) || BUILT_IN_IR_CABINETS[0];

    const preset: Preset = {
      id: `shared-${Date.now()}`,
      name: data.name || 'Shared Preset',
      author: 'Shared Musician',
      instrument: data.inst || 'guitar',
      genre: data.genre || 'Rock',
      description: 'Loaded from shared URL link.',
      tags: ['Shared', data.genre || 'Rock'],
      bpm: data.bpm || 120,
      likes: 1,
      isCommunity: true,
      namModel: {
        ...baseNam,
        gain: data.nam.g ?? baseNam.gain,
        bass: data.nam.b ?? baseNam.bass,
        mid: data.nam.m ?? baseNam.mid,
        treble: data.nam.t ?? baseNam.treble,
        presence: data.nam.p ?? baseNam.presence,
        master: data.nam.vol ?? baseNam.master
      },
      irCabinet: {
        ...baseCab,
        micDistance: data.cab.dist ?? baseCab.micDistance
      },
      pedals: data.pedals || []
    };
    return preset;
  } catch (e) {
    console.error('Failed to decode preset from URL parameter:', e);
    return null;
  }
}
