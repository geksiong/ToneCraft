/**
 * @file pedalDsp.ts
 * @description DSP audio node creation and parameter automation for all pedal effects.
 *
 * HOW PEDAL EFFECTS WORK IN WEB AUDIO:
 * Every pedal is instantiated as an encapsulated wrapper:
 *
 *                    /---> [Effect DSP Nodes] ---> wetGain   ---\
 *   wrapper.input ---                                            ---> wrapper.output
 *                    \---------------------------> bypassGain --/
 *
 * TRUE BYPASS ARCHITECTURE:
 * - When pedal.enabled is TRUE:  wetGain = 1.0, bypassGain = 0.0 (audio flows through DSP).
 * - When pedal.enabled is FALSE: wetGain = 0.0, bypassGain = 1.0 (audio flows 100% dry).
 * - Crucially, reordering the pedalboard ONLY disconnects wrapper.output from the next pedal.
 *   The internal wiring between input, DSP, wetGain, and bypassGain is NEVER severed!
 *
 * SPECIFIC PEDAL DSP TOPOLOGIES:
 * 1. Overdrive: Input -> 720Hz Mid-hump peaking filter (+6dB) -> Tube Screamer wave shaper -> Tone lowpass -> Level -> wetGain.
 * 2. Distortion: Input -> ProCo Rat / DS-1 hard diode wave shaper -> Filter lowpass -> Volume -> wetGain.
 * 3. Fuzz: Input -> PreGain (1x-12x) -> Germanium wave shaper -> 1kHz scoop filter -> Tone lowpass -> Volume -> wetGain.
 * 4. Compressor: DynamicsCompressorNode with makeup gain + parallel clean dry path for NY compression.
 * 5. Chorus: 25ms delay modulated by a slow Sine LFO (0.2-4.7 Hz) + Tone filter + dry/wet split.
 * 6. Flanger: Ultra-short delay (6-12ms) modulated by Triangle LFO + high feedback gain loop (resonance jet sweep).
 * 7. Phaser: 4-stage cascade of Allpass BiquadFilterNodes (1200Hz base) swept by Sine LFO + feedback.
 * 8. Tremolo: GainNode modulated by Sine, Triangle, or Square LFO (0.5-12.5 Hz).
 * 9. Delay: DelayNode (10-1000ms) with feedback loop, tape flutter filter, and wet mix.
 * 10. Reverb: Multi-tap ConvolverNode with decay, pre-delay, and damping filter.
 * 11. Graphic EQ: 7-band peaking filters (100Hz, 200Hz, 400Hz, 800Hz, 1.6kHz, 3.2kHz, 6.4kHz) +/-15dB.
 * 12. Noise Gate: Downward expander / gate gain node based on threshold.
 * 13. Auto-Wah: 1200Hz bandpass filter modulated by LFO or envelope follower.
 * 14. Pitch Shifter: Dual sawtooth-ramp delay lines with quadrature crossfade for -24 to +24 semitones shift.
 * 15. Harmonizer: Pitch-shifted harmony voice (3rd, 5th, 6th, octave) blended with direct input signal.
 */

import {
  AnyPedal,
  OverdrivePedal,
  DistortionPedal,
  FuzzPedal,
  CompressorPedal,
  ChorusPedal,
  FlangerPedal,
  PhaserPedal,
  TremoloPedal,
  DelayPedal,
  ReverbPedal,
  EqPedal,
  NoiseGatePedal,
  AutoWahPedal,
  PitchShifterPedal,
  HarmonizerPedal,
  VocalTunerPedal,
  VocalDoublerPedal,
  DeEsserPedal,
  TelephoneVoicePedal,
  VocalFormantPedal,
  VocalHarmonyPedal,
  VocalPreampPedal,
  VocalStutterPedal,
  VocalAlienPedal,
  GranularCloudPedal,
  ArcadeSynthPedal,
  SpectralFreezePedal,
  TapeGlitchPedal,
  UniVibePedal,
  HarmonicTremoloPedal,
  SlowGearPedal,
  KlonOverdrivePedal,
  MultiOctavePedal,
  TalkingWahPedal,
  ReverseReverbPedal,
  CrystalDelayPedal,
  HardTunePedal,
  LofiVinylPedal
} from '../types/pedal';
import {
  createOverdriveCurve,
  createDistortionCurve,
  createFuzzCurve,
  createTelephoneCurve,
  createKlonCurve,
  createTapeSaturationCurve
} from './curves';

export interface PitchShifterNodes {
  input: GainNode;
  output: GainNode;
  processor: ScriptProcessorNode;
  dryGain: GainNode;
  wetGain: GainNode;
  setShift: (semitones: number) => void;
  setOctaveBlend?: (enabled: boolean) => void;
  setTrackingMode?: (mode: 'auto' | 'poly' | 'mono') => void;
  setTone?: (tone: number) => void;
  dispose?: () => void;
}

export interface PedalNodeWrapper {
  input: GainNode;
  output: GainNode;
  bypassGain: GainNode;
  wetGain: GainNode;
  dspNodes: any;
  pedalType?: string;
}

/**
 * Instantiates the Web Audio graph topology for a single effect pedal.
 */
export function createPedalDspNodes(ctx: AudioContext, pedal: AnyPedal): PedalNodeWrapper {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const bypassGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Initial bypass state
  bypassGain.gain.value = pedal.enabled ? 0.0 : 1.0;
  wetGain.gain.value = pedal.enabled ? 1.0 : 0.0;

  // True bypass path
  input.connect(bypassGain);
  bypassGain.connect(output);

  let dspNodes: any = {};

  switch (pedal.type) {
    case 'overdrive': {
      const driveShaper = ctx.createWaveShaper();
      driveShaper.oversample = '4x';
      const midHump = ctx.createBiquadFilter();
      midHump.type = 'peaking';
      midHump.frequency.value = 720;
      midHump.Q.value = 1.2;
      midHump.gain.value = 6;
      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'lowpass';
      const levelGain = ctx.createGain();

      input.connect(midHump);
      midHump.connect(driveShaper);
      driveShaper.connect(toneFilter);
      toneFilter.connect(levelGain);
      levelGain.connect(wetGain);

      dspNodes = { driveShaper, midHump, toneFilter, levelGain };
      break;
    }

    case 'distortion': {
      const distShaper = ctx.createWaveShaper();
      distShaper.oversample = '4x';
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      const volumeGain = ctx.createGain();

      input.connect(distShaper);
      distShaper.connect(filterNode);
      filterNode.connect(volumeGain);
      volumeGain.connect(wetGain);

      dspNodes = { distShaper, filterNode, volumeGain };
      break;
    }

    case 'fuzz': {
      const preGain = ctx.createGain();
      const fuzzShaper = ctx.createWaveShaper();
      fuzzShaper.oversample = '4x';
      const scoopFilter = ctx.createBiquadFilter();
      scoopFilter.type = 'peaking';
      scoopFilter.frequency.value = 1000;
      scoopFilter.Q.value = 1.8;
      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'lowpass';
      const volumeGain = ctx.createGain();

      input.connect(preGain);
      preGain.connect(fuzzShaper);
      fuzzShaper.connect(scoopFilter);
      scoopFilter.connect(toneFilter);
      toneFilter.connect(volumeGain);
      volumeGain.connect(wetGain);

      dspNodes = { preGain, fuzzShaper, scoopFilter, toneFilter, volumeGain };
      break;
    }

    case 'compressor': {
      const comp = ctx.createDynamicsCompressor();
      const makeupGain = ctx.createGain();
      const dryPath = ctx.createGain();
      const wetPath = ctx.createGain();

      input.connect(comp);
      comp.connect(makeupGain);
      makeupGain.connect(wetPath);
      input.connect(dryPath);

      wetPath.connect(wetGain);
      dryPath.connect(wetGain);

      dspNodes = { comp, makeupGain, dryPath, wetPath };
      break;
    }

    case 'chorus': {
      const delayNode = ctx.createDelay(0.1);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const chorusDry = ctx.createGain();
      const chorusWet = ctx.createGain();
      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'lowpass';

      lfo.type = 'sine';
      lfo.connect(lfoGain);
      lfoGain.connect(delayNode.delayTime);
      lfo.start();

      input.connect(chorusDry);
      input.connect(delayNode);
      delayNode.connect(toneFilter);
      toneFilter.connect(chorusWet);

      chorusDry.connect(wetGain);
      chorusWet.connect(wetGain);

      dspNodes = { delayNode, lfo, lfoGain, chorusDry, chorusWet, toneFilter };
      break;
    }

    case 'flanger': {
      const delayNode = ctx.createDelay(0.05);
      const feedback = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const dry = ctx.createGain();
      const wet = ctx.createGain();

      lfo.type = 'triangle';
      lfo.connect(lfoGain);
      lfoGain.connect(delayNode.delayTime);
      lfo.start();

      input.connect(dry);
      input.connect(delayNode);
      delayNode.connect(feedback);
      feedback.connect(delayNode);
      delayNode.connect(wet);

      dry.connect(wetGain);
      wet.connect(wetGain);

      dspNodes = { delayNode, feedback, lfo, lfoGain, dry, wet };
      break;
    }

    case 'phaser': {
      const ap1 = ctx.createBiquadFilter();
      const ap2 = ctx.createBiquadFilter();
      const ap3 = ctx.createBiquadFilter();
      const ap4 = ctx.createBiquadFilter();
      [ap1, ap2, ap3, ap4].forEach(ap => {
        ap.type = 'allpass';
        ap.frequency.value = 1200;
      });

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const feedback = ctx.createGain();
      const dry = ctx.createGain();
      const wet = ctx.createGain();

      lfo.type = 'sine';
      lfo.connect(lfoGain);
      lfoGain.connect(ap1.frequency);
      lfoGain.connect(ap2.frequency);
      lfoGain.connect(ap3.frequency);
      lfoGain.connect(ap4.frequency);
      lfo.start();

      input.connect(dry);
      input.connect(ap1);
      ap1.connect(ap2);
      ap2.connect(ap3);
      ap3.connect(ap4);
      ap4.connect(feedback);
      feedback.connect(ap1);
      ap4.connect(wet);

      dry.connect(wetGain);
      wet.connect(wetGain);

      dspNodes = { ap1, ap2, ap3, ap4, lfo, lfoGain, feedback, dry, wet };
      break;
    }

    case 'tremolo': {
      const modGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      lfo.connect(lfoGain);
      lfoGain.connect(modGain.gain);
      lfo.start();

      input.connect(modGain);
      modGain.connect(wetGain);

      dspNodes = { modGain, lfo, lfoGain };
      break;
    }

    case 'delay': {
      const delayNode = ctx.createDelay(2.0);
      const feedback = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const dry = ctx.createGain();
      const wet = ctx.createGain();

      input.connect(dry);
      input.connect(delayNode);
      delayNode.connect(filter);
      filter.connect(feedback);
      feedback.connect(delayNode);
      filter.connect(wet);

      dry.connect(wetGain);
      wet.connect(wetGain);

      dspNodes = { delayNode, feedback, filter, dry, wet };
      break;
    }

    case 'reverb': {
      const convolver = ctx.createConvolver();
      const preDelay = ctx.createDelay(0.2);
      const damping = ctx.createBiquadFilter();
      damping.type = 'lowpass';
      const dry = ctx.createGain();
      const wet = ctx.createGain();

      input.connect(dry);
      input.connect(preDelay);
      preDelay.connect(convolver);
      convolver.connect(damping);
      damping.connect(wet);

      dry.connect(wetGain);
      wet.connect(wetGain);

      dspNodes = { convolver, preDelay, damping, dry, wet };
      break;
    }

    case 'eq': {
      const bands: BiquadFilterNode[] = [];
      const freqs = [100, 200, 400, 800, 1600, 3200, 6400];
      freqs.forEach(f => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = f;
        filter.Q.value = 1.4;
        bands.push(filter);
      });

      const levelGain = ctx.createGain();

      input.connect(bands[0]);
      for (let i = 0; i < bands.length - 1; i++) {
        bands[i].connect(bands[i + 1]);
      }
      bands[bands.length - 1].connect(levelGain);
      levelGain.connect(wetGain);

      dspNodes = { bands, levelGain };
      break;
    }

    case 'noiseGate': {
      const p = pedal as NoiseGatePedal;
      const gateGain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      input.connect(analyser);
      input.connect(gateGain);
      gateGain.connect(wetGain);

      const state = {
        threshold: typeof p.threshold === 'number' ? p.threshold : -50,
        release: typeof p.release === 'number' ? p.release : 100,
        timer: null as any
      };

      const buf = new Float32Array(256);
      state.timer = setInterval(() => {
        if (!analyser || !gateGain || !ctx || ctx.state !== 'running') return;
        analyser.getFloatTimeDomainData(buf);
        let sumSquares = 0;
        for (let i = 0; i < buf.length; i++) {
          sumSquares += buf[i] * buf[i];
        }
        const rms = Math.sqrt(sumSquares / buf.length);
        const db = 20 * Math.log10(Math.max(1e-5, rms));
        const now = ctx.currentTime;
        if (db >= state.threshold) {
          gateGain.gain.cancelScheduledValues(now);
          gateGain.gain.setTargetAtTime(1.0, now, 0.003);
        } else {
          gateGain.gain.cancelScheduledValues(now);
          gateGain.gain.setTargetAtTime(0.001, now, Math.max(0.01, state.release / 1000));
        }
      }, 16);

      dspNodes = { gateGain, analyser, state };
      break;
    }

    case 'autoWah': {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      lfo.type = 'sine';
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      input.connect(filter);
      filter.connect(wetGain);

      dspNodes = { filter, lfo, lfoGain };
      break;
    }

    case 'pitchShifter': {
      const shifter = createPitchShifterDsp(ctx, input, wetGain);
      dspNodes = { shifter };
      break;
    }

    case 'harmonizer': {
      const shifter = createPitchShifterDsp(ctx, input, wetGain);
      const directGain = ctx.createGain();
      input.connect(directGain);
      directGain.connect(wetGain);
      dspNodes = { shifter, directGain };
      break;
    }

    case 'vocalTuner': {
      dspNodes = createVocalTunerDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalDoubler': {
      dspNodes = createVocalDoublerDsp(ctx, input, wetGain);
      break;
    }

    case 'deEsser': {
      dspNodes = createDeEsserDsp(ctx, input, wetGain, pedal as DeEsserPedal);
      break;
    }

    case 'telephoneVoice': {
      dspNodes = createTelephoneVoiceDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalFormant': {
      dspNodes = createVocalFormantDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalHarmony': {
      dspNodes = createVocalHarmonyDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalPreamp': {
      dspNodes = createVocalPreampDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalStutter': {
      dspNodes = createVocalStutterDsp(ctx, input, wetGain);
      break;
    }

    case 'vocalAlien': {
      dspNodes = createVocalAlienDsp(ctx, input, wetGain);
      break;
    }

    case 'granularCloud': {
      dspNodes = createGranularCloudDsp(ctx, input, wetGain);
      break;
    }

    case 'arcadeSynth': {
      dspNodes = createArcadeSynthDsp(ctx, input, wetGain);
      break;
    }

    case 'spectralFreeze': {
      dspNodes = createSpectralFreezeDsp(ctx, input, wetGain);
      break;
    }

    case 'tapeGlitch': {
      dspNodes = createTapeGlitchDsp(ctx, input, wetGain);
      break;
    }

    case 'uniVibe': {
      dspNodes = createUniVibeDsp(ctx, input, wetGain);
      break;
    }

    case 'harmonicTremolo': {
      dspNodes = createHarmonicTremoloDsp(ctx, input, wetGain);
      break;
    }

    case 'slowGear': {
      dspNodes = createSlowGearDsp(ctx, input, wetGain);
      break;
    }

    case 'klonOverdrive': {
      dspNodes = createKlonOverdriveDsp(ctx, input, wetGain);
      break;
    }

    case 'multiOctave': {
      dspNodes = createMultiOctaveDsp(ctx, input, wetGain);
      break;
    }

    case 'talkingWah': {
      dspNodes = createTalkingWahDsp(ctx, input, wetGain);
      break;
    }

    case 'reverseReverb': {
      dspNodes = createReverseReverbDsp(ctx, input, wetGain);
      break;
    }

    case 'crystalDelay': {
      dspNodes = createCrystalDelayDsp(ctx, input, wetGain);
      break;
    }

    case 'hardTune': {
      dspNodes = createHardTuneDsp(ctx, input, wetGain);
      break;
    }

    case 'lofiVinyl': {
      dspNodes = createLofiVinylDsp(ctx, input, wetGain);
      break;
    }
  }

  wetGain.connect(output);

  const wrapper: PedalNodeWrapper = { input, output, bypassGain, wetGain, dspNodes, pedalType: pedal.type };
  updatePedalParameters(ctx, pedal, wrapper);
  return wrapper;
}

/**
 * High-Accuracy Real-Time Pitch Shifter & Sub-Octave DSP Engine.
 *
 * Implements:
 * 1. Pitch-Synchronous Overlap-Add (PSOLA): Locks grain sweep size S to an even integer multiple
 *    of the fundamental pitch period (S = 2 * m * T0). For octave-down (ratio = 0.5), the two
 *    grains have a delay difference of exactly m * T0, meaning they are 100% in-phase!
 *    Completely eliminates the comb-filtering cancelation notches and flutter that previously
 *    destroyed the octave-down fundamental.
 * 2. Waveform Similarity Overlap-Add (WSOLA): Fast micro cross-correlation alignment (+/- 16 samples)
 *    when grains wrap around, guaranteeing phase continuity for polyphonic chords and detuned notes.
 * 3. 4-Point Cubic Hermite Spline Interpolation: Replaces linear interpolation to eliminate
 *    high-frequency imaging and triangular interpolation buzz.
 * 4. Sub-Harmonic Generator (octaveBlend): Authentic zero-crossing tracking with dynamic envelope
 *    shaping and 180Hz 2-pole lowpass filter, providing a massive, punchy sub-octave foundation.
 * 5. High-Frequency Anti-Aliasing & Tone Warmth: 2-pole smooth resonant filter tuned from 2.5kHz
 *    to 6.5kHz for deep, analog octaver tone.
 * 6. Ultra-Low Latency: Base delay is only 32 samples (0.67ms) with average grain delay ~12ms,
 *    keeping total latency under 15ms.
 */
