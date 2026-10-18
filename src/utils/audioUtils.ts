/**
 * Audio conversion utilities for Gemini Live API
 */

// Convert base64 string to Int16Array safely with little-endian parsing
export function base64ToInt16Array(base64: string): Int16Array {
  const binaryString = atob(base64);
  const sampleCount = Math.floor(binaryString.length / 2);
  const int16Array = new Int16Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const low = binaryString.charCodeAt(i * 2);
    const high = binaryString.charCodeAt(i * 2 + 1);
    let sample = (high << 8) | low;
    if (sample >= 0x8000) sample -= 0x10000;
    int16Array[i] = sample;
  }
  return int16Array;
}

// Convert Int16Array to Float32Array (-1.0 to 1.0)
export function int16ToFloat32Array(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const val = int16Array[i];
    float32Array[i] = val < 0 ? val / 32768 : val / 32767;
  }
  return float32Array;
}

// Convert Float32Array to 16-bit PCM little-endian and return base64
export function float32ToBase64Pcm(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const uint8 = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Downsample float32 audio buffer to target sample rate (e.g. 16000Hz)
export function downsampleBuffer(
  buffer: Float32Array,
  sampleRate: number,
  targetRate = 16000
): Float32Array {
  if (sampleRate === targetRate) {
    return buffer;
  }
  if (sampleRate < targetRate) {
    return buffer;
  }
  const sampleRateRatio = sampleRate / targetRate;
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
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Audio queue manager for gapless playback of 24kHz PCM from Gemini Live
export class AudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isMuted = false;

  constructor() {}

  public initContext() {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (_) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public playChunk(base64Pcm: string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    try {
      const int16 = base64ToInt16Array(base64Pcm);
      if (int16.length === 0) return;
      const float32 = int16ToFloat32Array(int16);

      // Web Audio API automatically resamples 24kHz buffer to output device rate
      const buffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      // Schedule gapless playback
      const startTime = Math.max(now, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (e) {
      console.error('[AudioPlayer] Error playing chunk:', e);
    }
  }

  public interrupt() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.interrupt();
    }
  }

  public close() {
    this.interrupt();
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
