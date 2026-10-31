import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  User,
  Mail,
  Cpu,
  Sliders,
  Layers,
  Zap,
  Activity,
  Headphones,
  Disc3,
  HelpCircle,
  Radio,
  CheckCircle2,
  ExternalLink,
  Flame,
  Music,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Volume2,
  Waves,
  AlertCircle
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tone-guide' | 'quickstart' | 'pickups' | 'recipes' | 'about-author';
}

type TabKey = 'tone-guide' | 'pickups' | 'recipes' | 'quickstart' | 'about-author';

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'tone-guide'
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Sync tab if initialTab changes when opening
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ToneCraft — About &amp; Tone Guide
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                  By Gek Siong
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                A Web Audio exploration of real-time guitar effects in the browser, plus tips on tone and pedal chaining
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800 shrink-0"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-4 sm:px-6 bg-neutral-900/95 border-b border-neutral-800/80 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 select-none py-2">
          <button
            onClick={() => setActiveTab('tone-guide')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              activeTab === 'tone-guide'
                ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Layers size={15} className={activeTab === 'tone-guide' ? 'text-amber-400' : 'text-neutral-400'} />
            <span>Pedal Chaining &amp; Signal Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('pickups')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              activeTab === 'pickups'
                ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Zap size={15} className={activeTab === 'pickups' ? 'text-amber-400' : 'text-neutral-400'} />
            <span>Pickups &amp; Gain Staging</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Flame size={15} className={activeTab === 'recipes' ? 'text-amber-400' : 'text-neutral-400'} />
            <span>Tone Recipes Cheatsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('quickstart')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              activeTab === 'quickstart'
                ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <HelpCircle size={15} className={activeTab === 'quickstart' ? 'text-amber-400' : 'text-neutral-400'} />
            <span>App Help &amp; Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('about-author')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              activeTab === 'about-author'
                ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <User size={15} className={activeTab === 'about-author' ? 'text-amber-400' : 'text-neutral-400'} />
            <span>About App &amp; Author</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-neutral-300 text-sm leading-relaxed">
          
          {/* ========================================================================= */}
          {/* TAB 1: PEDAL CHAINING & SIGNAL FLOW                                       */}
          {/* ========================================================================= */}
          {activeTab === 'tone-guide' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-start gap-3">
                  <Layers size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-white">How Pedal Order Shapes Your Sound</h3>
                    <p className="text-xs text-neutral-300 mt-1">
                      Every effect pedal processes the output of whatever comes before it. Changing the sequence in your chain changes how pedals distort, filter, and track note dynamics. Here is the conventional order most guitarists follow, along with why it works.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Chain Flowchart */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                  Standard Signal Flow (Left ➔ Right)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs font-mono font-semibold">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-blue-500/40 text-blue-300">
                    <span className="block text-[10px] text-neutral-400">1. INPUT</span>
                    Pitch &amp; Wah
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-emerald-500/40 text-emerald-300">
                    <span className="block text-[10px] text-neutral-400">2. DYNAMICS</span>
                    Compressor
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-amber-500/40 text-amber-300">
                    <span className="block text-[10px] text-neutral-400">3. GAIN</span>
                    OD &amp; Distortion
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-rose-500/40 text-rose-300">
                    <span className="block text-[10px] text-neutral-400">4. PREAMP</span>
                    Amp Head / NAM
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-purple-500/40 text-purple-300">
                    <span className="block text-[10px] text-neutral-400">5. FX LOOP</span>
                    Mod &amp; Delay
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-sky-500/40 text-sky-300">
                    <span className="block text-[10px] text-neutral-400">6. OUTPUT</span>
                    Reverb &amp; Cab IR
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <h4 className="font-bold text-white">Filters, Pitch &amp; Tuners First</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Pitch shifters, octavers, harmonizers, and wah pedals work best when receiving a clean string signal. Placing distortion or fuzz before them generates complex harmonic overtones that can confuse pitch detection algorithms.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Tip:</strong> Keep the Chromatic Tuner and Pitch Shifter at the very beginning of your chain for reliable tracking.
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                    <h4 className="font-bold text-white">Compressors Before Drive</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Placing a compressor before your overdrive or amp helps even out pick attack dynamics and feeds a more consistent level into the drive stage. If placed after overdrive, it will compress already-saturated signals and raise unwanted noise.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Tip:</strong> For funk rhythms or country chicken-pickin', set compression with a faster attack to tighten dynamics.
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
                    <h4 className="font-bold text-white">Gain Staging: Boost ➔ Overdrive ➔ Distortion</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Generally, arrange dirt pedals from lowest to highest gain. Running an overdrive with low gain and high level into a distortion pedal or dirty amp acts as a mid boost that tightens loose bass frequencies.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Fuzz Note:</strong> Vintage-style germanium fuzzes often react directly to guitar volume pot impedance and sound best placed directly after the guitar.
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs flex items-center justify-center font-bold">4</span>
                    <h4 className="font-bold text-white">Modulation: Pre vs. Post Gain</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Modulation effects like Chorus, Flanger, and Phaser behave differently depending on where they sit:
                  </p>
                  <ul className="text-xs text-neutral-400 mt-1 space-y-1 list-disc list-inside">
                    <li><strong>Before Amp (Pre-Gain):</strong> Creates a vintage, chewy 70s rock swoosh where the flanger/phaser gets saturated by the distortion.</li>
                    <li><strong>After Amp / FX Loop:</strong> Yields a clean, wider, more defined studio sweep.</li>
                  </ul>
                </div>

                {/* Stage 5 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">5</span>
                    <h4 className="font-bold text-white">Time &amp; Ambient: Delay into Reverb</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Running delay into reverb allows each rhythmic echo to be surrounded by ambient space. If you run reverb into delay, each delay repetition echoes a muddy wash of reverberated sound.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Experiment:</strong> Placing a 100% wet reverb before a fuzz pedal produces the distinct wall-of-sound shoe-gaze effect.
                  </div>
                </div>

                {/* Stage 6 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-xs flex items-center justify-center font-bold">6</span>
                    <h4 className="font-bold text-white">Cabinet IR Convolver</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    A raw guitar preamp or distortion pedal plugged directly into full-range speakers sounds harsh and fizzy. Speaker cabinet Impulse Responses (IRs) roll off high frequencies and reproduce the acoustic resonant curve of real guitar speakers and microphones.
                  </p>
                </div>

                {/* Stage 7 */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-cyan-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">7</span>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span>Vocal &amp; Voice Signal Chain</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">NEW</span>
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    For studio vocals or voiceover processing, place <strong>Vocal De-Esser</strong> first to tame harsh sibilance, followed by <strong>AutoTune Vocal Snapper</strong> for scale-quantized pitch correction, then <strong>Studio Vocal Doubler</strong> for stereophonic width, and finish with <strong>Celestial Reverb</strong>. Bypass guitar amp and cab models when processing direct vocal microphone inputs.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-cyan-300/80 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Pro Tip:</strong> Test immediately using the built-in <em>Studio Lead Vocal Acapella</em> or <em>Broadcast Voiceover</em> audio tracks in the top input selector!
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PICKUPS & GAIN STAGING                                             */}
          {/* ========================================================================= */}
          {activeTab === 'pickups' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap size={18} className="text-amber-400" />
                  Adapting Your Settings to Different Guitar Pickups
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Pickups vary in output level, frequency balance, and impedance. Here are basic guidelines on how different pickups interact with digital gain stages and amp models.
                </p>
              </div>

              {/* Pickup Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Single-Coil */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">Single-Coil (Strat / Tele)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      5.5kΩ – 6.8kΩ
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-neutral-300">
                    <li><strong>Sound:</strong> Clear highs, snappy pick attack, bell chime, and scooped mids.</li>
                    <li><strong>Caveat:</strong> Naturally picks up 50Hz/60Hz mains hum and electromagnetic interference from monitors and computers.</li>
                    <li><strong>Advice:</strong> Enable the ToneCraft Noise Gate to clamp idle hum between notes. Use an overdrive with a slight mid boost (like a Tube Screamer) to balance the thin midrange.</li>
                  </ul>
                </div>

                {/* Humbuckers */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">Humbuckers (PAF / High-Output)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      7.8kΩ – 16.5kΩ
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-neutral-300">
                    <li><strong>Sound:</strong> Warm, rounded treble, pronounced midrange, and natural hum cancellation.</li>
                    <li><strong>Caveat:</strong> Higher output can push the bass into flubby distortion with high-gain amp models.</li>
                    <li><strong>Advice:</strong> Cut low bass frequencies before high-gain stages. Rolling your guitar volume pot down from 10 to 7–8 is a simple way to clean up the tone dynamically.</li>
                  </ul>
                </div>

                {/* P-90s */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">P-90 Pickups (Soapbar)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      7.5kΩ – 9.0kΩ
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-neutral-300">
                    <li><strong>Sound:</strong> Fatter and punchier than standard single-coils, with gritty midrange bite.</li>
                    <li><strong>Advice:</strong> Great for edge-of-breakup clean tones and classic rock rhythms. Keep the noise gate on since P-90s are still single-coil designs that pick up hum.</li>
                  </ul>
                </div>

                {/* Active Pickups */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">Active Pickups (EMG / Fishman)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Battery Powered Low-Z
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-neutral-300">
                    <li><strong>Sound:</strong> Very quiet, tight bass, consistent output level, fast pick response.</li>
                    <li><strong>Caveat:</strong> Because the output signal is hot, it can easily clip the input of your audio interface or digital audio converter.</li>
                    <li><strong>Advice:</strong> Check the Input Gain meter in ToneCraft. If the meter peaks near the red 0dB line, turn down the input slider to leave adequate headroom.</li>
                  </ul>
                </div>

                {/* Bass Pickups */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">Electric Bass (P-Bass vs. J-Bass)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      Low Frequency Basics
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    Precision split-coils deliver a punchy, mid-focused thump that sits comfortably with kick drums. Jazz Bass dual single-coils offer a brighter, scooped slap tone.
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    💡 <strong>Bass Tip:</strong> Put a compressor first with moderate ratio (3:1 to 4:1) to catch string pop spikes. Pair with a bass cabinet IR (like a 4x10 or 8x10) to keep the bottom end articulate.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TONE RECIPES CHEATSHEET                                            */}
          {/* ========================================================================= */}
          {activeTab === 'recipes' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame size={18} className="text-amber-400" />
                  Sample Tone Starting Points
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Here are practical starting point settings for common guitar genres. Use these as baselines and adjust to match your guitar and playing style.
                </p>
              </div>

              <div className="space-y-4">
                
                {/* Recipe 1: Blues Breakup */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚡</span> Blues Edge-of-Breakup
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Neck Pickup
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-3">
                    Light overdrive that cleans up when you pick softly, with a touch of spring reverb.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-amber-300 block">1. Tube Screamer OD</strong>
                      Drive: 2.5 · Level: 7.5 · Tone: 6.0
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-emerald-300 block">2. Clean Combo Amp</strong>
                      Gain: 5.5 · Treble: 6 · Bass: 4.5
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-sky-300 block">3. 1x12 Speaker Cab</strong>
                      Reverb Mix: 25% · Decay: 2.2s
                    </div>
                  </div>
                </div>

                {/* Recipe 2: Singing Lead */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>🌌</span> Singing Solo / Ambient Lead
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Bridge Pickup
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-3">
                    Sustained fuzz or distortion paired with subtle delay repeats and chorus width.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-emerald-300 block">1. Compressor</strong>
                      Sustain: 6.5 · Attack: Med
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-amber-300 block">2. Muff Fuzz</strong>
                      Sustain: 7.0 · Tone: 5.0
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-purple-300 block">3. Chorus</strong>
                      Rate: 1.0Hz · Depth: 35%
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-sky-300 block">4. Delay</strong>
                      Time: 420ms · Feedback: 35%
                    </div>
                  </div>
                </div>

                {/* Recipe 3: Tight Metal */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>🔥</span> Tight Heavy Rock / Metal
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Bridge Humbucker
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-3">
                    Fast noise gate clamping for rhythmic palm mutes, with an overdrive boosting the front of the amp.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-rose-400 block">1. Noise Gate</strong>
                      Threshold: -50dB · Fast Clamp
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-amber-300 block">2. OD Boost</strong>
                      Drive: 0.5 · Level: 8.5 · Tone: 7.0
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-sky-300 block">3. High Gain Model + 4x12</strong>
                      Gain: 6.0 · V30 Cab IR
                    </div>
                  </div>
                </div>

                {/* Recipe 4: Ambient Swirl */}
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>☁️</span> Ambient / Dream Pop
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Middle Pickup
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-3">
                    Modulated repeats with washed reverb decays for atmospheric chords.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-blue-300 block">1. Clean Preamp</strong>
                      Gain: 3.5 · Treble: 6.0 · Bass: 5.0
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-purple-300 block">2. Tape Delay</strong>
                      Flutter: 25% · Repeats: 50%
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <strong className="text-sky-300 block">3. Plate Reverb</strong>
                      Mix: 50% · Decay: 3.8s
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: APP HELP & SETUP                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HelpCircle size={18} className="text-amber-400" />
                  Getting Started &amp; Hardware Tips
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  How to get your guitar connected, configure your audio device, and manage buffer latency.
                </p>
              </div>

              {/* Hardware Performance Warning */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-neutral-300 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">Host Machine Performance Notice:</strong>
                  Real-time audio processing in a browser runs continuously on your computer's CPU. If you experience crackling or audio dropouts, open <strong>Settings ➔ DSP Engine</strong> and select a slightly higher buffer setting or switch from the WASM NAM model to the lighter Waveshaper model.
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Select Your Input Source</h4>
                    <p className="text-xs text-neutral-300">
                      Use the <strong>INPUT</strong> dropdown in the top bar:
                    </p>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      <li><strong>Audio Interface:</strong> Connect your guitar to a USB audio interface with the channel switch set to <em>Instrument / Hi-Z</em>. ToneCraft automatically routes single-channel mono inputs to both stereo channels.</li>
                      <li><strong>Sample Riffs:</strong> Don't have a guitar plugged in? Pick from the included clean, edge-of-breakup, or rock riffs to test the pedals and hear how settings change the sound.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Power On the DSP Engine</h4>
                    <p className="text-xs text-neutral-300">
                      Click the <strong>DSP POWER</strong> toggle switch in the upper right. Browsers require an explicit user gesture to activate the Web Audio hardware context. When active, the jewel LED lights green.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Headphones &amp; Audio Latency</h4>
                    <p className="text-xs text-neutral-300">
                      For acceptable playing feel:
                    </p>
                    <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                      <li><strong>Use Wired Headphones or Speakers:</strong> Bluetooth wireless headphones add 150ms to 250ms of transmission delay due to Bluetooth compression codecs. This makes live playing feel disconnected. Always use a wired connection.</li>
                      <li><strong>Input Gain:</strong> Set your interface volume so the input meter stays around -12dBFS without hitting the red 0dB peak indicator.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">4</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Adding &amp; Reordering Pedals</h4>
                    <p className="text-xs text-neutral-300">
                      Click <strong>+ Add Pedal</strong> to add stompboxes to your board. Drag any pedal left or right to reorder the signal path. You can toggle each pedal's footswitch on or off and adjust knob values in real time.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">5</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Tuner, Looper &amp; MIDI Mapping</h4>
                    <p className="text-xs text-neutral-300">
                      Use the <strong>Tuner</strong> button on the control bar for chromatic pitch calibration. The <strong>Tape Looper</strong> at the bottom allows recording layers, half-speed, and reverse playback. If you have a USB MIDI foot controller, click <strong>Settings ➔ MIDI</strong> to map footswitches to bypass pedals or switch presets.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-mono font-bold flex items-center justify-center shrink-0">6</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Backing Track Machine &amp; Band Jam</h4>
                    <p className="text-xs text-neutral-300">
                      Switch to the <strong>Backing Band</strong> tab or click the header button to jam along with a 4-piece synthesized band (Percussion, Bass, Rhythm Guitar/Keys, Synth Pad). Customize chord progressions with one-click editing, transpose to any key, select from Rock, Blues, Funk, Jazz, Metal, Bossa Nova, and Reggae grooves, and adjust individual instrument volumes, mute, or solo.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ABOUT APP & AUTHOR                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'about-author' && (
            <div className="space-y-6">
              
              {/* Author Showcase Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                    <User size={26} className="text-amber-400" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        Gek Siong
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                        Project Author
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                      <Mail size={12} className="text-neutral-400" />
                      <a href="mailto:geksiong@gmail.com" className="text-amber-400/90 hover:underline">
                        geksiong@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-300 leading-relaxed space-y-3">
                  <p>
                    ToneCraft was built by <strong>Gek Siong</strong> as an experimental project to explore the feasibility of real-time guitar effects processing and amp modeling directly inside a standard web browser.
                  </p>
                  <p>
                    The goal of this project is to see how far the Web Audio API, AudioWorklets, and WebAssembly can be pushed for low-latency instrument processing without needing desktop DAW installations.
                  </p>
                </div>
              </div>

              {/* Host Machine Realities Notice */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertCircle size={15} />
                  <span>Important Note on Performance &amp; Latency</span>
                </div>
                <p className="text-xs text-neutral-300 leading-normal">
                  Because all signal processing occurs in real time within your browser, performance is directly dependent on your host machine's hardware specifications:
                </p>
                <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                  <li><strong>CPU Single-Core Clock:</strong> Audio worklets render on a dedicated thread in real time. Slower or heavily-throttled laptop CPUs may experience buffer underruns (audio crackle).</li>
                  <li><strong>Audio Interface &amp; Drivers:</strong> Using a dedicated USB audio interface with native low-latency drivers will yield vastly better results than generic motherboard sound chips.</li>
                  <li><strong>Engine Modes:</strong> If your machine struggles with the Neural Amp Modeler (WASM), switch the amp engine mode to <em>Waveshaper</em> in the Amp section for lighter CPU consumption.</li>
                </ul>
              </div>

              {/* Open Source Attribution & Libraries */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Open Source Libraries &amp; Technology Credits
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-200 font-bold mb-1">
                      <Cpu size={14} className="text-amber-400" />
                      <span>Neural Amp Modeler (NAM)</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-normal">
                      Created by <strong>Steven Atkinson</strong>. An open-source deep-learning project that models guitar amplifiers and pedals via neural network inference.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-200 font-bold mb-1">
                      <Activity size={14} className="text-sky-400" />
                      <span>neural-amp-modeler-wasm / Tone3000</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-normal">
                      Open-source WebAssembly bindings that compile NAM model execution into a browser-compatible AudioWorklet. ToneCraft integrates this library to load and evaluate .nam profile files.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-200 font-bold mb-1">
                      <Waves size={14} className="text-emerald-400" />
                      <span>Web Audio API &amp; ConvolverNode</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-normal">
                      Standard browser audio nodes used for cabinet impulse response convolution (loading standard 48kHz WAV IR files) and digital effects processing.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-200 font-bold mb-1">
                      <Radio size={14} className="text-purple-400" />
                      <span>Web MIDI API</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-normal">
                      Standard browser interface used for connecting external hardware MIDI foot-switches and pedalboards for bypass control and preset navigation.
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer Note */}
              <div className="p-3.5 rounded-xl bg-neutral-900/30 border border-neutral-800/80 text-[11px] text-neutral-400">
                <p>
                  ToneCraft by Gek Siong (<a href="mailto:geksiong@gmail.com" className="text-amber-400/90 hover:underline">geksiong@gmail.com</a>). Built as an open experiment in browser-based music technology.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
            <span>ToneCraft</span>
            <span>·</span>
            <span className="text-neutral-300">By Gek Siong (geksiong@gmail.com)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'about-author' ? 'tone-guide' : 'about-author')}
              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-medium"
            >
              {activeTab === 'about-author' ? 'View Pedal Chaining Guide' : 'About Project & Author'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors text-xs border border-neutral-700"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
