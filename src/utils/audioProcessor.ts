/**
 * Audio processing utility for real-time speech-to-text.
 * Handles downsampling and PCM conversion.
 */

export const downsampleBuffer = (
  buffer: Float32Array, 
  sourceSampleRate: number, 
  targetSampleRate: number
): Float32Array => {
  if (sourceSampleRate === targetSampleRate) {
    return buffer;
  }
  
  const sampleRateRatio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  let offsetResult = 0;
  let offsetBuffer = 0;
  
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

export const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit PCM - [−32768, 32767]
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

/**
 * Creates a PCM chunk for WebSocket transmission
 */
export const prepareAudioChunk = (float32Array: Float32Array, sourceSampleRate: number): ArrayBuffer => {
    // 1. Downsample to 16kHz
    const downsampled = downsampleBuffer(float32Array, sourceSampleRate, 16000);
    // 2. Convert to 16-bit PCM (Int16Array)
    return floatTo16BitPCM(downsampled);
};
