# Audio Speed Player

A free standalone Web Component for uploading audio, changing playback speed, and showing a rhythm-reactive MetaBalls visualizer in the browser.

It has no framework dependency, no paid API, and no server requirement. It uses native browser audio playback, including `HTMLAudioElement.playbackRate`, `preservesPitch` where supported, and the Web Audio API for the visualizer when playback starts.

## Quick Start

Native browser engine:

```html
<script type="module" src="./dist/audio-speed-player.js"></script>

<audio-speed-player></audio-speed-player>
```

Professional Rubber Band engine:

```html
<script type="module" src="./dist/audio-speed-player-pro.js"></script>

<audio-speed-player engine="rubberband"></audio-speed-player>
```

From GitHub Pages:

```html
<script
  type="module"
  src="https://eddietsai6-code.github.io/audio-speed-player/dist/audio-speed-player-pro.js"
></script>

<audio-speed-player engine="rubberband"></audio-speed-player>
```

Demo page:

```text
https://eddietsai6-code.github.io/audio-speed-player/
```

With a default audio source:

```html
<script type="module" src="./dist/audio-speed-player-pro.js"></script>

<audio-speed-player src="./song.mp3" label="Lesson track" engine="rubberband"></audio-speed-player>
```

## Engine Modes

The default build uses the native browser engine:

```html
<audio-speed-player src="./song.mp3" engine="native"></audio-speed-player>
```

Load the professional entry and request Rubber Band mode with:

```html
<script type="module" src="./dist/audio-speed-player-pro.js"></script>

<audio-speed-player src="./song.mp3" engine="rubberband"></audio-speed-player>
```

The professional browser entry registers the Rubber Band WebAssembly engine and
adds a dedicated play/pause transport to the component UI. If the browser cannot
load AudioWorklet or WebAssembly, the component falls back to native playback.

The native build remains MIT-compatible. A build that bundles Rubber Band must be
GPL-compatible unless a commercial Rubber Band license is used.

## Professional WASM Build

The professional engine is intended to stay free and open-source. The project builds
Rubber Band from the official source release with Emscripten and the upstream
`single/RubberBandSingle.cpp` build path, which uses bundled free FFT and resampler
implementations.

The generated files are:

```text
dist/audio-speed-player-pro.js
dist/audio-speed-player-pro.engine.js
dist/audio-speed-player-pro.worklet.js
dist/audio-speed-player-rubberband.mjs
dist/audio-speed-player-rubberband.wasm
```

Build locally from an Emscripten environment:

```bash
bash scripts/build-rubberband-wasm.sh
```

Or run the `Build Rubber Band WASM` GitHub Actions workflow. The workflow downloads
Rubber Band v4.0.0 from the official Breakfast Quay release URL and uploads the
generated WASM files as a workflow artifact.

## Attributes

| Attribute | Default | Description |
| --- | --- | --- |
| `src` | empty | Optional audio URL. |
| `label` | `Audio Speed Player` | Player title. |
| `engine` | `native` | Playback engine. Use `native` for browser playback. `rubberband` requests professional mode and falls back to native until the professional build is loaded. |
| `rate` | `1` | Initial playback speed. |
| `min-rate` | `0.25` | Minimum slider speed. |
| `max-rate` | `2` | Maximum slider speed. |
| `step` | `0.05` | Slider increment. |
| `preserve-pitch` | enabled | Keeps pitch stable when speed changes. Use `preserve-pitch="false"` to disable. |
| `no-upload` | disabled | Hide the local file upload area. |

## JavaScript API

```js
const player = document.querySelector("audio-speed-player");

player.setRate(0.75);
player.loadSrc("./song.mp3");
player.loadFile(file);
```

## Events

```js
player.addEventListener("audio-speed-player:rate-change", (event) => {
  console.log(event.detail.rate);
});

player.addEventListener("audio-speed-player:file-load", (event) => {
  console.log(event.detail.fileName);
});
```

## Development

```bash
npm test
```

On Windows PowerShell, if script execution blocks `npm`, run:

```powershell
npm.cmd test
```

Serve the demo with any static server:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## License

MIT
