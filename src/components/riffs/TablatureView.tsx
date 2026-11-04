import React, { useRef, useEffect } from 'react';
import { PracticeRiff, TabColumn, TabNote, TechniqueType } from '../../types/riffs';

interface TablatureViewProps {
  riff: PracticeRiff;
  activeColumnIndex: number;
  currentBeat: number;
  isPlaying: boolean;
  fretShift: number; // Transposition offset (+/- frets)
  onSeekToBeat: (beat: number) => void;
}

const STRING_NAMES = [
  { num: 1, name: 'e', label: '1 (High E)', color: 'text-amber-200' },
  { num: 2, name: 'B', label: '2 (B)', color: 'text-amber-100' },
  { num: 3, name: 'G', label: '3 (G)', color: 'text-neutral-300' },
  { num: 4, name: 'D', label: '4 (D)', color: 'text-neutral-400' },
  { num: 5, name: 'A', label: '5 (A)', color: 'text-neutral-400' },
  { num: 6, name: 'E', label: '6 (Low E)', color: 'text-neutral-500' }
];

export const TablatureView: React.FC<TablatureViewProps> = ({
  riff,
  activeColumnIndex,
  currentBeat,
  isPlaying,
  fretShift,
  onSeekToBeat
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeColRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active column into view during playback
  useEffect(() => {
    if (isPlaying && activeColRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeColRef.current;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      if (elLeft < scrollLeft + 60 || elLeft + elWidth > scrollLeft + containerWidth - 60) {
        container.scrollTo({
          left: Math.max(0, elLeft - containerWidth / 3),
          behavior: 'smooth'
        });
      }
    }
  }, [activeColumnIndex, isPlaying]);

  const totalBeats = riff.totalBeats || 8;
  const timeSigNumerator = riff.timeSignature[0] || 4;

  const renderTechniqueDecoration = (note: TabNote, noteFretDisplay: number | string) => {
    switch (note.technique) {
      case 'bend-full':
        return (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-tighter leading-none bg-neutral-900/90 px-1 rounded border border-amber-500/30">
              Full
            </span>
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-amber-400">
              <path d="M 6 0 L 2 4 M 6 0 L 10 4 M 6 0 L 6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'bend-half':
        return (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-tighter leading-none bg-neutral-900/90 px-1 rounded border border-amber-500/30">
              ½
            </span>
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-amber-400">
              <path d="M 6 0 L 2 4 M 6 0 L 10 4 M 6 0 L 6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'bend-quarter':
        return (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[8px] font-mono font-bold text-sky-400 uppercase tracking-tighter leading-none bg-neutral-900/90 px-1 rounded border border-sky-500/30">
              curl ¼
            </span>
          </div>
        );
      case 'bend-release':
        return (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-tighter leading-none bg-neutral-900/90 px-1 rounded border border-emerald-500/30">
              b-r
            </span>
            <svg width="14" height="8" viewBox="0 0 14 8" className="text-emerald-400">
              <path d="M 2 8 Q 7 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        );
      case 'hammer-on':
        return (
          <div className="absolute -top-4 -right-1 pointer-events-none">
            <span className="text-[8px] font-mono font-extrabold text-cyan-300 bg-cyan-950/80 px-1 rounded border border-cyan-500/30">
              h
            </span>
          </div>
        );
      case 'pull-off':
        return (
          <div className="absolute -top-4 -right-1 pointer-events-none">
            <span className="text-[8px] font-mono font-extrabold text-indigo-300 bg-indigo-950/80 px-1 rounded border border-indigo-500/30">
              p
            </span>
          </div>
        );
      case 'slide-up':
        return (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-amber-300">/</span>
          </div>
        );
      case 'slide-down':
        return (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-amber-300">\</span>
          </div>
        );
      case 'vibrato':
        return (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[11px] font-mono font-extrabold text-amber-400 leading-none">~~~</span>
          </div>
        );
      case 'palm-mute':
        return (
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[7.5px] font-mono font-bold text-neutral-400 uppercase tracking-tighter bg-neutral-900/90 px-0.5 rounded">
              PM
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-[#0A0D12] border border-[#1E232B] rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header Bar: Key, Tunings, Transposition & Legend */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#0D1117] border-b border-[#1E232B] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">Tuning:</span>
            <span className="font-mono font-semibold text-neutral-200">{riff.tuning}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">Original Key:</span>
            <span className="font-mono font-bold text-amber-400">{riff.key}</span>
          </div>

          {fretShift !== 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/40 animate-in fade-in">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-mono">Transposed:</span>
              <span className="font-mono font-bold text-amber-300">
                {fretShift > 0 ? `+${fretShift}` : fretShift} Frets
              </span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">Time:</span>
            <span className="font-mono font-semibold text-neutral-300">{riff.timeSignature[0]}/{riff.timeSignature[1]}</span>
          </div>
        </div>

        {/* Notation Technique Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">b</span> Bend
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">h</span> Hammer-on
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/40">p</span> Pull-off
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1 rounded bg-neutral-800 text-amber-300 font-bold">/</span> Slide
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-bold">~</span> Vibrato
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1 rounded bg-neutral-800 text-neutral-300 font-bold">PM</span> Palm Mute
          </span>
        </div>
      </div>

      {/* Main Tablature Canvas */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto relative scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent select-none py-6 px-4 sm:px-6"
      >
        <div className="min-w-max flex relative">
          {/* Left Column: String Names (e, B, G, D, A, E) */}
          <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-r border-[#1E232B] pr-3 select-none z-10 bg-[#0A0D12]">
            {STRING_NAMES.map((str) => (
              <div key={str.num} className="h-9 flex items-center justify-between font-mono text-xs">
                <span className={`font-bold ${str.color}`}>{str.name}</span>
                <span className="text-[10px] text-neutral-600 font-mono">{str.num}</span>
              </div>
            ))}
          </div>

          {/* Right Columns: Rhythmic Tab Columns with Strings in Background */}
          <div className="relative flex-1 flex py-1 pl-2">
            {/* 6 Horizontal String Lines spanning entire width */}
            <div className="absolute inset-x-0 inset-y-1 flex flex-col justify-between pointer-events-none">
              {STRING_NAMES.map((str) => (
                <div key={str.num} className="h-9 flex items-center">
                  <div
                    className={`w-full ${
                      str.num === 1 || str.num === 2
                        ? 'h-[1px] bg-neutral-800'
                        : str.num === 3 || str.num === 4
                        ? 'h-[1.5px] bg-neutral-700/80'
                        : 'h-[2px] bg-neutral-700'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Tab Columns */}
            {riff.columns.map((col, colIdx) => {
              const isActive = activeColumnIndex === colIdx && isPlaying;
              const isMeasureStart = col.measure !== undefined;
              const isFirstInMeasure = col.time % timeSigNumerator === 0;

              return (
                <div
                  key={col.id}
                  ref={isActive ? activeColRef : null}
                  onClick={() => onSeekToBeat(col.time)}
                  className={`group relative flex flex-col justify-between items-center cursor-pointer px-2.5 sm:px-3 transition-colors ${
                    isActive ? 'bg-amber-500/15 ring-1 ring-amber-500/40 rounded-md z-10' : 'hover:bg-neutral-800/30'
                  }`}
                  style={{ minWidth: col.duration < 0.35 ? '48px' : '62px' }}
                >
                  {/* Measure Bar Line separator */}
                  {isMeasureStart && col.time > 0 && (
                    <div className="absolute -left-1 inset-y-0 w-px bg-neutral-600 z-10 flex items-start">
                      <span className="absolute -top-5 -left-2 text-[9px] font-mono text-neutral-500 font-bold bg-[#0A0D12] px-1 border border-neutral-800 rounded">
                        M{col.measure}
                      </span>
                    </div>
                  )}

                  {/* Text Annotation / Rhythm above column */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {col.annotation ? (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-amber-400 text-black'
                            : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        {col.annotation}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        b{col.time.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* 6 String Slots in this Column */}
                  {STRING_NAMES.map((str) => {
                    const note = col.notes.find((n) => n.string === str.num);
                    const hasNote = note !== undefined;

                    // Calculate displayed fret with transposition
                    let displayFret: string | number = '';
                    let isShifted = false;

                    if (hasNote) {
                      if (note.fret < 0) {
                        displayFret = 'X';
                      } else {
                        const calculatedFret = note.fret + fretShift;
                        displayFret = calculatedFret;
                        isShifted = fretShift !== 0;
                      }
                    }

                    return (
                      <div key={str.num} className="h-9 w-full flex items-center justify-center relative">
                        {hasNote && (
                          <div className="relative flex items-center justify-center">
                            {/* Note Fret Badge */}
                            <div
                              className={`w-7 h-7 rounded-md font-mono font-bold text-xs flex items-center justify-center shadow-md transition-all ${
                                isActive
                                  ? 'bg-amber-400 text-black scale-110 ring-2 ring-amber-300 shadow-amber-500/50'
                                  : isShifted
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:scale-105'
                                  : displayFret === 'X'
                                  ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                  : 'bg-neutral-900 text-white border border-neutral-700/80 hover:border-neutral-500 hover:scale-105'
                              }`}
                            >
                              <span>{displayFret}</span>
                            </div>

                            {/* Articulation technique glyph */}
                            {renderTechniqueDecoration(note, displayFret)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bottom Beat Marker / Timing stem indicator */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <span
                      className={`text-[9px] font-mono ${
                        isActive
                          ? 'text-amber-400 font-bold'
                          : isFirstInMeasure
                          ? 'text-neutral-400'
                          : 'text-neutral-600'
                      }`}
                    >
                      {col.time % 1 === 0 ? Math.floor(col.time) + 1 : `.${Math.round((col.time % 1) * 10)}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Ending Final Bar Line */}
            <div className="w-1.5 self-stretch border-r-2 border-neutral-500 ml-4 flex items-center" />
          </div>
        </div>
      </div>

      {/* Playhead Progress Bar Under Tablature */}
      <div className="h-1.5 w-full bg-neutral-900 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-75"
          style={{ width: `${Math.min(100, (currentBeat / totalBeats) * 100)}%` }}
        />
      </div>
    </div>
  );
};
