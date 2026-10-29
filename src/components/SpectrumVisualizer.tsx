import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Activity, BarChart2, Radio } from 'lucide-react';

export interface SpectrumVisualizerProps {
  isRunning?: boolean;
  isTall?: boolean;
  className?: string;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  isRunning,
  isTall = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'both' | 'fft' | 'scope'>('both');
  const modeRef = useRef<'both' | 'fft' | 'scope'>(mode);
  modeRef.current = mode;

  const [peakFreqHz, setPeakFreqHz] = useState<number>(0);
  const isTallRef = useRef<boolean>(isTall);
  isTallRef.current = isTall;

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let freqData = new Uint8Array(256);
    let timeData = new Uint8Array(256);
    let idlePhase = 0;
    let lastIdleFrameTime = 0;
    let frameCounter = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = entry.contentRect;
        const targetWidth = Math.max(300, Math.floor((rect.width || 480) * dpr));
        const targetHeight = Math.max(60, Math.floor((rect.height || (isTallRef.current ? 320 : 90)) * dpr));
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
      }
    });
    resizeObserver.observe(canvas);

    const draw = (now: number) => {
      animId = requestAnimationFrame(draw);

      const analyser = audioEngine.analyserNode;
      const currentMode = modeRef.current;
      const currentIsTall = isTallRef.current;
      const isAudioActive = Boolean(
        analyser && audioEngine.ctx && audioEngine.ctx.state === 'running'
      );

      // In idle standby mode, throttle frame rate to ~20 fps (every 50ms) to save CPU
      if (!isAudioActive) {
        if (now - lastIdleFrameTime < 50) {
          return;
        }
        lastIdleFrameTime = now;
      }

      const width = canvas.width;
      const height = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const paddingTop = (currentIsTall ? 28 : 22) * dpr;
      const paddingBottom = (currentIsTall ? 24 : 8) * dpr;
      const paddingLeft = (currentIsTall ? 36 : 14) * dpr;
      const paddingRight = (currentIsTall ? 18 : 14) * dpr;
      const plotWidth = width - paddingLeft - paddingRight;
      const plotHeight = height - paddingTop - paddingBottom;

      // Dark oscilloscope display backdrop
      ctx.fillStyle = '#0a0b0d';
      ctx.fillRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = '#16181f';
      ctx.lineWidth = 1;

      // Frequency Log Grid marks (in tall mode)
      const freqMarkers = [
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

      const minLog = Math.log10(20);
      const maxLog = Math.log10(20000);
      const logRange = maxLog - minLog;

      if (currentIsTall) {
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.floor(9 * dpr)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        freqMarkers.forEach(({ f, label }) => {
          const x = paddingLeft + ((Math.log10(f) - minLog) / logRange) * plotWidth;
          ctx.beginPath();
          ctx.moveTo(x, paddingTop);
          ctx.lineTo(x, paddingTop + plotHeight);
          ctx.stroke();
          ctx.fillText(label, x, paddingTop + plotHeight + 4 * dpr);
        });

        // dB reference lines
        const dbLines = [
          { level: 0.85, label: '-6dB' },
          { level: 0.55, label: '-18dB' },
          { level: 0.25, label: '-36dB' }
        ];
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        dbLines.forEach(({ level, label }) => {
          const y = paddingTop + plotHeight * (1 - level);
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(paddingLeft + plotWidth, y);
          ctx.stroke();
          ctx.fillText(label, paddingLeft - 4 * dpr, y);
        });
      } else {
        const gridSpacingX = Math.max(25, Math.floor(width / 16));
        for (let x = 0; x < width; x += gridSpacingX) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        const gridSpacingY = Math.max(14, Math.floor(height / 5));
        for (let y = 0; y < height; y += gridSpacingY) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      if (isAudioActive && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        if (freqData.length !== bufferLength) {
          freqData = new Uint8Array(bufferLength);
        }
        if (timeData.length !== bufferLength) {
          timeData = new Uint8Array(bufferLength);
        }

        // 1. FFT Frequency Bars
        if (currentMode === 'fft' || currentMode === 'both') {
          analyser.getByteFrequencyData(freqData);

          let maxVal = 0;
          let maxBin = 0;
          const sampleRate = audioEngine.ctx?.sampleRate || 48000;
          const nyquist = sampleRate / 2;

          // Number of visual bars across the plot
          const numBars = currentIsTall ? 64 : 48;
          const barGap = 2 * dpr;
          const barWidth = Math.max(1, (plotWidth / numBars) - barGap);

          for (let b = 0; b < numBars; b++) {
            // Map log frequency bin
            const logRatio = b / numBars;
            const centerFreq = Math.pow(10, minLog + logRatio * logRange);
            const binIdx = Math.min(bufferLength - 1, Math.max(0, Math.floor((centerFreq / nyquist) * bufferLength)));

            const val = freqData[binIdx];
            if (val > maxVal) {
              maxVal = val;
              maxBin = binIdx;
            }

            const normHeight = (val / 255);
            const barH = normHeight * plotHeight * (currentMode === 'both' ? 0.72 : 0.88);
            const x = paddingLeft + b * (barWidth + barGap);
            const y = paddingTop + plotHeight - barH;

            // Gradient hue from cyan/emerald (lows) to amber (mids) to magenta (highs)
            const hue = 180 + logRatio * 150;
            ctx.fillStyle = `hsla(${hue}, 85%, 52%, 0.75)`;
            ctx.fillRect(x, y, barWidth, barH);
          }

          // Throttle state update for peak frequency
          frameCounter++;
          if (frameCounter % 15 === 0 && maxVal > 25) {
            const calculatedPeakFreq = Math.round((maxBin / bufferLength) * nyquist);
            setPeakFreqHz(calculatedPeakFreq);
          }
        }

        // 2. Oscilloscope Time-Domain Waveform
        if (currentMode === 'scope' || currentMode === 'both') {
          analyser.getByteTimeDomainData(timeData);
          ctx.lineWidth = 2 * dpr;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4 * dpr;
          ctx.beginPath();

          const sliceWidth = plotWidth / bufferLength;
          let x = paddingLeft;
          const midY = paddingTop + plotHeight / 2;

          for (let i = 0; i < bufferLength; i++) {
            const v = (timeData[i] - 128) / 128.0;
            const y = midY + v * (plotHeight * (currentMode === 'both' ? 0.40 : 0.48));

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Standby idle phosphor baseline
        idlePhase += 0.05;
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
        ctx.shadowBlur = 3 * dpr;
        ctx.beginPath();
        const midY = paddingTop + plotHeight / 2;
        ctx.moveTo(paddingLeft, midY);
        for (let x = paddingLeft; x <= paddingLeft + plotWidth; x += 12 * dpr) {
          const y = midY + Math.sin(x * 0.02 + idlePhase) * (2 * dpr);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`relative bg-neutral-950/80 rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner flex flex-col ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider text-neutral-200 uppercase">
            <Activity
              size={13}
              className={isRunning ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}
            />
            <span>Spectrum &amp; Oscilloscope</span>
          </div>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60'
            }`}
          >
            {isRunning ? 'LIVE AUDIO' : 'STANDBY'}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur rounded-lg p-0.5 border border-neutral-800">
          <button
            onClick={() => setMode('both')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              mode === 'both' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Dual Mode: Frequency Spectrum + Oscilloscope Waveform"
          >
            DUAL
          </button>
          <button
            onClick={() => setMode('fft')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              mode === 'fft' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="FFT Mode: Real-time Frequency Spectrum Bars"
          >
            FFT
          </button>
          <button
            onClick={() => setMode('scope')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
              mode === 'scope' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Scope Mode: Time-domain Oscilloscope Waveform"
          >
            SCOPE
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative flex-1 w-full min-h-0">
        <canvas
          ref={canvasRef}
          className={`w-full ${isTall ? 'h-64 sm:h-72 md:h-80' : 'h-24 sm:h-28'} block`}
        />
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="px-3 py-1.5 border-t border-neutral-800/60 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-neutral-300">
            <span className="text-neutral-500">Peak FFT:</span>
            <span className="text-emerald-400 font-semibold">
              {isRunning && peakFreqHz > 0
                ? peakFreqHz >= 1000
                  ? `${(peakFreqHz / 1000).toFixed(2)} kHz`
                  : `${peakFreqHz} Hz`
                : '—'}
            </span>
          </div>

          <span className="hidden sm:inline w-px h-3 bg-neutral-800" />

          <div className="flex items-center gap-1 text-neutral-400 hidden sm:flex">
            <span>2048-pt FFT · Hann Window</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-500">
          <Radio size={11} className={isRunning ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'} />
          <span>48 kHz Sampling</span>
        </div>
      </div>
    </div>
  );
};
