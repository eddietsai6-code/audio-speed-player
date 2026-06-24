import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPresetRates,
  clampRate,
  defineAudioSpeedPlayer,
  ENGINE_NATIVE,
  ENGINE_RUBBERBAND,
  formatEngineStatus,
  formatRate,
  NativeAudioEngine,
  normalizeEngineName,
  parseBooleanAttribute,
  parseRateAttribute
} from "../dist/audio-speed-player.js";
import { createRubberBandEngine } from "../src/pro/rubberband-engine.js";

function createFakeAudio() {
  return {
    defaultPlaybackRate: 1,
    playbackRate: 1,
    preservesPitch: true,
    mozPreservesPitch: true,
    webkitPreservesPitch: true,
    src: "",
    loadCalls: 0,
    playCalls: 0,
    pauseCalls: 0,
    load() {
      this.loadCalls += 1;
    },
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
    pause() {
      this.pauseCalls += 1;
    }
  };
}

test("clampRate keeps values inside the configured speed range", () => {
  assert.equal(clampRate(0.1, 0.25, 2), 0.25);
  assert.equal(clampRate(3, 0.25, 2), 2);
  assert.equal(clampRate(1.25, 0.25, 2), 1.25);
});

test("formatRate displays compact playback labels", () => {
  assert.equal(formatRate(1), "1x");
  assert.equal(formatRate(1.5), "1.5x");
  assert.equal(formatRate(0.75), "0.75x");
  assert.equal(formatRate(1.25), "1.25x");
});

test("parseRateAttribute returns a numeric fallback for invalid values", () => {
  assert.equal(parseRateAttribute("1.2", 1), 1.2);
  assert.equal(parseRateAttribute("bad", 0.75), 0.75);
  assert.equal(parseRateAttribute(null, 1), 1);
});

test("parseBooleanAttribute handles HTML-style boolean values", () => {
  assert.equal(parseBooleanAttribute("", true), true);
  assert.equal(parseBooleanAttribute("false", true), false);
  assert.equal(parseBooleanAttribute("0", true), false);
  assert.equal(parseBooleanAttribute(null, true), true);
  assert.equal(parseBooleanAttribute(null, false), false);
});

test("normalizeEngineName accepts native and rubberband engines only", () => {
  assert.equal(normalizeEngineName(null), ENGINE_NATIVE);
  assert.equal(normalizeEngineName(""), ENGINE_NATIVE);
  assert.equal(normalizeEngineName("native"), ENGINE_NATIVE);
  assert.equal(normalizeEngineName(" Native "), ENGINE_NATIVE);
  assert.equal(normalizeEngineName("rubberband"), ENGINE_RUBBERBAND);
  assert.equal(normalizeEngineName("RUBBERBAND"), ENGINE_RUBBERBAND);
  assert.equal(normalizeEngineName("unknown"), ENGINE_NATIVE);
});

test("NativeAudioEngine applies rate and pitch mode to an audio element", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  engine.setRate(0.75);
  engine.setPreservePitch(false);

  assert.equal(audio.defaultPlaybackRate, 0.75);
  assert.equal(audio.playbackRate, 0.75);
  assert.equal(audio.preservesPitch, false);
  assert.equal(audio.mozPreservesPitch, false);
  assert.equal(audio.webkitPreservesPitch, false);
});

test("NativeAudioEngine exposes the native engine interface", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  assert.equal(engine.name, ENGINE_NATIVE);
  assert.equal(engine.connectAnalyser(), false);
  assert.doesNotThrow(() => engine.destroy());
});

test("NativeAudioEngine applies stored rate through applyRate", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  engine.rate = 1.4;
  engine.applyRate();

  assert.equal(audio.defaultPlaybackRate, 1.4);
  assert.equal(audio.playbackRate, 1.4);
});

test("NativeAudioEngine applies stored pitch mode through applyPitchMode", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  engine.preservePitch = false;
  engine.applyPitchMode();

  assert.equal(audio.preservesPitch, false);
  assert.equal(audio.mozPreservesPitch, false);
  assert.equal(audio.webkitPreservesPitch, false);
});

test("NativeAudioEngine loads sources and keeps playback controls delegated", async () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  assert.equal(engine.loadSource("./lesson.mp3"), "./lesson.mp3");
  await engine.play();
  engine.pause();

  assert.equal(audio.src, "./lesson.mp3");
  assert.equal(audio.loadCalls, 1);
  assert.equal(audio.playCalls, 1);
  assert.equal(audio.pauseCalls, 1);
});

test("NativeAudioEngine reapplies stored rate and pitch state after loading a source", () => {
  const audio = createFakeAudio();
  const engine = new NativeAudioEngine(audio);

  engine.setRate(0.75);
  engine.setPreservePitch(false);
  audio.defaultPlaybackRate = 1;
  audio.playbackRate = 1;
  audio.preservesPitch = true;
  audio.mozPreservesPitch = true;
  audio.webkitPreservesPitch = true;

  assert.equal(engine.loadSource("./next.mp3"), "./next.mp3");

  assert.equal(audio.src, "./next.mp3");
  assert.equal(audio.loadCalls, 1);
  assert.equal(audio.defaultPlaybackRate, 0.75);
  assert.equal(audio.playbackRate, 0.75);
  assert.equal(audio.preservesPitch, false);
  assert.equal(audio.mozPreservesPitch, false);
  assert.equal(audio.webkitPreservesPitch, false);
});

test("formatEngineStatus describes active and fallback engines", () => {
  assert.equal(formatEngineStatus(ENGINE_NATIVE, ENGINE_NATIVE), "Native engine");
  assert.equal(formatEngineStatus(ENGINE_RUBBERBAND, ENGINE_RUBBERBAND), "Professional engine");
  assert.equal(
    formatEngineStatus(ENGINE_NATIVE, ENGINE_RUBBERBAND),
    "Professional engine unavailable, using native engine"
  );
});

test("createRubberBandEngine exposes the professional engine boundary", () => {
  const engine = createRubberBandEngine({
    audioContext: { sampleRate: 48000 },
    wasmUrl: "./rubberband.wasm",
    workletUrl: "./audio-speed-player-pro.worklet.js"
  });

  assert.equal(engine.name, ENGINE_RUBBERBAND);
  assert.equal(engine.unavailableReason, "");
  assert.equal(engine.wasmUrl, "./rubberband.wasm");
  assert.equal(engine.workletUrl, "./audio-speed-player-pro.worklet.js");
  assert.equal(typeof engine.loadSource, "function");
  assert.equal(typeof engine.play, "function");
  assert.equal(typeof engine.pause, "function");
  assert.equal(typeof engine.setRate, "function");
  assert.equal(typeof engine.setPreservePitch, "function");
  assert.equal(typeof engine.connectAnalyser, "function");
  assert.equal(typeof engine.destroy, "function");
  assert.equal(engine.connectAnalyser(), false);
});

test("createRubberBandEngine reports when AudioContext is unavailable", () => {
  const engine = createRubberBandEngine();

  assert.equal(engine.name, ENGINE_RUBBERBAND);
  assert.equal(engine.unavailableReason, "AudioContext unavailable");
});

test("buildPresetRates filters and sorts preset speeds", () => {
  assert.deepEqual(buildPresetRates(0.75, 1.25, [1.5, 1, 0.5, 0.75, 1.25]), [0.75, 1, 1.25]);
});

test("defineAudioSpeedPlayer is safe to call without a browser DOM", () => {
  assert.equal(defineAudioSpeedPlayer(), false);
});
