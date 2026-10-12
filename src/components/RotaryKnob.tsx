import React, { useRef, useState, useEffect, useCallback } from 'react';

interface RotaryKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  defaultValue?: number;
  color?: string;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  size = 'md',
  defaultValue,
  color = '#e2e8f0',
  onChange,
  formatValue
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  // Map value to -135deg ... +135deg (total 270 degrees)
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + normalized * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = startYRef.current - e.clientY; // Dragging up increases value
    const range = max - min;
    const sensitivity = e.shiftKey ? 400 : 150; // Shift for fine-tuning
    const deltaVal = (dy / sensitivity) * range;
    let newVal = startValRef.current + deltaVal;

    if (step) {
      newVal = Math.round(newVal / step) * step;
    }
    newVal = Math.max(min, Math.min(max, newVal));
    onChange(newVal);
  }, [isDragging, min, max, step, onChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    } else {
      onChange((min + max) / 2);
    }
  };

  // Dimensions
  const dim = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const indicatorDim = size === 'sm' ? 'h-2 w-0.5' : size === 'lg' ? 'h-3.5 w-1' : 'h-2.5 w-0.5';

  const displayVal = formatValue ? formatValue(value) : `${Math.round(value * 10) / 10}${unit}`;

  return (
    <div className="flex flex-col items-center select-none group touch-none">
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`relative ${dim} rounded-full cursor-ns-resize transition-transform duration-75 active:scale-95 flex items-center justify-center knob-shadow`}
        style={{
          background: 'radial-gradient(circle at 40% 35%, #383b42 0%, #17181c 70%, #0d0e11 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)'
        }}
        title={`${label}: ${displayVal} (Double-click to reset, Shift for fine-tuning)`}
      >
        {/* Outer grip ridges */}
        <div className="absolute inset-0.5 rounded-full border border-neutral-700/50 pointer-events-none" />

        {/* Rotating inner face with indicator line */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div
            className={`absolute top-1 ${indicatorDim} rounded-full transition-colors`}
            style={{
              backgroundColor: isDragging ? '#38bdf8' : color,
              boxShadow: isDragging ? '0 0 6px #38bdf8' : 'none'
            }}
          />
        </div>

        {/* Center metallic cap */}
        <div
          className="w-4 h-4 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #525760 0%, #202227 80%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
          }}
        />
      </div>

      {/* Label and live readout with constant width */}
      <span className="mt-1 text-[10px] font-semibold tracking-wider uppercase text-neutral-300 truncate w-16 text-center inline-block">
        {label}
      </span>
      <span className="text-[9px] font-mono tabular-nums text-neutral-400 group-hover:text-amber-400 transition-colors w-16 text-center truncate inline-block">
        {displayVal}
      </span>
    </div>
  );
};
