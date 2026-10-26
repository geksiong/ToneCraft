import { Preset } from '../types/pedal';
import { BUILT_IN_AMP_MODELS, isNamModelProfile } from '../audio/ampModels';
import { BUILT_IN_IR_CABINETS } from '../audio/irData';

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'guitar-hendrix-univibe-woodstock',
    name: '1969 Woodstock Psychedelic Vibe',
    author: 'ToneCraft Vintage Labs',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Jimi Hendrix Woodstock tone: Swirling 4-stage optical Uni-Vibe bulb -> Klon Centaur boosting into Germanium Silicon Fuzz -> Tape Echo -> Marshall JCM800.',
    tags: ['UniVibe', 'Psychedelic', 'Hendrix', 'Fuzz', 'Klon', 'Vintage'],
    bpm: 104,
    likes: 940,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[3] || BUILT_IN_AMP_MODELS[0],
      gain: 5.5,
      bass: 6.2,
      mid: 7.0,
      treble: 6.5,
      presence: 6.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-vibe-woodstock-1',
        type: 'uniVibe',
        name: 'Rotary Uni-Vibe',
        enabled: true,
        color: '#7e22ce',
        speed: 3.2,
        intensity: 85,
        mode: 'chorus',
        lampBias: 60,
        mix: 85
      },
      {
        id: 'pedal-klon-woodstock-1',
        type: 'klonOverdrive',
        name: 'Centaur Gold OD',
        enabled: true,
        color: '#ca8a04',
        gain: 35,
        treble: 55,
        output: 75,
        cleanBlend: 65
      },
      {
        id: 'pedal-fuzz-woodstock-1',
        type: 'fuzz',
        name: 'Vintage Big Fuzz',
        enabled: true,
        color: '#b91c1c',
        fuzz: 68,
        tone: 58,
        volume: 62,
        scoop: 30
      },
      {
        id: 'pedal-delay-woodstock-1',
        type: 'delay',
        name: 'Space Tape Delay',
        enabled: true,
        color: '#047857',
        time: 320,
        feedback: 40,
        mix: 30,
        flutter: 45,
        pingPong: false
      }
    ]
  },
  {
    id: 'guitar-slowdive-shoegaze-bloom',
    name: 'Slowdive Cathedral Reverse Bloom',
    author: 'ToneCraft Ambient Works',
    instrument: 'guitar',
    genre: 'Shoegaze',
    description: 'The definitive My Bloody Valentine / Slowdive dreampop wall: 100% Wet Reverse Reverb Bloom -> Crystal Pitch Delay (+12th cascade) -> Tape Glitch -> Vox AC10 NAM.',
    tags: ['Shoegaze', 'ReverseReverb', 'Crystals', 'Ambient', 'DreamPop', 'Bloom'],
    bpm: 88,
    likes: 890,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      gain: 4.2,
      bass: 6.0,
      mid: 6.5,
      treble: 7.2,
      presence: 6.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[1] || BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-revreb-slowdive-1',
        type: 'reverseReverb',
        name: 'Shoegaze Reverse',
        enabled: true,
        color: '#be185d',
        time: 750,
        preDelay: 40,
        feedback: 45,
        damping: 25,
        mix: 80
      },
      {
        id: 'pedal-crystal-slowdive-1',
        type: 'crystalDelay',
        name: 'Crystal Pitch Echo',
        enabled: true,
        color: '#0891b2',
        time: 420,
        interval: '+12th',
        feedback: 60,
        shimmer: 70,
        reverse: false,
        mix: 55
      },
      {
        id: 'pedal-glitch-slowdive-1',
        type: 'tapeGlitch',
        name: 'Tape Glitch / Rev',
        enabled: true,
        color: '#d97706',
        direction: 'reverse',
        sliceLength: 480,
        pitch: 0,
        randomGlitch: 25,
        wowFlutter: 40,
        feedback: 35,
        mix: 45
      }
    ]
  },
  {
    id: 'guitar-brownface-harmonic-shimmer',
    name: '1962 Brownface Harmonic Swell',
    author: 'ToneCraft Americana Dept',
    instrument: 'guitar',
    genre: 'Blues',
    description: 'Americana roots tone: Slow Gear bowed violining swell -> Klon Centaur transparent edge-of-breakup -> 1962 Brownface Harmonic Tremolo -> Studio Spring Reverb.',
    tags: ['HarmonicTremolo', 'Brownface', 'SlowGear', 'Klon', 'Roots', 'Americana'],
    bpm: 92,
    likes: 780,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[4] || BUILT_IN_AMP_MODELS[0],
      gain: 4.2,
      bass: 6.2,
      mid: 5.5,
      treble: 6.0,
      presence: 5.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[3] || BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-slow-brown-1',
        type: 'slowGear',
        name: 'Auto-Swell Gear',
        enabled: true,
        color: '#0284c7',
        attack: 380,
        sensitivity: 70,
        release: 160,
        mix: 100
      },
      {
        id: 'pedal-klon-brown-1',
        type: 'klonOverdrive',
        name: 'Centaur Gold OD',
        enabled: true,
        color: '#ca8a04',
        gain: 42,
        treble: 52,
        output: 70,
        cleanBlend: 60
      },
      {
        id: 'pedal-harmtrem-brown-1',
        type: 'harmonicTremolo',
        name: '1962 Brown Tremolo',
        enabled: true,
        color: '#b45309',
        rate: 3.2,
        depth: 75,
        crossover: 680,
        waveform: 'sine',
        mix: 90
      },
      {
        id: 'pedal-reverb-brown-1',
        type: 'reverb',
        name: 'Celestial Reverb',
        enabled: true,
        color: '#4338ca',
        decay: 55,
        preDelay: 15,
        damping: 35,
        shimmer: false,
        roomType: 'spring',
        mix: 40
      }
    ]
  },
  {
    id: 'guitar-cathedral-multi-octave-organ',
    name: 'Cathedral Pipe Organ & 12-String',
    author: 'ToneCraft Symphonic Studio',
    instrument: 'guitar',
    genre: 'Ambient',
    description: 'Turns any 6-string into a cathedral pipe organ: Slow Gear pick removal -> Multi-Octave Generator (-2, -1, Dry, +1, +2) -> Crystal Delay (+5th harmony) -> Celestial Reverb.',
    tags: ['POG', 'Octave', 'Organ', 'SlowGear', 'Crystals', 'Symphonic'],
    bpm: 72,
    likes: 855,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[1] || BUILT_IN_AMP_MODELS[0],
      gain: 4.5,
      bass: 6.8,
      mid: 5.8,
      treble: 6.5,
      presence: 6.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-slow-organ-1',
        type: 'slowGear',
        name: 'Auto-Swell Gear',
        enabled: true,
        color: '#0284c7',
        attack: 320,
        sensitivity: 75,
        release: 200,
        mix: 100
      },
      {
        id: 'pedal-pog-organ-1',
        type: 'multiOctave',
        name: 'Poly Octave Gen',
        enabled: true,
        color: '#b91c1c',
        sub2: 45,
        sub1: 65,
        dry: 70,
        oct1: 75,
        oct2: 40,
        tone: 70
      },
      {
        id: 'pedal-crystal-organ-1',
        type: 'crystalDelay',
        name: 'Crystal Pitch Echo',
        enabled: true,
        color: '#0891b2',
        time: 360,
        interval: '+5th',
        feedback: 48,
        shimmer: 55,
        reverse: false,
        mix: 45
      },
      {
        id: 'pedal-reverb-organ-1',
        type: 'reverb',
        name: 'Celestial Reverb',
        enabled: true,
        color: '#4338ca',
        decay: 75,
        preDelay: 25,
        damping: 30,
        shimmer: true,
        roomType: 'hall',
        mix: 55
      }
    ]
  },
  {
    id: 'guitar-funkadelic-talking-wah',
    name: 'Funkadelic Talking Envelope Wah',
    author: 'ToneCraft Groove Foundry',
    instrument: 'guitar',
    genre: 'Funk',
    description: 'High-octane funk & quack: DynaSqueeze Optical Compression -> Talking Box Vocal Wah (ya-ya / ow-ow) -> Klon Centaur drive -> Ping-Pong Delay.',
    tags: ['TalkingWah', 'Funk', 'Envelope', 'Formant', 'Klon', 'Groove'],
    bpm: 116,
    likes: 730,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[7] || BUILT_IN_AMP_MODELS[0],
      gain: 3.5,
      bass: 6.5,
      mid: 6.0,
      treble: 7.0,
      presence: 6.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[3] || BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-comp-funk-1',
        type: 'compressor',
        name: 'DynaSqueeze Comp',
        enabled: true,
        color: '#b45309',
        sustain: 65,
        attack: 15,
        level: 70,
        blend: 85
      },
      {
        id: 'pedal-talk-funk-1',
        type: 'talkingWah',
        name: 'Talking Vocal Wah',
        enabled: true,
        color: '#8b5cf6',
        vowel: 'ya-ya',
        sensitivity: 72,
        direction: 'up',
        resonance: 8,
        drive: 35,
        mix: 90
      },
      {
        id: 'pedal-klon-funk-1',
        type: 'klonOverdrive',
        name: 'Centaur Gold OD',
        enabled: true,
        color: '#ca8a04',
        gain: 38,
        treble: 58,
        output: 75,
        cleanBlend: 50
      },
      {
        id: 'pedal-delay-funk-1',
        type: 'delay',
        name: 'Space Tape Delay',
        enabled: true,
        color: '#047857',
        time: 240,
        feedback: 35,
        mix: 25,
        flutter: 20,
        pingPong: true
      }
    ]
  },
  {
    id: 'vocal-trap-hard-tune-autotune',
    name: 'Trap Hard-Tune & Vocal Polish',
    author: 'ToneCraft Urban Audio',
    instrument: 'vocal',
    genre: 'Vocal',
    description: 'Modern billboard vocal strip: Tube Vocal Preamp -> Trap Hard-Tune (0ms instant snap in C Minor) -> Dynamic De-Esser -> Stereo Vocal Doubler -> Plate Reverb.',
    tags: ['AutoTune', 'HardTune', 'Trap', 'Vocal', 'Pop', 'HipHop'],
    bpm: 130,
    likes: 915,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[8] || BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[1] || BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vpre-trap-1',
        type: 'vocalPreamp',
        name: 'Tube Mic Preamp',
        enabled: true,
        color: '#b45309',
        warmth: 55,
        compression: 50,
        air: 65,
        body: 50,
        lowCut: true,
        outputGain: 50
      },
      {
        id: 'pedal-hardtune-trap-1',
        type: 'hardTune',
        name: 'Trap Hard-Tune',
        enabled: true,
        color: '#059669',
        key: 'C',
        scale: 'minor',
        retuneSpeed: 0,
        formantWarp: 0,
        mix: 100
      },
      {
        id: 'pedal-deess-trap-1',
        type: 'deEsser',
        name: 'Vocal De-Esser',
        enabled: true,
        color: '#475569',
        threshold: -24,
        frequency: 6800,
        reduction: 55,
        listen: false,
        bandwidth: 'wide'
      },
      {
        id: 'pedal-vdbl-trap-1',
        type: 'vocalDoubler',
        name: 'Stereo Doubler',
        enabled: true,
        color: '#0284c7',
        detune: 18,
        spread: 85,
        delay: 25,
        depth: 40,
        mix: 45
      },
      {
        id: 'pedal-reverb-trap-1',
        type: 'reverb',
        name: 'Celestial Reverb',
        enabled: true,
        color: '#4338ca',
        decay: 55,
        preDelay: 20,
        damping: 35,
        shimmer: false,
        roomType: 'plate',
        mix: 35
      }
    ]
  },
  {
    id: 'guitar-lofi-vinyl-tape-chill',
    name: 'Lo-Fi Vinyl & Tape Chillout',
    author: 'ToneCraft Nostalgia Labs',
    instrument: 'guitar',
    genre: 'Ambient',
    description: 'Warm cassette & vinyl nostalgia: Slow Gear pad swells -> Lo-Fi Vinyl Saturation (crackle, wow/flutter, cassette head EQ) -> Tape Glitch Warper -> Space Tape Delay.',
    tags: ['LoFi', 'Vinyl', 'Cassette', 'Tape', 'Chillhop', 'Ambient'],
    bpm: 82,
    likes: 840,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[7] || BUILT_IN_AMP_MODELS[0],
      gain: 4.0,
      bass: 6.5,
      mid: 5.5,
      treble: 5.0,
      presence: 4.8
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[3] || BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-slow-lofi-1',
        type: 'slowGear',
        name: 'Auto-Swell Gear',
        enabled: true,
        color: '#0284c7',
        attack: 450,
        sensitivity: 68,
        release: 220,
        mix: 90
      },
      {
        id: 'pedal-vinyl-lofi-1',
        type: 'lofiVinyl',
        name: 'Lo-Fi Vinyl & Tape',
        enabled: true,
        color: '#78350f',
        wear: 55,
        dustCrackle: 60,
        flutter: 50,
        filter: 50,
        saturation: 60,
        mix: 90
      },
      {
        id: 'pedal-glitch-lofi-1',
        type: 'tapeGlitch',
        name: 'Tape Glitch / Rev',
        enabled: true,
        color: '#d97706',
        direction: 'forward',
        sliceLength: 320,
        pitch: 0,
        randomGlitch: 20,
        wowFlutter: 55,
        feedback: 30,
        mix: 45
      },
      {
        id: 'pedal-delay-lofi-1',
        type: 'delay',
        name: 'Space Tape Delay',
        enabled: true,
        color: '#047857',
        time: 400,
        feedback: 45,
        mix: 35,
        flutter: 60,
        pingPong: false
      }
    ]
  },
  {
    id: 'guitar-crystal-dimension-arpeggiator',
    name: 'Crystal Staircase Arpeggiator',
    author: 'ToneCraft Ethereal Labs',
    instrument: 'guitar',
    genre: 'Ambient',
    description: 'Celestial ambient cascade: Multi-Octave Generator (+1 Oct shimmer) -> Optical Uni-Vibe (vibrato swirl) -> Crystal Pitch Delay (+7th fifths & +12th octaves) -> Shoegaze Reverse Reverb.',
    tags: ['Crystals', 'PitchDelay', 'UniVibe', 'Octave', 'Ambient', 'Ethereal'],
    bpm: 80,
    likes: 885,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[1] || BUILT_IN_AMP_MODELS[0],
      gain: 4.0,
      bass: 6.2,
      mid: 5.8,
      treble: 6.8,
      presence: 6.2
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-pog-crystal-1',
        type: 'multiOctave',
        name: 'Poly Octave Gen',
        enabled: true,
        color: '#b91c1c',
        sub2: 0,
        sub1: 25,
        dry: 75,
        oct1: 70,
        oct2: 30,
        tone: 80
      },
      {
        id: 'pedal-vibe-crystal-1',
        type: 'uniVibe',
        name: 'Rotary Uni-Vibe',
        enabled: true,
        color: '#7e22ce',
        speed: 2.2,
        intensity: 70,
        mode: 'vibrato',
        lampBias: 50,
        mix: 70
      },
      {
        id: 'pedal-crystal-stair-1',
        type: 'crystalDelay',
        name: 'Crystal Pitch Echo',
        enabled: true,
        color: '#0891b2',
        time: 450,
        interval: '+7th',
        feedback: 65,
        shimmer: 75,
        reverse: false,
        mix: 60
      },
      {
        id: 'pedal-revreb-crystal-1',
        type: 'reverseReverb',
        name: 'Shoegaze Reverse',
        enabled: true,
        color: '#be185d',
        time: 800,
        preDelay: 30,
        feedback: 40,
        damping: 20,
        mix: 50
      }
    ]
  },
  {
    id: 'guitar-shoegaze-granular-cloud',
    name: 'Shoegaze Granular Dreamscape',
    author: 'ToneCraft Ambient Labs',
    instrument: 'guitar',
    genre: 'Shoegaze',
    description: 'Lush atmospheric dreamscape: Reverse Tape Glitch -> Granular Dream Cloud Shimmer -> Celestial Hall Reverb.',
    tags: ['Granular', 'Shoegaze', 'Ambient', 'Tape', 'Boutique'],
    bpm: 96,
    likes: 820,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      gain: 3.5,
      bass: 6.0,
      mid: 5.5,
      treble: 7.0,
      presence: 6.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-tape-glitch-1',
        type: 'tapeGlitch',
        name: 'Tape Glitch / Rev',
        enabled: true,
        color: '#d97706',
        direction: 'reverse',
        sliceLength: 420,
        pitch: 0,
        randomGlitch: 25,
        wowFlutter: 45,
        feedback: 35,
        mix: 55
      },
      {
        id: 'pedal-granular-cloud-1',
        type: 'granularCloud',
        name: 'Granular Dream Cloud',
        enabled: true,
        color: '#7c3aed',
        grainSize: 160,
        density: 18,
        pitch: 0,
        spray: 45,
        feedback: 55,
        shimmer: true,
        mix: 65
      },
      {
        id: 'pedal-reverb-shoegaze-1',
        type: 'reverb',
        name: 'Celestial Reverb',
        enabled: true,
        color: '#4338ca',
        decay: 75,
        preDelay: 25,
        damping: 30,
        shimmer: false,
        roomType: 'hall',
        mix: 45
      }
    ]
  },
  {
    id: 'guitar-cyberpunk-arcade-synth',
    name: 'Cyberpunk 8-Bit PLL Synth',
    author: 'ToneCraft Glitch Works',
    instrument: 'guitar',
    genre: 'Rock',
    description: 'Boutique glitch PLL guitar synth: 8-Bit Arcade PLL Synth with octave arpeggiation -> Rodent Hard Clipping -> Glitch Tape Warper.',
    tags: ['Synth', '8-Bit', 'PLL', 'Arpeggiator', 'Cyberpunk', 'Fuzz'],
    bpm: 128,
    likes: 672,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[1] || BUILT_IN_AMP_MODELS[0],
      gain: 5.0,
      bass: 7.0,
      mid: 6.0,
      treble: 6.5
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-arcade-synth-1',
        type: 'arcadeSynth',
        name: '8-Bit Arcade PLL',
        enabled: true,
        color: '#e11d48',
        subOctave: '-1',
        crushBits: 8,
        sampleRateDec: 7200,
        arpeggiator: 'octave',
        arpRate: 8,
        glide: 30,
        mix: 80
      },
      {
        id: 'pedal-dist-arcade-1',
        type: 'distortion',
        name: 'Rodent Distortion',
        enabled: true,
        color: '#ea580c',
        gain: 60,
        filter: 40,
        volume: 70
      },
      {
        id: 'pedal-tape-arcade-1',
        type: 'tapeGlitch',
        name: 'Glitch Warper',
        enabled: true,
        color: '#d97706',
        direction: 'alternating',
        sliceLength: 220,
        pitch: 0,
        randomGlitch: 50,
        wowFlutter: 25,
        feedback: 20,
        mix: 40
      }
    ]
  },
  {
    id: 'guitar-infinite-spectral-drone',
    name: 'Ambient Infinite Spectral Drone',
    author: 'ToneCraft Soundscape',
    instrument: 'guitar',
    genre: 'Ambient',
    description: 'Infinite drone sustainer: Spectral Freeze with shimmer bloom -> Granular Cloud -> Modulated Tape Echo.',
    tags: ['Freeze', 'Drone', 'Sustain', 'Ambient', 'Shimmer', 'Pad'],
    bpm: 80,
    likes: 915,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      gain: 2.0,
      bass: 6.5,
      mid: 5.0,
      treble: 7.0
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0]
    },
    pedals: [
      {
        id: 'pedal-freeze-drone-1',
        type: 'spectralFreeze',
        name: 'Spectral Infinite Freeze',
        enabled: true,
        color: '#0891b2',
        mode: 'latch',
        frozen: false,
        riseTime: 120,
        decayTime: 2200,
        shimmer: 50,
        damping: 40,
        mix: 75
      },
      {
        id: 'pedal-cloud-drone-1',
        type: 'granularCloud',
        name: 'Granular Shimmer',
        enabled: true,
        color: '#7c3aed',
        grainSize: 220,
        density: 12,
        pitch: 12,
        spray: 50,
        feedback: 50,
        shimmer: true,
        mix: 50
      },
      {
        id: 'pedal-delay-drone-1',
        type: 'delay',
        name: 'Tape Echo',
        enabled: true,
        color: '#0284c7',
        time: 480,
        feedback: 55,
        flutter: 30,
        pingPong: false,
        mix: 40
      }
    ]
  },
  {
    id: 'vocal-studio-pop',
    name: 'Studio Modern Lead Vocal',
    author: 'ToneCraft Vocal Lab',
    instrument: 'vocal',
    genre: 'Pop',
    description: 'Pristine radio-ready vocal chain: Precision De-Esser -> AutoTune Vocal Snapper -> Studio Vocal Doubler -> Celestial Plate Reverb.',
    tags: ['Vocal', 'AutoTune', 'De-Esser', 'Doubler', 'Studio', 'Pop'],
    bpm: 104,
    likes: 954,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vocal-deess-1',
        type: 'deEsser',
        name: 'Vocal De-Esser',
        enabled: true,
        color: '#d97706',
        frequency: 6500,
        threshold: -36,
        reduction: 65,
        listen: false,
        bandwidth: 'wide'
      },
      {
        id: 'pedal-vocal-tuner-1',
        type: 'vocalTuner',
        name: 'AutoTune Vocal',
        enabled: true,
        color: '#0891b2',
        key: 'C',
        scale: 'major',
        speed: 85,
        correction: 90,
        humanize: 25,
        mix: 100
      },
      {
        id: 'pedal-vocal-doubler-1',
        type: 'vocalDoubler',
        name: 'Studio Doubler',
        enabled: true,
        color: '#6366f1',
        detune: 40,
        spread: 80,
        delay: 32,
        depth: 35,
        mix: 65
      },
      {
        id: 'pedal-vocal-reverb-1',
        type: 'reverb',
        name: 'Vocal Plate Reverb',
        enabled: true,
        color: '#4338ca',
        decay: 55,
        preDelay: 20,
        mix: 28,
        damping: 30,
        shimmer: false,
        roomType: 'plate'
      }
    ]
  },
  {
    id: 'vocal-cyberpunk-robot',
    name: 'Cyberpunk Robot & Vocoder Vocal',
    author: 'Daft Kraft',
    instrument: 'vocal',
    genre: 'Pop',
    description: 'Classic robotic speech and vocoder processing with pitch-locked carrier, formant resonance, tape delay, and hall shimmer.',
    tags: ['Vocal', 'Robot Voice', 'Vocoder', 'Formant', 'Cyberpunk', 'Electronic'],
    bpm: 120,
    likes: 672,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vocal-formant-1',
        type: 'vocalFormant',
        name: 'Robot Formant',
        enabled: true,
        color: '#c026d3',
        pitch: 0,
        formant: -2,
        robotMode: true,
        robotPitch: 'A2',
        brightness: 75,
        mix: 100
      },
      {
        id: 'pedal-vocal-delay-1',
        type: 'delay',
        name: 'Space Tape Echo',
        enabled: true,
        color: '#047857',
        time: 340,
        feedback: 42,
        mix: 35,
        flutter: 25,
        pingPong: false
      },
      {
        id: 'pedal-vocal-reverb-2',
        type: 'reverb',
        name: 'Celestial Shimmer',
        enabled: true,
        color: '#4338ca',
        decay: 70,
        preDelay: 25,
        mix: 35,
        damping: 25,
        shimmer: true,
        roomType: 'hall'
      }
    ]
  },
  {
    id: 'vocal-vintage-megaphone',
    name: 'Vintage Megaphone & Radio Voice',
    author: 'Strokes & Floyd',
    instrument: 'vocal',
    genre: 'Rock',
    description: 'Iconic band-limited rock vocal effect with horn resonance, crunchy carbon diode drive, analog static crackle, and optical compression.',
    tags: ['Vocal', 'Megaphone', 'Telephone', 'Lo-Fi', 'Vintage Radio', 'Rock'],
    bpm: 115,
    likes: 519,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vocal-phone-1',
        type: 'telephoneVoice',
        name: 'Lo-Fi Megaphone',
        enabled: true,
        color: '#a16207',
        mode: 'megaphone',
        drive: 48,
        filter: 55,
        noise: 30,
        mix: 100
      },
      {
        id: 'pedal-vocal-comp-1',
        type: 'compressor',
        name: 'Vocal Leveler Comp',
        enabled: true,
        color: '#b45309',
        sustain: 70,
        attack: 15,
        level: 75,
        blend: 85
      },
      {
        id: 'pedal-vocal-reverb-3',
        type: 'reverb',
        name: 'Vintage Spring Tank',
        enabled: true,
        color: '#475569',
        decay: 40,
        preDelay: 10,
        mix: 25,
        damping: 45,
        shimmer: false,
        roomType: 'spring'
      }
    ]
  },
  {
    id: 'vocal-bohemian-choir',
    name: 'Bohemian Vocal Harmony Choir',
    author: 'Freddie & ToneCraft',
    instrument: 'vocal',
    genre: 'Rock',
    description: 'Magnificent multi-voice vocal harmonies with stereo choir spread, tube preamp presence, and celestial cathedral hall reverb.',
    tags: ['Vocal', 'Harmony', 'Choir', 'Multi-Voice', 'Tube Preamp', 'Reverb'],
    bpm: 110,
    likes: 820,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vpre-choir-1',
        type: 'vocalPreamp',
        name: 'Tube Vocal Strip',
        enabled: true,
        color: '#b45309',
        warmth: 40,
        compression: 55,
        air: 65,
        body: 50,
        lowCut: true,
        outputGain: 55
      },
      {
        id: 'pedal-vharm-choir-1',
        type: 'vocalHarmony',
        name: 'Vocal Choir',
        enabled: true,
        color: '#4f46e5',
        voice1: '+3',
        voice2: '+7',
        key: 'C',
        scale: 'major',
        spread: 80,
        humanize: 35,
        mix: 65
      },
      {
        id: 'pedal-reverb-choir-1',
        type: 'reverb',
        name: 'Cathedral Hall',
        enabled: true,
        color: '#4338ca',
        decay: 65,
        preDelay: 25,
        mix: 30,
        damping: 20,
        shimmer: true,
        roomType: 'hall'
      }
    ]
  },
  {
    id: 'vocal-studio-tube-strip',
    name: 'Analog Tube Vocal Channel Strip',
    author: 'Grammy Vocal Master',
    instrument: 'vocal',
    genre: 'Pop',
    description: 'Broadcast-grade analog vocal chain: 80Hz rumble cut, 200Hz warm chest body, 12kHz silky air, optical leveling compression, and precision sibilance de-essing.',
    tags: ['Vocal', 'Tube Preamp', 'Compressor', 'De-Esser', 'Air Shelf', 'Broadcast'],
    bpm: 100,
    likes: 745,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vpre-strip-1',
        type: 'vocalPreamp',
        name: 'Tube Vocal Strip',
        enabled: true,
        color: '#b45309',
        warmth: 50,
        compression: 65,
        air: 70,
        body: 55,
        lowCut: true,
        outputGain: 55
      },
      {
        id: 'pedal-deess-strip-1',
        type: 'deEsser',
        name: 'Vocal De-Esser',
        enabled: true,
        color: '#d97706',
        frequency: 6200,
        threshold: -38,
        reduction: 70,
        listen: false,
        bandwidth: 'wide'
      },
      {
        id: 'pedal-vdbl-strip-1',
        type: 'vocalDoubler',
        name: 'Studio Doubler',
        enabled: true,
        color: '#6366f1',
        detune: 35,
        spread: 85,
        delay: 28,
        depth: 30,
        mix: 55
      }
    ]
  },
  {
    id: 'vocal-edm-stutter-glitch',
    name: 'Hyperpop Vocal Chopper & Dalek Alien',
    author: 'Glitch Mob & Skrillex',
    instrument: 'vocal',
    genre: 'Pop',
    description: 'Futuristic EDM and hyperpop vocal effect: rhythmic tempo-synced chopper, vinyl tape slow plunge, sci-fi Dalek ring modulator, and stereo delay repeats.',
    tags: ['Vocal', 'Stutter', 'Glitch', 'Ring Modulator', 'Sci-Fi', 'EDM', 'Hyperpop'],
    bpm: 130,
    likes: 615,
    isCommunity: false,
    ampModel: {
      ...BUILT_IN_AMP_MODELS[0],
      bypassed: true
    },
    irCabinet: {
      ...BUILT_IN_IR_CABINETS[0],
      bypassed: true
    },
    pedals: [
      {
        id: 'pedal-vstut-edm-1',
        type: 'vocalStutter',
        name: 'Vocal Chopper',
        enabled: true,
        color: '#059669',
        rate: '1/8',
        bpm: 130,
        depth: 90,
        glitch: 40,
        tapeSlow: true,
        mix: 80
      },
      {
        id: 'pedal-valien-edm-1',
        type: 'vocalAlien',
        name: 'Alien Dalek',
        enabled: true,
        color: '#0d9488',
        frequency: 220,
        carrierShape: 'triangle',
        modDepth: 75,
        lfoRate: 4.5,
        tracking: 50,
        mix: 65
      },
      {
        id: 'pedal-delay-edm-1',
        type: 'delay',
        name: 'Ping-Pong Delay',
        enabled: true,
        color: '#047857',
        time: 230,
        feedback: 48,
        mix: 35,
        flutter: 20,
        pingPong: true
      }
    ]
  },
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'ac10')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'jcm-800')!,
      gain: 6.2,
      bass: 6.0,
      mid: 7.2,
      treble: 7.5,
      presence: 8.0,
      master: 7.0
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
        volume: 54,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 4.5,
      bass: 7.0,
      mid: 6.5,
      treble: 6.2,
      presence: 6.0,
      master: 7.2
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
        level: 50,
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
        volume: 52,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'tweed-59')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'pv-5150')!,
      gain: 8.2,
      bass: 7.5,
      mid: 3.5,
      treble: 7.8,
      presence: 8.0,
      master: 7.8
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
        level: 72,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'ampeg-svt')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'darkglass-b7k')!,
      gain: 6.5,
      bass: 7.0,
      mid: 7.4,
      treble: 7.8,
      presence: 7.2,
      master: 8.4
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
        octaveBlend: true,
        trackingMode: 'auto',
        tone: 80
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'vox-ac30')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'tweed-59')!,
      gain: 3.2,
      bass: 6.0,
      mid: 5.5,
      treble: 6.0,
      presence: 5.8,
      master: 8.8
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'deluxe')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'tweed-59')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'vox-ac30')!,
      gain: 5.0,
      bass: 5.2,
      mid: 6.8,
      treble: 7.2,
      presence: 6.2,
      master: 8.2
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'deluxe')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'deluxe')!,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'roland-jc120')!,
      gain: 2.2,
      bass: 5.4,
      mid: 5.0,
      treble: 6.5,
      presence: 6.8,
      master: 8.4
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'roland-jc120')!,
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
        level: 65,
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'twin-reverb-ultraclean')!,
      gain: 2.2,
      bass: 5.8,
      mid: 4.8,
      treble: 6.8,
      presence: 6.0,
      master: 8.5
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
    ampModel: {
      ...BUILT_IN_AMP_MODELS.find(m => m.id === 'polytone-mini-brute')!,
      gain: 2.2,
      bass: 6.8,
      mid: 4.6,
      treble: 4.2,
      presence: 4.0,
      master: 8.5
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

    // Sanitize engineMode, isRealNam, and calibrated inputTrim on all loaded presets
    return merged.map((p: Preset) => {
      const model = p.ampModel || (p as any).namModel;
      if (!model) return p;
      const isNam = isNamModelProfile(model);
      const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isNam
        ? 'wasm-nam'
        : (model.engineMode && model.engineMode !== 'wasm-nam' ? model.engineMode : 'hd-triode');
      const baseModel = BUILT_IN_AMP_MODELS.find(m => m.id === model.id);
      return {
        ...p,
        ampModel: {
          ...model,
          inputTrim: model.inputTrim !== undefined ? model.inputTrim : (baseModel?.inputTrim ?? 0),
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
      amp: {
        id: preset.ampModel.id,
        g: preset.ampModel.gain,
        b: preset.ampModel.bass,
        m: preset.ampModel.mid,
        t: preset.ampModel.treble,
        p: preset.ampModel.presence,
        vol: preset.ampModel.master,
        trim: preset.ampModel.inputTrim
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
    const ampData = data.amp || data.nam || {};

    const baseAmp = BUILT_IN_AMP_MODELS.find(m => m.id === ampData.id) || BUILT_IN_AMP_MODELS[0];
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
      ampModel: {
        ...baseAmp,
        gain: ampData.g ?? baseAmp.gain,
        bass: ampData.b ?? baseAmp.bass,
        mid: ampData.m ?? baseAmp.mid,
        treble: ampData.t ?? baseAmp.treble,
        presence: ampData.p ?? baseAmp.presence,
        master: ampData.vol ?? baseAmp.master,
        inputTrim: ampData.trim ?? baseAmp.inputTrim
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
