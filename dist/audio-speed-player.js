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
    --asp-bg: #f7f1e8;
    --asp-ink: #171512;
    --asp-muted: #686056;
    --asp-line: rgba(23, 21, 18, 0.16);
    --asp-accent: #2b7cff;
    --asp-accent-strong: #0d4fd8;
    --asp-warm: #ffb238;
    --asp-panel: #fffaf2;
    --asp-radius: 8px;
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
    border: 1px solid var(--asp-line);
    border-radius: var(--asp-radius);
    background:
      linear-gradient(135deg, rgba(255, 178, 56, 0.18), transparent 34%),
      linear-gradient(180deg, var(--asp-panel), var(--asp-bg));
    box-shadow: 0 18px 40px rgba(23, 21, 18, 0.11);
    padding: 16px;
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
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .title-wrap {
    min-width: 0;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border: 1px solid rgba(43, 124, 255, 0.24);
    border-radius: 999px;
    background: rgba(43, 124, 255, 0.08);
    color: var(--asp-accent-strong);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .title {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: var(--asp-ink);
    font-size: 18px;
    font-weight: 820;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rate-readout {
    min-width: 74px;
    border-radius: 7px;
    background: var(--asp-ink);
    color: #fffaf2;
    font-size: 20px;
    font-weight: 850;
    line-height: 1;
    padding: 12px 10px;
    text-align: center;
  }

  .drop-zone {
    display: grid;
    gap: 4px;
    margin-bottom: 12px;
    min-height: 82px;
    place-items: center;
    border: 1px dashed rgba(23, 21, 18, 0.32);
    border-radius: var(--asp-radius);
    background: rgba(255, 255, 255, 0.54);
    color: var(--asp-muted);
    cursor: pointer;
    padding: 14px;
    text-align: center;
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
  }

  :host([no-upload]) .drop-zone {
    display: none;
  }

  .drop-zone:hover,
  .drop-zone.is-dragging,
  .drop-zone:focus-within {
    border-color: var(--asp-accent);
    background: rgba(43, 124, 255, 0.08);
    transform: translateY(-1px);
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
    font-size: 15px;
    font-weight: 800;
  }

  .drop-sub {
    font-size: 12px;
  }

  audio {
    display: block;
    width: 100%;
    margin: 12px 0;
  }

  .control-row {
    display: grid;
    grid-template-columns: minmax(64px, auto) 1fr;
    margin-top: 8px;
  }

  .range-label {
    color: var(--asp-muted);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .rate-input {
    width: 100%;
    accent-color: var(--asp-accent);
  }

  .preset-row {
    flex-wrap: wrap;
    margin-top: 12px;
  }

  button {
    min-height: 34px;
    border: 1px solid var(--asp-line);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.66);
    color: var(--asp-ink);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 780;
    padding: 6px 10px;
  }

  button:hover {
    border-color: rgba(43, 124, 255, 0.45);
    color: var(--asp-accent-strong);
  }

  button.is-active {
    border-color: var(--asp-accent);
    background: var(--asp-accent);
    color: #ffffff;
  }

  .footer {
    justify-content: space-between;
    margin-top: 14px;
    border-top: 1px solid var(--asp-line);
    padding-top: 12px;
  }

  .pitch-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--asp-muted);
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
    .head,
    .footer {
      align-items: stretch;
      flex-direction: column;
    }

    .rate-readout,
    .reset-button {
      width: 100%;
    }

    .control-row {
      grid-template-columns: 1fr;
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
          <div class="head">
            <div class="title-wrap">
              <span class="eyebrow">tempo tool</span>
              <strong class="title" part="title"></strong>
            </div>
            <output class="rate-readout" part="rate-readout" aria-live="polite">1x</output>
          </div>

          <label class="drop-zone" part="drop-zone">
            <input class="file-input" type="file" accept="audio/*" />
            <span class="drop-main">Choose audio</span>
            <span class="drop-sub">or drop a local file here</span>
          </label>

          <audio class="audio" part="audio" controls preload="metadata"></audio>

          <div class="control-row">
            <label class="range-label" for="audioSpeedPlayerRate">Speed</label>
            <input id="audioSpeedPlayerRate" class="rate-input" part="rate-input" type="range" />
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
