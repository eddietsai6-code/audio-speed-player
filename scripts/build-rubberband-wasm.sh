#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUBBERBAND_VERSION="${RUBBERBAND_VERSION:-4.0.0}"
RUBBERBAND_ARCHIVE="rubberband-${RUBBERBAND_VERSION}.tar.bz2"
RUBBERBAND_URL="https://breakfastquay.com/files/releases/rubberband-${RUBBERBAND_VERSION}.tar.bz2"
BUILD_DIR="${ROOT_DIR}/.build/rubberband-wasm"
SOURCE_DIR="${BUILD_DIR}/rubberband-${RUBBERBAND_VERSION}"
DIST_DIR="${ROOT_DIR}/dist"
WRAPPER="${ROOT_DIR}/src/pro/rubberband-wasm/rubberband-wasm-wrapper.cpp"
OUTPUT="${DIST_DIR}/audio-speed-player-rubberband.mjs"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc is required. Run this script in an Emscripten environment." >&2
  exit 1
fi

mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

if [ ! -f "${BUILD_DIR}/${RUBBERBAND_ARCHIVE}" ]; then
  curl --fail --location --output "${BUILD_DIR}/${RUBBERBAND_ARCHIVE}" "${RUBBERBAND_URL}"
fi

if [ ! -d "${SOURCE_DIR}" ]; then
  tar -xjf "${BUILD_DIR}/${RUBBERBAND_ARCHIVE}" -C "${BUILD_DIR}"
fi

emcc \
  "${WRAPPER}" \
  "${SOURCE_DIR}/single/RubberBandSingle.cpp" \
  -I"${SOURCE_DIR}" \
  -I"${SOURCE_DIR}/rubberband" \
  -I"${SOURCE_DIR}/src" \
  -std=c++11 \
  -O3 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME=createAudioSpeedPlayerRubberBandModule \
  -s ENVIRONMENT=web,worker \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MALLOC=emmalloc \
  -s NO_EXIT_RUNTIME=1 \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","setValue","UTF8ToString"]' \
  -s EXPORTED_FUNCTIONS='["_malloc","_free","_asp_rubberband_version","_asp_rubberband_create","_asp_rubberband_destroy","_asp_rubberband_reset","_asp_rubberband_engine_version","_asp_rubberband_set_playback_rate","_asp_rubberband_samples_required","_asp_rubberband_available","_asp_rubberband_process","_asp_rubberband_retrieve"]' \
  -o "${OUTPUT}"

test -f "${OUTPUT}"
test -f "${DIST_DIR}/audio-speed-player-rubberband.wasm"

echo "Built ${OUTPUT}"
echo "Built ${DIST_DIR}/audio-speed-player-rubberband.wasm"
