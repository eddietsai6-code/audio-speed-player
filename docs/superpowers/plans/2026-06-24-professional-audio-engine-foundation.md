# Professional Audio Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the engine-selection foundation for `audio-speed-player`, including `engine="native"` and `engine="rubberband"` parsing, a testable native engine wrapper, visible professional-engine fallback status, and documentation.

**Architecture:** Keep the current single-file Web Component distribution while introducing a small internal engine boundary. The current browser playback behavior becomes `NativeAudioEngine`; requested `rubberband` mode falls back to native with an explicit status until the separate Rubber Band WebAssembly build is implemented.

**Tech Stack:** Vanilla JavaScript Web Component, Node built-in test runner, HTML smoke test, native `HTMLAudioElement`, future WebAssembly and AudioWorklet integration.

---

## Scope Check

The approved spec includes two separable subsystems:

- Engine architecture and fallback shell.
- Real Rubber Band WebAssembly plus AudioWorklet streaming.

This plan covers the first subsystem. It produces working, testable software and prepares the public API for professional mode without bundling GPL code yet. The real Rubber Band WebAssembly integration should use a second plan after this foundation lands.

## File Structure

- Modify `dist/audio-speed-player.js`
  - Add engine constants and parsing helpers.
  - Add `NativeAudioEngine`.
  - Add `engine` attribute handling.
  - Add engine status text to the existing UI.
  - Route source, rate, and pitch updates through the active engine where practical.

- Modify `tests/core.test.mjs`
  - Add unit tests for engine parsing.
  - Add unit tests for `NativeAudioEngine` without a browser DOM.

- Modify `tests/smoke.html`
  - Keep current native rendering smoke checks.
  - Add a second player using `engine="rubberband"` and verify it falls back visibly.

- Modify `README.md`
  - Document `engine`.
  - Explain that the normal build remains native and MIT-compatible.
  - Explain that the professional build is planned as a separate GPL-compatible build when Rubber Band is bundled.

---

### Task 1: Add Engine Parsing Helpers

**Files:**
- Modify: `dist/audio-speed-player.js`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write the failing unit test**

Update the import in `tests/core.test.mjs`:

```js
import {
  buildPresetRates,
  clampRate,
  defineAudioSpeedPlayer,
  ENGINE_NATIVE,
  ENGINE_RUBBERBAND,
  formatRate,
  normalizeEngineName,
  parseBooleanAttribute,
  parseRateAttribute
} from "../dist/audio-speed-player.js";
```

Add this test after the existing boolean attribute test:

```js
test("normalizeEngineName accepts native and rubberband engines only", () => {
  assert.equal(normalizeEngineName(null), ENGINE_NATIVE);
  assert.equal(normalizeEngineName(""), ENGINE_NATIVE);
  assert.equal(normalizeEngineName("native"), ENGINE_NATIVE);
  assert.equal(normalizeEngineName(" Native "), ENGINE_NATIVE);
  assert.equal(normalizeEngineName("rubberband"), ENGINE_RUBBERBAND);
  assert.equal(normalizeEngineName("RUBBERBAND"), ENGINE_RUBBERBAND);
  assert.equal(normalizeEngineName("unknown"), ENGINE_NATIVE);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd test
```

Expected: FAIL because `ENGINE_NATIVE`, `ENGINE_RUBBERBAND`, or `normalizeEngineName` is not exported from `dist/audio-speed-player.js`.

- [ ] **Step 3: Implement the minimal helper code**

In `dist/audio-speed-player.js`, add these exports after `DEFAULT_TAG_NAME`:

```js
export const ENGINE_NATIVE = "native";
export const ENGINE_RUBBERBAND = "rubberband";

const SUPPORTED_ENGINES = new Set([ENGINE_NATIVE, ENGINE_RUBBERBAND]);
```

Add this function after `parseBooleanAttribute`:

```js
export function normalizeEngineName(value, fallback = ENGINE_NATIVE) {
  const normalized = String(value || "").trim().toLowerCase();
  if (SUPPORTED_ENGINES.has(normalized)) return normalized;
  return fallback;
}
```

- [ ] **Step 4: Run tests to verify the helper passes**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```powershell
git add dist\audio-speed-player.js tests\core.test.mjs
git commit -m "Add audio engine parsing helpers"
```

---

### Task 2: Add A Testable Native Audio Engine

**Files:**
- Modify: `dist/audio-speed-player.js`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write the failing NativeAudioEngine tests**

Update the import in `tests/core.test.mjs`:

