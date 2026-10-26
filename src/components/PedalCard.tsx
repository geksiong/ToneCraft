import React from 'react';
import {
  AnyPedal,
  OverdrivePedal,
  DistortionPedal,
  FuzzPedal,
  CompressorPedal,
  ChorusPedal,
  FlangerPedal,
  PhaserPedal,
  TremoloPedal,
  DelayPedal,
  ReverbPedal,
  EqPedal,
  NoiseGatePedal,
  AutoWahPedal,
  PitchShifterPedal,
  HarmonizerPedal,
  VocalTunerPedal,
  VocalDoublerPedal,
  DeEsserPedal,
  TelephoneVoicePedal,
  VocalFormantPedal,
  VocalHarmonyPedal,
  VocalPreampPedal,
  VocalStutterPedal,
  VocalAlienPedal,
  GranularCloudPedal,
  ArcadeSynthPedal,
  SpectralFreezePedal,
  TapeGlitchPedal,
  UniVibePedal,
  HarmonicTremoloPedal,
  SlowGearPedal,
  KlonOverdrivePedal,
  MultiOctavePedal,
  TalkingWahPedal,
  ReverseReverbPedal,
  CrystalDelayPedal,
  HardTunePedal,
  LofiVinylPedal
} from '../types/pedal';
import { MidiMapping } from '../types/midi';
import { RotaryKnob } from './RotaryKnob';
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  Radio
} from 'lucide-react';

interface PedalCardProps {
  pedal: AnyPedal;
  index: number;
  totalPedals: number;
  onUpdate: (updated: AnyPedal) => void;
  onRemove: (id: string) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  midiMappings?: MidiMapping[];
  onOpenMidiSettings?: () => void;
}

