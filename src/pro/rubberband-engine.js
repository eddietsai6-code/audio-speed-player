import { ENGINE_RUBBERBAND } from "../../dist/audio-speed-player.js";

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