```js
import {
  buildPresetRates,
  clampRate,
  defineAudioSpeedPlayer,
  ENGINE_NATIVE,
  ENGINE_RUBBERBAND,
  formatRate,
  NativeAudioEngine,
  normalizeEngineName,
  parseBooleanAttribute,
  parseRateAttribute
} from "../dist/audio-speed-player.js";
```

Add this helper above the tests:

```js
function createFakeAudio() {
  return {
    defaultPlaybackRate: 1,
    playbackRate: 1,
    preservesPitch: true,
    mozPreservesPitch: true,
    webkitPreservesPitch: true,
    src: "",
    loadCalls: 0,
    playCalls: 0,
    pauseCalls: 0,
    load() {
      this.loadCalls += 1;
    },
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
    pause() {
      this.pauseCalls += 1;
    }
  };
}
```

Add these tests after the engine parsing test:

```js
test("NativeAudioEngine applies rate and pitch mode to an audio element", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  engine.setRate(0.75);
  engine.setPreservePitch(false);

  assert.equal(audio.defaultPlaybackRate, 0.75);
  assert.equal(audio.playbackRate, 0.75);
  assert.equal(audio.preservesPitch, false);
  assert.equal(audio.mozPreservesPitch, false);
  assert.equal(audio.webkitPreservesPitch, false);
});
```

```js
test("NativeAudioEngine loads sources and keeps playback controls delegated", async () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  assert.equal(engine.loadSource("./lesson.mp3"), "./lesson.mp3");
  await engine.play();
  engine.pause();

  assert.equal(audio.src, "./lesson.mp3");
  assert.equal(audio.loadCalls, 1);
  assert.equal(audio.playCalls, 1);
  assert.equal(audio.pauseCalls, 1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
npm.cmd test
```

Expected: FAIL because `NativeAudioEngine` is not exported.

- [ ] **Step 3: Add NativeAudioEngine**

In `dist/audio-speed-player.js`, add this class before `defineAudioSpeedPlayer`:

```js
export class NativeAudioEngine {
  constructor(audio) {
    this.audio = audio;
    this.name = ENGINE_NATIVE;
    this.rate = DEFAULT_RATE;
    this.preservePitch = true;
  }

  loadSource(src) {
    if (!this.audio) return src || "";
    this.audio.src = src || "";
    this.audio.load?.();
    this.applyRate();
    return src || "";
  }

  play() {
    return this.audio?.play?.();
  }

  pause() {
    this.audio?.pause?.();
  }

  setRate(rate) {
    this.rate = normalizeRate(toFiniteNumber(rate, DEFAULT_RATE));
    this.applyRate();
  }

  setPreservePitch(enabled) {
    this.preservePitch = Boolean(enabled);
    this.applyPitchMode();
  }

  connectAnalyser() {
    return false;
  }

  destroy() {}

  applyRate() {
    if (!this.audio) return;
    this.audio.defaultPlaybackRate = this.rate;
    this.audio.playbackRate = this.rate;
    this.applyPitchMode();
  }

  applyPitchMode() {
    if (!this.audio) return;

    ["preservesPitch", "mozPreservesPitch", "webkitPreservesPitch"].forEach((property) => {
      if (property in this.audio) {
        this.audio[property] = this.preservePitch;
      }
    });
  }
}
```

- [ ] **Step 4: Run tests to verify the engine passes**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```powershell
git add dist\audio-speed-player.js tests\core.test.mjs
git commit -m "Add native audio engine wrapper"
```

---

### Task 3: Wire Engine Selection Into The Component

**Files:**
- Modify: `dist/audio-speed-player.js`
- Modify: `tests/core.test.mjs`

- [ ] **Step 1: Write a failing status helper test**

Update the import in `tests/core.test.mjs`:

```js
import {
  buildPresetRates,
  clampRate,
  defineAudioSpeedPlayer,
  ENGINE_NATIVE,
  ENGINE_RUBBERBAND,
  formatEngineStatus,
  formatRate,
  NativeAudioEngine,
  normalizeEngineName,
  parseBooleanAttribute,
  parseRateAttribute
} from "../dist/audio-speed-player.js";
```

Add this test after the NativeAudioEngine tests:

```js
test("formatEngineStatus describes active and fallback engines", () => {
  assert.equal(formatEngineStatus(ENGINE_NATIVE, ENGINE_NATIVE), "Native engine");
  assert.equal(formatEngineStatus(ENGINE_RUBBERBAND, ENGINE_RUBBERBAND), "Professional engine");
  assert.equal(
    formatEngineStatus(ENGINE_NATIVE, ENGINE_RUBBERBAND),
    "Professional engine unavailable, using native engine"
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm.cmd test
```

