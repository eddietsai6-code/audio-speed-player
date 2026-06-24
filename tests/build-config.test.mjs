import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("Rubber Band WASM build script uses the free official source and Emscripten", async () => {
  const path = new URL("scripts/build-rubberband-wasm.sh", ROOT);
  assert.equal(existsSync(path), true);

  const script = await readProjectFile("scripts/build-rubberband-wasm.sh");
  assert.match(script, /RUBBERBAND_VERSION[^\n]+4\.0\.0/);
  assert.match(script, /breakfastquay\.com\/files\/releases\/rubberband-\$\{RUBBERBAND_VERSION\}\.tar\.bz2/);
  assert.match(script, /single\/RubberBandSingle\.cpp/);
  assert.match(script, /\bemcc\b/);
  assert.match(script, /audio-speed-player-rubberband\.mjs/);
  assert.match(script, /audio-speed-player-rubberband\.wasm/);
});

test("Rubber Band WASM wrapper exposes the realtime engine boundary", async () => {
  const path = new URL("src/pro/rubberband-wasm/rubberband-wasm-wrapper.cpp", ROOT);
  assert.equal(existsSync(path), true);

  const wrapper = await readProjectFile("src/pro/rubberband-wasm/rubberband-wasm-wrapper.cpp");
  assert.match(wrapper, /rubberband\/rubberband-c\.h/);
  assert.match(wrapper, /RubberBandOptionProcessRealTime/);
  assert.match(wrapper, /asp_rubberband_create/);
  assert.match(wrapper, /asp_rubberband_set_playback_rate/);
  assert.match(wrapper, /asp_rubberband_process/);
  assert.match(wrapper, /asp_rubberband_retrieve/);
});

test("GitHub Actions can build and publish the free WASM artifact", async () => {
  const path = new URL(".github/workflows/build-rubberband-wasm.yml", ROOT);
  assert.equal(existsSync(path), true);

  const workflow = await readProjectFile(".github/workflows/build-rubberband-wasm.yml");
  assert.match(workflow, /Build Rubber Band WASM/);
  assert.match(workflow, /emscripten\/emsdk/);
  assert.match(workflow, /scripts\/build-rubberband-wasm\.sh/);
  assert.match(workflow, /actions\/upload-artifact/);
  assert.match(workflow, /rubberband-wasm/);
});
