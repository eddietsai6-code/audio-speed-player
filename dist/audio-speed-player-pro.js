import {
  defineAudioSpeedPlayer,
  ENGINE_RUBBERBAND,
  registerAudioSpeedPlayerEngineFactory
} from "./audio-speed-player.js";
import { createRubberBandEngine } from "./audio-speed-player-pro.engine.js";

const baseUrl = import.meta.url;

registerAudioSpeedPlayerEngineFactory(ENGINE_RUBBERBAND, ({ audioContext }) =>
  createRubberBandEngine({
    audioContext,
    workletUrl: new URL("./audio-speed-player-pro.worklet.js", baseUrl).href,
    wasmUrl: new URL("./audio-speed-player-rubberband.wasm", baseUrl).href
  })
);

defineAudioSpeedPlayer();
