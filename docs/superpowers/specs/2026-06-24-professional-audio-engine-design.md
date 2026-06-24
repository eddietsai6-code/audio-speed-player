# Professional Audio Engine Design

## Context

`audio-speed-player` is currently a standalone Web Component that changes speed with
`HTMLAudioElement.playbackRate` and keeps pitch enabled through browser-native
`preservesPitch` properties where supported. This keeps the component small and easy
to embed, but extreme slow-down or speed-up can sound artificial because the browser
controls the time-stretching quality.

The next goal is a professional open-source playback engine that lets a learner
change speed in real time while keeping the music closer to the original feel.

## Goals

- Keep the existing easy embed API for normal websites.
- Add a professional open-source engine option for higher quality time-stretching.
- Preserve the original audio file. All processing happens during playback.
- Keep pitch stable by default while speed changes.
- Fall back to the current native engine when the professional engine cannot load.
- Make the engine boundary testable without requiring real audio output in unit tests.

## Non-goals

- Do not build a full DAW or audio editor.
- Do not export processed audio files in the first version.
- Do not require a backend server.
- Do not remove the current native playback engine.
- Do not promise perfectly lossless speed changes. Any time-stretch algorithm can
  produce artifacts at extreme ratios.

## Decision

Use a two-engine architecture:

1. `native` engine
   - Current behavior.
   - Uses `HTMLAudioElement.playbackRate`.
   - Small, reliable, and works from a simple script tag.

2. `rubberband` engine
   - Professional open-source mode.
   - Uses Rubber Band style time-stretching through WebAssembly and AudioWorklet.
   - Intended for higher quality practice playback.
   - Requires GPL-compatible distribution unless a commercial Rubber Band license is
     purchased later.

The component should default to `engine="native"` for compatibility. Users can opt in:

```html
<audio-speed-player src="./song.mp3" engine="rubberband"></audio-speed-player>
```

For teaching sites such as DrumBook, this means the page can start simple and later
enable professional mode per track.

## Architecture

### Component Layer

The Web Component remains the public API. It owns:

- attributes such as `src`, `rate`, `min-rate`, `max-rate`, `preserve-pitch`,
  `no-upload`, and the new `engine`;
- UI rendering and visualizer state;
- user events such as file load, rate changes, and reset;
- choosing and switching the active audio engine.

### Engine Interface

Introduce a small internal engine interface:

```js
class AudioEngine {
  async loadSource(source) {}
  async play() {}
  pause() {}
  setRate(rate) {}
  setPreservePitch(enabled) {}
  connectAnalyser(analyser) {}
  destroy() {}
}
```

The component should talk to this interface instead of directly assuming one playback
implementation.

### Native Engine

The native engine wraps the existing `<audio>` element behavior. This is the fallback
and the compatibility baseline.

### Rubber Band Engine

The professional engine should use:

- `AudioContext` for playback graph ownership;
- `AudioWorklet` for low-latency processing on the audio rendering thread;
- WebAssembly for the time-stretching core;
- a message channel for rate and pitch updates.

The first implementation should prefer real-time mode because the user wants immediate
speed changes while music is playing.

## User Experience

The UI should show a small engine status line:

- `Native engine` when using browser playback.
- `Professional engine` when Rubber Band mode is loaded.
- `Professional engine unavailable, using native engine` when fallback happens.

The existing speed slider stays the main control. No new complicated controls should be
added in the first version.

## Licensing

Rubber Band Library uses dual licensing. For open-source applications, the library is
available under GPL version 2 or later. If this project bundles Rubber Band code or a
Rubber Band WebAssembly build, the project distribution must be GPL-compatible unless
a commercial license is purchased.

Because the user confirmed an open-source direction, the professional version may move
from MIT-only distribution to a GPL-compatible distribution for builds that include the
Rubber Band engine.

Recommended packaging:

- keep `dist/audio-speed-player.js` as the MIT-compatible native build;
- add a separate professional build such as `dist/audio-speed-player-pro.js`;
- clearly document that the professional build is GPL-compatible because it includes
  the Rubber Band engine.

This keeps the simple open web component reusable while making the professional engine
honest about licensing.

## Performance And Limits

- Expected natural range: around `0.75x` to `1.25x`.
- Useful practice range: around `0.5x` to `1.5x`.
- Extreme values can still sound processed.
- AudioWorklet requires a secure context in browsers. Localhost works for development;
  production should use HTTPS.
- WebAssembly loading can fail because of browser support, hosting headers, CSP, or
  mobile device limits. The native engine must remain the fallback.

## Test Strategy

Unit tests should cover:

- parsing the new `engine` attribute;
- choosing `native` by default;
- choosing `rubberband` when requested;
- falling back to `native` when the professional engine fails to initialize;
- preserving current rate-change event behavior;
- keeping source load and file load behavior stable.

Browser smoke tests should cover:

- the component renders with `engine="native"`;
- the component renders with `engine="rubberband"`;
- rate slider changes update the active engine;
- fallback status is visible when the professional engine is unavailable;
- the visualizer still receives analysis data in both modes where supported.

Audio quality verification is partly manual:

- test 0.75x, 1x, and 1.25x with a drum-heavy track;
- listen for pitch drift, warble, timing jitter, dropouts, and obvious artifacts;
- compare against the native engine.

## Implementation Milestones

1. Engine boundary
   - Add `engine` attribute parsing.
   - Add native engine wrapper around current playback behavior.
   - Keep all current tests passing.

2. Fallback shell
   - Add a Rubber Band engine adapter that attempts initialization and falls back
     cleanly.
   - Add UI status for engine selection.

3. WebAssembly integration
   - Add the Rubber Band WebAssembly artifact or build pipeline after auditing the
     source and license.
   - Load it through a dedicated professional build.

4. AudioWorklet streaming
   - Stream decoded audio into the processor.
   - Update time ratio when `setRate()` changes.
   - Keep pitch stable by default.

5. Documentation and release
   - Document native and professional builds separately.
   - Update license notes.
   - Publish demo pages for both engines.

## Risks

- Professional mode may increase bundle size substantially.
- Real-time WebAssembly audio can be difficult on low-end mobile devices.
- Cross-origin audio may block analysis or decoding unless CORS headers are correct.
- GPL-compatible distribution changes how users can reuse the professional build.
- A high-quality implementation may require more than one iteration.

## Sources

- Rubber Band licensing: https://breakfastquay.com/rubberband/license.html
- Rubber Band API notes: https://breakfastquay.com/rubberband/code-doc/
- AudioWorklet browser API: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
