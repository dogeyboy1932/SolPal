import './polyfill';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { WalletProvider } from './src/contexts/WalletContext';
import { GeminiProvider } from './src/ai/GeminiContext';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <WalletProvider>
      <GeminiProvider>
        <View style={styles.container}>
          <HomeScreen />
          <StatusBar style="auto" />
          <Toast />
        </View>
      </GeminiProvider>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});
