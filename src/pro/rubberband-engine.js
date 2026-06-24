import { ENGINE_RUBBERBAND } from "../../dist/audio-speed-player.js";

export const RUBBERBAND_PROCESSOR_NAME = "audio-speed-player-rubberband";
export const RUBBERBAND_WORKLET_MESSAGE_TYPES = new Set([
  "init-rubberband",
  "load-buffer",
  "set-rate",
  "set-preserve-pitch",
  "play",
  "pause",
  "seek"
]);

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

export function createRubberBandMessage(type, payload = {}) {
  if (!RUBBERBAND_WORKLET_MESSAGE_TYPES.has(type)) {
    throw new Error(`Unsupported Rubber Band worklet message: ${type}`);
  }

  return {
    type,
    ...payload
  };
}

export function createLoadBufferMessage(audioBuffer) {
  if (!audioBuffer || typeof audioBuffer.getChannelData !== "function") {
    throw new Error("Decoded AudioBuffer is required");
  }

  const channelData = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => {
    return new Float32Array(audioBuffer.getChannelData(index));
  });

  return createRubberBandMessage("load-buffer", {
    channelData,
    sampleRate: audioBuffer.sampleRate
  });
}

export function getRubberBandMessageTransfers(message) {
  if (message?.type !== "load-buffer") {
    return [];
  }

  return (message.channelData || []).map((channel) => channel.buffer).filter(Boolean);
}

async function fetchArrayBuffer(source, hooks) {
  if (source instanceof ArrayBuffer) {
    return source;
  }

  if (source?.arrayBuffer) {
    return source.arrayBuffer();
  }

  if (!hooks.fetch) {
    throw new Error("fetch unavailable");
  }

  const response = await hooks.fetch(source);
  return response.arrayBuffer();
}

export function createRubberBandEngine(options = {}) {
  const audioContext = options.audioContext || null;
  const workletUrl = options.workletUrl || "";
  const wasmUrl = options.wasmUrl || "";
  const hooks = options.hooks || globalThis;
  let unavailableReason = !audioContext ? "AudioContext unavailable" : "";
  let workletNode = null;
  let rate = 1;
  let preservePitch = true;

  async function ensureWorkletNode() {
    if (!audioContext) {
      throw new Error("AudioContext unavailable");
    }

    if (!workletUrl) {
      throw new Error("Rubber Band worklet URL is required");
    }

    if (!audioContext.audioWorklet?.addModule) {
      throw new Error("AudioWorklet unavailable");
    }

    if (workletNode) {
      return workletNode;
    }

    const AudioWorkletNodeCtor = hooks.AudioWorkletNode || globalThis.AudioWorkletNode;
    if (!AudioWorkletNodeCtor) {
      throw new Error("AudioWorkletNode unavailable");
    }

    await audioContext.audioWorklet.addModule(workletUrl);
    workletNode = new AudioWorkletNodeCtor(audioContext, RUBBERBAND_PROCESSOR_NAME);
    workletNode.connect?.(audioContext.destination);
    return workletNode;
  }

  return {
    name: ENGINE_RUBBERBAND,
    get unavailableReason() {
      return unavailableReason;
    },
    workletUrl,
    wasmUrl,
    async loadSource(source) {
      try {
        const node = await ensureWorkletNode();
        const bytes = await fetchArrayBuffer(source, hooks);
        const decoded = await audioContext.decodeAudioData(bytes);

        if (wasmUrl) {
          const wasmBinary = await fetchArrayBuffer(wasmUrl, hooks);
          node.port.postMessage(
            createRubberBandMessage("init-rubberband", {
              wasmBinary,
              sampleRate: decoded.sampleRate,
              channels: decoded.numberOfChannels,
              rate,
              preservePitch
            }),
            [wasmBinary]
          );
        }

        const message = createLoadBufferMessage(decoded);
        node.port.postMessage(message, getRubberBandMessageTransfers(message));
        unavailableReason = "";
        return source || "";
      } catch (error) {
        unavailableReason = error.message || "Professional engine unavailable";
        throw error;
      }
    },
    async play() {
      workletNode?.port?.postMessage(createRubberBandMessage("play"));
    },
    pause() {
      workletNode?.port?.postMessage(createRubberBandMessage("pause"));
    },
    setRate(value) {
      const nextRate = Number(value);
      if (Number.isFinite(nextRate)) {
        rate = nextRate;
        workletNode?.port?.postMessage(createRubberBandMessage("set-rate", { rate: nextRate }));
      }
      return nextRate;
    },
    setPreservePitch(value) {
      preservePitch = Boolean(value);
      workletNode?.port?.postMessage(createRubberBandMessage("set-preserve-pitch", { preservePitch }));
      return preservePitch;
    },
    connectAnalyser() {
      return false;
    },
    destroy() {
      workletNode?.disconnect?.();
      workletNode = null;
    }
  };
}
