import React, { useRef, useState, useCallback } from 'react';

export interface RotaryKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  defaultValue?: number;
  color?: string;
  ringColor?: string;
  midiBadge?: string;
  onMidiLearn?: () => void;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

interface SizeConfig {
  wrapperClass: string;
  svgSize: number;
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  pipRadius: number;
  tickRadius: number;
  knobClass: string;
  indicatorClass: string;
  capClass: string;
  labelClass: string;
  valClass: string;
}

const SIZE_CONFIGS: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: {
    wrapperClass: 'w-10 h-10',
    svgSize: 40,
    cx: 20,
    cy: 20,
    r: 16,
    strokeWidth: 2.2,
    pipRadius: 1.8,
    tickRadius: 0.8,
    knobClass: 'w-7 h-7',
    indicatorClass: 'h-1.5 w-0.5',
    capClass: 'w-2.5 h-2.5',
    labelClass: 'w-11 text-[8.5px]',
    valClass: 'w-11 text-[8px]'
  },
  md: {
    wrapperClass: 'w-[48px] h-[48px]',
    svgSize: 48,
    cx: 24,
    cy: 24,
    r: 20.5,
    strokeWidth: 2.8,
    pipRadius: 2.2,
    tickRadius: 1.0,
    knobClass: 'w-9 h-9',
    indicatorClass: 'h-2 w-0.5',
    capClass: 'w-3.5 h-3.5',
    labelClass: 'w-16 text-[10px]',
    valClass: 'w-16 text-[9px]'
  },
  lg: {
    wrapperClass: 'w-[64px] h-[64px]',
    svgSize: 64,
    cx: 32,
    cy: 32,
    r: 27,
    strokeWidth: 3.5,
    pipRadius: 2.8,
    tickRadius: 1.2,
    knobClass: 'w-12 h-12',
    indicatorClass: 'h-3 w-1',
    capClass: 'w-4 h-4',
    labelClass: 'w-20 text-xs',
    valClass: 'w-20 text-[10px]'
  }
};

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  // 0 degrees is 12 o'clock (straight UP, negative Y)
  const rad = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(2)),
    y: Number((cy + r * Math.sin(rad)).toFixed(2))
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweepAngle = endAngle - startAngle;
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
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
  ringColor,
  midiBadge,
  onMidiLearn,
  onChange,
  formatValue
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  // Map value to -135deg ... +135deg (total 270 degrees sweep)
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + normalized * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
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
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    } else {
      onChange((min + max) / 2);
    }
  };

  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  // Active lit ring color logic:
  // - ringColor if explicitly provided
  // - color if provided and not default '#e2e8f0'
  // - default to glowing analog amber '#f59e0b'
  const baseColor = ringColor || (color && color !== '#e2e8f0' ? color : '#f59e0b');
  const activeColor = isDragging ? '#38bdf8' : baseColor;

  // Arc paths
  const bgArcPath = describeArc(cfg.cx, cfg.cy, cfg.r, -135, 135);
  const hasActiveArc = normalized > 0.005;
  const activeArcPath = hasActiveArc ? describeArc(cfg.cx, cfg.cy, cfg.r, -135, angle) : '';
  const tipPoint = polarToCartesian(cfg.cx, cfg.cy, cfg.r, angle);

  // Calibration tick markers
  const minTick = polarToCartesian(cfg.cx, cfg.cy, cfg.r, -135);
  const midTick = polarToCartesian(cfg.cx, cfg.cy, cfg.r, 0);
  const maxTick = polarToCartesian(cfg.cx, cfg.cy, cfg.r, 135);

  const displayVal = formatValue ? formatValue(value) : `${Math.round(value * 10) / 10}${unit}`;

  return (
    <div className="flex flex-col items-center select-none group touch-none">
      {/* Outer wrapper: hosts the lit ring SVG and the rotating physical knob */}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`relative ${cfg.wrapperClass} cursor-ns-resize flex items-center justify-center transition-transform duration-75 active:scale-95`}
        title={`${label}: ${displayVal} (Double-click to reset, Shift for fine-tuning)`}
      >
        {/* Illuminated Ring SVG */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          width={cfg.svgSize}
          height={cfg.svgSize}
          viewBox={`0 0 ${cfg.svgSize} ${cfg.svgSize}`}
        >
          {/* Channel groove in chassis */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="rgba(0, 0, 0, 0.65)"
            strokeWidth={cfg.strokeWidth + 1.2}
            strokeLinecap="round"
          />

          {/* Unlit background guide track */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={cfg.strokeWidth}
            strokeLinecap="round"
          />

          {/* Subtle calibration ticks (min, 12 o'clock center, max) */}
          <circle cx={minTick.x} cy={minTick.y} r={cfg.tickRadius} fill="rgba(255, 255, 255, 0.3)" />
          <circle cx={midTick.x} cy={midTick.y} r={cfg.tickRadius} fill="rgba(255, 255, 255, 0.3)" />
          <circle cx={maxTick.x} cy={maxTick.y} r={cfg.tickRadius} fill="rgba(255, 255, 255, 0.3)" />

          {/* Active Lit Ring Arc */}
          {hasActiveArc && (
            <path
              d={activeArcPath}
              fill="none"
              stroke={activeColor}
              strokeWidth={cfg.strokeWidth}
              strokeLinecap="round"
              style={{
                filter: isDragging
                  ? `drop-shadow(0 0 4px ${activeColor}) drop-shadow(0 0 8px ${activeColor})`
                  : `drop-shadow(0 0 2.5px ${activeColor}) drop-shadow(0 0 5px ${activeColor}80)`
              }}
            />
          )}

          {/* Illuminated indicator pip / LED bead at exact knob position */}
          <circle
            cx={tipPoint.x}
            cy={tipPoint.y}
            r={cfg.pipRadius}
            fill="#ffffff"
            style={{
              filter: isDragging
                ? `drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px ${activeColor})`
                : `drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 4px ${activeColor})`
            }}
          />
        </svg>

        {/* Physical rotating knob cylinder */}
        <div
          className={`relative ${cfg.knobClass} rounded-full flex items-center justify-center knob-shadow transition-colors`}
          style={{
            background: 'radial-gradient(circle at 40% 35%, #383b42 0%, #17181c 70%, #0d0e11 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Outer grip ridges */}
          <div className="absolute inset-0.5 rounded-full border border-neutral-700/50 pointer-events-none" />

          {/* Rotating inner face with indicator line */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div
              className={`absolute top-1 ${cfg.indicatorClass} rounded-full transition-colors`}
              style={{
                backgroundColor: isDragging ? '#38bdf8' : activeColor,
                boxShadow: isDragging ? '0 0 6px #38bdf8' : `0 0 4px ${activeColor}80`
              }}
            />
          </div>

          {/* Center metallic cap */}
          <div
            className={`${cfg.capClass} rounded-full pointer-events-none`}
            style={{
              background: 'radial-gradient(circle at 35% 30%, #525760 0%, #202227 80%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
            }}
          />

          {/* Optional MIDI CC indicator badge */}
          {midiBadge && (
            <div
              className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-amber-500/90 text-black shadow-sm pointer-events-none z-10"
              title={`Controlled by MIDI ${midiBadge}`}
            >
              {midiBadge}
            </div>
          )}
        </div>
      </div>

      {/* Label and live readout with constant width */}
      <span className={`mt-1 font-semibold tracking-wider uppercase text-neutral-300 truncate text-center inline-block ${cfg.labelClass}`}>
        {label}
      </span>
      <span className={`font-mono tabular-nums text-neutral-400 group-hover:text-amber-400 transition-colors text-center truncate inline-block ${cfg.valClass}`}>
        {displayVal}
      </span>
    </div>
  );
};

