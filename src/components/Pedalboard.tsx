import React, { useState } from 'react';
import { AnyPedal, VstPluginPedal } from '../types/pedal';
import { PedalCard } from './PedalCard';
import {
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Code,
  Layers
} from 'lucide-react';

interface PedalboardProps {
  pedals: AnyPedal[];
  onUpdatePedal: (updated: AnyPedal) => void;
  onRemovePedal: (id: string) => void;
  onReorderPedals: (newPedals: AnyPedal[]) => void;
  onOpenAddPedal: () => void;
  onOpenVstEditor: (pedal: VstPluginPedal) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Pedalboard: React.FC<PedalboardProps> = ({
  pedals,
  onUpdatePedal,
  onRemovePedal,
  onReorderPedals,
  onOpenAddPedal,
  onOpenVstEditor,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = controlledToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const activeCount = pedals.filter(p => p.enabled).length;

  const playStompClick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  const handleTogglePedalBypass = (pedal: AnyPedal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playStompClick();
    onUpdatePedal({ ...pedal, enabled: !pedal.enabled });
  };

  const handleMoveLeft = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (idx <= 0) return;
    const newArr = [...pedals];
    const temp = newArr[idx - 1];
    newArr[idx - 1] = newArr[idx];
    newArr[idx] = temp;
    onReorderPedals(newArr);
  };

  const handleMoveRight = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (idx >= pedals.length - 1) return;
    const newArr = [...pedals];
    const temp = newArr[idx + 1];
    newArr[idx + 1] = newArr[idx];
    newArr[idx] = temp;
    onReorderPedals(newArr);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(idx));
    } catch {
      // ignore
    }
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      const newArr = [...pedals];
      const item = newArr.splice(draggedIdx, 1)[0];
      newArr.splice(targetIdx, 0, item);
      onReorderPedals(newArr);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl p-2.5 sm:p-3.5 my-2 overflow-hidden transition-all duration-200">
      {/* Pedalboard Aluminum Rail Textures (Only in expanded mode) */}
      {!isCollapsed && (
        <>
          <div className="absolute inset-x-0 top-12 h-2.5 bg-neutral-900 border-y border-neutral-800 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-14 h-2.5 bg-neutral-900 border-y border-neutral-800 pointer-events-none" />
        </>
      )}

      {/* Signal Chain Mini Bar & View Mode Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-800/80">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-neutral-400">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            Pedalboard Chain
          </span>
          <span>:</span>
          <span>Input</span>
          <ArrowRight size={11} className="text-neutral-500" />
          <span className="text-neutral-200 font-semibold">{pedals.length} Effects</span>
          <ArrowRight size={11} className="text-neutral-500" />
          <span>Amp &amp; IR Cab</span>
          <ArrowRight size={11} className="text-neutral-500" />
          <span>Looper</span>
          <ArrowRight size={11} className="text-neutral-500" />
          <span>Output</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Status Badge */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <strong className="text-emerald-400">{activeCount}</strong>/{pedals.length} Active
          </span>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-lg border transition-all ${
              isCollapsed
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
            }`}
            title={isCollapsed ? 'Expand Pedalboard to view full stompbox controls' : 'Collapse Pedalboard into compact switcher strip'}
          >
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{isCollapsed ? 'Expand Board' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSED VIEW: High-Density Pedal Switcher Bay with Pedal Backgrounds    */}
      {/* ========================================================================= */}
      {isCollapsed ? (
        <div>
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-0.5">
            {pedals.map((pedal, idx) => {
              const isEnabled = pedal.enabled;
              return (
                <div
                  key={pedal.id}
                  className={`relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-150 min-w-[200px] sm:min-w-[220px] flex-1 max-w-[300px] shadow-md select-none ${
                    isEnabled
                      ? 'border-white/20 ring-1 ring-white/10 shadow-lg'
                      : 'border-black/50 opacity-75 saturate-75 hover:opacity-95'
                  }`}
                  style={{
                    backgroundColor: pedal.color || '#262626',
                    backgroundImage: isEnabled
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.42) 100%)'
                      : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)'
                  }}
                >
                  {/* Left: Pedal Text Plate (Dark translucent container for 100% contrast on any pedal color) */}
                  <div className="bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-black/30 flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-white/60 font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className="text-xs font-bold text-white truncate block drop-shadow-sm"
                          title={pedal.name}
                        >
                          {pedal.name}
                        </span>
                        {pedal.type === 'vstPlugin' && (
                          <button
                            onClick={() => onOpenVstEditor(pedal as VstPluginPedal)}
                            className="p-0.5 text-amber-300 hover:text-amber-200 transition-colors shrink-0"
                            title="Edit VST DSP script"
                          >
                            <Code size={11} />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] font-mono uppercase text-white/60 block truncate">
                        {pedal.type}
                      </span>
                    </div>
                  </div>

                  {/* Right: Reorder arrows & BYPASS Toggle Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center text-white/70">
                      <button
                        onClick={(e) => handleMoveLeft(idx, e)}
                        disabled={idx === 0}
                        className="p-0.5 hover:text-white disabled:opacity-20 transition-colors"
                        title="Move left in audio chain"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        onClick={(e) => handleMoveRight(idx, e)}
                        disabled={idx === pedals.length - 1}
                        className="p-0.5 hover:text-white disabled:opacity-20 transition-colors"
                        title="Move right in audio chain"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    {/* Dedicated Pedal Bypass Toggle Button */}
                    <button
                      onClick={(e) => handleTogglePedalBypass(pedal, e)}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition-all active:scale-95 shadow-xs ${
                        isEnabled
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-300 shadow-sm'
                          : 'bg-black/70 hover:bg-black/90 text-white/80 border-white/20'
                      }`}
                      title={isEnabled ? `Bypass ${pedal.name} (True Bypass)` : `Engage ${pedal.name}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                          isEnabled
                            ? 'bg-emerald-950 shadow-[0_0_6px_#34d399]'
                            : 'bg-neutral-600'
                        }`}
                      />
                      <span>{isEnabled ? 'ON' : 'BYPASS'}</span>
                    </button>

                    <button
                      onClick={() => onRemovePedal(pedal.id)}
                      className="p-1 text-white/60 hover:text-red-300 transition-colors"
                      title={`Remove ${pedal.name}`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Stompbox Slot in Collapsed View */}
            <button
              onClick={onOpenAddPedal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-neutral-700 hover:border-amber-500/60 bg-neutral-900/40 hover:bg-neutral-900/80 text-neutral-400 hover:text-amber-400 text-xs font-mono transition-all shrink-0 min-h-[42px]"
              title="Add a new pedal to the chain"
            >
              <Plus size={13} className="text-amber-400" />
              <span>+ Add Pedal</span>
            </button>
          </div>

          {pedals.length === 0 && (
            <div className="py-2 text-center text-xs text-neutral-500 font-mono">
              Signal chain is empty. Click "+ Add Pedal" above to populate your pedalboard.
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* EXPANDED VIEW: Realistic Aluminum Stompbox Bay with Knobs & Foot Controls */
        /* ========================================================================= */
        <>
          <div className="text-[11px] font-mono text-neutral-400 mb-2">
            Tip: Drag pedals or use &larr; &rarr; arrows to reorder audio chain
          </div>

          <div
            className="relative flex flex-wrap items-stretch gap-6 min-h-[380px] p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragEnd}
          >
            {pedals.map((pedal, idx) => (
              <div
                key={pedal.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`relative flex items-center transition-all duration-150 cursor-grab active:cursor-grabbing ${
                  draggedIdx === idx
                    ? 'opacity-40 scale-95'
                    : dragOverIdx === idx && draggedIdx !== null
                    ? 'scale-105 ring-2 ring-amber-500/80 rounded-xl shadow-lg shadow-amber-500/20'
                    : 'opacity-100'
                }`}
              >
                {/* Visual Patch Cable connecting to previous pedal */}
                {idx > 0 && (
                  <div className="hidden sm:block absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600 shadow-sm z-0 pointer-events-none">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-3 rounded-sm bg-amber-400 border border-amber-600" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-3 rounded-sm bg-amber-400 border border-amber-600" />
                  </div>
                )}

                <PedalCard
                  pedal={pedal}
                  index={idx}
                  totalPedals={pedals.length}
                  onUpdate={onUpdatePedal}
                  onRemove={onRemovePedal}
                  onMoveLeft={handleMoveLeft}
                  onMoveRight={handleMoveRight}
                  onOpenVstEditor={onOpenVstEditor}
                />
              </div>
            ))}

            {/* Add Pedal Stomp Slot */}
            <div className="flex items-center justify-center min-w-[180px] min-h-[360px] rounded-xl border-2 border-dashed border-neutral-800 hover:border-amber-500/60 bg-neutral-900/30 hover:bg-neutral-900/70 transition-all">
              <button
                onClick={onOpenAddPedal}
                className="flex flex-col items-center gap-2.5 p-6 text-center text-neutral-400 hover:text-amber-400 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-900 group-hover:bg-amber-500/20 border border-neutral-700 group-hover:border-amber-400/40 flex items-center justify-center transition-all">
                  <Plus size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase block">
                    Add Stompbox
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                    Drive, Mod, Pitch, VST...
                  </span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
