// Simple web polyfills for Solana libraries
import { Buffer } from 'buffer';

// Set up global Buffer
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Set up global process
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    version: '',
    platform: 'browser',
    nextTick: (fn) => Promise.resolve().then(fn),
  };
}

// Set up global for older environments
if (typeof global === 'undefined') {
  globalThis.global = globalThis;
}

export {};
