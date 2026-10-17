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
 * 16. VST Plugin: Container running custom wave-shaper & filter script with 4 assignable control knobs.
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
  VstPluginPedal
} from '../types/pedal';
import {
  createOverdriveCurve,
  createDistortionCurve,
  createFuzzCurve
} from './curves';

export interface PitchShifterNodes {
  input: GainNode;
  output: GainNode;
  processor: ScriptProcessorNode;
  dryGain: GainNode;
  wetGain: GainNode;
  setShift: (semitones: number) => void;
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

    case 'vstPlugin': {
      const waveshaper = ctx.createWaveShaper();
      const filter = ctx.createBiquadFilter();
      const dry = ctx.createGain();
      const wet = ctx.createGain();

      input.connect(dry);
      input.connect(waveshaper);
      waveshaper.connect(filter);
      filter.connect(wet);

      dry.connect(wetGain);
      wet.connect(wetGain);

      dspNodes = { waveshaper, filter, dry, wet };
      break;
    }
  }

  wetGain.connect(output);

  const wrapper: PedalNodeWrapper = { input, output, bypassGain, wetGain, dspNodes, pedalType: pedal.type };
  updatePedalParameters(ctx, pedal, wrapper);
  return wrapper;
}

/**
 * Real-time Polyphonic Doppler Pitch Shifter Architecture.
 * Uses a dual-grain circular delay buffer with continuous Hann window crossfading.
 * Mathematically accurate Doppler pitch shifting:
 * - When shifting down by -12 semitones (octave down, ratio = 0.5), read pointer moves at 0.5x speed.
 * - When shifting up by +12 semitones (octave up, ratio = 2.0), read pointer moves at 2.0x speed.
 * - Dry and Wet gains smoothly crossfade so at 100% mix, dry is 0% and wet is 100%.
 */
function createPitchShifterDsp(ctx: AudioContext, input: GainNode, output: GainNode): PitchShifterNodes {
  // 512 samples buffer for ultra-low 10.6ms latency
  const processor = ctx.createScriptProcessor(512, 1, 1);
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

  // Circular Delay Buffer (16384 samples ~340ms at 48kHz)
  const bufferSize = 16384;
  const buffer = new Float32Array(bufferSize);
  let writeIndex = 0;

  // Pitch shift ratio tracking
  let targetRatio = 1.0;
  let currentRatio = 1.0;

  // Window size in samples: ~38ms (ideal compromise between low-frequency tracking and transient responsiveness)
  const sampleRate = ctx.sampleRate || 48000;
  const sweepSize = Math.max(512, Math.min(4096, Math.round(0.038 * sampleRate)));
  const minDelay = 64; // Small margin to prevent read from overtaking write

  let phase = 0.0;

  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    try {
      const inputChannel = e.inputBuffer.getChannelData(0);
      const outputChannel = e.outputBuffer.getChannelData(0);
      if (!inputChannel || !outputChannel) return;
      const len = inputChannel.length;

      // Smooth ratio with exponential one-pole filter (alpha ~ 0.002 = ~25ms glide)
      // Completely eliminates explosive ratio accumulation, oscillations, or NaN!
      const alpha = 0.002;

      for (let i = 0; i < len; i++) {
        if (Math.abs(targetRatio - currentRatio) > 0.00001) {
          currentRatio += (targetRatio - currentRatio) * alpha;
        } else {
          currentRatio = targetRatio;
        }
        if (!Number.isFinite(currentRatio)) currentRatio = 1.0;
        currentRatio = Math.max(0.125, Math.min(8.0, currentRatio));

        // Write current incoming sample with NaN protection
        const rawIn = inputChannel[i];
        const inSample = Number.isFinite(rawIn) ? rawIn : 0.0;
        buffer[writeIndex] = inSample;

        let shiftedSample = 0;

        if (Math.abs(currentRatio - 1.0) < 0.0005) {
          // Direct pass-through when shift is 0 semitones
          const readIdx = (writeIndex - minDelay + bufferSize) % bufferSize;
          shiftedSample = buffer[readIdx];
        } else {
          const phase0 = phase;
          const phase1 = (phase + 0.5) % 1.0;

          // Hann window gains: sin^2(pi * phase0) + cos^2(pi * phase0) = 1.0 at all times!
          const s0 = Math.sin(Math.PI * phase0);
          const win0 = s0 * s0;

          const s1 = Math.sin(Math.PI * phase1);
          const win1 = s1 * s1;

          let delay0 = 0;
          let delay1 = 0;

          if (currentRatio < 1.0) {
            // Downward shift: delay ramps UP
            delay0 = minDelay + phase0 * sweepSize;
            delay1 = minDelay + phase1 * sweepSize;
          } else {
            // Upward shift: delay ramps DOWN
            delay0 = minDelay + (1.0 - phase0) * sweepSize;
            delay1 = minDelay + (1.0 - phase1) * sweepSize;
          }

          // Interpolated read Grain 0
          const safeDelay0 = Number.isFinite(delay0) ? Math.max(0, Math.min(bufferSize - 1, delay0)) : minDelay;
          const rPos0 = (writeIndex - safeDelay0 + bufferSize * 4) % bufferSize;
          const i0 = Math.floor(rPos0);
          const f0 = rPos0 - i0;
          const next0 = (i0 + 1) % bufferSize;
          const g0_a = buffer[i0] !== undefined ? buffer[i0] : 0;
          const g0_b = buffer[next0] !== undefined ? buffer[next0] : 0;
          const grain0 = g0_a * (1 - f0) + g0_b * f0;

          // Interpolated read Grain 1
          const safeDelay1 = Number.isFinite(delay1) ? Math.max(0, Math.min(bufferSize - 1, delay1)) : minDelay;
          const rPos1 = (writeIndex - safeDelay1 + bufferSize * 4) % bufferSize;
          const i1 = Math.floor(rPos1);
          const f1 = rPos1 - i1;
          const next1 = (i1 + 1) % bufferSize;
          const g1_a = buffer[i1] !== undefined ? buffer[i1] : 0;
          const g1_b = buffer[next1] !== undefined ? buffer[next1] : 0;
          const grain1 = g1_a * (1 - f1) + g1_b * f1;

          shiftedSample = grain0 * win0 + grain1 * win1;

          // Advance phase
          const deltaPhase = Math.abs(1.0 - currentRatio) / sweepSize;
          phase = (phase + deltaPhase) % 1.0;
          if (!Number.isFinite(phase)) phase = 0.0;
        }

        outputChannel[i] = Number.isFinite(shiftedSample) ? shiftedSample : inSample;
        writeIndex = (writeIndex + 1) % bufferSize;
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
      shifter.dryGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      shifter.wetGain.gain.setTargetAtTime((p.harmonyLevel / 100) * 0.75, ctx.currentTime, 0.02);
      nodes.directGain.gain.setTargetAtTime((p.directLevel / 100) * 0.85, ctx.currentTime, 0.02);
      break;
    }

    case 'vstPlugin': {
      const p = pedal as VstPluginPedal;
      nodes.waveshaper.curve = createOverdriveCurve(p.param1) as any;
      nodes.filter.frequency.setTargetAtTime(200 + (p.param2 / 100) * 8000, ctx.currentTime, 0.02);
      nodes.filter.Q.setTargetAtTime(1 + (p.param3 / 100) * 10, ctx.currentTime, 0.02);
      const mix = p.dryWet / 100;
      nodes.wet.gain.setTargetAtTime(mix, ctx.currentTime, 0.02);
      nodes.dry.gain.setTargetAtTime(1 - mix, ctx.currentTime, 0.02);
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
