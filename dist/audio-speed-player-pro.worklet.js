class AudioSpeedPlayerRubberBandProcessor extends AudioWorkletProcessor {
  process() {
    return true;
  }
}

registerProcessor("audio-speed-player-rubberband", AudioSpeedPlayerRubberBandProcessor);
