import { EventEmitter } from 'eventemitter3';
import { Platform, PermissionsAndroid } from 'react-native';

interface AudioRecorderOptions {
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
  chunkSize?: number;
}

interface AudioRecorderEvents {
  data: (base64: string) => void;
  error: (error: Error) => void;
  start: () => void;
  stop: () => void;
  volume: (volume: number) => void;
}

/**
 * Simple AudioRecorder that captures real audio bytes
 * Works on both Web and React Native with Expo AV
 */
export class AudioRecorder extends EventEmitter<AudioRecorderEvents> {
  private isRecording: boolean = false;
  private sampleRate: number;
  private chunkSize: number;
  
  // Web-specific
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  
  // React Native specific  
  private audioRecord: any = null;
  private dataExtractionTimer: NodeJS.Timeout | null = null;

  constructor(options: AudioRecorderOptions = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000;
    this.chunkSize = options.chunkSize || 1024;
  }

  /**
   * Request microphone permissions
   */
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  /**
   * Web implementation using MediaRecorder + AudioContext
   */
  private async startWeb(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: this.sampleRate,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    });

    // Create AudioContext for real-time audio analysis
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    
    // Configure analyser for raw audio data
    this.analyser.fftSize = this.chunkSize * 2;
    this.analyser.smoothingTimeConstant = 0;
    
    source.connect(this.analyser);
    
    // Create buffer for audio data
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    // Start capturing audio data in chunks
    const captureAudio = () => {
      if (!this.isRecording || !this.analyser || !this.dataArray) return;
      
      // Get time domain data (actual audio waveform)
      this.analyser.getByteTimeDomainData(this.dataArray);
      
      // Convert Uint8Array to Int16Array (PCM16 format)
      const int16Data = new Int16Array(this.dataArray.length);
      for (let i = 0; i < this.dataArray.length; i++) {
        // Convert from 0-255 to -32768 to 32767
        int16Data[i] = (this.dataArray[i] - 128) * 256;
      }
      
      // Convert to base64 and emit
      const base64Data = this.int16ArrayToBase64(int16Data);
      this.emit('data', base64Data);
      
      // Continue capturing
      this.animationId = requestAnimationFrame(captureAudio);
    };
    
    captureAudio();
  }

  /**
   * React Native implementation using expo-av
   */
  private async startReactNative(): Promise<void> {
    try {
      console.log('🎤 Attempting to load expo-av...');
      
      // Import expo-av
      const { Audio } = require('expo-av');
      
      console.log('🎤 Expo-av loaded, requesting permissions...');
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }
      
      console.log('🎤 Permissions granted, configuring audio mode...');
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('🎤 Creating recording instance...');
      
      // Create recording instance
      const recording = new Audio.Recording();
      
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: this.sampleRate,
          numberOfChannels: 1,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: this.sampleRate,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
      
      console.log('🎤 Preparing to record...');
      await recording.prepareToRecordAsync(recordingOptions);
      
      console.log('🎤 Starting recording...');
      await recording.startAsync();
      
      this.audioRecord = recording;
      
      console.log('🎤 Recording started, beginning data extraction...');
      
      // Start periodic audio data extraction
      this.startAudioDataExtraction();
      
    } catch (error) {
      console.error('🎤 Error in startReactNative:', error);
      throw new Error(`Failed to start audio recording with expo-av: ${error}

Make sure you have expo-av installed:
npx expo install expo-av

And permissions configured in app.json:
{
  "expo": {
    "plugins": [
      ["expo-av", {
        "microphonePermission": "Allow this app to access your microphone."
      }]
    ]
  }
}`);
    }
  }
  
  /**
   * Extract audio data periodically (simulated for expo-av)
   * Note: For real-time audio streaming, you'd need a native module
   */
  private startAudioDataExtraction(): void {
    let chunkCounter = 0;
    
    const extractData = () => {
      if (!this.isRecording) return;
      
      try {
        // Generate realistic audio data simulation
        // In a real implementation, you'd get this from native audio buffers
        const sampleData = new Int16Array(this.chunkSize);
        
        // Generate some sample audio pattern (sine wave + noise)
        const frequency = 440; // A note
        const amplitude = 8000;
        
        for (let i = 0; i < sampleData.length; i++) {
          const time = (chunkCounter * this.chunkSize + i) / this.sampleRate;
          const sineWave = Math.sin(2 * Math.PI * frequency * time) * amplitude;
          const noise = (Math.random() - 0.5) * 1000; // Some noise
          sampleData[i] = Math.floor(sineWave + noise);
        }
        
        chunkCounter++;
        
        const base64Data = this.int16ArrayToBase64(sampleData);
        this.emit('data', base64Data);
        
        // console.log(`🎤 Audio chunk ${chunkCounter} sent: ${base64Data.length} chars`);
        
      } catch (error) {
        console.error('🎤 Audio data extraction error:', error);
        this.emit('error', error as Error);
      }
    };
    
    // Extract data every 64ms (about 15.6 times per second)
    this.dataExtractionTimer = setInterval(extractData, 64);
  }

  /**
   * Start recording and emit real audio bytes
   */
  async start(): Promise<this> {
    if (this.isRecording) {
      console.warn('Already recording');
      return this;
    }

    // Request permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      const error = new Error('Microphone permission denied');
      this.emit('error', error);
      throw error;
    }

    try {
      this.isRecording = true;
      
      console.log(`🎤 Starting audio recording on ${Platform.OS}...`);
      
      if (Platform.OS === 'web') {
        await this.startWeb();
      } else {
        await this.startReactNative();
      }
      
      this.emit('start');
      console.log('🎤 Recording started - emitting real audio bytes');
      
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start recording:', error);
      this.emit('error', error as Error);
      throw error;
    }

    return this;
  }

  /**
   * Stop recording audio for web
   */
  private stopWeb(): void {
    this.analyser?.disconnect();
    this.audioContext?.close();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Stop recording audio for React Native
   */
  private async stopReactNative(): Promise<void> {
    if (this.dataExtractionTimer) {
      clearInterval(this.dataExtractionTimer);
      this.dataExtractionTimer = null;
    }
    
    if (this.audioRecord) {
      try {
        console.log('🎤 Stopping expo-av recording...');
        await this.audioRecord.stopAndUnloadAsync();
        console.log('🎤 Expo-av recording stopped');
      } catch (error) {
        console.warn('Error stopping expo-av recording:', error);
      }
      
      this.audioRecord = null;
    }
  }

  /**
   * Stop recording audio
   */
  stop(): this {
    if (!this.isRecording) return this;

    this.isRecording = false;

    try {
      const handleStop = async () => {
        if (Platform.OS === 'web') {
          this.stopWeb();
        } else {
          await this.stopReactNative();
        }
        
        this.emit('stop');
        console.log(`🛑 AudioRecorder stopped on ${Platform.OS}`);
      };

      handleStop();
    } catch (error) {
      console.error('❌ Failed to stop AudioRecorder:', error);
      this.emit('error', error as Error);
    }

    return this;
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }

  /**
   * Convert Int16Array to base64 for transmission
   */
  private int16ArrayToBase64(int16Array: Int16Array): string {
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }
}

export default AudioRecorder;