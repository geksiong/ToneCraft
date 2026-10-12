import React, { useState } from 'react';
import { VstPluginPedal } from '../types/pedal';
import { X, Play, Save, Check, Sparkles, Sliders } from 'lucide-react';

interface VstEditorModalProps {
  isOpen: boolean;
  pedal: VstPluginPedal | null;
  onClose: () => void;
  onSave: (updated: VstPluginPedal) => void;
}

const VST_PRESETS = [
  {
    id: 'tape-sat',
    title: 'Vintage Tape Saturation',
    p1Label: 'Warmth',
    p2Label: 'High Damping',
    p3Label: 'Bias',
    p4Label: 'Compression',
    code: `// Vintage Tape Saturation DSP
function process(sample, warmth, damping, bias, comp) {
  // Add asymmetric magnetic tape saturation
  const driven = sample * (1 + warmth * 4) + (bias * 0.1);
  return Math.tanh(driven) * (1 - comp * 0.2);
}`
  },
  {
    id: 'bitcrusher',
    title: '8-Bit Retro Bitcrusher & Decimator',
    p1Label: 'Bit Depth',
    p2Label: 'Sample Reducer',
    p3Label: 'Drive',
    p4Label: 'Gate',
    code: `// 8-Bit Bitcrusher & Sample Reducer
function process(sample, bitDepth, sampleReducer, drive, gate) {
  const bits = Math.max(2, Math.floor(16 - (bitDepth * 14)));
  const steps = Math.pow(2, bits);
  const crushed = Math.round(sample * steps) / steps;
  return crushed * (1 + drive * 2);
}`
  },
  {
    id: 'ring-mod',
    title: 'Ring Modulator & Alien Bell',
    p1Label: 'Carrier Freq',
    p2Label: 'Mod Depth',
    p3Label: 'Harmonics',
    p4Label: 'Spread',
    code: `// Ring Modulator DSP
function process(sample, carrierFreq, modDepth, harmonics) {
  const carrier = Math.sin(carrierFreq * 100);
  return sample * (1 - modDepth) + (sample * carrier * modDepth * 1.5);
}`
  },
  {
    id: 'sub-octave',
    title: 'Sub-Bass Monolithic Synthesizer',
    p1Label: 'Sub Level',
    p2Label: 'Cutoff',
    p3Label: 'Punch',
    p4Label: 'Tightness',
    code: `// Sub-Bass Octave Synthesizer
function process(sample, subLevel, cutoff, punch) {
  const sub = Math.sin(sample * Math.PI) * subLevel;
  return sample + sub * 0.8;
}`
  }
];

export const VstEditorModal: React.FC<VstEditorModalProps> = ({
  isOpen,
  pedal,
  onClose,
  onSave
}) => {
  if (!isOpen || !pedal) return null;

  const [title, setTitle] = useState(pedal.pluginTitle || pedal.name);
  const [param1Label, setParam1Label] = useState(pedal.param1Label || 'Param 1');
  const [param2Label, setParam2Label] = useState(pedal.param2Label || 'Param 2');
  const [param3Label, setParam3Label] = useState(pedal.param3Label || 'Param 3');
  const [param4Label, setParam4Label] = useState(pedal.param4Label || 'Param 4');
  const [dspCode, setDspCode] = useState(pedal.dspCode || VST_PRESETS[0].code);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof VST_PRESETS[0]) => {
    setTitle(preset.title);
    setParam1Label(preset.p1Label);
    setParam2Label(preset.p2Label);
    setParam3Label(preset.p3Label);
    setParam4Label(preset.p4Label);
    setDspCode(preset.code);
    setStatusMessage(`Loaded preset: ${preset.title}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSaveAndApply = () => {
    onSave({
      ...pedal,
      name: title,
      pluginTitle: title,
      param1Label,
      param2Label,
      param3Label,
      param4Label,
      dspCode
    });
    setStatusMessage('DSP parameters compiled and applied to audio chain!');
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
              <Sparkles size={17} className="text-sky-400" />
              <span>VST Web Plugin Container & DSP Script Editor</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Program custom Web Audio DSP algorithms with real-time parameter bindings.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Preset Selector */}
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Load VST Preset Module:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {VST_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-2 text-left rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-sky-500/50 text-xs transition-all"
                >
                  <div className="font-semibold text-neutral-200 truncate">{preset.title}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">4-Knob DSP</div>
                </button>
              ))}
            </div>
          </div>

          {/* Plugin Title & Knob Mapping */}
          <div className="space-y-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">
                Plugin Display Name:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">
                Assignable Rotary Knob Labels:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Knob 1"
                  value={param1Label}
                  onChange={(e) => setParam1Label(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Knob 2"
                  value={param2Label}
                  onChange={(e) => setParam2Label(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Knob 3"
                  value={param3Label}
                  onChange={(e) => setParam3Label(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Knob 4"
                  value={param4Label}
                  onChange={(e) => setParam4Label(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* DSP Code Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-neutral-400">
                DSP Script (JavaScript Audio Function):
              </label>
              <span className="text-[10px] font-mono text-neutral-400">
                AudioContext Sample Processing
              </span>
            </div>
            <textarea
              value={dspCode}
              onChange={(e) => setDspCode(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full font-mono text-xs p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sky-300 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Check size={14} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAndApply}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <Save size={14} />
            <span>Compile & Apply VST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
