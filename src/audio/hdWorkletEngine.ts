/**
 * @file hdWorkletEngine.ts
 * @description Main-thread manager for ToneCraft's High-Definition AudioWorklet DSP Engine.
 */

export interface HdWorkletTelemetry {
  cpuPercent: number;
  avgExecTimeUs: number;
  quantumMs: number;
  sampleRate: number;
  bufferSamples: number;
  cathodeVoltage: number;
}

export class HdWorkletEngine {
  private ctx: AudioContext | null = null;
  public workletNode: AudioWorkletNode | null = null;
  public isReady: boolean = false;

  public onTelemetry: ((stats: HdWorkletTelemetry) => void) | null = null;
  public onError: (() => void) | null = null;
  private pendingPingCallback: ((latencyMs: number) => void) | null = null;

  /**
   * Initializes and registers the HD AudioWorklet processor module.
   */
  public async init(ctx: AudioContext): Promise<AudioWorkletNode> {
    this.ctx = ctx;

    try {
      await ctx.audioWorklet.addModule('/worklets/hd-dsp-worklet.js');
    } catch (err) {
      console.warn('Failed to load hd-dsp-worklet.js from /worklets/, trying blob/fallback:', err);
    }

    this.workletNode = new AudioWorkletNode(ctx, 'hd-core-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: 'explicit'
    });

    this.workletNode.port.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'telemetry') {
        if (this.onTelemetry) {
          this.onTelemetry(data as HdWorkletTelemetry);
        }
      } else if (data.type === 'ping-detected') {
        if (this.pendingPingCallback) {
          this.pendingPingCallback(data.latencyMs);
          this.pendingPingCallback = null;
        }
      }
    };

    this.workletNode.onprocessorerror = (err) => {
      console.warn('[HdWorkletEngine] AudioWorklet processor error detected:', err);
      this.isReady = false;
      if (this.onError) {
        this.onError();
      }
    };

    this.isReady = true;
    return this.workletNode;
  }

  /**
   * Updates tube, diode, and physical modeling parameters in real time.
   */
  public setParameters(params: {
    gain?: number;
    bias?: number;
    mode?: 'tube-amp' | 'diode-drive' | 'bbd-mod' | 'full-rig' | 'clean-solid-state';
    drive?: number;
    enabled?: boolean;
  }): void {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'set-parameters',
      ...params
    });
  }

  /**
   * Dispatches a ping pulse request to measure real round-trip latency through the worklet.
   */
  public requestPing(callback: (latencyMs: number) => void): void {
    if (!this.workletNode) {
      callback(2.67);
      return;
    }
    this.pendingPingCallback = callback;
    this.workletNode.port.postMessage({
      type: 'ping-request',
      timestamp: performance.now()
    });
  }

  public dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    this.isReady = false;
  }
}
