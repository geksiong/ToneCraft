# ToneCraft Studio UX Redesign & Streamlined Signal Chain

Transform ToneCraft DSP from a dense, multi-tiered cockpit into a sleek, minimalist modern audio workstation that preserves every pro feature while eliminating visual clutter.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections in Phase 1, the following core architecture and design decisions are confirmed for execution:

- **Confirmed Decision 1 (Chain Viewports)**: Tabbed workspace switching cleanly between **Pedalboard**, **Amp & Cab**, and **Looper**, eliminating vertical scrolling fatigue and cognitive overload while keeping signal routing live and seamless in the background.
- **Confirmed Decision 2 (Header Consolidation)**: Unified slim 44px top bar consolidating the previous dual-row header and the secondary `SignalChainControlStack`. Quick preset picker, master power, live tuner chip, and master volume remain front and center, while detailed I/O routing and engine telemetry slide gracefully into a Quick Audio Drawer.
- **Confirmed Decision 3 (Visual Identity)**: Sleek modern dark studio aesthetic (deep carbon/slate `#0d0f12`, precision hairline borders `#1e232b`, warm amber/gold accents for active pedal states, emerald for pristine audio signal, and tabular monospace numerals for accurate dB and latency tracking).

---

## 1. Overview & Core Concept

- **What It Does**: ToneCraft is a web-based guitar workstation featuring Neural Amp Modeler (NAM), impulse response (IR) cabinet simulation, modular stompbox pedalboard, tape-style looper, chromatic tuner, and real-time audio routing.
- **The Problem Solved**: Currently, three stacked toolbars (Dual Header + SignalChainControlStack) take up over 260px of vertical space before any instrument controls appear. Furthermore, rendering the pedalboard, 12+ amp knobs, dual-IR mixer, and multi-track looper simultaneously produces severe visual clutter and scrolling friction.
- **The Solution**: A unified professional single-strip top bar, a dedicated signal chain tab navigator with active badges, and dedicated full-focus workspaces for each stage of the rig.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quick Play & Preset Selection**:
   - The user opens ToneCraft and sees a clean 48px top bar with the wordmark, the current preset dropdown (`Clean Funk Studio`, `British Crunch`, etc.), preset step buttons (`<` and `>`), and the master Power toggle.
   - Click **Power**: Audio turns on with a warm status ring, and the chosen riff/mic immediately plays.
   - Master volume and mute sit compactly on the right of the header with a mini stereo LED meter.

2. **Tabbed Signal Chain Navigation**:
   - Centered right beneath the header is an elegant tab selector:
     - `Pedalboard` (showing active pedal count dot, e.g., `4 active`)
     - `Amp & Cab` (showing active NAM or Triode model name)
     - `Looper` (showing state indicator: `Idle`, `Recording`, or `Looping`)
     - `Spectrum & Diagnostics` (optional full-width real-time analyzer)
   - Switching tabs keeps the audio engine running continuously with zero dropouts.

3. **Slide-Out Quick Audio Drawer (I/O & Hardware)**:
   - Clicking the compact `I/O & Engine` button in the top bar slides out a sleek, non-intrusive drawer on the right.
   - Houses microphone/riff selection, input gain slider with 0.0 dB reset, noise gate threshold, buffer/latency ping, and MIDI hardware status without polluting the main creative canvas.

4. **Integrated Quick-Access Tuner**:
   - A chromatic tuner pill in the top bar indicates detected note (e.g., `E2 +2¢`). Clicking it opens the full chromatic tuner modal for precision tuning without obscuring primary controls.

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: High-end modern audio studio (inspired by Universal Audio, Quad Cortex, and Ableton Live dark mode).
- **Color Palette**:
  - Background Canvas: Carbon Slate (`#0B0D10` / `neutral-950`)
  - Elevated Surfaces & Pedal Chassis: Matte Anthracite (`#14171D` / `neutral-900`)
  - Hairline Borders: Precision Studio Gray (`#222731` / `neutral-800`)
  - Primary Active Accent: Warm Gold / Amber (`#F59E0B` to `#D97706`)
  - Clean Signal / Nominal State: Emerald Studio Green (`#10B981`)
  - NAM Neural / Engine Status: Precision Sky Blue (`#38BDF8`)
