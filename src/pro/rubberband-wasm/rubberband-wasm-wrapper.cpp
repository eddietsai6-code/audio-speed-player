#include "rubberband/rubberband-c.h"

#include <emscripten/emscripten.h>

namespace {
double playbackRateToTimeRatio(double playbackRate) {
    if (playbackRate <= 0.0) {
        return 1.0;
    }

    return 1.0 / playbackRate;
}
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
const char *asp_rubberband_version() {
    return RUBBERBAND_VERSION;
}

EMSCRIPTEN_KEEPALIVE
RubberBandState asp_rubberband_create(unsigned int sampleRate, unsigned int channels, double playbackRate) {
    RubberBandOptions options =
        RubberBandOptionProcessRealTime |
        RubberBandOptionEngineFaster |
        RubberBandOptionChannelsTogether |
        RubberBandOptionThreadingNever |
        RubberBandOptionPitchHighQuality;

    return rubberband_new(sampleRate, channels, options, playbackRateToTimeRatio(playbackRate), 1.0);
}

EMSCRIPTEN_KEEPALIVE
void asp_rubberband_destroy(RubberBandState state) {
    rubberband_delete(state);
}

EMSCRIPTEN_KEEPALIVE
void asp_rubberband_reset(RubberBandState state) {
    if (state) {
        rubberband_reset(state);
    }
}

EMSCRIPTEN_KEEPALIVE
int asp_rubberband_engine_version(RubberBandState state) {
    return state ? rubberband_get_engine_version(state) : 0;
}

EMSCRIPTEN_KEEPALIVE
void asp_rubberband_set_playback_rate(RubberBandState state, double playbackRate) {
    if (state) {
        rubberband_set_time_ratio(state, playbackRateToTimeRatio(playbackRate));
    }
}

EMSCRIPTEN_KEEPALIVE
unsigned int asp_rubberband_samples_required(RubberBandState state) {
    return state ? rubberband_get_samples_required(state) : 0;
}

EMSCRIPTEN_KEEPALIVE
unsigned int asp_rubberband_available(RubberBandState state) {
    return state ? static_cast<unsigned int>(rubberband_available(state)) : 0;
}

EMSCRIPTEN_KEEPALIVE
void asp_rubberband_process(RubberBandState state, const float *const *input, unsigned int samples, int final) {
    if (state) {
        rubberband_process(state, input, samples, final);
    }
}

EMSCRIPTEN_KEEPALIVE
unsigned int asp_rubberband_retrieve(RubberBandState state, float *const *output, unsigned int samples) {
    return state ? rubberband_retrieve(state, output, samples) : 0;
}

}
