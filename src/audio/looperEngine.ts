/**
 * @file looperEngine.ts
 * @description Robust multi-track phrase looper engine supporting Basic Single-Track
 * and Pro 4-Track DAW phrase looping with individual track mute, solo, clear, record,
 * overdub, per-track volume, pan, and real-time waveform generation.
 */

import { LooperState, LooperTrackState } from '../types/pedal';

interface InternalTrack {
  id: string;
  name: string;
  status: 'idle' | 'recording' | 'playing' | 'overdubbing' | 'stopped';
  muted: boolean;
  soloed: boolean;
  volume: number; // 0 - 100
  pan: number; // -100 to +100
  duration: number;
  layersCount: number;
  hasUndo: boolean;
  buffer: AudioBuffer | null;
  undoBuffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  panNode: StereoPannerNode | null;
  waveformPreview: number[];
}

const DEFAULT_TRACK_NAMES = [
  'Track 1: Rhythm',
  'Track 2: Lead / Riff',
  'Track 3: Bassline',
  'Track 4: Texture'
];

export class LooperEngine {
  private ctx: AudioContext | null = null;
  public outputGain: GainNode | null = null;
  private recordTapNode: GainNode | null = null;
  private recordNode: ScriptProcessorNode | null = null;
  private silentSink: GainNode | null = null;

  private mode: 'basic' | 'pro' = 'basic';
  private speed: 1.0 | 0.5 = 1.0;
  private reverse: boolean = false;
  private masterVolume: number = 85; // 0 - 100
  private syncLock: boolean = true;
  private activeRecordingTrackIndex: number = 0;

  private tracks: InternalTrack[] = [];
  private recordedChunks: Float32Array[] = [];
  private progressInterval: any = null;
  private onStateChange: ((state: LooperState) => void) | null = null;

  // Global playback anchor timestamp for phase-locked multi-track synchronization
  private playbackAnchorTime: number = 0;

  constructor() {
    this.initTracks();
  }

  private initTracks(): void {
    this.tracks = [0, 1, 2, 3].map((idx) => ({
      id: `track-${idx + 1}`,
      name: DEFAULT_TRACK_NAMES[idx] || `Track ${idx + 1}`,
      status: 'idle',
      muted: false,
      soloed: false,
      volume: 85,
      pan: 0,
      duration: 0,
      layersCount: 0,
      hasUndo: false,
      buffer: null,
      undoBuffer: null,
      sourceNode: null,
      gainNode: null,
      panNode: null,
      waveformPreview: []
    }));
  }

  public setOnStateChange(cb: (state: LooperState) => void): void {
    this.onStateChange = cb;
    this.notify();
  }

  public init(ctx: AudioContext, onStateChange?: (state: LooperState) => void): GainNode {
    this.ctx = ctx;
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = this.masterVolume / 100;

    this.recordTapNode = ctx.createGain();
    this.recordTapNode.gain.value = 1.0;

    // Silent sink for ScriptProcessorNode so it processes without bleeding into audio output
    this.silentSink = ctx.createGain();
    this.silentSink.gain.value = 0.0;
    this.silentSink.connect(ctx.destination);

    // Initialize track audio routing nodes
    this.tracks.forEach((track) => {
      this.setupTrackNodes(track);
    });

    this.notify();
    return this.outputGain;
  }

  private setupTrackNodes(track: InternalTrack): void {
    if (!this.ctx || !this.outputGain) return;

    if (!track.gainNode) {
      track.gainNode = this.ctx.createGain();
      track.gainNode.gain.value = track.volume / 100;
    }

    try {
      if (!track.panNode && typeof this.ctx.createStereoPanner === 'function') {
        track.panNode = this.ctx.createStereoPanner();
        track.panNode.pan.value = track.pan / 100;
      }
    } catch {}

    try { track.gainNode.disconnect(); } catch {}

    if (track.panNode) {
      try { track.panNode.disconnect(); } catch {}
      try {
        track.gainNode.connect(track.panNode);
        track.panNode.connect(this.outputGain);
        return;
      } catch {}
    }

    try {
      track.gainNode.connect(this.outputGain);
    } catch {}
  }

  public getRecordTapNode(): GainNode {
    if (!this.recordTapNode) {
      if (this.ctx) {
        this.recordTapNode = this.ctx.createGain();
        this.recordTapNode.gain.value = 1.0;
      } else {
        throw new Error('LooperEngine not initialized with AudioContext');
      }
    }
    return this.recordTapNode;
  }

