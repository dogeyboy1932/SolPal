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

// UI Library Providers
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Provider as PaperProvider } from 'react-native-paper';

// Coffee Shop Theme Configuration
import { warmAIPaperTheme, warmAIGluestackConfig } from './src/config/theme';

// App Context Providers
import { WalletProvider } from './src/contexts/WalletContext';
import { GeminiProvider } from './src/features/ai/GeminiContext';
import { NodeProvider } from './src/contexts/NodeContext';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <GluestackUIProvider config={warmAIGluestackConfig}>
      <PaperProvider theme={warmAIPaperTheme}>
        <SafeAreaProvider>
          <WalletProvider>
            <NodeProvider>
              <GeminiProvider>
                <View className="flex-1 bg-surface-primary">
                  <HomeScreen />
                  <StatusBar style="light" backgroundColor="#1A1A1A" />
                  <Toast />
                </View>
              </GeminiProvider>
            </NodeProvider>
          </WalletProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </GluestackUIProvider>
  );
}
