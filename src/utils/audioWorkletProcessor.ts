/**
 * AudioWorklet processor for real-time PCM audio capture.
 *
 * Replaces the deprecated ScriptProcessorNode. Key advantages:
 *  - Runs in the audio thread (no main-thread blocking)
 *  - Continues running when the browser tab is backgrounded
 *  - Uses transferable ArrayBuffers for zero-copy message passing
 *
 * The processor code is embedded as a string and loaded via a Blob URL,
 * so no separate static file needs to be served by Vite.
 */

const PROCESSOR_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const float32 = input[0];
        const int16 = new Int16Array(float32.length);

        for (let i = 0; i < float32.length; i++) {
            // Clamp to [-1, 1] then scale to 16-bit signed integer range
            const s = Math.max(-1, Math.min(1, float32[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Transfer the buffer (zero-copy) to the main thread
        this.port.postMessage(int16.buffer, [int16.buffer]);
        return true; // Keep processor alive
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
