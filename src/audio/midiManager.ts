/**
 * @file midiManager.ts
 * @description Real-time Web MIDI hardware controller engine with auto-discovery,
 * MIDI Learn, CC/PC/Note routing, Virtual Controller support, and event dispatching.
 */

import {
  MidiCommandType,
  MidiDevice,
  MidiLiveMessage,
  MidiMapping,
  MidiActionTarget
} from '../types/midi';
import {
  getStoredMidiMappings,
  saveMidiMappingsToStorage
} from '../presets/defaultMidiMappings';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNoteToName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteName = NOTE_NAMES[noteNumber % 12];
  return `${noteName}${octave}`;
}

export type MidiActionCallback = (
  target: MidiActionTarget,
  value: number, // 0-127 or scaled
  rawMsg: MidiLiveMessage
) => void;

export type MidiActivityCallback = (msg: MidiLiveMessage) => void;
export type MidiDevicesChangeCallback = (devices: MidiDevice[]) => void;
export type MidiLearnCallback = (
  mappingId: string,
  detected: { channel: number; commandType: MidiCommandType; controlNumber: number }
) => void;

export class MidiManager {
  private static instance: MidiManager;

  public isSupported: boolean = false;
  public isConnected: boolean = false;
  public permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  public devices: MidiDevice[] = [];
  public mappings: MidiMapping[] = [];

  // Live monitor state
  public liveMessages: MidiLiveMessage[] = [];
  private maxLiveHistory = 30;

  // MIDI Learn state
  public learningMappingId: string | null = null;

  // Multi-subscriber callbacks (prevents clobbering between App and Settings modal)
  private activityListeners: Set<MidiActivityCallback> = new Set();
  private devicesChangeListeners: Set<MidiDevicesChangeCallback> = new Set();

  public onAction: MidiActionCallback | null = null;
  public onLearnCaptured: MidiLearnCallback | null = null;

  // Backwards-compatible single callback setters
  public set onActivity(cb: MidiActivityCallback | null) {
    this._legacyOnActivity = cb;
  }
  public get onActivity(): MidiActivityCallback | null {
    return this._legacyOnActivity;
  }
  private _legacyOnActivity: MidiActivityCallback | null = null;

  public set onDevicesChange(cb: MidiDevicesChangeCallback | null) {
    this._legacyOnDevicesChange = cb;
  }
  public get onDevicesChange(): MidiDevicesChangeCallback | null {
    return this._legacyOnDevicesChange;
  }
  private _legacyOnDevicesChange: MidiDevicesChangeCallback | null = null;

  private midiAccess: any = null;
  private boundInputs: Set<string> = new Set();
  private initPromise: Promise<boolean> | null = null;
  private stateChangeTimeout: any = null;
  private lastActivityEmitTime: number = 0;

