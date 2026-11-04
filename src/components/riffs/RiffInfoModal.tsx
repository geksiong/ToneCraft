import React, { useEffect } from 'react';
import { PracticeRiff } from '../../types/riffs';
import {
  X,
  Disc,
  Music,
  CheckCircle2,
  Sliders,
  Sparkles,
  BookOpen,
  Layers,
  Info
} from 'lucide-react';

interface RiffInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  riff: PracticeRiff;
  onApplyPreset?: (presetId: string) => void;
}

export const RiffInfoModal: React.FC<RiffInfoModalProps> = ({
  isOpen,
  onClose,
  riff,
  onApplyPreset
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primarySong = riff.songs.find((s) => s.isPrimary) || riff.songs[0];
  const otherSongs = riff.songs.filter((s) => !s.isPrimary);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl h-[88vh] max-h-[780px] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
              <Info size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Riff Information &amp; Song History
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {riff.songs.length} Connected {riff.songs.length === 1 ? 'Song' : 'Songs'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Song lineage, music theory breakdown, and practice tips for <strong className="text-white">{riff.name}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800 shrink-0 cursor-pointer"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          
          {/* PRIMARY SONG SPOTLIGHT */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-[#1E232B] space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Disc size={14} className="text-amber-400 animate-spin-slow" />
                <span>Original Recording Spotlight</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                Released {primarySong.year}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                "{primarySong.title}"
              </h3>
              <span className="text-sm sm:text-base font-bold text-amber-300">
                {primarySong.artist}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-mono">
              <span>Album: <strong className="text-neutral-200">{primarySong.album}</strong></span>
              <span>·</span>
              <span>Original Key: <strong className="text-neutral-200">{primarySong.key}</strong></span>
              <span>·</span>
              <span>Genre: <strong className="text-neutral-200">{primarySong.genre}</strong></span>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
              <strong className="text-amber-300">How it was used: </strong>
              {primarySong.usageNote}
            </div>
          </div>

          {/* TONECRAFT PRESET LOADER */}
          {riff.recommendedPresetId && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-500/5 border border-amber-500/35 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                  <Sliders size={16} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Authentic ToneCraft Rig:</span>
                    <span className="text-amber-300">{riff.recommendedPresetName || riff.recommendedPresetId}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Instantly load pedals, NAM/Triode amp profile, and IR cabinet designed for this riff.
                  </p>
                </div>
              </div>

              {onApplyPreset && (
                <button
                  onClick={() => {
                    onApplyPreset(riff.recommendedPresetId!);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles size={13} className="fill-black" />
                  <span>Load Preset &amp; Practice</span>
                </button>
              )}
            </div>
          )}

          {/* OTHER FAMOUS SONGS USING THIS RIFF */}
          {otherSongs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Music size={14} className="text-sky-400" />
                <span>Other Famous Songs Featuring This Exact Riff ({otherSongs.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherSongs.map((song, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0E1117] border border-[#1E232B] hover:border-neutral-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                          "{song.title}"
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {song.year}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-neutral-300 mt-0.5">
                        {song.artist}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        {song.album} · Key of {song.key}
                      </div>
                    </div>

                    <div className="mt-2.5 text-xs text-neutral-400 leading-normal border-t border-neutral-800/80 pt-2">
                      <span className="text-neutral-300 font-medium">Lineage Note: </span>
                      {song.usageNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MUSIC THEORY & SCALE BREAKDOWN */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E232B] space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BookOpen size={13} className="text-amber-400" />
              <span>Music Theory &amp; Fretboard Architecture</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase block">Scale / Mode:</span>
                <span className="text-neutral-200 font-bold">{riff.scaleOrMode}</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase block">Tuning:</span>
                <span className="text-neutral-200 font-bold">{riff.tuning}</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase block">Time Signature:</span>
                <span className="text-neutral-200 font-bold">{riff.timeSignature[0]}/{riff.timeSignature[1]}</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase block">Original BPM:</span>
                <span className="text-amber-400 font-bold">{riff.tempo} BPM</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pt-1">
              {riff.description}
            </p>
          </div>

          {/* PRACTICE SESSION PRO TIPS */}
          <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#1E232B] space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Practice Session Performance Advice</span>
            </h4>

            <ul className="space-y-2 text-xs text-neutral-300">
              {riff.practiceTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">▸</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0A0D12] border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-mono shrink-0">
          <span>{riff.primaryArtist} — "{primarySong.title}" ({riff.year})</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 transition-colors cursor-pointer font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
