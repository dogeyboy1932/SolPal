import './polyfill';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './src/contexts/WalletContext';
import { GeminiProvider } from './src/ai/GeminiContext';
import { NodeProvider } from './src/contexts/NodeContext';
import { AIConnectionProvider } from './src/contexts/AIConnectionContext';
import { MainChatScreen } from './src/screens/MainChatScreen';
import { ManualOperationsScreen } from './src/screens/ManualOperationsScreen';

type TabType = 'chat' | 'manual';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <MainChatScreen />;
      case 'manual':
        return <ManualOperationsScreen />;
      default:
        return <MainChatScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NodeProvider>
          <GeminiProvider>
            <AIConnectionProvider>
              <View style={styles.container}>
              {/* Main Content */}
              <View style={styles.content}>
                {renderActiveScreen()}
              </View>

              {/* Custom Tab Bar */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'chat' && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab('chat')}
                >
                  <Text style={styles.tabIcon}>💬</Text>
                  <Text style={[
                    styles.tabLabel,
                    activeTab === 'chat' && styles.tabLabelActive
                  ]}>
                    AI Chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'manual' && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab('manual')}
                >
                  <Text style={styles.tabIcon}>⚙️</Text>
                  <Text style={[
                    styles.tabLabel,
                    activeTab === 'manual' && styles.tabLabelActive
                  ]}>
                    Manual Operations
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <StatusBar style="auto" />
            <Toast />
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
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f0f8ff',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#007AFF',
  },
});
