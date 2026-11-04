import React, { useState, useMemo, useEffect } from 'react';
import { PracticeRiff } from '../../types/riffs';
import {
  X,
  Search,
  Flame,
  Check,
  Music,
  Disc,
  Sliders,
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RiffPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  riffs: PracticeRiff[];
  selectedRiffId: string;
  onSelectRiff: (riff: PracticeRiff) => void;
}

export const RiffPickerModal: React.FC<RiffPickerModalProps> = ({
  isOpen,
  onClose,
  riffs,
  selectedRiffId,
  onSelectRiff
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedMovability, setSelectedMovability] = useState<'All' | 'Movable' | 'Fixed'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

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

  const genres = useMemo(() => {
    const set = new Set<string>();
    riffs.forEach((r) => set.add(r.genre));
    return ['All', ...Array.from(set)];
  }, [riffs]);

  const filteredRiffs = useMemo(() => {
    return riffs.filter((riff) => {
      if (selectedGenre !== 'All' && riff.genre !== selectedGenre) return false;
      if (selectedMovability === 'Movable' && !riff.isMovable) return false;
      if (selectedMovability === 'Fixed' && riff.isMovable) return false;
      if (selectedDifficulty !== 'All' && riff.difficulty !== selectedDifficulty) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = riff.name.toLowerCase().includes(q);
        const matchesSubtitle = riff.subtitle.toLowerCase().includes(q);
        const matchesArtist = riff.primaryArtist.toLowerCase().includes(q);
        const matchesSongs = riff.songs.some(
          (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
        );
        const matchesTech = riff.techniques.some((t) => t.toLowerCase().includes(q));
        const matchesScale = riff.scaleOrMode.toLowerCase().includes(q);
        if (!matchesName && !matchesSubtitle && !matchesArtist && !matchesSongs && !matchesTech && !matchesScale) {
          return false;
        }
      }
      return true;
    });
  }, [riffs, searchQuery, selectedGenre, selectedMovability, selectedDifficulty]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Flame size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Select Practice Riff
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {riffs.length} Master Riffs
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Choose an iconic riff with interactive tablature, authentic articulations, and song lineage.
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

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 bg-[#0A0D12] border-b border-neutral-800/80 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song title (e.g. Smoke on the Water, Stairway), artist, technique, or scale..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Movability Segmented Control */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <span className="text-[10px] uppercase font-mono text-neutral-500 px-2 font-bold">Type:</span>
              <button
                onClick={() => setSelectedMovability('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedMovability === 'All'
                    ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({riffs.length})
              </button>
              <button
                onClick={() => setSelectedMovability('Movable')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedMovability === 'Movable'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
                    : 'text-neutral-400 hover:text-amber-300'
                }`}
              >
                <span>🔄 Movable</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({riffs.filter((r) => r.isMovable).length})
                </span>
              </button>
              <button
                onClick={() => setSelectedMovability('Fixed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedMovability === 'Fixed'
                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>🔒 Fixed (Open)</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({riffs.filter((r) => !r.isMovable).length})
                </span>
              </button>
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g === 'All' ? 'All Genres' : g}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vertical List of Riffs */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          {filteredRiffs.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-neutral-400">No riffs match your filter criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                  setSelectedMovability('All');
                  setSelectedDifficulty('All');
                }}
                className="mt-3 text-xs font-mono text-amber-400 hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredRiffs.map((riff) => {
              const isSelected = riff.id === selectedRiffId;
              const primarySong = riff.songs.find((s) => s.isPrimary) || riff.songs[0];
              const otherSongCount = riff.songs.length - 1;

              return (
                <div
                  key={riff.id}
                  onClick={() => {
                    onSelectRiff(riff);
                    onClose();
                  }}
                  className={`group p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                      : 'bg-[#0E1117] border-[#1E232B] hover:border-neutral-700 hover:bg-neutral-900/80'
                  }`}
                >
                  {/* Left Column: Details & Lineage */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                          riff.isMovable
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {riff.isMovable ? '🔄 Movable Shape' : '🔒 Fixed (Open Strings)'}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {riff.genre}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          riff.difficulty === 'Beginner'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : riff.difficulty === 'Intermediate'
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                            : 'bg-red-950/60 border-red-500/40 text-red-300'
                        }`}
                      >
                        {riff.difficulty}
                      </span>

                      <span className="text-[10px] font-mono text-neutral-400">
                        {riff.tempo} BPM · {riff.timeSignature[0]}/{riff.timeSignature[1]}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-200 transition-colors flex items-center gap-2">
                        <span>{riff.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-400 leading-snug line-clamp-1">
                        {riff.subtitle}
                      </p>
                    </div>

                    {/* Primary Song & Lineage Pill */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-neutral-400">
                      <span className="text-amber-300 font-semibold flex items-center gap-1">
                        <Disc size={12} className="text-amber-400" />
                        <span>"{primarySong.title}"</span>
                      </span>
                      <span>({riff.primaryArtist}, {riff.year})</span>
                      <span>·</span>
                      <span className="text-neutral-300">Key: {riff.key}</span>
                      {otherSongCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-sky-400">
                            +{otherSongCount} other famous {otherSongCount === 1 ? 'song' : 'songs'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Select Action */}
                  <div className="shrink-0 flex items-center sm:self-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRiff(riff);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-neutral-800 hover:bg-amber-500 hover:text-black text-white border border-neutral-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={14} className="stroke-[3]" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <span>Practice</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0A0D12] border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-mono shrink-0">
          <div>
            Showing <strong className="text-white">{filteredRiffs.length}</strong> of {riffs.length} riffs
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Press ESC to dismiss</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