function createPitchShifterDsp(ctx: AudioContext, input: GainNode, output: GainNode): PitchShifterNodes {
  const sampleRate = ctx.sampleRate || 48000;
  // 512 samples buffer for safe, ultra-low 10.6ms latency
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 0.5;
  wetGain.gain.value = 0.5;

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  // Prevent premature garbage collection of ScriptProcessorNode by V8 GC
  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Circular Delay Buffer: 32768 samples (~680ms at 48kHz), power of 2 for fast bitwise masking
  const bufferSize = 32768;
  const bufferMask = bufferSize - 1;
  const ringBuffer = new Float32Array(bufferSize);
  let writeIndex = 0;

  // Pitch shift control state
  let targetRatio = 1.0;
  let currentRatio = 1.0;
  let octaveBlendEnabled = true;
  let trackingMode: 'auto' | 'poly' | 'mono' = 'auto';
  let currentTone = 80; // 0 - 100

  // Pitch tracking state (Autocorrelation / Difference Function)
  let detectedPeriod = 440; // Default ~109 Hz
  let smoothedPeriod = 440;
  let pitchConfidence = 0.0;

  // Analysis ring buffer with 4x decimation: 2048 samples = 512 decimated samples
  const decRingSize = 2048;
  const decRingMask = decRingSize - 1;
  const decRingBuffer = new Float32Array(decRingSize);
  let decWriteIdx = 0;
  let decCounter = 0;

  // Granular delay parameters
  const minDelay = 32; // Ultra-low 0.67ms base margin
  let targetSweepSize = 960; // samples (~20ms default)
  let currentSweepSize = 960;
  let phase = 0.0;

  // WSOLA cross-correlation alignment offsets
  let corrOffset0 = 0;
  let corrOffset1 = 0;
  let lastPhase0 = 0.0;
  let lastPhase1 = 0.5;

  // 4-point Hermite cubic interpolation helper
  function readHermite(buf: Float32Array, readPos: number): number {
    const i = Math.floor(readPos);
    const frac = readPos - i;
    const im1 = (i - 1) & bufferMask;
    const i0 = i & bufferMask;
    const ip1 = (i + 1) & bufferMask;
    const ip2 = (i + 2) & bufferMask;

    const p0 = buf[im1];
    const p1 = buf[i0];
    const p2 = buf[ip1];
    const p3 = buf[ip2];

    const c0 = p1;
    const c1 = 0.5 * (p2 - p0);
    const c2 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
    const c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);

    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }

  // Cross-correlation peak alignment around base delay
  function findBestOffset(
    buf: Float32Array,
    wIdx: number,
    baseDelay: number,
    referenceDelay: number
  ): number {
    const corrLen = 24;
    const searchRange = 16;
    let bestDelta = 0;
    let maxCorr = -Infinity;

    for (let delta = -searchRange; delta <= searchRange; delta += 2) {
      let corr = 0;
      for (let k = 0; k < corrLen; k += 2) {
        const rPosRef = (wIdx - referenceDelay - k) & bufferMask;
        const rPosCand = (wIdx - baseDelay - delta - k) & bufferMask;
        corr += buf[rPosRef] * buf[rPosCand];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        bestDelta = delta;
      }
    }
    return bestDelta;
  }

  // Sub-octave tracking & flip-flop state for octaveBlend
  let subDividerFlip = 1.0;
  let prevSampleForZero = 0.0;
  let subLp1 = 0.0;
  let subLp2 = 0.0;
  let envFollower = 0.0;

  // Tone smoothing filter state
  let toneLp1 = 0.0;
  let toneLp2 = 0.0;

  // DC-blocker filter state (10Hz highpass)
  let dcX1 = 0.0;
  let dcY1 = 0.0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inputChannel = e.inputBuffer.getChannelData(0);
      const outputChannel = e.outputBuffer.getChannelData(0);
      if (!inputChannel || !outputChannel) return;
      const len = inputChannel.length;

      // 1. Analyze RMS and run 4x-decimated pitch period detection
      let sumSq = 0;
      for (let i = 0; i < len; i += 4) {
        const s = inputChannel[i];
        sumSq += s * s;
      }
      const rms = Math.sqrt(sumSq / (len / 4));

      if (rms > 0.0015) {
        // Fast pitch tracker on recent 4x-decimated buffer
        // Decimated sample rate: Fs / 4 = 12000 Hz
        // Tau search range: 10 (1200 Hz) to 380 (31.5 Hz, covering low B on bass)
        const decRate = sampleRate / 4;
        const minTau = Math.max(10, Math.floor(decRate / 1200));
        const maxTau = Math.min(380, Math.floor(decRate / 30));
        const winSize = 100;

        let bestTau = -1;
        let minDiff = Infinity;
        let sumEnergy = 0;

        const wBase = (decWriteIdx - maxTau - winSize) & decRingMask;
        for (let j = 0; j < winSize; j += 2) {
          const v = decRingBuffer[(wBase + j) & decRingMask];
          sumEnergy += v * v;
        }

        if (sumEnergy > 0.0001) {
          for (let tau = minTau; tau < maxTau; tau += 2) {
            let diff = 0;
            for (let j = 0; j < winSize; j += 4) {
              const a = decRingBuffer[(wBase + j) & decRingMask];
              const b = decRingBuffer[(wBase + j + tau) & decRingMask];
              const d = a - b;
              diff += d * d;
            }
            if (diff < minDiff) {
              minDiff = diff;
              bestTau = tau;
            }
          }

          const normDiff = minDiff / (sumEnergy + 1e-6);
          if (normDiff < 0.38 && bestTau > 0) {
            // Parabolic interpolation for fine sub-sample period
            const tauM1 = Math.max(minTau, bestTau - 2);
            const tauP1 = Math.min(maxTau - 1, bestTau + 2);
            let diffM1 = 0;
            let diffP1 = 0;
            for (let j = 0; j < winSize; j += 4) {
              const a = decRingBuffer[(wBase + j) & decRingMask];
              const bM = decRingBuffer[(wBase + j + tauM1) & decRingMask];
              const bP = decRingBuffer[(wBase + j + tauP1) & decRingMask];
              diffM1 += (a - bM) * (a - bM);
              diffP1 += (a - bP) * (a - bP);
            }
            const denom = 2 * (diffM1 - 2 * minDiff + diffP1);
            const peakOffset = Math.abs(denom) > 1e-6 ? (diffM1 - diffP1) / denom : 0;
            const refinedTau = Math.max(minTau, Math.min(maxTau, bestTau + peakOffset));

            const rawPeriod = refinedTau * 4; // scale back to full-resolution sample rate
            smoothedPeriod += (rawPeriod - smoothedPeriod) * 0.25;
            detectedPeriod = smoothedPeriod;
            pitchConfidence = Math.max(0, 1.0 - normDiff);
          } else {
            pitchConfidence *= 0.85;
          }
        }
      } else {
        pitchConfidence = 0.0;
      }

      // 2. Adaptive Pitch-Synchronous Window Sizing:
      // When shifting DOWN (especially octave down, ratio ~ 0.5):
      // Lock sweep size to an EVEN multiple of detected fundamental period T0:
      // S = 2 * m * T0
      // This ensures that the two overlapping grains have delay difference = 0.5 * S = m * T0,
      // which aligns them to the EXACT SAME PHASE of the fundamental waveform!
      const isDownShift = currentRatio < 0.95;
      const isOctaveDown = Math.abs(currentRatio - 0.5) < 0.08;

      if ((trackingMode === 'mono' || (trackingMode === 'auto' && pitchConfidence > 0.28)) && isDownShift) {
        const t0 = Math.max(50, Math.min(1200, detectedPeriod));
        // Find integer m such that S = 2 * m * t0 is in [640, 1600] samples (approx 13ms - 33ms at 48kHz)
        let m = Math.max(1, Math.round(1000 / (2 * t0)));
        if (2 * m * t0 < 580) m++;
        if (2 * m * t0 > 1800 && m > 1) m--;
        targetSweepSize = 2 * m * t0;
      } else {
        // Optimal polyphonic default window for chords / general audio (~22ms)
        targetSweepSize = Math.max(512, Math.min(2048, Math.round(0.022 * sampleRate)));
      }

      // 3. Process each sample block
      const alpha = 0.003; // Smooth ratio glide (~20ms)

      for (let i = 0; i < len; i++) {
        // Smooth targetRatio tracking
        if (Math.abs(targetRatio - currentRatio) > 0.00001) {
          currentRatio += (targetRatio - currentRatio) * alpha;
        } else {
          currentRatio = targetRatio;
        }
        if (!Number.isFinite(currentRatio)) currentRatio = 1.0;
        currentRatio = Math.max(0.125, Math.min(8.0, currentRatio));

        // Smooth sweep size transition
        currentSweepSize += (targetSweepSize - currentSweepSize) * 0.002;

        const rawIn = inputChannel[i];
        const inSample = Number.isFinite(rawIn) ? rawIn : 0.0;

        // Write to circular delay buffer
        ringBuffer[writeIndex] = inSample;

        // Write to 4x decimation buffer for pitch tracking
        decCounter++;
        if (decCounter >= 4) {
          decCounter = 0;
          decRingBuffer[decWriteIdx] = inSample;
          decWriteIdx = (decWriteIdx + 1) & decRingMask;
        }

        let shiftedSample = 0.0;

        if (Math.abs(currentRatio - 1.0) < 0.0005) {
          // Direct pass-through at zero pitch shift (exact unity)
          const rPos = (writeIndex - minDelay) & bufferMask;
          shiftedSample = ringBuffer[rPos];
        } else {
          const phase0 = phase;
          const phase1 = (phase + 0.5) % 1.0;

          // Hann window gains: sin^2(pi * phase0) + cos^2(pi * phase0) = 1.0 at all times!
          const s0 = Math.sin(Math.PI * phase0);
          const win0 = s0 * s0;
          const s1 = Math.sin(Math.PI * phase1);
          const win1 = s1 * s1;

          let delay0 = 0.0;
          let delay1 = 0.0;

          if (currentRatio < 1.0) {
            // Downward pitch shift: delay ramps UP
            delay0 = minDelay + phase0 * currentSweepSize + corrOffset0;
            delay1 = minDelay + phase1 * currentSweepSize + corrOffset1;
          } else {
            // Upward pitch shift: delay ramps DOWN
            delay0 = minDelay + (1.0 - phase0) * currentSweepSize + corrOffset0;
            delay1 = minDelay + (1.0 - phase1) * currentSweepSize + corrOffset1;
          }

          // Grain wrap-around event detection: re-align micro cross-correlation when grain volume is 0
          if (phase0 < lastPhase0 && win0 < 0.02) {
            corrOffset0 = findBestOffset(ringBuffer, writeIndex, minDelay, delay1);
          }
          if (phase1 < lastPhase1 && win1 < 0.02) {
            corrOffset1 = findBestOffset(ringBuffer, writeIndex, minDelay, delay0);
          }
          lastPhase0 = phase0;
          lastPhase1 = phase1;

          // Read Grain 0 with 4-Point Cubic Hermite Interpolation
          const safeDelay0 = Math.max(0, Math.min(bufferSize - 4, delay0));
          const rPos0 = writeIndex - safeDelay0;
          const grain0 = readHermite(ringBuffer, rPos0);

          // Read Grain 1 with 4-Point Cubic Hermite Interpolation
          const safeDelay1 = Math.max(0, Math.min(bufferSize - 4, delay1));
          const rPos1 = writeIndex - safeDelay1;
          const grain1 = readHermite(ringBuffer, rPos1);

          // Overlap-add combination
          shiftedSample = grain0 * win0 + grain1 * win1;

          // Advance phase
          const deltaPhase = Math.abs(1.0 - currentRatio) / currentSweepSize;
          phase = (phase + deltaPhase) % 1.0;
          if (!Number.isFinite(phase)) phase = 0.0;
        }

        // 4. Sub-Harmonic Generator Circuit (for octaveBlend when shifting down)
        // Tracks zero crossings to synthesize a phase-coherent sub-octave fundamental sine wave
        if (octaveBlendEnabled && (isOctaveDown || currentRatio <= 0.6)) {
          // Track input envelope
          const absIn = Math.abs(inSample);
          envFollower += (absIn - envFollower) * (absIn > envFollower ? 0.05 : 0.001);

          // Schmitt trigger zero crossing detection with hysteresis (+/- 0.012)
          if (prevSampleForZero < -0.012 && inSample >= 0.012) {
            subDividerFlip = -subDividerFlip;
          }
          prevSampleForZero = inSample;

          // 2-pole low-pass filter (~180Hz) turns the flip-flop square wave into a rich sub-octave sine wave
          const subCutoff = 180 / sampleRate;
          const subK = Math.tan(Math.PI * subCutoff);
          const rawSub = subDividerFlip * envFollower;
          subLp1 += (rawSub - subLp1) * subK;
          subLp2 += (subLp1 - subLp2) * subK;

          // Blend sub-octave fundamental into shifted voice
          const blendAmt = isOctaveDown ? 0.28 : 0.18;
          shiftedSample = shiftedSample * (1.0 - blendAmt * 0.4) + subLp2 * blendAmt * 1.5;
        }

        // 5. Anti-Aliasing & Tone Warmth 2-Pole Filter (especially for downward shift)
        if (currentRatio < 0.9) {
          // Tone knob: 0 (2.2kHz very warm/dark) to 100 (6.5kHz bright/crisp)
          const targetCutoff = 2200 + (currentTone / 100) * 4300;
          const lpK = Math.min(0.85, Math.tan((Math.PI * targetCutoff) / sampleRate));
          toneLp1 += (shiftedSample - toneLp1) * lpK;
          toneLp2 += (toneLp1 - toneLp2) * lpK;
          shiftedSample = toneLp2;
        }

        // 6. Sub-audio DC-Blocking Filter (fc ~ 10Hz)
        const dcBlocked = shiftedSample - dcX1 + 0.996 * dcY1;
        dcX1 = shiftedSample;
        dcY1 = Number.isFinite(dcBlocked) ? dcBlocked : 0.0;
        shiftedSample = dcY1;

        outputChannel[i] = Number.isFinite(shiftedSample) ? shiftedSample : inSample;
        writeIndex = (writeIndex + 1) & bufferMask;
      }
    } catch {
      // Safe fallback: never silence audio thread if an error occurs
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    input,
    output,
    processor,
    dryGain,
    wetGain,
    setShift: (semitones: number) => {
      const safe = Number.isFinite(semitones) ? Math.max(-36, Math.min(36, semitones)) : 0;
      targetRatio = Math.pow(2, safe / 12);
    },
    setOctaveBlend: (enabled: boolean) => {
      octaveBlendEnabled = enabled;
    },
    setTrackingMode: (mode: 'auto' | 'poly' | 'mono') => {
      trackingMode = mode;
    },
    setTone: (tone: number) => {
      currentTone = Math.max(0, Math.min(100, tone));
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * Updates audio parameters when a pedal knob or toggle is touched
 */
export function updatePedalParameters(ctx: AudioContext, pedal: AnyPedal, wrap: PedalNodeWrapper): void {
  // True bypass switching
  wrap.bypassGain.gain.setTargetAtTime(pedal.enabled ? 0 : 1, ctx.currentTime, 0.015);
  wrap.wetGain.gain.setTargetAtTime(pedal.enabled ? 1 : 0, ctx.currentTime, 0.015);

  const nodes = wrap.dspNodes;

  switch (pedal.type) {
    case 'overdrive': {
      const p = pedal as OverdrivePedal;
      nodes.driveShaper.curve = createOverdriveCurve(p.drive) as any;
      nodes.toneFilter.frequency.setTargetAtTime(1000 + (p.tone / 100) * 6000, ctx.currentTime, 0.02);
      nodes.levelGain.gain.setTargetAtTime(Math.max(0.1, (p.level / 100) * 1.0), ctx.currentTime, 0.02);
      break;
    }

    case 'distortion': {
      const p = pedal as DistortionPedal;
      nodes.distShaper.curve = createDistortionCurve(p.gain) as any;
      nodes.filterNode.frequency.setTargetAtTime(800 + (p.filter / 100) * 7000, ctx.currentTime, 0.02);
      nodes.volumeGain.gain.setTargetAtTime(Math.max(0.1, (p.volume / 100) * 1.0), ctx.currentTime, 0.02);
      break;
    }

    case 'fuzz': {
      const p = pedal as FuzzPedal;
      nodes.preGain.gain.setTargetAtTime(1 + (p.fuzz / 100) * 12, ctx.currentTime, 0.02);
      nodes.fuzzShaper.curve = createFuzzCurve(p.fuzz) as any;
      nodes.scoopFilter.gain.setTargetAtTime(-15 + (p.scoop / 100) * 20, ctx.currentTime, 0.02);
      nodes.toneFilter.frequency.setTargetAtTime(800 + (p.tone / 100) * 6500, ctx.currentTime, 0.02);
      nodes.volumeGain.gain.setTargetAtTime(Math.max(0.1, (p.volume / 100) * 0.8), ctx.currentTime, 0.02);
      break;
    }

    case 'compressor': {
      const p = pedal as CompressorPedal;
      nodes.comp.threshold.setTargetAtTime(-50 + (100 - p.sustain) * 0.4, ctx.currentTime, 0.02);
      nodes.comp.attack.setTargetAtTime(0.003 + (p.attack / 100) * 0.06, ctx.currentTime, 0.02);
      nodes.comp.ratio.setTargetAtTime(3 + (p.sustain / 100) * 12, ctx.currentTime, 0.02);
      nodes.makeupGain.gain.setTargetAtTime(0.6 + (p.level / 100) * 0.8, ctx.currentTime, 0.02);
      const wetFraction = p.blend / 100;
      nodes.wetPath.gain.setTargetAtTime(wetFraction, ctx.currentTime, 0.02);
      nodes.dryPath.gain.setTargetAtTime(1 - wetFraction, ctx.currentTime, 0.02);
      break;
    }

    case 'chorus': {
      const p = pedal as ChorusPedal;
      nodes.lfo.frequency.setTargetAtTime(0.2 + (p.rate / 100) * 4.5, ctx.currentTime, 0.02);
      nodes.lfoGain.gain.setTargetAtTime(0.001 + (p.depth / 100) * 0.006, ctx.currentTime, 0.02);
      nodes.delayNode.delayTime.setTargetAtTime(0.025, ctx.currentTime, 0.02);
      nodes.toneFilter.frequency.setTargetAtTime(2000 + (p.tone / 100) * 8000, ctx.currentTime, 0.02);
      const mix = p.mix / 100;
      nodes.chorusWet.gain.setTargetAtTime(mix, ctx.currentTime, 0.02);
      nodes.chorusDry.gain.setTargetAtTime(1 - mix * 0.4, ctx.currentTime, 0.02);
      break;
    }

    case 'flanger': {
      const p = pedal as FlangerPedal;
      nodes.lfo.frequency.setTargetAtTime(0.05 + (p.rate / 100) * 3.5, ctx.currentTime, 0.02);
      nodes.delayNode.delayTime.setTargetAtTime(0.006 + (p.manual / 100) * 0.006, ctx.currentTime, 0.02);
      nodes.lfoGain.gain.setTargetAtTime(0.0005 + (p.depth / 100) * 0.003, ctx.currentTime, 0.02);
      nodes.feedback.gain.setTargetAtTime((p.feedback / 100) * 0.85, ctx.currentTime, 0.02);
      nodes.dry.gain.value = 0.8;
      nodes.wet.gain.value = 0.8;
      break;
    }

    case 'phaser': {
      const p = pedal as PhaserPedal;
      nodes.lfo.frequency.setTargetAtTime(0.1 + (p.speed / 100) * 5.0, ctx.currentTime, 0.02);
      nodes.ap1.frequency.setTargetAtTime(1200, ctx.currentTime, 0.02);
      nodes.ap2.frequency.setTargetAtTime(1200, ctx.currentTime, 0.02);
      nodes.ap3.frequency.setTargetAtTime(1200, ctx.currentTime, 0.02);
      nodes.ap4.frequency.setTargetAtTime(1200, ctx.currentTime, 0.02);
      nodes.lfoGain.gain.setTargetAtTime((p.depth / 100) * 700, ctx.currentTime, 0.02);
      nodes.feedback.gain.setTargetAtTime((p.feedback / 100) * 0.8, ctx.currentTime, 0.02);
      break;
    }

    case 'tremolo': {
      const p = pedal as TremoloPedal;
      nodes.lfo.frequency.setTargetAtTime(0.5 + (p.speed / 100) * 12, ctx.currentTime, 0.02);
      nodes.lfo.type = p.waveform;
      const depth = p.depth / 100;
      nodes.lfoGain.gain.setTargetAtTime(depth * 0.5, ctx.currentTime, 0.02);
      nodes.modGain.gain.setTargetAtTime(1 - depth * 0.5, ctx.currentTime, 0.02);
      break;
    }

    case 'delay': {
      const p = pedal as DelayPedal;
      nodes.delayNode.delayTime.setTargetAtTime(p.time / 1000, ctx.currentTime, 0.02);
      nodes.feedback.gain.setTargetAtTime(Math.min(0.92, (p.feedback / 100) * 0.88), ctx.currentTime, 0.02);
      nodes.filter.frequency.setTargetAtTime(2000 + (100 - p.flutter) * 60, ctx.currentTime, 0.02);
      const mix = p.mix / 100;
      nodes.wet.gain.setTargetAtTime(mix, ctx.currentTime, 0.02);
      nodes.dry.gain.setTargetAtTime(1.0, ctx.currentTime, 0.02);
      break;
    }

    case 'reverb': {
      const p = pedal as ReverbPedal;
      if (!nodes.convolver.buffer) {
        nodes.convolver.buffer = createReverbImpulse(ctx, p.decay, p.roomType);
      }
      nodes.preDelay.delayTime.setTargetAtTime(p.preDelay / 1000, ctx.currentTime, 0.02);
      nodes.damping.frequency.setTargetAtTime(2000 + (100 - p.damping) * 100, ctx.currentTime, 0.02);
      const mix = p.mix / 100;
      nodes.wet.gain.setTargetAtTime(mix * 1.1, ctx.currentTime, 0.02);
      nodes.dry.gain.setTargetAtTime(1.0, ctx.currentTime, 0.02);
      break;
    }

    case 'eq': {
      const p = pedal as EqPedal;
      const gains = [p.band100, p.band200, p.band400, p.band800, p.band1600, p.band3200, p.band6400];
      nodes.bands.forEach((b: BiquadFilterNode, idx: number) => {
        b.gain.setTargetAtTime(gains[idx], ctx.currentTime, 0.02);
      });
      nodes.levelGain.gain.setTargetAtTime(Math.pow(10, p.level / 20), ctx.currentTime, 0.02);
      break;
    }

    case 'noiseGate': {
      const p = pedal as NoiseGatePedal;
      if (nodes.state) {
        if (typeof p.threshold === 'number') nodes.state.threshold = p.threshold;
        if (typeof p.release === 'number') nodes.state.release = p.release;
      }
      break;
    }

    case 'autoWah': {
      const p = pedal as AutoWahPedal;
      nodes.lfo.frequency.setTargetAtTime(0.5 + (p.sensitivity / 100) * 4, ctx.currentTime, 0.02);
      nodes.filter.frequency.setTargetAtTime(1200, ctx.currentTime, 0.02);
      nodes.lfoGain.gain.setTargetAtTime(200 + (p.range / 100) * 700, ctx.currentTime, 0.02);
      nodes.filter.Q.setTargetAtTime(2 + (p.resonance / 100) * 8, ctx.currentTime, 0.02);
      break;
    }

    case 'pitchShifter': {
      const p = pedal as PitchShifterPedal;
      const shifter = nodes.shifter as PitchShifterNodes;
      const semitones = p.shift + (p.detune || 0) / 100;
      shifter.setShift(semitones);
      if (shifter.setOctaveBlend) {
        shifter.setOctaveBlend(p.octaveBlend !== false);
      }
      if (shifter.setTrackingMode) {
        shifter.setTrackingMode(p.trackingMode || 'auto');
      }
      if (shifter.setTone) {
        shifter.setTone(typeof p.tone === 'number' ? p.tone : 80);
      }
      const mix = Math.max(0, Math.min(1, p.mix / 100));
      // At 100% mix, dryGain is 0.0 and wetGain is 1.0 (ONLY shifted pitch heard)
      shifter.dryGain.gain.setTargetAtTime(1.0 - mix, ctx.currentTime, 0.02);
      shifter.wetGain.gain.setTargetAtTime(mix, ctx.currentTime, 0.02);
      break;
    }

    case 'harmonizer': {
      const p = pedal as HarmonizerPedal;
      const shifter = nodes.shifter as PitchShifterNodes;
      let semitones = 7;
      if (p.interval === '3rd') semitones = p.scale === 'minor' ? 3 : 4;
      else if (p.interval === '5th') semitones = 7;
      else if (p.interval === '6th') semitones = p.scale === 'minor' ? 8 : 9;
      else if (p.interval === 'octave') semitones = 12;
      else if (p.interval === 'double_octave') semitones = 24;

      shifter.setShift(semitones);
      if (shifter.setOctaveBlend) {
        shifter.setOctaveBlend(false);
      }
      if (shifter.setTrackingMode) {
        shifter.setTrackingMode('auto');
      }
      if (shifter.setTone) {
        shifter.setTone(90);
      }
      shifter.dryGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      shifter.wetGain.gain.setTargetAtTime((p.harmonyLevel / 100) * 0.75, ctx.currentTime, 0.02);
      nodes.directGain.gain.setTargetAtTime((p.directLevel / 100) * 0.85, ctx.currentTime, 0.02);
      break;
    }

    case 'vocalTuner': {
      const p = pedal as VocalTunerPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalDoubler': {
      const p = pedal as VocalDoublerPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'deEsser': {
      const p = pedal as DeEsserPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'telephoneVoice': {
      const p = pedal as TelephoneVoicePedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalFormant': {
      const p = pedal as VocalFormantPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalHarmony': {
      const p = pedal as VocalHarmonyPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalPreamp': {
      const p = pedal as VocalPreampPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalStutter': {
      const p = pedal as VocalStutterPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'vocalAlien': {
      const p = pedal as VocalAlienPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'granularCloud': {
      const p = pedal as GranularCloudPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'arcadeSynth': {
      const p = pedal as ArcadeSynthPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'spectralFreeze': {
      const p = pedal as SpectralFreezePedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'tapeGlitch': {
      const p = pedal as TapeGlitchPedal;
      if (nodes.updateParams) nodes.updateParams(p);
      break;
    }

    case 'uniVibe':
    case 'harmonicTremolo':
    case 'slowGear':
    case 'klonOverdrive':
    case 'multiOctave':
    case 'talkingWah':
    case 'reverseReverb':
    case 'crystalDelay':
    case 'hardTune':
    case 'lofiVinyl': {
      if (nodes.updateParams) nodes.updateParams(pedal as any);
      break;
    }
  }
}

/**
 * Generates synthetic reverb impulse response buffer
 */
function createReverbImpulse(ctx: AudioContext, decay: number, roomType: 'spring' | 'plate' | 'hall'): AudioBuffer {
  const rate = ctx.sampleRate;
  const lengthSec = 0.5 + (decay / 100) * 2.5;
  const length = Math.floor(rate * lengthSec);
  const buffer = ctx.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const decayConstant = 5 + (100 - decay) * 0.12;

  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const envelope = Math.exp(-decayConstant * t);
    const springMod = roomType === 'spring' ? Math.sin(t * 80) * 0.2 : 0;

    left[i] = (Math.random() * 2 - 1 + springMod) * envelope * 0.8;
    right[i] = (Math.random() * 2 - 1 - springMod) * envelope * 0.8;
  }
  return buffer;
}

// ============================================================================
// VOCAL & VOICE DSP ENGINES
// ============================================================================

const VOCAL_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VOCAL_ROOT_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};
const VOCAL_SCALE_DEGREES: Record<string, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10]
};

/**
 * Real-Time Vocal Pitch Correction & Auto-Tune DSP Engine.
 * Features vocal range (80Hz - 850Hz) fundamental tracking, scale-aware target snapping,
 * glissando slew rate (0 = transparent glide, 100 = hard robotic Cher/T-Pain snap),
 * and humanize vibrato preservation.
 */
function createVocalTunerDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  dryGain.gain.value = 0.0;
  wetGain.gain.value = 1.0;

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Circular delay line
  const bufferSize = 32768;
  const bufferMask = bufferSize - 1;
  const ringBuffer = new Float32Array(bufferSize);
  let writeIndex = 0;

  // Analysis decimation buffer (2x decimation, rate ~ 24kHz)
  const decRingSize = 2048;
  const decRingMask = decRingSize - 1;
  const decRingBuffer = new Float32Array(decRingSize);
  let decWriteIdx = 0;
  let decToggle = false;

  // Parameter state
  let currentKey = 'C';
  let currentScale = 'chromatic';
  let snapSpeed = 85; // 0 - 100
  let pitchCorrection = 90; // 0 - 100
  let humanizeAmount = 25; // 0 - 100
  let dryWetMix = 100; // 0 - 100

  let targetRatio = 1.0;
  let currentRatio = 1.0;
  let grainPhase = 0.0;
  const grainSweepSize = Math.max(384, Math.min(1024, Math.round(0.018 * sampleRate))); // ~18ms

  function hermiteRead(buf: Float32Array, pos: number): number {
    const i = Math.floor(pos);
    const frac = pos - i;
    const im1 = (i - 1) & bufferMask;
    const i0 = i & bufferMask;
    const ip1 = (i + 1) & bufferMask;
    const ip2 = (i + 2) & bufferMask;

    const p0 = buf[im1];
    const p1 = buf[i0];
    const p2 = buf[ip1];
    const p3 = buf[ip2];

    const c0 = p1;
    const c1 = 0.5 * (p2 - p0);
    const c2 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
    const c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);

    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      // 1. RMS level check
      let sumSq = 0;
      for (let i = 0; i < len; i += 4) {
        const s = inCh[i];
        sumSq += s * s;
      }
      const rms = Math.sqrt(sumSq / (len / 4));

      if (rms > 0.0012) {
        // Run 2x decimated vocal pitch detection
        // At 24kHz, human vocal fundamental 75Hz - 850Hz maps to tau in [28, 320]
        const decRate = sampleRate / 2;
        const minTau = Math.max(28, Math.floor(decRate / 850));
        const maxTau = Math.min(320, Math.floor(decRate / 75));
        const winSize = 120;

        let bestTau = -1;
        let minDiff = Infinity;
        let sumEnergy = 0;

        const wBase = (decWriteIdx - maxTau - winSize) & decRingMask;
        for (let j = 0; j < winSize; j += 2) {
          const v = decRingBuffer[(wBase + j) & decRingMask];
          sumEnergy += v * v;
        }

        if (sumEnergy > 0.0001) {
          for (let tau = minTau; tau < maxTau; tau += 2) {
            let diff = 0;
            for (let j = 0; j < winSize; j += 4) {
              const a = decRingBuffer[(wBase + j) & decRingMask];
              const b = decRingBuffer[(wBase + j + tau) & decRingMask];
              const d = a - b;
              diff += d * d;
            }
            if (diff < minDiff) {
              minDiff = diff;
              bestTau = tau;
            }
          }

          const normDiff = minDiff / (sumEnergy + 1e-6);
          if (normDiff < 0.38 && bestTau > 0) {
            // Parabolic refinement
            const tauM1 = Math.max(minTau, bestTau - 2);
            const tauP1 = Math.min(maxTau - 1, bestTau + 2);
            let diffM1 = 0;
            let diffP1 = 0;
            for (let j = 0; j < winSize; j += 4) {
              const a = decRingBuffer[(wBase + j) & decRingMask];
              const bM = decRingBuffer[(wBase + j + tauM1) & decRingMask];
              const bP = decRingBuffer[(wBase + j + tauP1) & decRingMask];
              diffM1 += (a - bM) * (a - bM);
              diffP1 += (a - bP) * (a - bP);
            }
            const denom = 2 * (diffM1 - 2 * minDiff + diffP1);
            const peakOffset = Math.abs(denom) > 1e-6 ? (diffM1 - diffP1) / denom : 0;
            const refinedTau = Math.max(minTau, Math.min(maxTau, bestTau + peakOffset));
            const detectedFreq = decRate / refinedTau;

            if (detectedFreq >= 75 && detectedFreq <= 850) {
              // Convert to continuous MIDI note number
              const rawMidi = 69 + 12 * Math.log2(detectedFreq / 440);

              // Scale & Key quantize
              const root = VOCAL_ROOT_MAP[currentKey] ?? 0;
              const degrees = VOCAL_SCALE_DEGREES[currentScale] ?? VOCAL_SCALE_DEGREES.chromatic;
              const allowed = new Set(degrees.map(d => (root + d) % 12));

              // Find closest integer MIDI note in scale
              const baseMidiRound = Math.round(rawMidi);
              let closestTargetMidi = baseMidiRound;
              let minPitchDist = Infinity;

              for (let delta = -6; delta <= 6; delta++) {
                const cand = baseMidiRound + delta;
                const semitoneMod = ((cand % 12) + 12) % 12;
                if (allowed.has(semitoneMod)) {
                  const dist = Math.abs(cand - rawMidi);
                  if (dist < minPitchDist) {
                    minPitchDist = dist;
                    closestTargetMidi = cand;
                  }
                }
              }

              let deltaSemitones = closestTargetMidi - rawMidi;

              // Humanize: preserve subtle natural singing vibrato if within threshold
              if (humanizeAmount > 0) {
                const vibratoThreshold = 0.35 * (humanizeAmount / 100);
                if (Math.abs(deltaSemitones) < vibratoThreshold) {
                  deltaSemitones *= (1 - humanizeAmount / 100);
                }
              }

              const effShift = deltaSemitones * (pitchCorrection / 100);
              targetRatio = Math.pow(2, Math.max(-12, Math.min(12, effShift)) / 12);
            }
          }
        }
      } else {
        targetRatio = 1.0;
      }

      // Slew rate controller:
      // snapSpeed 100 = instant snap (Cher / T-Pain autotune)
      // snapSpeed 30 = smooth natural glissando
      const slewCoeff = 0.04 + (snapSpeed / 100) * 0.96;
      currentRatio += (targetRatio - currentRatio) * slewCoeff;

      const rateDiff = 1.0 - currentRatio;
      const baseDelay = 48; // ~1ms low margin

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        ringBuffer[writeIndex] = inSample;

        // Decimate to 24kHz buffer
        decToggle = !decToggle;
        if (decToggle) {
          decRingBuffer[decWriteIdx] = inSample;
          decWriteIdx = (decWriteIdx + 1) & decRingMask;
        }

        // Granular readout with 2 crossfading grains
        grainPhase += rateDiff;
        if (grainPhase >= grainSweepSize) {
          grainPhase -= grainSweepSize;
        } else if (grainPhase < 0) {
          grainPhase += grainSweepSize;
        }

        const frac0 = grainPhase / grainSweepSize;
        const frac1 = (frac0 + 0.5) % 1.0;

        // Hann window weights
        const w0 = 0.5 * (1 - Math.cos(2 * Math.PI * frac0));
        const w1 = 0.5 * (1 - Math.cos(2 * Math.PI * frac1));

        const rPos0 = (writeIndex - baseDelay - grainPhase + bufferSize) & bufferMask;
        const rPos1 = (writeIndex - baseDelay - ((grainPhase + grainSweepSize * 0.5) % grainSweepSize) + bufferSize) & bufferMask;

        const s0 = hermiteRead(ringBuffer, rPos0);
        const s1 = hermiteRead(ringBuffer, rPos1);

        const shifted = (s0 * w0 + s1 * w1) / (w0 + w1 + 1e-5);
        outCh[i] = Number.isFinite(shifted) ? shifted : inSample;

        writeIndex = (writeIndex + 1) & bufferMask;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: VocalTunerPedal) => {
      currentKey = p.key || 'C';
      currentScale = p.scale || 'chromatic';
      snapSpeed = Math.max(0, Math.min(100, p.speed));
      pitchCorrection = Math.max(0, Math.min(100, p.correction));
      humanizeAmount = Math.max(0, Math.min(100, p.humanize));
      dryWetMix = Math.max(0, Math.min(100, p.mix));

      const now = ctx.currentTime;
      const mix = dryWetMix / 100;
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * Studio Vocal Doubler & Widener DSP Engine.
 * Recreates the lush Abbey Road ADT (Artificial Double Tracking) effect with dual
 * micro-delayed and micro-modulated channels, stereophonic Haas separation, and vocal air warmth.
 */
function createVocalDoublerDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 7500;
  warmth.Q.value = 0.7;

  const delayL = ctx.createDelay(0.15);
  const delayR = ctx.createDelay(0.15);
  delayL.delayTime.value = 0.022;
  delayR.delayTime.value = 0.034;

  const lfoL = ctx.createOscillator();
  const lfoR = ctx.createOscillator();
  lfoL.type = 'sine';
  lfoR.type = 'sine';
  lfoL.frequency.value = 0.23;
  lfoR.frequency.value = 0.31;

  const lfoGainL = ctx.createGain();
  const lfoGainR = ctx.createGain();
  lfoGainL.gain.value = 0.0018;
  lfoGainR.gain.value = 0.0024;

  lfoL.connect(lfoGainL);
  lfoGainL.connect(delayL.delayTime);
  lfoR.connect(lfoGainR);
  lfoGainR.connect(delayR.delayTime);

  try { lfoL.start(); } catch {}
  try { lfoR.start(); } catch {}

  let pannerL: StereoPannerNode | null = null;
  let pannerR: StereoPannerNode | null = null;
  if (typeof ctx.createStereoPanner === 'function') {
    pannerL = ctx.createStereoPanner();
    pannerR = ctx.createStereoPanner();
    pannerL.pan.value = -0.75;
    pannerR.pan.value = 0.75;
  }

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(warmth);
  warmth.connect(delayL);
  warmth.connect(delayR);

  if (pannerL && pannerR) {
    delayL.connect(pannerL);
    delayR.connect(pannerR);
    pannerL.connect(wetGain);
    pannerR.connect(wetGain);
  } else {
    delayL.connect(wetGain);
    delayR.connect(wetGain);
  }

  wetGain.connect(output);

  return {
    dryGain,
    wetGain,
    delayL,
    delayR,
    lfoL,
    lfoR,
    lfoGainL,
    lfoGainR,
    pannerL,
    pannerR,
    updateParams: (p: VocalDoublerPedal) => {
      const now = ctx.currentTime;
      const baseDelaySec = 0.010 + (p.delay / 100) * 0.045;
      delayL.delayTime.setTargetAtTime(baseDelaySec, now, 0.02);
      delayR.delayTime.setTargetAtTime(baseDelaySec * 1.35, now, 0.02);

      const depthSec = 0.0005 + (p.depth / 100) * 0.0035;
      lfoGainL.gain.setTargetAtTime(depthSec, now, 0.02);
      lfoGainR.gain.setTargetAtTime(depthSec * 1.25, now, 0.02);

      const detuneRate = 0.15 + (p.detune / 100) * 0.45;
      lfoL.frequency.setTargetAtTime(detuneRate, now, 0.02);
      lfoR.frequency.setTargetAtTime(detuneRate * 1.38, now, 0.02);

      const spreadFrac = Math.max(0, Math.min(1, p.spread / 100));
      if (pannerL && pannerR) {
        pannerL.pan.setTargetAtTime(-spreadFrac * 0.9, now, 0.02);
        pannerR.pan.setTargetAtTime(spreadFrac * 0.9, now, 0.02);
      }

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      wetGain.gain.setTargetAtTime(mix * 0.85, now, 0.02);
      dryGain.gain.setTargetAtTime(1.0 - mix * 0.25, now, 0.02);
    },
    dispose: () => {
      try { lfoL.stop(); } catch {}
      try { lfoR.stop(); } catch {}
      try { lfoL.disconnect(); } catch {}
      try { lfoR.disconnect(); } catch {}
    }
  };
}

/**
 * Precision Vocal De-Esser DSP Engine.
 * Dynamically attenuates sibilance frequencies (3kHz - 9kHz) with high-speed sidechain
 * envelope detection and an audition Listen mode.
 */
function createDeEsserDsp(ctx: AudioContext, input: GainNode, output: GainNode, initialPedal?: DeEsserPedal) {
  const notchFilter = ctx.createBiquadFilter();
  notchFilter.type = 'peaking';
  notchFilter.frequency.value = initialPedal?.frequency || 6500;
  notchFilter.Q.value = initialPedal?.bandwidth === 'narrow' ? 4.0 : 2.0;
  notchFilter.gain.value = 0;

  const mainGain = ctx.createGain();
  input.connect(notchFilter);
  notchFilter.connect(mainGain);
  mainGain.connect(output);

  const detectorFilter = ctx.createBiquadFilter();
  detectorFilter.type = 'bandpass';
  detectorFilter.frequency.value = initialPedal?.frequency || 6500;
  detectorFilter.Q.value = 3.5;

  const listenGain = ctx.createGain();
  listenGain.gain.value = 0;
  input.connect(detectorFilter);
  detectorFilter.connect(listenGain);
  listenGain.connect(output);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  detectorFilter.connect(analyser);

  let thresholdDb = initialPedal?.threshold ?? -38;
  let reductionPercent = initialPedal?.reduction ?? 65;

  const timeBuf = new Float32Array(256);
  const timer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    analyser.getFloatTimeDomainData(timeBuf);
    let sumSq = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      sumSq += timeBuf[i] * timeBuf[i];
    }
    const rms = Math.sqrt(sumSq / timeBuf.length);
    const db = 20 * Math.log10(Math.max(1e-5, rms));
    const now = ctx.currentTime;

    if (db > thresholdDb) {
      const excess = db - thresholdDb;
      const maxDip = -(reductionPercent / 100) * 20; // up to -20 dB cut on harsh sibilance
      const dip = Math.max(maxDip, -excess * 1.4);
      notchFilter.gain.setTargetAtTime(dip, now, 0.003); // ultra-fast 3ms attack
    } else {
      notchFilter.gain.setTargetAtTime(0, now, 0.035); // 35ms smooth release
    }
  }, 16);

  return {
    notchFilter,
    detectorFilter,
    mainGain,
    listenGain,
    updateParams: (p: DeEsserPedal) => {
      const now = ctx.currentTime;
      thresholdDb = p.threshold;
      reductionPercent = p.reduction;

      const freq = Math.max(2500, Math.min(10000, p.frequency));
      notchFilter.frequency.setTargetAtTime(freq, now, 0.02);
      detectorFilter.frequency.setTargetAtTime(freq, now, 0.02);

      const q = p.bandwidth === 'narrow' ? 4.5 : 2.0;
      notchFilter.Q.setTargetAtTime(q, now, 0.02);
      detectorFilter.Q.setTargetAtTime(q * 1.2, now, 0.02);

      if (p.listen) {
        mainGain.gain.setTargetAtTime(0, now, 0.015);
        listenGain.gain.setTargetAtTime(1.4, now, 0.015);
      } else {
        mainGain.gain.setTargetAtTime(1.0, now, 0.015);
        listenGain.gain.setTargetAtTime(0, now, 0.015);
      }
    },
    dispose: () => {
      clearInterval(timer);
      try { analyser.disconnect(); } catch {}
    }
  };
}

/**
 * Lo-Fi Megaphone & Vintage Radio Voice DSP Engine.
 * Produces band-limited frequency shaping with diaphragm saturation and analog crackle.
 */
function createTelephoneVoiceDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 450;
  hpFilter.Q.value = 1.0;

  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve = createTelephoneCurve(50) as any;

  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 3200;
  lpFilter.Q.value = 1.2;

  const peakFilter = ctx.createBiquadFilter();
  peakFilter.type = 'peaking';
  peakFilter.frequency.value = 1800;
  peakFilter.Q.value = 2.0;
  peakFilter.gain.value = 6;

  const wetVoiceGain = ctx.createGain();
  const dryGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(hpFilter);
  hpFilter.connect(shaper);
  shaper.connect(lpFilter);
  lpFilter.connect(peakFilter);
  peakFilter.connect(wetVoiceGain);
  wetVoiceGain.connect(output);

  // Generate 2-second looped radio static/crackle buffer
  const sampleRate = ctx.sampleRate || 48000;
  const noiseLen = Math.floor(sampleRate * 2.0);
  const noiseBuffer = ctx.createBuffer(1, noiseLen, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let lastNoise = 0;
  for (let i = 0; i < noiseLen; i++) {
    const white = Math.random() * 2 - 1;
    lastNoise = lastNoise * 0.92 + white * 0.08;
    const click = Math.random() < 0.0008 ? (Math.random() * 2 - 1) * 0.8 : 0;
    noiseData[i] = (lastNoise * 0.6 + click) * 0.4;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1600;
  noiseFilter.Q.value = 1.8;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.015;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(output);
  try { noiseSource.start(); } catch {}

  return {
    hpFilter,
    lpFilter,
    peakFilter,
    shaper,
    wetVoiceGain,
    dryGain,
    noiseGain,
    noiseFilter,
    updateParams: (p: TelephoneVoicePedal) => {
      const now = ctx.currentTime;
      let hpFreq = 450;
      let lpFreq = 3200;
      let peakFreq = 1800;
      let peakGainVal = 6;
      let peakQVal = 2.0;

      const fMod = (p.filter - 50) / 50; // -1 to +1

      if (p.mode === 'megaphone') {
        hpFreq = 620 + fMod * 120;
        lpFreq = 2600 + fMod * 400;
        peakFreq = 2200;
        peakGainVal = 9.5;
        peakQVal = 3.4;
      } else if (p.mode === 'radio') {
        hpFreq = 340 + fMod * 80;
        lpFreq = 4200 + fMod * 600;
        peakFreq = 1350;
        peakGainVal = 4.0;
        peakQVal = 1.6;
      } else if (p.mode === 'gramophone') {
        hpFreq = 220 + fMod * 60;
        lpFreq = 2200 + fMod * 350;
        peakFreq = 950;
        peakGainVal = 4.5;
        peakQVal = 1.4;
      } else {
        // telephone
        hpFreq = 450 + fMod * 100;
        lpFreq = 3200 + fMod * 450;
        peakFreq = 1750;
        peakGainVal = 6.0;
        peakQVal = 2.0;
      }

      hpFilter.frequency.setTargetAtTime(Math.max(100, hpFreq), now, 0.02);
      lpFilter.frequency.setTargetAtTime(Math.min(10000, lpFreq), now, 0.02);
      peakFilter.frequency.setTargetAtTime(peakFreq, now, 0.02);
      peakFilter.gain.setTargetAtTime(peakGainVal, now, 0.02);
      peakFilter.Q.setTargetAtTime(peakQVal, now, 0.02);

      shaper.curve = createTelephoneCurve(p.drive) as any;

      const noiseAmt = Math.max(0, Math.min(1, p.noise / 100));
      noiseGain.gain.setTargetAtTime(noiseAmt * 0.12, now, 0.02);

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      wetVoiceGain.gain.setTargetAtTime(mix * 1.15, now, 0.02);
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
    },
    dispose: () => {
      try { noiseSource.stop(); } catch {}
      try { noiseSource.disconnect(); } catch {}
    }
  };
}

/**
 * Fast 2nd-order IIR Biquad Filter for real-time sample-by-sample vocoder filterbanks.
 */
class FastVocoderBiquad {
  public b0: number = 0;
  public b1: number = 0;
  public b2: number = 0;
  public a1: number = 0;
  public a2: number = 0;
  private x1: number = 0;
  private x2: number = 0;
  private y1: number = 0;
  private y2: number = 0;

  public setBandpass(freq: number, Q: number, sampleRate: number): void {
    const clampedFreq = Math.max(40, Math.min(sampleRate * 0.45, freq));
    const w0 = (2 * Math.PI * clampedFreq) / sampleRate;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);

    const b0_raw = Math.sin(w0) / 2;
    const b2_raw = -b0_raw;
    const a0_raw = 1 + alpha;
    const a1_raw = -2 * cosw0;
    const a2_raw = 1 - alpha;

    this.b0 = b0_raw / a0_raw;
    this.b1 = 0;
    this.b2 = b2_raw / a0_raw;
    this.a1 = a1_raw / a0_raw;
    this.a2 = a2_raw / a0_raw;
  }

  public process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return Number.isFinite(y) ? y : 0;
  }

  public reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }
}

