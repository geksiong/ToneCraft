/**
 * @file backingTrackEngine.ts
 * @description High-Precision Web Audio Synthesis Backing Track Engine.
 * Features 4-track synthesis (Percussion/Drums, Bass, Rhythm Guitar/Keys, Synth/Pad),
 * micro-strum chord voicing, authentic genre rhythm algorithms, and zero-latency lookahead scheduling.
 */

import {
  BackingGenreId,
  BackingTrackState,
  ChordStep,
  DrumComplexity,
  GENRE_PRESETS,
  getChordNotes,
  InstrumentConfig,
  InstrumentId,
  midiToFreq,
  NOTE_NAMES,
  POPULAR_PROGRESSION_PRESETS,
  RhythmFeel,
  ROOT_MIDI_MAP,
  StrumStyle,
  BassGroove
} from '../types/backingTrack';

export class BackingTrackEngine {
  private ctx: AudioContext | null = null;
  private masterOutputGain: GainNode | null = null;

  // Instrument Mixer Busses & Gains
  private instrumentGains: Record<InstrumentId, GainNode | null> = {
    percussion: null,
    bass: null,
    guitar: null,
    synth: null
  };

  // State
  private isRunning: boolean = false;
  private bpm: number = 120;
  private genre: BackingGenreId = 'rock';
  private key: string = 'A';
  private progression: ChordStep[] = [...GENRE_PRESETS[0].defaultProgression];

  private rhythmFeel: RhythmFeel = 'straight';
  private drumComplexity: DrumComplexity = 'balanced';
  private strumStyle: StrumStyle = 'eighth-strum';
  private bassGroove: BassGroove = 'driving-eighths';
  private masterVolume: number = 85;

  private instruments: Record<InstrumentId, InstrumentConfig> = {
    percussion: { volume: 85, muted: false, solo: false, style: 'studio-kit' },
    bass: { volume: 85, muted: false, solo: false, style: 'picked-pbass' },
    guitar: { volume: 80, muted: false, solo: false, style: 'clean-strat' },
    synth: { volume: 70, muted: false, solo: false, style: 'warm-analog' }
  };

  // Scheduler state
  private timerWorker: any = null;
  private lookaheadMs: number = 25.0; // Timer interval
  private scheduleAheadTime: number = 0.12; // Schedule ahead window (s)
  private nextStepTime: number = 0;
  private currentStep: number = 0; // 0 to 15 (16th notes in 4/4 bar)
  private currentBarProgress: number = 0; // Cumulative bar count in progression
  private currentChordIndex: number = 0;
  private currentBarInChord: number = 0;

  // Visual state synchronized with audio clock
  private visualStep: number = 0;
  private visualBeat: number = 1;
  private visualBar: number = 1;
  private visualChordIndex: number = 0;

  // Listeners
  private onStateCallbacks: Set<(state: BackingTrackState) => void> = new Set();
  private onInstrumentTriggerCallbacks: Set<(inst: InstrumentId) => void> = new Set();

