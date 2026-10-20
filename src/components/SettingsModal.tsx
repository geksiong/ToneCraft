import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  ShieldAlert,
  Cpu,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
  Volume2,
  Globe
} from 'lucide-react';
import {
  InputConditionerConfig,
  InputConditionerTelemetry
} from '../audio/inputConditioner';
import {
  InputChannelTelemetry,
  InputChannelRoutingMode,
  OutputChannelRoutingMode
} from '../audio/inputChannelRouter';
import { SignalChainLatencyReport } from '../audio/latencyTracker';
import { AudioLatencySettings } from '../audio/audioEngine';
import { AnyPedal, Preset, AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import { InputSettingsTab } from './settings/InputSettingsTab';
import { EngineSettingsTab } from './settings/EngineSettingsTab';
import { MidiSettingsTab } from './settings/MidiSettingsTab';
import { CloudHubTab } from './settings/CloudHubTab';

export type SettingsModalTab = 'input' | 'engine' | 'midi' | 'presets';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: SettingsModalTab;
  onTabChange?: (tab: SettingsModalTab) => void;

  // 1. Input & Conditioner Props
  conditionerConfig: InputConditionerConfig;
  conditionerTelemetry: InputConditionerTelemetry;
  onUpdateConditionerConfig: (newConfig: Partial<InputConditionerConfig>) => void;
  onLearnNoiseFloor: () => void;
  isLearningNoiseFloor: boolean;
  onApplyWhineKiller: () => void;
  inputSource: string;
  inputGain: number;
  onInputGainChange: (gain: number) => void;
  channelTelemetry?: InputChannelTelemetry;
  inputRoutingMode?: InputChannelRoutingMode;
  onInputRoutingChange?: (mode: InputChannelRoutingMode) => void;
  outputRoutingMode?: OutputChannelRoutingMode;
  onOutputRoutingChange?: (mode: OutputChannelRoutingMode) => void;

  // 2. Engine & Latency Props
  latencyReport: SignalChainLatencyReport;
  coreEngineMode: 'hd-worklet' | 'standard';
  onSetCoreEngineMode: (mode: 'hd-worklet' | 'standard') => void;
  ampEngineMode: 'wasm-nam' | 'hd-triode' | 'waveshaper';
  onSetAmpEngineMode: (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => void;
  isWasmReady: boolean;
  onRunLatencyPing: () => Promise<number>;
  latencySettings: AudioLatencySettings;
  onUpdateLatencySettings: (settings: Partial<AudioLatencySettings>) => Promise<void>;
  availableInputDevices: { deviceId: string; label: string; isBluetooth?: boolean }[];
  availableOutputDevices: { deviceId: string; label: string; isBluetooth: boolean }[];

  // 3. MIDI Props
  pedals: AnyPedal[];
  presets: Preset[];
  currentPreset: Preset;
  masterVolume: number;
  isMuted: boolean;
  onSelectPreset: (preset: Preset) => void;
  onUpdatePedal: (pedal: AnyPedal) => void;
  onToggleMute: () => void;
  midiDeviceCount?: number;
  isMidiActivity?: boolean;

  // 4. Cloud Hub & Preset Library Props
  currentPedals?: AnyPedal[];
  currentAmp?: AmpModelConfig;
  currentCab?: IrCabinetConfig;
  onPresetsUpdated?: (updatedList: Preset[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeTab: controlledTab,
  onTabChange: controlledTabChange,

  // Input props
  conditionerConfig,
  conditionerTelemetry,
  onUpdateConditionerConfig,
  onLearnNoiseFloor,
  isLearningNoiseFloor,
  onApplyWhineKiller,
  inputSource,
  inputGain,
  onInputGainChange,
  channelTelemetry,
  inputRoutingMode,
  onInputRoutingChange,
  outputRoutingMode,
  onOutputRoutingChange,

  // Engine props
  latencyReport,
  coreEngineMode,
  onSetCoreEngineMode,
  ampEngineMode,
  onSetAmpEngineMode,
  isWasmReady,
  onRunLatencyPing,
  latencySettings,
  onUpdateLatencySettings,
  availableInputDevices,
  availableOutputDevices,

  // MIDI props
  pedals,
  presets,
  currentPreset,
  masterVolume,
  isMuted,
  onSelectPreset,
  onUpdatePedal,
  onToggleMute,
  midiDeviceCount = 0,
  isMidiActivity = false,
  currentPedals,
  currentAmp,
  currentCab,
  onPresetsUpdated
}) => {
  const [internalTab, setInternalTab] = useState<SettingsModalTab>('input');
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleTabSelect = (tab: SettingsModalTab) => {
    if (controlledTabChange) {
      controlledTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  useEffect(() => {
    if (controlledTab) {
      setInternalTab(controlledTab);
    }
  }, [controlledTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Settings size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ToneCraft Studio Settings
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                  UNIFIED CONSOLE
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Input conditioning &amp; noise gate, DSP latency tuning, MIDI mapping, and Cloud Preset Hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800 shrink-0"
            title="Close Settings (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-4 sm:px-6 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            {/* Tab 1: Input Settings */}
            <button
              onClick={() => handleTabSelect('input')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'input'
                  ? 'bg-neutral-800 border-emerald-500/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <ShieldAlert
                size={15}
                className={currentTab === 'input' ? 'text-emerald-400' : 'text-neutral-400'}
              />
              <span>Input &amp; Noise Gate</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline-block ${
                  conditionerConfig.gateEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {conditionerConfig.gateEnabled
                  ? conditionerTelemetry.gateState === 'open'
                    ? 'Open'
                    : 'Gating'
                  : 'Off'}
              </span>
            </button>

            {/* Tab 2: Engine Settings */}
            <button
              onClick={() => handleTabSelect('engine')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'engine'
                  ? 'bg-neutral-800 border-amber-500/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Cpu
                size={15}
                className={currentTab === 'engine' ? 'text-amber-400' : 'text-neutral-400'}
              />
              <span>DSP Engine &amp; Latency</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hidden sm:inline-block">
                {latencyReport.totalCalculatedMs.toFixed(1)}ms
              </span>
            </button>

            {/* Tab 3: MIDI Settings */}
            <button
              onClick={() => handleTabSelect('midi')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'midi'
                  ? 'bg-neutral-800 border-sky-500/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Radio
                size={15}
                className={
                  isMidiActivity
                    ? 'text-amber-300 animate-ping'
                    : currentTab === 'midi'
                    ? 'text-sky-400'
                    : 'text-neutral-400'
                }
              />
              <span>MIDI Controller</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline-block ${
                  midiDeviceCount > 0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {midiDeviceCount > 0 ? `${midiDeviceCount} Dev` : 'Enabled'}
              </span>
            </button>

            {/* Tab 4: Cloud Hub & Presets */}
            <button
              onClick={() => handleTabSelect('presets')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'presets'
                  ? 'bg-neutral-800 border-sky-400/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Globe
                size={15}
                className={currentTab === 'presets' ? 'text-sky-400' : 'text-neutral-400'}
              />
              <span>Cloud Hub &amp; Presets</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 hidden sm:inline-block">
                {presets.length} Presets
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-neutral-400">
            <span>Core: 48.0 kHz</span>
            <span>·</span>
            <span>{latencyReport.bufferSize} samples</span>
          </div>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentTab === 'input' && (
            <InputSettingsTab
              config={conditionerConfig}
              telemetry={conditionerTelemetry}
              onUpdateConfig={onUpdateConditionerConfig}
              onLearnNoiseFloor={onLearnNoiseFloor}
              isLearningNoiseFloor={isLearningNoiseFloor}
              onApplyWhineKiller={onApplyWhineKiller}
              inputSource={inputSource}
              inputGain={inputGain}
              onInputGainChange={onInputGainChange}
              channelTelemetry={channelTelemetry}
              inputRoutingMode={inputRoutingMode}
              onInputRoutingChange={onInputRoutingChange}
              outputRoutingMode={outputRoutingMode}
              onOutputRoutingChange={onOutputRoutingChange}
            />
          )}

          {currentTab === 'engine' && (
            <EngineSettingsTab
              report={latencyReport}
              coreEngineMode={coreEngineMode}
              onSetCoreEngineMode={onSetCoreEngineMode}
              ampEngineMode={ampEngineMode}
              onSetAmpEngineMode={onSetAmpEngineMode}
              isWasmReady={isWasmReady}
              onRunLatencyPing={onRunLatencyPing}
              latencySettings={latencySettings}
              onUpdateLatencySettings={onUpdateLatencySettings}
              availableInputDevices={availableInputDevices}
              availableOutputDevices={availableOutputDevices}
            />
          )}

          {currentTab === 'midi' && (
            <MidiSettingsTab
              pedals={pedals}
              presets={presets}
              currentPreset={currentPreset}
              masterVolume={masterVolume}
              inputGain={inputGain}
              isMuted={isMuted}
              onSelectPreset={onSelectPreset}
              onUpdatePedal={onUpdatePedal}
              onToggleMute={onToggleMute}
            />
          )}

          {currentTab === 'presets' && (
            <CloudHubTab
              currentPreset={currentPreset}
              presets={presets}
              currentPedals={currentPedals || pedals}
              currentAmp={
                currentAmp || {
                  id: 'deluxe',
                  name: 'American Clean Deluxe',
                  category: 'Guitar',
                  description: 'Classic American tube clean tone',
                  type: 'wavenet',
                  gain: 4.5,
                  bass: 6.0,
                  mid: 5.0,
                  treble: 6.5,
                  presence: 5.0,
                  master: 7.0,
                  saturationCurve: 2.0,
                  bias: 0.1
                }
              }
              currentCab={
                currentCab || {
                  id: 'celestion-vintage',
                  name: 'Celestion Vintage 4x12',
                  category: 'Guitar',
                  description: 'British 4x12 Celestion V30 speakers',
                  speakerType: '4x12 Celestion V30',
                  micDistance: 25,
                  lowCut: 80,
                  highCut: 7500
                }
              }
              onSelectPreset={onSelectPreset}
              onPresetsUpdated={onPresetsUpdated || (() => {})}
              onCloseModal={onClose}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Settings applied immediately to real-time DSP graph</span>
            <span className="sm:hidden">Real-time sync active</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
