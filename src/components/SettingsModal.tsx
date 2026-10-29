import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  ShieldAlert,
  Cpu,
  Radio,
  Globe,
  Sliders,
  CheckCircle2,
  Clock,
  Volume2
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  ToneCraft Studio Hub
                </h2>
                <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-400">
                  · Configuration &amp; Hardware
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Input conditioning, noise suppression, DSP performance &amp; MIDI control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Audio Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>48.0 kHz</span>
              <span>·</span>
              <span className="text-emerald-400">{latencyReport.totalCalculatedMs.toFixed(1)} ms</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-700/60 shrink-0"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Unified Tab Navigation Bar */}
        <div className="px-4 sm:px-6 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-1.5 py-2">
            {/* Tab 1: Audio & Input */}
            <button
              onClick={() => handleTabSelect('input')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'input'
                  ? 'bg-neutral-800 border-emerald-500/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <ShieldAlert
                size={15}
                className={currentTab === 'input' ? 'text-emerald-400' : 'text-neutral-400'}
              />
              <span>Audio &amp; Input</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline-block ${
                  conditionerConfig.gateEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {conditionerConfig.gateEnabled ? 'Gate On' : 'Bypass'}
              </span>
            </button>

            {/* Tab 2: DSP & Engine */}
            <button
              onClick={() => handleTabSelect('engine')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'engine'
                  ? 'bg-neutral-800 border-amber-500/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Cpu
                size={15}
                className={currentTab === 'engine' ? 'text-amber-400' : 'text-neutral-400'}
              />
              <span>DSP &amp; Engine</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hidden sm:inline-block">
                {latencyReport.totalCalculatedMs.toFixed(1)} ms
              </span>
            </button>

            {/* Tab 3: MIDI Controller */}
            <button
              onClick={() => handleTabSelect('midi')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
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
              <span>MIDI Hardware</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline-block ${
                  midiDeviceCount > 0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {midiDeviceCount > 0 ? `${midiDeviceCount} Dev` : 'Ready'}
              </span>
            </button>

            {/* Tab 4: Cloud Presets */}
            <button
              onClick={() => handleTabSelect('presets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                currentTab === 'presets'
                  ? 'bg-neutral-800 border-sky-400/50 text-white shadow-sm'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Globe
                size={15}
                className={currentTab === 'presets' ? 'text-sky-400' : 'text-neutral-400'}
              />
              <span>Cloud Presets</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 hidden sm:inline-block">
                {presets.length}
              </span>
            </button>
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
              availableInputDevices={availableInputDevices}
              availableOutputDevices={availableOutputDevices}
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
        <div className="px-5 py-3 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Settings applied instantly to real-time Web Audio graph</span>
            <span className="sm:hidden">Real-time sync</span>
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
