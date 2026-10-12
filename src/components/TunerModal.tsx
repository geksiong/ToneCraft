import React from 'react';
import { TunerData } from '../types/pedal';
import { X, CheckCircle, Volume2 } from 'lucide-react';

interface TunerModalProps {
  isOpen: boolean;
  tunerData: TunerData;
  onClose: () => void;
}

const GUITAR_STRINGS = [
  { name: 'E2', freq: 82.4, label: '6th' },
  { name: 'A2', freq: 110.0, label: '5th' },
  { name: 'D3', freq: 146.8, label: '4th' },
  { name: 'G3', freq: 196.0, label: '3rd' },
  { name: 'B3', freq: 246.9, label: '2nd' },
  { name: 'E4', freq: 329.6, label: '1st' }
];

const BASS_STRINGS = [
  { name: 'B0', freq: 30.9, label: 'Low B' },
  { name: 'E1', freq: 41.2, label: '4th' },
  { name: 'A1', freq: 55.0, label: '3rd' },
  { name: 'D2', freq: 73.4, label: '2nd' },
  { name: 'G2', freq: 98.0, label: '1st' }
];

export const TunerModal: React.FC<TunerModalProps> = ({
  isOpen,
  tunerData,
  onClose
}) => {
  if (!isOpen) return null;

  const { note, frequency, cents, inTune } = tunerData;

  // Needle angle from -45deg to +45deg based on cents (-50 to +50)
  const needleAngle = (cents / 50) * 45;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 led-glow-emerald border border-emerald-300" />
            <h3 className="text-base font-bold tracking-wider uppercase text-neutral-100">
              High-Precision Chromatic Tuner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vintage Meter Dial */}
        <div className="my-6 p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner flex flex-col items-center">
          {/* Note & In-tune indicator with constant widths */}
          <div className="flex flex-col items-center mb-4">
            <span
              className={`text-6xl font-black font-mono tracking-tight transition-colors w-36 text-center inline-block ${
                inTune ? 'text-emerald-400' : 'text-neutral-100'
              }`}
            >
              {note || '--'}
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs font-mono tabular-nums text-neutral-400 w-28 text-right inline-block">
                {frequency > 0 ? `${frequency} Hz` : 'Listening...'}
              </span>
              <span>·</span>
              <span
                className={`text-xs font-mono font-bold tabular-nums w-24 text-left inline-block ${
                  inTune ? 'text-emerald-400' : Math.abs(cents) > 10 ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {cents > 0 ? `+${cents}` : cents} cents
              </span>
            </div>
          </div>

          {/* Analog Meter Arc & Needle */}
          <div className="relative w-64 h-32 overflow-hidden flex items-end justify-center">
            {/* Meter Scale Arc */}
            <div className="absolute inset-x-0 bottom-0 top-0 border-t-2 border-neutral-700 rounded-t-full" />

            {/* Scale markings */}
            <div className="absolute top-2 inset-x-4 flex justify-between text-[10px] font-mono text-neutral-400 px-4">
              <span>-50</span>
              <span>-25</span>
              <span className="font-bold text-emerald-400">0</span>
              <span>+25</span>
              <span>+50</span>
            </div>

            {/* Center target line */}
            <div className="absolute top-8 w-0.5 h-6 bg-emerald-400 shadow-sm" />

            {/* Rotating Analog Needle */}
            <div
              className="absolute bottom-0 w-1 h-28 origin-bottom bg-gradient-to-t from-red-600 via-amber-400 to-amber-200 transition-transform duration-100 ease-out shadow-md"
              style={{
                transform: `rotate(${needleAngle}deg)`
              }}
            />

            {/* Needle Pivot Cap */}
            <div className="absolute -bottom-3 w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-500 shadow-lg z-10" />
          </div>

          {/* In-Tune Status Badge with constant width */}
          <div className="mt-4 w-60 h-8 flex items-center justify-center">
            {inTune ? (
              <span className="w-48 justify-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold tracking-wider font-mono">
                <CheckCircle size={14} className="shrink-0" />
                <span>PERFECT TUNE</span>
              </span>
            ) : (
              <span className="w-52 text-center text-xs font-mono text-neutral-400 inline-block truncate">
                {cents < 0 ? 'FLAT (TUNE UP ▲)' : cents > 0 ? 'SHARP (TUNE DOWN ▼)' : 'PLAY A NOTE'}
              </span>
            )}
          </div>
        </div>

        {/* Standard String References */}
        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Guitar Standard (E A D G B E)
            </span>
            <div className="grid grid-cols-6 gap-2 mt-1.5">
              {GUITAR_STRINGS.map(s => (
                <div
                  key={s.name}
                  className={`p-2 rounded-lg border text-center font-mono ${
                    note === s.name
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300'
                  }`}
                >
                  <div className="text-xs">{s.name}</div>
                  <div className="text-[9px] text-neutral-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Bass Standard (B E A D G)
            </span>
            <div className="grid grid-cols-5 gap-2 mt-1.5">
              {BASS_STRINGS.map(s => (
                <div
                  key={s.name}
                  className={`p-2 rounded-lg border text-center font-mono ${
                    note === s.name
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                      : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300'
                  }`}
                >
                  <div className="text-xs">{s.name}</div>
                  <div className="text-[9px] text-neutral-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
