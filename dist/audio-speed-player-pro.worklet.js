import createAudioSpeedPlayerRubberBandModule from "./audio-speed-player-rubberband.mjs";

class AudioSpeedPlayerRubberBandProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channelData = [];
    this.position = 0;
    this.rate = 1;
    this.playing = false;
    this.preservePitch = true;
    this.sourceSampleRate = sampleRate;
    this.rubberBand = null;
    this.port.onmessage = (event) => this.handleMessage(event.data || {});
  }

  handleMessage(message) {
    if (message.type === "init-rubberband") {
      this.initRubberBand(message);
      return;
    }

    if (message.type === "load-buffer") {
      this.channelData = (message.channelData || []).map((channel) => new Float32Array(channel));
      this.sourceSampleRate = Number(message.sampleRate) || sampleRate;
      this.position = 0;
      this.port.postMessage({
        type: "buffer-loaded",
        frames: this.bufferLength(),
        sampleRate: this.sourceSampleRate
      });
      return;
    }

    if (message.type === "set-rate") {
      const nextRate = Number(message.rate);
      if (Number.isFinite(nextRate) && nextRate > 0) {
        this.rate = nextRate;
        if (this.rubberBand?.state) {
          this.rubberBand.module._asp_rubberband_set_playback_rate(this.rubberBand.state, nextRate);
        }
      }
      return;
    }

    if (message.type === "set-preserve-pitch") {
      this.preservePitch = Boolean(message.preservePitch);
      return;
    }

    if (message.type === "seek") {
      const seconds = Math.max(0, Number(message.seconds) || 0);
      this.position = Math.min(seconds * this.sourceSampleRate, this.bufferLength());
      return;
    }

    if (message.type === "play") {
      this.playing = true;
      this.port.postMessage({ type: "playing" });
      return;
    }

    if (message.type === "pause") {
      this.playing = false;
      this.port.postMessage({ type: "paused" });
    }
  }

  async initRubberBand(message) {
    try {
      this.destroyRubberBand();
      const module = await createAudioSpeedPlayerRubberBandModule({
        wasmBinary: message.wasmBinary,
        locateFile(path) {
          return path;
        }
      });
      const channels = Math.max(1, Number(message.channels) || 1);
      const nextRate = Number(message.rate) || this.rate;
      const state = module._asp_rubberband_create(Number(message.sampleRate) || sampleRate, channels, nextRate);

      this.rubberBand = {
        module,
        state,
        channels,
        capacity: 0,
        inputPtrArray: 0,
        outputPtrArray: 0,
        inputPtrs: [],
        outputPtrs: []
      };
      this.rate = nextRate;
      this.preservePitch = message.preservePitch !== false;
      this.port.postMessage({
        type: "rubberband-ready",
        version: module.UTF8ToString(module._asp_rubberband_version()),
        engineVersion: module._asp_rubberband_engine_version(state),
        samplesRequired: module._asp_rubberband_samples_required(state)
      });
    } catch (error) {
      this.port.postMessage({
        type: "rubberband-error",
        reason: error.message || String(error)
      });
    }
  }

  bufferLength() {
    return this.channelData[0]?.length || 0;
  }

  ensureRubberBandCapacity(frameCount) {
    const rubberBand = this.rubberBand;
    if (!rubberBand || frameCount <= rubberBand.capacity) {
      return;
    }

    const module = rubberBand.module;
    this.freeRubberBandBuffers();

    rubberBand.capacity = frameCount;
    rubberBand.inputPtrArray = module._malloc(rubberBand.channels * 4);
    rubberBand.outputPtrArray = module._malloc(rubberBand.channels * 4);
    rubberBand.inputPtrs = [];
    rubberBand.outputPtrs = [];

    for (let channelIndex = 0; channelIndex < rubberBand.channels; channelIndex += 1) {
      const inputPtr = module._malloc(frameCount * 4);
      const outputPtr = module._malloc(frameCount * 4);
      rubberBand.inputPtrs.push(inputPtr);
      rubberBand.outputPtrs.push(outputPtr);
      module.HEAPU32[(rubberBand.inputPtrArray >> 2) + channelIndex] = inputPtr;
      module.HEAPU32[(rubberBand.outputPtrArray >> 2) + channelIndex] = outputPtr;
    }
  }

  freeRubberBandBuffers() {
    const rubberBand = this.rubberBand;
    if (!rubberBand) return;

    const module = rubberBand.module;
    rubberBand.inputPtrs.forEach((ptr) => module._free(ptr));
    rubberBand.outputPtrs.forEach((ptr) => module._free(ptr));
    if (rubberBand.inputPtrArray) module._free(rubberBand.inputPtrArray);
    if (rubberBand.outputPtrArray) module._free(rubberBand.outputPtrArray);
    rubberBand.capacity = 0;
    rubberBand.inputPtrArray = 0;
    rubberBand.outputPtrArray = 0;
    rubberBand.inputPtrs = [];
    rubberBand.outputPtrs = [];
  }

  destroyRubberBand() {
    if (!this.rubberBand) return;

    this.freeRubberBandBuffers();
    this.rubberBand.module._asp_rubberband_destroy(this.rubberBand.state);
    this.rubberBand = null;
  }

  feedRubberBand(inputCount, bufferLength) {
    const rubberBand = this.rubberBand;
    if (!rubberBand || !inputCount) return;

    this.ensureRubberBandCapacity(inputCount);
    const module = rubberBand.module;
    const readIndex = Math.floor(this.position);

    for (let channelIndex = 0; channelIndex < rubberBand.channels; channelIndex += 1) {
      const sourceChannel = this.channelData[channelIndex] || this.channelData[0];
      const inputPtr = rubberBand.inputPtrs[channelIndex];
      const inputView = module.HEAPF32.subarray(inputPtr >> 2, (inputPtr >> 2) + inputCount);

      for (let frame = 0; frame < inputCount; frame += 1) {
        inputView[frame] = sourceChannel?.[readIndex + frame] || 0;
      }
    }

    const isFinal = readIndex + inputCount >= bufferLength ? 1 : 0;
    module._asp_rubberband_process(rubberBand.state, rubberBand.inputPtrArray, inputCount, isFinal);
    this.position = readIndex + inputCount;
  }

  renderRubberBand(output, frameCount, bufferLength) {
    const rubberBand = this.rubberBand;
    if (!rubberBand?.state) return false;

    const module = rubberBand.module;
    let outputFrame = 0;
    let attempts = 0;

    while (outputFrame < frameCount && attempts < 64) {
      const available = module._asp_rubberband_available(rubberBand.state);

      if (available <= 0) {
        if (this.position >= bufferLength) {
          this.playing = false;
          break;
        }

        const required = module._asp_rubberband_samples_required(rubberBand.state) || frameCount;
        const inputCount = Math.min(required, bufferLength - Math.floor(this.position));
        this.feedRubberBand(inputCount, bufferLength);
        attempts += 1;
        continue;
      }

      const retrieveCount = Math.min(available, frameCount - outputFrame);
      this.ensureRubberBandCapacity(retrieveCount);
      const retrieved = module._asp_rubberband_retrieve(
        rubberBand.state,
        rubberBand.outputPtrArray,
        retrieveCount
      );

      if (!retrieved) {
        attempts += 1;
        continue;
      }

      for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
        const outputPtr = rubberBand.outputPtrs[Math.min(channelIndex, rubberBand.channels - 1)];
        const outputView = module.HEAPF32.subarray(outputPtr >> 2, (outputPtr >> 2) + retrieved);
        output[channelIndex].set(outputView, outputFrame);
      }

      outputFrame += retrieved;
      attempts = 0;
    }

    return true;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const frameCount = output[0]?.length || 0;
    const bufferLength = this.bufferLength();

    if (!this.playing || !bufferLength || !frameCount) {
      return true;
    }

    if (this.rubberBand?.state && this.renderRubberBand(output, frameCount, bufferLength)) {
      return true;
    }

    for (let frame = 0; frame < frameCount; frame += 1) {
      const readIndex = Math.floor(this.position);
      if (readIndex >= bufferLength) {
        this.playing = false;
        break;
      }

      for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
        const sourceChannel = this.channelData[channelIndex] || this.channelData[0];
        output[channelIndex][frame] = sourceChannel?.[readIndex] || 0;
      }

      this.position += this.rate;
    }

    return true;
  }
}

registerProcessor("audio-speed-player-rubberband", AudioSpeedPlayerRubberBandProcessor);
