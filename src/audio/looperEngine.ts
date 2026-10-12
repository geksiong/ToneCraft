/**
 * @file looperEngine.ts
 * @description Multi-track phrase looper processor for guitar and bass.
 *
 * HOW THE LOOPER WORKS:
 * 1. Recording Stage:
 *    When the user engages REC, a ScriptProcessor tap captures raw audio chunks
 *    from the cabinet stage output into an array of Float32Array buffers.
 * 2. Loop Finalization:
 *    When REC is tapped again, the chunks are stitched into a continuous AudioBuffer.
 *    The loop length is calculated and seamlessly looped using an AudioBufferSourceNode.
 * 3. Overdubbing:
 *    During overdub, the original buffer is cloned to an Undo snapshot buffer.
 *    New recorded chunks are mixed on top of the base audio buffer:
 *    baseSample[i] = clamp(baseSample[i] + overdubSample[i] * 0.8, -1.0, 1.0).
 * 4. Half Speed (0.5x):
 *    Modulates AudioBufferSourceNode.playbackRate.value = 0.5.
 * 5. Reverse:
 *    Inverts the order of samples in the AudioBuffer channels using Array.prototype.reverse().
 * 6. Visual Progress:
 *    A lightweight interval tracks the elapsed time against loop duration, feeding
 *    the circular progress indicator in the UI.
 */

import { LooperState } from '../types/pedal';

export class LooperEngine {
  private ctx: AudioContext | null = null;
  public outputGain: GainNode | null = null;
  private recordNode: ScriptProcessorNode | null = null;
  private playbackSource: AudioBufferSourceNode | null = null;
  private recordTapNode: GainNode | null = null;

  private state: LooperState = {
    status: 'idle',
    speed: 1.0,
    reverse: false,
    volume: 85,
    duration: 0,
    currentTime: 0,
    layersCount: 0,
    hasUndo: false
  };

  private buffer: AudioBuffer | null = null;
  private undoBuffer: AudioBuffer | null = null;
  private recordedChunks: Float32Array[] = [];
  private progressInterval: any = null;
  private onStateChange: ((state: LooperState) => void) | null = null;

  public init(ctx: AudioContext, onStateChange: (state: LooperState) => void): GainNode {
    this.ctx = ctx;
    this.onStateChange = onStateChange;

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = this.state.volume / 100;

    this.recordTapNode = ctx.createGain();
    this.recordTapNode.gain.value = 1.0;

    return this.outputGain;
  }

  /**
   * Provides the node that feeds into the looper recording tap
   */
  public getRecordTapNode(): GainNode {
    if (!this.recordTapNode) throw new Error('LooperEngine not initialized');
    return this.recordTapNode;
  }

  public getState(): LooperState {
    return { ...this.state };
  }

  /**
   * Toggles Record / Set Loop / Overdub / Finish Dub
   */
  public toggleRecord(): void {
    if (!this.ctx || !this.recordTapNode) return;

    if (this.state.status === 'idle') {
      this.startRecording(false);
    } else if (this.state.status === 'recording') {
      this.finishRecording(false);
    } else if (this.state.status === 'playing') {
      this.startRecording(true);
    } else if (this.state.status === 'overdubbing') {
      this.finishRecording(true);
    }
  }

  /**
   * Toggles playback on and off
   */
  public togglePlayStop(): void {
    if (this.state.status === 'playing' || this.state.status === 'overdubbing') {
      this.stop();
    } else if (this.buffer) {
      this.play();
    }
  }

  /**
   * Clears all recorded loop data and resets the engine
   */
  public clear(): void {
    this.stop();
    this.buffer = null;
    this.undoBuffer = null;
    this.recordedChunks = [];
    this.state = {
      ...this.state,
      status: 'idle',
      duration: 0,
      currentTime: 0,
      layersCount: 0,
      hasUndo: false
    };
    this.notify();
  }

  /**
   * Reverts the most recent overdub layer from the undo buffer
   */
  public undo(): void {
    if (!this.undoBuffer) return;
    this.buffer = this.undoBuffer;
    this.undoBuffer = null;
    this.state.layersCount = Math.max(1, this.state.layersCount - 1);
    this.state.hasUndo = false;
    if (this.state.status === 'playing') {
      this.play();
    }
    this.notify();
  }