Expected: FAIL because `formatEngineStatus` is not exported.

- [ ] **Step 3: Add the status helper**

In `dist/audio-speed-player.js`, add this function after `normalizeEngineName`:

```js
export function formatEngineStatus(activeEngine, requestedEngine = activeEngine) {
  if (requestedEngine === ENGINE_RUBBERBAND && activeEngine === ENGINE_NATIVE) {
    return "Professional engine unavailable, using native engine";
  }

  if (activeEngine === ENGINE_RUBBERBAND) {
    return "Professional engine";
  }

  return "Native engine";
}
```

- [ ] **Step 4: Add engine state to the element constructor**

In the `AudioSpeedPlayerElement` constructor, add:

```js
this._requestedEngineName = ENGINE_NATIVE;
this._activeEngineName = ENGINE_NATIVE;
this._audioEngine = null;
```

- [ ] **Step 5: Observe the engine attribute**

Change `observedAttributes` to:

```js
static observedAttributes = ["src", "label", "rate", "min-rate", "max-rate", "step", "preserve-pitch", "engine"];
```

- [ ] **Step 6: Add engine sync methods**

Add these methods near `_syncPitchUi`:

```js
_syncEngineFromAttributes() {
  const requestedEngine = normalizeEngineName(this.getAttribute("engine"));
  if (!this._audioEngine || requestedEngine !== this._requestedEngineName) {
    this._selectEngine(requestedEngine);
  }
}

_selectEngine(requestedEngine) {
  this._requestedEngineName = requestedEngine;
  this._audioEngine?.destroy?.();

  if (requestedEngine === ENGINE_RUBBERBAND) {
    this._activeEngineName = ENGINE_NATIVE;
  } else {
    this._activeEngineName = ENGINE_NATIVE;
  }

  this._audioEngine = new NativeAudioEngine(this._parts.audio);
  this._audioEngine.setRate(this._rate);
  this._audioEngine.setPreservePitch(this._preservePitch);
  this._syncEngineStatus();
}

_syncEngineStatus() {
  if (!this._parts.engineStatus) return;
  this._parts.engineStatus.textContent = formatEngineStatus(this._activeEngineName, this._requestedEngineName);
}
```

- [ ] **Step 7: Call engine sync during connection and attribute changes**

In `connectedCallback`, call `_syncEngineFromAttributes()` after `_syncPitchUi()` and before loading `src`:

```js
this._syncPitchUi();
this._syncEngineFromAttributes();
```

In `attributeChangedCallback`, add this branch after the `label` branch:

```js
if (name === "engine") {
  this._syncEngineFromAttributes();
  const src = this.getAttribute("src");
  if (src) this.loadSrc(src);
  this.setRate(this._rate);
  return;
}
```

- [ ] **Step 8: Route existing audio operations through the engine**

Change `_applyRate` to:

```js
_applyRate() {
  this._audioEngine?.setRate(this._rate);
}
```

Change `_applyPitchMode` to:

```js
_applyPitchMode() {
  this._audioEngine?.setPreservePitch(this._preservePitch);
}
```

Change `_setAudioSource` to:

```js
_setAudioSource(src) {
  this._audioEngine?.loadSource(src);
}
```

- [ ] **Step 9: Run unit tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all unit tests.

- [ ] **Step 10: Commit**

```powershell
git add dist\audio-speed-player.js tests\core.test.mjs
git commit -m "Wire engine selection into component"
```

---

### Task 4: Add Engine Status To The UI And Smoke Test

**Files:**
- Modify: `dist/audio-speed-player.js`
- Modify: `tests/smoke.html`

- [ ] **Step 1: Add engine status markup**

In `_render`, inside `<div class="footer">` and before the pitch toggle, add:

```html
<span class="engine-status" part="engine-status">Native engine</span>
```

The footer block should become:

```html
<div class="footer">
  <span class="engine-status" part="engine-status">Native engine</span>
  <label class="pitch-toggle">
    <input class="preserve-input" type="checkbox" />
    <span>Keep pitch</span>
  </label>
  <button class="reset-button" part="reset-button" type="button">Reset</button>
</div>
```

- [ ] **Step 2: Add engine status styles**

Add this CSS near `.pitch-toggle`:

```css
.engine-status {
  color: #a9c9c5;
  font-size: 12px;
  font-weight: 760;
}
```

- [ ] **Step 3: Collect the engine status part**

In `_collectParts`, add:

