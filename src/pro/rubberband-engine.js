import { ENGINE_RUBBERBAND } from "../../dist/audio-speed-player.js";

export async function loadRubberBandWasm(wasmUrl, hooks = globalThis) {
  if (!wasmUrl) {
    throw new Error("Rubber Band WASM URL is required");
  }

  if (hooks.WebAssembly?.instantiateStreaming && hooks.fetch) {
    return hooks.WebAssembly.instantiateStreaming(hooks.fetch(wasmUrl), {});
  }

  const response = await hooks.fetch(wasmUrl);
  const bytes = await response.arrayBuffer();
  return hooks.WebAssembly.instantiate(bytes, {});
}

export function createRubberBandEngine(options = {}) {
  const audioContext = options.audioContext || null;
  const workletUrl = options.workletUrl || "";
  const wasmUrl = options.wasmUrl || "";

  return {
    name: ENGINE_RUBBERBAND,
    unavailableReason: !audioContext ? "AudioContext unavailable" : "",
    workletUrl,
    wasmUrl,
    async loadSource() {},
    async play() {},
    pause() {},
    setRate() {},
    setPreservePitch() {},
    connectAnalyser() {
      return false;
    },
    destroy() {}
  };
}
