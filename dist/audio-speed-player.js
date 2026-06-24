export const DEFAULT_MIN_RATE = 0.25;
export const DEFAULT_MAX_RATE = 2;
export const DEFAULT_RATE = 1;
export const DEFAULT_STEP = 0.05;
export const DEFAULT_PRESET_RATES = [0.5, 0.75, 1, 1.25, 1.5];
export const DEFAULT_TAG_NAME = "audio-speed-player";
export const ENGINE_NATIVE = "native";
export const ENGINE_RUBBERBAND = "rubberband";

const SUPPORTED_ENGINES = new Set([ENGINE_NATIVE, ENGINE_RUBBERBAND]);
const BOOLEAN_FALSE_VALUES = new Set(["false", "0", "off", "no"]);
const BOOLEAN_TRUE_VALUES = new Set(["", "true", "1", "on", "yes"]);

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRate(rate) {
  return Math.round(Number(rate) * 100) / 100;
}

export function clampRate(rate, min = DEFAULT_MIN_RATE, max = DEFAULT_MAX_RATE) {
  const safeMin = toFiniteNumber(min, DEFAULT_MIN_RATE);
  const safeMax = toFiniteNumber(max, DEFAULT_MAX_RATE);
  const low = Math.min(safeMin, safeMax);
  const high = Math.max(safeMin, safeMax);
  const numeric = toFiniteNumber(rate, DEFAULT_RATE);
  return normalizeRate(Math.min(Math.max(numeric, low), high));
}

export function formatRate(rate) {
  const normalized = normalizeRate(toFiniteNumber(rate, DEFAULT_RATE));
  return `${String(normalized).replace(/\.?0+$/, "")}x`;
}

export function parseRateAttribute(value, fallback = DEFAULT_RATE) {
  if (value === null || value === undefined) return fallback;
  return toFiniteNumber(value, fallback);
}

