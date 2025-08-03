// Audio functionality - commented out for React Native compatibility
// Placeholder for React Native compatibility

export class AudioRecorder {
  recording = false;
  
  constructor(sampleRate = 16000) {
    console.log('Audio recording not available in React Native');
  }

  async start() {
    console.log('Audio recording not available in React Native');
    return Promise.resolve();
  }
  
  async stop() {
    console.log('Audio recording not available in React Native');
    return Promise.resolve();
  }
  
  pause() {
    console.log('Audio recording not available in React Native');
  }
  
  resume() {
    console.log('Audio recording not available in React Native');
  }
  
  on() {
    return this;
  }
  
  off() {
    return this;
  }
}
