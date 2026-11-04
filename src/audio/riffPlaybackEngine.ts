/**
 * Riff Playback Engine
 * Synthesizes guitar tablature in real-time using Web Audio API nodes with authentic
 * articulations (pitch bends, releases, hammer-ons, pull-offs, slides, vibrato, and palm mutes).
 */

import { PracticeRiff, TabColumn, TabNote } from '../types/riffs';
import { audioEngine } from './audioEngine';

const STRING_BASE_MIDI: Record<number, number> = {
  1: 64, // High E (E4)
  2: 59, // B (B3)
  3: 55, // G (G3)
  4: 50, // D (D3)
  5: 45, // A (A2)
  6: 40  // Low E (E2)
};

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getNoteFrequency(stringNum: number, fret: number, fretShift: number = 0): number {
  const base = STRING_BASE_MIDI[stringNum] || 64;
  return midiToFrequency(base + fret + fretShift);
}

export interface RiffEngineStatus {
  isPlaying: boolean;
  currentBeat: number;
  activeColumnIndex: number;
  isCountIn: boolean;
  countInBeat: number;
}

export class RiffPlaybackEngine {
  private isPlaying = false;
  private currentRiff: PracticeRiff | null = null;
  private fretShift = 0;
  private speed = 1.0;
  private isLooping = true;
  private metronomeClick = true;
  private countIn = true;
  private routeThroughDsp = true;

  // Web Audio Nodes
  private playbackGainNode: GainNode | null = null;
  private clickGainNode: GainNode | null = null;
  private scheduledAudioNodes: { stop: (time?: number) => void; disconnect: () => void }[] = [];

  // Scheduling State
  private startCtxTime = 0;
  private startBeat = 0;
  private timerHandle: any = null;
  private animationFrameHandle: any = null;
  private isCountInActive = false;
  private countInRemainingBeats = 0;

  // Callbacks
  public onStatusChange: ((status: RiffEngineStatus) => void) | null = null;

  constructor() {}

  public getStatus(): RiffEngineStatus {
    return {
      isPlaying: this.isPlaying,
      currentBeat: this.getCurrentBeat(),
      activeColumnIndex: this.getActiveColumnIndex(),
      isCountIn: this.isCountInActive,
      countInBeat: this.countInRemainingBeats
    };
  }

  public setFretShift(shift: number): void {
    const changed = this.fretShift !== shift;
    this.fretShift = shift;
    if (changed && this.isPlaying && this.currentRiff) {
      // Re-schedule remaining notes seamlessly
      const currentBeat = this.getCurrentBeat();
      this.stopScheduledNodes();
      this.schedulePlayback(currentBeat);
    }
  }

  public setSpeed(newSpeed: number): void {
    const changed = this.speed !== newSpeed;
    this.speed = Math.max(0.25, Math.min(2.0, newSpeed));
    if (changed && this.isPlaying && this.currentRiff) {
      const currentBeat = this.getCurrentBeat();
      this.stopScheduledNodes();
      this.schedulePlayback(currentBeat);
    }
  }

  public setLooping(loop: boolean): void {
    this.isLooping = loop;
  }

  public setMetronomeClick(enabled: boolean): void {
    this.metronomeClick = enabled;
  }

  public setCountIn(enabled: boolean): void {
    this.countIn = enabled;
  }

  public setRouteThroughDsp(routeThrough: boolean): void {
    if (this.routeThroughDsp === routeThrough) return;
    this.routeThroughDsp = routeThrough;
    if (this.playbackGainNode) {
      this.connectDestination();
    }
  }

  private connectDestination(): void {
    if (!this.playbackGainNode) return;
    try {
      this.playbackGainNode.disconnect();
    } catch {}

    const ctx = audioEngine.ctx;
    if (!ctx) return;

    if (this.routeThroughDsp) {
      // Route through pedalboard + amp simulator!
      if (audioEngine.inputRouter.inputNode) {
        this.playbackGainNode.connect(audioEngine.inputRouter.inputNode);
      } else if (ctx.destination) {
        this.playbackGainNode.connect(ctx.destination);
      }
    } else {
      // Direct clean reference monitor (bypasses pedals/amp so user can jam along)
      const destNode = audioEngine.getMasterDestinationNode();
      if (destNode) {
        this.playbackGainNode.connect(destNode);
      } else if (ctx.destination) {
        this.playbackGainNode.connect(ctx.destination);
      }
    }
  }

