/**
 * @file defaultMidiMappings.ts
 * @description Default MIDI mapping configurations, factory templates, and local storage helpers.
 */

import { MidiMapping, MidiTemplate } from '../types/midi';

export const DEFAULT_MIDI_MAPPINGS: MidiMapping[] = [
  // 1. Footswitches 1-4 for Stompbox toggles
  {
    id: 'map-pedal-1-toggle',
    name: 'Toggle Pedal 1 Bypass',
    enabled: true,
    channel: 0, // Omni
    commandType: 'cc',
    controlNumber: 20,
    target: { type: 'pedal_toggle', slotIndex: 0 }
  },
  {
    id: 'map-pedal-2-toggle',
    name: 'Toggle Pedal 2 Bypass',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 21,
    target: { type: 'pedal_toggle', slotIndex: 1 }
  },
  {
    id: 'map-pedal-3-toggle',
    name: 'Toggle Pedal 3 Bypass',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 22,
    target: { type: 'pedal_toggle', slotIndex: 2 }
  },
  {
    id: 'map-pedal-4-toggle',
    name: 'Toggle Pedal 4 Bypass',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 23,
    target: { type: 'pedal_toggle', slotIndex: 3 }
  },

  // 2. Preset Switching via Program Change (PC 0-7)
  {
    id: 'map-pc-preset-1',
    name: 'Preset 1 (PC 0)',
    enabled: true,
    channel: 0,
    commandType: 'pc',
    controlNumber: 0,
    target: { type: 'preset_index', presetIndex: 0 }
  },
  {
    id: 'map-pc-preset-2',
    name: 'Preset 2 (PC 1)',
    enabled: true,
    channel: 0,
    commandType: 'pc',
    controlNumber: 1,
    target: { type: 'preset_index', presetIndex: 1 }
  },
  {
    id: 'map-pc-preset-3',
    name: 'Preset 3 (PC 2)',
    enabled: true,
    channel: 0,
    commandType: 'pc',
    controlNumber: 2,
    target: { type: 'preset_index', presetIndex: 2 }
  },
  {
    id: 'map-pc-preset-4',
    name: 'Preset 4 (PC 3)',
    enabled: true,
    channel: 0,
    commandType: 'pc',
    controlNumber: 3,
    target: { type: 'preset_index', presetIndex: 3 }
  },
  {
    id: 'map-preset-prev-cc',
    name: 'Previous Preset',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 24,
    target: { type: 'preset_prev' }
  },
  {
    id: 'map-preset-next-cc',
    name: 'Next Preset',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 25,
    target: { type: 'preset_next' }
  },

  // 3. Expression Pedals & Continuous Controls
  {
    id: 'map-expr-pedal-1',
    name: 'Expression Pedal (Pedal 1 Drive/Gain)',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 1, // Standard MIDI CC #1 (Mod Wheel / Expression)
    target: { type: 'pedal_param', slotIndex: 0, paramKey: 'drive', paramLabel: 'Drive' },
    minVal: 0,
    maxVal: 100
  },
  {
    id: 'map-master-volume-cc',
    name: 'Master Volume (CC #7)',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 7, // Standard MIDI CC #7 (Channel Volume)
    target: { type: 'master_volume' },
    minVal: 0,
    maxVal: 100
  },
  {
    id: 'map-delay-time-cc',
    name: 'Delay Time / Parameter (CC #14)',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 14,
    target: { type: 'pedal_param', slotIndex: 2, paramKey: 'time', paramLabel: 'Time' },
    minVal: 10,
    maxVal: 1000
  },

  // 4. Utility Footswitches
  {
    id: 'map-tuner-toggle-cc',
    name: 'Chromatic Tuner Toggle',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 64, // Standard Sustain Pedal / Switch
    target: { type: 'tuner_toggle' }
  },
  {
    id: 'map-tap-tempo-cc',
    name: 'Tap Tempo',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 65,
    target: { type: 'tap_tempo' }
  },
  {
    id: 'map-mute-toggle-cc',
    name: 'Master Output Mute',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 66,
    target: { type: 'master_mute' }
  },
  {
    id: 'map-bypass-all-cc',
    name: 'All Pedals Bypass Toggle',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 67,
    target: { type: 'bypass_all' }
  },

  // 5. Tape Looper Footswitches
  {
    id: 'map-looper-rec-cc',
    name: 'Looper Record / Overdub',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 80,
    target: { type: 'looper_cmd', command: 'record' }
  },
  {
    id: 'map-looper-play-cc',
    name: 'Looper Play / Stop',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 81,
    target: { type: 'looper_cmd', command: 'play' }
  },
  {
    id: 'map-looper-undo-cc',
    name: 'Looper Undo Layer',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 82,
    target: { type: 'looper_cmd', command: 'undo' }
  },
  {
    id: 'map-looper-clear-cc',
    name: 'Looper Clear All',
    enabled: true,
    channel: 0,
    commandType: 'cc',
    controlNumber: 83,
    target: { type: 'looper_cmd', command: 'clear' }
  }
];

