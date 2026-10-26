import React, { useState, useRef } from 'react';
import { Preset, AnyPedal, AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import {
  encodePresetToShareUrl,
  savePresetsToStorage
} from '../presets/defaultPresets';
import {
  X,
  Search,
  Share2,
  Download,
  Upload,
  Heart,
  Music,
  Check,
  Globe,
  Sliders,
  Send,
  Sparkles
} from 'lucide-react';

interface PresetLibraryModalProps {
  isOpen: boolean;
  currentPreset: Preset;
  presets: Preset[];
  currentPedals: AnyPedal[];
  currentAmp: AmpModelConfig;
  currentCab: IrCabinetConfig;
  onClose: () => void;
  onSelectPreset: (preset: Preset) => void;
  onPresetsUpdated: (updatedList: Preset[]) => void;
}

export const PresetLibraryModal: React.FC<PresetLibraryModalProps> = ({
  isOpen,
  currentPreset,
  presets,
  currentPedals,
  currentAmp,
  currentCab,
  onClose,
  onSelectPreset,
  onPresetsUpdated
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'browse' | 'publish' | 'share'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<'all' | 'guitar' | 'bass' | 'vocal'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Publish Form State
  const [publishName, setPublishName] = useState(currentPreset.name);
  const [publishAuthor, setPublishAuthor] = useState('');
  const [publishInstrument, setPublishInstrument] = useState<'guitar' | 'bass' | 'vocal'>(currentPreset.instrument);
  const [publishGenre, setPublishGenre] = useState<Preset['genre']>(currentPreset.genre || 'Rock');
  const [publishDesc, setPublishDesc] = useState(currentPreset.description || '');
  const [publishTags, setPublishTags] = useState(currentPreset.tags?.join(', ') || 'Lead, Modern');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter presets
  const filteredPresets = presets.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesInst = selectedInstrument === 'all' || p.instrument === selectedInstrument;
    const matchesGenre = selectedGenre === 'all' || p.genre.toLowerCase() === selectedGenre.toLowerCase();

    return matchesSearch && matchesInst && matchesGenre;
  });

  const handleCopyShareLink = (presetToShare?: Preset) => {
    const target = presetToShare || {
      ...currentPreset,
      pedals: currentPedals,
      ampModel: currentAmp,
      irCabinet: currentCab
    };
    const shareUrl = encodePresetToShareUrl(target);
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareUrl(true);
    setStatusNotification('Share URL copied to clipboard! Anyone opening this link will load your exact pedalboard tone.');
    setTimeout(() => {
      setCopiedShareUrl(false);
      setStatusNotification(null);
    }, 4000);
  };

  const handleExportJson = () => {
    const exportData = {
      ...currentPreset,
      name: publishName || currentPreset.name,
      author: publishAuthor || currentPreset.author || 'ToneCraft Musician',
      pedals: currentPedals,
      ampModel: currentAmp,
      irCabinet: currentCab,
      dateExported: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(exportData.name || 'tonecraft-preset').toLowerCase().replace(/\s+/g, '-')}.pedalboard`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text) as any;
        const importedModel = imported?.ampModel || imported?.namModel;
        if (imported && imported.pedals && importedModel) {
          const newPreset: Preset = {
            ...imported,
            ampModel: importedModel,
            id: `imported-${Date.now()}`,
            isCommunity: true
          };
          const updated = [newPreset, ...presets];
          onPresetsUpdated(updated);
          savePresetsToStorage(updated);
          onSelectPreset(newPreset);
          setStatusNotification(`Imported & loaded preset: "${newPreset.name}"!`);
          setTimeout(() => setStatusNotification(null), 3500);
        }
      } catch (err) {
        console.error('Failed to parse preset file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePublishToCloud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishName.trim()) return;

    const newPreset: Preset = {
      id: `cloud-${Date.now()}`,
      name: publishName.trim(),
      author: publishAuthor.trim() || 'Anonymous Musician',
      instrument: publishInstrument,
      genre: publishGenre,
      description: publishDesc.trim() || 'Custom community pedalboard preset.',
      tags: publishTags.split(',').map(t => t.trim()).filter(Boolean),
      pedals: currentPedals,
      ampModel: currentAmp,
      irCabinet: currentCab,
      bpm: currentPreset.bpm || 120,
      likes: 1,
      isCommunity: true
    };

    const updated = [newPreset, ...presets];
    onPresetsUpdated(updated);
    savePresetsToStorage(updated);
    onSelectPreset(newPreset);

    setStatusNotification(`Published "${newPreset.name}" to Cloud Preset Library!`);
    setActiveTab('browse');
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleLikePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.map(p => {
      if (p.id === id) {
        return { ...p, likes: (p.likes || 0) + 1 };
      }
      return p;
    });
    onPresetsUpdated(updated);
    savePresetsToStorage(updated);
  };

  const genres = ['all', 'Rock', 'Metal', 'Blues', 'Ambient', 'Shoegaze', 'Funk', 'Jazz', 'Pop', 'Vocal'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-2">
              <Globe size={18} className="text-sky-400" />
              <span>Cloud Preset Hub & Musician Sharing</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Browse signature tones, share live setups with musicians, and import/export pedalboards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'browse'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Browse Cloud Tones ({filteredPresets.length})
            </button>
            <button
              onClick={() => setActiveTab('publish')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'publish'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Publish Current Tone
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'share'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Instant Share & Export
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
              title="Import .pedalboard file"
            >
              <Upload size={12} />
              <span>Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pedalboard,.json"
              className="hidden"
              onChange={handleImportJson}
            />

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
              title="Export .pedalboard JSON file"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {statusNotification && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <Check size={14} />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Tab 1: Browse Presets */}
        {activeTab === 'browse' && (
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by title, artist, pedal, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Instrument filter buttons */}
              <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                {(['all', 'guitar', 'bass', 'vocal'] as const).map(inst => (
                  <button
                    key={inst}
                    onClick={() => setSelectedInstrument(inst)}
                    className={`w-14 justify-center text-center px-2 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                      selectedInstrument === inst
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>

              {/* Genre filter dropdown */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
              >
                {genres.map(g => (
                  <option key={g} value={g}>
                    {g === 'all' ? 'All Genres' : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {filteredPresets.map(preset => {
                const isCurrent = currentPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`group p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : 'bg-neutral-950/60 hover:bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-400 transition-colors">
                            {preset.name}
                          </h4>
                          <span className="text-[11px] text-neutral-400">
                            by {preset.author}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {preset.instrument}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            · {preset.genre}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
                          {preset.description}
                        </p>

                        {/* Tone Chain Details */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-neutral-400">
                          <span className="font-mono text-neutral-400">Amp: {preset.ampModel?.name}</span>
                          <span>·</span>
                          <span className="font-mono text-neutral-400">Cab: {preset.irCabinet?.name}</span>
                          <span>·</span>
                          {/* Mini Pedal Dots */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-neutral-400">Pedals:</span>
                            {preset.pedals.map((p, idx) => (
                              <span
                                key={p.id || idx}
                                className="inline-block w-2.5 h-2.5 rounded-full border border-white/30"
                                style={{ backgroundColor: p.color || '#e2e8f0' }}
                                title={`${p.name} (${p.type})`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons with constant widths */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleLikePreset(preset.id, e)}
                          className="w-16 justify-center flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs transition-colors shrink-0"
                          title="Upvote preset"
                        >
                          <Heart size={13} className="text-red-400 fill-red-400/20 shrink-0" />
                          <span className="font-mono tabular-nums w-6 text-center inline-block">{preset.likes || 1}</span>
                        </button>

                        <button
                          onClick={() => handleCopyShareLink(preset)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors shrink-0"
                          title="Copy share link for this preset"
                        >
                          <Share2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            onSelectPreset(preset);
                            onClose();
                          }}
                          className={`w-28 justify-center px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-black shadow-sm'
                              : 'bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-200'
                          }`}
                        >
                          <span className="w-20 text-center inline-block">{isCurrent ? 'Active Tone' : 'Load Tone'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPresets.length === 0 && (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No presets matched your search criteria. Try a different query or instrument filter!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Publish Current Tone */}
        {activeTab === 'publish' && (
          <form onSubmit={handlePublishToCloud} className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">
                  Preset Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Searing Boutique Lead"
                  value={publishName}
                  onChange={(e) => setPublishName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">
                  Creator / Musician Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eddie Shred"
                  value={publishAuthor}
                  onChange={(e) => setPublishAuthor(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">
                  Instrument:
                </label>
                <select
                  value={publishInstrument}
                  onChange={(e) => setPublishInstrument(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="guitar">Guitar</option>
                  <option value="bass">Bass</option>
                  <option value="vocal">Vocal / Voice</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1">
                  Primary Genre:
                </label>
                <select
                  value={publishGenre}
                  onChange={(e) => setPublishGenre(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Rock">Rock</option>
                  <option value="Metal">Metal</option>
                  <option value="Blues">Blues</option>
                  <option value="Ambient">Ambient</option>
                  <option value="Funk">Funk</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Shoegaze">Shoegaze</option>
                  <option value="Pop">Pop</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">
                Tone Description:
              </label>
              <textarea
                rows={3}
                placeholder="Describe pickup position, ideal song context, amp character..."
                value={publishDesc}
                onChange={(e) => setPublishDesc(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1">
                Tags (comma separated):
              </label>
              <input
                type="text"
                placeholder="Fuzz, Solo, High-Gain, 80s Rock"
                value={publishTags}
                onChange={(e) => setPublishTags(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                <Send size={14} />
                <span>Publish to Cloud Library</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Share URL & Export */}
        {activeTab === 'share' && (
          <div className="p-6 space-y-6">
            <div className="bg-neutral-950/70 p-5 rounded-xl border border-neutral-800">
              <h4 className="text-sm font-bold text-neutral-200 mb-1 flex items-center gap-2">
                <Share2 size={16} className="text-amber-400" />
                <span>Instant Share URL (Zero Registration)</span>
              </h4>
              <p className="text-xs text-neutral-400 mb-3">
                This URL encapsulates your entire active rig: all pedal knobs, positions, true-bypass states, NAM profile parameters, and IR cabinet impulse into a compact URL parameter.
              </p>

              <button
                onClick={() => handleCopyShareLink()}
                className="w-64 justify-center flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shrink-0"
              >
                {copiedShareUrl ? <Check size={16} className="shrink-0" /> : <Share2 size={16} className="shrink-0" />}
                <span className="w-52 text-center inline-block truncate">{copiedShareUrl ? 'Link Copied to Clipboard!' : 'Copy Cloud Share URL'}</span>
              </button>
            </div>

            <div className="bg-neutral-950/70 p-5 rounded-xl border border-neutral-800">
              <h4 className="text-sm font-bold text-neutral-200 mb-1 flex items-center gap-2">
                <Download size={16} className="text-sky-400" />
                <span>Download Preset File (.pedalboard)</span>
              </h4>
              <p className="text-xs text-neutral-400 mb-3">
                Save an offline JSON backup of this rig to your computer, or share it directly with bandmates and DAW sessions.
              </p>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors"
              >
                <Download size={14} />
                <span>Download .pedalboard File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
