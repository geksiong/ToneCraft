/**
 * @file inputChannelRouter.ts
 * @description Intelligent Input Channel Router & Mono Source Detector.
 *
 * PURPOSE:
 * Microphones, guitar cables, and USB audio interfaces often connect mono instruments
 * (electric guitar, bass, dynamic microphone) into physical Input 1 (Left) or Input 2 (Right).
 * When these devices negotiate a 2-channel stereo stream with the OS/browser, Web Audio
 * defaults to keeping Input 1 on the Left speaker and silence on the Right speaker, resulting
 * in annoying one-ear headphone playback.
 *
 * This router:
 * 1. Analyzes incoming audio tracks and real-time per-channel signal energy (Input 1 vs. Input 2).
 * 2. Identifies mono input sources (single-channel stream, or multi-channel stream where one input is active).
 * 3. Intelligently routes/duplicates the mono guitar signal to BOTH output channels (Left and Right: L+R).
 * 4. Provides zero-latency, click-free matrix routing for Auto-Detect, Input 1 (Left), Input 2 (Right),
 *    Mono Sum, and Discrete Stereo.
 */

export type InputChannelRoutingMode = 'auto' | 'mono-ch1' | 'mono-ch2' | 'mono-sum' | 'stereo';
export type OutputChannelRoutingMode = 'stereo' | 'dual-mono';

export interface InputChannelTelemetry {
  sourceChannelCount: number; // 1 or 2
  detectedType: 'mono-ch1' | 'mono-ch2' | 'mono-single' | 'stereo' | 'silent';
  isMonoIdentified: boolean;
  routingMode: InputChannelRoutingMode;
  effectiveRouting: 'mono-ch1' | 'mono-ch2' | 'mono-single' | 'mono-sum' | 'stereo';
  ch1LevelDb: number;
  ch2LevelDb: number;
  description: string;
}

export class InputChannelRouter {
  private ctx: AudioContext | null = null;

  // Nodes
  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  // Routing Matrix Gains
  private ch1ToLeftGain: GainNode | null = null;
  private ch1ToRightGain: GainNode | null = null;
  private ch2ToLeftGain: GainNode | null = null;
  private ch2ToRightGain: GainNode | null = null;

  // Per-channel Analysers for Real-time Signal Identification
  private ch1Analyser: AnalyserNode | null = null;
  private ch2Analyser: AnalyserNode | null = null;
  private timeBuf1: Float32Array = new Float32Array(256);
  private timeBuf2: Float32Array = new Float32Array(256);

  // Router State
  public routingMode: InputChannelRoutingMode = 'auto';
  public outputMode: OutputChannelRoutingMode = 'stereo';
  private sourceChannelCount: number = 1;
  private detectedType: 'mono-ch1' | 'mono-ch2' | 'mono-single' | 'stereo' | 'silent' = 'mono-ch1';
  private effectiveRouting: 'mono-ch1' | 'mono-ch2' | 'mono-single' | 'mono-sum' | 'stereo' = 'mono-ch1';

  // Analysis Loop & Hysteresis
  private analysisTimer: any = null;
  private smoothedCh1Db: number = -100;
  private smoothedCh2Db: number = -100;
  private autoPreference: 'ch1' | 'ch2' | 'stereo' = 'ch1';

  // Telemetry Callback
  public onTelemetry: ((stats: InputChannelTelemetry) => void) | null = null;
  private lastTelemetryTime: number = 0;

  constructor() {}