```js
engineStatus: this.shadowRoot.querySelector(".engine-status"),
```

- [ ] **Step 4: Update the smoke test markup**

In `tests/smoke.html`, replace the body players with two players:

```html
<audio-speed-player id="nativePlayer" label="Smoke pad"></audio-speed-player>
<audio-speed-player id="professionalPlayer" label="Pro smoke pad" engine="rubberband"></audio-speed-player>
<pre id="result">pending</pre>
```

- [ ] **Step 5: Update the smoke test script**

Replace this line:

```js
const host = document.querySelector("audio-speed-player");
```

With:

```js
const host = document.getElementById("nativePlayer");
const professionalHost = document.getElementById("professionalPlayer");
```

After `const shadow = host && host.shadowRoot;`, add:

```js
const professionalShadow = professionalHost && professionalHost.shadowRoot;
```

Change the missing-shadow check to:

```js
if (!shadow || !professionalShadow) {
  result.textContent = JSON.stringify({ ok: false, reason: "missing shadow root" });
}
```

Inside `designChecks`, add:

```js
hasEngineStatus: Boolean(shadow.querySelector(".engine-status")),
professionalFallbackVisible:
  professionalShadow.querySelector(".engine-status")?.textContent ===
  "Professional engine unavailable, using native engine",
```

In the JSON result object, add:

```js
engineStatus: shadow.querySelector(".engine-status")?.textContent,
professionalEngineStatus: professionalShadow.querySelector(".engine-status")?.textContent,
```

- [ ] **Step 6: Run unit tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all unit tests.

- [ ] **Step 7: Run smoke test manually in a browser**

Run a local server:

```powershell
python -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/tests/smoke.html
```

Expected JSON includes:

```json
{
  "ok": true,
  "engineStatus": "Native engine",
  "professionalEngineStatus": "Professional engine unavailable, using native engine",
  "hasEngineStatus": true,
  "professionalFallbackVisible": true
}
```

- [ ] **Step 8: Commit**

```powershell
git add dist\audio-speed-player.js tests\smoke.html
git commit -m "Show audio engine status"
```

---

### Task 5: Document Engine Modes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the engine attribute row**

In the attributes table, add this row after `label`:

```markdown
| `engine` | `native` | Playback engine. Use `native` for browser playback. `rubberband` requests professional mode and falls back to native until the professional build is loaded. |
```

- [ ] **Step 2: Add an engine modes section**

Add this section after the "With a default audio source" example:

~~~markdown
## Engine Modes

The default build uses the native browser engine:

```html
<audio-speed-player src="./song.mp3" engine="native"></audio-speed-player>
```

You can request professional mode with:

```html
<audio-speed-player src="./song.mp3" engine="rubberband"></audio-speed-player>
```

The current public build falls back to native playback when the professional engine is
not available. A future professional build will bundle a Rubber Band WebAssembly
engine for higher quality time-stretching.

The native build remains MIT-compatible. A build that bundles Rubber Band must be
GPL-compatible unless a commercial Rubber Band license is used.
~~~

- [ ] **Step 3: Run unit tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all unit tests.

- [ ] **Step 4: Commit**

```powershell
git add README.md
git commit -m "Document audio engine modes"
```

---

### Task 6: Final Verification For Foundation

**Files:**
- Read: `dist/audio-speed-player.js`
- Read: `tests/core.test.mjs`
- Read: `tests/smoke.html`
- Read: `README.md`

- [ ] **Step 1: Check git status**

Run:

```powershell
git status --short
```

Expected: no output.

- [ ] **Step 2: Run unit tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS for all tests.

- [ ] **Step 3: Run smoke test**

Run:

```powershell
python -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/tests/smoke.html
```

Expected: JSON output has `"ok": true`.

- [ ] **Step 4: Verify public API examples**

Open the README and confirm it contains both snippets:

```html
<audio-speed-player src="./song.mp3" engine="native"></audio-speed-player>
```

```html
<audio-speed-player src="./song.mp3" engine="rubberband"></audio-speed-player>
```

- [ ] **Step 5: Prepare the next plan**

Create a second implementation plan named:

```text
docs/superpowers/plans/2026-06-24-rubberband-wasm-engine.md
```

That plan should cover:

- vendoring or building the audited Rubber Band source;
- the WebAssembly wrapper API;
- the AudioWorklet processor;
- decoded-audio streaming;
- latency and dropout verification;
- GPL-compatible distribution for `dist/audio-speed-player-pro.js`.

Do not begin this second plan until the foundation work above is merged and verified.