- **Typography**:
  - Primary UI & Tabs: Modern geometric sans with medium tracking (`Plus Jakarta Sans` / clean system font).
  - Telemetry & Measurements: Strict monospace with tabular figures (`font-mono tabular-nums`) for dB levels, cents, BPM, and latency.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Tabbed Viewports vs. Long Multi-Accordion Scroll
- **Chosen Approach**: Three primary tabs (**Pedalboard**, **Amp & Cab**, **Looper**) with a compact unified top strip.
- **Why**: Eliminates 800+ pixels of vertical scroll and prevents knob fatigue. When dialing in pedal parameters, the guitarist wants clear spatial focus; when sculpting an amp tone, the cab and mic placement deserve full attention.
- **Alternatives Considered**: Collapsible accordions (current implementation). While flexible, they created an unruly, jumpy layout with multiple independent scrollbars and visual fragmentation.

### Decision 2: Consolidating Top Bars into a Unified 48px Strip
- **Chosen Approach**: Merge `Header.tsx` (dual row) and `SignalChainControlStack.tsx` into one streamlined header with a dedicated slide-out drawer for deep audio routing.
- **Why**: Recovers over 180px of prime viewport real estate. Essential performance actions (Preset switch, Engine Power, Volume, Tuner note, Tab switch) remain 1 click away.
- **Alternatives Considered**: Keeping a floating footer dock. Discarded because footers conflict with pedal footswitch clicks and screen borders on laptops.

### Decision 3: Quick Audio Drawer vs. Multi-Tab Settings Modal
- **Chosen Approach**: Keep the full `SettingsModal` for deep configuration (MIDI mapping tables, cloud presets), but introduce a quick slide-out drawer for fast rehearsal adjustments (input gain, input device switch, noise gate toggle).
- **Why**: Allows instant adjustment of input levels and test riffs while observing pedal reaction in real time, without blocking the entire screen with a modal backdrop.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED TOP BAR (48px)                          │
│ [Brand] [Preset Picker ◄ ►] [Tuner Mini-Pill] [BPM] ─── [Vol/Mute] [Power] [I/O Drawer] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │   VIEWPORT TAB BAR     │      │   QUICK AUDIO DRAWER    │
       │ [Pedals] [Amp/Cab] [Looper]   │ (Input src, Gain, Gate, │
       └────────────┬───────────┘      │  Latency, MIDI pill)    │
                    │                  └─────────────────────────┘
        ┌───────────┼───────────┐
        ▼           ▼           ▼
 ┌───────────┐┌───────────┐┌───────────┐
 │Pedalboard ││ Amp & Cab ││  Looper   │
 │Drag/Drop  ││ NAM / IR  ││ Multi-Dub │
 │Stompboxes ││ Tone Stack││ Waveform  │
 └───────────┘└───────────┘└───────────┘
```

### Component & State Mapping

- `App.tsx`:
  - Retains master audio engine lifecycle, Web Audio graph, preset loading, and MIDI bindings.
  - Replaces the multi-bar stack with `UnifiedHeader` and an active viewport state: `'pedalboard' | 'amp-cab' | 'looper'`.
  - Manages `isQuickDrawerOpen` boolean for instant slide-out access to input gain, noise gate, and device routing.
- `src/components/UnifiedHeader.tsx` (New & Streamlined):
  - 1-row responsive bar adhering to the Top Bar Contract.
  - Houses Brand, Preset navigator, quick Tuner indicator, Master Volume / Mute, and Master Engine Power.
  - Replaces both legacy dual-row header and `SignalChainControlStack`.
- `src/components/QuickAudioDrawer.tsx` (New):
  - Slide-over panel containing: Input device selector, Riff player, Unity Gain slider, Noise Floor learner, and Latency status.
- `src/components/AmpCabSection.tsx` & `Pedalboard.tsx` & `LooperPedal.tsx`:
  - Refactored with refined studio card styling, removing duplicate collapse widgets and harmonizing knob paddings.
