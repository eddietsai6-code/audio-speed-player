class AudioSpeedPlayerRubberBandProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channelData = [];
    this.position = 0;
    this.rate = 1;
    this.playing = false;
    this.preservePitch = true;
    this.sourceSampleRate = sampleRate;
    this.port.onmessage = (event) => this.handleMessage(event.data || {});
  }

  handleMessage(message) {
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

  bufferLength() {
    return this.channelData[0]?.length || 0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const frameCount = output[0]?.length || 0;
    const bufferLength = this.bufferLength();

    if (!this.playing || !bufferLength || !frameCount) {
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
