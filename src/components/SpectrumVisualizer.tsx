import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Activity, BarChart3 } from 'lucide-react';

export const SpectrumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'both' | 'fft' | 'scope'>('both');

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.analyserNode;
    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const draw = () => {
      animId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0a0b0d';
      ctx.fillRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!analyser) return;

      if (mode === 'fft' || mode === 'both') {
        analyser.getByteFrequencyData(freqData);
        const barWidth = (width / (bufferLength / 2)) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength / 2; i++) {
          const barHeight = (freqData[i] / 255) * height * (mode === 'both' ? 0.75 : 0.9);

          // Gradient color from cyan to amber to red
          const hue = 190 + (i / (bufferLength / 2)) * 140;
          ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.65)`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
          if (x > width) break;
        }
      }

      if (mode === 'scope' || mode === 'both') {
        analyser.getByteTimeDomainData(timeData);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
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
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode]);

  return (
    <div className="relative bg-neutral-950/80 rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner">
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-neutral-900/80 backdrop-blur rounded-lg p-0.5 border border-neutral-800">
        <button
          onClick={() => setMode('both')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'both' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          DUAL
        </button>
        <button
          onClick={() => setMode('fft')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'fft' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          FFT
        </button>
        <button
          onClick={() => setMode('scope')}
          className={`w-12 text-center px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
            mode === 'scope' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          SCOPE
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={90}
        className="w-full h-20 block"
      />
    </div>
  );
};