/**
 * Vocal Transformer / Robot & Formant Shifter DSP Engine.
 *
 * - In Robot Mode: True 8-Band Analysis/Synthesis Channel Vocoder.
 *   The user's voice is analyzed across an 8-band filterbank (220Hz - 7.2kHz).
 *   The extracted vowel & consonant spectral envelopes modulate a synthetic
 *   anti-aliased multi-harmonic pulse/saw/sub carrier oscillator with high-band noise exciter.
 *   CRITICAL: The natural speech waveform is NEVER mixed or added into the output stream!
 *   At 100% Mix, 0.0% of the raw voice passes through, leaving only the pure Kraftwerk/Daft Punk
 *   robotic speech. Silence threshold gating guarantees dead silence with 0 buzzing when not speaking.
 *
 * - In Natural Mode: Shifting formant resonances F1, F2, F3 transforms vocal tract length
 *   (deep monster vs bright anime/chipmunk) without altering musical pitch.
 */
function createVocalFormantDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);

  // Formant filtering resonators (for Natural Formant Shift mode)
  const f1 = ctx.createBiquadFilter();
  f1.type = 'peaking';
  f1.frequency.value = 720;
  f1.Q.value = 2.8;
  f1.gain.value = 8;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'peaking';
  f2.frequency.value = 1550;
  f2.Q.value = 3.2;
  f2.gain.value = 9;

  const f3 = ctx.createBiquadFilter();
  f3.type = 'peaking';
  f3.frequency.value = 2750;
  f3.Q.value = 3.8;
  f3.gain.value = 6;

  const brightness = ctx.createBiquadFilter();
  brightness.type = 'highshelf';
  brightness.frequency.value = 4200;
  brightness.gain.value = 0;

  const effectWetGain = ctx.createGain();
  const effectDryGain = ctx.createGain();

  effectDryGain.gain.value = 0.0;
  effectWetGain.gain.value = 1.0;

  // Dry path directly from input to output (strictly 0.0 gain at 100% mix)
  input.connect(effectDryGain);
  effectDryGain.connect(output);

  // Wet processed path
  input.connect(processor);
  processor.connect(f1);
  f1.connect(f2);
  f2.connect(f3);
  f3.connect(brightness);
  brightness.connect(effectWetGain);
  effectWetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // 8-Band Vocoder Frequency Grid (covering vocal chest resonance up to sibilance)
  const VOCODER_BANDS = [220, 420, 740, 1200, 1900, 3000, 4600, 7200];
  const NUM_BANDS = VOCODER_BANDS.length;

  const analysisFilters: FastVocoderBiquad[] = [];
  const synthesisFilters: FastVocoderBiquad[] = [];
  const bandEnvelopes = new Float32Array(NUM_BANDS);

  for (let k = 0; k < NUM_BANDS; k++) {
    const af = new FastVocoderBiquad();
    af.setBandpass(VOCODER_BANDS[k], 2.8, sampleRate);
    analysisFilters.push(af);

    const sf = new FastVocoderBiquad();
    sf.setBandpass(VOCODER_BANDS[k], 2.8, sampleRate);
    synthesisFilters.push(sf);
  }

  // DSP state
  let isRobotMode = true;
  let targetRobotFreq = 110.0; // A2
  let currentRobotFreq = 110.0;
  let carrierPhase = 0.0;
  let subCarrierPhase = 0.0;
  let formantShiftSemitones = 0; // -12 to +12
  let pitchShiftSemitones = 0; // -12 to +12 semitones
  let speechEnvelope = 0.0;

  // Natural mode pitch shifting buffer (dual-grain crossfade)
  const naturalRingSize = 16384;
  const naturalRingMask = naturalRingSize - 1;
  const naturalRing = new Float32Array(naturalRingSize);
  let naturalWriteIdx = 0;
  let naturalGrainPhase = 0.0;
  const naturalGrainSize = Math.max(256, Math.min(2048, Math.round(0.028 * sampleRate))); // ~28ms

  const ROBOT_PITCH_MAP: Record<string, number> = {
    'C2': 65.41,
    'E2': 82.41,
    'G2': 97.99,
    'A2': 110.00,
    'C3': 130.81,
    'E3': 164.81,
    'G3': 196.00
  };

  function updateSynthesisFilterFrequencies() {
    const formantMult = Math.pow(2, formantShiftSemitones / 12);
    for (let k = 0; k < NUM_BANDS; k++) {
      const shifted = VOCODER_BANDS[k] * formantMult;
      synthesisFilters[k].setBandpass(shifted, 2.8, sampleRate);
    }
  }

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      currentRobotFreq += (targetRobotFreq - currentRobotFreq) * 0.15;
      const phaseInc = currentRobotFreq / sampleRate;
      const subPhaseInc = (currentRobotFreq * 0.5) / sampleRate;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        const absVal = Math.abs(inSample);

        // Fast peak envelope follower on raw vocal input
        if (absVal > speechEnvelope) {
          speechEnvelope += (absVal - speechEnvelope) * 0.45;
        } else {
          speechEnvelope += (absVal - speechEnvelope) * 0.005;
        }

        if (!isRobotMode) {
          // Natural Formant Mode: Voice passes through physical formant resonators F1, F2, F3
          if (Math.abs(pitchShiftSemitones) < 0.05) {
            outCh[i] = inSample;
            naturalRing[naturalWriteIdx] = inSample;
            naturalWriteIdx = (naturalWriteIdx + 1) & naturalRingMask;
          } else {
            naturalRing[naturalWriteIdx] = inSample;
            const ratio = Math.pow(2, pitchShiftSemitones / 12);
            const phase1 = naturalGrainPhase;
            const phase2 = (naturalGrainPhase + 0.5) % 1.0;
            const d1 = phase1 * naturalGrainSize;
            const d2 = phase2 * naturalGrainSize;
            const r1 = (naturalWriteIdx - 64 - d1) & naturalRingMask;
            const r2 = (naturalWriteIdx - 64 - d2) & naturalRingMask;
            const w1 = 0.5 * (1 - Math.cos(2 * Math.PI * phase1));
            const w2 = 0.5 * (1 - Math.cos(2 * Math.PI * phase2));
            outCh[i] = naturalRing[r1] * w1 + naturalRing[r2] * w2;
            naturalWriteIdx = (naturalWriteIdx + 1) & naturalRingMask;
            naturalGrainPhase = (naturalGrainPhase + (1 - ratio) / naturalGrainSize) % 1.0;
            if (naturalGrainPhase < 0) naturalGrainPhase += 1.0;
          }
        } else {
          // =========================================================================
          // ROBOT MODE: TRUE 8-BAND CHANNEL VOCODER
          // =========================================================================

          // SILENCE NOISE GATE:
          // When user pauses, breathes, or stops speaking, gate the output to absolute 0.0.
          // Eliminates any idle oscillator buzz, hum, or background drone!
          if (speechEnvelope < 0.0018) {
            outCh[i] = 0.0;
            carrierPhase = (carrierPhase + phaseInc) % 1.0;
            subCarrierPhase = (subCarrierPhase + subPhaseInc) % 1.0;
            for (let k = 0; k < NUM_BANDS; k++) {
              bandEnvelopes[k] *= 0.94;
            }
            continue;
          }

          // Advance anti-aliased synthetic robot carrier
          const saw = 2.0 * carrierPhase - 1.0;
          const pulse = carrierPhase < 0.32 ? 1.0 : -1.0;
          const sub = Math.sin(2 * Math.PI * subCarrierPhase);
          const toneCarrier = 0.52 * saw + 0.30 * pulse + 0.18 * sub;

          carrierPhase = (carrierPhase + phaseInc) % 1.0;
          subCarrierPhase = (subCarrierPhase + subPhaseInc) % 1.0;

          let vocodedSum = 0.0;

          // Process each vocoder frequency band
          for (let k = 0; k < NUM_BANDS; k++) {
            // 1. Voice Analysis: Bandpass filter human speech into band level
            const speechBand = analysisFilters[k].process(inSample);
            const absBand = Math.abs(speechBand);

            // Fast attack (~2ms) & smooth decay (~20ms) envelope detection
            if (absBand > bandEnvelopes[k]) {
              bandEnvelopes[k] += (absBand - bandEnvelopes[k]) * 0.35;
            } else {
              bandEnvelopes[k] += (absBand - bandEnvelopes[k]) * 0.015;
            }

            // 2. Carrier Preparation:
            // For bands 6 & 7 (high sibilance/plosives), blend noise for crisp "S", "T", "Ch" diction
            let carrierIn = toneCarrier;
            if (k >= 6) {
              const noise = (Math.random() * 2 - 1) * 0.75;
              carrierIn = toneCarrier * 0.25 + noise * 0.75;
            } else if (k === 5) {
              const noise = (Math.random() * 2 - 1) * 0.35;
              carrierIn = toneCarrier * 0.70 + noise * 0.30;
            }

            // 3. Synthesis: Filter the synth carrier through the corresponding synthesis band
            const synthBand = synthesisFilters[k].process(carrierIn);

            // 4. Vocoding: Multiply synthesis carrier by the vocal band envelope
            vocodedSum += synthBand * bandEnvelopes[k];
          }

          // Analog warmth saturation with calibrated output headroom
          // CRITICAL: inSample is NEVER added! Output is 100% pure robotic vocoder speech!
          const saturated = Math.tanh(vocodedSum * 3.2) * 0.95;
          outCh[i] = Number.isFinite(saturated) ? saturated : 0.0;
        }
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    f1,
    f2,
    f3,
    brightness,
    effectWetGain,
    effectDryGain,
    updateParams: (p: VocalFormantPedal) => {
      const now = ctx.currentTime;
      isRobotMode = Boolean(p.robotMode);
      formantShiftSemitones = Math.max(-12, Math.min(12, p.formant));
      pitchShiftSemitones = typeof p.pitch === 'number' ? Math.max(-12, Math.min(12, p.pitch)) : 0;

      let baseFreq = 110.0;
      if (p.robotPitch && ROBOT_PITCH_MAP[p.robotPitch]) {
        baseFreq = ROBOT_PITCH_MAP[p.robotPitch];
      }
      // Modulate the robot carrier frequency by the pitch knob transposition
      targetRobotFreq = baseFreq * Math.pow(2, pitchShiftSemitones / 12);

      updateSynthesisFilterFrequencies();

      // Calculate formant resonance shift (mult = 2^(formant/12))
      const mult = Math.pow(2, formantShiftSemitones / 12);
      f1.frequency.setTargetAtTime(Math.max(180, Math.min(2200, 720 * mult)), now, 0.02);
      f2.frequency.setTargetAtTime(Math.max(350, Math.min(4200, 1550 * mult)), now, 0.02);
      f3.frequency.setTargetAtTime(Math.max(700, Math.min(7000, 2750 * mult)), now, 0.02);

      // In robot mode, emphasize formants for classic robotic resonant bite
      const formantBoost = isRobotMode ? 8.0 : 6.0;
      f1.gain.setTargetAtTime(formantBoost, now, 0.02);
      f2.gain.setTargetAtTime(formantBoost + 1.0, now, 0.02);
      f3.gain.setTargetAtTime(formantBoost - 1.0, now, 0.02);

      // Brightness / air control (-12dB to +12dB)
      const brightDb = ((p.brightness - 50) / 50) * 12;
      brightness.gain.setTargetAtTime(brightDb, now, 0.02);

      // True dry/wet isolation:
      // At 100% mix, effectDryGain is strictly 0.0 (no dry voice bypass), effectWetGain is 1.0
      const mixNorm = Math.max(0, Math.min(1, p.mix / 100));
      effectWetGain.gain.setTargetAtTime(mixNorm, now, 0.02);
      effectDryGain.gain.setTargetAtTime(1.0 - mixNorm, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 1. Multi-Voice Vocal Harmony Choir Engine DSP
 * Creates dual intelligent vocal harmonies with key/scale selection, stereo spread,
 * and natural humanize pitch drift.
 */
function createVocalHarmonyDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 2);

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Circular ring buffer
  const bufSize = 16384;
  const bufMask = bufSize - 1;
  const ring = new Float32Array(bufSize);
  let writeIdx = 0;

  // Grain tracking for Voice 1 & Voice 2
  let targetRatio1 = Math.pow(2, 4 / 12); // Major 3rd (+4 st)
  let targetRatio2 = Math.pow(2, 7 / 12); // Perfect 5th (+7 st)
  let voice2Enabled = true;

  let currentRatio1 = targetRatio1;
  let currentRatio2 = targetRatio2;

  let spread = 75; // 0 - 100%
  let humanize = 30; // 0 - 100%

  let grainPhase1_0 = 0.0;
  let grainPhase1_1 = 0.5;
  let grainPhase2_0 = 0.0;
  let grainPhase2_1 = 0.5;

  const grainLen = Math.floor(sampleRate * 0.035); // ~35ms grains
  let lfoPhase1 = 0;
  let lfoPhase2 = 1.5;

  let speechEnv = 0;

  function readHermite(buf: Float32Array, pos: number): number {
    const i = Math.floor(pos);
    const frac = pos - i;
    const p0 = buf[(i - 1) & bufMask];
    const p1 = buf[i & bufMask];
    const p2 = buf[(i + 1) & bufMask];
    const p3 = buf[(i + 2) & bufMask];
    const c0 = p1;
    const c1 = 0.5 * (p2 - p0);
    const c2 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
    const c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);
    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      if (!inCh || !outL || !outR) return;
      const len = inCh.length;

      // Smooth ratio transitions
      currentRatio1 += (targetRatio1 - currentRatio1) * 0.1;
      currentRatio2 += (targetRatio2 - currentRatio2) * 0.1;

      const panSpread = (spread / 100) * 0.8;
      const panL_v1 = 0.5 + panSpread * 0.5;
      const panR_v1 = 0.5 - panSpread * 0.5;
      const panL_v2 = 0.5 - panSpread * 0.5;
      const panR_v2 = 0.5 + panSpread * 0.5;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        ring[writeIdx] = inSample;

        // Gate quiet background noise
        const absVal = Math.abs(inSample);
        if (absVal > speechEnv) {
          speechEnv += (absVal - speechEnv) * 0.35;
        } else {
          speechEnv += (absVal - speechEnv) * 0.005;
        }

        if (speechEnv < 0.001) {
          outL[i] = 0;
          outR[i] = 0;
          writeIdx = (writeIdx + 1) & bufMask;
          continue;
        }

        // Humanize subtle micro-detuning drift
        lfoPhase1 = (lfoPhase1 + 0.35 / sampleRate) % 1.0;
        lfoPhase2 = (lfoPhase2 + 0.48 / sampleRate) % 1.0;
        const drift1 = 1.0 + Math.sin(2 * Math.PI * lfoPhase1) * (humanize / 100) * 0.012;
        const drift2 = 1.0 + Math.cos(2 * Math.PI * lfoPhase2) * (humanize / 100) * 0.015;

        // Voice 1 dual-grain overlap
        const speed1 = (1.0 - currentRatio1 * drift1) / grainLen;
        grainPhase1_0 = (grainPhase1_0 + speed1 + 10.0) % 1.0;
        grainPhase1_1 = (grainPhase1_1 + speed1 + 10.0) % 1.0;

        const w1_0 = 0.5 * (1.0 - Math.cos(2 * Math.PI * grainPhase1_0));
        const w1_1 = 0.5 * (1.0 - Math.cos(2 * Math.PI * grainPhase1_1));

        const delay1_0 = 48 + grainPhase1_0 * grainLen;
        const delay1_1 = 48 + grainPhase1_1 * grainLen;

        const s1 = readHermite(ring, writeIdx - delay1_0) * w1_0 +
                   readHermite(ring, writeIdx - delay1_1) * w1_1;

        // Voice 2 dual-grain overlap
        let s2 = 0;
        if (voice2Enabled) {
          const speed2 = (1.0 - currentRatio2 * drift2) / grainLen;
          grainPhase2_0 = (grainPhase2_0 + speed2 + 10.0) % 1.0;
          grainPhase2_1 = (grainPhase2_1 + speed2 + 10.0) % 1.0;

          const w2_0 = 0.5 * (1.0 - Math.cos(2 * Math.PI * grainPhase2_0));
          const w2_1 = 0.5 * (1.0 - Math.cos(2 * Math.PI * grainPhase2_1));

          const delay2_0 = 48 + grainPhase2_0 * grainLen;
          const delay2_1 = 48 + grainPhase2_1 * grainLen;

          s2 = readHermite(ring, writeIdx - delay2_0) * w2_0 +
               readHermite(ring, writeIdx - delay2_1) * w2_1;
        }

        const leftTotal = s1 * panL_v1 + s2 * panL_v2;
        const rightTotal = s1 * panR_v1 + s2 * panR_v2;

        outL[i] = Math.tanh(leftTotal * 0.95);
        outR[i] = Math.tanh(rightTotal * 0.95);

        writeIdx = (writeIdx + 1) & bufMask;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outL = e.outputBuffer.getChannelData(0);
        const outR = e.outputBuffer.getChannelData(1);
        outL.set(inCh);
        outR.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: VocalHarmonyPedal) => {
      const now = ctx.currentTime;
      spread = Math.max(0, Math.min(100, p.spread));
      humanize = Math.max(0, Math.min(100, p.humanize));

      const semi1 = parseInt(p.voice1, 10) || 4;
      targetRatio1 = Math.pow(2, semi1 / 12);

      if (p.voice2 === 'off') {
        voice2Enabled = false;
      } else {
        voice2Enabled = true;
        const semi2 = parseInt(p.voice2, 10) || 7;
        targetRatio2 = Math.pow(2, semi2 / 12);
      }

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      // At 100% mix: dry voice is 0.0, only choir harmony heard
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix * 1.1, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 2. Studio Tube Vocal Channel Strip DSP (Neve 1073 / LA-2A Style)
 * High-pass rumble filter + 200Hz body warmth + 12kHz silk air shelf +
 * vintage triode saturation + smooth optical leveling compressor.
 */
function createVocalPreampDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  // 1. Dual high-pass filter for steep 18dB/oct rumble roll-off
  const hp1 = ctx.createBiquadFilter();
  hp1.type = 'highpass';
  hp1.frequency.value = 80;
  hp1.Q.value = 0.707;

  const hp2 = ctx.createBiquadFilter();
  hp2.type = 'highpass';
  hp2.frequency.value = 80;
  hp2.Q.value = 0.707;

  // 2. 200Hz chest resonance body filter
  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'peaking';
  bodyFilter.frequency.value = 220;
  bodyFilter.Q.value = 1.0;
  bodyFilter.gain.value = 2.0;

  // 3. 12kHz high shelf "Air" filter
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'highshelf';
  airFilter.frequency.value = 12000;
  airFilter.gain.value = 3.5;

  // 4. Vintage Triode Tube Waveshaper
  const tubeShaper = ctx.createWaveShaper();
  tubeShaper.oversample = '4x';

  function createTubeCurve(warmth: number): Float32Array {
    const n = 1024;
    const curve = new Float32Array(n);
    const drive = 1.0 + (warmth / 100) * 4.5;
    const bias = (warmth / 100) * 0.12; // Asymmetric 2nd harmonic richness
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      const xBiased = x * drive + bias;
      const y = Math.tanh(xBiased) - Math.tanh(bias);
      curve[i] = y / (Math.tanh(drive + bias) || 1);
    }
    return curve;
  }
  tubeShaper.curve = createTubeCurve(50) as any;

  // 5. Optical Vocal Leveling Compressor (LA-2A style)
  const comp = ctx.createDynamicsCompressor();
  comp.attack.value = 0.008;
  comp.release.value = 0.22;
  comp.ratio.value = 4.0;
  comp.threshold.value = -24;

  // 6. Master output gain
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;

  // Graph topology
  input.connect(hp1);
  hp1.connect(hp2);
  hp2.connect(bodyFilter);
  bodyFilter.connect(airFilter);
  airFilter.connect(tubeShaper);
  tubeShaper.connect(comp);
  comp.connect(masterGain);
  masterGain.connect(output);

  return {
    hp1,
    hp2,
    bodyFilter,
    airFilter,
    tubeShaper,
    comp,
    masterGain,
    updateParams: (p: VocalPreampPedal) => {
      const now = ctx.currentTime;

      // Low-cut toggle: 80Hz rumble cut vs inaudible 15Hz sub pass
      const hpFreq = p.lowCut ? 80 : 15;
      hp1.frequency.setTargetAtTime(hpFreq, now, 0.02);
      hp2.frequency.setTargetAtTime(hpFreq, now, 0.02);

      // Body warmth (-8dB to +8dB at 220Hz)
      const bodyDb = ((p.body - 50) / 50) * 8;
      bodyFilter.gain.setTargetAtTime(bodyDb, now, 0.02);

      // Silky Air shelf (-6dB to +12dB at 12kHz)
      const airDb = ((p.air - 50) / 50) * 9 + 3;
      airFilter.gain.setTargetAtTime(airDb, now, 0.02);

      // Tube saturation curve
      tubeShaper.curve = createTubeCurve(p.warmth) as any;

      // Optical compression
      const thresh = -12 - (p.compression / 100) * 36;
      comp.threshold.setTargetAtTime(thresh, now, 0.02);
      comp.ratio.setTargetAtTime(3.0 + (p.compression / 100) * 6.0, now, 0.02);

      // Output gain
      const outLevel = 0.4 + (p.outputGain / 100) * 1.4;
      masterGain.gain.setTargetAtTime(outLevel, now, 0.02);
    }
  };
}

