/**
 * AudioWorklet processor for real-time PCM audio capture with native-rate downsampling
 * and optimal chunk buffering for Azure Speech SDK.
 *
 * Audio Flow:
 *  1. Receives native hardware Float32 samples from Web Audio API (typically 48000 Hz / 44100 Hz).
 *  2. Downsamples Float32 samples to 16000 Hz using linear interpolation.
 *  3. Converts Float32 -> 16-bit Int16 PCM.
 *  4. Accumulates Int16 samples until a 40ms buffer (640 samples = 1280 bytes) is reached.
 *  5. Posts 1280-byte ArrayBuffer over WebSocket to backend.
 */

const PROCESSOR_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        const opts = (options && options.processorOptions) || {};
        this._inputSampleRate = opts.inputSampleRate || (typeof sampleRate !== 'undefined' ? sampleRate : 48000);
        this._targetSampleRate = 16000;
        this._ratio = this._inputSampleRate / this._targetSampleRate;

        this._inputBuffer = [];
        this._outputSamples = [];
        // 640 samples @ 16kHz = 40ms of audio = 1280 bytes (Int16)
        this._targetChunkSamples = 640;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const float32 = input[0];
        for (let i = 0; i < float32.length; i++) {
            this._inputBuffer.push(float32[i]);
        }

        const generatedSamples = Math.floor((this._inputBuffer.length - 1) / this._ratio);
        if (generatedSamples > 0) {
            for (let i = 0; i < generatedSamples; i++) {
                const srcIdx = i * this._ratio;
                const idx = Math.floor(srcIdx);
                const frac = srcIdx - idx;
                const s1 = this._inputBuffer[idx];
                const s2 = this._inputBuffer[idx + 1];
                const sample = (s1 !== undefined && s2 !== undefined) ? (s1 + (s2 - s1) * frac) : (s1 || 0);
                const clamped = Math.max(-1, Math.min(1, sample));
                const int16Val = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
                this._outputSamples.push(int16Val);
            }

            const consumedInputCount = Math.floor(generatedSamples * this._ratio);
            this._inputBuffer = this._inputBuffer.slice(consumedInputCount);
        }

        // Post 1280-byte (640 sample = 40ms) frames to main thread
        while (this._outputSamples.length >= this._targetChunkSamples) {
            const chunkSamples = this._outputSamples.slice(0, this._targetChunkSamples);
            this._outputSamples = this._outputSamples.slice(this._targetChunkSamples);
            
            const int16Array = new Int16Array(chunkSamples);
            this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
        }

        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
`;

/**
 * Creates a Blob URL for the AudioWorklet processor module.
 * Call URL.revokeObjectURL() on the returned URL when the AudioContext is closed.
 */
export const createWorkletBlobUrl = (): string => {
    const blob = new Blob([PROCESSOR_CODE], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
};
