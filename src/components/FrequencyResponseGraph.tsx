import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AnyPedal, AmpModelConfig, IrCabinetConfig } from '../types/pedal';
import { InputConditionerConfig } from '../audio/inputConditioner';
import {
  calculateEndToEndFrequencyResponse,
  BodePlotData,
  FrequencyPoint
} from '../audio/frequencyResponseEngine';
import { Activity, GitCommit, Sliders, Layers, Sparkles } from 'lucide-react';

export interface FrequencyResponseGraphProps {
  pedals: AnyPedal[];
  ampModel: AmpModelConfig;
  irCabinet: IrCabinetConfig;
  conditionerConfig?: InputConditionerConfig | null;
  isRunning?: boolean;
  isTall?: boolean;
  className?: string;
}

export const FrequencyResponseGraph: React.FC<FrequencyResponseGraphProps> = ({
  pedals,
  ampModel,
  irCabinet,
  conditionerConfig,
  isRunning,
  isTall = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // View settings
  const [viewMode, setViewMode] = useState<'mag' | 'both' | 'stages'>('both');
  const [hoverPoint, setHoverPoint] = useState<FrequencyPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Compute Bode response data whenever parameters change
  const bodeData: BodePlotData = useMemo(() => {
    return calculateEndToEndFrequencyResponse(pedals, ampModel, irCabinet, conditionerConfig);
  }, [pedals, ampModel, irCabinet, conditionerConfig]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina display
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(300, Math.floor((rect.width || 480) * dpr));
    const height = Math.max(70, Math.floor((rect.height || (isTall ? 320 : 90)) * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Graph viewport coordinates with margins for labels
    const paddingLeft = isTall ? 44 * dpr : 34 * dpr;
    const paddingRight = isTall && (viewMode === 'both') ? 40 * dpr : 14 * dpr;
    const paddingTop = (isTall ? 28 : 22) * dpr;
    const paddingBottom = isTall ? 26 * dpr : 14 * dpr;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // dB range configuration
    const minDb = -32;
    const maxDb = +18;
    const dbRange = maxDb - minDb;

    // Freq range (Logarithmic)
    const minLogFreq = Math.log10(20);
    const maxLogFreq = Math.log10(20000);
    const logRange = maxLogFreq - minLogFreq;

    // Coordinate conversion helpers
    const freqToX = (freq: number) => {
      const logF = Math.log10(Math.max(20, Math.min(20000, freq)));
      return paddingLeft + ((logF - minLogFreq) / logRange) * plotWidth;
    };

    const xToFreq = (x: number) => {
      const clampedX = Math.max(paddingLeft, Math.min(paddingLeft + plotWidth, x));
      const ratio = (clampedX - paddingLeft) / plotWidth;
      return Math.pow(10, minLogFreq + ratio * logRange);
    };

    const dbToY = (db: number) => {
      const clampedDb = Math.max(minDb, Math.min(maxDb, db));
      return paddingTop + ((maxDb - clampedDb) / dbRange) * plotHeight;
    };

    const phaseToY = (deg: number) => {
      // Phase from +180 (top) to -180 (bottom)
      const clamped = Math.max(-180, Math.min(180, deg));
      return paddingTop + ((180 - clamped) / 360) * plotHeight;
    };

    // 1. Dark Backdrop
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 0, width, height);

    // 2. Frequency Grid Lines & Labels
    const gridFreqs = [
      { f: 20, label: '20' },
      { f: 50, label: '50' },
      { f: 100, label: '100' },
      { f: 250, label: '250' },
      { f: 500, label: '500' },
      { f: 1000, label: '1k' },
      { f: 2000, label: '2k' },
      { f: 5000, label: '5k' },
      { f: 10000, label: '10k' },
      { f: 20000, label: '20k' }
    ];

    ctx.strokeStyle = '#181b24';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.floor(9 * dpr)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    gridFreqs.forEach(({ f, label }) => {
      const x = freqToX(f);
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + plotHeight);
      ctx.stroke();

      if (isTall) {
        ctx.fillText(label, x, paddingTop + plotHeight + 5 * dpr);
      }
    });

    // 3. Magnitude dB Grid Lines & Labels
    const dbLines = [18, 12, 6, 0, -6, -12, -18, -24, -30];
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    dbLines.forEach((db) => {
      const y = dbToY(db);

      if (db === 0) {
        // Highlight 0 dB Unity Gain Reference Line
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#181b24';
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotWidth, y);
      ctx.stroke();

      if (isTall) {
        ctx.fillStyle = db === 0 ? '#f59e0b' : '#64748b';
        ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, paddingLeft - 5 * dpr, y);
      }
    });
    ctx.setLineDash([]);

    // 4. Phase Secondary Scale Lines & Labels (Right Axis) if in 'both' mode
    if (viewMode === 'both' && isTall) {
      const phaseLines = [180, 90, 0, -90, -180];
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a855f7';
      phaseLines.forEach((deg) => {
        const y = phaseToY(deg);
        ctx.fillText(`${deg}°`, paddingLeft + plotWidth + 6 * dpr, y);
      });
    }

    const pts = bodeData.points;
    if (pts.length < 2) return;

    // 5. Stage Breakdown Curves (if viewMode === 'stages')
    if (viewMode === 'stages') {
      // 5a. Pedals Stage (Amber)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = freqToX(p.freq);
        const y = dbToY(p.pedalsMagDb);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 5b. Amp Tone Stack Stage (Emerald)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = freqToX(p.freq);
        const y = dbToY(p.ampMagDb);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 5c. Cab & Mic Stage (Sky Blue)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([2 * dpr, 2 * dpr]);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = freqToX(p.freq);
        const y = dbToY(p.cabMagDb);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Phase Response Curve (Purple, in 'both' mode)
    if (viewMode === 'both') {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 1.8 * dpr;
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = freqToX(p.freq);
        const y = phaseToY(p.phaseDeg);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Gradient Fill under Composite Magnitude Curve
    const bottomY = paddingTop + plotHeight;
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, bottomY);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.10)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.00)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(freqToX(pts[0].freq), bottomY);
    pts.forEach((p) => {
      ctx.lineTo(freqToX(p.freq), dbToY(p.magDb));
    });
    ctx.lineTo(freqToX(pts[pts.length - 1].freq), bottomY);
    ctx.closePath();
    ctx.fill();

    // 8. Composite End-to-End Magnitude Response Curve (Electric Cyan with Glow)
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6 * dpr;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.4 * dpr;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = freqToX(p.freq);
      const y = dbToY(p.magDb);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 9. Peak Resonance Marker
    const peakFreq = bodeData.diagnostics.peakFreqHz;
    const peakPt = pts.find(p => Math.abs(p.freq - peakFreq) < 25) || pts[Math.floor(pts.length / 2)];
    if (peakPt && isTall) {
      const peakX = freqToX(peakPt.freq);
      const peakY = dbToY(peakPt.magDb);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0a0b0d';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }

    // 10. Hover Crosshair & Indicator Point
    if (hoverPos && hoverPoint) {
      const hX = freqToX(hoverPoint.freq);
      const hY = dbToY(hoverPoint.magDb);

      // Vertical guide hairline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([2 * dpr, 2 * dpr]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hX, paddingTop);
      ctx.lineTo(hX, paddingTop + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Illuminated Target Point
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(hX, hY, 4.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }
  }, [bodeData, viewMode, hoverPoint, hoverPos, isTall]);

  // Handle Mouse Hover / Move to track frequency crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const paddingLeft = (isTall ? 44 : 34);
    const paddingRight = (isTall && viewMode === 'both') ? 40 : 14;
    const plotWidth = rect.width - paddingLeft - paddingRight;

    if (mouseX < paddingLeft || mouseX > paddingLeft + plotWidth) {
      setHoverPoint(null);
      setHoverPos(null);
      return;
    }

    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const ratio = Math.max(0, Math.min(1, (mouseX - paddingLeft) / plotWidth));
    const targetFreq = Math.pow(10, minLog + ratio * (maxLog - minLog));

    // Find closest frequency point
    let closest = bodeData.points[0];
    let minDiff = Infinity;
    for (const p of bodeData.points) {
      const diff = Math.abs(p.freq - targetFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }

    setHoverPoint(closest);
    setHoverPos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
    setHoverPos(null);
  };

  const diag = bodeData.diagnostics;

  return (
    <div
      ref={containerRef}
      className={`relative bg-neutral-950/80 rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner flex flex-col ${className}`}
    >
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider text-neutral-200 uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Bode Plot · Frequency Response</span>
          </div>

          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hidden sm:inline">
            End-to-End
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur rounded-lg p-0.5 border border-neutral-800">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              viewMode === 'both' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Magnitude (dB) + Phase (deg) Dual Plot"
          >
            MAG + PHASE
          </button>
          <button
            onClick={() => setViewMode('mag')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              viewMode === 'mag' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Magnitude (dB) Only"
          >
            MAG ONLY
          </button>
          <button
            onClick={() => setViewMode('stages')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              viewMode === 'stages' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Stage Breakdown: Pedals, Amp, and Cabinet curves"
          >
            STAGES
          </button>
        </div>
      </div>

      {/* Main Plot Canvas Area */}
      <div className="relative flex-1 w-full min-h-0">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`w-full ${isTall ? 'h-64 sm:h-72 md:h-80' : 'h-24 sm:h-28'} block cursor-crosshair`}
        />

        {/* Interactive Floating Readout Badge (when hovering) */}
        {hoverPoint && (
          <div className="absolute top-2 left-3 pointer-events-none bg-neutral-900/90 backdrop-blur border border-neutral-700/80 rounded-lg px-2.5 py-1 shadow-xl flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1 text-cyan-300 font-bold">
              <span>Freq:</span>
              <span>
                {hoverPoint.freq >= 1000
                  ? `${(hoverPoint.freq / 1000).toFixed(2)} kHz`
                  : `${Math.round(hoverPoint.freq)} Hz`}
              </span>
            </div>
            <span className="w-px h-3 bg-neutral-700" />
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <span>Gain:</span>
              <span>
                {hoverPoint.magDb > 0 ? `+${hoverPoint.magDb}` : hoverPoint.magDb} dB
              </span>
            </div>
            {viewMode === 'both' && (
              <>
                <span className="w-px h-3 bg-neutral-700" />
                <div className="flex items-center gap-1 text-purple-300">
                  <span>Phase:</span>
                  <span>{hoverPoint.phaseDeg}°</span>
                </div>
              </>
            )}
            {viewMode === 'stages' && (
              <>
                <span className="w-px h-3 bg-neutral-700" />
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-amber-400">FX: {hoverPoint.pedalsMagDb}dB</span>
                  <span className="text-emerald-400">Amp: {hoverPoint.ampMagDb}dB</span>
                  <span className="text-sky-400">Cab: {hoverPoint.cabMagDb}dB</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Telemetry & Diagnostics Bar (visible in both modes, richer in tall mode) */}
      <div className="px-3 py-1.5 border-t border-neutral-800/60 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-neutral-300">
            <span className="text-neutral-500">-3dB Band:</span>
            <span className="text-cyan-400 font-semibold">
              {diag.lowCutoffHz} Hz – {diag.highCutoffHz >= 1000 ? `${(diag.highCutoffHz / 1000).toFixed(1)}k` : `${diag.highCutoffHz}`} Hz
            </span>
          </div>

          <span className="hidden sm:inline w-px h-3 bg-neutral-800" />

          <div className="flex items-center gap-1 text-neutral-300">
            <span className="text-neutral-500">Resonant Peak:</span>
            <span className="text-amber-400 font-semibold">
              {diag.peakFreqHz >= 1000 ? `${(diag.peakFreqHz / 1000).toFixed(2)} kHz` : `${diag.peakFreqHz} Hz`}{' '}
              ({diag.peakGainDb > 0 ? `+${diag.peakGainDb}` : diag.peakGainDb} dB)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'stages' ? (
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" /> Pedals
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Amp
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Cab
              </span>
            </div>
          ) : (
            <span className="text-neutral-500 text-[10px]">
              {diag.totalActiveFilters} active filter {diag.totalActiveFilters === 1 ? 'stage' : 'stages'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