  public async start(riff: PracticeRiff, startFromBeat: number = 0): Promise<void> {
    if (!audioEngine.ctx || audioEngine.ctx.state === 'closed') {
      await audioEngine.init();
    }
    if (audioEngine.ctx?.state === 'suspended') {
      await audioEngine.ctx.resume();
    }

    const ctx = audioEngine.ctx;
    if (!ctx) return;

    this.stop();
    this.currentRiff = riff;

    // Create shared output gain for this playback session
    this.playbackGainNode = ctx.createGain();
    this.playbackGainNode.gain.value = 0.85;
    this.connectDestination();

    // Click track gain (always connects to clean monitor or master bus)
    this.clickGainNode = ctx.createGain();
    this.clickGainNode.gain.value = 0.35;
    const clickDestNode = audioEngine.getMasterDestinationNode();
    if (clickDestNode) {
      this.clickGainNode.connect(clickDestNode);
    } else {
      this.clickGainNode.connect(ctx.destination);
    }

    if (this.countIn && startFromBeat === 0) {
      this.isCountInActive = true;
      const bpm = riff.tempo * this.speed;
      const beatDurationSec = 60 / bpm;
      const countBeats = riff.timeSignature[0] || 4;
      this.countInRemainingBeats = countBeats;

      let b = 0;
      const scheduleClick = () => {
        if (!this.isPlaying) return;
        if (b < countBeats) {
          this.playMetronomeTick(ctx.currentTime, b === 0 ? 1200 : 800, 0.4);
          this.countInRemainingBeats = countBeats - b;
          this.notifyStatus();
          b++;
          this.timerHandle = setTimeout(scheduleClick, beatDurationSec * 1000);
        } else {
          this.isCountInActive = false;
          this.schedulePlayback(0);
        }
      };

      this.isPlaying = true;
      scheduleClick();
      this.startAnimationLoop();
    } else {
      this.isCountInActive = false;
      this.isPlaying = true;
      this.schedulePlayback(startFromBeat);
      this.startAnimationLoop();
    }
  }

  private schedulePlayback(fromBeat: number): void {
    if (!this.currentRiff || !audioEngine.ctx) return;
    const ctx = audioEngine.ctx;
    const riff = this.currentRiff;

    const bpm = riff.tempo * this.speed;
    const beatSec = 60 / bpm;
    const now = ctx.currentTime;

    this.startCtxTime = now;
    this.startBeat = fromBeat;

    // Filter columns starting from fromBeat
    const totalBeats = riff.totalBeats || 8;
    const remainingColumns = riff.columns.filter(c => c.time >= fromBeat && c.time < totalBeats);

    // Schedule all notes in the riff
    for (const col of remainingColumns) {
      const colTimeOffsetSec = (col.time - fromBeat) * beatSec;
      const noteStartCtxTime = now + colTimeOffsetSec;

      for (const note of col.notes) {
        if (note.fret < 0) {
          // Dead note / muted scratch
          this.synthesizeDeadNote(noteStartCtxTime, note, beatSec);
        } else {
          this.synthesizeTabNote(noteStartCtxTime, note, col.duration, beatSec, riff.pickupStyle);
        }
      }

      // Metronome click on whole beats if enabled
      if (this.metronomeClick && Math.abs(col.time - Math.round(col.time)) < 0.05) {
        const isDownbeat = Math.round(col.time) % (riff.timeSignature[0] || 4) === 0;
        this.playMetronomeTick(noteStartCtxTime, isDownbeat ? 1400 : 880, isDownbeat ? 0.35 : 0.2);
      }
    }

    // Schedule loop or finish
    const remainingDurationSec = (totalBeats - fromBeat) * beatSec;
    if (this.isLooping) {
      this.timerHandle = setTimeout(() => {
        if (this.isPlaying && this.isLooping && this.currentRiff) {
          this.stopScheduledNodes();
          this.schedulePlayback(0);
        }
      }, remainingDurationSec * 1000 - 15);
    } else {
      this.timerHandle = setTimeout(() => {
        if (this.isPlaying) {
          this.stop();
        }
      }, remainingDurationSec * 1000);
    }
  }