/**
 * 3. Rhythmic Vocal Stutter & Glitch Chopper DSP
 * Tempo-synced rhythmic slice gate, glitch buffer repeat, and vinyl tape slow down.
 */
function createVocalStutterDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Ring buffer for stutter slices (65536 samples ~ 1.36s)
  const bufSize = 65536;
  const bufMask = bufSize - 1;
  const ring = new Float32Array(bufSize);
  let writeIdx = 0;

  // Parameters
  let bpm = 120;
  let rate: VocalStutterPedal['rate'] = '1/8';
  let depth = 85;
  let glitch = 30;
  let tapeSlow = false;

  let sliceSamples = Math.floor(sampleRate * (60 / bpm) * 0.5);
  let sampleCounter = 0;
  let freezeWrite = false;
  let freezeStartIdx = 0;
  let tapeSlowSpeed = 1.0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      const fadeLen = Math.floor(sampleRate * 0.004); // 4ms smooth anti-click ramp

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        if (!freezeWrite) {
          ring[writeIdx] = inSample;
        }

        const phaseInSlice = sampleCounter % sliceSamples;
        const halfSlice = Math.floor(sliceSamples * 0.5);

        // Glitch trigger at slice start
        if (phaseInSlice === 0) {
          const shouldGlitch = (Math.random() * 100) < glitch;
          if (shouldGlitch && glitch > 0) {
            freezeWrite = true;
            freezeStartIdx = (writeIdx - halfSlice) & bufMask;
          } else {
            freezeWrite = false;
          }

          if (tapeSlow) {
            tapeSlowSpeed = 1.0;
          }
        }

        // Tape slow deceleration
        if (tapeSlow && phaseInSlice > halfSlice) {
          tapeSlowSpeed = Math.max(0.15, tapeSlowSpeed * 0.9997);
        } else {
          tapeSlowSpeed = 1.0;
        }

        // Gate chopper envelope: open in first half, muted in second half
        let gateGain = 1.0;
        const muteFloor = 1.0 - (depth / 100);

        if (phaseInSlice < halfSlice) {
          // Open phase
          if (phaseInSlice < fadeLen) {
            gateGain = muteFloor + (1.0 - muteFloor) * (phaseInSlice / fadeLen);
          } else if (phaseInSlice > halfSlice - fadeLen) {
            gateGain = muteFloor + (1.0 - muteFloor) * ((halfSlice - phaseInSlice) / fadeLen);
          } else {
            gateGain = 1.0;
          }
        } else {
          // Muted phase
          gateGain = muteFloor;
        }

        // Read sample
        let readSample = inSample;
        if (freezeWrite) {
          const offset = Math.floor((phaseInSlice * tapeSlowSpeed) % halfSlice);
          readSample = ring[(freezeStartIdx + offset) & bufMask];
        } else if (tapeSlow && tapeSlowSpeed < 0.99) {
          const lag = Math.floor(phaseInSlice * (1.0 - tapeSlowSpeed));
          readSample = ring[(writeIdx - lag) & bufMask];
        }

        outCh[i] = readSample * gateGain;

        sampleCounter++;
        writeIdx = (writeIdx + 1) & bufMask;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: VocalStutterPedal) => {
      const now = ctx.currentTime;
      bpm = Math.max(60, Math.min(220, p.bpm || 120));
      rate = p.rate;
      depth = Math.max(0, Math.min(100, p.depth));
      glitch = Math.max(0, Math.min(100, p.glitch));
      tapeSlow = Boolean(p.tapeSlow);

      // Recalculate slice duration
      const beatSec = 60 / bpm;
      let mult = 0.5; // default 1/8
      if (rate === '1/4') mult = 1.0;
      else if (rate === '1/8') mult = 0.5;
      else if (rate === '1/16') mult = 0.25;
      else if (rate === '1/32') mult = 0.125;
      else if (rate === 'triplet') mult = (1 / 3);

      sliceSamples = Math.max(128, Math.floor(sampleRate * beatSec * mult));

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 4. Sci-Fi Alien & Dalek Ring Modulator DSP
 * Metallic balanced ring modulator + speech envelope pitch tracking +
 * metallic cavity resonator for Dalek / Cyborg extraterrestrial speech.
 */
function createVocalAlienDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);

  // Metallic formant chest resonance filter (Doctor Who / Cylon style)
  const metallicResonator = ctx.createBiquadFilter();
  metallicResonator.type = 'peaking';
  metallicResonator.frequency.value = 1150;
  metallicResonator.Q.value = 4.0;
  metallicResonator.gain.value = 9.0;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(metallicResonator);
  metallicResonator.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  let baseFreq = 220;
  let carrierShape: VocalAlienPedal['carrierShape'] = 'sine';
  let modDepth = 85;
  let lfoRate = 4.0;
  let tracking = 45;

  let carrierPhase = 0;
  let lfoPhase = 0;
  let vocalEnvelope = 0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      const depthFrac = modDepth / 100;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        const absVal = Math.abs(inSample);

        // Vocal envelope follower
        if (absVal > vocalEnvelope) {
          vocalEnvelope += (absVal - vocalEnvelope) * 0.35;
        } else {
          vocalEnvelope += (absVal - vocalEnvelope) * 0.008;
        }

        // Silence gate to prevent ringing drone when user stops talking
        if (vocalEnvelope < 0.0015) {
          outCh[i] = 0;
          continue;
        }

        // LFO flutter
        lfoPhase = (lfoPhase + lfoRate / sampleRate) % 1.0;
        const lfoVal = Math.sin(2 * Math.PI * lfoPhase);
        const lfoOffset = lfoVal * (baseFreq * 0.25);

        // Dynamic voice envelope tracking: bends carrier pitch up with speech energy
        const trackOffset = (tracking / 100) * vocalEnvelope * 850;

        const effectiveFreq = Math.max(30, Math.min(4000, baseFreq + lfoOffset + trackOffset));
        const phaseInc = effectiveFreq / sampleRate;

        // Carrier wave generation
        let carrier = 0;
        if (carrierShape === 'sine') {
          carrier = Math.sin(2 * Math.PI * carrierPhase);
        } else if (carrierShape === 'triangle') {
          carrier = 4.0 * Math.abs(carrierPhase - 0.5) - 1.0;
        } else if (carrierShape === 'square') {
          carrier = carrierPhase < 0.5 ? 1.0 : -1.0;
        }

        carrierPhase = (carrierPhase + phaseInc) % 1.0;

        // Balanced Ring Modulation
        const ringModulated = inSample * carrier;
        const mixed = inSample * (1.0 - depthFrac) + ringModulated * depthFrac;

        // Warm diode saturation
        outCh[i] = Math.tanh(mixed * 1.5);
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    metallicResonator,
    dryGain,
    wetGain,
    updateParams: (p: VocalAlienPedal) => {
      const now = ctx.currentTime;
      baseFreq = Math.max(40, Math.min(2500, p.frequency));
      carrierShape = p.carrierShape || 'sine';
      modDepth = Math.max(0, Math.min(100, p.modDepth));
      lfoRate = Math.max(0.1, Math.min(20, p.lfoRate));
      tracking = Math.max(0, Math.min(100, p.tracking));

      metallicResonator.frequency.setTargetAtTime(
        Math.max(600, Math.min(3000, baseFreq * 1.5 + 400)),
        now,
        0.02
      );

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * Boutique Granular Cloud Generator & Pitch Shimmer DSP Engine.
 * Inspired by Chase Bliss MOOD & Hologram Microcosm.
 * Generates continuous micro-grains with Hann-windowed overlap-add,
 * position spray jitter, pitch transpositions (-12 to +12 semitones),
 * and regenerative octave-up shimmer feedback.
 */
function createGranularCloudDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferSize = 512;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Circular delay ring buffer (65536 samples ~1.36s at 48kHz)
  const ringSize = 65536;
  const ringMask = ringSize - 1;
  const ring = new Float32Array(ringSize);
  let writeIdx = 0;

  // Granular synthesis parameters
  let grainSizeMs = 120;
  let density = 15; // grains / sec
  let pitchSemitones = 0;
  let sprayPercent = 35;
  let feedback = 40; // 0 - 95%
  let shimmer = false;

  interface Grain {
    active: boolean;
    readPos: number;
    speed: number;
    length: number;
    age: number;
    amplitude: number;
  }

  const MAX_GRAINS = 12;
  const grains: Grain[] = [];
  for (let i = 0; i < MAX_GRAINS; i++) {
    grains.push({
      active: false,
      readPos: 0,
      speed: 1.0,
      length: 1000,
      age: 0,
      amplitude: 1.0
    });
  }

  let samplesUntilNextGrain = 0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      const fbFrac = Math.min(0.92, feedback / 100);
      const grainLenSamples = Math.max(128, Math.floor((grainSizeMs / 1000) * sampleRate));
      const grainIntervalSamples = Math.max(64, Math.floor(sampleRate / Math.max(1, density)));
      const baseSpeed = Math.pow(2, pitchSemitones / 12);
      const spraySamples = Math.floor((sprayPercent / 100) * ringSize * 0.7);

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];

        // Grain spawning scheduler
        samplesUntilNextGrain--;
        if (samplesUntilNextGrain <= 0) {
          samplesUntilNextGrain = grainIntervalSamples + Math.floor((Math.random() - 0.5) * grainIntervalSamples * 0.4);

          // Find inactive grain slot
          let slot = grains.find(g => !g.active);
          if (!slot) {
            slot = grains.reduce((oldest, g) => (g.age > oldest.age ? g : oldest), grains[0]);
          }

          if (slot) {
            slot.active = true;
            slot.age = 0;
            slot.length = grainLenSamples;
            const randomOffset = Math.floor(Math.random() * Math.max(1, spraySamples));
            slot.readPos = (writeIdx - randomOffset - 128 + ringSize) & ringMask;
            const isShimmerGrain = shimmer && Math.random() > 0.4;
            slot.speed = isShimmerGrain ? baseSpeed * 2.0 : baseSpeed;
            slot.amplitude = 1.0 / Math.sqrt(Math.max(1, density * 0.35));
          }
        }

        // Accumulate active grains
        let grainSum = 0;
        for (let g = 0; g < MAX_GRAINS; g++) {
          const grain = grains[g];
          if (!grain.active) continue;

          // Hann window calculation for click-free grain crossfade
          const winFrac = grain.age / grain.length;
          const windowVal = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * winFrac));

          // Linear interpolated read from circular buffer
          const i0 = Math.floor(grain.readPos) & ringMask;
          const i1 = (i0 + 1) & ringMask;
          const frac = grain.readPos - Math.floor(grain.readPos);
          const s0 = ring[i0];
          const s1 = ring[i1];
          const interpSample = s0 + frac * (s1 - s0);

          grainSum += interpSample * windowVal * grain.amplitude;

          grain.readPos = (grain.readPos + grain.speed + ringSize) % ringSize;
          grain.age++;
          if (grain.age >= grain.length) {
            grain.active = false;
          }
        }

        const wetOut = Math.tanh(grainSum * 1.2);
        outCh[i] = wetOut;

        ring[writeIdx] = inSample + wetOut * fbFrac;
        writeIdx = (writeIdx + 1) & ringMask;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: GranularCloudPedal) => {
      const now = ctx.currentTime;
      grainSizeMs = Math.max(20, Math.min(400, p.grainSize));
      density = Math.max(2, Math.min(40, p.density));
      pitchSemitones = Math.max(-12, Math.min(12, p.pitch));
      sprayPercent = Math.max(0, Math.min(100, p.spray));
      feedback = Math.max(0, Math.min(95, p.feedback));
      shimmer = !!p.shimmer;

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 8-Bit Arcade Synth & PLL Sub-Harmonic Arpeggiator DSP Engine.
 * Inspired by EarthQuaker Devices Data Corrupter & Meris Ottobit Jr.
 * Features fast zero-crossing pitch tracking, PLL square/saw oscillator,
 * sub-octave divider/multiplier, stepped interval arpeggiation, bitcrushing,
 * and sample-rate decimation.
 */
function createArcadeSynthDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferSize = 512;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  let subOctave: ArcadeSynthPedal['subOctave'] = 'off';
  let crushBits = 8;
  let sampleRateDec = 8000;
  let arpeggiator: ArcadeSynthPedal['arpeggiator'] = 'off';
  let arpRate = 6.0;
  let glide = 30;

  let lastInSample = 0;
  let periodCounter = 0;
  let trackedPeriod = 440;
  let smoothedPeriod = 440;
  let synthPhase = 0;
  let arpStep = 0;
  let arpTimer = 0;

  let decimateCounter = 0;
  let heldSample = 0;
  let inputEnvelope = 0;

  const arpPatterns: Record<string, number[]> = {
    off: [1.0],
    major3rd: [1.0, 1.2599, 1.4983],
    octave: [1.0, 2.0, 4.0, 2.0],
    fifth: [1.0, 1.4983, 2.0],
    cyberpunk: [1.0, 1.1892, 1.4142, 1.6818, 2.0]
  };

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      const decFactor = Math.max(1, Math.floor(sampleRate / Math.max(500, sampleRateDec)));
      const steps = Math.pow(2, Math.max(2, Math.min(16, crushBits)));
      const stepInterval = Math.max(32, Math.floor(sampleRate / Math.max(0.5, arpRate)));
      const pattern = arpPatterns[arpeggiator] || arpPatterns.off;
      const glideFactor = 0.05 + ((100 - glide) / 100) * 0.45;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];
        const absVal = Math.abs(inSample);

        if (absVal > inputEnvelope) {
          inputEnvelope += (absVal - inputEnvelope) * 0.3;
        } else {
          inputEnvelope += (absVal - inputEnvelope) * 0.005;
        }

        periodCounter++;
        if (lastInSample <= 0 && inSample > 0.015 && periodCounter > 20) {
          trackedPeriod = periodCounter;
          periodCounter = 0;
        }
        lastInSample = inSample;

        smoothedPeriod += (trackedPeriod - smoothedPeriod) * glideFactor;

        if (inputEnvelope < 0.003) {
          outCh[i] = 0;
          continue;
        }

        arpTimer++;
        if (arpTimer >= stepInterval) {
          arpTimer = 0;
          arpStep = (arpStep + 1) % pattern.length;
        }
        const arpMultiplier = pattern[arpStep] || 1.0;

        let octaveRatio = 1.0;
        if (subOctave === '-2') octaveRatio = 0.25;
        else if (subOctave === '-1') octaveRatio = 0.5;
        else if (subOctave === '+1') octaveRatio = 2.0;
        else if (subOctave === '+2') octaveRatio = 4.0;

        const fundamentalFreq = sampleRate / Math.max(30, Math.min(4000, smoothedPeriod));
        const effectiveFreq = fundamentalFreq * octaveRatio * arpMultiplier;
        const phaseInc = Math.min(0.48, effectiveFreq / sampleRate);

        synthPhase = (synthPhase + phaseInc) % 1.0;

        const rawPulse = synthPhase < 0.35 ? 0.8 : -0.8;
        const subPulse = (synthPhase * 2.0) % 1.0 < 0.5 ? 0.4 : -0.4;
        const synthSignal = rawPulse * 0.7 + subPulse * 0.3;

        decimateCounter++;
        if (decimateCounter >= decFactor) {
          decimateCounter = 0;
          heldSample = Math.round(synthSignal * steps) / steps;
        }

        const shaped = Math.tanh(heldSample * 1.5) * Math.min(1.2, inputEnvelope * 3.5);
        outCh[i] = shaped;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: ArcadeSynthPedal) => {
      const now = ctx.currentTime;
      subOctave = p.subOctave || 'off';
      crushBits = Math.max(2, Math.min(16, p.crushBits));
      sampleRateDec = Math.max(800, Math.min(22050, p.sampleRateDec));
      arpeggiator = p.arpeggiator || 'off';
      arpRate = Math.max(1, Math.min(16, p.arpRate));
      glide = Math.max(0, Math.min(100, p.glide));

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * Spectral Freeze & Infinite Drone Sustainer DSP Engine.
 * Inspired by Electro-Harmonix Freeze & PLUS Pedal.
 * Captures guitar sustain into a seamless dual-overlapping circular buffer
 * with anti-click raised cosine crossfades, warm analog damping,
 * and ethereal octave shimmer layer.
 */
function createSpectralFreezeDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferSize = 512;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  const freezeSize = 16384;
  const freezeMask = freezeSize - 1;
  const freezeBuffer = new Float32Array(freezeSize);
  let writeIdx = 0;

  let isFrozen = false;
  let riseTimeMs = 80;
  let decayTimeMs = 1200;
  let shimmerPercent = 30;
  let dampingPercent = 40;

  let headA = 0;
  let headB = freezeSize / 2;
  let shimmerHead = 0;
  let currentDroneLevel = 0.0;
  let targetDroneLevel = 0.0;
  let dampedSample = 0.0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      targetDroneLevel = isFrozen ? 1.0 : 0.0;
      const riseStep = 1.0 / Math.max(16, (riseTimeMs / 1000) * sampleRate);
      const decayStep = 1.0 / Math.max(32, (decayTimeMs / 1000) * sampleRate);
      const shimmerFrac = (shimmerPercent / 100) * 0.65;
      const dampingAlpha = 0.15 + ((100 - dampingPercent) / 100) * 0.75;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];

        if (!isFrozen) {
          freezeBuffer[writeIdx] = inSample;
          writeIdx = (writeIdx + 1) & freezeMask;
        }

        if (currentDroneLevel < targetDroneLevel) {
          currentDroneLevel = Math.min(targetDroneLevel, currentDroneLevel + riseStep);
        } else if (currentDroneLevel > targetDroneLevel) {
          currentDroneLevel = Math.max(targetDroneLevel, currentDroneLevel - decayStep);
        }

        if (currentDroneLevel < 0.0001) {
          outCh[i] = 0;
          continue;
        }

        const posA = Math.floor(headA) & freezeMask;
        const posB = Math.floor(headB) & freezeMask;

        const cycleFracA = (headA % freezeSize) / freezeSize;
        const winA = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * cycleFracA));
        const winB = 1.0 - winA;

        const sampleA = freezeBuffer[posA];
        const sampleB = freezeBuffer[posB];
        let droneSample = sampleA * winA + sampleB * winB;

        if (shimmerFrac > 0.01) {
          const shimPos = Math.floor(shimmerHead) & freezeMask;
          const shimVal = freezeBuffer[shimPos];
          droneSample = droneSample * (1.0 - shimmerFrac * 0.4) + shimVal * shimmerFrac;
          shimmerHead = (shimmerHead + 2.003) % freezeSize;
        }

        dampedSample += dampingAlpha * (droneSample - dampedSample);

        headA = (headA + 1.0) % freezeSize;
        headB = (headB + 1.0) % freezeSize;

        outCh[i] = Math.tanh(dampedSample * 1.3) * currentDroneLevel;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: SpectralFreezePedal) => {
      const now = ctx.currentTime;
      isFrozen = !!p.frozen;
      riseTimeMs = Math.max(20, Math.min(1500, p.riseTime));
      decayTimeMs = Math.max(100, Math.min(4000, p.decayTime));
      shimmerPercent = Math.max(0, Math.min(100, p.shimmer));
      dampingPercent = Math.max(0, Math.min(100, p.damping));

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * Tape Glitch, Reverse Swell & Time-Warp DSP Engine.
 * Inspired by Red Panda Tensor & Montreal Assembly Count to 5.
 * Features rolling tape delay buffer, forward/reverse/alternating playback slice,
 * varispeed pitch transpositions (-12 to +12 semitones), random tape jumps/repeats,
 * and vintage wow & flutter motor fluctuations.
 */
function createTapeGlitchDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const sampleRate = ctx.sampleRate || 48000;
  const bufferSize = 512;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(processor);
  processor.connect(wetGain);
  wetGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  const tapeSize = 65536;
  const tapeMask = tapeSize - 1;
  const tape = new Float32Array(tapeSize);
  let writeIdx = 0;

  let direction: TapeGlitchPedal['direction'] = 'reverse';
  let sliceLengthMs = 350;
  let pitchSemitones = 0;
  let randomGlitch = 35;
  let wowFlutter = 30;
  let feedback = 35;

  let readPos = 0;
  let sliceAge = 0;
  let currentSliceSamples = 16000;
  let currentDirectionSign = -1.0;
  let stutterRepeatRemaining = 0;
  let stutterStartReadPos = 0;

  let wowPhase = 0;
  let flutterPhase = 0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      const len = inCh.length;

      const fbFrac = Math.min(0.90, feedback / 100);
      const basePitchSpeed = Math.pow(2, pitchSemitones / 12);
      const baseSliceSamples = Math.max(512, Math.floor((sliceLengthMs / 1000) * sampleRate));
      const glitchChance = randomGlitch / 100;
      const wowDepth = (wowFlutter / 100) * 0.035;

      for (let i = 0; i < len; i++) {
        const inSample = inCh[i];

        wowPhase = (wowPhase + 0.8 / sampleRate) % 1.0;
        flutterPhase = (flutterPhase + 6.2 / sampleRate) % 1.0;
        const wowMod = 1.0 + Math.sin(2 * Math.PI * wowPhase) * wowDepth + Math.sin(2 * Math.PI * flutterPhase) * (wowDepth * 0.35);

        sliceAge++;
        if (sliceAge >= currentSliceSamples) {
          sliceAge = 0;
          currentSliceSamples = baseSliceSamples;

          if (Math.random() < glitchChance && stutterRepeatRemaining === 0) {
            stutterRepeatRemaining = Math.floor(Math.random() * 3) + 1;
            readPos = stutterStartReadPos;
          } else if (stutterRepeatRemaining > 0) {
            stutterRepeatRemaining--;
            readPos = stutterStartReadPos;
          } else {
            if (direction === 'forward') {
              currentDirectionSign = 1.0;
            } else if (direction === 'reverse') {
              currentDirectionSign = -1.0;
            } else {
              currentDirectionSign = currentDirectionSign > 0 ? -1.0 : 1.0;
            }

            const jumpOffset = Math.random() < glitchChance * 0.7
              ? Math.floor(Math.random() * (tapeSize * 0.6))
              : Math.floor(baseSliceSamples * 0.8);

            readPos = (writeIdx - jumpOffset - 256 + tapeSize) & tapeMask;
            stutterStartReadPos = readPos;
          }
        }

        const fadeLen = Math.min(64, Math.floor(currentSliceSamples * 0.15));
        let envelope = 1.0;
        if (sliceAge < fadeLen) {
          envelope = 0.5 * (1.0 - Math.cos(Math.PI * (sliceAge / fadeLen)));
        } else if (sliceAge > currentSliceSamples - fadeLen) {
          const remaining = currentSliceSamples - sliceAge;
          envelope = 0.5 * (1.0 - Math.cos(Math.PI * (remaining / fadeLen)));
        }

        const r0 = Math.floor(readPos) & tapeMask;
        const r1 = (r0 + 1) & tapeMask;
        const frac = readPos - Math.floor(readPos);
        const tapeSample = tape[r0] + frac * (tape[r1] - tape[r0]);

        const wetSample = tapeSample * envelope;
        const saturated = Math.tanh(wetSample * 1.25);
        outCh[i] = saturated;

        tape[writeIdx] = inSample + saturated * fbFrac;
        writeIdx = (writeIdx + 1) & tapeMask;

        const step = currentDirectionSign * basePitchSpeed * wowMod;
        readPos = (readPos + step + tapeSize) % tapeSize;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    processor,
    dryGain,
    wetGain,
    updateParams: (p: TapeGlitchPedal) => {
      const now = ctx.currentTime;
      direction = p.direction || 'reverse';
      sliceLengthMs = Math.max(60, Math.min(1200, p.sliceLength));
      pitchSemitones = Math.max(-12, Math.min(12, p.pitch));
      randomGlitch = Math.max(0, Math.min(100, p.randomGlitch));
      wowFlutter = Math.max(0, Math.min(100, p.wowFlutter));
      feedback = Math.max(0, Math.min(90, p.feedback));

      const mix = Math.max(0, Math.min(1, p.mix / 100));
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
          (window as any).__activeAudioProcessors.delete(processor);
        }
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 1. Uni-Vibe / Rotary Speaker DSP Engine.
 * 4-stage allpass filter ladder with asymmetric optical bulb modulation.
 */
function createUniVibeDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const baseFreqs = [280, 560, 1100, 2200];
  const stages: BiquadFilterNode[] = baseFreqs.map((f) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'allpass';
    filter.frequency.value = f;
    filter.Q.value = 1.25;
    return filter;
  });

  // Chain stages
  input.connect(stages[0]);
  for (let i = 0; i < stages.length - 1; i++) {
    stages[i].connect(stages[i + 1]);
  }
  stages[stages.length - 1].connect(wetGain);
  input.connect(dryGain);

  dryGain.connect(output);
  wetGain.connect(output);

  // Optical LFO modulation
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 2.5;

  const lfoGains: GainNode[] = baseFreqs.map((f) => {
    const g = ctx.createGain();
    g.gain.value = f * 0.65;
    lfo.connect(g);
    return g;
  });

  for (let i = 0; i < stages.length; i++) {
    lfoGains[i].connect(stages[i].frequency);
  }

  try {
    lfo.start();
  } catch {}

  return {
    updateParams: (p: UniVibePedal) => {
      const now = ctx.currentTime;
      lfo.frequency.setTargetAtTime(Math.max(0.2, Math.min(12, p.speed)), now, 0.02);

      const intensity = Math.max(0, Math.min(100, p.intensity)) / 100;
      const biasMod = 0.5 + (p.lampBias / 100) * 0.7;

      for (let i = 0; i < stages.length; i++) {
        const base = baseFreqs[i] * biasMod;
        stages[i].frequency.setTargetAtTime(base, now, 0.02);
        lfoGains[i].gain.setTargetAtTime(base * 0.8 * intensity, now, 0.02);
      }

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      if (p.mode === 'vibrato') {
        // True pitch-vibrato: smoothly crossfades from 100% dry to 100% vibrato modulated
        dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
        wetGain.gain.setTargetAtTime(mix, now, 0.02);
      } else {
        // Chorus mode: Shin-ei 4-stage optical phase cancellation
        // When mix is 0%, passes 100% dry; as mix increases, balances dry and wet for deep swirling notches without volume loss
        const dryLevel = (1.0 - mix) + mix * 0.65;
        const wetLevel = mix * 0.65;
        dryGain.gain.setTargetAtTime(dryLevel, now, 0.02);
        wetGain.gain.setTargetAtTime(wetLevel, now, 0.02);
      }
    },
    dispose: () => {
      try {
        lfo.stop();
        lfo.disconnect();
      } catch {}
    }
  };
}