  /**
   * Initializes the router audio graph.
   * Total latency: 0.00 ms (direct gain/merger routing).
   */
  public init(ctx: AudioContext): { input: GainNode; output: GainNode } {
    this.ctx = ctx;

    // Input node receives audio from mic or sample sources
    this.inputNode = ctx.createGain();
    this.inputNode.channelCount = 2;
    this.inputNode.channelCountMode = 'max';
    this.inputNode.channelInterpretation = 'discrete';

    // 2-Channel Splitter to separate Input 1 (Left) and Input 2 (Right)
    this.splitterNode = ctx.createChannelSplitter(2);
    this.inputNode.connect(this.splitterNode);

    // Monitoring Analysers
    this.ch1Analyser = ctx.createAnalyser();
    this.ch1Analyser.fftSize = 256;
    this.ch1Analyser.smoothingTimeConstant = 0.2;

    this.ch2Analyser = ctx.createAnalyser();
    this.ch2Analyser.fftSize = 256;
    this.ch2Analyser.smoothingTimeConstant = 0.2;

    this.splitterNode.connect(this.ch1Analyser, 0);
    this.splitterNode.connect(this.ch2Analyser, 1);

    // Matrix Gain Nodes for click-free routing
    this.ch1ToLeftGain = ctx.createGain();
    this.ch1ToRightGain = ctx.createGain();
    this.ch2ToLeftGain = ctx.createGain();
    this.ch2ToRightGain = ctx.createGain();

    this.splitterNode.connect(this.ch1ToLeftGain, 0);
    this.splitterNode.connect(this.ch1ToRightGain, 0);
    this.splitterNode.connect(this.ch2ToLeftGain, 1);
    this.splitterNode.connect(this.ch2ToRightGain, 1);

    // 2-Channel Merger to assemble Left (0) and Right (1) outputs
    this.mergerNode = ctx.createChannelMerger(2);

    this.ch1ToLeftGain.connect(this.mergerNode, 0, 0);
    this.ch2ToLeftGain.connect(this.mergerNode, 0, 0);

    this.ch1ToRightGain.connect(this.mergerNode, 0, 1);
    this.ch2ToRightGain.connect(this.mergerNode, 0, 1);

    // Output node (2-channel stereo with L+R populated)
    this.outputNode = ctx.createGain();
    this.outputNode.channelCount = 2;
    this.outputNode.channelCountMode = 'explicit';
    this.outputNode.channelInterpretation = 'speakers';

    this.mergerNode.connect(this.outputNode);

    // Apply initial routing gains
    this.applyRouting();

    // Start real-time signal analysis & mono identification loop
    this.startAnalysisLoop();

    return { input: this.inputNode, output: this.outputNode };
  }

  /**
   * Informs router of the native channel count of the connected source stream
   */
  public setSourceChannelCount(count: number): void {
    this.sourceChannelCount = Math.max(1, Math.min(2, count));
    this.updateEffectiveRouting();
  }

  /**
   * Sets the routing mode ('auto', 'mono-ch1', 'mono-ch2', 'mono-sum', 'stereo')
   */
  public setRoutingMode(mode: InputChannelRoutingMode): void {
    this.routingMode = mode;
    this.updateEffectiveRouting();
    try {
      localStorage.setItem('tonecraft_input_routing', mode);
    } catch {}
  }

  /**
   * Sets output distribution mode ('stereo' or 'dual-mono')
   */
  public setOutputMode(mode: OutputChannelRoutingMode): void {
    this.outputMode = mode;
    try {
      localStorage.setItem('tonecraft_output_routing', mode);
    } catch {}
  }

  private updateEffectiveRouting(): void {
    if (!this.ctx) return;

    if (this.routingMode === 'auto') {
      if (this.sourceChannelCount === 1) {
        this.effectiveRouting = 'mono-single';
      } else {
        // Auto-detect based on measured channel energy
        if (this.autoPreference === 'ch2') {
          this.effectiveRouting = 'mono-ch2';
        } else if (this.autoPreference === 'stereo') {
          this.effectiveRouting = 'stereo';
        } else {
          this.effectiveRouting = 'mono-ch1';
        }
      }
    } else {
      this.effectiveRouting = this.routingMode as any;
    }

    this.applyRouting();
  }

