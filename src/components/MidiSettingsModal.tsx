/**
 * @file MidiSettingsModal.tsx
 * @description Comprehensive MIDI Mapping, Device Connection, MIDI Learn,
 * and Virtual MIDI Floorboard Test Console.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MidiMapping,
  MidiDevice,
  MidiLiveMessage,
  MidiCommandType,
  MidiActionTarget
} from '../types/midi';
import {
  midiManager,
  midiNoteToName
} from '../audio/midiManager';
import {
  MIDI_TEMPLATES,
  DEFAULT_MIDI_MAPPINGS
} from '../presets/defaultMidiMappings';
import { AnyPedal, Preset } from '../types/pedal';
import {
  Radio,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Activity,
  Check,
  X,
  Volume2,
  Music,
  Power,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ArrowUpDown,
  Download,
  Upload
} from 'lucide-react';

interface MidiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedals: AnyPedal[];
  presets: Preset[];
  currentPreset: Preset;
  masterVolume: number;
  inputGain: number;
  isMuted: boolean;
  onSelectPreset: (preset: Preset) => void;
  onUpdatePedal: (pedal: AnyPedal) => void;
  onToggleMute: () => void;
}

export const MidiSettingsModal: React.FC<MidiSettingsModalProps> = ({
  isOpen,
  onClose,
  pedals,
  presets,
  currentPreset,
  masterVolume,
  inputGain,
  isMuted,
  onSelectPreset,
  onUpdatePedal,
  onToggleMute
}) => {
  const [devices, setDevices] = useState<MidiDevice[]>(midiManager.devices);
  const [mappings, setMappings] = useState<MidiMapping[]>(midiManager.mappings);
  const [liveMessages, setLiveMessages] = useState<MidiLiveMessage[]>(midiManager.liveMessages);
  const [learningId, setLearningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mappings' | 'virtualController'>('mappings');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pedals' | 'presets' | 'rig' | 'looper'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActivityFlashing, setIsActivityFlashing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Virtual expression pedal states
  const [virtualExpr1, setVirtualExpr1] = useState<number>(64);
  const [virtualMasterVol, setVirtualMasterVol] = useState<number>(Math.round((masterVolume / 100) * 127));

  const flashTimeoutRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Refresh devices on open
    midiManager.init().then(() => {
      setDevices([...midiManager.devices]);
    });

    const handleDevicesChange = (devs: MidiDevice[]) => {
      setDevices([...devs]);
    };

    const handleActivity = (msg: MidiLiveMessage) => {
      setLiveMessages([...midiManager.liveMessages]);
      setIsActivityFlashing(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setIsActivityFlashing(false), 200);
    };

    const handleLearn = (mappingId: string, detected: any) => {
      setLearningId(null);
      setMappings([...midiManager.mappings]);
      showToast(`Mapped to CH ${detected.channel} · ${detected.commandType.toUpperCase()} #${detected.controlNumber}!`);
    };

    midiManager.onDevicesChange = handleDevicesChange;
    midiManager.onActivity = handleActivity;
    midiManager.onLearnCaptured = handleLearn;

    return () => {
      midiManager.onDevicesChange = null;
      midiManager.onActivity = null;
      midiManager.onLearnCaptured = null;
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Device connection action
  const handleConnect = async () => {
    const success = await midiManager.init();
    setDevices([...midiManager.devices]);
    if (success) {
      showToast('Web MIDI initialized. Controllers ready!');
    } else {
      showToast('Could not access Web MIDI. Check browser permissions.');
    }
  };

  const handleRefresh = () => {
    const list = midiManager.refreshDevices();
    setDevices([...list]);
    showToast(`Found ${list.length} MIDI input device(s).`);
  };

  // Toggle Learn
  const handleToggleLearn = (id: string) => {
    if (learningId === id) {
      midiManager.stopLearn();
      setLearningId(null);
    } else {
      midiManager.startLearn(id);
      setLearningId(id);
    }
  };

  // Update mapping
  const handleUpdateMapping = (id: string, partial: Partial<MidiMapping>) => {
    midiManager.updateMapping(id, partial);
    setMappings([...midiManager.mappings]);
  };

  // Add new mapping
  const handleAddMapping = () => {
    const newId = `map-${Date.now()}`;
    const newMapping: MidiMapping = {
      id: newId,
      name: `Custom Mapping #${mappings.length + 1}`,
      enabled: true,
      channel: 0,
      commandType: 'cc',
      controlNumber: 20 + (mappings.length % 40),
      target: { type: 'pedal_toggle', slotIndex: 0 }
    };
    midiManager.addMapping(newMapping);
    setMappings([...midiManager.mappings]);
    showToast('New mapping added.');
  };

  // Delete mapping
  const handleDeleteMapping = (id: string) => {
    midiManager.removeMapping(id);
    setMappings([...midiManager.mappings]);
    if (learningId === id) {
      midiManager.stopLearn();
      setLearningId(null);
    }
  };

  // Load Template
  const handleLoadTemplate = (templateId: string) => {
    const tmpl = MIDI_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    midiManager.setMappings(tmpl.mappings);
    setMappings([...tmpl.mappings]);
    showToast(`Loaded "${tmpl.name}" template.`);
  };

  // Reset to default
  const handleResetDefaults = () => {
    midiManager.setMappings(DEFAULT_MIDI_MAPPINGS);
    setMappings([...DEFAULT_MIDI_MAPPINGS]);
    showToast('Reset to ToneCraft default MIDI mappings.');
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mappings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'tonecraft_midi_mappings.json');
    dlAnchor.click();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          midiManager.setMappings(parsed);
          setMappings([...parsed]);
          showToast(`Imported ${parsed.length} MIDI mappings.`);
        }
      } catch (err) {
        showToast('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Virtual controller triggers
  const triggerVirtualCc = (ccNum: number, val: number) => {
    midiManager.simulateMidiMessage(1, 'cc', ccNum, val);
  };

  const triggerVirtualNote = (noteNum: number) => {
    midiManager.simulateMidiMessage(1, 'noteOn', noteNum, 127);
  };

  const triggerVirtualPc = (programNum: number) => {
    midiManager.simulateMidiMessage(1, 'pc', programNum, 0);
  };

  // Filter mappings
  const filteredMappings = mappings.filter(m => {
    if (categoryFilter === 'pedals') {
      if (m.target.type !== 'pedal_toggle' && m.target.type !== 'pedal_param') return false;
    } else if (categoryFilter === 'presets') {
      if (!m.target.type.startsWith('preset_')) return false;
    } else if (categoryFilter === 'rig') {
      if (
        m.target.type !== 'master_volume' &&
        m.target.type !== 'input_gain' &&
        m.target.type !== 'master_mute' &&
        m.target.type !== 'bypass_all' &&
        m.target.type !== 'tuner_toggle' &&
        m.target.type !== 'tap_tempo' &&
        m.target.type !== 'dsp_power' &&
        m.target.type !== 'amp_param' &&
        m.target.type !== 'cab_param'
      ) return false;
    } else if (categoryFilter === 'looper') {
      if (m.target.type !== 'looper_cmd') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchTarget = JSON.stringify(m.target).toLowerCase().includes(q);
      const matchNum = String(m.controlNumber).includes(q);
      const matchType = m.commandType.toLowerCase().includes(q);
      if (!matchName && !matchTarget && !matchNum && !matchType) return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio size={20} className={isActivityFlashing ? 'animate-ping' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  MIDI Control & Hardware Mapping
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WEB MIDI API
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                    isActivityFlashing
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : devices.length > 0
                      ? 'bg-emerald-500/70'
                      : 'bg-neutral-600'
                  }`}
                  title={isActivityFlashing ? 'MIDI Signal Received!' : devices.length > 0 ? 'MIDI Devices Connected' : 'No Devices'}
                />
              </div>
              <p className="text-xs text-neutral-400">
                Map foot controllers, expression pedals, and knobs to toggle pedals, tweak drive/delay, switch presets, and control looper.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Device Status & Hardware Connection Banner */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
              Controllers:
            </span>
            {devices.length === 0 ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px]">
                  No physical MIDI device detected
                </span>
                <button
                  onClick={handleConnect}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} />
                  <span>Scan / Request Access</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {devices.map(d => (
                  <span
                    key={d.id}
                    className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5"
                    title={`Port ID: ${d.id} · ${d.manufacturer}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <strong>{d.name}</strong>
                    <span className="text-emerald-500/70 text-[9px]">({d.state})</span>
                  </span>
                ))}
                <button
                  onClick={handleRefresh}
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                  title="Rescan MIDI ports"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Quick tab switcher: Mappings vs Virtual Floorboard Test Console */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('mappings')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'mappings'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              MIDI Mappings ({mappings.length})
            </button>
            <button
              onClick={() => setActiveTab('virtualController')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'virtualController'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Virtual Test Floorboard</span>
            </button>
          </div>
        </div>

        {/* Live MIDI Activity Monitor Ribbon */}
        <div className="px-5 py-1.5 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1 text-neutral-400 shrink-0">
              <Activity size={12} className={isActivityFlashing ? 'text-emerald-400' : 'text-neutral-500'} />
              <span>LAST MIDI IN:</span>
            </div>
            {liveMessages.length > 0 ? (
              <span className="text-emerald-300 truncate">
                {liveMessages[0].description} <span className="text-neutral-500">[{liveMessages[0].rawHex}]</span>
              </span>
            ) : (
              <span className="text-neutral-500 italic">Waiting for MIDI message (CC / PC / Note)...</span>
            )}
          </div>

          {learningId && (
            <div className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>LEARNING... Touch any knob or switch</span>
              <button
                onClick={() => handleToggleLearn(learningId)}
                className="text-neutral-400 hover:text-white text-[10px] ml-1 uppercase"
              >
                Cancel
              </button>
            </div>
          )}

          {toastMessage && (
            <div className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'mappings' ? (
            <>
              {/* Toolbar: Category Filters, Search, Add Mapping, Templates */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
                  {(['all', 'pedals', 'presets', 'rig', 'looper'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] font-semibold transition-all ${
                        categoryFilter === cat
                          ? 'bg-neutral-700 text-white border border-neutral-600'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search CC#, target, or name..."
                    className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-44"
                  />

                  {/* Template Picker */}
                  <div className="relative group">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleLoadTemplate(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="px-2.5 py-1 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 cursor-pointer focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>Load Hardware Preset...</option>
                      {MIDI_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddMapping}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Add Mapping</span>
                  </button>
                </div>
              </div>

              {/* Mappings List */}
              <div className="space-y-2">
                {filteredMappings.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                    <Radio size={32} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                    <p className="text-sm font-semibold text-neutral-400">No MIDI mappings found</p>
                    <p className="text-xs text-neutral-500 mt-1">Try resetting to default or click "Add Mapping"</p>
                    <button
                      onClick={handleResetDefaults}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
                    >
                      Restore Factory MIDI Mappings
                    </button>
                  </div>
                ) : (
                  filteredMappings.map(mapping => {
                    const isLearning = learningId === mapping.id;
                    return (
                      <div
                        key={mapping.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isLearning
                            ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : mapping.enabled
                            ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                            : 'bg-neutral-950/60 border-neutral-800/40 opacity-60'
                        }`}
                      >
                        {/* Left: Checkbox + Name + Target Selector */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={mapping.enabled}
                            onChange={(e) => handleUpdateMapping(mapping.id, { enabled: e.target.checked })}
                            className="mt-1 sm:mt-0 rounded accent-amber-500 cursor-pointer w-4 h-4"
                            title="Enable / Disable this mapping"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={mapping.name}
                                onChange={(e) => handleUpdateMapping(mapping.id, { name: e.target.value })}
                                className="bg-transparent font-semibold text-sm text-white focus:outline-none focus:border-b border-amber-500 max-w-[220px] truncate"
                              />
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                                {formatTargetBadge(mapping.target, pedals, presets)}
                              </span>
                            </div>

                            {/* Target Dropdown Config */}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-neutral-400 text-[11px]">Controls:</span>
                              <TargetSelectDropdown
                                currentTarget={mapping.target}
                                pedals={pedals}
                                presets={presets}
                                onChange={(newTarget) => handleUpdateMapping(mapping.id, { target: newTarget })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right: MIDI Channel, Command, Control#, Learn Button, Delete */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-mono">
                          {/* Channel */}
                          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-500 text-[10px]">CH:</span>
                            <select
                              value={mapping.channel}
                              onChange={(e) => handleUpdateMapping(mapping.id, { channel: Number(e.target.value) })}
                              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
                              title="MIDI Channel (0 = Omni / Any)"
                            >
                              <option value={0}>Omni (All)</option>
                              {Array.from({ length: 16 }, (_, i) => i + 1).map(ch => (
                                <option key={ch} value={ch}>CH {ch}</option>
                              ))}
                            </select>
                          </div>

                          {/* Command Type */}
                          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-500 text-[10px]">TYPE:</span>
                            <select
                              value={mapping.commandType}
                              onChange={(e) => handleUpdateMapping(mapping.id, { commandType: e.target.value as MidiCommandType })}
                              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer uppercase text-xs"
                            >
                              <option value="cc">CC (Knob/Switch)</option>
                              <option value="pc">PC (Preset Program)</option>
                              <option value="note">Note (Key/Stomp)</option>
                            </select>
                          </div>

                          {/* Control Number */}
                          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-500 text-[10px]">
                              {mapping.commandType === 'cc' ? 'CC#' : mapping.commandType === 'pc' ? 'PC#' : 'NOTE#'}:
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={127}
                              value={mapping.controlNumber}
                              onChange={(e) => handleUpdateMapping(mapping.id, { controlNumber: Math.max(0, Math.min(127, Number(e.target.value))) })}
                              className="w-12 bg-transparent text-white font-bold text-center focus:outline-none text-xs"
                            />
                            {mapping.commandType === 'note' && (
                              <span className="text-neutral-400 text-[10px]">({midiNoteToName(mapping.controlNumber)})</span>
                            )}
                          </div>

                          {/* Invert Polarity (for CC knobs/expression pedals) */}
                          {mapping.commandType === 'cc' && (
                            <button
                              onClick={() => handleUpdateMapping(mapping.id, { invert: !mapping.invert })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                mapping.invert
                                  ? 'bg-amber-500 text-black'
                                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                              }`}
                              title="Invert direction: 0-127 becomes 127-0"
                            >
                              INV
                            </button>
                          )}

                          {/* MIDI Learn Button */}
                          <button
                            onClick={() => handleToggleLearn(mapping.id)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              isLearning
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 animate-pulse'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30'
                            }`}
                            title="Click and then press a switch or move a knob on your MIDI controller to auto-bind"
                          >
                            <Radio size={12} className={isLearning ? 'animate-spin' : ''} />
                            <span>{isLearning ? 'LISTENING...' : 'LEARN'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteMapping(mapping.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                            title="Delete mapping"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={() => {
                      midiManager.setMappings([]);
                      setMappings([]);
                      showToast('Cleared all MIDI mappings.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center gap-1.5"
                  >
                    <Download size={12} />
                    <span>Backup JSON</span>
                  </button>

                  <label className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer">
                    <Upload size={12} />
                    <span>Restore JSON</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* ================================================================= */
            /* VIRTUAL MIDI FLOORBOARD TEST CONSOLE                              */
            /* Allows testing MIDI mappings right in the browser!                */
            /* ================================================================= */
            <div className="space-y-5">
              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <span>
                    Click footswitches or drag the expression faders below to simulate hardware MIDI messages (Channel 1).
                    Notice pedals, knobs, and presets toggle and react immediately!
                  </span>
                </div>
                <span className="font-mono text-amber-400 font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                  TEST RIG ACTIVE
                </span>
              </div>

              {/* Hardware-styled Pedalboard Console Deck */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-neutral-800 shadow-2xl relative overflow-hidden">
                {/* Vintage metallic plate screws */}
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-700 border border-neutral-600 shadow-inner" />
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-700 border border-neutral-600 shadow-inner" />
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-700 border border-neutral-600 shadow-inner" />
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-700 border border-neutral-600 shadow-inner" />

                {/* Top Section: Preset Program Switches & Utility Switches */}
                <div className="mb-6">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-2 flex items-center justify-between">
                    <span>1. PRESET PROGRAM SWITCHES (PC 0 - 3 & PREV / NEXT)</span>
                    <span className="text-amber-400">CURRENT: {currentPreset.name}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <button
                      onClick={() => triggerVirtualCc(24, 127)}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all flex flex-col items-center justify-center group shadow-md"
                    >
                      <span className="text-neutral-400 text-[10px] font-mono">CC #24</span>
                      <span className="font-bold text-xs text-white group-hover:text-amber-400 mt-1">◀ PREV PRESET</span>
                    </button>

                    {presets.slice(0, 4).map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => triggerVirtualPc(idx)}
                        className={`p-3 rounded-xl border active:scale-95 transition-all flex flex-col items-center justify-center text-center group shadow-md ${
                          currentPreset.id === p.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                            : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 text-neutral-200'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-neutral-400">PC #{idx}</span>
                        <span className="font-bold text-xs truncate max-w-[120px] mt-1">{p.name}</span>
                      </button>
                    ))}

                    <button
                      onClick={() => triggerVirtualCc(25, 127)}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all flex flex-col items-center justify-center group shadow-md"
                    >
                      <span className="text-neutral-400 text-[10px] font-mono">CC #25</span>
                      <span className="font-bold text-xs text-white group-hover:text-amber-400 mt-1">NEXT PRESET ▶</span>
                    </button>
                  </div>
                </div>

                {/* Middle Section: Stompbox Switches for Pedal Chain Slots */}
                <div className="mb-6">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-2 flex items-center justify-between">
                    <span>2. STOMPBOX PEDAL TOGGLES (CC 20 - 23)</span>
                    <span className="text-emerald-400">{pedals.filter(p => p.enabled).length} ACTIVE PEDALS</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(slotIdx => {
                      const pedal = pedals[slotIdx];
                      const isEngaged = pedal?.enabled ?? false;
                      const ccNum = 20 + slotIdx;

                      return (
                        <div
                          key={slotIdx}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-between gap-3 transition-all ${
                            isEngaged
                              ? 'bg-neutral-800/80 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                              : 'bg-neutral-900/60 border-neutral-800'
                          }`}
                        >
                          <div className="text-center">
                            <span className="text-[10px] font-mono font-bold text-neutral-400">
                              SW #{slotIdx + 1} · CC #{ccNum}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-[160px]">
                              {pedal ? pedal.name : `Slot #${slotIdx + 1} (Empty)`}
                            </h4>
                          </div>

                          {/* LED Pilot Light */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                              isEngaged
                                ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_10px_#34d399]'
                                : 'bg-neutral-800 border-neutral-700 opacity-40'
                            }`}
                          />

                          {/* Large Chrome Footswitch Cap */}
                          <button
                            onClick={() => triggerVirtualCc(ccNum, 127)}
                            disabled={!pedal}
                            className="relative w-14 h-14 rounded-full bg-gradient-to-b from-neutral-200 to-neutral-500 flex items-center justify-center shadow-lg active:scale-90 active:translate-y-1 transition-all disabled:opacity-30 disabled:pointer-events-none group"
                            title={`Toggle ${pedal?.name || 'pedal'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400 border border-neutral-300 flex items-center justify-center shadow-inner">
                              <Power
                                size={14}
                                className={isEngaged ? 'text-amber-500' : 'text-neutral-500'}
                              />
                            </div>
                          </button>

                          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                            {isEngaged ? 'ENGAGED' : 'BYPASSED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Section: Expression Pedals & Utility Stomp Switches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                  {/* Left: Continuous Expression Pedals */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-3">
                      3. CONTINUOUS EXPRESSION PEDALS (CC #1 & CC #7)
                    </div>

                    <div className="space-y-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
                      {/* Exp 1 */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-neutral-200">Expression Pedal 1 (Drive / Wah / Pitch)</span>
                          <span className="font-mono text-amber-400">CC #1: {virtualExpr1}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={127}
                          value={virtualExpr1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVirtualExpr1(val);
                            triggerVirtualCc(1, val);
                          }}
                          className="w-full accent-amber-500 cursor-ew-resize h-2 bg-neutral-800 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                          <span>Heel (0)</span>
                          <span>Center (64)</span>
                          <span>Toe (127)</span>
                        </div>
                      </div>

                      {/* Master Volume CC 7 */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-neutral-200">Volume Pedal (Master Rig Output)</span>
                          <span className="font-mono text-emerald-400">CC #7: {virtualMasterVol}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={127}
                          value={virtualMasterVol}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVirtualMasterVol(val);
                            triggerVirtualCc(7, val);
                          }}
                          className="w-full accent-emerald-500 cursor-ew-resize h-2 bg-neutral-800 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                          <span>Muted (0)</span>
                          <span>Stage (100)</span>
                          <span>Full Boost (127)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Looper & Utility Footswitches */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold mb-3">
                      4. RIG UTILITIES & LOOPER FOOtswitches
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => triggerVirtualCc(64, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center group"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #64</span>
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 mt-0.5">TUNER</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(65, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center group"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #65</span>
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 mt-0.5">TAP TEMPO</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(66, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center group"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #66</span>
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 mt-0.5">MUTE</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(67, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center group"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #67</span>
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 mt-0.5">BYPASS ALL</div>
                      </button>

                      {/* Looper Buttons */}
                      <button
                        onClick={() => triggerVirtualCc(80, 127)}
                        className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-400 active:scale-95 transition-all text-center text-red-300"
                      >
                        <span className="text-[9px] font-mono text-red-400/80">CC #80</span>
                        <div className="text-xs font-bold mt-0.5">LOOP REC</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(81, 127)}
                        className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 active:scale-95 transition-all text-center text-emerald-300"
                      >
                        <span className="text-[9px] font-mono text-emerald-400/80">CC #81</span>
                        <div className="text-xs font-bold mt-0.5">LOOP PLAY</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(82, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center text-neutral-200"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #82</span>
                        <div className="text-xs font-bold mt-0.5">UNDO</div>
                      </button>

                      <button
                        onClick={() => triggerVirtualCc(83, 127)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 active:scale-95 transition-all text-center text-neutral-200"
                      >
                        <span className="text-[9px] font-mono text-neutral-400">CC #83</span>
                        <div className="text-xs font-bold mt-0.5">CLEAR</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Web MIDI Status: <strong>{midiManager.permissionState.toUpperCase()}</strong></span>
            <span>·</span>
            <span>{devices.length} Connected Controller(s)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Format target as a readable badge label
 */
function formatTargetBadge(
  target: MidiActionTarget,
  pedals: AnyPedal[],
  presets: Preset[]
): string {
  switch (target.type) {
    case 'pedal_toggle': {
      const pedal = pedals[target.slotIndex];
      return `Pedal #${target.slotIndex + 1} [${pedal ? pedal.name : 'Slot'}] Bypass`;
    }
    case 'pedal_param': {
      const pedal = pedals[target.slotIndex];
      return `Pedal #${target.slotIndex + 1} [${pedal ? pedal.name : 'Slot'}] · ${target.paramLabel || target.paramKey}`;
    }
    case 'preset_next':
      return 'Next Preset';
    case 'preset_prev':
      return 'Previous Preset';
    case 'preset_index': {
      const p = presets[target.presetIndex];
      return `Preset #${target.presetIndex + 1} (${p ? p.name : 'Preset'})`;
    }
    case 'preset_id': {
      const p = presets.find(item => item.id === target.presetId);
      return `Preset: ${p ? p.name : target.presetId}`;
    }
    case 'master_volume':
      return 'Master Rig Volume';
    case 'input_gain':
      return 'Input Pre-Gain';
    case 'master_mute':
      return 'Master Mute';
    case 'bypass_all':
      return 'Global Bypass All';
    case 'tuner_toggle':
      return 'Tuner Toggle';
    case 'tap_tempo':
      return 'Tap Tempo';
    case 'dsp_power':
      return 'DSP Power Toggle';
    case 'amp_param':
      return `Amp: ${target.paramKey.toUpperCase()}`;
    case 'cab_param':
      return `Cab: ${target.paramKey}`;
    case 'looper_cmd':
      return `Looper: ${target.command.toUpperCase()}`;
    default:
      return 'Unmapped';
  }
}

/**
 * Target selection dropdown component
 */
interface TargetSelectDropdownProps {
  currentTarget: MidiActionTarget;
  pedals: AnyPedal[];
  presets: Preset[];
  onChange: (target: MidiActionTarget) => void;
}

const TargetSelectDropdown: React.FC<TargetSelectDropdownProps> = ({
  currentTarget,
  pedals,
  presets,
  onChange
}) => {
  const encodeTargetValue = (t: MidiActionTarget): string => {
    if (t.type === 'pedal_toggle') return `pedal_toggle:${t.slotIndex}`;
    if (t.type === 'pedal_param') return `pedal_param:${t.slotIndex}:${t.paramKey}:${t.paramLabel || t.paramKey}`;
    if (t.type === 'preset_index') return `preset_index:${t.presetIndex}`;
    if (t.type === 'preset_next') return 'preset_next';
    if (t.type === 'preset_prev') return 'preset_prev';
    if (t.type === 'master_volume') return 'master_volume';
    if (t.type === 'input_gain') return 'input_gain';
    if (t.type === 'master_mute') return 'master_mute';
    if (t.type === 'bypass_all') return 'bypass_all';
    if (t.type === 'tuner_toggle') return 'tuner_toggle';
    if (t.type === 'tap_tempo') return 'tap_tempo';
    if (t.type === 'dsp_power') return 'dsp_power';
    if (t.type === 'amp_param') return `amp_param:${t.paramKey}`;
    if (t.type === 'looper_cmd') return `looper_cmd:${t.command}`;
    return 'master_volume';
  };

  const decodeTargetValue = (val: string): MidiActionTarget => {
    const parts = val.split(':');
    const kind = parts[0];
    if (kind === 'pedal_toggle') {
      return { type: 'pedal_toggle', slotIndex: Number(parts[1]) };
    }
    if (kind === 'pedal_param') {
      return {
        type: 'pedal_param',
        slotIndex: Number(parts[1]),
        paramKey: parts[2],
        paramLabel: parts[3]
      };
    }
    if (kind === 'preset_index') {
      return { type: 'preset_index', presetIndex: Number(parts[1]) };
    }
    if (kind === 'preset_next') return { type: 'preset_next' };
    if (kind === 'preset_prev') return { type: 'preset_prev' };
    if (kind === 'master_volume') return { type: 'master_volume' };
    if (kind === 'input_gain') return { type: 'input_gain' };
    if (kind === 'master_mute') return { type: 'master_mute' };
    if (kind === 'bypass_all') return { type: 'bypass_all' };
    if (kind === 'tuner_toggle') return { type: 'tuner_toggle' };
    if (kind === 'tap_tempo') return { type: 'tap_tempo' };
    if (kind === 'dsp_power') return { type: 'dsp_power' };
    if (kind === 'amp_param') return { type: 'amp_param', paramKey: parts[1] as any };
    if (kind === 'looper_cmd') return { type: 'looper_cmd', command: parts[1] as any };
    return { type: 'master_volume' };
  };

  return (
    <select
      value={encodeTargetValue(currentTarget)}
      onChange={(e) => onChange(decodeTargetValue(e.target.value))}
      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 cursor-pointer focus:outline-none focus:border-amber-500 max-w-[280px] truncate"
    >
      <optgroup label="🎛️ Pedal Bypass Toggles">
        {pedals.map((p, idx) => (
          <option key={`toggle-${p.id}`} value={`pedal_toggle:${idx}`}>
            Pedal #{idx + 1} ({p.name}) - Toggle Bypass
          </option>
        ))}
        {pedals.length === 0 && (
          <option value="pedal_toggle:0">Pedal Slot #1 - Toggle Bypass</option>
        )}
      </optgroup>

      <optgroup label="🎚️ Pedal Parameter Knobs">
        {pedals.map((p, idx) => {
          const keys = getKnobKeysForPedal(p);
          return keys.map(k => (
            <option key={`param-${p.id}-${k.key}`} value={`pedal_param:${idx}:${k.key}:${k.label}`}>
              Pedal #{idx + 1} ({p.name}) · {k.label}
            </option>
          ));
        })}
      </optgroup>

      <optgroup label="🎸 Preset Switching">
        <option value="preset_prev">Previous Preset (◀ Prev)</option>
        <option value="preset_next">Next Preset (Next ▶)</option>
        {presets.map((pr, idx) => (
          <option key={`pr-${pr.id}`} value={`preset_index:${idx}`}>
            Preset #{idx + 1}: {pr.name}
          </option>
        ))}
      </optgroup>

      <optgroup label="⚡ Rig Controls">
        <option value="master_volume">Master Output Volume (CC)</option>
        <option value="input_gain">Input Pre-Gain (CC)</option>
        <option value="master_mute">Master Mute (Toggle)</option>
        <option value="bypass_all">Bypass All Pedals (Toggle)</option>
        <option value="tuner_toggle">Chromatic Tuner (Toggle)</option>
        <option value="tap_tempo">Tap Tempo (Trigger)</option>
        <option value="dsp_power">DSP Engine Power (Toggle)</option>
      </optgroup>

      <optgroup label="🔊 Amp & Cabinet">
        <option value="amp_param:gain">Amp Gain / Drive</option>
        <option value="amp_param:bass">Amp Bass</option>
        <option value="amp_param:mid">Amp Mid</option>
        <option value="amp_param:treble">Amp Treble</option>
        <option value="amp_param:master">Amp Master</option>
        <option value="amp_param:bypassed">Amp Bypass Toggle</option>
      </optgroup>

      <optgroup label="📼 Tape Looper">
        <option value="looper_cmd:record">Looper: Record / Overdub</option>
        <option value="looper_cmd:play">Looper: Play / Stop</option>
        <option value="looper_cmd:undo">Looper: Undo Layer</option>
        <option value="looper_cmd:clear">Looper: Clear All</option>
      </optgroup>
    </select>
  );
};

function getKnobKeysForPedal(pedal: AnyPedal): { key: string; label: string }[] {
  switch (pedal.type) {
    case 'overdrive':
      return [
        { key: 'drive', label: 'Drive' },
        { key: 'tone', label: 'Tone' },
        { key: 'level', label: 'Level' }
      ];
    case 'distortion':
      return [
        { key: 'gain', label: 'Gain' },
        { key: 'filter', label: 'Filter' },
        { key: 'volume', label: 'Volume' }
      ];
    case 'fuzz':
      return [
        { key: 'fuzz', label: 'Fuzz' },
        { key: 'tone', label: 'Tone' },
        { key: 'volume', label: 'Volume' },
        { key: 'scoop', label: 'Scoop' }
      ];
    case 'compressor':
      return [
        { key: 'sustain', label: 'Sustain' },
        { key: 'attack', label: 'Attack' },
        { key: 'level', label: 'Level' },
        { key: 'blend', label: 'Blend' }
      ];
    case 'chorus':
    case 'flanger':
      return [
        { key: 'rate', label: 'Rate' },
        { key: 'depth', label: 'Depth' },
        { key: 'mix', label: 'Mix' }
      ];
    case 'phaser':
    case 'tremolo':
      return [
        { key: 'speed', label: 'Speed' },
        { key: 'depth', label: 'Depth' }
      ];
    case 'delay':
      return [
        { key: 'time', label: 'Delay Time' },
        { key: 'feedback', label: 'Repeats' },
        { key: 'mix', label: 'Mix' }
      ];
    case 'reverb':
      return [
        { key: 'decay', label: 'Decay' },
        { key: 'mix', label: 'Mix' },
        { key: 'preDelay', label: 'Pre-Delay' }
      ];
    case 'pitchShifter':
      return [
        { key: 'shift', label: 'Shift' },
        { key: 'mix', label: 'Mix' }
      ];
    case 'harmonizer':
      return [
        { key: 'harmonyLevel', label: 'Harmony Level' },
        { key: 'directLevel', label: 'Direct Level' }
      ];
    case 'autoWah':
      return [
        { key: 'sensitivity', label: 'Sensitivity' },
        { key: 'range', label: 'Range' }
      ];
    default:
      return [{ key: 'mix', label: 'Mix' }];
  }
}
