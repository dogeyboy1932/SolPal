const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'crypto-browserify',
  stream: 'stream-browserify',
  buffer: 'buffer',
};

// Add platforms for better cross-platform support
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Add web extensions
config.resolver.sourceExts.push('web.js', 'web.ts', 'web.tsx');

// Add Buffer to global
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
