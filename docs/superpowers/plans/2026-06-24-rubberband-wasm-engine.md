# Rubber Band WASM Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate GPL-compatible professional build that uses a Rubber Band WebAssembly engine and AudioWorklet path for higher-quality real-time time-stretching.

**Architecture:** Keep the native MIT-compatible build intact and add a separate professional build entry. The professional engine owns WebAssembly loading, decoded-audio buffering, AudioWorklet processing, and engine-status reporting while preserving the existing `<audio-speed-player engine="rubberband">` public API.

**Tech Stack:** Vanilla JavaScript Web Component, Node test runner, browser smoke tests, WebAssembly, AudioWorklet, Web Audio API, Rubber Band source/build artifacts, GPL-compatible distribution notes.

---

## Scope Check

This plan starts only after the professional audio engine foundation is merged and verified. It covers the actual Rubber Band WebAssembly integration, not the fallback shell that already exists.

## File Structure

- Create `src/pro/rubberband-engine.js`
  - Own the professional engine adapter and WebAssembly lifecycle.

- Create `src/pro/rubberband-worklet.js`
  - Own AudioWorkletProcessor registration and render-thread messaging.

- Create `dist/audio-speed-player-pro.js`
  - Browser-ready professional build that includes or loads the professional engine.

- Create `dist/audio-speed-player-pro.worklet.js`
  - Worklet script loaded by the professional build.

- Create `vendor/rubberband/README.md`
  - Document exact Rubber Band source version, source URL, license, build method, and artifact provenance.

- Modify `README.md`
  - Add professional build usage and license notes.

- Modify `tests/smoke.html` or add `tests/pro-smoke.html`
  - Verify professional build loading, fallback behavior, and status output.

---

### Task 1: Audit And Vendor Rubber Band Source

**Files:**
- Create: `vendor/rubberband/README.md`
- Create or add: `vendor/rubberband/LICENSE`

- [ ] **Step 1: Confirm source and license**

Record the exact Rubber Band source version, download URL, license page, and license text location.

- [ ] **Step 2: Write vendor README**

Add:

```markdown
# Rubber Band Vendor Notes

This directory records the Rubber Band source/build provenance for the professional
audio engine build.

## Source

- Project: Rubber Band Library
- Version: <exact version>
- Source URL: <exact source URL>
- License: GPL version 2 or later for open-source use, with commercial licensing available from the upstream project.

## Distribution

`dist/audio-speed-player-pro.js` and related WebAssembly/worklet artifacts are
GPL-compatible when they bundle or link Rubber Band code.

The default `dist/audio-speed-player.js` native build remains separate and does not
bundle Rubber Band.
```

- [ ] **Step 3: Verify**

Run:

```powershell
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 4: Commit**

```powershell
git add vendor\rubberband
git commit -m "Document Rubber Band vendor provenance"
```

---

### Task 2: Define Professional Engine Loader Boundary

**Files:**
- Create: `src/pro/rubberband-engine.js`
- Modify: `dist/audio-speed-player.js` only if a shared public hook is required.
- Test: `tests/core.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests for a professional engine factory that:

- reports `ENGINE_RUBBERBAND`;
- exposes `loadSource`, `play`, `pause`, `setRate`, `setPreservePitch`, `connectAnalyser`, and `destroy`;
- reports an unavailable state when WebAssembly or AudioWorklet support is missing.

- [ ] **Step 2: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: fail because the professional engine factory does not exist.

- [ ] **Step 3: Implement minimal factory**

Implement a small boundary that can be tested without real audio rendering:

```js
export function createRubberBandEngine(options = {}) {
  const audioContext = options.audioContext || null;
  const workletUrl = options.workletUrl || "";
  const wasmUrl = options.wasmUrl || "";

  return {
    name: "rubberband",
    unavailableReason: !audioContext ? "AudioContext unavailable" : "",
    async loadSource() {},
    async play() {},
    pause() {},
    setRate() {},
    setPreservePitch() {},
    connectAnalyser() {
      return false;
    },
    destroy() {},
    workletUrl,
    wasmUrl
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add src\pro\rubberband-engine.js tests\core.test.mjs
git commit -m "Add professional engine loader boundary"
```

---

### Task 3: Add AudioWorklet Processor Skeleton

**Files:**
- Create: `src/pro/rubberband-worklet.js`
- Create: `dist/audio-speed-player-pro.worklet.js`
- Test: browser smoke page or focused worklet load page.

- [ ] **Step 1: Write a worklet load smoke page**

Create a smoke page that attempts:

```js
const context = new AudioContext();
await context.audioWorklet.addModule("../dist/audio-speed-player-pro.worklet.js");
```

Expected before implementation: module load fails.

- [ ] **Step 2: Implement processor skeleton**

Add a processor that registers:

```js
class AudioSpeedPlayerRubberBandProcessor extends AudioWorkletProcessor {
  process() {
    return true;
  }
}

registerProcessor("audio-speed-player-rubberband", AudioSpeedPlayerRubberBandProcessor);
```

- [ ] **Step 3: Verify worklet load**

Run the smoke page in Chrome/Edge.

