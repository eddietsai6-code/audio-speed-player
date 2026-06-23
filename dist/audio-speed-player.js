export const DEFAULT_MIN_RATE = 0.25;
export const DEFAULT_MAX_RATE = 2;
export const DEFAULT_RATE = 1;
export const DEFAULT_STEP = 0.05;
export const DEFAULT_PRESET_RATES = [0.5, 0.75, 1, 1.25, 1.5];
export const DEFAULT_TAG_NAME = "audio-speed-player";

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
    --asp-ink: #142022;
    --asp-muted: #627174;
    --asp-panel: rgba(255, 255, 252, 0.82);
    --asp-accent: #0c8fdd;
    --asp-accent-strong: #085b9f;
    --asp-mint: #18b89a;
    --asp-coral: #ef604b;
    --asp-radius: 8px;
    --asp-rate-progress: 42.85%;
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

  .cassette-shell {
    position: relative;
    overflow: hidden;
    width: 100%;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.62);
    border-radius: var(--asp-radius);
    background:
      linear-gradient(90deg, rgba(20, 32, 34, 0.05) 0 1px, transparent 1px 18px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(237, 246, 245, 0.62) 44%, rgba(220, 233, 236, 0.74));
    box-shadow:
      0 22px 56px rgba(27, 47, 53, 0.18),
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 -18px 34px rgba(69, 99, 108, 0.08) inset;
    padding: 16px;
  }

  .glass-cassette {
    backdrop-filter: blur(18px) saturate(1.15);
  }

  .cassette-shell::before {
    content: "";
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(20, 32, 34, 0.1);
    border-radius: 6px;
    pointer-events: none;
  }

  .cassette-shell::after {
    content: "";
    position: absolute;
    inset: auto 18px 70px;
    height: 18px;
    border-radius: 999px;
    background:
      linear-gradient(90deg, rgba(239, 96, 75, 0.16), transparent 24%, transparent 76%, rgba(24, 184, 154, 0.16)),
      repeating-linear-gradient(90deg, rgba(20, 32, 34, 0.13) 0 1px, transparent 1px 14px);
    pointer-events: none;
  }

  .cassette-screws {
    position: absolute;
    inset: 12px;
    pointer-events: none;
  }

  .screw {
    position: absolute;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background:
      linear-gradient(90deg, transparent 43%, rgba(20, 32, 34, 0.48) 43% 57%, transparent 57%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(163, 186, 192, 0.8));
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.82), 0 1px 2px rgba(20, 32, 34, 0.16);
  }

  .screw:nth-child(1) { left: 0; top: 0; }
  .screw:nth-child(2) { right: 0; top: 0; }
  .screw:nth-child(3) { left: 0; bottom: 0; }
  .screw:nth-child(4) { right: 0; bottom: 0; }

  .cassette-label {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    border: 1px solid rgba(20, 32, 34, 0.13);
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(12, 143, 221, 0.1), transparent 32%, rgba(244, 198, 68, 0.12)),
      repeating-linear-gradient(0deg, rgba(20, 32, 34, 0.055) 0 1px, transparent 1px 12px),
      var(--asp-panel);
    padding: 14px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 12px 24px rgba(20, 32, 34, 0.08);
  }

  .glass-label {
    backdrop-filter: blur(10px);
  }

  .head,
  .footer,
  .control-row,
  .preset-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .head {
    min-width: 0;
    justify-content: space-between;
  }

  .title-wrap {
    min-width: 0;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    border: 1px solid rgba(20, 32, 34, 0.11);
    border-left: 4px solid var(--asp-coral);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.54);
    color: #5f302a;
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
    color: var(--asp-ink);
    font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rate-readout {
    min-width: 86px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(27, 43, 47, 0.96), rgba(9, 15, 17, 0.96));
    color: #e8fff9;
    font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
    font-size: 19px;
    font-weight: 820;
    line-height: 1;
    padding: 12px 10px;
    text-align: center;
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.16), 0 10px 20px rgba(20, 32, 34, 0.1);
  }

  .tape-window {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr minmax(72px, 0.55fr) 1fr;
    gap: 16px;
    align-items: center;
    margin: 14px 8px 14px;
    border: 1px solid rgba(20, 32, 34, 0.14);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(220, 235, 239, 0.28)),
      linear-gradient(90deg, rgba(20, 32, 34, 0.82), rgba(36, 55, 59, 0.7) 52%, rgba(20, 32, 34, 0.82));
    box-shadow:
      inset 0 12px 24px rgba(4, 10, 12, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 14px 26px rgba(20, 32, 34, 0.08);
    padding: 14px 18px;
  }

  .reel {
    position: relative;
    aspect-ratio: 1;
    width: min(96px, 100%);
    justify-self: center;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(255, 255, 255, 0.92) 0 12%, transparent 13%),
      conic-gradient(from 18deg, rgba(237, 247, 248, 0.92) 0 10deg, rgba(20, 32, 34, 0.9) 10deg 28deg, rgba(237, 247, 248, 0.92) 28deg 44deg, rgba(20, 32, 34, 0.88) 44deg 68deg, rgba(237, 247, 248, 0.9) 68deg 86deg, rgba(20, 32, 34, 0.9) 86deg 118deg, rgba(237, 247, 248, 0.92) 118deg 134deg, rgba(20, 32, 34, 0.86) 134deg 164deg, rgba(237, 247, 248, 0.92) 164deg 180deg, rgba(20, 32, 34, 0.9) 180deg 214deg, rgba(237, 247, 248, 0.92) 214deg 230deg, rgba(20, 32, 34, 0.88) 230deg 262deg, rgba(237, 247, 248, 0.92) 262deg 278deg, rgba(20, 32, 34, 0.9) 278deg 312deg, rgba(237, 247, 248, 0.92) 312deg 328deg, rgba(20, 32, 34, 0.9) 328deg 360deg);
    box-shadow:
      inset 0 0 0 8px rgba(255, 255, 255, 0.18),
      inset 0 0 0 18px rgba(12, 143, 221, 0.1),
      0 7px 18px rgba(4, 10, 12, 0.24);
    animation: reel-spin 3.8s linear infinite;
    animation-play-state: paused;
  }

  .reel::after {
    content: "";
    position: absolute;
    inset: 37%;
    border-radius: 50%;
    background: #101b1d;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
  }

  :host([playing]) .reel {
    animation-play-state: running;
  }

  .tape-bridge {
    height: 16px;
    border-radius: 999px;
    background:
      linear-gradient(90deg, transparent, rgba(244, 198, 68, 0.22), transparent),
      repeating-linear-gradient(90deg, #091113 0 10px, #1b2b2f 10px 17px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  @keyframes reel-spin {
    to { transform: rotate(360deg); }
  }

  .control-deck {
    position: relative;
    z-index: 1;
    border: 1px solid rgba(20, 32, 34, 0.12);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(232, 242, 242, 0.66));
    padding: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  .drop-zone {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
    min-height: 64px;
    place-items: center;
    border: 1px dashed rgba(20, 32, 34, 0.28);
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(24, 184, 154, 0.08), transparent 36%, rgba(239, 96, 75, 0.08)),
      rgba(255, 255, 252, 0.68);
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
    background: rgba(255, 255, 252, 0.86);
    box-shadow: 0 8px 20px rgba(24, 184, 154, 0.12);
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
    color: var(--asp-ink);
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
    filter: saturate(0.96);
  }

  .control-row {
    display: grid;
    grid-template-columns: minmax(58px, auto) 1fr;
    margin-top: 12px;
    border: 1px solid rgba(20, 32, 34, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 252, 0.62);
    padding: 10px 11px;
  }

  .range-label {
    color: #234047;
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
    border: 1px solid rgba(20, 32, 34, 0.1);
    border-radius: 999px;
    background:
      repeating-linear-gradient(90deg, rgba(20, 32, 34, 0.16) 0 1px, transparent 1px 10px),
      rgba(255, 255, 252, 0.58);
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
    border: 1px solid rgba(20, 32, 34, 0.13);
    border-radius: 8px;
    background: rgba(255, 255, 252, 0.74);
    color: #1a292d;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 780;
    padding: 6px 10px;
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  button:hover {
    border-color: rgba(12, 143, 221, 0.44);
    color: var(--asp-accent-strong);
  }

  button.is-active {
    border-color: var(--asp-accent);
    background: #10282f;
    color: #ffffff;
  }

  .footer {
    justify-content: space-between;
    margin-top: 14px;
    border-top: 1px solid rgba(20, 32, 34, 0.11);
    padding-top: 11px;
  }

  .pitch-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #2d4449;
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

    .cassette-label {
      gap: 10px;
      padding: 12px;
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

    .tape-window {
      grid-template-columns: 1fr 0.45fr 1fr;
      gap: 8px;
      margin-inline: 0;
      padding: 11px 13px;
    }

    .reel {
      width: min(72px, 100%);
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
    }

    connectedCallback() {
      this._render();
      this._collectParts();
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
          <div class="cassette-shell glass-cassette" part="cassette-shell" aria-label="Cassette-style audio speed player">
            <div class="cassette-screws" aria-hidden="true">
              <span class="screw"></span>
              <span class="screw"></span>
              <span class="screw"></span>
              <span class="screw"></span>
            </div>

            <div class="cassette-label glass-label">
              <div class="head">
                <div class="title-wrap">
                  <span class="eyebrow">transparent cassette</span>
                  <strong class="title" part="title"></strong>
                </div>
              </div>
              <output class="rate-readout" part="rate-readout" aria-live="polite">1x</output>
            </div>

            <div class="tape-window" aria-hidden="true">
              <span class="reel reel-left"></span>
              <span class="tape-bridge"></span>
              <span class="reel reel-right"></span>
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
        fileInput: this.shadowRoot.querySelector(".file-input"),
        preserveInput: this.shadowRoot.querySelector(".preserve-input"),
        presetRow: this.shadowRoot.querySelector(".preset-row"),
        rateInput: this.shadowRoot.querySelector(".rate-input"),
        rateReadout: this.shadowRoot.querySelector(".rate-readout"),
        resetButton: this.shadowRoot.querySelector(".reset-button"),
        status: this.shadowRoot.querySelector(".status"),
        title: this.shadowRoot.querySelector(".title")
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
        this.toggleAttribute("playing", true);
      });

      audio.addEventListener("pause", () => {
        this.toggleAttribute("playing", false);
      });

      audio.addEventListener("ended", () => {
        this.toggleAttribute("playing", false);
      });
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