  /**
   * Inverts sample buffer order for psychedelic reverse playback
   */
  public toggleReverse(): void {
    this.state.reverse = !this.state.reverse;
    if (this.buffer) {
      for (let c = 0; c < this.buffer.numberOfChannels; c++) {
        this.buffer.getChannelData(c).reverse();
      }
      if (this.state.status === 'playing') {
        this.play();
      }
    }
    this.notify();
  }

  /**
   * Toggles playback rate between 1.0x and 0.5x half-speed
   */
  public toggleSpeed(): void {
    this.state.speed = this.state.speed === 1.0 ? 0.5 : 1.0;
    if (this.playbackSource) {
      this.playbackSource.playbackRate.value = this.state.speed;
    }
    this.notify();
  }

  /**
   * Sets looper playback volume (0 - 100)
   */
  public setVolume(vol: number): void {
    this.state.volume = vol;
    if (this.outputGain && this.ctx) {
      this.outputGain.gain.setTargetAtTime(vol / 100, this.ctx.currentTime, 0.02);
    }
    this.notify();
  }

  private startRecording(isOverdub: boolean): void {
    if (!this.ctx || !this.recordTapNode) return;

    this.recordedChunks = [];
    this.recordNode = this.ctx.createScriptProcessor(4096, 1, 1);

    this.recordNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.recordedChunks.push(copy);
    };

    this.recordTapNode.connect(this.recordNode);
    this.recordNode.connect(this.ctx.destination);

    this.state.status = isOverdub ? 'overdubbing' : 'recording';
    this.notify();
  }

  private finishRecording(isOverdub: boolean): void {
    if (!this.ctx || !this.recordTapNode || !this.recordNode) return;

    try {
      this.recordTapNode.disconnect(this.recordNode);
    } catch {}
    try {
      this.recordNode.disconnect();
    } catch {}
    this.recordNode = null;

    const totalSamples = this.recordedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    if (totalSamples === 0) return;

    const recordedData = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      recordedData.set(chunk, offset);
      offset += chunk.length;
    }

    if (isOverdub && this.buffer) {
      // Preserve snapshot for Undo
      this.undoBuffer = this.cloneBuffer(this.buffer);

      // Overdub mix onto base loop
      const baseData = this.buffer.getChannelData(0);
      const loopLen = baseData.length;
      for (let i = 0; i < totalSamples; i++) {
        const loopIdx = i % loopLen;
        baseData[loopIdx] = Math.max(-1, Math.min(1, baseData[loopIdx] + recordedData[i] * 0.8));
      }
      this.state.layersCount += 1;
      this.state.hasUndo = true;
    } else {
      // First base layer
      this.buffer = this.ctx.createBuffer(1, totalSamples, this.ctx.sampleRate);
      this.buffer.getChannelData(0).set(recordedData);
      this.state.duration = totalSamples / this.ctx.sampleRate;
      this.state.layersCount = 1;
      this.state.hasUndo = false;
    }

    this.play();
  }

  private play(): void {
    if (!this.ctx || !this.buffer || !this.outputGain) return;

    if (this.playbackSource) {
      try {
        this.playbackSource.stop();
        this.playbackSource.disconnect();
      } catch {}
    }

    this.playbackSource = this.ctx.createBufferSource();
    this.playbackSource.buffer = this.buffer;
    this.playbackSource.loop = true;
    this.playbackSource.playbackRate.value = this.state.speed;
    this.playbackSource.connect(this.outputGain);
    this.playbackSource.start(0);

    this.state.status = 'playing';
    this.startProgressTracker();
    this.notify();
  }

  private stop(): void {
    if (this.playbackSource) {
      try {
        this.playbackSource.stop();
        this.playbackSource.disconnect();
      } catch {}
      this.playbackSource = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.state.status = 'idle';
    this.state.currentTime = 0;
    this.notify();
  }

  private startProgressTracker(): void {
    if (this.progressInterval) clearInterval(this.progressInterval);
    const start = Date.now();
    this.progressInterval = setInterval(() => {
      if (this.state.status === 'playing' || this.state.status === 'overdubbing') {
        const effectiveDuration = (this.state.duration || 1) / this.state.speed;
        const elapsed = ((Date.now() - start) / 1000) % effectiveDuration;
        this.state.currentTime = elapsed;
        this.notify();
      }
    }, 50);
  }

  private cloneBuffer(src: AudioBuffer): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const clone = this.ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
    for (let c = 0; c < src.numberOfChannels; c++) {
      clone.getChannelData(c).set(src.getChannelData(c));
    }
    return clone;
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public dispose(): void {
    this.stop();
    if (this.progressInterval) clearInterval(this.progressInterval);
  }
}