  /**
   * Synthesize an authentic guitar note with articulation (bends, hammer-ons, slides, vibrato)
   */
  private synthesizeTabNote(
    startTime: number,
    note: TabNote,
    durationBeats: number,
    beatSec: number,
    pickupStyle?: string
  ): void {
    const ctx = audioEngine.ctx;
    if (!ctx || !this.playbackGainNode) return;

    const baseFreq = getNoteFrequency(note.string, note.fret, this.fretShift);
    const noteDurationSec = Math.max(0.08, durationBeats * beatSec);

    // Tone Generator: Dual Oscillators (Triangle + Sawtooth blend for rich guitar harmonic body)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscMix = ctx.createGain();
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    // Base frequencies
    osc1.frequency.setValueAtTime(baseFreq, startTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.002, startTime); // Subtle chorus detune

    // 1. TECHNIQUE: BENDS & RELEASES
    if (note.technique === 'bend-full' || note.technique === 'bend-half' || note.technique === 'bend-quarter') {
      const bendSemitones = note.bendAmount || (note.technique === 'bend-full' ? 2 : note.technique === 'bend-half' ? 1 : 0.5);
      const targetFreq = baseFreq * Math.pow(2, bendSemitones / 12);
      const bendStartTime = startTime + noteDurationSec * 0.15;
      const bendPeakTime = startTime + noteDurationSec * 0.7;

      osc1.frequency.setValueAtTime(baseFreq, startTime);
      osc1.frequency.setValueAtTime(baseFreq, bendStartTime);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, bendPeakTime);

      osc2.frequency.setValueAtTime(baseFreq * 1.002, startTime);
      osc2.frequency.setValueAtTime(baseFreq * 1.002, bendStartTime);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq * 1.002, bendPeakTime);
    } else if (note.technique === 'bend-release') {
      const bendSemitones = note.bendAmount || 2;
      const targetFreq = baseFreq * Math.pow(2, bendSemitones / 12);
      const peakTime = startTime + noteDurationSec * 0.4;
      const releaseTime = startTime + noteDurationSec * 0.85;

      osc1.frequency.setValueAtTime(baseFreq, startTime);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, peakTime);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, releaseTime);

      osc2.frequency.setValueAtTime(baseFreq * 1.002, startTime);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq * 1.002, peakTime);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.002, releaseTime);
    } else if (note.technique === 'slide-up' || note.technique === 'slide-down') {
      if (note.targetFret !== undefined) {
        const targetFreq = getNoteFrequency(note.string, note.targetFret, this.fretShift);
        const slideStartTime = startTime + noteDurationSec * 0.3;
        const slideEndTime = startTime + noteDurationSec * 0.85;

        osc1.frequency.setValueAtTime(baseFreq, startTime);
        osc1.frequency.setValueAtTime(baseFreq, slideStartTime);
        osc1.frequency.exponentialRampToValueAtTime(targetFreq, slideEndTime);

        osc2.frequency.setValueAtTime(baseFreq * 1.002, startTime);
        osc2.frequency.setValueAtTime(baseFreq * 1.002, slideStartTime);
        osc2.frequency.exponentialRampToValueAtTime(targetFreq * 1.002, slideEndTime);
      }
    }

    // 2. TECHNIQUE: VIBRATO
    if (note.vibrato || note.technique === 'vibrato') {
      const vibratoLfo = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibratoLfo.frequency.setValueAtTime(5.8, startTime); // 5.8Hz natural finger vibrato
      vibratoGain.gain.setValueAtTime(0, startTime);
      // Fade in vibrato naturally after initial attack
      vibratoGain.gain.setValueAtTime(0, startTime + noteDurationSec * 0.25);
      vibratoGain.gain.linearRampToValueAtTime(baseFreq * 0.025, startTime + noteDurationSec * 0.6);

      vibratoLfo.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibratoGain.connect(osc2.frequency);
      vibratoLfo.start(startTime);
      vibratoLfo.stop(startTime + noteDurationSec * 1.2);
    }

    // 3. TECHNIQUE: PALM MUTE vs NORMAL vs HAMMER-ON ATTACK
    const isPalmMute = note.palmMute || note.technique === 'palm-mute';
    const isHammerOrPull = note.technique === 'hammer-on' || note.technique === 'pull-off';

    // Tone filter (pickup coil warmth)
    filter.type = 'lowpass';
    if (isPalmMute) {
      filter.frequency.setValueAtTime(900, startTime);
      filter.Q.value = 1.2;
    } else if (pickupStyle === 'twang') {
      filter.frequency.setValueAtTime(4500, startTime);
      filter.Q.value = 1.5;
    } else {
      filter.frequency.setValueAtTime(2800, startTime);
      filter.Q.value = 1.0;
    }

    // Volume Envelope (ADSR)
    noteGain.gain.setValueAtTime(0.0001, startTime);
    if (isHammerOrPull) {
      // Soft legato attack (fingertip slap rather than hard pick strike)
      noteGain.gain.linearRampToValueAtTime(0.45, startTime + 0.015);
    } else if (isPalmMute) {
      // Punchy percussive thump with rapid decay
      noteGain.gain.linearRampToValueAtTime(0.65, startTime + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.min(noteDurationSec, 0.22));
    } else {
      // Crisp pick attack
      noteGain.gain.linearRampToValueAtTime(0.7, startTime + 0.006);
      noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDurationSec * 1.1);
    }

    // Connect node chain
    oscMix.gain.value = 0.5;
    osc1.connect(oscMix);
    osc2.connect(oscMix);
    oscMix.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.playbackGainNode);

    // Pick transient noise burst (unless hammer-on/pull-off)
    if (!isHammerOrPull) {
      this.synthesizePickTransient(startTime, baseFreq, isPalmMute);
    }

    // Start & Stop
    osc1.start(startTime);
    osc2.start(startTime);
    const stopTime = startTime + noteDurationSec * 1.25;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    const wrapper = {
      stop: () => {
        try { osc1.stop(); osc2.stop(); } catch {}
      },
      disconnect: () => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          oscMix.disconnect();
          filter.disconnect();
          noteGain.disconnect();
        } catch {}
      }
    };
    this.scheduledAudioNodes.push(wrapper);
  }

  /**
   * Synthesize a percussive pick strike transient
   */
  private synthesizePickTransient(startTime: number, noteFreq: number, isPalmMute: boolean): void {
    const ctx = audioEngine.ctx;
    if (!ctx || !this.playbackGainNode) return;

    const burstLen = 0.02;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * burstLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / data.length));
      data[i] = (Math.random() * 2 - 1) * window * (isPalmMute ? 0.35 : 0.6);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = Math.min(4000, noteFreq * 3);
    noiseFilter.Q.value = 1.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + burstLen);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.playbackGainNode);

    noiseSource.start(startTime);
    this.scheduledAudioNodes.push({
      stop: () => { try { noiseSource.stop(); } catch {} },
      disconnect: () => { try { noiseSource.disconnect(); noiseFilter.disconnect(); noiseGain.disconnect(); } catch {} }
    });
  }

  /**
   * Synthesize dead note / fret hand muting ("chicka")
   */
  private synthesizeDeadNote(startTime: number, note: TabNote, beatSec: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx || !this.playbackGainNode) return;

    const burstLen = 0.035;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * burstLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.008));
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + burstLen);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.playbackGainNode);

    src.start(startTime);
    this.scheduledAudioNodes.push({
      stop: () => { try { src.stop(); } catch {} },
      disconnect: () => { try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch {} }
    });
  }

  /**
   * Metronome Click Tick
   */
  private playMetronomeTick(startTime: number, freq: number, gainLevel: number): void {
    const ctx = audioEngine.ctx;
    if (!ctx || !this.clickGainNode) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

    osc.connect(gain);
    gain.connect(this.clickGainNode);

    osc.start(startTime);
    osc.stop(startTime + 0.04);
  }

  public stop(): void {
    this.isPlaying = false;
    this.isCountInActive = false;
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.animationFrameHandle) {
      cancelAnimationFrame(this.animationFrameHandle);
      this.animationFrameHandle = null;
    }
    this.stopScheduledNodes();
    this.notifyStatus();
  }

  private stopScheduledNodes(): void {
    for (const n of this.scheduledAudioNodes) {
      try { n.stop(); } catch {}
      try { n.disconnect(); } catch {}
    }
    this.scheduledAudioNodes = [];
  }

  public getCurrentBeat(): number {
    if (!this.isPlaying || !this.currentRiff || !audioEngine.ctx) return 0;
    if (this.isCountInActive) return 0;
    const ctx = audioEngine.ctx;
    const bpm = this.currentRiff.tempo * this.speed;
    const beatSec = 60 / bpm;
    const elapsedSec = ctx.currentTime - this.startCtxTime;
    const totalBeats = this.currentRiff.totalBeats || 8;
    const beat = this.startBeat + (elapsedSec / beatSec);
    return this.isLooping ? (beat % totalBeats) : Math.min(beat, totalBeats);
  }

  public getActiveColumnIndex(): number {
    if (!this.currentRiff) return -1;
    const beat = this.getCurrentBeat();
    const cols = this.currentRiff.columns;
    let activeIdx = -1;
    for (let i = 0; i < cols.length; i++) {
      if (beat >= cols[i].time && (i === cols.length - 1 || beat < cols[i + 1].time)) {
        activeIdx = i;
        break;
      }
    }
    return activeIdx;
  }

  private startAnimationLoop(): void {
    const loop = () => {
      if (this.isPlaying) {
        this.notifyStatus();
        this.animationFrameHandle = requestAnimationFrame(loop);
      }
    };
    this.animationFrameHandle = requestAnimationFrame(loop);
  }

  private notifyStatus(): void {
    if (this.onStatusChange) {
      this.onStatusChange(this.getStatus());
    }
  }
}

export const riffPlaybackEngine = new RiffPlaybackEngine();
