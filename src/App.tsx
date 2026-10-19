/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AnyPedal,
  NamModelConfig,
  IrCabinetConfig,
  LooperState,
  TunerData,
  Preset,
  VstPluginPedal
} from './types/pedal';
import { audioEngine, AudioLatencySettings } from './audio/audioEngine';
import {
  INITIAL_PRESETS,
  getStoredPresets,
  savePresetsToStorage,
  decodePresetFromShareUrl
} from './presets/defaultPresets';
import { Header } from './components/Header';
import { SignalChainControlStack, CollapsedSectionsState } from './components/SignalChainControlStack';
import { Pedalboard } from './components/Pedalboard';
import { AmpCabSection } from './components/AmpCabSection';
import { LooperPedal } from './components/LooperPedal';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';
import { TunerModal } from './components/TunerModal';
import { AddPedalModal } from './components/AddPedalModal';
import { VstEditorModal } from './components/VstEditorModal';
import { SettingsModal, SettingsModalTab } from './components/SettingsModal';
import { midiManager } from './audio/midiManager';
import { MidiActionTarget, MidiMapping } from './types/midi';
import { calculateSignalChainLatency, SignalChainLatencyReport } from './audio/latencyTracker';
import { NamEngineStatus } from './audio/namEngine';
import {
  InputConditionerConfig,
  InputConditionerTelemetry
} from './audio/inputConditioner';
import {
  InputChannelTelemetry,
  InputChannelRoutingMode,
  OutputChannelRoutingMode
} from './audio/inputChannelRouter';
import { isNamModelProfile } from './audio/namModels';
import { Music2, Power, Radio } from 'lucide-react';

