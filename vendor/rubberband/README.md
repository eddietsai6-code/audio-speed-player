# Rubber Band Vendor Notes

This directory records the Rubber Band source and build provenance for the
professional audio engine build. The current native build does not bundle Rubber
Band code.

## Source

- Project: Rubber Band Library
- Version: 4.0.0
- Release date: 2024-10-25
- Home page: https://breakfastquay.com/rubberband/
- Source release: https://breakfastquay.com/files/releases/rubberband-4.0.0.tar.bz2
- Official code project: https://code.breakfastquay.com/projects/rubberband
- Official GitHub mirror: https://github.com/breakfastquay/rubberband
- License page: https://breakfastquay.com/rubberband/license.html
- License text location: upstream `COPYING` file

## License

Rubber Band Library is available for open-source use under the GNU General
Public License, version 2 or later. The upstream project also offers commercial
licensing for proprietary distribution.

## Distribution

`dist/audio-speed-player-pro.js` and related WebAssembly/worklet artifacts must
be distributed under GPL-compatible terms when they bundle or link Rubber Band
code.

The default `dist/audio-speed-player.js` native build remains separate and does
not bundle Rubber Band.

## Integration Notes

Rubber Band provides real-time processing mode for streaming audio. That mode is
the intended target for this project because learners need to move the speed
slider while playback continues.