  private applyRouting(): void {
    if (!this.ctx || !this.ch1ToLeftGain || !this.ch1ToRightGain || !this.ch2ToLeftGain || !this.ch2ToRightGain) return;
    const now = this.ctx.currentTime;
    const rampSec = 0.02; // 20ms click-free crossfade

    switch (this.effectiveRouting) {
      case 'mono-single':
      case 'mono-ch1':
        // Route Channel 1 to BOTH Left and Right outputs
        this.ch1ToLeftGain.gain.setTargetAtTime(1.0, now, rampSec);
        this.ch1ToRightGain.gain.setTargetAtTime(1.0, now, rampSec);
        this.ch2ToLeftGain.gain.setTargetAtTime(0.0, now, rampSec);
        this.ch2ToRightGain.gain.setTargetAtTime(0.0, now, rampSec);
        break;

      case 'mono-ch2':
        // Route Channel 2 to BOTH Left and Right outputs
        this.ch1ToLeftGain.gain.setTargetAtTime(0.0, now, rampSec);
        this.ch1ToRightGain.gain.setTargetAtTime(0.0, now, rampSec);
        this.ch2ToLeftGain.gain.setTargetAtTime(1.0, now, rampSec);
        this.ch2ToRightGain.gain.setTargetAtTime(1.0, now, rampSec);
        break;

      case 'mono-sum':
        // Blend Ch 1 and Ch 2 equally to both Left and Right outputs
        this.ch1ToLeftGain.gain.setTargetAtTime(0.5, now, rampSec);
        this.ch1ToRightGain.gain.setTargetAtTime(0.5, now, rampSec);
        this.ch2ToLeftGain.gain.setTargetAtTime(0.5, now, rampSec);
        this.ch2ToRightGain.gain.setTargetAtTime(0.5, now, rampSec);
        break;

      case 'stereo':
      default:
        // Discrete stereo pass-through (Ch 1 -> Left, Ch 2 -> Right)
        this.ch1ToLeftGain.gain.setTargetAtTime(1.0, now, rampSec);
        this.ch1ToRightGain.gain.setTargetAtTime(0.0, now, rampSec);
        this.ch2ToLeftGain.gain.setTargetAtTime(0.0, now, rampSec);
        this.ch2ToRightGain.gain.setTargetAtTime(1.0, now, rampSec);
        break;
    }
  }