  public getState(): LooperState {
    const isAnyRecording = this.tracks.some(t => t.status === 'recording');
    const isAnyOverdubbing = this.tracks.some(t => t.status === 'overdubbing');
    const isAnyPlaying = this.tracks.some(t => t.status === 'playing');

    let overallStatus: 'idle' | 'recording' | 'playing' | 'overdubbing' = 'idle';
    if (isAnyRecording) overallStatus = 'recording';
    else if (isAnyOverdubbing) overallStatus = 'overdubbing';
    else if (isAnyPlaying) overallStatus = 'playing';

    // Master duration
    const masterDuration = this.getMasterDuration();

    // Elapsed progress
    const now = Date.now();
    const elapsedMaster = this.playbackAnchorTime > 0 ? (now - this.playbackAnchorTime) / 1000 : 0;

    let currentTime = 0;
    if (this.playbackAnchorTime > 0 && (overallStatus === 'playing' || overallStatus === 'overdubbing')) {
      if (masterDuration > 0) {
        const effectiveDuration = masterDuration / this.speed;
        currentTime = elapsedMaster % effectiveDuration;
      } else {
        currentTime = elapsedMaster;
      }
    }

    const primaryTrack = this.tracks[0];

    return {
      mode: this.mode,
      status: overallStatus,
      speed: this.speed,
      reverse: this.reverse,
      volume: this.masterVolume,
      duration: masterDuration,
      currentTime: isFinite(currentTime) ? currentTime : 0,
      layersCount: this.mode === 'basic' ? primaryTrack.layersCount : this.tracks.reduce((sum, t) => sum + (t.buffer ? t.layersCount : 0), 0),
      hasUndo: this.mode === 'basic' ? primaryTrack.hasUndo : this.tracks.some(t => t.hasUndo),
      activeTrackIndex: this.activeRecordingTrackIndex,
      syncLock: this.syncLock,
      tracks: this.tracks.map(t => {
        let currentPosition = 0;
        if (t.buffer && t.duration > 0 && (t.status === 'playing' || t.status === 'overdubbing') && this.playbackAnchorTime > 0) {
          const effectiveDur = t.duration / this.speed;
          currentPosition = (elapsedMaster % effectiveDur) * this.speed;
        }

        return {
          id: t.id,
          name: t.name,
          status: t.status,
          muted: t.muted,
          soloed: t.soloed,
          volume: t.volume,
          pan: t.pan,
          duration: t.duration,
          layersCount: t.layersCount,
          hasUndo: t.hasUndo,
          hasData: !!t.buffer,
          waveformPreview: t.waveformPreview,
          currentPosition: isFinite(currentPosition) ? currentPosition : 0
        };
      })
    };
  }

  private getMasterDuration(): number {
    if (this.tracks[0]?.duration > 0) {
      return this.tracks[0].duration;
    }
    for (const t of this.tracks) {
      if (t.duration > 0) return t.duration;
    }
    return 0;
  }

  // =========================================================================
  // MODE SELECTION
  // =========================================================================

  public setMode(newMode: 'basic' | 'pro'): void {
    this.mode = newMode;
    this.notify();
  }

  public toggleMode(): 'basic' | 'pro' {
    this.mode = this.mode === 'basic' ? 'pro' : 'basic';
    this.notify();
    return this.mode;
  }

  public setSyncLock(locked: boolean): void {
    this.syncLock = locked;
    this.notify();
  }

  public setActiveTrackIndex(idx: number): void {
    if (idx >= 0 && idx < this.tracks.length) {
      this.activeRecordingTrackIndex = idx;
      this.notify();
    }
  }

  // =========================================================================
  // BASIC MODE API (Operates on Track 0 for 100% backwards compatibility)
  // =========================================================================

  public toggleRecord(): void {
    const targetIdx = this.mode === 'basic' ? 0 : this.activeRecordingTrackIndex;
    this.toggleTrackRecord(targetIdx);
  }

  public togglePlayStop(): void {
    const hasAnyData = this.tracks.some(t => t.buffer !== null);
    if (!hasAnyData) return;

    const isPlaying = this.tracks.some(t => t.status === 'playing' || t.status === 'overdubbing');
    if (isPlaying) {
      this.stopAll();
    } else {
      this.playAll();
    }
  }

  public clear(): void {
    if (this.mode === 'basic') {
      this.clearTrack(0);
    } else {
      this.clearAll();
    }
  }

