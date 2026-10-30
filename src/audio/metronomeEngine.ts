/**
 * @file metronomeEngine.ts
 * @description High-precision Web Audio Metronome Engine with lookahead scheduling,
 * multiple acoustic and digital click profiles, count-in support, and synchronized visual events.
 */

export type MetronomeSound = 'beep' | 'woodblock' | 'rimshot' | 'cowbell';

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: 2 | 3 | 4 | 6;
  sound: MetronomeSound;
  volume: number; // 0 - 100
  currentBeat: number; // 1-indexed
  isAccent: boolean;
  countInActive: boolean;
  countInRemaining: number;
}

export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private outputGain: GainNode | null = null;

  private isRunning: boolean = false;
  private bpm: number = 120;
  private timeSignature: 2 | 3 | 4 | 6 = 4;
  private sound: MetronomeSound = 'woodblock';
  private volume: number = 80; // 0 - 100

  private currentBeat: number = 0; // 0-indexed internal
  private visualBeat: number = 1; // 1-indexed for UI display
  private visualAccent: boolean = true;
  private nextNoteTime: number = 0;
  private timerWorker: any = null;
  private lookaheadMs: number = 25.0; // Interval frequency
  private scheduleAheadTime: number = 0.1; // Schedule window in seconds

  // Count-in state
  private countInActive: boolean = false;
  private countInBeatsRemaining: number = 0;
  private countInTotalBeats: number = 0;
  private countInCompleteCb: (() => void) | null = null;

  // Listeners
  private onBeatCallbacks: Set<(beat: number, isAccent: boolean, time: number) => void> = new Set();
  private onStateChange: ((state: MetronomeState) => void) | null = null;

  public init(ctx: AudioContext, destination: AudioNode, onStateChange?: (state: MetronomeState) => void): void {
    this.ctx = ctx;
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = this.volume / 100;
    this.outputGain.connect(destination);
    this.notifyState();
  }

  public getState(): MetronomeState {
    return {
      isPlaying: this.isRunning,
      bpm: this.bpm,
      timeSignature: this.timeSignature,
      sound: this.sound,
      volume: this.volume,
      currentBeat: this.visualBeat,
      isAccent: this.visualAccent,
      countInActive: this.countInActive,
      countInRemaining: this.countInBeatsRemaining
    };
  }

  public setOnStateChange(cb: (state: MetronomeState) => void): void {
    this.onStateChange = cb;
    this.notifyState();
  }

  public addBeatListener(cb: (beat: number, isAccent: boolean, time: number) => void): () => void {
    this.onBeatCallbacks.add(cb);
    return () => {
      this.onBeatCallbacks.delete(cb);
    };
  }

  public async start(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {}
    }
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentBeat = 0;
    this.visualBeat = 1;
    this.visualAccent = true;
    this.nextNoteTime = (this.ctx ? this.ctx.currentTime : performance.now() / 1000) + 0.05;

    if (this.timerWorker) clearInterval(this.timerWorker);
    this.timerWorker = setInterval(() => this.scheduler(), this.lookaheadMs);
    this.notifyState();
  }

  public stop(): void {
    this.isRunning = false;
    this.countInActive = false;
    this.countInCompleteCb = null;
    if (this.timerWorker) {
      clearInterval(this.timerWorker);
      this.timerWorker = null;
    }
    this.currentBeat = 0;
    this.visualBeat = 1;
    this.visualAccent = true;
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
    this.bpm = Math.max(30, Math.min(280, Math.round(newBpm)));
    this.notifyState();
  }

  public setTimeSignature(ts: 2 | 3 | 4 | 6): void {
    this.timeSignature = ts;
    if (this.currentBeat >= ts) {
      this.currentBeat = 0;
    }
    this.notifyState();
  }

  public setSound(sound: MetronomeSound): void {
    this.sound = sound;
    this.notifyState();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.outputGain && this.ctx) {
      this.outputGain.gain.setTargetAtTime(this.volume / 100, this.ctx.currentTime, 0.02);
    }
    this.notifyState();
  }

  /**
   * Starts a count-in sequence (e.g. 1 bar). Once the count-in completes,
   * invokes onComplete (e.g. to initiate looper recording) and keeps the metronome running if requested.
   */
  public startCountIn(bars: number = 1, onComplete: () => void): void {
    if (!this.ctx) return;

    const totalBeats = bars * this.timeSignature;
    this.countInActive = true;
    this.countInTotalBeats = totalBeats;
    this.countInBeatsRemaining = totalBeats;
    this.countInCompleteCb = onComplete;

    if (!this.isRunning) {
      this.start();
    } else {
      this.notifyState();
    }
  }

  public cancelCountIn(): void {
    this.countInActive = false;
    this.countInCompleteCb = null;
    this.notifyState();
  }

  private scheduler(): void {
    const now = this.ctx ? this.ctx.currentTime : performance.now() / 1000;

    while (this.nextNoteTime < now + this.scheduleAheadTime) {
      const beat = this.currentBeat;
      const isAccent = beat === 0;
      const scheduledTime = this.nextNoteTime;

      if (this.ctx && this.outputGain) {
        try {
          this.scheduleClick(scheduledTime, isAccent);
        } catch {}
      }

      // Dispatch UI visual event via precise delta delay
      const delayMs = Math.max(0, (scheduledTime - now) * 1000);
      setTimeout(() => {
        if (!this.isRunning) return;

        this.visualBeat = beat + 1;
        this.visualAccent = isAccent;

        // Check Count-In step
        if (this.countInActive) {
          this.countInBeatsRemaining--;
          if (this.countInBeatsRemaining <= 0) {
            this.countInActive = false;
            const cb = this.countInCompleteCb;
            this.countInCompleteCb = null;
            if (cb) cb();
          }
        }

        this.onBeatCallbacks.forEach(cb => {
          try { cb(beat + 1, isAccent, scheduledTime); } catch {}
        });
        this.notifyState();
      }, delayMs);

      // Advance to next beat
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.timeSignature;
    }
  }

  private scheduleClick(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;

    switch (this.sound) {
      case 'beep':
        this.playBeep(time, isAccent);
        break;
      case 'woodblock':
        this.playWoodblock(time, isAccent);
        break;
      case 'rimshot':
        this.playRimshot(time, isAccent);
        break;
      case 'cowbell':
        this.playCowbell(time, isAccent);
        break;
      default:
        this.playWoodblock(time, isAccent);
        break;
    }
  }

  private playBeep(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isAccent ? 1760 : 880; // A6 vs A5
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.04);

    const amp = isAccent ? 0.9 : 0.6;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(gain);
    gain.connect(this.outputGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playWoodblock(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;

    const baseFreq = isAccent ? 1200 : 820;

    // Resonant bandpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, time);
    filter.Q.value = 14.0;

    // Fast triangle body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, time + 0.04);

    // Click transient
    const gain = this.ctx.createGain();
    const amp = isAccent ? 1.0 : 0.65;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputGain);

    osc.start(time);
    osc.stop(time + 0.045);
  }

  private playRimshot(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = isAccent ? 480 : 360;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.035);

    gain.gain.setValueAtTime(isAccent ? 0.9 : 0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.outputGain);

    osc.start(time);
    osc.stop(time + 0.045);
  }

  private playCowbell(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const f1 = isAccent ? 800 : 540;
    const f2 = isAccent ? 540 : 380;

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(f1, time);
    osc2.frequency.setValueAtTime(f2, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((f1 + f2) / 2, time);
    filter.Q.value = 5.0;

    gain.gain.setValueAtTime(isAccent ? 0.7 : 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.085);
    osc2.stop(time + 0.085);
  }

  private notifyState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  public dispose(): void {
    this.stop();
    if (this.outputGain) {
      try { this.outputGain.disconnect(); } catch {}
      this.outputGain = null;
    }
  }
}
