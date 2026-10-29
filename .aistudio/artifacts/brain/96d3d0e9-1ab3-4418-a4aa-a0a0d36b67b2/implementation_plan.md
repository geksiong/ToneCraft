# Streamlined Studio Configuration & Settings Hub

Redesign and simplify ToneCraft's main Audio and Engine Settings modal into a clean, intuitive **Studio Hub** that delivers smart one-tap audio profiles and progressive disclosure for advanced DSP parameters.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections in Phase 1, the following core architecture and design decisions are confirmed for execution:

- **Confirmed Decision 1 (Unified Studio Hub)**: The main `SettingsModal` is redesigned as a unified Studio Hub with clean, quiet navigation tabs (`Audio & Input`, `DSP & Engine`, `MIDI Controller`, `Cloud Presets`), consistent typography, and a unified header showing active hardware status at a glance.
- **Confirmed Decision 2 (Smart One-Tap Presets + Expandable Pro Mode)**:
  - Technical audio configurations (noise suppression, input type, buffer latency) are packaged into intuitive, 1-tap quick profiles (e.g., *Direct Guitar High-Z*, *Studio Mic*, *Ultra-Low Latency*, *Balanced Audio*).
  - A clean **"Pro Audio Controls"** toggle cleanly hides or reveals the granular engineering controls (L/R channel routing matrices, 60Hz hum notch filters, high-pass frequencies, raw buffer samples, and ping breakdowns).
- **Confirmed Decision 3 (Scope Boundary)**: Modifications focus strictly on the main Audio and Engine Settings modal and its tabs (`SettingsModal.tsx`, `InputSettingsTab.tsx`, and `EngineSettingsTab.tsx`), avoiding disruption to the main pedalboard canvas, tuner, and cabinet controls.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a distraction-free, professional audio interface setup where musicians can select input/output hardware, trim guitar gain, suppress room noise, and configure engine performance in seconds.
- **The Problem Solved**: The current settings modal spans over 1,700 lines of code across nested sub-tabs (`all`, `routing`, `gate`, `filter`), displaying complex DSP math, raw dB curves, and unorganized technical sliders that create cognitive overload.
- **The Solution**: A minimalist, high-contrast control center that presents the essential 20% of controls musicians use 90% of the time, with deep telemetry gracefully tucked behind an expandable Pro Mode disclosure.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quick Hardware & Input Level Setup (Default View)**:
   - User opens Settings and lands on **Audio & Input**.
   - **Device & Source Card**: Clear input device dropdown (Guitar Interface, USB Mic, or built-in audio) and output monitor dropdown, with instant Bluetooth latency indicators.
   - **Smart Instrument Presets**: 3 quick profile buttons:
     - 🎸 *Electric Guitar (High-Z)*: Flat EQ, auto-conditioned input trim.
     - 🎙️ *Vocal / Mic*: Anti-rumble high pass engaged, vocal gate threshold.
     - 🎧 *Line In / Sample Riff*: Unity gain, transparent routing.
   - **Clean Level & Gain Slider**: Large, high-resolution stereo meter with live dB readout (`tabular-nums`) and a ±12dB trim slider with a quick "0.0 dB Reset" button.
   - **One-Tap Noise Suppression**:
     - 3 clean states: `Off`, `Smart Gate`, `Max Suppression`.
     - 1-tap `Auto-Learn Noise Floor` button that listens for 2 seconds and dials in the ideal threshold automatically with friendly visual countdown feedback.

2. **DSP & Engine Performance**:
   - Switches to **DSP & Engine** tab.
   - **Performance Tier Cards**:
     - ⚡ *Ultra-Low Latency* (64–128 samples, < 5ms for tight live playing).
     - ⚖️ *Balanced Studio* (256 samples, stable on all browsers and laptops).
     - 💎 *High Fidelity / NAM Neural* (high sample rate, maximum neural model accuracy).
   - **1-Click Ping Test**: Clean button to measure round-trip audio latency with a simple status badge (e.g., `4.2 ms · Pro Grade`).

3. **Expandable Pro Audio Mode (Progressive Disclosure)**:
   - A subtle toggle at the bottom of each tab: `Show Pro Controls [Switch]`.
   - When engaged, smoothly reveals:
     - In **Audio & Input**: Channel splitter/router (Left, Right, Stereo, Auto Mono), manual High-Pass cutoff frequency (20Hz–200Hz), Whine Killer 1kHz/3kHz notch filters, and raw telemetry curves.
     - In **DSP & Engine**: Worklet thread type (HD-AudioWorklet vs. Standard ScriptProcessor), explicit buffer size selector (64, 128, 256, 512, 1024), and sample rate diagnostics.

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: Minimalist dark studio hardware (clean matte dark aluminum, precise hairline dividers, zero cluttered pill capsules).
- **Color Tokens**:
  - Backdrop: `rgba(10, 12, 16, 0.85)` with `backdrop-blur-md`
  - Modal Shell: `#12151B` (`neutral-900` / deep carbon)
  - Card Surfaces: `#181C24` with hairline border `rgba(255, 255, 255, 0.07)`
  - Active Accents: Warm studio amber (`#F59E0B`) for active states; emerald (`#10B981`) for pristine audio level and connected hardware.