  public undo(): void {
    const targetIdx = this.mode === 'basic' ? 0 : this.activeRecordingTrackIndex;
    this.undoTrack(targetIdx);
  }

  public toggleReverse(): void {
    this.reverse = !this.reverse;
    this.tracks.forEach(track => {
      if (track.buffer) {
        for (let c = 0; c < track.buffer.numberOfChannels; c++) {
          track.buffer.getChannelData(c).reverse();
        }
      }
    });

    const isPlaying = this.tracks.some(t => t.status === 'playing');
    if (isPlaying) {
      this.playAll();
    }
    this.notify();
  }

  public toggleSpeed(): void {
    this.speed = this.speed === 1.0 ? 0.5 : 1.0;
    this.tracks.forEach(t => {
      if (t.sourceNode) {
        t.sourceNode.playbackRate.value = this.speed;
      }
    });
    this.notify();
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(100, vol));
    if (this.outputGain && this.ctx) {
      this.outputGain.gain.setTargetAtTime(this.masterVolume / 100, this.ctx.currentTime, 0.02);
    }
    this.notify();
  }

  // =========================================================================
  // PRO MULTI-TRACK MANAGEMENT API
  // =========================================================================

  public toggleTrackRecord(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;

    const track = this.tracks[trackIdx];
    this.activeRecordingTrackIndex = trackIdx;

    if (track.status === 'idle' || track.status === 'stopped') {
      this.startRecordingTrack(trackIdx, false);
    } else if (track.status === 'recording') {
      this.finishRecordingTrack(trackIdx, false);
    } else if (track.status === 'playing') {
      this.startRecordingTrack(trackIdx, true);
    } else if (track.status === 'overdubbing') {
      this.finishRecordingTrack(trackIdx, true);
    }
  }

  public toggleTrackPlay(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    if (!track.buffer) return;

    if (track.status === 'playing' || track.status === 'overdubbing') {
      this.stopTrackPlayback(track);
      track.status = 'stopped';

      // Check if any track is still active
      const anyActive = this.tracks.some(t => t.status === 'playing' || t.status === 'overdubbing' || t.status === 'recording');
      if (!anyActive) {
        this.stopProgressTracker();
        this.playbackAnchorTime = 0;
      }
    } else {
      if (this.playbackAnchorTime === 0) {
        this.playbackAnchorTime = Date.now();
      }
      this.startTrackPlayback(track);
      this.startProgressTracker();
    }
    this.notify();
  }

  public toggleTrackMute(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    track.muted = !track.muted;
    this.updateTrackGain(track);
    this.notify();
  }

  public toggleTrackSolo(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    track.soloed = !track.soloed;

    this.tracks.forEach(t => this.updateTrackGain(t));
    this.notify();
  }

  public clearTrack(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];

    this.stopTrackPlayback(track);
    track.buffer = null;
    track.undoBuffer = null;
    track.status = 'idle';
    track.duration = 0;
    track.layersCount = 0;
    track.hasUndo = false;
    track.waveformPreview = [];

    const anyActive = this.tracks.some(t => t.status === 'playing' || t.status === 'overdubbing' || t.status === 'recording');
    if (!anyActive) {
      this.stopProgressTracker();
      this.playbackAnchorTime = 0;
    }

    this.notify();
  }

  public undoTrack(trackIdx: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    if (!track.undoBuffer) return;

    track.buffer = track.undoBuffer;
    track.undoBuffer = null;
    track.layersCount = Math.max(1, track.layersCount - 1);
    track.hasUndo = false;
    track.waveformPreview = this.generateWaveformPreview(track.buffer);

    if (track.status === 'playing') {
      this.stopTrackPlayback(track);
      this.startTrackPlayback(track);
    }
    this.notify();
  }

  public setTrackVolume(trackIdx: number, vol: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    track.volume = Math.max(0, Math.min(100, vol));
    this.updateTrackGain(track);
    this.notify();
  }

  public setTrackPan(trackIdx: number, pan: number): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    const track = this.tracks[trackIdx];
    track.pan = Math.max(-100, Math.min(100, pan));
    if (track.panNode && this.ctx) {
      track.panNode.pan.setTargetAtTime(track.pan / 100, this.ctx.currentTime, 0.02);
    }
    this.notify();
  }

  public setTrackName(trackIdx: number, name: string): void {
    if (trackIdx < 0 || trackIdx >= this.tracks.length) return;
    this.tracks[trackIdx].name = name.trim() || `Track ${trackIdx + 1}`;
    this.notify();
  }

  public playAll(): void {
    if (!this.ctx) return;
    const playableTracks = this.tracks.filter(t => t.buffer !== null);
    if (playableTracks.length === 0) return;

    this.playbackAnchorTime = Date.now();

    playableTracks.forEach(t => {
      this.setupTrackNodes(t);
      this.startTrackPlayback(t);
    });

    this.startProgressTracker();
    this.notify();
  }

  public stopAll(): void {
    this.tracks.forEach(t => {
      this.stopTrackPlayback(t);
      if (t.buffer) {
        t.status = 'stopped';
      } else {
        t.status = 'idle';
      }
    });

    this.stopProgressTracker();
    this.playbackAnchorTime = 0;
    this.notify();
  }

  public clearAll(): void {
    this.stopAll();
    this.tracks.forEach((track, idx) => {
      track.buffer = null;
      track.undoBuffer = null;
      track.status = 'idle';
      track.duration = 0;
      track.layersCount = 0;
      track.hasUndo = false;
      track.waveformPreview = [];
      track.muted = false;
      track.soloed = false;
      track.volume = 85;
      track.pan = 0;
      track.name = DEFAULT_TRACK_NAMES[idx] || `Track ${idx + 1}`;
      this.updateTrackGain(track);
    });
    this.notify();
  }

  // =========================================================================
  // INTERNAL AUDIO PROCESSING & RECORDING
  // =========================================================================

  private startRecordingTrack(trackIdx: number, isOverdub: boolean): void {
    if (!this.ctx || !this.recordTapNode) {
      console.warn('[LooperEngine] Cannot record: AudioContext not ready');
      return;
    }

    const track = this.tracks[trackIdx];
    this.recordedChunks = [];

    try {
      this.recordNode = this.ctx.createScriptProcessor(4096, 1, 1);
    } catch (err) {
      console.error('[LooperEngine] Failed to create ScriptProcessorNode:', err);
      return;
    }

    this.recordNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.recordedChunks.push(copy);
    };

    try {
      this.recordTapNode.connect(this.recordNode);
      if (this.silentSink) {
        this.recordNode.connect(this.silentSink);
      } else {
        this.recordNode.connect(this.ctx.destination);
      }
    } catch (err) {
      console.error('[LooperEngine] Error connecting recordTapNode:', err);
    }

    track.status = isOverdub ? 'overdubbing' : 'recording';

    // If other tracks are already recorded and not playing, start them so performer can hear them
    const otherTracksWithData = this.tracks.filter((t, i) => i !== trackIdx && t.buffer !== null);
    const isAnyOtherPlaying = otherTracksWithData.some(t => t.status === 'playing');
    if (otherTracksWithData.length > 0 && !isAnyOtherPlaying) {
      this.playAll();
      track.status = isOverdub ? 'overdubbing' : 'recording';
    }

    if (!this.progressInterval) {
      if (this.playbackAnchorTime === 0) {
        this.playbackAnchorTime = Date.now();
      }
      this.startProgressTracker();
    }

    this.notify();
  }

  private finishRecordingTrack(trackIdx: number, isOverdub: boolean): void {
    const track = this.tracks[trackIdx];

    if (this.recordTapNode && this.recordNode) {
      try { this.recordTapNode.disconnect(this.recordNode); } catch {}
    }
    if (this.recordNode) {
      try { this.recordNode.disconnect(); } catch {}
      this.recordNode = null;
    }

    const totalSamples = this.recordedChunks.reduce((acc, chunk) => acc + chunk.length, 0);

    // If recording was tapped too quickly or yielded no samples, safely revert to idle
    if (totalSamples < 256) {
      track.status = track.buffer ? 'playing' : 'idle';
      this.notify();
      return;
    }

    const recordedData = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      recordedData.set(chunk, offset);
      offset += chunk.length;
    }

    if (!this.ctx) return;

    if (isOverdub && track.buffer) {
      track.undoBuffer = this.cloneBuffer(track.buffer);
      const baseData = track.buffer.getChannelData(0);
      const loopLen = baseData.length;

      for (let i = 0; i < totalSamples; i++) {
        const loopIdx = i % loopLen;
        baseData[loopIdx] = Math.max(-1, Math.min(1, baseData[loopIdx] + recordedData[i] * 0.8));
      }
      track.layersCount += 1;
      track.hasUndo = true;
      track.waveformPreview = this.generateWaveformPreview(track.buffer);
    } else {
      let targetSamples = totalSamples;

      // In Sync Lock mode, align with Master duration if Track 1 exists
      const masterDur = this.getMasterDuration();
      if (this.syncLock && masterDur > 0 && trackIdx !== 0) {
        const idealSamples = Math.round(masterDur * this.ctx.sampleRate);
        if (idealSamples > 0 && Math.abs(totalSamples - idealSamples) / idealSamples < 0.3) {
          targetSamples = idealSamples;
        }
      }

      const finalBuffer = this.ctx.createBuffer(1, targetSamples, this.ctx.sampleRate);
      const channelData = finalBuffer.getChannelData(0);

      if (targetSamples === totalSamples) {
        channelData.set(recordedData);
      } else if (targetSamples < totalSamples) {
        channelData.set(recordedData.subarray(0, targetSamples));
      } else {
        channelData.set(recordedData);
      }

      track.buffer = finalBuffer;
      track.duration = targetSamples / this.ctx.sampleRate;
      track.layersCount = 1;
      track.hasUndo = false;
      track.waveformPreview = this.generateWaveformPreview(finalBuffer);
    }

    this.playAll();
  }

  private startTrackPlayback(track: InternalTrack): void {
    if (!this.ctx || !track.buffer) return;

    this.setupTrackNodes(track);
    if (!track.gainNode) return;

    this.stopTrackPlayback(track);

    const source = this.ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.playbackRate.value = this.speed;

    source.connect(track.gainNode);

    const masterDuration = this.getMasterDuration();
    let startOffset = 0;
    if (this.playbackAnchorTime > 0 && masterDuration > 0 && track.duration > 0) {
      const effectiveDuration = masterDuration / this.speed;
      const elapsed = ((Date.now() - this.playbackAnchorTime) / 1000) % effectiveDuration;
      startOffset = (elapsed * this.speed) % track.duration;
      if (!isFinite(startOffset) || startOffset < 0) startOffset = 0;
    }

    try {
      source.start(0, Math.min(startOffset, Math.max(0, track.duration - 0.01)));
      track.sourceNode = source;
      track.status = 'playing';
    } catch (err) {
      console.warn('[LooperEngine] Error starting track playback:', err);
    }
  }

  private stopTrackPlayback(track: InternalTrack): void {
    if (track.sourceNode) {
      try {
        track.sourceNode.stop();
        track.sourceNode.disconnect();
      } catch {}
      track.sourceNode = null;
    }
  }

  private updateTrackGain(track: InternalTrack): void {
    if (!track.gainNode || !this.ctx) return;

    const isAnySoloed = this.tracks.some(t => t.soloed);

    let effectiveGain = 0;
    if (track.muted) {
      effectiveGain = 0;
    } else if (isAnySoloed) {
      effectiveGain = track.soloed ? track.volume / 100 : 0;
    } else {
      effectiveGain = track.volume / 100;
    }

    try {
      track.gainNode.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.02);
    } catch {}
  }

  private generateWaveformPreview(buffer: AudioBuffer, numPoints: number = 48): number[] {
    const rawData = buffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / numPoints);
    if (blockSize <= 0) return [];

    const preview: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, rawData.length);
      for (let j = start; j < end; j += 4) {
        const abs = Math.abs(rawData[j]);
        if (abs > max) max = abs;
      }
      preview.push(Math.max(0.08, Math.min(1.0, max)));
    }
    return preview;
  }

  private startProgressTracker(): void {
    if (this.progressInterval) clearInterval(this.progressInterval);
    if (this.playbackAnchorTime === 0) {
      this.playbackAnchorTime = Date.now();
    }

    this.progressInterval = setInterval(() => {
      const isAnyActive = this.tracks.some(t => t.status === 'playing' || t.status === 'overdubbing' || t.status === 'recording');
      if (isAnyActive) {
        this.notify();
      } else {
        this.stopProgressTracker();
        this.playbackAnchorTime = 0;
        this.notify();
      }
    }, 40);
  }

  private stopProgressTracker(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
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
      this.onStateChange(this.getState());
    }
  }

  public dispose(): void {
    this.stopAll();
    this.stopProgressTracker();
    this.tracks.forEach(track => {
      try { track.gainNode?.disconnect(); } catch {}
      try { track.panNode?.disconnect(); } catch {}
      track.gainNode = null;
      track.panNode = null;
    });
    if (this.silentSink) {
      try { this.silentSink.disconnect(); } catch {}
      this.silentSink = null;
    }
  }
}