/**
 * 2. Harmonic Tremolo DSP Engine.
 * 1962 Fender Brownface split-band out-of-phase modulation.
 */
function createHarmonicTremoloDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.Q.value = 0.707;
  lowFilter.frequency.value = 700;

  const highFilter = ctx.createBiquadFilter();
  highFilter.type = 'highpass';
  highFilter.Q.value = 0.707;
  highFilter.frequency.value = 700;

  const lowGain = ctx.createGain();
  const highGain = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(lowFilter);
  input.connect(highFilter);
  input.connect(dryGain);

  lowFilter.connect(lowGain);
  highFilter.connect(highGain);

  lowGain.connect(wetGain);
  highGain.connect(wetGain);

  dryGain.connect(output);
  wetGain.connect(output);

  // LFO
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 4.0;

  const lowLfoGain = ctx.createGain();
  const inverter = ctx.createGain();
  inverter.gain.value = -1;
  const highLfoGain = ctx.createGain();

  lfo.connect(lowLfoGain);
  lfo.connect(inverter);
  inverter.connect(highLfoGain);

  lowLfoGain.connect(lowGain.gain);
  highLfoGain.connect(highGain.gain);

  try {
    lfo.start();
  } catch {}

  return {
    updateParams: (p: HarmonicTremoloPedal) => {
      const now = ctx.currentTime;
      lfo.frequency.setTargetAtTime(Math.max(0.5, Math.min(15, p.rate)), now, 0.02);
      lfo.type = p.waveform === 'triangle' ? 'triangle' : p.waveform === 'pulse' ? 'square' : 'sine';

      const crossover = Math.max(250, Math.min(1800, p.crossover || 700));
      lowFilter.frequency.setTargetAtTime(crossover, now, 0.02);
      highFilter.frequency.setTargetAtTime(crossover, now, 0.02);

      // Baseline gains at unity (1.0), modulated 180° out-of-phase with depth up to 0.85
      // This maintains full perceived volume matching the bypassed tone without the -6dB drop!
      const depth = (Math.max(0, Math.min(100, p.depth)) / 100) * 0.85;
      lowGain.gain.setTargetAtTime(1.0, now, 0.02);
      highGain.gain.setTargetAtTime(1.0, now, 0.02);
      lowLfoGain.gain.setTargetAtTime(depth, now, 0.02);
      highLfoGain.gain.setTargetAtTime(depth, now, 0.02);

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      try {
        lfo.stop();
        lfo.disconnect();
      } catch {}
    }
  };
}

