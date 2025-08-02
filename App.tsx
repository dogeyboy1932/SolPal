import './polyfill';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './src/contexts/WalletContext';
import { GeminiProvider } from './src/ai/GeminiContext';
import { NodeProvider } from './src/contexts/NodeContext';
import { AIConnectionProvider } from './src/contexts/AIConnectionContext';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NodeProvider>
          <GeminiProvider>
            <AIConnectionProvider>
              <View style={styles.container}>
                <HomeScreen />
                <StatusBar style="auto" />
                <Toast />
              </View>
            </AIConnectionProvider>
          </GeminiProvider>
        </NodeProvider>
      </WalletProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
