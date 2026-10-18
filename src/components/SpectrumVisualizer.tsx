import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Activity } from 'lucide-react';

export interface SpectrumVisualizerProps {
  isRunning?: boolean;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({ isRunning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'both' | 'fft' | 'scope'>('both');
  const modeRef = useRef<'both' | 'fft' | 'scope'>(mode);
  modeRef.current = mode;

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

    // Use ResizeObserver instead of getBoundingClientRect() inside requestAnimationFrame
    // to prevent forced synchronous layout / reflow thrashing on every frame.
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = entry.contentRect;
        const targetWidth = Math.max(300, Math.floor((rect.width || 480) * dpr));
        const targetHeight = Math.max(60, Math.floor((rect.height || 90) * dpr));
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

      // Dark oscilloscope display backdrop
      ctx.fillStyle = '#0a0b0d';
      ctx.fillRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = '#16181f';
      ctx.lineWidth = 1;
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
          const barWidth = (width / (bufferLength / 2)) * 1.8;
          let x = 0;

          for (let i = 0; i < bufferLength / 2; i++) {
            const barHeight = (freqData[i] / 255) * height * (currentMode === 'both' ? 0.72 : 0.88);

            // Gradient color from cyan to amber to red
            const hue = 190 + (i / (bufferLength / 2)) * 140;
            ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.65)`;
            ctx.fillRect(x, height - barHeight, Math.max(1, barWidth - 1), barHeight);

            x += barWidth;
            if (x > width) break;
          }
        }

        // 2. Oscilloscope Time-Domain Waveform
        if (currentMode === 'scope' || currentMode === 'both') {
          analyser.getByteTimeDomainData(timeData);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4;
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Standby idle phosphor baseline
        idlePhase += 0.05;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        const midY = height / 2;
        ctx.moveTo(0, midY);
        for (let x = 0; x < width; x += 12) {
          const y = midY + Math.sin(x * 0.02 + idlePhase) * 1.2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, midY);
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
    <div className="relative bg-neutral-950/80 rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner">
      {/* Top Left: Live Status Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900/80 backdrop-blur border border-neutral-800/80 text-[10px] font-mono">
          <Activity
            size={12}
            className={isRunning ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}
          />
          <span className={isRunning ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
            {isRunning ? 'DSP ACTIVE' : 'DSP STANDBY'}
          </span>
        </div>
      </div>

      {/* Top Right: Mode Switcher */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-neutral-900/80 backdrop-blur rounded-lg p-0.5 border border-neutral-800">
        <button
          onClick={() => setMode('both')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'both' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
          title="Dual Mode: Frequency Spectrum + Oscilloscope Waveform"
        >
          DUAL
        </button>
        <button
          onClick={() => setMode('fft')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'fft' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
          title="FFT Mode: Real-time Frequency Spectrum Bars"
        >
          FFT
        </button>
        <button
          onClick={() => setMode('scope')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'scope' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
          title="Scope Mode: Time-domain Oscilloscope Waveform"
        >
          SCOPE
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={70}
        className="w-full h-14 block"
      />
    </div>
  );
};