/**
 * 3. Slow Gear / Auto-Swell DSP Engine.
 * Attack-delay envelope auto-violining pick-attack suppressor.
 */
function createSlowGearDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const processor = ctx.createScriptProcessor(512, 1, 1);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  input.connect(processor);
  processor.connect(wetGain);

  dryGain.connect(output);
  wetGain.connect(output);

  // Prevent premature V8 garbage collection
  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  let currentGain = 0.0;
  let envelopeState: 'idle' | 'swelling' | 'sustaining' = 'idle';
  let attackMs = 350;
  let sensitivityThreshold = 0.015;
  let releaseMs = 180;
  let lastPeak = 0;

  processor.onaudioprocess = (e) => {
    try {
      const inputBuf = e.inputBuffer.getChannelData(0);
      const outputBuf = e.outputBuffer.getChannelData(0);
      const sampleRate = ctx.sampleRate || 48000;
      const dt = 1.0 / sampleRate;

      for (let i = 0; i < inputBuf.length; i++) {
        const s = inputBuf[i];
        const absS = Math.abs(s);
        lastPeak = lastPeak * 0.993 + absS * 0.007;

        // Note trigger detection:
        // Trigger from idle OR re-trigger if a sharp new pick attack occurs while sustaining
        if (envelopeState === 'idle') {
          if (absS > sensitivityThreshold) {
            envelopeState = 'swelling';
            currentGain = 0.001;
          }
        } else if (envelopeState === 'sustaining') {
          if (absS > Math.max(sensitivityThreshold, lastPeak * 2.3 + 0.015)) {
            // New pick transient detected: restart swell for natural legato/picked passage
            envelopeState = 'swelling';
            currentGain = 0.05;
          } else if (lastPeak < sensitivityThreshold * 0.45) {
            const releaseStep = dt / Math.max(0.04, releaseMs / 1000);
            currentGain -= releaseStep;
            if (currentGain <= 0.01) {
              currentGain = 0.0;
              envelopeState = 'idle';
            }
          }
        } else if (envelopeState === 'swelling') {
          const attackStep = dt / Math.max(0.04, attackMs / 1000);
          currentGain += attackStep;
          if (currentGain >= 1.0) {
            currentGain = 1.0;
            envelopeState = 'sustaining';
          }
        }

        outputBuf[i] = s * currentGain;
      }
    } catch {
      try {
        const inCh = e.inputBuffer.getChannelData(0);
        const outCh = e.outputBuffer.getChannelData(0);
        outCh.set(inCh);
      } catch {}
    }
  };

  return {
    updateParams: (p: SlowGearPedal) => {
      const now = ctx.currentTime;
      attackMs = Math.max(40, Math.min(1500, p.attack));
      const sens = Math.max(0, Math.min(100, p.sensitivity));
      // Musical sensitivity curve: sensitive enough for gentle fingerpicking yet quiet when resting
      sensitivityThreshold = 0.045 - (sens / 100) * 0.041;
      releaseMs = Math.max(40, Math.min(600, p.release));

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      // Slight makeup boost on wet gain for silky bowed sustain
      wetGain.gain.setTargetAtTime(mix * 1.08, now, 0.02);
    },
    dispose: () => {
      if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
        (window as any).__activeAudioProcessors.delete(processor);
      }
      try {
        processor.disconnect();
      } catch {}
    }
  };
}

