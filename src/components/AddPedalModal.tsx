import React from 'react';
import { PedalType, AnyPedal } from '../types/pedal';
import { X, Plus, Sparkles, Sliders, Zap } from 'lucide-react';

interface AddPedalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPedal: (pedal: AnyPedal) => void;
}

interface PedalTemplateInfo {
  type: PedalType;
  title: string;
  category: 'Gain & Dirt' | 'Modulation' | 'Time & Space' | 'Tone & Dynamics' | 'Pitch & Harmony' | 'Vocal & Speech' | 'Experimental & Boutique' | 'Custom VST';
  description: string;
  color: string;
  createDefault: () => AnyPedal;
}

const PEDAL_TEMPLATES: PedalTemplateInfo[] = [
  // Gain & Dirt
  {
    type: 'overdrive',
    title: 'Tube Screamer 808',
    category: 'Gain & Dirt',
    description: 'Iconic mid-hump soft clipping overdrive for boosting amps and singing blues/rock leads.',
    color: '#15803d',
    createDefault: () => ({
      id: `pedal-od-${Date.now()}`,
      type: 'overdrive',
      name: 'TS-808 Classic',
      enabled: true,
      color: '#15803d',
      drive: 50,
      tone: 50,
      level: 70,
      bassBoost: false
    })
  },
  {
    type: 'distortion',
    title: 'Rodent / DS-1 Distortion',
    category: 'Gain & Dirt',
    description: 'Aggressive hard-clipping silicon diode distortion with biting harmonic overtones.',
    color: '#ea580c',
    createDefault: () => ({
      id: `pedal-dist-${Date.now()}`,
      type: 'distortion',
      name: 'Rodent Distortion',
      enabled: true,
      color: '#ea580c',
      gain: 65,
      filter: 45,
      volume: 68
    })
  },
  {
    type: 'fuzz',
    title: 'Germanium / Silicon Fuzz',
    category: 'Gain & Dirt',
    description: 'Massive crushing fuzz with woolly transistor saturation, endless sustain, and mid-scoop.',
    color: '#b91c1c',
    createDefault: () => ({
      id: `pedal-fuzz-${Date.now()}`,
      type: 'fuzz',
      name: 'Vintage Big Fuzz',
      enabled: true,
      color: '#b91c1c',
      fuzz: 75,
      tone: 50,
      volume: 65,
      scoop: 40
    })
  },

  // Tone & Dynamics
  {
    type: 'compressor',
    title: 'DynaSqueeze Compressor',
    category: 'Tone & Dynamics',
    description: 'Studio-grade optical dynamics compression with parallel clean blend and attack control.',
    color: '#b45309',
    createDefault: () => ({
      id: `pedal-comp-${Date.now()}`,
      type: 'compressor',
      name: 'DynaSqueeze Comp',
      enabled: true,
      color: '#b45309',
      sustain: 60,
      attack: 20,
      level: 65,
      blend: 75
    })
  },
  {
    type: 'eq',
    title: 'Graphic 7-Band EQ',
    category: 'Tone & Dynamics',
    description: 'Precision 7-band frequency sculpting from 100Hz to 6.4kHz with +/-15dB boost or cut.',
    color: '#334155',
    createDefault: () => ({
      id: `pedal-eq-${Date.now()}`,
      type: 'eq',
      name: '7-Band Graphic EQ',
      enabled: true,
      color: '#334155',
      band100: 0,
      band200: 0,
      band400: 0,
      band800: 0,
      band1600: 0,
      band3200: 0,
      band6400: 0,
      level: 0
    })
  },
  {
    type: 'noiseGate',
    title: 'Decimator Noise Gate',
    category: 'Tone & Dynamics',
    description: 'Ultra-fast downward expander gate that eliminates pickup hum and high-gain amp noise.',
    color: '#1e293b',
    createDefault: () => ({
      id: `pedal-gate-${Date.now()}`,
      type: 'noiseGate',
      name: 'Decimator Gate',
      enabled: true,
      color: '#1e293b',
      threshold: -50,
      release: 35
    })
  },
  {
    type: 'autoWah',
    title: 'Mu-Tron Envelope Wah',
    category: 'Tone & Dynamics',
    description: 'Dynamic envelope-tracking vocal filter and auto-wah for funk rhythms and quacky leads.',
    color: '#7c3aed',
    createDefault: () => ({
      id: `pedal-wah-${Date.now()}`,
      type: 'autoWah',
      name: 'Auto-Wah Filter',
      enabled: true,
      color: '#7c3aed',
      sensitivity: 60,
      range: 70,
      resonance: 65,
      mode: 'envelope'
    })
  },

  // Modulation
  {
    type: 'chorus',
    title: 'Analog CE-2 Chorus',
    category: 'Modulation',
    description: 'Lush, warm bucket-brigade style stereo chorus with rate, depth, and tone controls.',
    color: '#1d4ed8',
    createDefault: () => ({
      id: `pedal-chorus-${Date.now()}`,
      type: 'chorus',
      name: 'Analog Chorus',
      enabled: true,
      color: '#1d4ed8',
      rate: 35,
      depth: 60,
      mix: 50,
      tone: 60
    })
  },
  {
    type: 'flanger',
    title: 'Jet Flanger Mistress',
    category: 'Modulation',
    description: 'Metallic comb-filtering jet sweep with high-resonance feedback and manual delay bias.',
    color: '#581c87',
    createDefault: () => ({
      id: `pedal-flanger-${Date.now()}`,
      type: 'flanger',
      name: 'Jet Flanger',
      enabled: true,
      color: '#581c87',
      rate: 25,
      depth: 70,
      feedback: 65,
      manual: 45
    })
  },
  {
    type: 'phaser',
    title: 'Phase 90 Stompbox',
    category: 'Modulation',
    description: 'Classic 4-stage and 8-stage all-pass optical phase shifter with psychedelic swirl.',
    color: '#ea580c',
    createDefault: () => ({
      id: `pedal-phase-${Date.now()}`,
      type: 'phaser',
      name: 'Phase 90 Stomp',
      enabled: true,
      color: '#ea580c',
      speed: 30,
      depth: 70,
      feedback: 40,
      stages: 4
    })
  },
  {
    type: 'tremolo',
    title: 'Optical Tube Tremolo',
    category: 'Modulation',
    description: 'Pulsing volume modulation with selectable Sine, Triangle, or aggressive Square chop.',
    color: '#0f766e',
    createDefault: () => ({
      id: `pedal-trem-${Date.now()}`,
      type: 'tremolo',
      name: 'Optical Tremolo',
      enabled: true,
      color: '#0f766e',
      speed: 45,
      depth: 65,
      waveform: 'sine'
    })
  },

  // Time & Space
  {
    type: 'delay',
    title: 'Tape Echo & Ping-Pong Delay',
    category: 'Time & Space',
    description: 'Analog bucket-brigade and digital delay with tape flutter, repeats, and ping-pong stereo.',
    color: '#047857',
    createDefault: () => ({
      id: `pedal-delay-${Date.now()}`,
      type: 'delay',
      name: 'Space Tape Delay',
      enabled: true,
      color: '#047857',
      time: 380,
      feedback: 45,
      mix: 35,
      flutter: 30,
      pingPong: false
    })
  },
  {
    type: 'reverb',
    title: 'Studio Spring, Plate & Hall Reverb',
    category: 'Time & Space',
    description: 'Lush multidimensional reverb algorithms with decay time, high damping, and celestial shimmer.',
    color: '#4338ca',
    createDefault: () => ({
      id: `pedal-reverb-${Date.now()}`,
      type: 'reverb',
      name: 'Celestial Reverb',
      enabled: true,
      color: '#4338ca',
      decay: 60,
      preDelay: 15,
      mix: 40,
      damping: 35,
      shimmer: false,
      roomType: 'plate'
    })
  },

  // Pitch & Harmony
  {
    type: 'pitchShifter',
    title: 'Whammy Pitch Shifter',
    category: 'Pitch & Harmony',
    description: 'Ultra-low latency pitch shifter (-24 to +24 st) with PSOLA period locking for pristine octave-down tracking and sub-harmonic blend.',
    color: '#991b1b',
    createDefault: () => ({
      id: `pedal-pitch-${Date.now()}`,
      type: 'pitchShifter',
      name: 'Whammy Pitch',
      enabled: true,
      color: '#991b1b',
      shift: -12,
      detune: 0,
      mix: 50,
      octaveBlend: true,
      trackingMode: 'auto',
      tone: 80
    })
  },
  {
    type: 'harmonizer',
    title: 'Smart Diatonic Harmonizer',
    category: 'Pitch & Harmony',
    description: 'Key and scale-aware intelligent harmony (3rds, 5ths, 6ths, Octaves) for soaring dual-guitar leads.',
    color: '#6d28d9',
    createDefault: () => ({
      id: `pedal-harm-${Date.now()}`,
      type: 'harmonizer',
      name: 'Smart Harmonizer',
      enabled: true,
      color: '#6d28d9',
      key: 'E',
      scale: 'minor',
      interval: '5th',
      harmonyLevel: 60,
      directLevel: 90
    })
  },

  // Vocal & Speech
  {
    type: 'vocalTuner',
    title: 'AutoTune Vocal Snapper',
    category: 'Vocal & Speech',
    description: 'Scale-aware vocal pitch correction with retune speed control (natural transparent glide to hard robotic Cher/T-Pain snap) and humanize vibrato preservation.',
    color: '#0891b2',
    createDefault: () => ({
      id: `pedal-vtune-${Date.now()}`,
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
    })
  },
  {
    type: 'vocalDoubler',
    title: 'Studio Vocal Doubler & Widener',
    category: 'Vocal & Speech',
    description: 'Abbey Road artificial double tracking (ADT) with dual modulated micro-delays, pitch drift detune, and stereo Haas widening for radio-ready vocals.',
    color: '#6366f1',
    createDefault: () => ({
      id: `pedal-vdbl-${Date.now()}`,
      type: 'vocalDoubler',
      name: 'Studio Doubler',
      enabled: true,
      color: '#6366f1',
      detune: 45,
      spread: 80,
      delay: 35,
      depth: 40,
      mix: 65
    })
  },
  {
    type: 'deEsser',
    title: 'Precision Vocal De-Esser',
    category: 'Vocal & Speech',
    description: 'Fast dynamic sibilance compressor targeting harsh "S" and "T" transients (3kHz - 9kHz) with dedicated audition Listen mode.',
    color: '#d97706',
    createDefault: () => ({
      id: `pedal-deess-${Date.now()}`,
      type: 'deEsser',
      name: 'Vocal De-Esser',
      enabled: true,
      color: '#d97706',
      frequency: 6500,
      threshold: -36,
      reduction: 65,
      listen: false,
      bandwidth: 'wide'
    })
  },
  {
    type: 'telephoneVoice',
    title: 'Megaphone & Radio Voice',
    category: 'Vocal & Speech',
    description: 'Band-limited vintage vocal effects with Telephone, Megaphone, AM Radio, and Gramophone modes, speaker cone drive, and analog static crackle.',
    color: '#a16207',
    createDefault: () => ({
      id: `pedal-phone-${Date.now()}`,
      type: 'telephoneVoice',
      name: 'Lo-Fi Megaphone',
      enabled: true,
      color: '#a16207',
      mode: 'megaphone',
      drive: 45,
      filter: 50,
      noise: 25,
      mix: 100
    })
  },
  {
    type: 'vocalFormant',
    title: 'Robot Voice & Formant Shifter',
    category: 'Vocal & Speech',
    description: 'Vocal tract length transformer (masculine/giant vs anime/chipmunk) with robotic vocoder carrier mode (Daft Punk / Kraftwerk style).',
    color: '#c026d3',
    createDefault: () => ({
      id: `pedal-formant-${Date.now()}`,
      type: 'vocalFormant',
      name: 'Robot Formant',
      enabled: true,
      color: '#c026d3',
      pitch: 0,
      formant: 0,
      robotMode: true,
      robotPitch: 'A2',
      brightness: 70,
      mix: 100
    })
  },
  {
    type: 'vocalHarmony',
    title: 'Multi-Voice Vocal Harmony Choir',
    category: 'Vocal & Speech',
    description: 'Dual intelligent vocal harmony voices with custom interval selection (3rds, 5ths, octaves), wide stereo spread, and humanize micro-detuning.',
    color: '#4f46e5',
    createDefault: () => ({
      id: `pedal-vharm-${Date.now()}`,
      type: 'vocalHarmony',
      name: 'Vocal Choir',
      enabled: true,
      color: '#4f46e5',
      voice1: '+3',
      voice2: '+7',
      key: 'C',
      scale: 'major',
      spread: 75,
      humanize: 30,
      mix: 65
    })
  },
  {
    type: 'vocalPreamp',
    title: 'Vintage Studio Tube Vocal Strip',
    category: 'Vocal & Speech',
    description: 'Broadcast-grade analog tube channel strip with 80Hz rumble low-cut, 200Hz body warmth, 12kHz silk "Air" shelf, and smooth optical LA-2A leveling.',
    color: '#b45309',
    createDefault: () => ({
      id: `pedal-vpre-${Date.now()}`,
      type: 'vocalPreamp',
      name: 'Tube Vocal Strip',
      enabled: true,
      color: '#b45309',
      warmth: 45,
      compression: 55,
      air: 60,
      body: 50,
      lowCut: true,
      outputGain: 50
    })
  },
  {
    type: 'vocalStutter',
    title: 'Rhythmic Vocal Stutter & Chopper',
    category: 'Vocal & Speech',
    description: 'EDM & hyperpop rhythmic tempo-synced chopper (1/4 to 1/32 notes), glitch repeat buffer, and vinyl tape-stop speed plunge.',
    color: '#059669',
    createDefault: () => ({
      id: `pedal-vstut-${Date.now()}`,
      type: 'vocalStutter',
      name: 'Vocal Chopper',
      enabled: true,
      color: '#059669',
      rate: '1/8',
      bpm: 120,
      depth: 85,
      glitch: 30,
      tapeSlow: false,
      mix: 75
    })
  },
  {
    type: 'vocalAlien',
    title: 'Sci-Fi Alien & Dalek Ring Modulator',
    category: 'Vocal & Speech',
    description: 'Extraterrestrial robotic voice transformer with balanced ring modulation, speech amplitude tracking, LFO flutter, and metallic Dalek resonance.',
    color: '#0d9488',
    createDefault: () => ({
      id: `pedal-valien-${Date.now()}`,
      type: 'vocalAlien',
      name: 'Alien Dalek',
      enabled: true,
      color: '#0d9488',
      frequency: 240,
      carrierShape: 'sine',
      modDepth: 80,
      lfoRate: 3.5,
      tracking: 45,
      mix: 100
    })
  },

  // Experimental & Boutique Unconventional Guitar Effects
  {
    type: 'granularCloud',
    title: 'Granular Dream Cloud',
    category: 'Experimental & Boutique',
    description: 'Chase Bliss & Microcosm inspired micro-loop granular cloud with pitch shifting, spray position jitter, and regenerative octave shimmer.',
    color: '#7c3aed',
    createDefault: () => ({
      id: `pedal-cloud-${Date.now()}`,
      type: 'granularCloud',
      name: 'Granular Cloud',
      enabled: true,
      color: '#7c3aed',
      grainSize: 120,
      density: 16,
      pitch: 0,
      spray: 40,
      feedback: 45,
      shimmer: true,
      mix: 60
    })
  },
  {
    type: 'arcadeSynth',
    title: '8-Bit Arcade PLL Synth',
    category: 'Experimental & Boutique',
    description: 'EQD Data Corrupter & Ottobit style sub/octave PLL guitar synth with bitcrusher, sample decimation, and stepped interval arpeggiator.',
    color: '#e11d48',
    createDefault: () => ({
      id: `pedal-arcade-${Date.now()}`,
      type: 'arcadeSynth',
      name: 'Arcade PLL Synth',
      enabled: true,
      color: '#e11d48',
      subOctave: '-1',
      crushBits: 8,
      sampleRateDec: 8000,
      arpeggiator: 'octave',
      arpRate: 6,
      glide: 35,
      mix: 75
    })
  },
  {
    type: 'spectralFreeze',
    title: 'Spectral Infinite Freeze',
    category: 'Experimental & Boutique',
    description: 'EHX Freeze & PLUS pedal style infinite sustain drone with interactive momentary/latch footswitch, analog damping, and shimmer octave layer.',
    color: '#0891b2',
    createDefault: () => ({
      id: `pedal-freeze-${Date.now()}`,
      type: 'spectralFreeze',
      name: 'Spectral Freeze',
      enabled: true,
      color: '#0891b2',
      mode: 'latch',
      frozen: false,
      riseTime: 80,
      decayTime: 1400,
      shimmer: 40,
      damping: 45,
      mix: 70
    })
  },
  {
    type: 'tapeGlitch',
    title: 'Tape Glitch & Reverse Swell',
    category: 'Experimental & Boutique',
    description: 'Red Panda Tensor & Count to 5 style micro-slice tape time-warper with forward/reverse/alternating slices, random jumps, and wow/flutter.',
    color: '#d97706',
    createDefault: () => ({
      id: `pedal-glitch-${Date.now()}`,
      type: 'tapeGlitch',
      name: 'Tape Glitch / Rev',
      enabled: true,
      color: '#d97706',
      direction: 'reverse',
      sliceLength: 350,
      pitch: 0,
      randomGlitch: 40,
      wowFlutter: 35,
      feedback: 35,
      mix: 65
    })
  },

  // Custom VST
  {
    type: 'vstPlugin',
    title: 'VST Web Container / Custom DSP',
    category: 'Custom VST',
    description: 'Programmable audio plugin module running custom Web Audio script DSP with 4 assignable control knobs.',
    color: '#0284c7',
    createDefault: () => ({
      id: `pedal-vst-${Date.now()}`,
      type: 'vstPlugin',
      name: 'Vintage Tape Sat',
      pluginId: 'tape-sat',
      pluginTitle: 'Vintage Tape Saturation',
      enabled: true,
      color: '#0284c7',
      param1: 55,
      param1Label: 'Warmth',
      param2: 60,
      param2Label: 'Tape High',
      param3: 40,
      param3Label: 'Bias',
      param4: 50,
      param4Label: 'Comp',
      dryWet: 70,
      dspCode: '// Custom VST Web Plugin DSP\nfunction process(sample, p1, p2, p3) {\n  return Math.tanh(sample * (1 + p1 * 3));\n}'
    })
  }
];

export const AddPedalModal: React.FC<AddPedalModalProps> = ({
  isOpen,
  onClose,
  onAddPedal
}) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(PEDAL_TEMPLATES.map(p => p.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
              <Zap size={18} className="text-amber-400" />
              <span>Pedalboard Boutique - Add Effect Stompbox</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select an authentic modeled pedal to insert into your real-time signal chain.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {categories.map(cat => {
            const pedalsInCat = PEDAL_TEMPLATES.filter(p => p.category === cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold tracking-wider font-mono uppercase text-amber-400">
                    {cat}
                  </span>
                  <div className="flex-1 h-px bg-neutral-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pedalsInCat.map(item => (
                    <div
                      key={item.title}
                      className="group bg-neutral-950/70 hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3.5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <h4 className="text-sm font-bold text-neutral-200 group-hover:text-white">
                              {item.title}
                            </h4>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-end">
                        <button
                          onClick={() => {
                            onAddPedal(item.createDefault());
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-sm"
                        >
                          <Plus size={14} />
                          <span>Add Pedal</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