  /**
   * Real-time analysis loop (~25 Hz):
   * 1. Measures input signal level (RMS) on Input 1 and Input 2 separately.
   * 2. Detects whether incoming signal is mono (Ch 1 active, Ch 2 active, or 1-channel mono).
   * 3. Adjusts auto-routing and emits telemetry.
   */
  private startAnalysisLoop(): void {
    if (this.analysisTimer) clearInterval(this.analysisTimer);

    this.analysisTimer = setInterval(() => {
      if (!this.ctx || !this.ch1Analyser || !this.ch2Analyser) return;

      // 1. Measure Channel 1 (Left / Input 1)
      this.ch1Analyser.getFloatTimeDomainData(this.timeBuf1 as any);
      let sumSq1 = 0;
      for (let i = 0; i < this.timeBuf1.length; i++) {
        const s = this.timeBuf1[i];
        sumSq1 += s * s;
      }
      const rms1 = Math.sqrt(sumSq1 / this.timeBuf1.length);
      const instantDb1 = rms1 > 1e-5 ? 20 * Math.log10(rms1) : -100;
      this.smoothedCh1Db = this.smoothedCh1Db * 0.75 + instantDb1 * 0.25;

      // 2. Measure Channel 2 (Right / Input 2)
      this.ch2Analyser.getFloatTimeDomainData(this.timeBuf2 as any);
      let sumSq2 = 0;
      for (let i = 0; i < this.timeBuf2.length; i++) {
        const s = this.timeBuf2[i];
        sumSq2 += s * s;
      }
      const rms2 = Math.sqrt(sumSq2 / this.timeBuf2.length);
      const instantDb2 = rms2 > 1e-5 ? 20 * Math.log10(rms2) : -100;
      this.smoothedCh2Db = this.smoothedCh2Db * 0.75 + instantDb2 * 0.25;

      const ch1Active = this.smoothedCh1Db > -58;
      const ch2Active = this.smoothedCh2Db > -58;

      // 3. Identification Logic
      let detected: 'mono-ch1' | 'mono-ch2' | 'mono-single' | 'stereo' | 'silent' = 'silent';

      if (this.sourceChannelCount === 1) {
        detected = 'mono-single';
      } else if (ch1Active && !ch2Active) {
        // Channel 1 has guitar signal, Channel 2 is quiet/unconnected
        detected = 'mono-ch1';
      } else if (ch2Active && !ch1Active) {
        // Channel 2 has guitar signal, Channel 1 is quiet/unconnected
        detected = 'mono-ch2';
      } else if (ch1Active && ch2Active) {
        // Both channels have audio: check if one dominates by > 12 dB
        const diff = this.smoothedCh1Db - this.smoothedCh2Db;
        if (diff > 12) {
          detected = 'mono-ch1';
        } else if (diff < -12) {
          detected = 'mono-ch2';
        } else {
          detected = 'stereo';
        }
      } else {
        // Both silent: preserve last active detection or default to Ch 1
        detected = this.autoPreference === 'ch2' ? 'mono-ch2' : 'mono-ch1';
      }

      this.detectedType = detected;

      // 4. Update auto preference with hysteresis (prevents flutter during rests)
      if (this.routingMode === 'auto') {
        let changed = false;
        if (detected === 'mono-ch2' && this.autoPreference !== 'ch2') {
          this.autoPreference = 'ch2';
          changed = true;
        } else if (detected === 'mono-ch1' && this.autoPreference !== 'ch1') {
          this.autoPreference = 'ch1';
          changed = true;
        } else if (detected === 'stereo' && this.autoPreference !== 'stereo') {
          this.autoPreference = 'stereo';
          changed = true;
        }

        if (changed) {
          this.updateEffectiveRouting();
        }
      }

      // 5. Emit Telemetry (throttled to ~80ms)
      const nowMs = performance.now();
      if (this.onTelemetry && nowMs - this.lastTelemetryTime >= 80) {
        this.lastTelemetryTime = nowMs;

        const isMono = this.effectiveRouting !== 'stereo';
        let desc = '';
        if (this.effectiveRouting === 'mono-single') {
          desc = 'Mono Source (1-Ch) ➔ Routed to Both Channels (L+R)';
        } else if (this.effectiveRouting === 'mono-ch1') {
          desc = 'Mono Source (Input 1 / Left) ➔ Routed to Both Channels (L+R)';
        } else if (this.effectiveRouting === 'mono-ch2') {
          desc = 'Mono Source (Input 2 / Right) ➔ Routed to Both Channels (L+R)';
        } else if (this.effectiveRouting === 'mono-sum') {
          desc = 'Mono Sum (Ch 1 + Ch 2) ➔ Routed to Both Channels (L+R)';
        } else {
          desc = 'Stereo Source ➔ Discrete Stereo (Ch 1 ➔ L, Ch 2 ➔ R)';
        }

        this.onTelemetry({
          sourceChannelCount: this.sourceChannelCount,
          detectedType: this.detectedType,
          isMonoIdentified: isMono,
          routingMode: this.routingMode,
          effectiveRouting: this.effectiveRouting,
          ch1LevelDb: Math.round(this.smoothedCh1Db),
          ch2LevelDb: Math.round(this.smoothedCh2Db),
          description: desc
        });
      }
    }, 40); // 25 Hz
  }

  public dispose(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    try { this.inputNode?.disconnect(); } catch {}
    try { this.outputNode?.disconnect(); } catch {}
    try { this.splitterNode?.disconnect(); } catch {}
    try { this.mergerNode?.disconnect(); } catch {}
    try { this.ch1ToLeftGain?.disconnect(); } catch {}
    try { this.ch1ToRightGain?.disconnect(); } catch {}
    try { this.ch2ToLeftGain?.disconnect(); } catch {}
    try { this.ch2ToRightGain?.disconnect(); } catch {}
  }
}