export const PedalCard: React.FC<PedalCardProps> = ({
  pedal,
  index,
  totalPedals,
  onUpdate,
  onRemove,
  onMoveLeft,
  onMoveRight,
  midiMappings,
  onOpenMidiSettings
}) => {
  const toggleBypass = () => {
    // Play synthetic footswitch mechanical click
    playStompClick();
    onUpdate({ ...pedal, enabled: !pedal.enabled });
  };

  const playStompClick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  // Determine LED glow class based on pedal color or type
  const getLedClass = () => {
    if (!pedal.enabled) return 'bg-neutral-800 border-neutral-700 opacity-60';
    if (pedal.type === 'fuzz' || pedal.type === 'distortion') return 'bg-red-500 led-glow-red border-red-300';
    if (pedal.type === 'overdrive') return 'bg-emerald-400 led-glow-emerald border-emerald-200';
    if (pedal.type === 'chorus' || pedal.type === 'flanger') return 'bg-blue-400 led-glow-blue border-blue-200';
    if (pedal.type === 'vocalTuner') return 'bg-cyan-400 led-glow-cyan border-cyan-200';
    if (pedal.type === 'vocalDoubler') return 'bg-indigo-400 led-glow-indigo border-indigo-200';
    if (pedal.type === 'vocalFormant') return 'bg-fuchsia-400 led-glow-fuchsia border-fuchsia-200';
    if (pedal.type === 'pitchShifter' || pedal.type === 'harmonizer' || pedal.type === 'reverb') {
      return 'bg-purple-400 led-glow-purple border-purple-200';
    }
    return 'bg-amber-400 led-glow-amber border-amber-200';
  };

  const toggleMapping = midiMappings?.find(
    (m) =>
      m.enabled &&
      m.target.type === 'pedal_toggle' &&
      (m.target.slotIndex === index || (m.target as any).pedalId === pedal.id)
  );

  const midiBypassBadge = toggleMapping
    ? toggleMapping.commandType === 'cc'
      ? `CC #${toggleMapping.controlNumber}`
      : toggleMapping.commandType === 'note'
      ? `NOTE #${toggleMapping.controlNumber}`
      : `PC #${toggleMapping.controlNumber}`
    : undefined;

  return (
    <div
      className="relative flex flex-col justify-between w-56 min-w-[224px] rounded-xl pedal-shadow transition-all duration-150 border border-neutral-700/60 overflow-hidden"
      style={{
        backgroundColor: pedal.color || '#262626',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.35) 100%)'
      }}
    >
      {/* Top Screws and Drag/Order Bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 bg-black/25 border-b border-white/10">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveLeft(index)}
            disabled={index === 0}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move earlier in chain"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => onMoveRight(index)}
            disabled={index === totalPedals - 1}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Move later in chain"
          >
            <ChevronRight size={14} />
          </button>
          <span className="text-[10px] font-mono font-bold text-neutral-400 w-6 text-center tabular-nums inline-block px-1">
            #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onRemove(pedal.id)}
            className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
            title="Remove pedal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Pedal Brand & Title */}
      <div className="px-3 pt-2 text-center">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/90 drop-shadow">
          {pedal.name}
        </h4>
        <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-mono tracking-wider text-white/60 uppercase">
          <span className="max-w-[70px] truncate">{pedal.type}</span>
          <span>·</span>
          <span className="w-12 text-center inline-block">{pedal.enabled ? 'ACTIVE' : 'BYPASS'}</span>
        </div>
      </div>

      {/* LED Pilot Indicator */}
      <div className="flex justify-center my-1">
        <div className="p-1 rounded-full bg-neutral-900/80 border border-neutral-600/60 shadow-inner">
          <div
            className={`w-3 h-3 rounded-full border transition-all duration-200 ${getLedClass()}`}
          />
        </div>
      </div>

      {/* Knobs & Controls Matrix */}
      <div className="px-3 py-2 flex-1 flex flex-col justify-center">
        {renderPedalControls(pedal, onUpdate, index, midiMappings)}
      </div>

      {/* Bottom Stompswitch & Chassis Foot */}
      <div className="pt-2 pb-3 px-3 bg-gradient-to-t from-black/50 to-transparent flex flex-col items-center">
        <button
          onClick={toggleBypass}
          className="relative group p-1 rounded-full focus:outline-none"
          title={pedal.enabled ? 'Bypass pedal' : 'Engage pedal'}
        >
          {/* Chrome Hex Nut Washer */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-600 flex items-center justify-center footswitch-shadow">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400 border border-neutral-400 flex items-center justify-center shadow-inner">
              {/* Pressable chrome button cap */}
              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-400 flex items-center justify-center border border-white transition-all duration-75 active:scale-90 active:translate-y-0.5"
                style={{
                  boxShadow: pedal.enabled
                    ? '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px #ffffff'
                    : '0 3px 6px rgba(0,0,0,0.6), inset 0 1px 2px #ffffff'
                }}
              >
                <Power
                  size={12}
                  className={`transition-colors ${
                    pedal.enabled ? 'text-amber-500' : 'text-neutral-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Vintage Stompbox Bottom Badge with MIDI tag */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[8px] tracking-widest font-mono text-white/40 uppercase">
            TRUE BYPASS
          </span>
          {midiBypassBadge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenMidiSettings) onOpenMidiSettings();
              }}
              className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 transition-colors"
              title={`Controlled by MIDI ${midiBypassBadge}. Click to view/edit MIDI settings.`}
            >
              MIDI {midiBypassBadge}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper to render controls based on pedal subtype
 */
function renderPedalControls(
  pedal: AnyPedal,
  onUpdate: (p: AnyPedal) => void,
  slotIndex?: number,
  midiMappings?: MidiMapping[]
) {
  // O(1) param lookup map to eliminate linear array searches across 40 mappings for every knob
  const paramMap = new Map<string, string>();
  if (slotIndex !== undefined && midiMappings) {
    for (let i = 0; i < midiMappings.length; i++) {
      const item = midiMappings[i];
      if (item.enabled && item.target.type === 'pedal_param' && item.target.slotIndex === slotIndex) {
        paramMap.set(
          item.target.paramKey,
          item.commandType === 'cc' ? `CC ${item.controlNumber}` : `${item.commandType.toUpperCase()} ${item.controlNumber}`
        );
      }
    }
  }
  const getKnobBadge = (paramKey: string) => paramMap.get(paramKey);

  switch (pedal.type) {
    case 'overdrive': {
      const p = pedal as OverdrivePedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Drive"
              value={p.drive}
              unit="%"
              midiBadge={getKnobBadge('drive')}
              onChange={(v) => onUpdate({ ...p, drive: v })}
            />
            <RotaryKnob
              label="Tone"
              value={p.tone}
              unit="%"
              midiBadge={getKnobBadge('tone')}
              onChange={(v) => onUpdate({ ...p, tone: v })}
            />
            <RotaryKnob
              label="Level"
              value={p.level}
              unit="%"
              midiBadge={getKnobBadge('level')}
              onChange={(v) => onUpdate({ ...p, level: v })}
            />
          </div>
          <div className="flex justify-center">
            <label className="flex items-center gap-1.5 text-[9px] font-mono cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={p.bassBoost}
                onChange={(e) => onUpdate({ ...p, bassBoost: e.target.checked })}
                className="rounded accent-emerald-500 text-xs"
              />
              <span>FAT BASS BOOST</span>
            </label>
          </div>
        </div>
      );
    }

    case 'distortion': {
      const p = pedal as DistortionPedal;
      return (
        <div className="grid grid-cols-3 gap-1">
          <RotaryKnob
            label="Gain"
            value={p.gain}
            unit="%"
            midiBadge={getKnobBadge('gain')}
            onChange={(v) => onUpdate({ ...p, gain: v })}
          />
          <RotaryKnob
            label="Filter"
            value={p.filter}
            unit="%"
            midiBadge={getKnobBadge('filter')}
            onChange={(v) => onUpdate({ ...p, filter: v })}
          />
          <RotaryKnob
            label="Vol"
            value={p.volume}
            unit="%"
            midiBadge={getKnobBadge('volume')}
            onChange={(v) => onUpdate({ ...p, volume: v })}
          />
        </div>
      );
    }

    case 'fuzz': {
      const p = pedal as FuzzPedal;
      return (
        <div className="grid grid-cols-2 gap-y-2 gap-x-1">
          <RotaryKnob
            label="Fuzz"
            value={p.fuzz}
            unit="%"
            midiBadge={getKnobBadge('fuzz')}
            onChange={(v) => onUpdate({ ...p, fuzz: v })}
          />
          <RotaryKnob
            label="Tone"
            value={p.tone}
            unit="%"
            midiBadge={getKnobBadge('tone')}
            onChange={(v) => onUpdate({ ...p, tone: v })}
          />
          <RotaryKnob
            label="Vol"
            value={p.volume}
            unit="%"
            midiBadge={getKnobBadge('volume')}
            onChange={(v) => onUpdate({ ...p, volume: v })}
          />
          <RotaryKnob
            label="Scoop"
            value={p.scoop}
            unit="%"
            midiBadge={getKnobBadge('scoop')}
            onChange={(v) => onUpdate({ ...p, scoop: v })}
          />
        </div>
      );
    }

    case 'compressor': {
      const p = pedal as CompressorPedal;
      return (
        <div className="grid grid-cols-2 gap-y-2 gap-x-1">
          <RotaryKnob
            label="Sustain"
            value={p.sustain}
            unit="%"
            onChange={(v) => onUpdate({ ...p, sustain: v })}
          />
          <RotaryKnob
            label="Attack"
            value={p.attack}
            unit="ms"
            onChange={(v) => onUpdate({ ...p, attack: v })}
          />
          <RotaryKnob
            label="Level"
            value={p.level}
            unit="%"
            onChange={(v) => onUpdate({ ...p, level: v })}
          />
          <RotaryKnob
            label="Blend"
            value={p.blend}
            unit="%"
            onChange={(v) => onUpdate({ ...p, blend: v })}
          />
        </div>
      );
    }

    case 'chorus': {
      const p = pedal as ChorusPedal;
      return (
        <div className="grid grid-cols-2 gap-y-2 gap-x-1">
          <RotaryKnob
            label="Rate"
            value={p.rate}
            unit="%"
            onChange={(v) => onUpdate({ ...p, rate: v })}
          />
          <RotaryKnob
            label="Depth"
            value={p.depth}
            unit="%"
            onChange={(v) => onUpdate({ ...p, depth: v })}
          />
          <RotaryKnob
            label="Mix"
            value={p.mix}
            unit="%"
            onChange={(v) => onUpdate({ ...p, mix: v })}
          />
          <RotaryKnob
            label="Tone"
            value={p.tone}
            unit="%"
            onChange={(v) => onUpdate({ ...p, tone: v })}
          />
        </div>
      );
    }

    case 'flanger': {
      const p = pedal as FlangerPedal;
      return (
        <div className="grid grid-cols-2 gap-y-2 gap-x-1">
          <RotaryKnob
            label="Rate"
            value={p.rate}
            unit="%"
            onChange={(v) => onUpdate({ ...p, rate: v })}
          />
          <RotaryKnob
            label="Depth"
            value={p.depth}
            unit="%"
            onChange={(v) => onUpdate({ ...p, depth: v })}
          />
          <RotaryKnob
            label="Feedback"
            value={p.feedback}
            unit="%"
            onChange={(v) => onUpdate({ ...p, feedback: v })}
          />
          <RotaryKnob
            label="Manual"
            value={p.manual}
            unit="%"
            onChange={(v) => onUpdate({ ...p, manual: v })}
          />
        </div>
      );
    }

    case 'phaser': {
      const p = pedal as PhaserPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Speed"
              value={p.speed}
              unit="%"
              onChange={(v) => onUpdate({ ...p, speed: v })}
            />
            <RotaryKnob
              label="Depth"
              value={p.depth}
              unit="%"
              onChange={(v) => onUpdate({ ...p, depth: v })}
            />
            <RotaryKnob
              label="Fdbk"
              value={p.feedback}
              unit="%"
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
          </div>
          <div className="flex justify-center gap-2 text-[9px] font-mono">
            <button
              onClick={() => onUpdate({ ...p, stages: 4 })}
              className={`w-16 justify-center text-center px-2 py-0.5 rounded ${p.stages === 4 ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/60'}`}
            >
              4 STAGE
            </button>
            <button
              onClick={() => onUpdate({ ...p, stages: 8 })}
              className={`w-16 justify-center text-center px-2 py-0.5 rounded ${p.stages === 8 ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/60'}`}
            >
              8 STAGE
            </button>
          </div>
        </div>
      );
    }

    case 'tremolo': {
      const p = pedal as TremoloPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <RotaryKnob
              label="Speed"
              value={p.speed}
              unit="%"
              onChange={(v) => onUpdate({ ...p, speed: v })}
            />
            <RotaryKnob
              label="Depth"
              value={p.depth}
              unit="%"
              onChange={(v) => onUpdate({ ...p, depth: v })}
            />
          </div>
          <div className="flex justify-center gap-1 text-[9px] font-mono">
            {(['sine', 'triangle', 'square'] as const).map(w => (
              <button
                key={w}
                onClick={() => onUpdate({ ...p, waveform: w })}
                className={`w-14 justify-center text-center px-1.5 py-0.5 rounded uppercase ${p.waveform === w ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/60'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'delay': {
      const p = pedal as DelayPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label="Time"
              value={p.time}
              min={10}
              max={1000}
              unit="ms"
              midiBadge={getKnobBadge('time')}
              formatValue={(v) => `${Math.round(v)}ms`}
              onChange={(v) => onUpdate({ ...p, time: v })}
            />
            <RotaryKnob
              label="Repeats"
              value={p.feedback}
              unit="%"
              midiBadge={getKnobBadge('feedback')}
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
            <RotaryKnob
              label="Flutter"
              value={p.flutter}
              unit="%"
              midiBadge={getKnobBadge('flutter')}
              onChange={(v) => onUpdate({ ...p, flutter: v })}
            />
          </div>
          <div className="flex justify-center">
            <label className="flex items-center gap-1.5 text-[9px] font-mono cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={p.pingPong}
                onChange={(e) => onUpdate({ ...p, pingPong: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span>PING-PONG STEREO</span>
            </label>
          </div>
        </div>
      );
    }

    case 'reverb': {
      const p = pedal as ReverbPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label="Decay"
              value={p.decay}
              unit="%"
              onChange={(v) => onUpdate({ ...p, decay: v })}
            />
            <RotaryKnob
              label="PreDly"
              value={p.preDelay}
              unit="ms"
              onChange={(v) => onUpdate({ ...p, preDelay: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
            <RotaryKnob
              label="Damp"
              value={p.damping}
              unit="%"
              onChange={(v) => onUpdate({ ...p, damping: v })}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono">
            <div className="flex gap-1">
              {(['spring', 'plate', 'hall'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => onUpdate({ ...p, roomType: r })}
                  className={`w-12 justify-center text-center px-1 py-0.5 rounded uppercase ${p.roomType === r ? 'bg-purple-500 text-white font-bold' : 'bg-black/40 text-white/60'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={p.shimmer}
                onChange={(e) => onUpdate({ ...p, shimmer: e.target.checked })}
                className="rounded accent-purple-500"
              />
              <span>SHIM</span>
            </label>
          </div>
        </div>
      );
    }

    case 'eq': {
      const p = pedal as EqPedal;
      const bands = [
        { label: '100', key: 'band100' },
        { label: '200', key: 'band200' },
        { label: '400', key: 'band400' },
        { label: '800', key: 'band800' },
        { label: '1.6k', key: 'band1600' },
        { label: '3.2k', key: 'band3200' },
        { label: '6.4k', key: 'band6400' }
      ] as const;

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            {bands.slice(0, 4).map(b => (
              <RotaryKnob
                key={b.key}
                size="sm"
                label={b.label}
                value={p[b.key]}
                min={-15}
                max={15}
                formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`}
                onChange={(v) => onUpdate({ ...p, [b.key]: v })}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {bands.slice(4).map(b => (
              <RotaryKnob
                key={b.key}
                size="sm"
                label={b.label}
                value={p[b.key]}
                min={-15}
                max={15}
                formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`}
                onChange={(v) => onUpdate({ ...p, [b.key]: v })}
              />
            ))}
            <RotaryKnob
              size="sm"
              label="Level"
              value={p.level}
              min={-15}
              max={15}
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`}
              onChange={(v) => onUpdate({ ...p, level: v })}
            />
          </div>
        </div>
      );
    }

    case 'noiseGate': {
      const p = pedal as NoiseGatePedal;
      return (
        <div className="grid grid-cols-2 gap-2">
          <RotaryKnob
            label="Thresh"
            value={p.threshold}
            min={-80}
            max={0}
            formatValue={(v) => `${Math.round(v)}dB`}
            onChange={(v) => onUpdate({ ...p, threshold: v })}
          />
          <RotaryKnob
            label="Release"
            value={p.release}
            min={10}
            max={500}
            formatValue={(v) => `${Math.round(v)}ms`}
            onChange={(v) => onUpdate({ ...p, release: v })}
          />
        </div>
      );
    }

    case 'autoWah': {
      const p = pedal as AutoWahPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Sens"
              value={p.sensitivity}
              unit="%"
              onChange={(v) => onUpdate({ ...p, sensitivity: v })}
            />
            <RotaryKnob
              label="Range"
              value={p.range}
              unit="%"
              onChange={(v) => onUpdate({ ...p, range: v })}
            />
            <RotaryKnob
              label="Reson"
              value={p.resonance}
              unit="%"
              onChange={(v) => onUpdate({ ...p, resonance: v })}
            />
          </div>
          <div className="flex justify-center gap-2 text-[9px] font-mono">
            <button
              onClick={() => onUpdate({ ...p, mode: 'envelope' })}
              className={`w-20 justify-center text-center px-2 py-0.5 rounded ${p.mode === 'envelope' ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/60'}`}
            >
              ENVELOPE
            </button>
            <button
              onClick={() => onUpdate({ ...p, mode: 'lfo' })}
              className={`w-20 justify-center text-center px-2 py-0.5 rounded ${p.mode === 'lfo' ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/60'}`}
            >
              LFO AUTO
            </button>
          </div>
        </div>
      );
    }

    case 'pitchShifter': {
      const p = pedal as PitchShifterPedal;
      const isOctaveDown = p.shift === -12;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Shift"
              value={p.shift}
              min={-24}
              max={24}
              size="sm"
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}st`}
              onChange={(v) => onUpdate({ ...p, shift: v })}
            />
            <RotaryKnob
              label="Fine"
              value={p.detune}
              min={-50}
              max={50}
              size="sm"
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}c`}
              onChange={(v) => onUpdate({ ...p, detune: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
            <RotaryKnob
              label="Tone"
              value={p.tone ?? 80}
              unit="%"
              size="sm"
              onChange={(v) => onUpdate({ ...p, tone: v })}
            />
          </div>

          {/* Quick Octave Selector */}
          <div className="flex justify-center gap-1 text-[9px] font-mono">
            {[-24, -12, -7, 0, 7, 12, 24].map(semi => (
              <button
                key={semi}
                onClick={() => onUpdate({ ...p, shift: semi })}
                className={`w-6 justify-center text-center px-0.5 py-0.5 rounded font-mono tabular-nums transition-colors ${
                  p.shift === semi
                    ? semi === -12
                      ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-300'
                      : 'bg-purple-500 text-white font-bold'
                    : 'bg-black/40 text-white/70 hover:bg-black/60'
                }`}
                title={semi === -12 ? 'Octave Down (-12 st)' : `${semi > 0 ? '+' : ''}${semi} semitones`}
              >
                {semi > 0 ? `+${semi}` : semi}
              </button>
            ))}
          </div>

          {/* Tracking Mode & Octave Blend Controls */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
            {/* Tracking Mode */}
            <div className="flex bg-black/40 rounded p-0.5 gap-0.5">
              {(['auto', 'mono', 'poly'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => onUpdate({ ...p, trackingMode: mode })}
                  className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-semibold transition-colors ${
                    (p.trackingMode || 'auto') === mode
                      ? 'bg-purple-500 text-white font-bold shadow'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  title={
                    mode === 'auto'
                      ? 'Auto: PSOLA period sync for single notes, WSOLA for chords'
                      : mode === 'mono'
                      ? 'Mono: Locked fundamental tracking for leads & bass'
                      : 'Poly: Multi-grain cross-fade for chords'
                  }
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Sub-Octave Blend Toggle */}
            <button
              onClick={() => onUpdate({ ...p, octaveBlend: p.octaveBlend === false ? true : false })}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors flex items-center gap-1 ${
                p.octaveBlend !== false
                  ? 'bg-purple-600/90 text-white shadow ring-1 ring-purple-400/50'
                  : 'bg-black/40 text-white/40 hover:text-white/70'
              }`}
              title="Sub-Harmonic Fundamental Generator for deep, solid octave-down tracking"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.octaveBlend !== false ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
              <span>SUB</span>
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-[8px] font-mono px-1.5 text-white/50 bg-black/30 rounded py-0.5">
            <span className={isOctaveDown ? 'text-purple-300 font-semibold' : ''}>
              {isOctaveDown ? '⚡ OCT DOWN (PSOLA)' : `${p.shift > 0 ? '+' : ''}${p.shift}st`}
            </span>
            <span className="text-emerald-400/90 font-mono">~10.6ms LATENCY</span>
          </div>
        </div>
      );
    }

    case 'harmonizer': {
      const p = pedal as HarmonizerPedal;
      const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <RotaryKnob
              label="Harmony"
              value={p.harmonyLevel}
              unit="%"
              onChange={(v) => onUpdate({ ...p, harmonyLevel: v })}
            />
            <RotaryKnob
              label="Direct"
              value={p.directLevel}
              unit="%"
              onChange={(v) => onUpdate({ ...p, directLevel: v })}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-white/60">KEY:</span>
              <div className="flex gap-1">
                {keys.map(k => (
                  <button
                    key={k}
                    onClick={() => onUpdate({ ...p, key: k })}
                    className={`w-5 justify-center text-center px-1 py-0.5 rounded font-mono ${p.key === k ? 'bg-purple-500 text-white font-bold' : 'bg-black/40 text-white/70'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-white/60">INTERVAL:</span>
              <select
                value={p.interval}
                onChange={(e) => onUpdate({ ...p, interval: e.target.value as any })}
                className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-white text-[9px]"
              >
                <option value="3rd">3rd</option>
                <option value="5th">5th</option>
                <option value="6th">6th</option>
                <option value="octave">Octave (+12)</option>
                <option value="double_octave">2-Octaves (+24)</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    case 'vocalTuner': {
      const p = pedal as VocalTunerPedal;
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label="Speed"
              value={p.speed}
              unit="%"
              midiBadge={getKnobBadge('speed')}
              onChange={(v) => onUpdate({ ...p, speed: v })}
            />
            <RotaryKnob
              label="Correct"
              value={p.correction}
              unit="%"
              midiBadge={getKnobBadge('correction')}
              onChange={(v) => onUpdate({ ...p, correction: v })}
            />
            <RotaryKnob
              label="Human"
              value={p.humanize}
              unit="%"
              midiBadge={getKnobBadge('humanize')}
              onChange={(v) => onUpdate({ ...p, humanize: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-white/60">KEY:</span>
              <select
                value={p.key}
                onChange={(e) => onUpdate({ ...p, key: e.target.value as any })}
                className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-cyan-300 font-bold text-[9px]"
              >
                {keys.map((k) => (
                  <option key={k} value={k}>
                    Key {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-white/60">SCALE:</span>
              <select
                value={p.scale}
                onChange={(e) => onUpdate({ ...p, scale: e.target.value as any })}
                className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-white text-[9px]"
              >
                <option value="chromatic">Chromatic</option>
                <option value="major">Major (Ionian)</option>
                <option value="minor">Natural Minor</option>
                <option value="pentatonic">Pentatonic</option>
                <option value="blues">Blues Scale</option>
              </select>
            </div>
            <div className="text-center text-[8px] font-mono font-bold tracking-wider text-cyan-300/90 uppercase">
              {p.speed >= 80 ? '⚡ ROBOT HARD SNAP' : p.speed <= 35 ? '🍃 NATURAL GLIDE' : '✨ STUDIO RETUNE'}
            </div>
          </div>
        </div>
      );
    }

    case 'vocalDoubler': {
      const p = pedal as VocalDoublerPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Spread"
              value={p.spread}
              unit="%"
              midiBadge={getKnobBadge('spread')}
              onChange={(v) => onUpdate({ ...p, spread: v })}
            />
            <RotaryKnob
              label="Delay"
              value={p.delay}
              unit="ms"
              midiBadge={getKnobBadge('delay')}
              onChange={(v) => onUpdate({ ...p, delay: v })}
            />
            <RotaryKnob
              label="Detune"
              value={p.detune}
              unit="%"
              midiBadge={getKnobBadge('detune')}
              onChange={(v) => onUpdate({ ...p, detune: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Depth"
              value={p.depth}
              unit="%"
              midiBadge={getKnobBadge('depth')}
              onChange={(v) => onUpdate({ ...p, depth: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>
          <div className="text-center text-[8px] font-mono text-indigo-200/80 tracking-wider">
            WIDE STEREO ADT VOICE
          </div>
        </div>
      );
    }

    case 'deEsser': {
      const p = pedal as DeEsserPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Thresh"
              value={p.threshold}
              min={-60}
              max={0}
              unit="dB"
              midiBadge={getKnobBadge('threshold')}
              onChange={(v) => onUpdate({ ...p, threshold: v })}
            />
            <RotaryKnob
              label="Reduce"
              value={p.reduction}
              unit="%"
              midiBadge={getKnobBadge('reduction')}
              onChange={(v) => onUpdate({ ...p, reduction: v })}
            />
            <RotaryKnob
              label="Freq"
              value={p.frequency}
              min={3000}
              max={9000}
              unit="Hz"
              midiBadge={getKnobBadge('frequency')}
              onChange={(v) => onUpdate({ ...p, frequency: v })}
            />
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-white/60">BANDWIDTH:</span>
              <div className="flex gap-1">
                {(['narrow', 'wide'] as const).map((bw) => (
                  <button
                    key={bw}
                    onClick={() => onUpdate({ ...p, bandwidth: bw })}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${
                      p.bandwidth === bw ? 'bg-amber-500 text-black font-bold' : 'bg-black/40 text-white/70'
                    }`}
                  >
                    {bw}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onUpdate({ ...p, listen: !p.listen })}
              className={`w-full py-1 rounded text-[9px] font-mono font-bold tracking-wider uppercase transition-colors ${
                p.listen
                  ? 'bg-amber-400 text-black animate-pulse shadow-sm'
                  : 'bg-black/50 text-white/70 hover:text-white border border-white/20'
              }`}
            >
              {p.listen ? '🎧 SIBILANCE LISTEN ACTIVE' : 'MONITOR LISTEN MODE'}
            </button>
          </div>
        </div>
      );
    }

    case 'telephoneVoice': {
      const p = pedal as TelephoneVoicePedal;
      const modes: Array<TelephoneVoicePedal['mode']> = ['telephone', 'megaphone', 'radio', 'gramophone'];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1 mb-1">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => onUpdate({ ...p, mode: m })}
                className={`py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                  p.mode === m
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'bg-black/40 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label="Drive"
              value={p.drive}
              unit="%"
              midiBadge={getKnobBadge('drive')}
              onChange={(v) => onUpdate({ ...p, drive: v })}
            />
            <RotaryKnob
              label="Filter"
              value={p.filter}
              unit="%"
              midiBadge={getKnobBadge('filter')}
              onChange={(v) => onUpdate({ ...p, filter: v })}
            />
            <RotaryKnob
              label="Noise"
              value={p.noise}
              unit="%"
              midiBadge={getKnobBadge('noise')}
              onChange={(v) => onUpdate({ ...p, noise: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>
        </div>
      );
    }

    case 'vocalFormant': {
      const p = pedal as VocalFormantPedal;
      const pitches: Array<VocalFormantPedal['robotPitch']> = ['C2', 'E2', 'G2', 'A2', 'C3', 'E3', 'G3'];
      const currentPitch = p.pitch ?? 0;
      const robotNoteMap: Record<string, number> = {
        'C2': 36, 'E2': 40, 'G2': 43, 'A2': 45, 'C3': 48, 'E3': 52, 'G3': 55
      };
      const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const baseMidi = robotNoteMap[p.robotPitch || 'A2'] ?? 45;
      const targetMidi = Math.round(baseMidi + currentPitch);
      const noteName = chromaticNotes[((targetMidi % 12) + 12) % 12];
      const octave = Math.floor(targetMidi / 12) - 1;
      const effectiveNote = `${noteName}${octave}`;

      return (
        <div className="space-y-1.5">
          {/* 4 Knobs in a single compact horizontal row */}
          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Pitch"
              value={currentPitch}
              min={-12}
              max={12}
              step={1}
              size="sm"
              unit="st"
              midiBadge={getKnobBadge('pitch')}
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}st`}
              onChange={(v) => onUpdate({ ...p, pitch: v })}
            />
            <RotaryKnob
              label="Formant"
              value={p.formant}
              min={-12}
              max={12}
              size="sm"
              unit="st"
              midiBadge={getKnobBadge('formant')}
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}st`}
              onChange={(v) => onUpdate({ ...p, formant: v })}
            />
            <RotaryKnob
              label="Bright"
              value={p.brightness}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('brightness')}
              onChange={(v) => onUpdate({ ...p, brightness: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {/* Compact Control Deck */}
          <div className="space-y-1 pt-1 border-t border-white/10">
            {/* Mode switch & Tract/Wet badge in 1 row */}
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={() => onUpdate({ ...p, robotMode: !p.robotMode })}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1 border shrink-0 ${
                  p.robotMode
                    ? 'bg-fuchsia-600/90 text-white border-fuchsia-400 shadow-xs'
                    : 'bg-black/50 text-white/70 hover:text-white border-white/20'
                }`}
                title={p.robotMode ? 'Robot Vocoder mode active. Click for Natural mode.' : 'Natural Formant mode active. Click for Robot mode.'}
              >
                <span>{p.robotMode ? '🤖 ROBOT' : '🎙️ NATURAL'}</span>
              </button>

              <div className="flex items-center gap-1 text-[7.5px] font-mono truncate text-right">
                {p.mix >= 99 ? (
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded px-1 py-0.2">
                    100% WET
                  </span>
                ) : (
                  <span className="text-fuchsia-300/80 uppercase">
                    {p.formant < -2 ? '👹 DEEP MECH' : p.formant > 2 ? '✨ CYBORG' : 'BALANCED'}
                  </span>
                )}
              </div>
            </div>

            {/* Root Note Selector + Effective Carrier Note (or Natural Mode readout) */}
            {p.robotMode ? (
              <div className="flex items-center justify-between bg-black/40 rounded px-1.5 py-0.5 border border-white/10 text-[7.5px] font-mono">
                <div className="flex items-center gap-1">
                  <span className="text-white/40 text-[7px]">ROOT:</span>
                  <div className="flex gap-0.5">
                    {pitches.map((pt) => (
                      <button
                        key={pt}
                        onClick={() => onUpdate({ ...p, robotPitch: pt })}
                        className={`px-1 py-0.2 rounded text-[7px] font-mono transition-colors ${
                          p.robotPitch === pt
                            ? 'bg-fuchsia-400 text-black font-bold shadow-xs'
                            : 'bg-black/50 text-white/60 hover:text-white'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
                <span
                  className="font-bold text-fuchsia-200 bg-fuchsia-950/70 px-1 py-0.2 rounded border border-fuchsia-500/30 text-[7px] shrink-0"
                  title={`Carrier: ${p.robotPitch} ${currentPitch !== 0 ? `(${currentPitch > 0 ? '+' : ''}${currentPitch}st)` : ''} → ${effectiveNote}`}
                >
                  {effectiveNote}
                </span>
              </div>
            ) : (
              <div className="text-center text-[7px] font-mono text-cyan-300/80 bg-cyan-950/30 rounded py-0.5 border border-cyan-500/20 tracking-wider">
                NATURAL VOICE • {currentPitch !== 0 ? `${currentPitch > 0 ? '+' : ''}${currentPitch}st PITCH` : '0st PITCH'}
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'vocalHarmony': {
      const p = pedal as VocalHarmonyPedal;
      const intervals1: Array<VocalHarmonyPedal['voice1']> = ['-12', '-7', '-5', '-3', '+3', '+4', '+5', '+7', '+12'];
      const intervals2: Array<VocalHarmonyPedal['voice2']> = ['off', '-12', '-7', '-5', '+3', '+4', '+5', '+7', '+12'];
      return (
        <div className="space-y-2">
          {/* Harmony Interval Selectors */}
          <div className="space-y-1 bg-black/40 p-1.5 rounded border border-white/10">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-indigo-300 font-bold">VOICE 1:</span>
              <div className="flex gap-0.5 flex-wrap justify-end">
                {intervals1.map((iv) => (
                  <button
                    key={iv}
                    onClick={() => onUpdate({ ...p, voice1: iv })}
                    className={`px-1 py-0.5 rounded text-[7.5px] font-mono transition-colors ${
                      p.voice1 === iv
                        ? 'bg-indigo-500 text-white font-bold shadow-sm'
                        : 'bg-black/50 text-white/70 hover:text-white'
                    }`}
                  >
                    {iv}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/5">
              <span className="text-purple-300 font-bold">VOICE 2:</span>
              <div className="flex gap-0.5 flex-wrap justify-end">
                {intervals2.map((iv) => (
                  <button
                    key={iv}
                    onClick={() => onUpdate({ ...p, voice2: iv })}
                    className={`px-1 py-0.5 rounded text-[7.5px] font-mono transition-colors ${
                      p.voice2 === iv
                        ? 'bg-purple-500 text-white font-bold shadow-sm'
                        : 'bg-black/50 text-white/70 hover:text-white'
                    }`}
                  >
                    {iv}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Knobs */}
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Spread"
              value={p.spread}
              unit="%"
              midiBadge={getKnobBadge('spread')}
              onChange={(v) => onUpdate({ ...p, spread: v })}
            />
            <RotaryKnob
              label="Human"
              value={p.humanize}
              unit="%"
              midiBadge={getKnobBadge('humanize')}
              onChange={(v) => onUpdate({ ...p, humanize: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5 tracking-wider">
              ✓ 100% WET • DRY VOICE IS MUTED
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-indigo-300/80 tracking-widest uppercase">
            🎶 STEREO MULTI-VOICE CHOIR
          </div>
        </div>
      );
    }

    case 'vocalPreamp': {
      const p = pedal as VocalPreampPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label="Warmth"
              value={p.warmth}
              unit="%"
              midiBadge={getKnobBadge('warmth')}
              onChange={(v) => onUpdate({ ...p, warmth: v })}
            />
            <RotaryKnob
              label="Comp"
              value={p.compression}
              unit="%"
              midiBadge={getKnobBadge('compression')}
              onChange={(v) => onUpdate({ ...p, compression: v })}
            />
            <RotaryKnob
              label="Air 12k"
              value={p.air}
              unit="%"
              midiBadge={getKnobBadge('air')}
              onChange={(v) => onUpdate({ ...p, air: v })}
            />
            <RotaryKnob
              label="Body"
              value={p.body}
              unit="%"
              midiBadge={getKnobBadge('body')}
              onChange={(v) => onUpdate({ ...p, body: v })}
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono">
            <button
              onClick={() => onUpdate({ ...p, lowCut: !p.lowCut })}
              className={`px-2 py-1 rounded font-bold uppercase transition-colors flex items-center gap-1 ${
                p.lowCut
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-black/40 text-white/50 border border-white/10'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.lowCut ? 'bg-black' : 'bg-white/20'}`} />
              <span>80Hz LOW-CUT</span>
            </button>
            <div className="w-16">
              <RotaryKnob
                size="sm"
                label="Output"
                value={p.outputGain}
                unit="%"
                midiBadge={getKnobBadge('outputGain')}
                onChange={(v) => onUpdate({ ...p, outputGain: v })}
              />
            </div>
          </div>
          <div className="text-center text-[7.5px] font-mono text-amber-300/80 tracking-widest uppercase">
            🎙️ CLASS-A TUBE STRIP (NEVE/LA-2A)
          </div>
        </div>
      );
    }

    case 'vocalStutter': {
      const p = pedal as VocalStutterPedal;
      const rates: Array<VocalStutterPedal['rate']> = ['1/4', '1/8', '1/16', '1/32', 'triplet'];
      return (
        <div className="space-y-2">
          {/* Rate Selector */}
          <div className="flex justify-between gap-1 bg-black/40 p-1 rounded border border-white/10">
            {rates.map((r) => (
              <button
                key={r}
                onClick={() => onUpdate({ ...p, rate: r })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                  p.rate === r
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Knobs */}
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Depth"
              value={p.depth}
              unit="%"
              midiBadge={getKnobBadge('depth')}
              onChange={(v) => onUpdate({ ...p, depth: v })}
            />
            <RotaryKnob
              label="Glitch"
              value={p.glitch}
              unit="%"
              midiBadge={getKnobBadge('glitch')}
              onChange={(v) => onUpdate({ ...p, glitch: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {/* Tape slow toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono">
            <button
              onClick={() => onUpdate({ ...p, tapeSlow: !p.tapeSlow })}
              className={`w-full py-1 rounded text-[8.5px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                p.tapeSlow
                  ? 'bg-rose-600 text-white shadow-rose-900/50 shadow ring-1 ring-rose-400'
                  : 'bg-black/40 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <span>{p.tapeSlow ? '🛑' : '📼'}</span>
              <span>{p.tapeSlow ? 'VINYL TAPE-STOP ACTIVE' : 'VINYL TAPE-STOP SLOW'}</span>
            </button>
          </div>
          <div className="text-center text-[7.5px] font-mono text-emerald-300/80 tracking-widest uppercase">
            ⚡ RHYTHMIC SLICE & GLITCH REPEAT
          </div>
        </div>
      );
    }

    case 'vocalAlien': {
      const p = pedal as VocalAlienPedal;
      const shapes: Array<VocalAlienPedal['carrierShape']> = ['sine', 'triangle', 'square'];
      return (
        <div className="space-y-2">
          {/* Waveform Selector */}
          <div className="flex justify-between gap-1 bg-black/40 p-1 rounded border border-white/10">
            {shapes.map((sh) => (
              <button
                key={sh}
                onClick={() => onUpdate({ ...p, carrierShape: sh })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                  p.carrierShape === sh
                    ? 'bg-teal-400 text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>

          {/* Knobs */}
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Freq"
              value={p.frequency}
              min={50}
              max={2000}
              unit="Hz"
              midiBadge={getKnobBadge('frequency')}
              onChange={(v) => onUpdate({ ...p, frequency: v })}
            />
            <RotaryKnob
              label="Mod"
              value={p.modDepth}
              unit="%"
              midiBadge={getKnobBadge('modDepth')}
              onChange={(v) => onUpdate({ ...p, modDepth: v })}
            />
            <RotaryKnob
              label="Flutter"
              value={p.lfoRate}
              min={0.1}
              max={20}
              unit="Hz"
              midiBadge={getKnobBadge('lfoRate')}
              onChange={(v) => onUpdate({ ...p, lfoRate: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Speech Track"
              value={p.tracking}
              unit="%"
              midiBadge={getKnobBadge('tracking')}
              onChange={(v) => onUpdate({ ...p, tracking: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5 tracking-wider">
              ✓ 100% WET • DRY VOICE IS MUTED
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-teal-300/80 tracking-widest uppercase">
            🛸 DALEK & CYBORG RING MODULATOR
          </div>
        </div>
      );
    }

    case 'granularCloud': {
      const p = pedal as GranularCloudPedal;
      return (
        <div className="space-y-2">
          {/* Top Knobs: Pitch, Size, Density */}
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Pitch"
              value={p.pitch}
              min={-12}
              max={12}
              unit="st"
              midiBadge={getKnobBadge('pitch')}
              onChange={(v) => onUpdate({ ...p, pitch: v })}
            />
            <RotaryKnob
              label="Grain Size"
              value={p.grainSize}
              min={20}
              max={400}
              unit="ms"
              midiBadge={getKnobBadge('grainSize')}
              onChange={(v) => onUpdate({ ...p, grainSize: v })}
            />
            <RotaryKnob
              label="Density"
              value={p.density}
              min={2}
              max={40}
              unit="gr/s"
              midiBadge={getKnobBadge('density')}
              onChange={(v) => onUpdate({ ...p, density: v })}
            />
          </div>

          {/* Middle Knobs: Spray, Feedback, Mix */}
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Spray"
              value={p.spray}
              unit="%"
              midiBadge={getKnobBadge('spray')}
              onChange={(v) => onUpdate({ ...p, spray: v })}
            />
            <RotaryKnob
              label="Feedback"
              value={p.feedback}
              max={95}
              unit="%"
              midiBadge={getKnobBadge('feedback')}
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {/* Shimmer Toggle Button */}
          <div className="pt-1 border-t border-white/10">
            <button
              onClick={() => onUpdate({ ...p, shimmer: !p.shimmer })}
              className={`w-full py-1 rounded text-[8.5px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                p.shimmer
                  ? 'bg-amber-500 text-black shadow-amber-900/50 shadow ring-1 ring-amber-300'
                  : 'bg-black/40 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <span>{p.shimmer ? '✨' : '☁️'}</span>
              <span>{p.shimmer ? 'OCTAVE SHIMMER BLOOM ACTIVE' : 'OCTAVE SHIMMER (OFF)'}</span>
            </button>
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5 tracking-wider">
              ✓ 100% WET • DRY GUITAR IS MUTED
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-purple-300/80 tracking-widest uppercase">
            🌌 MICRO-LOOP GRANULAR CLOUD
          </div>
        </div>
      );
    }

    case 'arcadeSynth': {
      const p = pedal as ArcadeSynthPedal;
      const subOctaves: Array<ArcadeSynthPedal['subOctave']> = ['-2', '-1', 'off', '+1', '+2'];
      const arpModes: Array<ArcadeSynthPedal['arpeggiator']> = ['off', 'major3rd', 'octave', 'fifth', 'cyberpunk'];

      return (
        <div className="space-y-2">
          {/* Sub Octave Selector */}
          <div>
            <div className="text-[7.5px] font-mono uppercase text-white/60 mb-0.5 text-center">
              PLL Sub-Octave Divider
            </div>
            <div className="flex justify-between gap-1 bg-black/40 p-1 rounded border border-white/10">
              {subOctaves.map((oct) => (
                <button
                  key={oct}
                  onClick={() => onUpdate({ ...p, subOctave: oct })}
                  className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                    p.subOctave === oct
                      ? 'bg-yellow-400 text-black font-bold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {oct === 'off' ? 'DIR' : `${oct} OCT`}
                </button>
              ))}
            </div>
          </div>

          {/* Arp Pattern Selector */}
          <div>
            <div className="text-[7.5px] font-mono uppercase text-white/60 mb-0.5 text-center">
              Interval Arpeggiator
            </div>
            <div className="flex justify-between gap-1 bg-black/40 p-1 rounded border border-white/10">
              {arpModes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdate({ ...p, arpeggiator: mode })}
                  className={`flex-1 py-0.5 rounded text-[7.5px] font-mono uppercase transition-colors ${
                    p.arpeggiator === mode
                      ? 'bg-rose-500 text-white font-bold shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {mode === 'off' ? 'OFF' : mode === 'major3rd' ? '3RD' : mode === 'fifth' ? '5TH' : mode === 'octave' ? 'OCT' : 'CYBER'}
                </button>
              ))}
            </div>
          </div>

          {/* Bitcrush & Decimation Knobs */}
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Bit Depth"
              value={p.crushBits}
              min={2}
              max={16}
              unit="bit"
              midiBadge={getKnobBadge('crushBits')}
              onChange={(v) => onUpdate({ ...p, crushBits: v })}
            />
            <RotaryKnob
              label="Sample Rate"
              value={p.sampleRateDec}
              min={800}
              max={22050}
              unit="Hz"
              midiBadge={getKnobBadge('sampleRateDec')}
              onChange={(v) => onUpdate({ ...p, sampleRateDec: v })}
            />
            <RotaryKnob
              label="Arp Rate"
              value={p.arpRate}
              min={1}
              max={16}
              unit="Hz"
              midiBadge={getKnobBadge('arpRate')}
              onChange={(v) => onUpdate({ ...p, arpRate: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Portamento Glide"
              value={p.glide}
              unit="%"
              midiBadge={getKnobBadge('glide')}
              onChange={(v) => onUpdate({ ...p, glide: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5 tracking-wider">
              ✓ 100% WET • DRY GUITAR IS MUTED
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-amber-300/80 tracking-widest uppercase">
            🕹️ 8-BIT PLL ARCADE SYNTH
          </div>
        </div>
      );
    }

    case 'spectralFreeze': {
      const p = pedal as SpectralFreezePedal;
      return (
        <div className="space-y-2">
          {/* Mode Switch & Footswitch Trigger */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => onUpdate({ ...p, mode: p.mode === 'latch' ? 'momentary' : 'latch' })}
              className="flex-1 py-1 rounded bg-black/40 text-[8px] font-mono uppercase border border-white/10 text-white/70 hover:text-white"
            >
              MODE: <span className="text-cyan-400 font-bold">{p.mode.toUpperCase()}</span>
            </button>
          </div>

          {/* Interactive Freeze Footswitch Button */}
          <button
            onMouseDown={() => {
              if (p.mode === 'momentary') {
                onUpdate({ ...p, frozen: true });
              } else {
                onUpdate({ ...p, frozen: !p.frozen });
              }
            }}
            onMouseUp={() => {
              if (p.mode === 'momentary') {
                onUpdate({ ...p, frozen: false });
              }
            }}
            onMouseLeave={() => {
              if (p.mode === 'momentary' && p.frozen) {
                onUpdate({ ...p, frozen: false });
              }
            }}
            className={`w-full py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 border ${
              p.frozen
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-cyan-500/40 ring-2 ring-cyan-400/80 animate-pulse'
                : 'bg-neutral-800/80 text-cyan-300 hover:bg-neutral-800 border-cyan-800/50 hover:border-cyan-600'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${p.frozen ? 'bg-black' : 'bg-cyan-400 animate-ping'}`} />
            <span>{p.frozen ? '❄️ SUSTAIN DRONE FROZEN' : 'TAP / HOLD TO FREEZE'}</span>
          </button>

          {/* Knobs */}
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Rise Swell"
              value={p.riseTime}
              min={20}
              max={1500}
              unit="ms"
              midiBadge={getKnobBadge('riseTime')}
              onChange={(v) => onUpdate({ ...p, riseTime: v })}
            />
            <RotaryKnob
              label="Decay Tail"
              value={p.decayTime}
              min={100}
              max={4000}
              unit="ms"
              midiBadge={getKnobBadge('decayTime')}
              onChange={(v) => onUpdate({ ...p, decayTime: v })}
            />
            <RotaryKnob
              label="Shimmer"
              value={p.shimmer}
              unit="%"
              midiBadge={getKnobBadge('shimmer')}
              onChange={(v) => onUpdate({ ...p, shimmer: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Analog Damping"
              value={p.damping}
              unit="%"
              midiBadge={getKnobBadge('damping')}
              onChange={(v) => onUpdate({ ...p, damping: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-cyan-300/80 tracking-widest uppercase">
            ❄️ INFINITE DRONE SUSTAINER & FREEZE
          </div>
        </div>
      );
    }

    case 'tapeGlitch': {
      const p = pedal as TapeGlitchPedal;
      const dirs: Array<TapeGlitchPedal['direction']> = ['reverse', 'forward', 'alternating'];

      return (
        <div className="space-y-2">
          {/* Direction Selector */}
          <div className="flex justify-between gap-1 bg-black/40 p-1 rounded border border-white/10">
            {dirs.map((dir) => (
              <button
                key={dir}
                onClick={() => onUpdate({ ...p, direction: dir })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                  p.direction === dir
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {dir === 'reverse' ? '⏪ REV' : dir === 'forward' ? '⏩ FWD' : '🔀 ALT'}
              </button>
            ))}
          </div>

          {/* Knobs: Pitch, Slice, Glitch */}
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Tape Pitch"
              value={p.pitch}
              min={-12}
              max={12}
              unit="st"
              midiBadge={getKnobBadge('pitch')}
              onChange={(v) => onUpdate({ ...p, pitch: v })}
            />
            <RotaryKnob
              label="Slice Size"
              value={p.sliceLength}
              min={60}
              max={1200}
              unit="ms"
              midiBadge={getKnobBadge('sliceLength')}
              onChange={(v) => onUpdate({ ...p, sliceLength: v })}
            />
            <RotaryKnob
              label="Glitch Jump"
              value={p.randomGlitch}
              unit="%"
              midiBadge={getKnobBadge('randomGlitch')}
              onChange={(v) => onUpdate({ ...p, randomGlitch: v })}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Wow/Flutter"
              value={p.wowFlutter}
              unit="%"
              midiBadge={getKnobBadge('wowFlutter')}
              onChange={(v) => onUpdate({ ...p, wowFlutter: v })}
            />
            <RotaryKnob
              label="Feedback"
              value={p.feedback}
              max={90}
              unit="%"
              midiBadge={getKnobBadge('feedback')}
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5 tracking-wider">
              ✓ 100% WET • DRY GUITAR IS MUTED
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-amber-300/80 tracking-widest uppercase">
            📼 TAPE GLITCH & REVERSE SWELL
          </div>
        </div>
      );
    }

    case 'uniVibe': {
      const p = pedal as UniVibePedal;
      return (
        <div className="space-y-2">
          {/* Mode switch */}
          <div className="flex justify-center gap-1">
            {(['chorus', 'vibrato'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onUpdate({ ...p, mode: m })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider transition-colors ${
                  p.mode === m
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'bg-black/50 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {m === 'chorus' ? 'CHORUS (PHASE)' : 'VIBRATO (PITCH)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Speed"
              value={p.speed}
              min={0.5}
              max={10.0}
              step={0.1}
              size="sm"
              unit="Hz"
              midiBadge={getKnobBadge('speed')}
              onChange={(v) => onUpdate({ ...p, speed: v })}
            />
            <RotaryKnob
              label="Intens"
              value={p.intensity}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('intensity')}
              onChange={(v) => onUpdate({ ...p, intensity: v })}
            />
            <RotaryKnob
              label="Lamp"
              value={p.lampBias}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('lampBias')}
              onChange={(v) => onUpdate({ ...p, lampBias: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-purple-300/80 tracking-widest uppercase">
            💡 OPTICAL 4-STAGE BULB VIBE
          </div>
        </div>
      );
    }

    case 'harmonicTremolo': {
      const p = pedal as HarmonicTremoloPedal;
      const waves: Array<HarmonicTremoloPedal['waveform']> = ['sine', 'triangle', 'pulse'];
      return (
        <div className="space-y-2">
          {/* Waveform Selector */}
          <div className="flex justify-center gap-1">
            {waves.map((w) => (
              <button
                key={w}
                onClick={() => onUpdate({ ...p, waveform: w })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                  p.waveform === w
                    ? 'bg-amber-400 text-black font-bold shadow-xs'
                    : 'bg-black/50 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Rate"
              value={p.rate}
              min={0.5}
              max={12.0}
              step={0.1}
              size="sm"
              unit="Hz"
              midiBadge={getKnobBadge('rate')}
              onChange={(v) => onUpdate({ ...p, rate: v })}
            />
            <RotaryKnob
              label="Depth"
              value={p.depth}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('depth')}
              onChange={(v) => onUpdate({ ...p, depth: v })}
            />
            <RotaryKnob
              label="X-Over"
              value={p.crossover || 700}
              min={300}
              max={1600}
              size="sm"
              unit="Hz"
              midiBadge={getKnobBadge('crossover')}
              onChange={(v) => onUpdate({ ...p, crossover: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-amber-300/80 tracking-widest uppercase">
            🌊 1962 BROWNFACE SPLIT-PHASE
          </div>
        </div>
      );
    }

    case 'slowGear': {
      const p = pedal as SlowGearPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Attack"
              value={p.attack}
              min={40}
              max={1500}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('attack')}
              onChange={(v) => onUpdate({ ...p, attack: v })}
            />
            <RotaryKnob
              label="Sens"
              value={p.sensitivity}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('sensitivity')}
              onChange={(v) => onUpdate({ ...p, sensitivity: v })}
            />
            <RotaryKnob
              label="Release"
              value={p.release}
              min={40}
              max={600}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('release')}
              onChange={(v) => onUpdate({ ...p, release: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-sky-300/80 tracking-widest uppercase">
            🎻 BOWED VIOLIN & AUTO-VOLUME SWELL
          </div>
        </div>
      );
    }

    case 'klonOverdrive': {
      const p = pedal as KlonOverdrivePedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Gain"
              value={p.gain}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('gain')}
              onChange={(v) => onUpdate({ ...p, gain: v })}
            />
            <RotaryKnob
              label="Treble"
              value={p.treble}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('treble')}
              onChange={(v) => onUpdate({ ...p, treble: v })}
            />
            <RotaryKnob
              label="Output"
              value={p.output}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('output')}
              onChange={(v) => onUpdate({ ...p, output: v })}
            />
            <RotaryKnob
              label="Clean"
              value={p.cleanBlend}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('cleanBlend')}
              onChange={(v) => onUpdate({ ...p, cleanBlend: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-amber-400 font-bold tracking-widest uppercase">
            🐎 GOLD CENTAUR TRANSPARENT DRIVE
          </div>
        </div>
      );
    }

    case 'multiOctave': {
      const p = pedal as MultiOctavePedal;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="-2 Oct"
              value={p.sub2}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('sub2')}
              onChange={(v) => onUpdate({ ...p, sub2: v })}
            />
            <RotaryKnob
              label="-1 Oct"
              value={p.sub1}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('sub1')}
              onChange={(v) => onUpdate({ ...p, sub1: v })}
            />
            <RotaryKnob
              label="Dry"
              value={p.dry}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('dry')}
              onChange={(v) => onUpdate({ ...p, dry: v })}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="+1 Oct"
              value={p.oct1}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('oct1')}
              onChange={(v) => onUpdate({ ...p, oct1: v })}
            />
            <RotaryKnob
              label="+2 Oct"
              value={p.oct2}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('oct2')}
              onChange={(v) => onUpdate({ ...p, oct2: v })}
            />
            <RotaryKnob
              label="Tone"
              value={p.tone}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('tone')}
              onChange={(v) => onUpdate({ ...p, tone: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-red-400 font-bold tracking-widest uppercase">
            🎹 POLYPHONIC ORGAN GENERATOR
          </div>
        </div>
      );
    }

    case 'talkingWah': {
      const p = pedal as TalkingWahPedal;
      const vowels: Array<TalkingWahPedal['vowel']> = ['ya-ya', 'ow-ow', 'ee-ah', 'oo-ee'];
      return (
        <div className="space-y-2">
          {/* Vowel & Direction Controls */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex gap-0.5">
              {vowels.map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate({ ...p, vowel: v })}
                  className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono uppercase font-bold transition-colors ${
                    p.vowel === v
                      ? 'bg-purple-500 text-white shadow-xs'
                      : 'bg-black/50 text-white/60 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => onUpdate({ ...p, direction: p.direction === 'up' ? 'down' : 'up' })}
              className="px-2 py-0.5 rounded text-[7.5px] font-mono font-bold bg-neutral-800 text-amber-400 border border-neutral-700"
            >
              {p.direction === 'up' ? 'SWEEP ↑' : 'SWEEP ↓'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Sens"
              value={p.sensitivity}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('sensitivity')}
              onChange={(v) => onUpdate({ ...p, sensitivity: v })}
            />
            <RotaryKnob
              label="Peak Q"
              value={p.resonance}
              min={1}
              max={15}
              size="sm"
              midiBadge={getKnobBadge('resonance')}
              onChange={(v) => onUpdate({ ...p, resonance: v })}
            />
            <RotaryKnob
              label="Drive"
              value={p.drive}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('drive')}
              onChange={(v) => onUpdate({ ...p, drive: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-purple-300 tracking-widest uppercase">
            🗣️ DUAL FORMANT VOCAL WAH
          </div>
        </div>
      );
    }

    case 'reverseReverb': {
      const p = pedal as ReverseReverbPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Time"
              value={p.time}
              min={200}
              max={1600}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('time')}
              onChange={(v) => onUpdate({ ...p, time: v })}
            />
            <RotaryKnob
              label="Pre-Dly"
              value={p.preDelay}
              min={0}
              max={200}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('preDelay')}
              onChange={(v) => onUpdate({ ...p, preDelay: v })}
            />
            <RotaryKnob
              label="Bloom"
              value={p.feedback}
              max={85}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('feedback')}
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          {p.mix >= 99 && (
            <div className="text-center text-[7.5px] font-mono text-pink-400 font-bold bg-pink-950/60 border border-pink-500/30 rounded py-0.5 tracking-wider">
              🌸 100% WET SHOEGAZE WALL OF SOUND
            </div>
          )}
          <div className="text-center text-[7.5px] font-mono text-pink-300/80 tracking-widest uppercase">
            🌊 REVERSE BLOOM (MBV / SPX90)
          </div>
        </div>
      );
    }

    case 'crystalDelay': {
      const p = pedal as CrystalDelayPedal;
      const intervals: Array<CrystalDelayPedal['interval']> = ['+5th', '+7th', '+12th', '+24th', '-12th'];
      return (
        <div className="space-y-2">
          {/* Pitch Interval Selector */}
          <div className="flex justify-center gap-1">
            {intervals.map((iv) => (
              <button
                key={iv}
                onClick={() => onUpdate({ ...p, interval: iv })}
                className={`flex-1 py-0.5 rounded text-[8px] font-mono font-bold transition-colors ${
                  p.interval === iv
                    ? 'bg-cyan-400 text-black shadow-xs'
                    : 'bg-black/50 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {iv}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-0.5">
            <RotaryKnob
              label="Time"
              value={p.time}
              min={60}
              max={1200}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('time')}
              onChange={(v) => onUpdate({ ...p, time: v })}
            />
            <RotaryKnob
              label="Repeats"
              value={p.feedback}
              max={90}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('feedback')}
              onChange={(v) => onUpdate({ ...p, feedback: v })}
            />
            <RotaryKnob
              label="Shimmer"
              value={p.shimmer}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('shimmer')}
              onChange={(v) => onUpdate({ ...p, shimmer: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-cyan-300/80 tracking-widest uppercase">
            ✨ CASCADING CRYSTAL HARMONY ECHO
          </div>
        </div>
      );
    }

    case 'hardTune': {
      const p = pedal as HardTunePedal;
      const keys: Array<HardTunePedal['key']> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const scales: Array<HardTunePedal['scale']> = ['major', 'minor', 'pentatonic', 'arabic'];
      return (
        <div className="space-y-1.5">
          {/* Key & Scale selector strip */}
          <div className="flex items-center justify-between gap-1 text-[8px] font-mono">
            <div className="flex gap-0.5">
              {keys.map((k) => (
                <button
                  key={k}
                  onClick={() => onUpdate({ ...p, key: k })}
                  className={`px-1 py-0.5 rounded text-[7.5px] font-mono transition-colors ${
                    p.key === k ? 'bg-amber-400 text-black font-bold' : 'bg-black/50 text-white/60'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5">
              {scales.map((sc) => (
                <button
                  key={sc}
                  onClick={() => onUpdate({ ...p, scale: sc })}
                  className={`px-1 py-0.5 rounded text-[7.5px] font-mono uppercase transition-colors ${
                    p.scale === sc ? 'bg-amber-400 text-black font-bold' : 'bg-black/50 text-white/60'
                  }`}
                >
                  {sc.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Retune"
              value={p.retuneSpeed}
              min={0}
              max={50}
              unit="ms"
              size="sm"
              midiBadge={getKnobBadge('retuneSpeed')}
              formatValue={(v) => v === 0 ? '0ms (SNAP)' : `${Math.round(v)}ms`}
              onChange={(v) => onUpdate({ ...p, retuneSpeed: v })}
            />
            <RotaryKnob
              label="Warp"
              value={p.formantWarp}
              min={-12}
              max={12}
              unit="st"
              size="sm"
              midiBadge={getKnobBadge('formantWarp')}
              formatValue={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}st`}
              onChange={(v) => onUpdate({ ...p, formantWarp: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
            ⚡ 0MS TRAP & VOCAL HARD-TUNE
          </div>
        </div>
      );
    }

    case 'lofiVinyl': {
      const p = pedal as LofiVinylPedal;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1">
            <RotaryKnob
              label="Crackle"
              value={p.dustCrackle}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('dustCrackle')}
              onChange={(v) => onUpdate({ ...p, dustCrackle: v })}
            />
            <RotaryKnob
              label="Flutter"
              value={p.flutter}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('flutter')}
              onChange={(v) => onUpdate({ ...p, flutter: v })}
            />
            <RotaryKnob
              label="Sat"
              value={p.saturation}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('saturation')}
              onChange={(v) => onUpdate({ ...p, saturation: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <RotaryKnob
              label="Head Filter"
              value={p.filter}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('filter')}
              onChange={(v) => onUpdate({ ...p, filter: v })}
            />
            <RotaryKnob
              label="Mix"
              value={p.mix}
              unit="%"
              size="sm"
              midiBadge={getKnobBadge('mix')}
              onChange={(v) => onUpdate({ ...p, mix: v })}
            />
          </div>

          <div className="text-center text-[7.5px] font-mono text-amber-300 font-bold tracking-widest uppercase">
            📻 VINYL DUST & CASSETTE WARP
          </div>
        </div>
      );
    }
  }
}

