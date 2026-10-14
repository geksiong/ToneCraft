import React, { useState } from 'react';
import { AnyPedal, VstPluginPedal } from '../types/pedal';
import { PedalCard } from './PedalCard';
import { Plus, ArrowRight } from 'lucide-react';

interface PedalboardProps {
  pedals: AnyPedal[];
  onUpdatePedal: (updated: AnyPedal) => void;
  onRemovePedal: (id: string) => void;
  onReorderPedals: (newPedals: AnyPedal[]) => void;
  onOpenAddPedal: () => void;
  onOpenVstEditor: (pedal: VstPluginPedal) => void;
}

export const Pedalboard: React.FC<PedalboardProps> = ({
  pedals,
  onUpdatePedal,
  onRemovePedal,
  onReorderPedals,
  onOpenAddPedal,
  onOpenVstEditor
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleMoveLeft = (idx: number) => {
    if (idx <= 0) return;
    const newArr = [...pedals];
    const temp = newArr[idx - 1];
    newArr[idx - 1] = newArr[idx];
    newArr[idx] = temp;
    onReorderPedals(newArr);
  };

  const handleMoveRight = (idx: number) => {
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
    <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl p-5 my-6 overflow-hidden">
      {/* Pedalboard Aluminum Rail Textures */}
      <div className="absolute inset-x-0 top-12 h-2.5 bg-neutral-900 border-y border-neutral-800 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-16 h-2.5 bg-neutral-900 border-y border-neutral-800 pointer-events-none" />

      {/* Signal Chain Mini Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-amber-400 font-bold uppercase tracking-wider">Signal Chain</span>
          <span>:</span>
          <span>Input</span>
          <ArrowRight size={12} className="text-neutral-400" />
          <span className="text-neutral-200 font-semibold">{pedals.length} Effects</span>
          <ArrowRight size={12} className="text-neutral-400" />
          <span>Amp &amp; IR Cab</span>
          <ArrowRight size={12} className="text-neutral-400" />
          <span>Looper</span>
          <ArrowRight size={12} className="text-neutral-400" />
          <span>Output</span>
        </div>

        <div className="text-[11px] font-mono text-neutral-400">
          Tip: Drag pedals or use &larr; &rarr; arrows to reorder audio chain
        </div>
      </div>

      {/* Scrollable / Horizontally Wrapped Pedal Bay */}
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
                {/* Gold Quarter-inch jack heads */}
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
    </div>
  );
};