- **Typography & Layout**:
  - Clean typographic hierarchy using bold section headers with quiet 1-line subtext.
  - Tabular monospace numbers for all dB, Hz, and latency ms readouts.
  - Zero static pill badges; metadata presented with typographic separators (`·`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Smart Presets vs. Raw Parameter Matrix
- **Chosen Approach**: Provide high-level presets (e.g. *Direct Guitar*, *Vocal Mic*, *Ultra-Low Latency*) that configure multiple underlying parameters under the hood, while allowing individual tweaks.
- **Why**: Eliminates 80% of manual trial-and-error for players who just want their guitar to sound great with zero latency and no noise hum.
- **Alternatives Considered**: Keeping all sliders visible on screen. Discarded as it overwhelms non-audio engineers with parameters like `qFactor`, `windowSize`, and `sampleRateCompensation`.

### Decision 2: Seamless Tab Structure in Studio Hub
- **Chosen Approach**: Horizontal clean tab bar at the top of the modal with active indicator bar, eliminating nested secondary tabs (`filterSubTab` in `InputSettingsTab`).
- **Why**: Nested tabs inside tabs are a recognized UX anti-pattern that creates disorientation.
- **Alternatives Considered**: Left vertical sidebar. Discarded because horizontal tabs maintain wider horizontal canvas for stereo level meters and device selectors.

### Decision 3: Preserving Full Deep Capabilities in Pro Mode
- **Chosen Approach**: Retain all existing audio engine, channel routing, and telemetry calculations without removing functionality—simply structuring them behind the `Show Pro Controls` toggle.
- **Why**: Ensures advanced power users with multi-channel audio interfaces (e.g., Focusrite Scarlett, Universal Audio Apollo) can still route Channel 2 as guitar input and monitor in stereo without compromise.

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                      STUDIO HUB (SettingsModal)                        │
│ [Icon] Studio Settings & Hardware                  [Active: 48kHz] [✕] │
├────────────────────────────────────────────────────────────────────────┤
│ [ Audio & Input ]   [ DSP & Engine ]   [ MIDI ]   [ Cloud Presets ]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─ SMART PROFILES ─────────────────────────────────────────────────┐  │
│  │ [🎸 Electric Guitar]   [🎙️ Studio Mic]   [🎧 Line / Sample]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─ HARDWARE & LEVELS ──────────────────────────────────────────────┐  │
│  │ Input Device:  [Scarlett 2i2 USB ▾]       Gain: [-2.4 dB] [Reset]│  │
│  │ Output Device: [Built-in Output ▾]       [====|=========]        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─ SMART NOISE SUPPRESSION ────────────────────────────────────────┐  │
│  │ [Off]  [Smart Gate]  [Aggressive]   [✦ Auto-Learn Noise Floor]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─ [✓] Show Pro Audio Controls ────────────────────────────────────┐  │
│  │ (Expandable: Channel L/R Routing, High-Pass Cutoff, Hum Notch)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Refactor Plan

1. **`src/components/SettingsModal.tsx`**:
   - Modernized backdrop and modal container ($760\text{px}$ max width, smooth entrance animation).
   - Streamlined header with live audio engine status pill (`Active · 48 kHz · 5.2 ms`).
   - Clean horizontal navigation bar with icons and clear labels.
   - Centralized `isProMode` state passed down or toggled smoothly.

2. **`src/components/settings/InputSettingsTab.tsx`**:
   - Deconstruct the 1,000+ line monolith into:
     - **Quick Profile Selector** (*Direct Guitar*, *Vocal Mic*, *Line In*).
     - **Device & Level Section** (Interface picker, real-time stereo meter, trim slider).
     - **Smart Gate Section** (One-tap modes + Auto-Learn with interactive countdown).
     - **Collapsible Pro Drawer** (Channel routing L/R/Sum, High Pass filter, USB whine killer).

3. **`src/components/settings/EngineSettingsTab.tsx`**:
   - Simplify the 600 line tab into:
     - **Performance Presets** (*Ultra-Low Latency*, *Balanced Studio*, *High Fidelity*).
     - **Interactive Ping Latency Widget** with clear visual status indicator.
     - **Model Engine Mode** (*Neural NAM WASM* vs *HD-Triode Tube Sim*).
     - **Collapsible Pro Drawer** (Exact buffer sizes 64–1024, thread mode, sample rate stats).

4. **Verification**:
   - Run `compile_applet` to ensure zero TypeScript errors and maintain all audio routing interfaces.
   - Verify all audio events, gain changes, noise learning, and latency pinging execute seamlessly.
