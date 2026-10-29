import React from 'react';
import {
  Layers,
  Speaker,
  Disc,
  Activity,
  Plus,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { LooperState, AmpModelConfig, IrCabinetConfig } from '../types/pedal';

export type ActiveChainTab = 'pedals' | 'amp-cab' | 'looper' | 'spectrum';
export type ViewMode = 'tabs' | 'stack';

interface SignalChainTabsProps {
  activeTab: ActiveChainTab;
  onSelectTab: (tab: ActiveChainTab) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  pedalsCount: number;
  activePedalsCount: number;
  onOpenAddPedal: () => void;
  ampModel: AmpModelConfig;
  irCabinet: IrCabinetConfig;
  looperState: LooperState;
}

export const SignalChainTabs: React.FC<SignalChainTabsProps> = ({
  activeTab,
  onSelectTab,
  viewMode,
  onToggleViewMode,
  pedalsCount,
  activePedalsCount,
  onOpenAddPedal,
  ampModel,
  irCabinet,
  looperState
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#0E1117] border border-[#1E232B] rounded-xl p-1.5 shadow-md">
      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-[300px]">
        {/* TAB 1: PEDALBOARD */}
        <button
          onClick={() => onSelectTab('pedals')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'pedals' && viewMode === 'tabs'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Layers size={14} className={activeTab === 'pedals' ? 'text-amber-400' : 'text-neutral-500'} />
          <span>Pedalboard</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
            {activePedalsCount}/{pedalsCount} on
          </span>
        </button>

        {/* TAB 2: AMP & CABINET */}
        <button
          onClick={() => onSelectTab('amp-cab')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'amp-cab' && viewMode === 'tabs'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Speaker size={14} className={activeTab === 'amp-cab' ? 'text-sky-400' : 'text-neutral-500'} />
          <span>Amp &amp; Cab</span>
          <span className="font-mono text-[10px] text-neutral-400 hidden sm:inline truncate max-w-[140px]">
            {ampModel.name.replace(/ \(.*\)/, '')}
          </span>
        </button>

        {/* TAB 3: TAPE LOOPER */}
        <button
          onClick={() => onSelectTab('looper')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'looper' && viewMode === 'tabs'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Disc
            size={14}
            className={`transition-colors ${
              looperState.status === 'recording'
                ? 'text-red-500 animate-pulse'
                : looperState.status === 'playing'
                ? 'text-emerald-400'
                : 'text-neutral-500'
            }`}
          />
          <span>Tape Looper</span>
          {looperState.status !== 'idle' && (
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full uppercase font-bold ${
                looperState.status === 'recording'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {looperState.status}
            </span>
          )}
        </button>

        {/* TAB 4: SPECTRUM & FREQUENCY RESPONSE */}
        <button
          onClick={() => onSelectTab('spectrum')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'spectrum' && viewMode === 'tabs'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Activity size={14} className={activeTab === 'spectrum' ? 'text-emerald-400' : 'text-neutral-500'} />
          <span>Spectrum &amp; Bode Plot</span>
        </button>
      </div>

      {/* Right Actions: Quick "+ Add Pedal" & View Mode Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAddPedal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
          title="Add a Stompbox Pedal to Chain"
        >
          <Plus size={13} />
          <span>Add Pedal</span>
        </button>

        <span className="w-px h-4 bg-neutral-800" />

        {/* View Mode Toggle: Single Focused Tab vs Full Stack Rig */}
        <button
          onClick={onToggleViewMode}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
          title={
            viewMode === 'tabs'
              ? 'Switch to Full Rig Stack (scrollable view of all components)'
              : 'Switch to Focused Tabs'
          }
        >
          {viewMode === 'tabs' ? (
            <>
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Stack Rig</span>
            </>
          ) : (
            <>
              <Columns size={13} />
              <span className="hidden sm:inline text-amber-400 font-bold">Tabs View</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