export const MIDI_TEMPLATES: MidiTemplate[] = [
  {
    id: 'tonecraft-standard',
    name: 'ToneCraft Standard Stomp & Rig',
    description: 'CC 20-23 toggles pedals 1-4, CC 1 expression, CC 7 volume, PC 0-7 preset select, CC 64 tuner, CC 80-83 looper.',
    mappings: DEFAULT_MIDI_MAPPINGS
  },
  {
    id: 'fcb1010-floorboard',
    name: 'Behringer FCB1010 / Morningstar MC6',
    description: 'Switches 1-5 for Presets PC 0-4, Switches 6-9 for Stomp toggles CC 20-23, Exp A (CC 7 Master Vol), Exp B (CC 1 Wah/Drive).',
    mappings: [
      {
        id: 'fcb-pc-1',
        name: 'Preset 1',
        enabled: true,
        channel: 0,
        commandType: 'pc',
        controlNumber: 0,
        target: { type: 'preset_index', presetIndex: 0 }
      },
      {
        id: 'fcb-pc-2',
        name: 'Preset 2',
        enabled: true,
        channel: 0,
        commandType: 'pc',
        controlNumber: 1,
        target: { type: 'preset_index', presetIndex: 1 }
      },
      {
        id: 'fcb-pc-3',
        name: 'Preset 3',
        enabled: true,
        channel: 0,
        commandType: 'pc',
        controlNumber: 2,
        target: { type: 'preset_index', presetIndex: 2 }
      },
      {
        id: 'fcb-pc-4',
        name: 'Preset 4',
        enabled: true,
        channel: 0,
        commandType: 'pc',
        controlNumber: 3,
        target: { type: 'preset_index', presetIndex: 3 }
      },
      {
        id: 'fcb-sw-6',
        name: 'Toggle Stomp 1',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 20,
        target: { type: 'pedal_toggle', slotIndex: 0 }
      },
      {
        id: 'fcb-sw-7',
        name: 'Toggle Stomp 2',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 21,
        target: { type: 'pedal_toggle', slotIndex: 1 }
      },
      {
        id: 'fcb-sw-8',
        name: 'Toggle Stomp 3',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 22,
        target: { type: 'pedal_toggle', slotIndex: 2 }
      },
      {
        id: 'fcb-sw-9',
        name: 'Toggle Stomp 4',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 23,
        target: { type: 'pedal_toggle', slotIndex: 3 }
      },
      {
        id: 'fcb-exp-a',
        name: 'Exp A: Master Volume',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 7,
        target: { type: 'master_volume' },
        minVal: 0,
        maxVal: 100
      },
      {
        id: 'fcb-exp-b',
        name: 'Exp B: Pedal 1 Drive',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 1,
        target: { type: 'pedal_param', slotIndex: 0, paramKey: 'drive' },
        minVal: 0,
        maxVal: 100
      }
    ]
  },
  {
    id: 'nanokontrol-desk',
    name: 'Korg nanoKONTROL / Desktop Faders',
    description: 'Faders 1-4 for Pedal parameter controls, Fader 8 Master Vol, Solo/Mute buttons for Pedal bypass toggles.',
    mappings: [
      {
        id: 'nano-fader-1',
        name: 'Fader 1: Pedal 1 Drive',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 0,
        target: { type: 'pedal_param', slotIndex: 0, paramKey: 'drive' }
      },
      {
        id: 'nano-fader-2',
        name: 'Fader 2: Pedal 1 Tone',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 1,
        target: { type: 'pedal_param', slotIndex: 0, paramKey: 'tone' }
      },
      {
        id: 'nano-fader-3',
        name: 'Fader 3: Pedal 2 Parameter',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 2,
        target: { type: 'pedal_param', slotIndex: 1, paramKey: 'gain' }
      },
      {
        id: 'nano-fader-master',
        name: 'Fader 8: Master Volume',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 7,
        target: { type: 'master_volume' }
      },
      {
        id: 'nano-btn-mute1',
        name: 'Mute Btn 1: Toggle Pedal 1',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 16,
        target: { type: 'pedal_toggle', slotIndex: 0 }
      },
      {
        id: 'nano-btn-mute2',
        name: 'Mute Btn 2: Toggle Pedal 2',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 17,
        target: { type: 'pedal_toggle', slotIndex: 1 }
      },
      {
        id: 'nano-btn-mute3',
        name: 'Mute Btn 3: Toggle Pedal 3',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 18,
        target: { type: 'pedal_toggle', slotIndex: 2 }
      },
      {
        id: 'nano-btn-mute4',
        name: 'Mute Btn 4: Toggle Pedal 4',
        enabled: true,
        channel: 0,
        commandType: 'cc',
        controlNumber: 19,
        target: { type: 'pedal_toggle', slotIndex: 3 }
      }
    ]
  },
  {
    id: 'note-keyboard',
    name: 'MIDI Keyboard / Note Trigger Mode',
    description: 'Use piano keys (Notes C1-B1) as footswitches to toggle pedals, mute, tuner, and change presets.',
    mappings: [
      {
        id: 'kbd-note-c1',
        name: 'Note C1 (36) -> Pedal 1',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 36,
        target: { type: 'pedal_toggle', slotIndex: 0 }
      },
      {
        id: 'kbd-note-d1',
        name: 'Note D1 (38) -> Pedal 2',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 38,
        target: { type: 'pedal_toggle', slotIndex: 1 }
      },
      {
        id: 'kbd-note-e1',
        name: 'Note E1 (40) -> Pedal 3',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 40,
        target: { type: 'pedal_toggle', slotIndex: 2 }
      },
      {
        id: 'kbd-note-f1',
        name: 'Note F1 (41) -> Pedal 4',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 41,
        target: { type: 'pedal_toggle', slotIndex: 3 }
      },
      {
        id: 'kbd-note-g1',
        name: 'Note G1 (43) -> Tuner Toggle',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 43,
        target: { type: 'tuner_toggle' }
      },
      {
        id: 'kbd-note-a1',
        name: 'Note A1 (45) -> Mute Toggle',
        enabled: true,
        channel: 0,
        commandType: 'note',
        controlNumber: 45,
        target: { type: 'master_mute' }
      }
    ]
  }
];

const STORAGE_KEY = 'tonecraft_midi_mappings';

export function getStoredMidiMappings(): MidiMapping[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load MIDI mappings from localStorage:', err);
  }
  return DEFAULT_MIDI_MAPPINGS;
}

export function saveMidiMappingsToStorage(mappings: MidiMapping[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch (err) {
    console.warn('Failed to save MIDI mappings to localStorage:', err);
  }
}