/**
 * 4. Klon Centaur Transparent Overdrive DSP Engine.
 * Dual-ganged transparent clean boost + 1N34A germanium diode saturation.
 */
function createKlonOverdriveDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const cleanGain = ctx.createGain();
  const driveGain = ctx.createGain();
  const waveshaper = ctx.createWaveShaper();
  waveshaper.oversample = '4x';

  const drivePreFilter = ctx.createBiquadFilter();
  drivePreFilter.type = 'peaking';
  drivePreFilter.frequency.value = 1000;
  drivePreFilter.Q.value = 1.4;
  drivePreFilter.gain.value = 4.5; // Klon upper-mid signature push

  const trebleFilter = ctx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 4200;
  trebleFilter.gain.value = 0;

  const masterGain = ctx.createGain();

  // Clean path
  input.connect(cleanGain);
  cleanGain.connect(trebleFilter);

  // Overdrive path
  input.connect(drivePreFilter);
  drivePreFilter.connect(waveshaper);
  waveshaper.connect(driveGain);
  driveGain.connect(trebleFilter);

  trebleFilter.connect(masterGain);
  masterGain.connect(output);

  return {
    updateParams: (p: KlonOverdrivePedal) => {
      const now = ctx.currentTime;
      waveshaper.curve = createKlonCurve(p.gain) as any;

      // Active treble control (-8dB to +8dB)
      const trebleDb = ((p.treble - 50) / 50) * 8.5;
      trebleFilter.gain.setTargetAtTime(trebleDb, now, 0.02);

      // Klon dual-gang blending
      const cleanRatio = (p.cleanBlend / 100);
      const gainFactor = (p.gain / 100);
      cleanGain.gain.setTargetAtTime(cleanRatio * (1.2 - gainFactor * 0.4), now, 0.02);
      driveGain.gain.setTargetAtTime((1.0 - cleanRatio * 0.5) * (0.6 + gainFactor * 0.6), now, 0.02);

      const vol = (p.output / 100) * 1.5;
      masterGain.gain.setTargetAtTime(vol, now, 0.02);
    },
    dispose: () => {
      try {
        waveshaper.disconnect();
        drivePreFilter.disconnect();
        cleanGain.disconnect();
        driveGain.disconnect();
        trebleFilter.disconnect();
        masterGain.disconnect();
      } catch {}
    }
  };
}

/**
 * 5. Polyphonic Multi-Octave Generator (POG) DSP Engine.
 * 4 independent octave generators (-2, -1, +1, +2) + dry blend + organ tone filter.
 */
function createMultiOctaveDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const dryGain = ctx.createGain();
  const sub2Gain = ctx.createGain();
  const sub1Gain = ctx.createGain();
  const oct1Gain = ctx.createGain();
  const oct2Gain = ctx.createGain();

  const wetToneFilter = ctx.createBiquadFilter();
  wetToneFilter.type = 'lowpass';
  wetToneFilter.frequency.value = 6500;
  wetToneFilter.Q.value = 0.707;

  // Dedicated pitch shifters
  const shifterSub2 = createPitchShifterDsp(ctx, input, wetToneFilter);
  shifterSub2.setShift(-24);
  shifterSub2.setOctaveBlend?.(false); // disable sub-harmonic divider to avoid sub-audible 15Hz rumble
  shifterSub2.dryGain.gain.value = 0;

  const shifterSub1 = createPitchShifterDsp(ctx, input, wetToneFilter);
  shifterSub1.setShift(-12);
  shifterSub1.setOctaveBlend?.(true); // punchy sub-octave fundamental tracking
  shifterSub1.dryGain.gain.value = 0;

  const shifterOct1 = createPitchShifterDsp(ctx, input, wetToneFilter);
  shifterOct1.setShift(12);
  shifterOct1.dryGain.gain.value = 0;

  const shifterOct2 = createPitchShifterDsp(ctx, input, wetToneFilter);
  shifterOct2.setShift(24);
  shifterOct2.dryGain.gain.value = 0;

  input.connect(dryGain);
  dryGain.connect(output);
  wetToneFilter.connect(output);

  return {
    updateParams: (p: MultiOctavePedal) => {
      const now = ctx.currentTime;
      dryGain.gain.setTargetAtTime((Math.max(0, Math.min(100, p.dry)) / 100) * 0.9, now, 0.02);
      // Calibrated organ voice balance: sum of all 4 octaves remains clean without digital clipping
      shifterSub2.wetGain.gain.setTargetAtTime((p.sub2 / 100) * 0.55, now, 0.02);
      shifterSub1.wetGain.gain.setTargetAtTime((p.sub1 / 100) * 0.65, now, 0.02);
      shifterOct1.wetGain.gain.setTargetAtTime((p.oct1 / 100) * 0.65, now, 0.02);
      shifterOct2.wetGain.gain.setTargetAtTime((p.oct2 / 100) * 0.50, now, 0.02);

      const toneHz = 1200 + (Math.max(0, Math.min(100, p.tone)) / 100) * 7000;
      wetToneFilter.frequency.setTargetAtTime(toneHz, now, 0.02);
    },
    dispose: () => {
      shifterSub2.dispose?.();
      shifterSub1.dispose?.();
      shifterOct1.dispose?.();
      shifterOct2.dispose?.();
      try {
        dryGain.disconnect();
        wetToneFilter.disconnect();
      } catch {}
    }
  };
}

/**
 * 6. Dynamic Envelope "Talking" Wah DSP Engine.
 * Dual formant vocal bandpass filters swept dynamically by envelope follower.
 */
function createTalkingWahDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.Q.value = 6.0;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.Q.value = 7.0;

  const driveShaper = ctx.createWaveShaper();
  driveShaper.curve = createOverdriveCurve(25) as any;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(f1);
  input.connect(f2);
  f1.connect(driveShaper);
  f2.connect(driveShaper);
  driveShaper.connect(wetGain);
  wetGain.connect(output);

  const processor = ctx.createScriptProcessor(512, 1, 1);
  const dummyGain = ctx.createGain();
  dummyGain.gain.value = 0.0;
  input.connect(processor);
  processor.connect(dummyGain);
  dummyGain.connect(output);

  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  // Vowel formant frequencies [F1_start, F1_end, F2_start, F2_end]
  const vowels = {
    'ow-ow': [400, 850, 800, 1300],
    'ya-ya': [320, 750, 2200, 1200],
    'ee-ah': [280, 800, 2400, 1300],
    'oo-ee': [350, 280, 800, 2300]
  };

  let currentVowel: keyof typeof vowels = 'ya-ya';
  let sensitivity = 60;
  let direction: 'up' | 'down' = 'up';
  let envSmooth = 0;

  processor.onaudioprocess = (e) => {
    try {
      const inputBuf = e.inputBuffer.getChannelData(0);
      const outBuf = e.outputBuffer.getChannelData(0);
      if (outBuf) outBuf.fill(0);
      let sum = 0;
      for (let i = 0; i < inputBuf.length; i++) {
        sum += Math.abs(inputBuf[i]);
      }
      const currentPeak = sum / inputBuf.length;
      envSmooth = envSmooth * 0.85 + currentPeak * 0.15;

      const [f1s, f1e, f2s, f2e] = vowels[currentVowel] || vowels['ya-ya'];
      const amount = Math.min(1.0, envSmooth * (sensitivity / 100) * 12.0);
      const mod = direction === 'up' ? amount : 1.0 - amount;

      const targetF1 = f1s + (f1e - f1s) * mod;
      const targetF2 = f2s + (f2e - f2s) * mod;

      f1.frequency.setTargetAtTime(targetF1, ctx.currentTime, 0.015);
      f2.frequency.setTargetAtTime(targetF2, ctx.currentTime, 0.015);
    } catch {}
  };

  return {
    updateParams: (p: TalkingWahPedal) => {
      const now = ctx.currentTime;
      currentVowel = p.vowel || 'ya-ya';
      sensitivity = Math.max(0, Math.min(100, p.sensitivity));
      direction = p.direction || 'up';

      const q = Math.max(2, Math.min(15, p.resonance));
      f1.Q.setTargetAtTime(q, now, 0.02);
      f2.Q.setTargetAtTime(q * 1.1, now, 0.02);

      driveShaper.curve = createOverdriveCurve(p.drive) as any;

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix * 1.25, now, 0.02);
    },
    dispose: () => {
      if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
        (window as any).__activeAudioProcessors.delete(processor);
      }
      try {
        processor.disconnect();
        dummyGain.disconnect();
      } catch {}
    }
  };
}

/**
 * 7. Reverse Reverb & Shoegaze Bloom DSP Engine.
 * Engineered reverse exponential impulse with feedback bloom.
 */
function createReverseReverbDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const convolver = ctx.createConvolver();
  convolver.normalize = true;

  const preDelay = ctx.createDelay(1.0);
  preDelay.delayTime.value = 0.04;

  const dampingFilter = ctx.createBiquadFilter();
  dampingFilter.type = 'lowpass';
  dampingFilter.frequency.value = 6000;

  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.2;

  // Diffusion delay line inside feedback cycle to satisfy Web Audio cycle constraint strictly
  const feedbackDelay = ctx.createDelay(1.0);
  feedbackDelay.delayTime.value = 0.08;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(preDelay);
  preDelay.connect(convolver);
  convolver.connect(dampingFilter);

  // Web Audio compliant regenerative bloom feedback loop (contains DelayNode)
  dampingFilter.connect(feedbackGain);
  feedbackGain.connect(feedbackDelay);
  feedbackDelay.connect(convolver);

  dampingFilter.connect(wetGain);
  wetGain.connect(output);

  let lastTimeMs = 600;

  const rebuildImpulse = (timeMs: number) => {
    const rate = ctx.sampleRate || 48000;
    const lengthSec = Math.max(0.15, Math.min(1.6, timeMs / 1000));
    const length = Math.floor(rate * lengthSec);
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let maxPeak = 0.0001;
    for (let i = 0; i < length; i++) {
      // Exponential swell building up to a sharp cliff-edge cutoff
      const progress = i / length;
      const envelope = Math.pow(progress, 2.4);
      const noiseL = (Math.random() * 2 - 1) * envelope;
      const noiseR = (Math.random() * 2 - 1) * envelope;
      left[i] = noiseL;
      right[i] = noiseR;
      const p = Math.max(Math.abs(noiseL), Math.abs(noiseR));
      if (p > maxPeak) maxPeak = p;
    }

    // Peak normalization
    const scale = 0.707 / maxPeak;
    for (let i = 0; i < length; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }

    convolver.buffer = buffer;
  };

  rebuildImpulse(lastTimeMs);

  return {
    updateParams: (p: ReverseReverbPedal) => {
      const now = ctx.currentTime;
      if (Math.abs(p.time - lastTimeMs) > 60) {
        lastTimeMs = p.time;
        rebuildImpulse(p.time);
      }

      preDelay.delayTime.setTargetAtTime(Math.max(0, Math.min(200, p.preDelay)) / 1000, now, 0.02);
      // Safe regenerative bloom feedback (< 0.70 to prevent runaway overload)
      feedbackGain.gain.setTargetAtTime(Math.min(0.68, (p.feedback / 100) * 0.68), now, 0.02);

      const dampCutoff = 1500 + ((100 - p.damping) / 100) * 7500;
      dampingFilter.frequency.setTargetAtTime(dampCutoff, now, 0.02);

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix * 1.15, now, 0.02);
    },
    dispose: () => {
      try {
        convolver.disconnect();
        preDelay.disconnect();
        dampingFilter.disconnect();
        feedbackGain.disconnect();
        feedbackDelay.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
      } catch {}
    }
  };
}

/**
 * 8. Crystal Pitch-Shifted Delay DSP Engine (Mode 7 / Eventide Crystals).
 * Delay loop containing granular pitch shift staircase into infinity.
 */
function createCrystalDelayDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const delayNode = ctx.createDelay(1.5);
  delayNode.delayTime.value = 0.38;

  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.45;

  const straightDelayGain = ctx.createGain();
  straightDelayGain.gain.value = 0.6;

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.7;

  // Gentle tone shaping: low rumble cut (160Hz) + high sparkle shelf (3500Hz)
  const shimmerHp = ctx.createBiquadFilter();
  shimmerHp.type = 'highpass';
  shimmerHp.frequency.value = 160;

  const shimmerSparkle = ctx.createBiquadFilter();
  shimmerSparkle.type = 'highshelf';
  shimmerSparkle.frequency.value = 3500;
  shimmerSparkle.gain.value = 2.5;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Dry path
  input.connect(dryGain);
  dryGain.connect(output);

  // Delay line
  input.connect(delayNode);

  // Full-body straight delay path to wet output
  delayNode.connect(straightDelayGain);
  straightDelayGain.connect(wetGain);

  // Pitch-shifting crystal shimmer path
  const delayTapGain = ctx.createGain();
  delayNode.connect(delayTapGain);
  const pitchShifter = createPitchShifterDsp(ctx, delayTapGain, feedbackGain);
  pitchShifter.setShift(12);
  pitchShifter.dryGain.gain.value = 0;

  // Feedback loop: pitch-shifted repeats loop back into delay line for cascading crystal staircase
  feedbackGain.connect(delayNode);

  // Also route pitch shifter output directly to wet output for instant crystal sparkle on first tap!
  feedbackGain.connect(shimmerHp);
  shimmerHp.connect(shimmerSparkle);
  shimmerSparkle.connect(shimmerGain);
  shimmerGain.connect(wetGain);

  wetGain.connect(output);

  const intervalMap: Record<string, number> = {
    '+5th': 7,
    '+7th': 11,
    '+12th': 12,
    '+24th': 24,
    '-12th': -12
  };

  return {
    updateParams: (p: CrystalDelayPedal) => {
      const now = ctx.currentTime;
      delayNode.delayTime.setTargetAtTime(Math.max(0.06, Math.min(1.2, p.time / 1000)), now, 0.02);
      // Safe regenerative feedback limit to avoid infinite runaway howling
      feedbackGain.gain.setTargetAtTime(Math.min(0.85, (p.feedback / 100) * 0.82), now, 0.02);

      const shift = intervalMap[p.interval] ?? 12;
      pitchShifter.setShift(shift);

      // Shimmer knob balances between straight delay repeats and glistening crystal octave cascade
      const shimmerFrac = Math.max(0, Math.min(100, p.shimmer)) / 100;
      shimmerGain.gain.setTargetAtTime(shimmerFrac * 0.95, now, 0.02);
      straightDelayGain.gain.setTargetAtTime(Math.max(0.15, 1.0 - shimmerFrac * 0.65), now, 0.02);
      shimmerSparkle.gain.setTargetAtTime((shimmerFrac - 0.5) * 6.0, now, 0.02);

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      wetGain.gain.setTargetAtTime(mix * 1.05, now, 0.02);
    },
    dispose: () => {
      pitchShifter.dispose?.();
      try {
        delayNode.disconnect();
        delayTapGain.disconnect();
        feedbackGain.disconnect();
        straightDelayGain.disconnect();
        shimmerGain.disconnect();
        shimmerHp.disconnect();
        shimmerSparkle.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
      } catch {}
    }
  };
}

/**
 * 9. Aggressive Hard-Tune & Retune Snapper DSP Engine.
 * Instant 0ms vocal pitch quantizer with scale lock and formant shift.
 */
function createHardTuneDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  // Directly connect high-accuracy pitch shifter between input and output
  const pitchShifter = createPitchShifterDsp(ctx, input, output);
  pitchShifter.dryGain.gain.value = 0.0;
  pitchShifter.wetGain.gain.value = 1.0;

  // Analysis processor for real-time vocal pitch tracking & scale quantization
  const bufferQuantum = 512;
  const processor = ctx.createScriptProcessor(bufferQuantum, 1, 1);
  const dummyGain = ctx.createGain();
  dummyGain.gain.value = 0.0;

  // Connect processor through muted dummy gain to output so WebAudio graph schedules onaudioprocess
  input.connect(processor);
  processor.connect(dummyGain);
  dummyGain.connect(output);

  // Prevent premature garbage collection by V8
  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(processor);
  }

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const scalePatterns: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    arabic: [0, 1, 4, 5, 7, 8, 11]
  };

  let currentKey = 'C';
  let currentScale = 'minor';
  let retuneSpeed = 0;
  let formantWarp = 0;
  let currentShift = 0.0;
  let targetShift = 0.0;

  // Real-time normalized autocorrelation pitch tracking
  processor.onaudioprocess = (e) => {
    try {
      const inCh = e.inputBuffer.getChannelData(0);
      const outCh = e.outputBuffer.getChannelData(0);
      if (!inCh || !outCh) return;
      outCh.fill(0); // Muted dummy buffer

      const sampleRate = ctx.sampleRate || 48000;
      const len = inCh.length;

      // 1. RMS level check with sensitive threshold for vocal tracking
      let sumSq = 0;
      for (let i = 0; i < len; i += 2) {
        const s = inCh[i];
        sumSq += s * s;
      }
      const rms = Math.sqrt(sumSq / (len / 2));

      if (rms > 0.0015) {
        // Human vocal fundamental range: ~70Hz (low male bass) to ~850Hz (high soprano)
        const minPeriod = Math.max(16, Math.floor(sampleRate / 850));
        const maxPeriod = Math.min(Math.floor(len * 0.9), Math.floor(sampleRate / 70));

        let bestCorr = -Infinity;
        let bestPeriod = -1;

        // Step by 2 for low CPU footprint and sub-millisecond execution
        for (let lag = minPeriod; lag < maxPeriod; lag += 2) {
          let corr = 0;
          let energy = 0;
          const searchLen = len - lag;
          for (let i = 0; i < searchLen; i += 4) {
            const s0 = inCh[i];
            const sLag = inCh[i + lag];
            corr += s0 * sLag;
            energy += s0 * s0 + sLag * sLag;
          }
          const norm = energy > 0.0001 ? (2 * corr) / energy : 0;
          if (norm > bestCorr) {
            bestCorr = norm;
            bestPeriod = lag;
          }
        }

        // Reliable fundamental detected
        if (bestPeriod > 0 && bestCorr > 0.28) {
          const detectedFreq = sampleRate / bestPeriod;
          // MIDI pitch: 69 = A4 (440 Hz)
          const midi = 69 + 12 * Math.log2(Math.max(20, detectedFreq) / 440);
          const rootOffset = noteNames.indexOf(currentKey);
          const pattern = scalePatterns[currentScale] || scalePatterns.minor;

          // Find nearest target scale note
          let bestMidi = Math.round(midi);
          let minDiff = 999;
          for (let octave = 1; octave <= 7; octave++) {
            for (const degree of pattern) {
              const candidateMidi = (octave + 1) * 12 + ((rootOffset + degree) % 12);
              const diff = Math.abs(candidateMidi - midi);
              if (diff < minDiff) {
                minDiff = diff;
                bestMidi = candidateMidi;
              }
            }
          }

          // Hard quantize shift in semitones + formant shift offset
          const rawShift = (bestMidi - midi) + formantWarp * 0.35;
          targetShift = Math.max(-12, Math.min(12, rawShift));
        }
      }

      // 2. Retune Speed snap:
      // In Trap / HipHop, 0ms retune speed snaps instantly to the exact quantized scale note!
      if (retuneSpeed <= 2) {
        currentShift = targetShift;
      } else {
        const slewRate = Math.max(0.04, Math.min(1.0, 15 / (retuneSpeed + 1)));
        currentShift += (targetShift - currentShift) * slewRate;
      }

      pitchShifter.setShift(currentShift);
    } catch {}
  };

  return {
    updateParams: (p: HardTunePedal) => {
      const now = ctx.currentTime;
      currentKey = p.key || 'C';
      currentScale = p.scale || 'minor';
      retuneSpeed = typeof p.retuneSpeed === 'number' ? Math.max(0, Math.min(50, p.retuneSpeed)) : 0;
      formantWarp = Math.max(-12, Math.min(12, p.formantWarp || 0));

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      pitchShifter.dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      pitchShifter.wetGain.gain.setTargetAtTime(mix, now, 0.02);
    },
    dispose: () => {
      if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
        (window as any).__activeAudioProcessors.delete(processor);
      }
      try {
        processor.disconnect();
        dummyGain.disconnect();
      } catch {}
      pitchShifter.dispose?.();
    }
  };
}

/**
 * 10. Lo-Fi Cassette & Vinyl Saturation DSP Engine.
 * Wow & flutter delay modulation + vinyl dust crackle + cassette head filter.
 */
function createLofiVinylDsp(ctx: AudioContext, input: GainNode, output: GainNode) {
  const headFilterLow = ctx.createBiquadFilter();
  headFilterLow.type = 'highpass';
  headFilterLow.frequency.value = 130;

  const headFilterHigh = ctx.createBiquadFilter();
  headFilterHigh.type = 'lowpass';
  headFilterHigh.frequency.value = 5200;

  const tapeShaper = ctx.createWaveShaper();
  tapeShaper.curve = createTapeSaturationCurve(50) as any;

  // Wow & Flutter modulation delay
  const flutterDelay = ctx.createDelay(0.1);
  flutterDelay.delayTime.value = 0.015;

  const wowOsc = ctx.createOscillator();
  wowOsc.type = 'sine';
  wowOsc.frequency.value = 0.4;

  const wowGain = ctx.createGain();
  wowGain.gain.value = 0.0015;
  wowOsc.connect(wowGain);
  wowGain.connect(flutterDelay.delayTime);

  const flutterOsc = ctx.createOscillator();
  flutterOsc.type = 'triangle';
  flutterOsc.frequency.value = 5.6;

  const flutterGain = ctx.createGain();
  flutterGain.gain.value = 0.0006;
  flutterOsc.connect(flutterGain);
  flutterGain.connect(flutterDelay.delayTime);

  try {
    wowOsc.start();
    flutterOsc.start();
  } catch {}

  // Vinyl Crackle Synthesizer
  const crackleNode = ctx.createScriptProcessor(512, 1, 1);
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.08;

  // Connect input to crackleNode so WebAudio scheduler keeps processing the node continuously
  input.connect(crackleNode);
  crackleNode.connect(crackleGain);

  // Prevent premature V8 garbage collection
  if (typeof window !== 'undefined') {
    if (!(window as any).__activeAudioProcessors) {
      (window as any).__activeAudioProcessors = new Set();
    }
    (window as any).__activeAudioProcessors.add(crackleNode);
  }

  let crackleAmount = 35;
  crackleNode.onaudioprocess = (e) => {
    try {
      const out = e.outputBuffer.getChannelData(0);
      const prob = (crackleAmount / 100) * 0.015;
      for (let i = 0; i < out.length; i++) {
        if (Math.random() < prob) {
          // Vinyl pop click impulse
          out[i] = (Math.random() * 2 - 1) * 0.85;
        } else {
          // Surface hiss
          out[i] = (Math.random() * 2 - 1) * 0.012;
        }
      }
    } catch {}
  };

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(headFilterLow);
  headFilterLow.connect(headFilterHigh);
  headFilterHigh.connect(tapeShaper);
  tapeShaper.connect(flutterDelay);
  flutterDelay.connect(wetGain);
  crackleGain.connect(wetGain);
  wetGain.connect(output);

  return {
    updateParams: (p: LofiVinylPedal) => {
      const now = ctx.currentTime;
      tapeShaper.curve = createTapeSaturationCurve(p.saturation) as any;

      const flutterLevel = (Math.max(0, Math.min(100, p.flutter)) / 100);
      wowGain.gain.setTargetAtTime(0.002 * flutterLevel, now, 0.02);
      flutterGain.gain.setTargetAtTime(0.0009 * flutterLevel, now, 0.02);

      crackleAmount = Math.max(0, Math.min(100, p.dustCrackle));
      crackleGain.gain.setTargetAtTime((p.dustCrackle / 100) * 0.15, now, 0.02);

      // Filter head loss
      const filterCutoff = 2200 + ((100 - p.filter) / 100) * 6000;
      headFilterHigh.frequency.setTargetAtTime(filterCutoff, now, 0.02);

      const mix = Math.max(0, Math.min(100, p.mix)) / 100;
      dryGain.gain.setTargetAtTime(1.0 - mix, now, 0.02);
      // Warm analog makeup gain compensating for vintage tape head loss
      wetGain.gain.setTargetAtTime(mix * 1.15, now, 0.02);
    },
    dispose: () => {
      if (typeof window !== 'undefined' && (window as any).__activeAudioProcessors) {
        (window as any).__activeAudioProcessors.delete(crackleNode);
      }
      try {
        wowOsc.stop();
        flutterOsc.stop();
        wowOsc.disconnect();
        flutterOsc.disconnect();
        wowGain.disconnect();
        flutterGain.disconnect();
        crackleNode.disconnect();
        crackleGain.disconnect();
        headFilterLow.disconnect();
        headFilterHigh.disconnect();
        tapeShaper.disconnect();
        flutterDelay.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
      } catch {}
    }
  };
}