export default function App() {
  // Preset & Rig State
  const [presets, setPresets] = useState<Preset[]>(getStoredPresets);
  const [currentPreset, setCurrentPreset] = useState<Preset>(() => {
    const shared = decodePresetFromShareUrl();
    return shared || getStoredPresets()[0] || INITIAL_PRESETS[0];
  });

  const [pedals, setPedals] = useState<AnyPedal[]>(currentPreset.pedals);
  const [namModel, setNamModel] = useState<NamModelConfig>(() => {
    const isNam = isNamModelProfile(currentPreset.namModel);
    const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isNam
      ? 'wasm-nam'
      : (currentPreset.namModel.engineMode && currentPreset.namModel.engineMode !== 'wasm-nam'
          ? currentPreset.namModel.engineMode
          : 'hd-triode');
    return {
      ...currentPreset.namModel,
      isRealNam: isNam,
      engineMode: targetEngine
    };
  });
  const [irCabinet, setIrCabinet] = useState<IrCabinetConfig>(currentPreset.irCabinet);
  const [bpm, setBpm] = useState<number>(currentPreset.bpm || 120);

  // Engine & Audio State (OFF by default, riffs NOT playing)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputSource, setInputSource] = useState<string>('riff-clean-funk');
  const [isRiffPlaying, setIsRiffPlaying] = useState<boolean>(false);
  const [inputGain, setInputGain] = useState<number>(50);
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBypassAll, setIsBypassAll] = useState<boolean>(false);

  // Engine Modes & Latency Diagnostics
  const [coreEngineMode, setCoreEngineMode] = useState<'hd-worklet' | 'standard'>('hd-worklet');
  const [ampEngineMode, setAmpEngineMode] = useState<'wasm-nam' | 'hd-triode' | 'waveshaper'>(() => {
    const isNam = isNamModelProfile(currentPreset.namModel);
    if (isNam) return 'wasm-nam';
    return (currentPreset.namModel.engineMode && currentPreset.namModel.engineMode !== 'wasm-nam')
      ? currentPreset.namModel.engineMode
      : 'hd-triode';
  });
  const [latencySettings, setLatencySettings] = useState<AudioLatencySettings>(() => audioEngine.latencySettings);
  const [availableInputDevices, setAvailableInputDevices] = useState<{ deviceId: string; label: string; isBluetooth: boolean }[]>([]);
  const [availableOutputDevices, setAvailableOutputDevices] = useState<{ deviceId: string; label: string; isBluetooth: boolean }[]>([]);
  const [latencyReport, setLatencyReport] = useState<SignalChainLatencyReport>(() =>
    calculateSignalChainLatency(null, currentPreset.pedals, {
      coreEngineMode: 'hd-worklet',
      ampEngineMode: 'wasm-nam'
    })
  );
  // Unified Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsModalTab>('input');

  const handleOpenSettings = (tab: SettingsModalTab = 'input') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };
  const [namStatus, setNamStatus] = useState<NamEngineStatus | null>(null);

  // Measurements
  const [inputPeak, setInputPeak] = useState<number>(0);
  const [outputPeak, setOutputPeak] = useState<number>(0);
  const [tunerData, setTunerData] = useState<TunerData>({
    note: '',
    frequency: 0,
    cents: 0,
    targetFrequency: 0,
    inTune: false,
    clarity: 0
  });

  // Looper State
  const [looperState, setLooperState] = useState<LooperState>({
    status: 'idle',
    speed: 1.0,
    reverse: false,
    volume: 85,
    duration: 0,
    currentTime: 0,
    layersCount: 0,
    hasUndo: false
  });

  // Modals
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [isAddPedalOpen, setIsAddPedalOpen] = useState<boolean>(false);
  const [vstEditorPedal, setVstEditorPedal] = useState<VstPluginPedal | null>(null);

  // MIDI Controller & Hardware State
  const [midiDeviceCount, setMidiDeviceCount] = useState<number>(() => midiManager.devices.length);
  const [isMidiActivity, setIsMidiActivity] = useState<boolean>(false);
  const [midiMappings, setMidiMappings] = useState<MidiMapping[]>(() => midiManager.mappings);
  const [midiStatusNotice, setMidiStatusNotice] = useState<string | null>(null);

  const midiActivityTimeoutRef = useRef<any>(null);
  const isMidiActiveRef = useRef<boolean>(false);
  const tapTimesRef = useRef<number[]>([]);
  const midiNoticeTimeoutRef = useRef<any>(null);

  const showMidiNotice = useCallback((msg: string) => {
    setMidiStatusNotice(msg);
    if (midiNoticeTimeoutRef.current) clearTimeout(midiNoticeTimeoutRef.current);
    midiNoticeTimeoutRef.current = setTimeout(() => setMidiStatusNotice(null), 2500);
  }, []);

  // Input Conditioner State (Noise Gate & Anti-Whine Filter)
  const [conditionerConfig, setConditionerConfig] = useState<InputConditionerConfig>(() => ({
    ...audioEngine.getInputConditionerConfig(),
    gateEnabled: false
  }));
  const [conditionerTelemetry, setConditionerTelemetry] = useState<InputConditionerTelemetry>({
    inputDb: -80,
    reductionDb: 0,
    gateState: 'open',
    highPitchNoiseDetected: false,
    highPitchEnergyDb: -100
  });
  const [isLearningNoiseFloor, setIsLearningNoiseFloor] = useState<boolean>(false);

  // Mono Input Detection & Dual-Channel Output Routing State
  const [inputRoutingMode, setInputRoutingMode] = useState<InputChannelRoutingMode>(() => {
    try {
      return (localStorage.getItem('tonecraft_input_routing') as InputChannelRoutingMode) || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [outputRoutingMode, setOutputRoutingMode] = useState<OutputChannelRoutingMode>(() => {
    try {
      return (localStorage.getItem('tonecraft_output_routing') as OutputChannelRoutingMode) || 'stereo';
    } catch {
      return 'stereo';
    }
  });
  const [inputChannelTelemetry, setInputChannelTelemetry] = useState<InputChannelTelemetry>({
    sourceChannelCount: 1,
    detectedType: 'mono-ch1',
    isMonoIdentified: true,
    routingMode: 'auto',
    effectiveRouting: 'mono-ch1',
    ch1LevelDb: -100,
    ch2LevelDb: -100,
    description: 'Mono Source (Input 1 / Left) ➔ Routed to Both Channels (L+R)'
  });

  // Collapsed Rig Views State (persisted to localStorage)
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSectionsState>(() => {
    try {
      const saved = localStorage.getItem('tonecraft_collapsed_views');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          pedalboard: Boolean(parsed.pedalboard),
          ampCab: Boolean(parsed.ampCab !== undefined ? parsed.ampCab : (parsed.amp || parsed.cab)),
          looper: Boolean(parsed.looper)
        };
      }
    } catch {}
    return {
      pedalboard: false,
      ampCab: false,
      looper: false
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('tonecraft_collapsed_views', JSON.stringify(collapsedSections));
    } catch {}
  }, [collapsedSections]);

  const handleToggleSectionCollapse = (section: keyof CollapsedSectionsState) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleAllCollapse = (collapseAll: boolean) => {
    setCollapsedSections({
      pedalboard: collapseAll,
      ampCab: collapseAll,
      looper: collapseAll
    });
  };

  // Engine Startup: builds the complete graph first with minimise latency profile active, and starts selected source
  const startAudioEngine = async (sourceToUse?: string) => {
    try {
      const activeSource = sourceToUse || inputSource;

      // Ensure ultra-low latency profile is active with real acoustic IR Convolver enabled
      await audioEngine.updateLatencySettings({
        profile: 'ultra-low',
        sampleRateMode: 'native',
        zeroLatencyCab: false,
        zeroLookaheadLimiter: true,
        bypassOsVoiceProcessing: true
      });
      setLatencySettings({ ...audioEngine.latencySettings });

      if (!audioEngine.ctx || audioEngine.ctx.state === 'closed') {
        await audioEngine.init();
        audioEngine.updatePedalboardChain(pedals);
        audioEngine.updateNamModel(namModel);
        audioEngine.updateIrCabinet(irCabinet);
        audioEngine.setMasterGain(masterVolume);
        audioEngine.setInputGain(inputGain);
        audioEngine.setInputRoutingMode(inputRoutingMode);
        audioEngine.setOutputRoutingMode(outputRoutingMode);

        if (activeSource.startsWith('mic')) {
          audioEngine.stopSampleRiff();
          setIsRiffPlaying(false);
          await audioEngine.setInputSource(activeSource);
          await refreshAudioDevices();
        } else {
          audioEngine.playSampleRiff(activeSource);
          setIsRiffPlaying(true);
        }
      } else {
        await audioEngine.resume();
        if (activeSource.startsWith('mic')) {
          audioEngine.stopSampleRiff();
          setIsRiffPlaying(false);
          await audioEngine.setInputSource(activeSource);
          await refreshAudioDevices();
        } else {
          audioEngine.playSampleRiff(activeSource);
          setIsRiffPlaying(true);
        }
      }

      setIsRunning(true);
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  };

  const toggleEngine = async () => {
    if (!isRunning) {
      await startAudioEngine();
    } else {
      try {
        await audioEngine.suspend();
      } catch (err) {
        console.error('Failed to switch off audio engine:', err);
      }
      setIsRunning(false);
      setIsRiffPlaying(false);
    }
  };

  const handleRestartEngine = async () => {
    try {
      const wasPlaying = isRiffPlaying;
      await audioEngine.restart();
      setIsRunning(true);
      if (inputSource !== 'mic' && wasPlaying) {
        audioEngine.playSampleRiff(inputSource);
        setIsRiffPlaying(true);
      } else {
        setIsRiffPlaying(false);
      }
    } catch (err) {
      console.error('Failed to restart audio engine:', err);
    }
  };

  // Toggle Riff Playing
  const handleToggleRiffPlaying = async () => {
    if (!isRunning) {
      await startAudioEngine();
      audioEngine.playSampleRiff(inputSource === 'mic' ? 'riff-clean-funk' : inputSource);
      setIsRiffPlaying(true);
      return;
    }
    const playing = audioEngine.toggleSampleRiff();
    setIsRiffPlaying(playing);
  };

  // Wire Engine Callbacks
  useEffect(() => {
    audioEngine.onTunerUpdate = (data) => setTunerData(data);
    audioEngine.onLooperUpdate = (state) => setLooperState(state);
    audioEngine.onPeakUpdate = (inPeak, outPeak) => {
      setInputPeak(inPeak);
      setOutputPeak(outPeak);
    };
    audioEngine.onLatencyUpdate = (report) => {
      setLatencyReport(report);
    };
    audioEngine.onNamStatusUpdate = (status) => {
      setNamStatus(status);
      setAmpEngineMode(status.activeEngine);
    };
    audioEngine.onConditionerUpdate = (stats) => {
      setConditionerTelemetry(stats);
    };
    audioEngine.onInputChannelUpdate = (stats) => {
      setInputChannelTelemetry(stats);
    };

    return () => {
      audioEngine.onTunerUpdate = null;
      audioEngine.onLooperUpdate = null;
      audioEngine.onPeakUpdate = null;
      audioEngine.onLatencyUpdate = null;
      audioEngine.onNamStatusUpdate = null;
      audioEngine.onConditionerUpdate = null;
      audioEngine.onInputChannelUpdate = null;
    };
  }, []);

  const handleInputRoutingChange = (mode: InputChannelRoutingMode) => {
    setInputRoutingMode(mode);
    audioEngine.setInputRoutingMode(mode);
  };

  const handleOutputRoutingChange = (mode: OutputChannelRoutingMode) => {
    setOutputRoutingMode(mode);
    audioEngine.setOutputRoutingMode(mode);
  };

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioEngine.setMasterMute(next);
      return next;
    });
  }, []);

  // Keyboard shortcut: Press 'm' or 'M' to instantly silence audio output
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleMute]);

  const handleUpdateConditionerConfig = (partial: Partial<InputConditionerConfig>) => {
    audioEngine.updateInputConditioner(partial);
    setConditionerConfig({ ...audioEngine.getInputConditionerConfig() });
  };

  const handleLearnNoiseFloor = () => {
    setIsLearningNoiseFloor(true);
    audioEngine.startLearnNoiseFloor(() => {
      setIsLearningNoiseFloor(false);
      setConditionerConfig({ ...audioEngine.getInputConditionerConfig() });
    });
  };

  const handleApplyWhineKiller = () => {
    audioEngine.applyWhineKillerPreset();
    setConditionerConfig({ ...audioEngine.getInputConditionerConfig() });
  };

  const handleSetCoreEngineMode = (mode: 'hd-worklet' | 'standard') => {
    setCoreEngineMode(mode);
    audioEngine.setCoreEngineMode(mode);
  };

  const handleSetAmpEngineMode = (mode: 'wasm-nam' | 'hd-triode' | 'waveshaper') => {
    const isNam = isNamModelProfile(namModel);
    if (isNam && mode !== 'wasm-nam') return;
    if (!isNam && mode === 'wasm-nam') return;

    setAmpEngineMode(mode);
    audioEngine.setAmpEngineMode(mode);
    setNamModel(prev => ({ ...prev, engineMode: mode }));
  };

  const handleUpdateNam = (updated: NamModelConfig) => {
    const isNam = isNamModelProfile(updated);
    const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isNam
      ? 'wasm-nam'
      : (updated.engineMode && updated.engineMode !== 'wasm-nam' ? updated.engineMode : 'hd-triode');

    const sanitized: NamModelConfig = {
      ...updated,
      isRealNam: isNam,
      engineMode: targetEngine
    };

    setNamModel(sanitized);
    setAmpEngineMode(targetEngine);
    audioEngine.setAmpEngineMode(targetEngine);
    if (audioEngine.isRunning) {
      audioEngine.updateNamModel(sanitized);
    }
  };

  const handleUpdateCab = (updated: IrCabinetConfig) => {
    setIrCabinet(updated);
    if (audioEngine.isRunning) {
      audioEngine.updateIrCabinet(updated);
    }
  };

  const refreshAudioDevices = useCallback(async () => {
    const inputs = await audioEngine.getAudioInputDevices();
    const outputs = await audioEngine.getAudioOutputDevices();
    setAvailableInputDevices(inputs);
    setAvailableOutputDevices(outputs);
  }, []);

  useEffect(() => {
    refreshAudioDevices();
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
      };
    }
  }, [refreshAudioDevices]);

  const handleUpdateLatencySettings = async (settings: Partial<AudioLatencySettings>) => {
    await audioEngine.updateLatencySettings(settings);
    setLatencySettings({ ...audioEngine.latencySettings });
    refreshAudioDevices();
  };

  const handleMinimiseLatency = async () => {
    await audioEngine.updateLatencySettings({
      profile: 'ultra-low',
      sampleRateMode: 'native',
      zeroLatencyCab: irCabinet.isCustom || irCabinet.isRealWav ? false : true,
      zeroLookaheadLimiter: true,
      bypassOsVoiceProcessing: true
    });
    setLatencySettings({ ...audioEngine.latencySettings });
  };

  const handleRunLatencyPing = async () => {
    return await audioEngine.runLatencyPing();
  };

  // Combined Input Source Selection (Microphones and Riffs)
  const handleSelectCombinedInput = async (val: string) => {
    setInputSource(val);
    if (val.startsWith('mic')) {
      const devId = val.startsWith('mic:') ? val.slice(4) : '';
      const cleanDevId = devId === 'default' ? '' : devId;
      await handleUpdateLatencySettings({ selectedInputDeviceId: cleanDevId });
      audioEngine.stopSampleRiff();
      setIsRiffPlaying(false);
      if (!isRunning) {
        await startAudioEngine(val);
      } else {
        await audioEngine.setInputSource(val, false);
      }
      await refreshAudioDevices();
    } else {
      // Riff selected
      if (!isRunning) {
        await startAudioEngine(val);
      } else {
        await audioEngine.setInputSource(val, false);
        audioEngine.playSampleRiff(val);
        setIsRiffPlaying(true);
      }
    }
  };

  const handleSelectOutputDevice = async (deviceId: string) => {
    await handleUpdateLatencySettings({ selectedOutputDeviceId: deviceId });
    if (isRunning) {
      await audioEngine.setOutputDevice(deviceId);
    }
    await refreshAudioDevices();
  };

  const handleToggleGate = () => {
    const next = !conditionerConfig.gateEnabled;
    handleUpdateConditionerConfig({
      gateEnabled: next,
      enabled: true
    });
  };

  // Sync Pedals with Audio Graph
  useEffect(() => {
    if (isRunning) {
      audioEngine.updatePedalboardChain(pedals);
    }
  }, [pedals, isRunning]);

  // Sync NAM Model
  useEffect(() => {
    if (isRunning) {
      audioEngine.updateNamModel(namModel);
    }
  }, [namModel, isRunning]);

  // Sync Cabinet
  useEffect(() => {
    if (isRunning) {
      audioEngine.updateIrCabinet(irCabinet);
    }
  }, [irCabinet, isRunning]);

  // Preset Selection
  const handleSelectPreset = (preset: Preset) => {
    setCurrentPreset(preset);
    setPedals(preset.pedals);

    const isPresetNam = isNamModelProfile(preset.namModel);
    const targetEngine: 'wasm-nam' | 'hd-triode' | 'waveshaper' = isPresetNam
      ? 'wasm-nam'
      : (preset.namModel.engineMode && preset.namModel.engineMode !== 'wasm-nam'
          ? preset.namModel.engineMode
          : 'hd-triode');

    const updatedNamModel: NamModelConfig = {
      ...preset.namModel,
      isRealNam: isPresetNam,
      engineMode: targetEngine,
      bypassed: preset.namModel.bypassed ?? false
    };

    setNamModel(updatedNamModel);
    setAmpEngineMode(targetEngine);

    setIrCabinet(preset.irCabinet);
    setBpm(preset.bpm || 120);
    setIsBypassAll(false);

    // Keep audioEngine state references current
    if (!isRunning) {
      audioEngine.currentPedals = preset.pedals;
    }
    audioEngine.currentNamConfig = updatedNamModel;
    audioEngine.currentCabConfig = preset.irCabinet;

    if (isRunning) {
      audioEngine.updatePedalboardChain(preset.pedals);
      audioEngine.updateNamModel(updatedNamModel);
      audioEngine.updateIrCabinet(preset.irCabinet);
    }
  };

  // Update Pedal
  const handleUpdatePedal = (updated: AnyPedal) => {
    setPedals(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (isRunning) {
      audioEngine.updatePedalParameters(updated);
    }
  };

  // Remove Pedal
  const handleRemovePedal = (id: string) => {
    setPedals(prev => prev.filter(p => p.id !== id));
  };

  // Reorder Pedals
  const handleReorderPedals = (newPedals: AnyPedal[]) => {
    setPedals(newPedals);
  };

  // Add Pedal
  const handleAddPedal = (newPedal: AnyPedal) => {
    setPedals(prev => [...prev, newPedal]);
  };

  // Global Bypass All Pedals
  const handleToggleBypassAll = () => {
    const nextState = !isBypassAll;
    setIsBypassAll(nextState);
    const updated = pedals.map(p => ({ ...p, enabled: !nextState }));
    setPedals(updated);
    if (audioEngine.isRunning) {
      audioEngine.updatePedalboardChain(updated);
    }
  };

  // MIDI Hardware Action Dispatcher
  const handleMidiAction = useCallback((target: MidiActionTarget, value: number, rawMsg: any) => {
    switch (target.type) {
      case 'pedal_toggle': {
        const slotIdx = target.slotIndex;
        setPedals(prev => {
          if (slotIdx >= prev.length) return prev;
          const pedal = prev[slotIdx];
          const updatedPedal = { ...pedal, enabled: !pedal.enabled };
          if (audioEngine.isRunning) {
            audioEngine.updatePedalParameters(updatedPedal);
          }
          showMidiNotice(`Pedal #${slotIdx + 1} (${pedal.name}): ${updatedPedal.enabled ? 'ENGAGED' : 'BYPASSED'}`);
          return prev.map((p, i) => (i === slotIdx ? updatedPedal : p));
        });
        break;
      }

      case 'pedal_param': {
        const slotIdx = target.slotIndex;
        const paramKey = target.paramKey;
        setPedals(prev => {
          if (slotIdx >= prev.length) return prev;
          const pedal = prev[slotIdx];
          const updatedPedal = { ...pedal, [paramKey]: value };
          if (audioEngine.isRunning) {
            audioEngine.updatePedalParameters(updatedPedal);
          }
          return prev.map((p, i) => (i === slotIdx ? updatedPedal : p));
        });
        break;
      }

      case 'preset_index': {
        const pIdx = target.presetIndex;
        setPresets(currentList => {
          if (pIdx >= 0 && pIdx < currentList.length) {
            handleSelectPreset(currentList[pIdx]);
            showMidiNotice(`Preset: ${currentList[pIdx].name}`);
          }
          return currentList;
        });
        break;
      }

      case 'preset_next': {
        setPresets(currentList => {
          const currentIdx = currentList.findIndex(p => p.id === currentPreset.id);
          const nextIdx = (currentIdx + 1) % currentList.length;
          handleSelectPreset(currentList[nextIdx]);
          showMidiNotice(`Next Preset: ${currentList[nextIdx].name}`);
          return currentList;
        });
        break;
      }

      case 'preset_prev': {
        setPresets(currentList => {
          const currentIdx = currentList.findIndex(p => p.id === currentPreset.id);
          const prevIdx = (currentIdx - 1 + currentList.length) % currentList.length;
          handleSelectPreset(currentList[prevIdx]);
          showMidiNotice(`Prev Preset: ${currentList[prevIdx].name}`);
          return currentList;
        });
        break;
      }

      case 'preset_id': {
        setPresets(currentList => {
          const found = currentList.find(p => p.id === target.presetId);
          if (found) {
            handleSelectPreset(found);
            showMidiNotice(`Preset: ${found.name}`);
          }
          return currentList;
        });
        break;
      }

      case 'master_volume': {
        const rounded = Math.max(0, Math.min(100, Math.round(value)));
        setMasterVolume(rounded);
        audioEngine.setMasterGain(rounded);
        break;
      }

      case 'input_gain': {
        const rounded = Math.max(0, Math.min(100, Math.round(value)));
        setInputGain(rounded);
        audioEngine.setInputGain(rounded);
        break;
      }

      case 'master_mute': {
        handleToggleMute();
        showMidiNotice(isMuted ? 'Output Restored' : 'Muted');
        break;
      }

      case 'bypass_all': {
        handleToggleBypassAll();
        showMidiNotice(isBypassAll ? 'Restored Pedals' : 'Bypassed All Pedals');
        break;
      }

      case 'tuner_toggle': {
        setIsTunerOpen(prev => !prev);
        break;
      }

      case 'tap_tempo': {
        const now = Date.now();
        const taps = [...tapTimesRef.current.filter((t: number) => now - t < 2500), now];
        tapTimesRef.current = taps;
        if (taps.length >= 2) {
          const diffs: number[] = [];
          for (let i = 1; i < taps.length; i++) {
            diffs.push(taps[i] - taps[i - 1]);
          }
          const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
          const calculatedBpm = Math.max(40, Math.min(260, Math.round(60000 / avgDiff)));
          setBpm(calculatedBpm);
          showMidiNotice(`Tap Tempo: ${calculatedBpm} BPM`);
        }
        break;
      }

      case 'dsp_power': {
        toggleEngine();
        break;
      }

      case 'amp_param': {
        if (target.paramKey === 'bypassed') {
          setNamModel(prev => {
            const nextState = !prev.bypassed;
            showMidiNotice(`Amp: ${nextState ? 'BYPASS' : 'ACTIVE'}`);
            return { ...prev, bypassed: nextState };
          });
        } else {
          const ampVal = Math.round((value / 10) * 10) / 10;
          setNamModel(prev => ({ ...prev, [target.paramKey]: ampVal }));
        }
        break;
      }

      case 'cab_param': {
        if (target.paramKey === 'bypassed') {
          setIrCabinet(prev => {
            const nextState = !prev.bypassed;
            showMidiNotice(`Cab: ${nextState ? 'BYPASS' : 'ACTIVE'}`);
            return { ...prev, bypassed: nextState };
          });
        } else {
          setIrCabinet(prev => ({ ...prev, [target.paramKey]: value }));
        }
        break;
      }

      case 'looper_cmd': {
        switch (target.command) {
          case 'record':
            audioEngine.toggleLooperRecord();
            showMidiNotice('Looper: Record / Overdub');
            break;
          case 'play':
            audioEngine.toggleLooperPlayStop();
            showMidiNotice('Looper: Play / Stop');
            break;
          case 'undo':
            audioEngine.undoLooper();
            showMidiNotice('Looper: Undo');
            break;
          case 'clear':
            audioEngine.clearLooper();
            showMidiNotice('Looper: Cleared');
            break;
          case 'reverse':
            audioEngine.toggleLooperReverse();
            showMidiNotice('Looper: Reverse');
            break;
          case 'speed':
            audioEngine.toggleLooperSpeed();
            showMidiNotice('Looper: Speed Toggle');
            break;
          case 'volume':
            audioEngine.setLooperVolume(Math.round(value));
            break;
        }
        break;
      }
    }
  }, [currentPreset.id, handleToggleMute, isBypassAll, isMuted, showMidiNotice, toggleEngine]);

  const handleMidiActionRef = useRef(handleMidiAction);
  handleMidiActionRef.current = handleMidiAction;

  // Connect MIDI Manager lifecycle ONCE on mount (empty dependency array prevents re-render loop)
  useEffect(() => {
    midiManager.onAction = (target, val, raw) => {
      handleMidiActionRef.current?.(target, val, raw);
    };

    const unsubActivity = midiManager.subscribeActivity(() => {
      if (!isMidiActiveRef.current) {
        isMidiActiveRef.current = true;
        setIsMidiActivity(true);
      }
      if (midiActivityTimeoutRef.current) clearTimeout(midiActivityTimeoutRef.current);
      midiActivityTimeoutRef.current = setTimeout(() => {
        isMidiActiveRef.current = false;
        setIsMidiActivity(false);
      }, 250);
    });

    const unsubDevices = midiManager.subscribeDevices((devs) => {
      setMidiDeviceCount(prev => (prev === devs.length ? prev : devs.length));
    });

    // Attempt non-blocking initialization of Web MIDI once on startup
    midiManager.init().then(() => {
      setMidiDeviceCount(prev => (prev === midiManager.devices.length ? prev : midiManager.devices.length));
    });

    return () => {
      midiManager.onAction = null;
      unsubActivity();
      unsubDevices();
      if (midiActivityTimeoutRef.current) clearTimeout(midiActivityTimeoutRef.current);
    };
  }, []);

  // Keep midiMappings in sync when modal is opened/closed
  useEffect(() => {
    setMidiMappings([...midiManager.mappings]);
  }, [isSettingsOpen]);

  // Load Custom WAV IR
  const handleLoadCustomIrWav = async (buffer: ArrayBuffer, fileName: string) => {
    await audioEngine.loadCustomIrWav(buffer);
    setLatencySettings({ ...audioEngine.latencySettings, zeroLatencyCab: false });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top App Header with 2 rows of controls and hardware DSP power switch with LED */}
      <Header
        isRunning={isRunning}
        onToggleEngine={toggleEngine}
        onRestartEngine={handleRestartEngine}
        inputSource={inputSource}
        onSelectCombinedInput={handleSelectCombinedInput}
        availableInputDevices={availableInputDevices}
        selectedInputDeviceId={latencySettings.selectedInputDeviceId}
        inputGain={inputGain}
        onInputGainChange={(v) => {
          setInputGain(v);
          audioEngine.setInputGain(v);
        }}
        inputPeak={inputPeak}
        gateEnabled={conditionerConfig.gateEnabled}
        onToggleGate={handleToggleGate}
        gateState={conditionerTelemetry.gateState}
        onOpenInputConditioner={() => handleOpenSettings('input')}
        channelTelemetry={inputChannelTelemetry}
        inputRoutingMode={inputRoutingMode}
        onInputRoutingChange={handleInputRoutingChange}
        isRiffPlaying={isRiffPlaying}
        onToggleRiffPlaying={handleToggleRiffPlaying}
        currentPreset={currentPreset}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onOpenPresetLibrary={() => handleOpenSettings('presets')}
        availableOutputDevices={availableOutputDevices}
        selectedOutputDeviceId={latencySettings.selectedOutputDeviceId}
        onSelectOutputDevice={handleSelectOutputDevice}
        latencyMs={latencyReport.totalCalculatedMs}
        isTurboActive={
          latencySettings.profile === 'ultra-low' &&
          latencySettings.sampleRateMode === 'native' &&
          latencySettings.zeroLookaheadLimiter &&
          latencySettings.bypassOsVoiceProcessing
        }
        isBluetoothDetected={latencyReport.isBluetoothActive}
        onOpenEngineSettings={() => handleOpenSettings('engine')}
        onMinimiseLatency={handleMinimiseLatency}
        onOpenMidiSettings={() => handleOpenSettings('midi')}
        onOpenSettings={handleOpenSettings}
        midiDeviceCount={midiDeviceCount}
        isMidiActivity={isMidiActivity}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-3 flex flex-col">
        {/* Startup banner when DSP is OFF */}
        {!isRunning && (
          <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-neutral-900 to-amber-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center font-bold">
                <Power size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>DSP is currently OFF</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">STANDBY</span>
                </h3>
                <p className="text-[11px] text-neutral-300">
                  Switch the DSP power button ON to begin real-time modeling with minimized latency and neural amp models.
                </p>
              </div>
            </div>

            <button
              onClick={() => startAudioEngine()}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5"
            >
              <Power size={13} className="fill-black" />
              <span>Turn DSP ON</span>
            </button>
          </div>
        )}

        {/* Real-time Oscilloscope & Spectrum Analyzer Deck */}
        <div className="mb-2">
          <SpectrumVisualizer isRunning={isRunning} />
        </div>

        {/* Control Stack directly above the signal chain: Tuner, Tap Tempo, Mute & Master Vol */}
        <SignalChainControlStack
          tunerData={tunerData}
          onOpenTuner={() => setIsTunerOpen(true)}
          isMicInput={inputSource.startsWith('mic')}
          bpm={bpm}
          onBpmChange={setBpm}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          masterVolume={masterVolume}
          onMasterVolumeChange={(v) => {
            setMasterVolume(v);
            audioEngine.setMasterGain(v);
          }}
          outputPeak={outputPeak}
          isBypassAll={isBypassAll}
          onToggleBypassAll={handleToggleBypassAll}
          pedalsCount={pedals.length}
          collapsedSections={collapsedSections}
          onToggleSectionCollapse={handleToggleSectionCollapse}
          onToggleAllCollapse={handleToggleAllCollapse}
        />

        {/* Pedalboard Stage */}
        <Pedalboard
          pedals={pedals}
          onUpdatePedal={handleUpdatePedal}
          onRemovePedal={handleRemovePedal}
          onReorderPedals={handleReorderPedals}
          onOpenAddPedal={() => setIsAddPedalOpen(true)}
          onOpenVstEditor={(pedal) => setVstEditorPedal(pedal)}
          isCollapsed={collapsedSections.pedalboard}
          onToggleCollapse={() => handleToggleSectionCollapse('pedalboard')}
          midiMappings={midiMappings}
          onOpenMidiSettings={() => handleOpenSettings('midi')}
        />

        {/* Amp & Cabinet Stage (NAM Modeler & IR Convolver) */}
        <AmpCabSection
          namModel={namModel}
          irCabinet={irCabinet}
          onUpdateNam={handleUpdateNam}
          onUpdateCab={handleUpdateCab}
          onLoadCustomIrWav={handleLoadCustomIrWav}
          ampEngineMode={ampEngineMode}
          onSetAmpEngineMode={handleSetAmpEngineMode}
          onOpenLatencyInspector={() => handleOpenSettings('engine')}
          currentLatencyMs={latencyReport.totalCalculatedMs}
          isCollapsed={collapsedSections.ampCab}
          onToggleCollapse={() => handleToggleSectionCollapse('ampCab')}
        />

        {/* Tape Looper Unit */}
        <LooperPedal
          looperState={looperState}
          onToggleRecord={() => audioEngine.toggleLooperRecord()}
          onTogglePlayStop={() => audioEngine.toggleLooperPlayStop()}
          onClear={() => audioEngine.clearLooper()}
          onUndo={() => audioEngine.undoLooper()}
          onToggleReverse={() => audioEngine.toggleLooperReverse()}
          onToggleSpeed={() => audioEngine.toggleLooperSpeed()}
          onVolumeChange={(vol) => audioEngine.setLooperVolume(vol)}
          isCollapsed={collapsedSections.looper}
          onToggleCollapse={() => handleToggleSectionCollapse('looper')}
        />
      </main>

      {/* Footer info bar with live engine and latency status */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-1.5 text-[11px] text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">ToneCraft DSP Engine</span>
            <span>·</span>
            <span className="font-mono text-amber-400">
              {coreEngineMode === 'hd-worklet' ? 'HD AudioWorklet Core' : 'Native Web Audio'}
            </span>
            <span>·</span>
            <span className="font-mono text-emerald-400">
              {ampEngineMode === 'wasm-nam' ? 'TONE3000 WASM NAM' : ampEngineMode === 'hd-triode' ? 'HD Triode Worklet' : 'Waveshaper'}
            </span>
            <span>·</span>
            <span className="font-mono text-sky-400">
              {irCabinet.isRealWav || irCabinet.isCustom ? 'Decoded WAV IR' : 'Synthetic IR'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={() => handleOpenSettings('midi')}
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-neutral-300"
              title="Click to open MIDI Controller settings & mapping console"
            >
              <Radio
                size={11}
                className={
                  isMidiActivity
                    ? 'text-amber-300 animate-ping'
                    : midiDeviceCount > 0
                    ? 'text-emerald-400'
                    : 'text-neutral-500'
                }
              />
              <span>
                MIDI: <strong>{midiDeviceCount > 0 ? `${midiDeviceCount} Dev` : 'Enabled'}</strong> ({midiMappings.filter(m => m.enabled).length} Maps)
              </span>
            </button>
            <span>·</span>
            <button
              onClick={() => handleOpenSettings('engine')}
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Latency: <strong>{latencyReport.totalCalculatedMs.toFixed(1)}ms</strong> ({latencyReport.latencyTier})</span>
            </button>
            <span>·</span>
            <span>48.0 kHz / 128 samples</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TunerModal
        isOpen={isTunerOpen}
        tunerData={tunerData}
        isMicInput={inputSource.startsWith('mic')}
        onSelectMic={() => handleSelectCombinedInput('mic:default')}
        onClose={() => setIsTunerOpen(false)}
      />

      <AddPedalModal
        isOpen={isAddPedalOpen}
        onClose={() => setIsAddPedalOpen(false)}
        onAddPedal={handleAddPedal}
      />

      <VstEditorModal
        isOpen={!!vstEditorPedal}
        pedal={vstEditorPedal}
        onClose={() => setVstEditorPedal(null)}
        onSave={(updated) => {
          handleUpdatePedal(updated);
          setVstEditorPedal(null);
        }}
      />

      {/* Unified Tabbed Settings Modal: Input & Gate, DSP Engine & Latency, MIDI, and Cloud Presets Hub */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        // Input Conditioning & Noise Gate
        conditionerConfig={conditionerConfig}
        conditionerTelemetry={conditionerTelemetry}
        onUpdateConditionerConfig={handleUpdateConditionerConfig}
        onLearnNoiseFloor={handleLearnNoiseFloor}
        isLearningNoiseFloor={isLearningNoiseFloor}
        onApplyWhineKiller={handleApplyWhineKiller}
        inputSource={inputSource}
        inputGain={inputGain}
        onInputGainChange={(val) => {
          setInputGain(val);
          audioEngine.setInputGain(val);
        }}
        channelTelemetry={inputChannelTelemetry}
        inputRoutingMode={inputRoutingMode}
        onInputRoutingChange={handleInputRoutingChange}
        outputRoutingMode={outputRoutingMode}
        onOutputRoutingChange={handleOutputRoutingChange}
        // DSP Engine & Latency
        latencyReport={latencyReport}
        coreEngineMode={coreEngineMode}
        onSetCoreEngineMode={handleSetCoreEngineMode}
        ampEngineMode={ampEngineMode}
        onSetAmpEngineMode={handleSetAmpEngineMode}
        isWasmReady={audioEngine.namEngine.isWasmReady}
        onRunLatencyPing={handleRunLatencyPing}
        latencySettings={latencySettings}
        onUpdateLatencySettings={handleUpdateLatencySettings}
        availableInputDevices={availableInputDevices}
        availableOutputDevices={availableOutputDevices}
        // MIDI Controller & Hardware
        pedals={pedals}
        presets={presets}
        currentPreset={currentPreset}
        masterVolume={masterVolume}
        isMuted={isMuted}
        onSelectPreset={handleSelectPreset}
        onUpdatePedal={handleUpdatePedal}
        onToggleMute={handleToggleMute}
        midiDeviceCount={midiDeviceCount}
        isMidiActivity={isMidiActivity}
        // Cloud Hub & Preset Library
        currentPedals={pedals}
        currentNam={namModel}
        currentCab={irCabinet}
        onPresetsUpdated={(updatedList) => {
          setPresets(updatedList);
          savePresetsToStorage(updatedList);
        }}
      />

      {/* Floating Real-Time MIDI Action Feedback Pill */}
      {midiStatusNotice && (
        <div className="fixed bottom-12 right-6 z-50 px-4 py-2 rounded-full bg-neutral-900/95 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <Radio size={14} className="text-amber-400 animate-pulse shrink-0" />
          <span>{midiStatusNotice}</span>
        </div>
      )}
    </div>
  );
}
