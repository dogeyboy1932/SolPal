import { EventEmitter } from 'eventemitter3';
import { Platform } from 'react-native';

interface AudioRecorderOptions {
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
  audioSource?: number;
  bufferSize?: number;
}

interface AudioRecorderEvents {
  data: (base64: string) => void;
  error: (error: Error) => void;
  start: () => void;
  stop: () => void;
  volume: (volume: number) => void;
}

// Audio processing worklet for web environment (from mcpb-latent)
const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {
  // send and clear buffer every 2048 samples, 
  // which at 16khz is about 8 times a second
  buffer = new Int16Array(2048);

  // current write index
  bufferWriteIndex = 0;

  constructor() {
    super();
    this.hasAudio = false;
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#] so to access first inputs 1st channel inputs[0][0]
   * @param outputs Float32Array[][]
   */
  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer(){
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
      },
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    const l = float32Array.length;
    
    for (let i = 0; i < l; i++) {
      // convert float32 -1 to 1 to int16 -32768 to 32767
      const int16Value = float32Array[i] * 32768;
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if(this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }

    if(this.bufferWriteIndex >= this.buffer.length) {
      this.sendAndClearBuffer();
    }
  }
}
registerProcessor('audio-recorder-worklet', AudioProcessingWorklet);
`;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createWorkletFromSrc(name: string, src: string) {
  const blob = new Blob([src], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

/**
 * AudioRecorder class adapted from mcpb-latent for React Native/Web
 * Provides real-time audio recording with PCM16@16kHz output for Gemini Live
 */
export class AudioRecorder extends EventEmitter<AudioRecorderEvents> {
  private stream: MediaStream | undefined;
  private audioContext: AudioContext | undefined;
  private source: MediaStreamAudioSourceNode | undefined;
  private isRecording: boolean = false;
  private recordingWorklet: AudioWorkletNode | undefined;
  private sampleRate: number;
  private starting: Promise<void> | null = null;
  
  constructor(options: AudioRecorderOptions = {}) {
    super();
    
    this.sampleRate = options.sampleRate || 16000; // Match Gemini Live requirement
  }
  
  /**
   * Start recording audio and emit data events
   */
  async start(): Promise<this> {
    if (this.isRecording) {
      console.warn('AudioRecorder is already recording');
      return this;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error("Could not request user media");
      this.emit('error', error);
      throw error;
    }

    try {
      this.starting = new Promise(async (resolve, reject) => {
        try {
          // Request microphone access
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Create audio context with correct sample rate
          this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
          this.source = this.audioContext.createMediaStreamSource(this.stream);

          // Create and register audio worklet
          const workletName = "audio-recorder-worklet";
          const src = createWorkletFromSrc(workletName, AudioRecordingWorklet);

          await this.audioContext.audioWorklet.addModule(src);
          this.recordingWorklet = new AudioWorkletNode(this.audioContext, workletName);

          // Handle audio data from worklet
          this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
            const arrayBuffer = ev.data.data.int16arrayBuffer;
            if (arrayBuffer) {
              const arrayBufferString = arrayBufferToBase64(arrayBuffer);
              this.emit("data", arrayBufferString);
            }
          };

          // Connect audio source to worklet
          this.source.connect(this.recordingWorklet);
          
          this.isRecording = true;
          this.emit('start');
          resolve();
          this.starting = null;
          
          console.log('🎤 AudioRecorder started');
        } catch (error) {
          reject(error);
        }
      });
      
      await this.starting;
    } catch (error) {
      console.error('❌ Failed to start AudioRecorder:', error);
      this.emit('error', error as Error);
      throw error;
    }

    return this;
  }

  /**
   * Stop recording audio
   */
  stop(): this {
    if (!this.isRecording) {
      return this;
    }

    try {
      // Handle stop - may be called before start completes
      const handleStop = () => {
        this.source?.disconnect();
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = undefined;
        this.recordingWorklet = undefined;
        this.audioContext?.close();
        this.audioContext = undefined;
        this.isRecording = false;
        this.emit('stop');
        console.log('🛑 AudioRecorder stopped');
      };

      if (this.starting) {
        this.starting.then(handleStop);
        return this;
      }
      
      handleStop();
    } catch (error) {
      console.error('❌ Failed to stop AudioRecorder:', error);
      this.emit('error', error as Error);
    }

    return this;
  }
  
  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }
}

export default AudioRecorder;