  // Cached noise buffer for drums/shakers
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    this.applyGenrePreset(this.genre, false);
  }

  public init(ctx: AudioContext, destination: AudioNode, onStateChange?: (state: BackingTrackState) => void): void {
    this.ctx = ctx;
    if (onStateChange) {
      this.addStateListener(onStateChange);
    }

    // Build Master Bus
    this.masterOutputGain = ctx.createGain();
    this.masterOutputGain.gain.value = this.masterVolume / 100;
    this.masterOutputGain.connect(destination);

    // Build 4 Instrument Channel Busses
    const instIds: InstrumentId[] = ['percussion', 'bass', 'guitar', 'synth'];
    for (const instId of instIds) {
      const g = ctx.createGain();
      g.connect(this.masterOutputGain);
      this.instrumentGains[instId] = g;
    }

    this.updateInstrumentGains();
    this.generateNoiseBuffer();
    this.notifyState();
  }

  public addStateListener(cb: (state: BackingTrackState) => void): () => void {
    this.onStateCallbacks.add(cb);
    try {
      cb(this.getState());
    } catch {}
    return () => {
      this.onStateCallbacks.delete(cb);
    };
  }

  public setOnStateChange(cb: (state: BackingTrackState) => void): () => void {
    return this.addStateListener(cb);
  }

  public addInstrumentTriggerListener(cb: (inst: InstrumentId) => void): () => void {
    this.onInstrumentTriggerCallbacks.add(cb);
    return () => {
      this.onInstrumentTriggerCallbacks.delete(cb);
    };
  }

  public setOnInstrumentTrigger(cb: (inst: InstrumentId) => void): () => void {
    return this.addInstrumentTriggerListener(cb);
  }

  public getState(): BackingTrackState {
    const totalBars = this.progression.reduce((acc, c) => acc + c.durationBars, 0);
    return {
      isPlaying: this.isRunning,
      bpm: this.bpm,
      genre: this.genre,
      key: this.key,
      progression: [...this.progression],
      currentChordIndex: this.visualChordIndex,
      currentBeat: this.visualBeat,
      currentBar: this.visualBar,
      totalBars: Math.max(1, totalBars),
      instruments: JSON.parse(JSON.stringify(this.instruments)),
      rhythmFeel: this.rhythmFeel,
      drumComplexity: this.drumComplexity,
      strumStyle: this.strumStyle,
      bassGroove: this.bassGroove,
      masterVolume: this.masterVolume
    };
  }

  public notifyState(): void {
    const state = this.getState();
    this.onStateCallbacks.forEach((cb) => {
      try {
        cb(state);
      } catch (e) {
        console.error('[BackingTrackEngine] notifyState error:', e);
      }
    });
  }

  public notifyInstrumentTrigger(inst: InstrumentId): void {
    this.onInstrumentTriggerCallbacks.forEach((cb) => {
      try {
        cb(inst);
      } catch (e) {
        console.error('[BackingTrackEngine] notifyInstrumentTrigger error:', e);
      }
    });
  }

  private generateNoiseBuffer(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of white noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  public async start(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {}
    }
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentStep = 0;
    this.currentChordIndex = 0;
    this.currentBarInChord = 0;
    this.currentBarProgress = 0;
    this.visualStep = 0;
    this.visualBeat = 1;
    this.visualBar = 1;
    this.visualChordIndex = 0;
    this.nextStepTime = (this.ctx ? this.ctx.currentTime : performance.now() / 1000) + 0.05;

    if (this.timerWorker) clearInterval(this.timerWorker);
    this.timerWorker = setInterval(() => this.scheduler(), this.lookaheadMs);
    this.notifyState();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerWorker) {
      clearInterval(this.timerWorker);
      this.timerWorker = null;
    }
    this.currentStep = 0;
    this.currentChordIndex = 0;
    this.currentBarInChord = 0;
    this.currentBarProgress = 0;
    this.visualStep = 0;
    this.visualBeat = 1;
    this.visualBar = 1;
    this.visualChordIndex = 0;
    this.notifyState();
  }

  public async toggle(): Promise<boolean> {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(40, Math.min(260, Math.round(newBpm)));
    this.notifyState();
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(100, vol));
    if (this.masterOutputGain && this.ctx) {
      this.masterOutputGain.gain.setTargetAtTime(this.masterVolume / 100, this.ctx.currentTime, 0.02);
    }
    this.notifyState();
  }

  public setInstrumentVolume(inst: InstrumentId, vol: number): void {
    this.instruments[inst].volume = Math.max(0, Math.min(100, vol));
    this.updateInstrumentGains();
    this.notifyState();
  }

  public toggleInstrumentMute(inst: InstrumentId): void {
    this.instruments[inst].muted = !this.instruments[inst].muted;
    this.updateInstrumentGains();
    this.notifyState();
  }

  public toggleInstrumentSolo(inst: InstrumentId): void {
    const isCurrentlySolo = this.instruments[inst].solo;
    if (isCurrentlySolo) {
      this.instruments[inst].solo = false;
    } else {
      // Set only this to solo, or toggle
      this.instruments[inst].solo = true;
    }
    this.updateInstrumentGains();
    this.notifyState();
  }

  public setInstrumentStyle(inst: InstrumentId, style: string): void {
    this.instruments[inst].style = style;
    this.notifyState();
  }

  public setRhythmFeel(feel: RhythmFeel): void {
    this.rhythmFeel = feel;
    this.notifyState();
  }

  public setDrumComplexity(comp: DrumComplexity): void {
    this.drumComplexity = comp;
    this.notifyState();
  }

  public setStrumStyle(style: StrumStyle): void {
    this.strumStyle = style;
    this.notifyState();
  }

  public setBassGroove(groove: BassGroove): void {
    this.bassGroove = groove;
    this.notifyState();
  }

  public setProgression(chords: ChordStep[]): void {
    if (chords.length === 0) return;
    this.progression = [...chords];
    if (this.currentChordIndex >= this.progression.length) {
      this.currentChordIndex = 0;
      this.currentBarInChord = 0;
    }
    this.notifyState();
  }

  public updateChordStep(index: number, updated: Partial<ChordStep>): void {
    if (index < 0 || index >= this.progression.length) return;
    this.progression[index] = { ...this.progression[index], ...updated };
    this.notifyState();
  }

  public addChordStep(chord: ChordStep, atIndex?: number): void {
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= this.progression.length) {
      this.progression.splice(atIndex, 0, chord);
    } else {
      this.progression.push(chord);
    }
    this.notifyState();
  }

  public removeChordStep(index: number): void {
    if (this.progression.length <= 1) return; // Keep at least 1 chord
    this.progression.splice(index, 1);
    if (this.currentChordIndex >= this.progression.length) {
      this.currentChordIndex = 0;
      this.currentBarInChord = 0;
    }
    this.notifyState();
  }

  public moveChordStep(index: number, direction: 'left' | 'right'): void {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= this.progression.length) return;
    const temp = this.progression[index];
    this.progression[index] = this.progression[target];
    this.progression[target] = temp;
    this.notifyState();
  }

  /**
   * Transpose entire progression by given semitones (+/-)
   */
  public transposeProgression(semitones: number): void {
    const noteCount = NOTE_NAMES.length;
    this.progression = this.progression.map((chord) => {
      const currentIdx = ROOT_MIDI_MAP[chord.root] ?? 0;
      const newIdx = ((currentIdx + semitones) % noteCount + noteCount) % noteCount;
      return {
        ...chord,
        root: NOTE_NAMES[newIdx]
      };
    });

    const keyIdx = ROOT_MIDI_MAP[this.key] ?? 0;
    const newKeyIdx = ((keyIdx + semitones) % noteCount + noteCount) % noteCount;
    this.key = NOTE_NAMES[newKeyIdx];

    this.notifyState();
  }

  /**
   * Set root key and shift progression relative to old key
   */
  public setKey(newKey: string): void {
    const oldIdx = ROOT_MIDI_MAP[this.key] ?? 0;
    const targetIdx = ROOT_MIDI_MAP[newKey] ?? 0;
    const delta = targetIdx - oldIdx;
    this.key = newKey;
    if (delta !== 0) {
      this.transposeProgression(delta);
    } else {
      this.notifyState();
    }
  }

  /**
   * Applies genre preset defaults
   */
  public applyGenrePreset(genreId: BackingGenreId, startPlayingAfter: boolean = false): void {
    const preset = GENRE_PRESETS.find((p) => p.id === genreId) || GENRE_PRESETS[0];
    this.genre = preset.id;
    this.bpm = preset.defaultBpm;
    this.key = preset.defaultKey;
    this.rhythmFeel = preset.rhythmFeel;
    this.drumComplexity = preset.drumComplexity;
    this.strumStyle = preset.strumStyle;
    this.bassGroove = preset.bassGroove;
    this.progression = preset.defaultProgression.map((c) => ({ ...c, id: `chord-${Math.random().toString(36).slice(2, 7)}` }));

    for (const inst of Object.keys(preset.recommendedInstrumentStyles) as InstrumentId[]) {
      this.instruments[inst].style = preset.recommendedInstrumentStyles[inst];
    }

    this.currentStep = 0;
    this.currentChordIndex = 0;
    this.currentBarInChord = 0;
    this.currentBarProgress = 0;
    this.visualBeat = 1;
    this.visualBar = 1;

    this.notifyState();

    if (startPlayingAfter) {
      this.start();
    }
  }

  /**
   * Applies popular chord progression preset
   */
  public applyProgressionPreset(index: number): void {
    const preset = POPULAR_PROGRESSION_PRESETS[index];
    if (!preset) return;
    this.progression = preset.chords.map((c) => ({ ...c, id: `chord-${Math.random().toString(36).slice(2, 7)}` }));
    this.currentStep = 0;
    this.currentChordIndex = 0;
    this.currentBarInChord = 0;
    this.currentBarProgress = 0;
    this.visualBeat = 1;
    this.visualBar = 1;
    this.notifyState();
  }

  private updateInstrumentGains(): void {
    if (!this.ctx) return;
    const anySolo = Object.values(this.instruments).some((i) => i.solo);

    for (const [id, config] of Object.entries(this.instruments) as [InstrumentId, InstrumentConfig][]) {
      const gainNode = this.instrumentGains[id];
      if (!gainNode) continue;

      let effectiveGain = 0;
      if (anySolo) {
        effectiveGain = config.solo && !config.muted ? config.volume / 100 : 0;
      } else {
        effectiveGain = config.muted ? 0 : config.volume / 100;
      }

      gainNode.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.015);
    }
  }

  // =========================================================================
  // HIGH PRECISION SCHEDULER & PATTERN GENERATION
  // =========================================================================

  private scheduler(): void {
    if (!this.ctx || !this.isRunning) return;

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4.0; // 16th note base duration

    // Swing calculation for 16th notes:
    // Even steps (0, 2, 4...) are on-beat; odd steps (1, 3, 5...) are swung forward
    let currentStepDuration = stepDuration;
    const isOddStep = this.currentStep % 2 === 1;

    let swingRatio = 0;
    if (this.rhythmFeel === 'light-swing') swingRatio = 0.15;
    if (this.rhythmFeel === 'heavy-shuffle') swingRatio = 0.32;

    if (swingRatio > 0) {
      if (isOddStep) {
        currentStepDuration = stepDuration * (1 - swingRatio);
      } else {
        currentStepDuration = stepDuration * (1 + swingRatio);
      }
    }

    this.nextStepTime += currentStepDuration;

    // Advance step counter (0 to 15)
    this.currentStep++;
    if (this.currentStep >= 16) {
      this.currentStep = 0;
      this.advanceBar();
    }
  }

  private advanceBar(): void {
    this.currentBarProgress++;
    this.currentBarInChord++;

    const activeChord = this.progression[this.currentChordIndex];
    const duration = activeChord ? activeChord.durationBars : 1;

    if (this.currentBarInChord >= duration) {
      this.currentBarInChord = 0;
      this.currentChordIndex = (this.currentChordIndex + 1) % this.progression.length;
    }
  }

  private scheduleStep(step: number, time: number): void {
    if (this.progression.length === 0) return;
    const activeChord = this.progression[this.currentChordIndex] || this.progression[0];
    const chordIdx = this.currentChordIndex;
    const barNum = this.currentBarProgress + 1;
    const beatNum = Math.floor(step / 4) + 1;

    // Synchronize visual clock update with exact Web Audio playback time
    if (this.ctx && step % 4 === 0) {
      const now = this.ctx.currentTime;
      const delayMs = Math.max(0, (time - now) * 1000);
      setTimeout(() => {
        if (!this.isRunning) return;
        this.visualStep = step;
        this.visualBeat = beatNum;
        this.visualBar = barNum;
        this.visualChordIndex = chordIdx;
        this.notifyState();
      }, delayMs);
    }

    // 1. DRUMS / PERCUSSION
    this.scheduleDrums(step, time);

    // 2. BASS
    this.scheduleBass(step, time, activeChord);

    // 3. GUITAR / KEYS
    this.scheduleGuitar(step, time, activeChord);

    // 4. SYNTH / PAD
    this.scheduleSynth(step, time, activeChord);
  }

  private queueVisualTrigger(inst: InstrumentId, time: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const delayMs = Math.max(0, (time - now) * 1000);
    setTimeout(() => {
      if (!this.isRunning) return;
      this.notifyInstrumentTrigger(inst);
    }, delayMs);
  }

  // =========================================================================
  // DRUM PATTERNS & SYNTHESIS
  // =========================================================================

  private scheduleDrums(step: number, time: number): void {
    const config = this.instruments.percussion;
    const style = config.style;

    const genre = this.genre;
    const complexity = this.drumComplexity;

    let playKick = false;
    let playSnare = false;
    let playHiHatClosed = false;
    let playHiHatOpen = false;
    let playPercExtra: 'clap' | 'rimshot' | 'shaker' | null = null;
    let velocity = 0.8;

    switch (genre) {
      case 'rock':
      case 'metal': {
        // Driving rock beat: Kick 0, 8 (or 10); Snare 4, 12; 8th note hi-hats
        if (step === 0 || step === 8) playKick = true;
        if (complexity !== 'minimal' && (step === 10 || (genre === 'metal' && (step === 2 || step === 6)))) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (step % 2 === 0) playHiHatClosed = true;
        if (step === 14 && complexity === 'busy') playHiHatOpen = true;
        break;
      }

      case 'blues': {
        // Shuffle beat: Kick on 0, 8; Snare on 4, 12; Swung hats
        if (step === 0 || step === 8) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (step % 2 === 0 || step === 3 || step === 7 || step === 11 || step === 15) playHiHatClosed = true;
        break;
      }

      case 'funk': {
        // Syncopated funk groove: Ghost snares, syncopated kick
        if (step === 0 || step === 6 || step === 10) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (complexity === 'busy' && (step === 7 || step === 15)) {
          playSnare = true;
          velocity = 0.4; // Ghost snare
        }
        playHiHatClosed = true; // Continuous 16ths
        if (step === 2 || step === 10) playHiHatOpen = true;
        break;
      }

      case 'jazz': {
        // Jazz swing: Feathered kick, 2 & 4 hi-hat foot chick, ride/brush pattern
        if (step === 0 && complexity !== 'minimal') {
          playKick = true;
          velocity = 0.35; // Feathered
        }
        if (step === 4 || step === 12) {
          playHiHatClosed = true; // Pedal hat chick
        }
        // Ride pattern on 0, 4, 6, 8, 12, 14
        if (step === 0 || step === 4 || step === 6 || step === 8 || step === 12 || step === 14) {
          playPercExtra = 'shaker'; // Ride cymbal simulation
        }
        break;
      }

      case 'pop': {
        // Four on the floor kick or standard 2 & 4
        if (step % 4 === 0) playKick = true;
        if (step === 4 || step === 12) {
          playSnare = true;
          playPercExtra = 'clap';
        }
        if (step % 2 === 0) playHiHatClosed = true;
        break;
      }

      case 'bossa': {
        // Bossa nova: Dotted syncopated kick (0, 6, 8, 14), rimshot clave, constant 16th shaker
        if (step === 0 || step === 6 || step === 8 || step === 14) playKick = true;
        if (step === 0 || step === 3 || step === 6 || step === 10 || step === 12) playPercExtra = 'rimshot';
        playPercExtra = 'shaker';
        break;
      }

      case 'reggae': {
        // One-Drop: Kick and Snare strictly on beat 3 (step 8)
        if (step === 8) {
          playKick = true;
          playSnare = true;
          playPercExtra = 'rimshot';
        }
        if (step % 2 === 0) playHiHatClosed = true;
        if (step === 2 || step === 10) playHiHatOpen = true;
        break;
      }

      case 'lofi': {
        // Relaxed kick-snare groove with vinyl shaker
        if (step === 0 || step === 10) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (step % 2 === 0) playHiHatClosed = true;
        if (step === 6 && complexity === 'busy') playHiHatOpen = true;
        break;
      }

      case 'country': {
        // Train beat: Kick on 0 & 8, snappy snare ghost roll
        if (step === 0 || step === 8) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (step % 2 === 1) playHiHatClosed = true;
        break;
      }

      case 'neosoul': {
        // Laid back beat with rimshot and 808 clap
        if (step === 0 || step === 7 || step === 11) playKick = true;
        if (step === 4 || step === 12) {
          playPercExtra = 'rimshot';
          playPercExtra = 'clap';
        }
        if (step % 2 === 0) playHiHatClosed = true;
        break;
      }

      default: {
        if (step === 0 || step === 8) playKick = true;
        if (step === 4 || step === 12) playSnare = true;
        if (step % 2 === 0) playHiHatClosed = true;
      }
    }

    const bus = this.instrumentGains.percussion;
    if (!bus || !this.ctx) return;

    if (playKick || playSnare || playHiHatOpen || playHiHatClosed || playPercExtra) {
      this.queueVisualTrigger('percussion', time);
    }

    if (playKick) this.synthesizeKick(time, style, velocity, bus);
    if (playSnare) this.synthesizeSnare(time, style, velocity, bus);
    if (playHiHatOpen) this.synthesizeHiHat(time, true, style, velocity * 0.7, bus);
    else if (playHiHatClosed) this.synthesizeHiHat(time, false, style, velocity * 0.5, bus);
    if (playPercExtra) this.synthesizePercExtra(time, playPercExtra, style, velocity, bus);
  }

  private synthesizeKick(time: number, style: string, velocity: number, destination: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const is808 = style === 'electronic-808';
    const isVintage = style === 'vintage-kit';

    const startFreq = is808 ? 160 : isVintage ? 120 : 150;
    const endFreq = is808 ? 38 : isVintage ? 55 : 45;
    const decayDuration = is808 ? 0.35 : isVintage ? 0.16 : 0.12;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decayDuration);

    gain.gain.setValueAtTime(1.0 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayDuration + 0.05);

    // Transient click for punch
    if (!is808) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(400, time);
      clickOsc.frequency.exponentialRampToValueAtTime(80, time + 0.02);
      clickGain.gain.setValueAtTime(0.4 * velocity, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      clickOsc.connect(clickGain);
      clickGain.connect(destination);
      clickOsc.start(time);
      clickOsc.stop(time + 0.03);
    }
  }

  private synthesizeSnare(time: number, style: string, velocity: number, destination: AudioNode): void {
    if (!this.ctx) return;

    // 1. Tonal Body
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(185, time);
    toneOsc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    toneGain.gain.setValueAtTime(0.6 * velocity, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    toneOsc.connect(toneGain);
    toneGain.connect(destination);
    toneOsc.start(time);
    toneOsc.stop(time + 0.11);

    // 2. Snappy White Noise Rattle
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = style === 'vintage-kit' ? 1400 : 2200;
      bandpass.Q.value = 1.2;

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 800;

      const noiseGain = this.ctx.createGain();
      const snareDecay = style === 'jazz-brush' ? 0.22 : 0.15;
      noiseGain.gain.setValueAtTime(0.7 * velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snareDecay);

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(noiseGain);
      noiseGain.connect(destination);

      noiseSource.start(time);
      noiseSource.stop(time + snareDecay + 0.02);
    }
  }

  private synthesizeHiHat(time: number, isOpen: boolean, style: string, velocity: number, destination: AudioNode): void {
    if (!this.ctx || !this.noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = style === 'electronic-808' ? 8500 : 7000;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 2.0;

    const decayTime = isOpen ? 0.26 : 0.045;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    noiseSource.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(destination);

    noiseSource.start(time);
    noiseSource.stop(time + decayTime + 0.02);
  }

  private synthesizePercExtra(
    time: number,
    type: 'clap' | 'rimshot' | 'shaker',
    _style: string,
    velocity: number,
    destination: AudioNode
  ): void {
    if (!this.ctx) return;

    if (type === 'rimshot') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, time);
      osc.frequency.exponentialRampToValueAtTime(280, time + 0.03);
      gain.gain.setValueAtTime(0.8 * velocity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.05);
    } else if (type === 'clap' && this.noiseBuffer) {
      // 3 rapid micro pulses
      for (let i = 0; i < 3; i++) {
        const pulseTime = time + i * 0.012;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1500;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.4 * velocity, pulseTime);
        g.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.02);
        src.connect(bp);
        bp.connect(g);
        g.connect(destination);
        src.start(pulseTime);
        src.stop(pulseTime + 0.03);
      }
    } else if (type === 'shaker' && this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 6500;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.01, time);
      g.gain.linearRampToValueAtTime(0.25 * velocity, time + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      src.connect(bp);
      bp.connect(g);
      g.connect(destination);
      src.start(time);
      src.stop(time + 0.09);
    }
  }

  // =========================================================================
  // BASS GROOVES & SYNTHESIS
  // =========================================================================

  private scheduleBass(step: number, time: number, chord: ChordStep): void {
    const config = this.instruments.bass;
    const bus = this.instrumentGains.bass;
    if (!bus || !this.ctx) return;

    const rootOffset = ROOT_MIDI_MAP[chord.root] ?? 0;
    // Base root note in octave 1/2 (e.g., E1 = 28, A1 = 33, C2 = 36)
    const rootMidi = 36 + ((rootOffset - 0 + 12) % 12);
    const fifthMidi = rootMidi + 7;
    const octaveMidi = rootMidi + 12;

    const groove = this.bassGroove;
    let targetMidi: number | null = null;
    let duration = 0.25; // seconds

    const secondsPerBeat = 60.0 / this.bpm;

    switch (groove) {
      case 'root-sustain': {
        // Sustained note on beat 1 (step 0) and beat 3 (step 8)
        if (step === 0) {
          targetMidi = rootMidi;
          duration = secondsPerBeat * 2.0;
        } else if (step === 8) {
          targetMidi = rootMidi;
          duration = secondsPerBeat * 1.8;
        }
        break;
      }

      case 'driving-eighths': {
        // Driving 8th notes (steps 0, 2, 4, 6, 8, 10, 12, 14)
        if (step % 2 === 0) {
          targetMidi = step === 6 || step === 14 ? fifthMidi : rootMidi;
          duration = (secondsPerBeat / 2) * 0.85;
        }
        break;
      }

      case 'root-fifth': {
        // Alternating Root on 1, Fifth on 3 (country / pop)
        if (step === 0) {
          targetMidi = rootMidi;
          duration = secondsPerBeat * 0.9;
        } else if (step === 8) {
          targetMidi = fifthMidi;
          duration = secondsPerBeat * 0.9;
        }
        break;
      }

      case 'walking': {
        // Jazz / Blues walking bass on each quarter beat (steps 0, 4, 8, 12)
        if (step === 0) targetMidi = rootMidi;
        else if (step === 4) targetMidi = rootMidi + (chord.quality.includes('min') ? 3 : 4); // 3rd
        else if (step === 8) targetMidi = fifthMidi;
        else if (step === 12) targetMidi = fifthMidi + 2; // passing tone
        duration = secondsPerBeat * 0.85;
        break;
      }

      case 'syncopated-funk': {
        // Funk syncopated bass line: 0, 6, 10, 14
        if (step === 0) {
          targetMidi = rootMidi;
          duration = secondsPerBeat * 0.4;
        } else if (step === 6) {
          targetMidi = octaveMidi;
          duration = secondsPerBeat * 0.3;
        } else if (step === 10) {
          targetMidi = rootMidi;
          duration = secondsPerBeat * 0.35;
        } else if (step === 14) {
          targetMidi = fifthMidi;
          duration = secondsPerBeat * 0.35;
        }
        break;
      }
    }

    if (targetMidi !== null) {
      this.queueVisualTrigger('bass', time);
      this.synthesizeBassVoice(time, midiToFreq(targetMidi), duration, config.style, bus);
    }
  }

  private synthesizeBassVoice(time: number, freq: number, duration: number, style: string, destination: AudioNode): void {
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const isSynthSub = style === 'synth-sub';
    const isSlap = style === 'slap-bass';
    const isMotown = style === 'motown-tube';

    osc1.type = isSynthSub ? 'sawtooth' : isMotown ? 'triangle' : 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    // Sub-octave osc for depth
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 0.5, time);

    filter.type = 'lowpass';
    const startCutoff = isSlap ? 3500 : isSynthSub ? 2200 : 1200;
    const endCutoff = isMotown ? 300 : 180;
    filter.frequency.setValueAtTime(startCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(endCutoff, time + Math.min(duration, 0.3));
    filter.Q.value = isSlap ? 6.0 : 2.5;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.85, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  }

  // =========================================================================
  // RHYTHM GUITAR / KEYS CHORD VOICING & STRUMMING
  // =========================================================================

  private scheduleGuitar(step: number, time: number, chord: ChordStep): void {
    const config = this.instruments.guitar;
    const bus = this.instrumentGains.guitar;
    if (!bus || !this.ctx) return;

    const style = this.strumStyle;
    const secondsPerBeat = 60.0 / this.bpm;

    let shouldStrum = false;
    let duration = secondsPerBeat * 0.8;
    let downstroke = true;

    switch (style) {
      case 'sustained': {
        if (step === 0) {
          shouldStrum = true;
          duration = secondsPerBeat * 3.8;
        }
        break;
      }

      case 'quarter-strum': {
        // Quarter note strums on beats 1, 2, 3, 4
        if (step % 4 === 0) {
          shouldStrum = true;
          duration = secondsPerBeat * 0.8;
          downstroke = step === 0 || step === 8;
        }
        break;
      }

      case 'eighth-strum': {
        // 8th note rhythmic strumming
        if (step % 2 === 0) {
          shouldStrum = true;
          duration = (secondsPerBeat / 2) * 0.8;
          downstroke = step % 4 === 0;
        }
        break;
      }

      case 'funk-chank': {
        // Tight staccato 16th chops (steps 2, 6, 10, 14)
        if (step === 2 || step === 6 || step === 10 || step === 14) {
          shouldStrum = true;
          duration = 0.06; // ultra-short staccato
          downstroke = step === 2 || step === 10;
        }
        break;
      }

      case 'syncopated': {
        // Syncopated reggae / pop comping (e.g. upbeat steps 2, 6, 10, 14)
        if (step === 2 || step === 6 || step === 10 || step === 14) {
          shouldStrum = true;
          duration = secondsPerBeat * 0.35;
          downstroke = false;
        }
        break;
      }
    }

    if (shouldStrum) {
      this.queueVisualTrigger('guitar', time);
      const chordNotes = getChordNotes(chord.root, chord.quality);
      this.synthesizeGuitarStrum(time, chordNotes, duration, downstroke, config.style, bus);
    }
  }

  private synthesizeGuitarStrum(
    time: number,
    notes: { name: string; midi: number; freq: number }[],
    duration: number,
    downstroke: boolean,
    style: string,
    destination: AudioNode
  ): void {
    if (!this.ctx) return;

    // Micro-strum delay: 18ms spread across strings
    const stringDelay = 0.016;
    const orderedNotes = downstroke ? [...notes] : [...notes].reverse();

    const isAcoustic = style === 'acoustic-strum';
    const isFunk = style === 'funk-chank';
    const isRhodes = style === 'neo-rhodes';
    const isCrunch = style === 'rock-crunch';

    orderedNotes.forEach((note, idx) => {
      const noteTime = time + idx * stringDelay;
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      if (isRhodes) {
        osc.type = 'sine';
      } else if (isAcoustic) {
        osc.type = 'triangle';
      } else if (isCrunch) {
        osc.type = 'sawtooth';
      } else {
        osc.type = 'sawtooth';
      }

      osc.frequency.setValueAtTime(note.freq, noteTime);

      // Body Formant / Cabinet Filter
      filter.type = isAcoustic ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(isAcoustic ? 1800 : isFunk ? 2800 : isRhodes ? 1200 : 2200, noteTime);
      filter.Q.value = isAcoustic ? 1.0 : isCrunch ? 2.5 : 0.7;

      // Note envelope
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3 / Math.sqrt(notes.length), noteTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.05);
    });
  }

  // =========================================================================
  // SYNTH / AMBIENT PAD VOICING
  // =========================================================================

  private scheduleSynth(step: number, time: number, chord: ChordStep): void {
    const config = this.instruments.synth;
    const bus = this.instrumentGains.synth;
    if (!bus || !this.ctx) return;

    // Pad plays on bar downbeats (step 0)
    if (step === 0) {
      this.queueVisualTrigger('synth', time);
      const chordNotes = getChordNotes(chord.root, chord.quality);
      const secondsPerBeat = 60.0 / this.bpm;
      const duration = secondsPerBeat * 3.9;
      this.synthesizeSynthPad(time, chordNotes, duration, config.style, bus);
    }
  }

  private synthesizeSynthPad(
    time: number,
    notes: { name: string; midi: number; freq: number }[],
    duration: number,
    style: string,
    destination: AudioNode
  ): void {
    if (!this.ctx) return;

    const isGlass = style === 'dream-glass';
    const isBrass = style === 'synthwave-brass';
    const isOrgan = style === 'space-organ';

    notes.forEach((note) => {
      // Dual detuned oscillators for lush stereo width
      const oscA = this.ctx!.createOscillator();
      const oscB = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      oscA.type = isGlass ? 'sine' : isBrass ? 'sawtooth' : isOrgan ? 'triangle' : 'sawtooth';
      oscB.type = isGlass ? 'triangle' : isBrass ? 'sawtooth' : 'sawtooth';

      const detune = isGlass ? 4 : 8;
      oscA.frequency.setValueAtTime(note.freq, time);
      oscA.detune.setValueAtTime(-detune, time);

      oscB.frequency.setValueAtTime(note.freq, time);
      oscB.detune.setValueAtTime(detune, time);

      filter.type = 'lowpass';
      const cutoff = isGlass ? 2800 : isBrass ? 2200 : 1200;
      filter.frequency.setValueAtTime(cutoff * 0.7, time);
      filter.frequency.linearRampToValueAtTime(cutoff, time + 0.4);
      filter.frequency.exponentialRampToValueAtTime(cutoff * 0.6, time + duration);

      // Smooth pad envelope: 80ms attack, long sustain, smooth release
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.2 / Math.sqrt(notes.length), time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + duration + 0.08);
      oscB.stop(time + duration + 0.08);
    });
  }
}

export const backingTrackEngine = new BackingTrackEngine();
