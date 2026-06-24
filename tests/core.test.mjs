import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPresetRates,
  clampRate,
  defineAudioSpeedPlayer,
  ENGINE_NATIVE,
  ENGINE_RUBBERBAND,
  formatRate,
  normalizeEngineName,
  parseBooleanAttribute,
  parseRateAttribute
} from "../dist/audio-speed-player.js";

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

test("buildPresetRates filters and sorts preset speeds", () => {
  assert.deepEqual(buildPresetRates(0.75, 1.25, [1.5, 1, 0.5, 0.75, 1.25]), [0.75, 1, 1.25]);
});

test("defineAudioSpeedPlayer is safe to call without a browser DOM", () => {
  assert.equal(defineAudioSpeedPlayer(), false);
});
