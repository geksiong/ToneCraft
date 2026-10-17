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
  VstPluginPedal
} from '../types/pedal';
import { MidiMapping } from '../types/midi';
import { RotaryKnob } from './RotaryKnob';
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  Code,
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
  onOpenVstEditor?: (pedal: VstPluginPedal) => void;
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
  onOpenVstEditor,
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
          {pedal.type === 'vstPlugin' && onOpenVstEditor && (
            <button
              onClick={() => onOpenVstEditor(pedal as VstPluginPedal)}
              className="p-1 text-sky-400 hover:text-sky-300 transition-colors"
              title="Open VST Code Editor"
            >
              <Code size={14} />
            </button>
          )}
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
  const getKnobBadge = (paramKey: string) => {
    if (slotIndex === undefined || !midiMappings) return undefined;
    const m = midiMappings.find(
      (item) =>
        item.enabled &&
        item.target.type === 'pedal_param' &&
        item.target.slotIndex === slotIndex &&
        item.target.paramKey === paramKey
    );
    if (!m) return undefined;
    return m.commandType === 'cc' ? `CC ${m.controlNumber}` : `${m.commandType.toUpperCase()} ${m.controlNumber}`;
  };

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

    case 'vstPlugin': {
      const p = pedal as VstPluginPedal;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-y-2 gap-x-1">
            <RotaryKnob
              label={p.param1Label || 'Param 1'}
              value={p.param1}
              unit="%"
              onChange={(v) => onUpdate({ ...p, param1: v })}
            />
            <RotaryKnob
              label={p.param2Label || 'Param 2'}
              value={p.param2}
              unit="%"
              onChange={(v) => onUpdate({ ...p, param2: v })}
            />
            <RotaryKnob
              label={p.param3Label || 'Param 3'}
              value={p.param3}
              unit="%"
              onChange={(v) => onUpdate({ ...p, param3: v })}
            />
            <RotaryKnob
              label="Dry/Wet"
              value={p.dryWet}
              unit="%"
              onChange={(v) => onUpdate({ ...p, dryWet: v })}
            />
          </div>
        </div>
      );
    }
  }
}
