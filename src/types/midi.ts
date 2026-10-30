/**
 * @file midi.ts
 * @description Types and schemas for Web MIDI device support and action mapping in ToneCraft.
 */

export type MidiCommandType = 'cc' | 'note' | 'pc' | 'pitchbend';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  connection: 'open' | 'closed' | 'pending';
}

export type MidiActionTarget =
  // Pedal bypass toggle
  | { type: 'pedal_toggle'; slotIndex: number; pedalName?: string }
  // Pedal parameter control (continuous 0-100 or specific knob)
  | { type: 'pedal_param'; slotIndex: number; paramKey: string; paramLabel?: string; pedalName?: string }
  // Preset switching
  | { type: 'preset_next' }
  | { type: 'preset_prev' }
  | { type: 'preset_index'; presetIndex: number; presetName?: string }
  | { type: 'preset_id'; presetId: string; presetName?: string }
  // Performance & Rig
  | { type: 'master_volume' }
  | { type: 'input_gain' }
  | { type: 'master_mute' }
  | { type: 'bypass_all' }
  | { type: 'tap_tempo' }
  | { type: 'tuner_toggle' }
  | { type: 'dsp_power' }
  // Amp controls
  | { type: 'amp_param'; paramKey: 'gain' | 'bass' | 'mid' | 'treble' | 'presence' | 'master' | 'bypassed' }
  // Cab controls
  | { type: 'cab_param'; paramKey: 'micDistance' | 'highCut' | 'lowCut' | 'bypassed' }
  // Looper controls
  | { type: 'looper_cmd'; command: 'record' | 'play' | 'clear' | 'undo' | 'reverse' | 'speed' | 'volume' }
  | { type: 'looper_track_cmd'; trackIndex: number; command: 'record' | 'play' | 'mute' | 'solo' | 'clear' }
  | { type: 'metronome_toggle' };

export interface MidiMapping {
  id: string;
  name: string;
  enabled: boolean;
  channel: number; // 0 for Omni (any channel), 1-16 for specific MIDI channel
  commandType: MidiCommandType;
  controlNumber: number; // CC# (0-127), Note# (0-127), or PC Program# (0-127)
  target: MidiActionTarget;
  invert?: boolean; // Invert value: 0 -> 127 becomes 127 -> 0
  minVal?: number; // Custom target scale minimum (default 0)
  maxVal?: number; // Custom target scale maximum (default 100)
  triggerMode?: 'toggle' | 'momentary' | 'value'; // For footswitches
}

export interface MidiLiveMessage {
  timestamp: number;
  channel: number; // 1-16
  type: 'cc' | 'noteOn' | 'noteOff' | 'pc' | 'pitchbend' | 'other';
  number: number; // CC number, Note number, Program number
  value: number; // CC value (0-127), Velocity (0-127), Pitchbend (-8192 to 8191)
  rawHex: string;
  description: string;
}

export interface MidiTemplate {
  id: string;
  name: string;
  description: string;
  mappings: MidiMapping[];
}
