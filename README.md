# Audio Speed Player

A free standalone Web Component for uploading audio, changing playback speed, and showing a rhythm-reactive MetaBalls visualizer in the browser.

It has no framework dependency, no paid API, and no server requirement. It uses native browser audio playback, including `HTMLAudioElement.playbackRate`, `preservesPitch` where supported, and the Web Audio API for the visualizer when playback starts.

## Quick Start

```html
<script type="module" src="./dist/audio-speed-player.js"></script>

<audio-speed-player></audio-speed-player>
```

From GitHub Pages:

```html
<script
  type="module"
  src="https://eddietsai6-code.github.io/audio-speed-player/dist/audio-speed-player.js"
></script>

<audio-speed-player></audio-speed-player>
```

Demo page:

```text
https://eddietsai6-code.github.io/audio-speed-player/
```

With a default audio source:

```html
<script type="module" src="./dist/audio-speed-player.js"></script>

<audio-speed-player src="./song.mp3" label="Lesson track"></audio-speed-player>
```

## Attributes

| Attribute | Default | Description |
| --- | --- | --- |
| `src` | empty | Optional audio URL. |
| `label` | `Audio Speed Player` | Player title. |
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
