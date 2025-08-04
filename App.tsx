import './polyfill';
import React from 'react';
import { Platform } from 'react-native';

// Import CSS only for web
if (Platform.OS === 'web') {
  require('./global.css');
}
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { WalletProvider } from './src/contexts/WalletContext';
import { GeminiProvider } from './src/features/ai/GeminiContext';
import { NodeProvider } from './src/contexts/NodeContext';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <GluestackUIProvider>
      <SafeAreaProvider>
        <WalletProvider>
          <NodeProvider>
            <GeminiProvider>
              <View className="flex-1 bg-gray-50">
                <HomeScreen />
                <StatusBar style="dark" />
                <Toast />
              </View>
            </GeminiProvider>
          </NodeProvider>
        </WalletProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