export function parseBooleanAttribute(value, fallback = true) {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (BOOLEAN_TRUE_VALUES.has(normalized)) return true;
  if (BOOLEAN_FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

export function normalizeEngineName(value, fallback = ENGINE_NATIVE) {
  const normalized = String(value || "").trim().toLowerCase();
  if (SUPPORTED_ENGINES.has(normalized)) return normalized;
  return fallback;
}

export function buildPresetRates(min, max, presets = DEFAULT_PRESET_RATES) {
  const safeMin = toFiniteNumber(min, DEFAULT_MIN_RATE);
  const safeMax = toFiniteNumber(max, DEFAULT_MAX_RATE);
  const low = Math.min(safeMin, safeMax);
  const high = Math.max(safeMin, safeMax);

  return [...new Set(presets.map((rate) => normalizeRate(rate)).filter((rate) => rate >= low && rate <= high))]
    .sort((a, b) => a - b);
}

const componentStyles = `
  :host {
    --asp-ink: #eafff7;
    --asp-muted: #8ea4a4;
    --asp-panel: rgba(7, 18, 22, 0.72);
    --asp-line: rgba(214, 255, 244, 0.14);
    --asp-accent: #31d6ff;
    --asp-accent-strong: #18a4e0;
    --asp-mint: #36f0b2;
    --asp-coral: #ff6b5c;
    --asp-gold: #ffd166;
    --asp-radius: 8px;
    --asp-rate-progress: 42.85%;
    --asp-energy: 12%;
    display: block;
    color: var(--asp-ink);
    font-family: "Aptos", "Segoe UI", "Helvetica Neue", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .player {
    width: 100%;
    min-width: 0;
    border-radius: var(--asp-radius);
  }

  .flow-shell {
    position: relative;
    overflow: hidden;
    width: 100%;
    min-width: 0;
    border: 1px solid rgba(211, 255, 243, 0.18);
    border-radius: var(--asp-radius);
    background:
      radial-gradient(circle at 18% 12%, rgba(49, 214, 255, 0.26), transparent 34%),
      radial-gradient(circle at 84% 18%, rgba(255, 107, 92, 0.18), transparent 32%),
      linear-gradient(180deg, rgba(10, 24, 30, 0.96), rgba(5, 13, 17, 0.98));
    box-shadow:
      0 28px 70px rgba(0, 17, 24, 0.34),
      0 1px 0 rgba(255, 255, 255, 0.14) inset,
      0 -20px 36px rgba(0, 0, 0, 0.28) inset;
    padding: 16px;
  }

  .flow-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(234, 255, 247, 0.035) 0 1px, transparent 1px 22px),
      linear-gradient(180deg, rgba(234, 255, 247, 0.035) 0 1px, transparent 1px 22px);
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 72%);
    pointer-events: none;
  }

  .metaballs-stage {
    position: relative;
    z-index: 1;
    min-height: 300px;
    overflow: hidden;
    border: 1px solid rgba(214, 255, 244, 0.18);
    border-radius: 8px;
    background:
      radial-gradient(circle at 52% 44%, rgba(54, 240, 178, 0.18), transparent 28%),
      radial-gradient(circle at 16% 84%, rgba(49, 214, 255, 0.14), transparent 26%),
      linear-gradient(145deg, #071117, #0e1f26 54%, #130f18);
    box-shadow:
      0 18px 40px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    isolation: isolate;
  }

  .visualizer-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    filter: saturate(1.24) contrast(1.1);
  }

  .visualizer-noise {
    position: absolute;
    inset: 0;
    z-index: 2;
    background:
      radial-gradient(circle at 50% 50%, transparent 0 48%, rgba(0, 0, 0, 0.42) 100%),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 4px);
    mix-blend-mode: screen;
    opacity: 0.7;
    pointer-events: none;
  }

  .visualizer-head,
  .footer,
  .control-row,
  .preset-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .visualizer-head {
    position: relative;
    z-index: 3;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px;
    pointer-events: none;
  }

  .title-wrap {
    min-width: 0;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    border: 1px solid rgba(234, 255, 247, 0.18);
    border-left: 4px solid var(--asp-coral);
    border-radius: 6px;
    background: rgba(7, 18, 22, 0.46);
    color: #ffd6cf;
    font-size: 11px;
    font-weight: 820;
    letter-spacing: 0;
    text-transform: uppercase;
    padding: 2px 8px 2px 7px;
  }

  .title {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    color: #f4fff9;
    font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.42);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rate-readout {
    min-width: 88px;
    border: 1px solid rgba(234, 255, 247, 0.18);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(19, 42, 48, 0.86), rgba(5, 12, 15, 0.9));
    color: #eafff7;
    font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
    font-size: 19px;
    font-weight: 820;
    line-height: 1;
    padding: 12px 10px;
    text-align: center;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.16),
      0 10px 24px rgba(0, 0, 0, 0.28);
  }

  .energy-meter {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 120px 16px 16px;
    max-width: 260px;
    border: 1px solid rgba(234, 255, 247, 0.14);
    border-radius: 8px;
    background: rgba(5, 14, 18, 0.58);
    padding: 10px;
    backdrop-filter: blur(10px);
  }

  .energy-bar {
    position: relative;
    flex: 1;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(234, 255, 247, 0.16);
  }

  .energy-bar::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--asp-energy);
    border-radius: inherit;
    background: linear-gradient(90deg, var(--asp-mint), var(--asp-accent), var(--asp-coral));
    box-shadow: 0 0 18px rgba(49, 214, 255, 0.48);
  }

  .energy-value {
    min-width: 58px;
    color: #cae5e0;
    font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
    font-size: 11px;
    font-weight: 760;
    text-align: right;
    text-transform: uppercase;
  }

  .control-deck {
    position: relative;
    z-index: 1;
    margin-top: 14px;
    border: 1px solid var(--asp-line);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(19, 42, 48, 0.78), rgba(7, 18, 22, 0.82));
    padding: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .drop-zone {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
    min-height: 64px;
    place-items: center;
    border: 1px dashed rgba(234, 255, 247, 0.24);
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(54, 240, 178, 0.08), transparent 36%, rgba(255, 107, 92, 0.08)),
      rgba(255, 255, 255, 0.04);
    color: var(--asp-muted);
    cursor: pointer;
    padding: 11px 12px;
    text-align: center;
    transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  }

  :host([no-upload]) .drop-zone {
    display: none;
  }

  .drop-zone:hover,
  .drop-zone.is-dragging,
  .drop-zone:focus-within {
    border-color: var(--asp-mint);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 20px rgba(54, 240, 178, 0.12);
  }

  .file-input {
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    pointer-events: none;
  }

  .drop-main {
    color: #effffb;
    font-size: 14px;
    font-weight: 820;
  }

  .drop-sub {
    font-size: 12px;
  }

  audio {
    display: block;
    width: 100%;
    margin: 12px 0 0;
    filter: invert(0.92) hue-rotate(156deg) saturate(0.8);
  }

  .control-row {
    display: grid;
    grid-template-columns: minmax(58px, auto) 1fr;
    margin-top: 12px;
    border: 1px solid rgba(234, 255, 247, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 11px;
  }

  .range-label {
    color: #d6fff2;
    font-size: 12px;
    font-weight: 820;
    text-transform: uppercase;
  }

  .rate-input {
    width: 100%;
    accent-color: var(--asp-accent);
  }

  .meter-track {
    position: relative;
    overflow: hidden;
    height: 8px;
    margin-top: 8px;
    border: 1px solid rgba(234, 255, 247, 0.12);
    border-radius: 999px;
    background:
      repeating-linear-gradient(90deg, rgba(234, 255, 247, 0.14) 0 1px, transparent 1px 10px),
      rgba(255, 255, 255, 0.08);
  }

  .meter-track::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--asp-rate-progress);
    border-radius: inherit;
    background: linear-gradient(90deg, var(--asp-mint), var(--asp-accent), var(--asp-coral));
  }

  .preset-row {
    flex-wrap: wrap;
    margin-top: 12px;
  }

  button {
    min-height: 34px;
    border: 1px solid rgba(234, 255, 247, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.07);
    color: #effffb;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 780;
    padding: 6px 10px;
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  button:hover {
    border-color: rgba(49, 214, 255, 0.5);
    color: #ffffff;
  }

  button.is-active {
    border-color: var(--asp-accent);
    background: linear-gradient(135deg, var(--asp-accent), var(--asp-mint));
    color: #071216;
  }

  .footer {
    justify-content: space-between;
    margin-top: 14px;
    border-top: 1px solid rgba(234, 255, 247, 0.12);
    padding-top: 11px;
  }

  .pitch-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #d8f2ed;
    font-size: 13px;
    font-weight: 760;
  }

  .pitch-toggle input {
    accent-color: var(--asp-accent);
  }

  .status {
    margin: 10px 0 0;
    min-height: 18px;
    color: var(--asp-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  @media (max-width: 520px) {
    .footer {
      align-items: stretch;
      grid-template-columns: 1fr;
    }

    .footer {
      flex-direction: column;
    }

    .reset-button {
      width: 100%;
    }

    .eyebrow {
      font-size: 10px;
    }

    .title {
      font-size: 18px;
    }

    .rate-readout {
      min-width: 74px;
      font-size: 18px;
      padding: 11px 9px;
    }

    .control-row {
      grid-template-columns: 1fr;
    }

    .flow-shell {
      padding: 12px;
    }

    .metaballs-stage {
      min-height: 270px;
    }

    .visualizer-head {
      gap: 12px;
      padding: 14px;
    }

    .energy-meter {
      margin: 122px 14px 14px;
    }
  }
`;

export function defineAudioSpeedPlayer(tagName = DEFAULT_TAG_NAME) {
  const registry = globalThis.customElements;
  const HTMLElementCtor = globalThis.HTMLElement;

  if (!registry || !HTMLElementCtor || !globalThis.document) return false;
  if (registry.get(tagName)) return false;

  class AudioSpeedPlayerElement extends HTMLElementCtor {
    static observedAttributes = ["src", "label", "rate", "min-rate", "max-rate", "step", "preserve-pitch"];

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._objectUrl = "";
      this._rate = DEFAULT_RATE;
      this._minRate = DEFAULT_MIN_RATE;
      this._maxRate = DEFAULT_MAX_RATE;
      this._step = DEFAULT_STEP;
      this._preservePitch = true;
      this._reflectingRate = false;
      this._reflectingPitch = false;
      this._parts = {};
      this._audioContext = null;
      this._audioSource = null;
      this._analyser = null;
      this._frequencyData = null;
      this._visualizerFrame = 0;
      this._visualizerResizeObserver = null;
      this._visualizerResizeHandler = null;
      this._visualizerContext = null;
      this._visualizerBlobs = [];
      this._visualizerState = {
        energy: 0,
        bass: 0,
        lastTime: 0
      };
    }

    connectedCallback() {
      this._render();
      this._collectParts();
      this._setupVisualizer();
      this._bindEvents();
      this._syncConfigFromAttributes();
      this._syncLabel();
      this._syncRange();
      this._syncPresets();
      this._syncPitchUi();

      const src = this.getAttribute("src");
      if (src) {
        this.loadSrc(src);
      } else {
        this._setStatus("Choose an audio file to start.");
      }

      this.setRate(this._rate);
    }

    disconnectedCallback() {
      this._stopVisualizer();
      this._disconnectAudioGraph();
      this._revokeObjectUrl();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue || !this.isConnected || !this._parts.audio) return;
      if (name === "rate" && this._reflectingRate) return;
      if (name === "preserve-pitch" && this._reflectingPitch) return;

      if (name === "src") {
        this.loadSrc(newValue || "");
        return;
      }

      if (name === "label") {
        this._syncLabel();
        return;
      }

      this._syncConfigFromAttributes();
      this._syncRange();
      this._syncPresets();
      this._syncPitchUi();
      this.setRate(this._rate);
    }

    get rate() {
      return this._rate;
    }

    set rate(value) {
      this.setRate(value, { reflect: true });
    }

    setRate(rate, options = {}) {
      const nextRate = clampRate(rate, this._minRate, this._maxRate);
      const changed = nextRate !== this._rate;
      this._rate = nextRate;
      this._applyRate();
      this._syncRateUi();

      if (options.reflect) {
        this._reflectingRate = true;
        this.setAttribute("rate", String(nextRate));
        this._reflectingRate = false;
      }

      if (changed) {
        this.dispatchEvent(
          new CustomEvent("audio-speed-player:rate-change", {
            bubbles: true,
            detail: {
              rate: nextRate,
              label: formatRate(nextRate)
            }
          })
        );
      }

      return nextRate;
    }

    loadSrc(src) {
      this._revokeObjectUrl();
      this._setAudioSource(src || "");
      this._setStatus(src ? "Audio source loaded." : "Choose an audio file to start.");
      return src || "";
    }

    loadFile(file) {
      if (!file) return false;
      if (file.type && !file.type.startsWith("audio/")) {
        this._setStatus("Please choose an audio file.");
        return false;
      }

      this._revokeObjectUrl();
      this._objectUrl = URL.createObjectURL(file);
      this._setAudioSource(this._objectUrl);
      this._setStatus(file.name || "Local audio loaded.");
      this.dispatchEvent(
        new CustomEvent("audio-speed-player:file-load", {
          bubbles: true,
          detail: {
            fileName: file.name || "",
            size: file.size || 0
          }
        })
      );
      return true;
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>${componentStyles}</style>
        <section class="player" part="player">
          <div class="flow-shell" part="player-shell" aria-label="Audio-reactive speed player">
            <div class="metaballs-stage" part="visualizer">
              <canvas class="visualizer-canvas" part="visualizer-canvas" aria-hidden="true"></canvas>
              <div class="visualizer-noise" aria-hidden="true"></div>
              <div class="visualizer-head">
                <div class="title-wrap">
                  <span class="eyebrow">audio reactive</span>
                  <strong class="title" part="title"></strong>
                </div>
                <output class="rate-readout" part="rate-readout" aria-live="polite">1x</output>
              </div>
              <div class="energy-meter" aria-hidden="true">
                <span class="energy-bar"></span>
                <span class="energy-value">idle</span>
              </div>
            </div>

            <div class="control-deck">
              <label class="drop-zone" part="drop-zone">
                <input class="file-input" type="file" accept="audio/*" />
                <span class="drop-main">Choose audio</span>
                <span class="drop-sub">or drop a local file here</span>
              </label>

              <audio class="audio" part="audio" controls preload="metadata"></audio>

              <div class="speed-panel">
                <div class="control-row">
                  <label class="range-label" for="audioSpeedPlayerRate">Speed</label>
                  <input id="audioSpeedPlayerRate" class="rate-input" part="rate-input" type="range" />
                </div>
                <div class="meter-track" aria-hidden="true"></div>
              </div>

              <div class="preset-row" part="preset-row" aria-label="Playback speed presets"></div>

              <div class="footer">
                <label class="pitch-toggle">
                  <input class="preserve-input" type="checkbox" />
                  <span>Keep pitch</span>
                </label>
                <button class="reset-button" part="reset-button" type="button">Reset</button>
              </div>

              <p class="status" aria-live="polite"></p>
            </div>
          </div>
        </section>
      `;
    }

    _collectParts() {
      this._parts = {
        audio: this.shadowRoot.querySelector(".audio"),
        dropZone: this.shadowRoot.querySelector(".drop-zone"),
        energyValue: this.shadowRoot.querySelector(".energy-value"),
        fileInput: this.shadowRoot.querySelector(".file-input"),
        preserveInput: this.shadowRoot.querySelector(".preserve-input"),
        presetRow: this.shadowRoot.querySelector(".preset-row"),
        rateInput: this.shadowRoot.querySelector(".rate-input"),
        rateReadout: this.shadowRoot.querySelector(".rate-readout"),
        resetButton: this.shadowRoot.querySelector(".reset-button"),
        status: this.shadowRoot.querySelector(".status"),
        title: this.shadowRoot.querySelector(".title"),
        visualizerCanvas: this.shadowRoot.querySelector(".visualizer-canvas"),
        visualizerStage: this.shadowRoot.querySelector(".metaballs-stage")
      };
    }

    _bindEvents() {
      const { audio, dropZone, fileInput, preserveInput, presetRow, rateInput, resetButton } = this._parts;

      fileInput.addEventListener("change", () => {
        this.loadFile(fileInput.files?.[0]);
        fileInput.value = "";
      });

      dropZone.addEventListener("dragenter", (event) => {
        event.preventDefault();
        dropZone.classList.add("is-dragging");
      });

      dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("is-dragging");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("is-dragging");
      });

      dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("is-dragging");
        this.loadFile(event.dataTransfer?.files?.[0]);
      });

      rateInput.addEventListener("input", () => {
        this.setRate(rateInput.value, { reflect: true });
      });

      presetRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-rate]");
        if (!button) return;
        this.setRate(button.dataset.rate, { reflect: true });
      });

      resetButton.addEventListener("click", () => {
        this.setRate(DEFAULT_RATE, { reflect: true });
      });

      preserveInput.addEventListener("change", () => {
        this._setPreservePitch(preserveInput.checked, { reflect: true });
      });

      audio.addEventListener("ratechange", () => {
        if (audio.playbackRate !== this._rate) {
          this.setRate(audio.playbackRate, { reflect: true });
        }
      });

      audio.addEventListener("play", () => {
        this._ensureAudioGraph();
        this._audioContext?.resume?.().catch(() => {});
        this.toggleAttribute("playing", true);
      });

      audio.addEventListener("pause", () => {
        this.toggleAttribute("playing", false);
      });

      audio.addEventListener("ended", () => {
        this.toggleAttribute("playing", false);
      });
    }

    _setupVisualizer() {
      const { visualizerCanvas, visualizerStage } = this._parts;
      if (!visualizerCanvas || !visualizerStage) return;

      this._visualizerContext = visualizerCanvas.getContext("2d", { alpha: true });
      if (!this._visualizerContext) return;

      this._visualizerBlobs = Array.from({ length: 10 }, (_, index) => {
        const seed = index + 1;
        return {
          x: 0.18 + ((seed * 37) % 64) / 100,
          y: 0.2 + ((seed * 53) % 58) / 100,
          radius: 34 + ((seed * 29) % 58),
          hue: [168, 194, 24, 10, 214][index % 5],
          speed: 0.28 + ((seed * 17) % 30) / 100,
          phase: seed * 1.87
        };
      });

      const resize = () => this._resizeVisualizer();
      this._visualizerResizeHandler = resize;
      if ("ResizeObserver" in globalThis) {
        this._visualizerResizeObserver = new ResizeObserver(resize);
        this._visualizerResizeObserver.observe(visualizerStage);
      } else {
        globalThis.addEventListener?.("resize", resize);
      }

      this._resizeVisualizer();
      this._drawVisualizer(0);
    }

    _resizeVisualizer() {
      const { visualizerCanvas, visualizerStage } = this._parts;
      if (!visualizerCanvas || !visualizerStage || !this._visualizerContext) return;

      const rect = visualizerStage.getBoundingClientRect();
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (visualizerCanvas.width !== width || visualizerCanvas.height !== height) {
        visualizerCanvas.width = width;
        visualizerCanvas.height = height;
      }

      visualizerCanvas.style.width = `${Math.round(rect.width)}px`;
      visualizerCanvas.style.height = `${Math.round(rect.height)}px`;
      this._visualizerContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _drawVisualizer(time = 0) {
      this._visualizerFrame = globalThis.requestAnimationFrame?.((nextTime) => this._drawVisualizer(nextTime)) || 0;

      const { visualizerCanvas, visualizerStage } = this._parts;
      const ctx = this._visualizerContext;
      if (!visualizerCanvas || !visualizerStage || !ctx) return;

      const rect = visualizerStage.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const seconds = time * 0.001;
      const { energy, bass } = this._readAudioEnergy(seconds);
      const pulse = 0.7 + energy * 1.9 + bass * 0.8;

      ctx.clearRect(0, 0, width, height);

      const wash = ctx.createRadialGradient(width * 0.52, height * 0.44, 0, width * 0.52, height * 0.44, width * 0.72);
      wash.addColorStop(0, `rgba(54, 240, 178, ${0.08 + energy * 0.2})`);
      wash.addColorStop(0.48, `rgba(49, 214, 255, ${0.05 + bass * 0.18})`);
      wash.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = `blur(${16 + energy * 16}px)`;

      this._visualizerBlobs.forEach((blob, index) => {
        const drift = seconds * blob.speed * (0.65 + this._rate * 0.35);
        const x = width * blob.x + Math.cos(drift + blob.phase) * width * (0.12 + bass * 0.08);
        const y = height * blob.y + Math.sin(drift * 1.25 + blob.phase) * height * (0.1 + energy * 0.08);
        const radius = blob.radius * pulse * (index % 3 === 0 ? 1.18 : 1);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${blob.hue}, 95%, 66%, ${0.55 + energy * 0.34})`);
        gradient.addColorStop(0.52, `hsla(${blob.hue + 18}, 92%, 58%, ${0.22 + bass * 0.26})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      const horizonY = height * (0.76 - bass * 0.05);
      ctx.save();
      ctx.globalAlpha = 0.32 + energy * 0.28;
      ctx.strokeStyle = "#eafff7";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin(x * 0.025 + seconds * (2.2 + this._rate)) * (8 + energy * 28);
        const y = horizonY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    _readAudioEnergy(time) {
      let targetEnergy = 0.12 + Math.sin(time * 1.8) * 0.025;
      let targetBass = 0.1 + Math.cos(time * 1.3) * 0.02;

      if (this._analyser && this._frequencyData && !this._parts.audio.paused) {
        this._analyser.getByteFrequencyData(this._frequencyData);
        let total = 0;
        let bass = 0;
        const bassBins = Math.min(10, this._frequencyData.length);

        this._frequencyData.forEach((value, index) => {
          total += value;
          if (index < bassBins) bass += value;
        });

        targetEnergy = total / this._frequencyData.length / 255;
        targetBass = bass / bassBins / 255;
      }

      this._visualizerState.energy += (targetEnergy - this._visualizerState.energy) * 0.18;
      this._visualizerState.bass += (targetBass - this._visualizerState.bass) * 0.24;

      const level = Math.round(Math.min(Math.max(this._visualizerState.energy * 100, 4), 100));
      this.style.setProperty("--asp-energy", `${level}%`);
      if (this._parts.energyValue) {
        this._parts.energyValue.textContent = this.hasAttribute("playing") ? `${level}%` : "idle";
      }

      return {
        energy: this._visualizerState.energy,
        bass: this._visualizerState.bass
      };
    }

    _ensureAudioGraph() {
      if (this._analyser || !this._parts.audio) return Boolean(this._analyser);
      const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextCtor) return false;

      try {
        this._audioContext = new AudioContextCtor();
        this._audioSource = this._audioContext.createMediaElementSource(this._parts.audio);
        this._analyser = this._audioContext.createAnalyser();
        this._analyser.fftSize = 128;
        this._analyser.smoothingTimeConstant = 0.82;
        this._frequencyData = new Uint8Array(this._analyser.frequencyBinCount);
        this._audioSource.connect(this._analyser);
        this._analyser.connect(this._audioContext.destination);
        return true;
      } catch (error) {
        this._analyser = null;
        this._frequencyData = null;
        this._setStatus("Audio loaded. Visualizer is running in idle mode.");
        return false;
      }
    }

    _disconnectAudioGraph() {
      try {
        this._audioSource?.disconnect();
        this._analyser?.disconnect();
        this._audioContext?.close?.();
      } catch (error) {
        // Some browsers throw if a node is already disconnected.
      }

      this._audioContext = null;
      this._audioSource = null;
      this._analyser = null;
      this._frequencyData = null;
    }

    _stopVisualizer() {
      if (this._visualizerFrame) {
        globalThis.cancelAnimationFrame?.(this._visualizerFrame);
        this._visualizerFrame = 0;
      }

      this._visualizerResizeObserver?.disconnect();
      this._visualizerResizeObserver = null;
      if (this._visualizerResizeHandler) {
        globalThis.removeEventListener?.("resize", this._visualizerResizeHandler);
        this._visualizerResizeHandler = null;
      }
    }

    _syncConfigFromAttributes() {
      this._minRate = parseRateAttribute(this.getAttribute("min-rate"), DEFAULT_MIN_RATE);
      this._maxRate = parseRateAttribute(this.getAttribute("max-rate"), DEFAULT_MAX_RATE);
      this._step = parseRateAttribute(this.getAttribute("step"), DEFAULT_STEP);
      this._rate = clampRate(parseRateAttribute(this.getAttribute("rate"), this._rate), this._minRate, this._maxRate);
      this._preservePitch = parseBooleanAttribute(this.getAttribute("preserve-pitch"), true);
    }

    _syncLabel() {
      this._parts.title.textContent = this.getAttribute("label") || "Audio Speed Player";
    }

    _syncRange() {
      this._parts.rateInput.min = String(Math.min(this._minRate, this._maxRate));
      this._parts.rateInput.max = String(Math.max(this._minRate, this._maxRate));
      this._parts.rateInput.step = String(this._step);
    }

    _syncPresets() {
      const presets = buildPresetRates(this._minRate, this._maxRate);
      this._parts.presetRow.innerHTML = presets
        .map((rate) => `<button type="button" data-rate="${rate}">${formatRate(rate)}</button>`)
        .join("");
      this._syncPresetButtons();
    }

    _syncRateUi() {
      if (!this._parts.rateInput) return;
      this._parts.rateInput.value = String(this._rate);
      this._parts.rateReadout.textContent = formatRate(this._rate);
      const low = Number(this._parts.rateInput.min);
      const high = Number(this._parts.rateInput.max);
      const span = high - low || 1;
      const progress = ((this._rate - low) / span) * 100;
      this.style.setProperty("--asp-rate-progress", `${Math.min(Math.max(progress, 0), 100)}%`);
      this._syncPresetButtons();
    }

    _syncPresetButtons() {
      this._parts.presetRow?.querySelectorAll("[data-rate]").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.rate) === this._rate);
      });
    }

    _syncPitchUi() {
      this._parts.preserveInput.checked = this._preservePitch;
      this._applyPitchMode();
    }

    _setPreservePitch(value, options = {}) {
      this._preservePitch = Boolean(value);
      this._syncPitchUi();

      if (options.reflect) {
        this._reflectingPitch = true;
        this.setAttribute("preserve-pitch", this._preservePitch ? "" : "false");
        this._reflectingPitch = false;
      }
    }

    _applyRate() {
      const { audio } = this._parts;
      if (!audio) return;
      audio.defaultPlaybackRate = this._rate;
      audio.playbackRate = this._rate;
      this._applyPitchMode();
    }

    _applyPitchMode() {
      const { audio } = this._parts;
      if (!audio) return;

      ["preservesPitch", "mozPreservesPitch", "webkitPreservesPitch"].forEach((property) => {
        if (property in audio) {
          audio[property] = this._preservePitch;
        }
      });
    }

    _setAudioSource(src) {
      const { audio } = this._parts;
      audio.src = src;
      audio.load();
      this._applyRate();
    }

    _setStatus(message) {
      this._parts.status.textContent = message;
    }

    _revokeObjectUrl() {
      if (!this._objectUrl) return;
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = "";
    }
  }

  registry.define(tagName, AudioSpeedPlayerElement);
  return true;
}

defineAudioSpeedPlayer();