  private constructor() {
    this.mappings = getStoredMidiMappings();
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  public subscribeActivity(cb: MidiActivityCallback): () => void {
    this.activityListeners.add(cb);
    return () => {
      this.activityListeners.delete(cb);
    };
  }

  public subscribeDevices(cb: MidiDevicesChangeCallback): () => void {
    this.devicesChangeListeners.add(cb);
    return () => {
      this.devicesChangeListeners.delete(cb);
    };
  }

  /**
   * Request Web MIDI access from the browser and attach event listeners safely
   */
  public async init(): Promise<boolean> {
    if (this.isConnected && this.midiAccess) {
      return true;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private async performInit(): Promise<boolean> {
    if (!this.isSupported) {
      this.permissionState = 'unsupported';
      return false;
    }

    try {
      // Standard W3C Web MIDI API request with 2000ms safety timeout race.
      // Prevents Chromium from hanging or freezing renderer process in iframes if permission dialog blocks
      const requestPromise = (navigator as any).requestMIDIAccess({ sysex: false });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Web MIDI request timed out')), 2000)
      );
      const access = await Promise.race([requestPromise, timeoutPromise]);
      this.midiAccess = access;
      this.permissionState = 'granted';
      this.isConnected = true;

      this.refreshDevices();

      // Debounce hot-plugging / state changes to avoid event floods when ports open
      access.onstatechange = () => {
        if (this.stateChangeTimeout) clearTimeout(this.stateChangeTimeout);
        this.stateChangeTimeout = setTimeout(() => {
          this.refreshDevices();
        }, 200);
      };

      return true;
    } catch (err: any) {
      this.permissionState = 'denied';
      this.isConnected = false;
      this.initPromise = null;
      return false;
    }
  }

  /**
   * Scan attached MIDI input devices and attach message listeners
   */
  public refreshDevices(): MidiDevice[] {
    if (!this.midiAccess) {
      if (this.devices.length > 0) {
        this.devices = [];
        this.notifyDevicesChange(this.devices);
      }
      return [];
    }

    const deviceList: MidiDevice[] = [];
    const inputs = this.midiAccess.inputs.values();

    for (const input of inputs) {
      deviceList.push({
        id: input.id,
        name: input.name || `MIDI Port ${input.id}`,
        manufacturer: input.manufacturer || 'Generic MIDI Device',
        state: input.state || 'connected',
        connection: input.connection || 'open'
      });

      // Bind listener if not yet bound
      if (!this.boundInputs.has(input.id)) {
        input.onmidimessage = (e: any) => this.handleMidiMessage(e);
        this.boundInputs.add(input.id);
      }
    }

    // Only notify if device list actually changed to prevent render loops
    const hasChanged =
      deviceList.length !== this.devices.length ||
      deviceList.some((d, idx) => {
        const prev = this.devices[idx];
        return !prev || prev.id !== d.id || prev.state !== d.state || prev.connection !== d.connection;
      });

    if (hasChanged) {
      this.devices = deviceList;
      this.notifyDevicesChange(this.devices);
    }

    return this.devices;
  }

  private notifyDevicesChange(devices: MidiDevice[]): void {
    if (this._legacyOnDevicesChange) {
      this._legacyOnDevicesChange(devices);
    }
    this.devicesChangeListeners.forEach(cb => {
      try { cb(devices); } catch {}
    });
  }

  /**
   * Core parser for incoming MIDI bytes
   */
  public handleMidiMessage(event: { data: Uint8Array; timeStamp?: number }): void {
    const data = event.data;
    if (!data || data.length < 1) return;

    const status = data[0];

    // CRITICAL: Filter out System Real-Time messages (0xF8 - 0xFF) and System Common (0xF0 - 0xF7).
    // Hardware MIDI controllers and DAWs send 0xF8 (Timing Clock) 24 times/quarter note (~48-100/sec)
    // and 0xFE (Active Sensing) every 300ms. Treating these as events pegs CPU at 100%.
    if (status >= 0xF0) {
      return;
    }

    const msgType = status & 0xF0;
    const channel = (status & 0x0F) + 1; // 1-16

    let type: 'cc' | 'noteOn' | 'noteOff' | 'pc' | 'pitchbend' | 'other' = 'other';
    let commandType: MidiCommandType = 'cc';
    let number = 0;
    let value = 0;
    let desc = '';

    if (msgType === 0xB0) {
      // Control Change (CC)
      type = 'cc';
      commandType = 'cc';
      number = data[1] ?? 0;
      value = data[2] ?? 0;
      desc = `CH ${channel} · CC #${number} (Val ${value})`;
    } else if (msgType === 0x90) {
      // Note On
      number = data[1] ?? 0;
      value = data[2] ?? 0;
      if (value === 0) {
        type = 'noteOff';
        commandType = 'note';
        desc = `CH ${channel} · Note Off ${midiNoteToName(number)} (#${number})`;
      } else {
        type = 'noteOn';
        commandType = 'note';
        desc = `CH ${channel} · Note On ${midiNoteToName(number)} (#${number}, Vel ${value})`;
      }
    } else if (msgType === 0x80) {
      // Note Off
      type = 'noteOff';
      commandType = 'note';
      number = data[1] ?? 0;
      value = data[2] ?? 0;
      desc = `CH ${channel} · Note Off ${midiNoteToName(number)} (#${number})`;
    } else if (msgType === 0xC0) {
      // Program Change
      type = 'pc';
      commandType = 'pc';
      number = data[1] ?? 0;
      value = 0;
      desc = `CH ${channel} · Program Change PC #${number}`;
    } else if (msgType === 0xE0) {
      // Pitch Bend
      type = 'pitchbend';
      commandType = 'pitchbend';
      const lsb = data[1] ?? 0;
      const msb = data[2] ?? 0;
      value = ((msb << 7) | lsb) - 8192;
      number = 0;
      desc = `CH ${channel} · Pitch Bend (${value})`;
    } else {
      desc = `CH ${channel} · Status 0x${status.toString(16).toUpperCase()}`;
    }

    const hexBytes = Array.from(data)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    const liveMsg: MidiLiveMessage = {
      timestamp: Date.now(),
      channel,
      type,
      number,
      value,
      rawHex: hexBytes,
      description: desc
    };

    // Store in live history
    this.liveMessages = [liveMsg, ...this.liveMessages.slice(0, this.maxLiveHistory - 1)];

    // Notify activity listeners with ~80ms throttle to prevent UI thread lockup on continuous CC sweeps
    const now = performance.now();
    if (now - this.lastActivityEmitTime >= 80 || type === 'noteOn' || type === 'pc') {
      this.lastActivityEmitTime = now;
      this.notifyActivity(liveMsg);
    }

    // Check if MIDI Learn is actively waiting for an input
    if (this.learningMappingId && (type === 'cc' || type === 'noteOn' || type === 'pc')) {
      const targetMappingId = this.learningMappingId;
      this.updateMapping(targetMappingId, {
        channel,
        commandType,
        controlNumber: number
      });

      if (this.onLearnCaptured) {
        this.onLearnCaptured(targetMappingId, { channel, commandType, controlNumber: number });
      }

      this.learningMappingId = null;
      return;
    }

    // Process matching action mappings
    this.dispatchMappedActions(liveMsg, commandType);
  }

  private notifyActivity(msg: MidiLiveMessage): void {
    if (this._legacyOnActivity) {
      this._legacyOnActivity(msg);
    }
    this.activityListeners.forEach(cb => {
      try { cb(msg); } catch {}
    });
  }

  /**
   * Match incoming MIDI command with stored user mappings and trigger actions
   */
  private dispatchMappedActions(msg: MidiLiveMessage, cmdType: MidiCommandType): void {
    if (!this.onAction) return;

    for (const map of this.mappings) {
      if (!map.enabled) continue;

      // Channel check: 0 is Omni (responds to any channel), otherwise exact match
      if (map.channel !== 0 && map.channel !== msg.channel) continue;

      // Command type check
      if (map.commandType !== cmdType) continue;

      // Control Number match (CC#, Note#, PC#)
      if (map.controlNumber !== msg.number) continue;

      // For Note messages: we only trigger on Note On (unless momentary mode is specified)
      if (cmdType === 'note') {
        if (msg.type !== 'noteOn') continue;
      }

      // Calculate scaled value
      let scaledVal = msg.value;
      const min = map.minVal !== undefined ? map.minVal : 0;
      const max = map.maxVal !== undefined ? map.maxVal : 100;

      if (cmdType === 'cc') {
        // Continuous normalized 0.0 - 1.0
        let norm = msg.value / 127;
        if (map.invert) {
          norm = 1.0 - norm;
        }
        scaledVal = min + norm * (max - min);
      }

      // Execute action callback
      this.onAction(map.target, scaledVal, msg);
    }
  }

  /**
   * Virtual MIDI message injector (for testing without physical hardware)
   */
  public simulateMidiMessage(
    channel: number,
    type: 'cc' | 'noteOn' | 'noteOff' | 'pc',
    number: number,
    value: number = 127
  ): void {
    let status = 0xB0;
    if (type === 'cc') {
      status = 0xB0 | ((channel - 1) & 0x0F);
    } else if (type === 'noteOn') {
      status = 0x90 | ((channel - 1) & 0x0F);
    } else if (type === 'noteOff') {
      status = 0x80 | ((channel - 1) & 0x0F);
    } else if (type === 'pc') {
      status = 0xC0 | ((channel - 1) & 0x0F);
    }

    const data = type === 'pc'
      ? new Uint8Array([status, number & 0x7F])
      : new Uint8Array([status, number & 0x7F, value & 0x7F]);

    this.handleMidiMessage({ data, timeStamp: performance.now() });
  }

  /**
   * Mapping management
   */
  public setMappings(newMappings: MidiMapping[]): void {
    this.mappings = newMappings;
    saveMidiMappingsToStorage(newMappings);
  }

  public updateMapping(id: string, partial: Partial<MidiMapping>): void {
    this.mappings = this.mappings.map(m => (m.id === id ? { ...m, ...partial } : m));
    saveMidiMappingsToStorage(this.mappings);
  }

  public addMapping(mapping: MidiMapping): void {
    this.mappings = [...this.mappings, mapping];
    saveMidiMappingsToStorage(this.mappings);
  }

  public removeMapping(id: string): void {
    this.mappings = this.mappings.filter(m => m.id !== id);
    saveMidiMappingsToStorage(this.mappings);
  }

  public startLearn(mappingId: string): void {
    this.learningMappingId = mappingId;
  }

  public stopLearn(): void {
    this.learningMappingId = null;
  }
}

export const midiManager = MidiManager.getInstance();