Expected: worklet module loads without error.

- [ ] **Step 4: Commit**

```powershell
git add src\pro\rubberband-worklet.js dist\audio-speed-player-pro.worklet.js tests
git commit -m "Add professional audio worklet skeleton"
```

---

### Task 4: Add WebAssembly Artifact Loading

**Files:**
- Modify: `src/pro/rubberband-engine.js`
- Add: `dist/rubberband.wasm` or document external artifact path.
- Test: `tests/core.test.mjs` and browser smoke.

- [ ] **Step 1: Write failing loader tests**

Test that the professional engine:

- accepts a `wasmUrl`;
- calls `WebAssembly.instantiateStreaming` when available;
- falls back to `fetch` plus `WebAssembly.instantiate` when streaming is unavailable;
- reports a clear unavailable reason when loading fails.

- [ ] **Step 2: Implement loader**

Add a single internal function:

```js
export async function loadRubberBandWasm(wasmUrl, hooks = globalThis) {
  if (!wasmUrl) throw new Error("Rubber Band WASM URL is required");
  if (hooks.WebAssembly?.instantiateStreaming && hooks.fetch) {
    return hooks.WebAssembly.instantiateStreaming(hooks.fetch(wasmUrl), {});
  }
  const response = await hooks.fetch(wasmUrl);
  const bytes = await response.arrayBuffer();
  return hooks.WebAssembly.instantiate(bytes, {});
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: pass.

- [ ] **Step 4: Browser verify**

Open professional smoke page over HTTP/HTTPS and confirm the WASM URL loads or reports a clear fallback reason.

- [ ] **Step 5: Commit**

```powershell
git add src\pro\rubberband-engine.js tests dist README.md
git commit -m "Load Rubber Band WebAssembly artifact"
```

---

### Task 5: Stream Decoded Audio Through Worklet

**Files:**
- Modify: `src/pro/rubberband-engine.js`
- Modify: `src/pro/rubberband-worklet.js`
- Modify: `dist/audio-speed-player-pro.js`
- Modify: `dist/audio-speed-player-pro.worklet.js`

- [ ] **Step 1: Define message protocol**

Use explicit messages:

```js
{ type: "load-buffer", channelData, sampleRate }
{ type: "set-rate", rate }
{ type: "set-preserve-pitch", preservePitch }
{ type: "play" }
{ type: "pause" }
{ type: "seek", seconds }
```

- [ ] **Step 2: Write tests for protocol helpers**

Unit test message creation and validation without audio rendering.

- [ ] **Step 3: Implement buffer transfer**

Decode audio with `AudioContext.decodeAudioData`, transfer channel data to the worklet, and keep native fallback if decoding fails.

- [ ] **Step 4: Implement processor playback loop**

The first pass may output unchanged audio at `1x` to prove transport before time-stretching.

- [ ] **Step 5: Verify**

Browser smoke should play a short test file at `1x` through the professional path.

- [ ] **Step 6: Commit**

```powershell
git add src\pro dist tests
git commit -m "Stream decoded audio through professional worklet"
```

---

### Task 6: Connect Rubber Band Time-Stretching

**Files:**
- Modify: `src/pro/rubberband-engine.js`
- Modify: `src/pro/rubberband-worklet.js`
- Modify: `dist/audio-speed-player-pro.js`
- Modify: `dist/audio-speed-player-pro.worklet.js`

- [ ] **Step 1: Write behavioral verification checklist**

Create a manual verification note covering:

- 0.75x drum-heavy track;
- 1x unchanged playback;
- 1.25x playback;
- pitch stability;
- dropout checks;
- CPU/latency observations.

- [ ] **Step 2: Wire Rubber Band processor**

Connect decoded frames into the Rubber Band WASM processor. Rate changes should update the time ratio without restarting playback.

- [ ] **Step 3: Verify real-time rate changes**

Run browser smoke/manual test and change the slider while playback is active.

Expected:

- no crash;
- no obvious pitch jump;
- status displays `Professional engine`;
- visualizer remains active or falls back clearly if analysis cannot connect.

- [ ] **Step 4: Commit**

```powershell
git add src\pro dist tests docs
git commit -m "Connect Rubber Band time stretching"
```

---

### Task 7: Document And Release Professional Build

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `LICENSE` or add GPL notice files as required.

- [ ] **Step 1: Document professional script usage**

Add:

```html
<script type="module" src="./dist/audio-speed-player-pro.js"></script>
<audio-speed-player src="./song.mp3" engine="rubberband"></audio-speed-player>
```

- [ ] **Step 2: Document licensing clearly**

Explain that:

- `dist/audio-speed-player.js` remains the native build;
- `dist/audio-speed-player-pro.js` is GPL-compatible when Rubber Band is bundled;
- commercial Rubber Band licensing is required for incompatible closed-source distribution.

- [ ] **Step 3: Final verification**

Run:

```powershell
npm.cmd test
git diff --check
```

Run professional browser smoke and native browser smoke.

- [ ] **Step 4: Commit**

```powershell
git add README.md package.json LICENSE docs dist tests
git commit -m "Document professional audio build"
```

