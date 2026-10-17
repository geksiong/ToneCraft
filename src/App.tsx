/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { SignalChainControlStack } from './components/SignalChainControlStack';
import { Pedalboard } from './components/Pedalboard';
import { AmpCabSection } from './components/AmpCabSection';
import { LooperPedal } from './components/LooperPedal';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';
import { TunerModal } from './components/TunerModal';
import { PresetLibraryModal } from './components/PresetLibraryModal';
import { AddPedalModal } from './components/AddPedalModal';
import { VstEditorModal } from './components/VstEditorModal';
import { LatencyInspectorModal } from './components/LatencyInspectorModal';
import { InputConditionerModal } from './components/InputConditionerModal';
import { calculateSignalChainLatency, SignalChainLatencyReport } from './audio/latencyTracker';
import { NamEngineStatus } from './audio/namEngine';
import {
  InputConditionerConfig,
  InputConditionerTelemetry
} from './audio/inputConditioner';
import { isNamModelProfile } from './audio/namModels';
import { Music2, Power } from 'lucide-react';

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
  const [isLatencyInspectorOpen, setIsLatencyInspectorOpen] = useState<boolean>(false);
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
  const [isPresetLibraryOpen, setIsPresetLibraryOpen] = useState<boolean>(false);
  const [isAddPedalOpen, setIsAddPedalOpen] = useState<boolean>(false);
  const [vstEditorPedal, setVstEditorPedal] = useState<VstPluginPedal | null>(null);

  // Input Conditioner State (Noise Gate & Anti-Whine Filter)
  const [isInputConditionerOpen, setIsInputConditionerOpen] = useState<boolean>(false);
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

  // Engine Startup: builds the complete graph first with minimise latency profile active, and starts selected source
  const startAudioEngine = async (sourceToUse?: string) => {
    try {
      const activeSource = sourceToUse || inputSource;

      // Ensure minimise latency profile is active when turning DSP ON
      await audioEngine.updateLatencySettings({
        profile: 'ultra-low',
        sampleRateMode: 'native',
        zeroLatencyCab: true,
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

    return () => {
      audioEngine.onTunerUpdate = null;
      audioEngine.onLooperUpdate = null;
      audioEngine.onPeakUpdate = null;
      audioEngine.onLatencyUpdate = null;
      audioEngine.onNamStatusUpdate = null;
      audioEngine.onConditionerUpdate = null;
    };
  }, []);

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
      zeroLatencyCab: true,
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

  // Global Bypass All
  const handleToggleBypassAll = () => {
    const nextState = !isBypassAll;
    setIsBypassAll(nextState);
    const updated = pedals.map(p => ({ ...p, enabled: !nextState }));
    setPedals(updated);
  };

  // Load Custom WAV IR
  const handleLoadCustomIrWav = async (buffer: ArrayBuffer, fileName: string) => {
    await audioEngine.loadCustomIrWav(buffer);
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
        onOpenInputConditioner={() => setIsInputConditionerOpen(true)}
        isRiffPlaying={isRiffPlaying}
        onToggleRiffPlaying={handleToggleRiffPlaying}
        currentPreset={currentPreset}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onOpenPresetLibrary={() => setIsPresetLibraryOpen(true)}
        availableOutputDevices={availableOutputDevices}
        selectedOutputDeviceId={latencySettings.selectedOutputDeviceId}
        onSelectOutputDevice={handleSelectOutputDevice}
        latencyMs={latencyReport.totalCalculatedMs}
        isTurboActive={
          latencySettings.profile === 'ultra-low' &&
          latencySettings.sampleRateMode === 'native' &&
          latencySettings.zeroLatencyCab &&
          latencySettings.zeroLookaheadLimiter &&
          latencySettings.bypassOsVoiceProcessing
        }
        isBluetoothDetected={latencyReport.isBluetoothActive}
        onOpenEngineSettings={() => setIsLatencyInspectorOpen(true)}
        onMinimiseLatency={handleMinimiseLatency}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Startup banner when DSP is OFF */}
        {!isRunning && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-neutral-900 to-amber-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center font-bold">
                <Power size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>DSP is currently OFF</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">STANDBY</span>
                </h3>
                <p className="text-xs text-neutral-300">
                  Switch the DSP power button ON to begin real-time modeling with minimized latency, neural amp models, and studio DSP worklets.
                </p>
              </div>
            </div>

            <button
              onClick={() => startAudioEngine()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center gap-2"
            >
              <Power size={14} className="fill-black" />
              <span>Turn DSP ON</span>
            </button>
          </div>
        )}

        {/* Real-time Oscilloscope & Spectrum Analyzer Deck */}
        <div className="mb-4">
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
        />

        {/* Pedalboard Stage */}
        <Pedalboard
          pedals={pedals}
          onUpdatePedal={handleUpdatePedal}
          onRemovePedal={handleRemovePedal}
          onReorderPedals={handleReorderPedals}
          onOpenAddPedal={() => setIsAddPedalOpen(true)}
          onOpenVstEditor={(pedal) => setVstEditorPedal(pedal)}
        />

        {/* Amp & Cabinet Stage (NAM Modeler & IR Convolver) */}
        <AmpCabSection
          namModel={namModel}
          irCabinet={irCabinet}
          onUpdateNam={handleUpdateNam}
          onUpdateCab={setIrCabinet}
          onLoadCustomIrWav={handleLoadCustomIrWav}
          ampEngineMode={ampEngineMode}
          onSetAmpEngineMode={handleSetAmpEngineMode}
          onOpenLatencyInspector={() => setIsLatencyInspectorOpen(true)}
          currentLatencyMs={latencyReport.totalCalculatedMs}
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
        />
      </main>

      {/* Footer info bar with live engine and latency status */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-6 py-3 text-xs text-neutral-400">
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
              onClick={() => setIsLatencyInspectorOpen(true)}
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

      <PresetLibraryModal
        isOpen={isPresetLibraryOpen}
        currentPreset={currentPreset}
        presets={presets}
        currentPedals={pedals}
        currentNam={namModel}
        currentCab={irCabinet}
        onClose={() => setIsPresetLibraryOpen(false)}
        onSelectPreset={handleSelectPreset}
        onPresetsUpdated={(updatedList) => {
          setPresets(updatedList);
          savePresetsToStorage(updatedList);
        }}
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

      <LatencyInspectorModal
        isOpen={isLatencyInspectorOpen}
        onClose={() => setIsLatencyInspectorOpen(false)}
        report={latencyReport}
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
      />

      <InputConditionerModal
        isOpen={isInputConditionerOpen}
        onClose={() => setIsInputConditionerOpen(false)}
        config={conditionerConfig}
        telemetry={conditionerTelemetry}
        onUpdateConfig={handleUpdateConditionerConfig}
        onLearnNoiseFloor={handleLearnNoiseFloor}
        isLearningNoiseFloor={isLearningNoiseFloor}
        onApplyWhineKiller={handleApplyWhineKiller}
        inputSource={inputSource}
        inputGain={inputGain}
        onInputGainChange={(val) => {
          setInputGain(val);
          audioEngine.setInputGain(val);
        }}
      />
    </div>
  );
}
